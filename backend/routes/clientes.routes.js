import { Router } from 'express';
import fs from 'fs';
import { resolve } from 'path';
import { dbGet, dbAll, dbRun } from '../database/db.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { tenantRequired } from '../middlewares/tenant.middleware.js';
import { csvUpload } from '../middlewares/upload.middleware.js';
import { asyncHandler, parseTenantId, safeJsonParse, parseCsvLine } from '../utils/helpers.js';
import { GENERATED_DIR } from '../config/paths.js';

const router = Router();

router.get('/', authenticateToken, tenantRequired(), asyncHandler(async (req, res) => {
  const search = String(req.query?.search || '').trim();

  let sql = 'SELECT * FROM clientes WHERE empresa_id = ?';
  const params = [req.tenantId];

  if (search) {
    sql += ' AND dados LIKE ?';
    params.push(`%${search}%`);
  }

  sql += ' ORDER BY created_at DESC';

  const rows = await dbAll(sql, params);
  const clientes = rows.map((row) => ({ ...row, dados: safeJsonParse(row.dados, {}) }));
  return res.json(clientes);
}));

router.get('/:id', authenticateToken, tenantRequired(), asyncHandler(async (req, res) => {
  const id = parseTenantId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Cliente inválido' });
  }

  const row = await dbGet('SELECT * FROM clientes WHERE id = ? AND empresa_id = ?', [id, req.tenantId]);
  if (!row) {
    return res.status(404).json({ error: 'Cliente não encontrado' });
  }

  return res.json({ ...row, dados: safeJsonParse(row.dados, {}) });
}));

router.post('/', authenticateToken, tenantRequired(), asyncHandler(async (req, res) => {
  const dadosCliente = req.body || {};
  if (!String(dadosCliente.nome || '').trim()) {
    return res.status(400).json({ error: 'Nome é obrigatório' });
  }

  const dados = JSON.stringify(dadosCliente);
  const result = await dbRun('INSERT INTO clientes (empresa_id, dados) VALUES (?, ?)', [req.tenantId, dados]);

  return res.status(201).json({
    id: result.lastID,
    empresa_id: req.tenantId,
    dados: dadosCliente,
  });
}));

router.put('/:id', authenticateToken, tenantRequired(), asyncHandler(async (req, res) => {
  const id = parseTenantId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Cliente inválido' });
  }

  const dadosCliente = req.body || {};
  if (!String(dadosCliente.nome || '').trim()) {
    return res.status(400).json({ error: 'Nome é obrigatório' });
  }

  const result = await dbRun(
    'UPDATE clientes SET dados = ? WHERE id = ? AND empresa_id = ?',
    [JSON.stringify(dadosCliente), id, req.tenantId],
  );

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Cliente não encontrado' });
  }

  return res.json({ id, empresa_id: req.tenantId, dados: dadosCliente });
}));

router.delete('/:id', authenticateToken, tenantRequired(), asyncHandler(async (req, res) => {
  const id = parseTenantId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Cliente invalido' });
  }

  const cliente = await dbGet('SELECT id FROM clientes WHERE id = ? AND empresa_id = ?', [id, req.tenantId]);
  if (!cliente) {
    return res.status(404).json({ error: 'Cliente nao encontrado' });
  }

  const linkedDocs = await dbAll(
    'SELECT id, arquivo_docx, arquivo_pdf FROM documentos_gerados WHERE empresa_id = ? AND cliente_id = ?',
    [req.tenantId, id],
  );

  await dbRun('BEGIN IMMEDIATE TRANSACTION');
  try {
    await dbRun('DELETE FROM documentos_gerados WHERE empresa_id = ? AND cliente_id = ?', [req.tenantId, id]);
    await dbRun('DELETE FROM clientes WHERE id = ? AND empresa_id = ?', [id, req.tenantId]);
    await dbRun('COMMIT');
  } catch (error) {
    await dbRun('ROLLBACK').catch(() => null);
    throw error;
  }

  const filesToCheck = new Set();
  linkedDocs.forEach((doc) => {
    if (doc?.arquivo_docx) filesToCheck.add(doc.arquivo_docx);
    if (doc?.arquivo_pdf) filesToCheck.add(doc.arquivo_pdf);
  });

  for (const fileName of filesToCheck) {
    const stillUsed = await dbGet(
      'SELECT id FROM documentos_gerados WHERE arquivo_docx = ? OR arquivo_pdf = ? LIMIT 1',
      [fileName, fileName],
    );
    if (stillUsed) continue;

    const filePath = resolve(GENERATED_DIR, fileName);
    if (!filePath.startsWith(resolve(GENERATED_DIR))) continue;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  return res.json({
    message: 'Cliente excluido com sucesso',
    documentosRemovidos: linkedDocs.length,
  });
}));

router.post('/:id/duplicate', authenticateToken, tenantRequired(), asyncHandler(async (req, res) => {
  const id = parseTenantId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Cliente inválido' });
  }

  const cliente = await dbGet('SELECT * FROM clientes WHERE id = ? AND empresa_id = ?', [id, req.tenantId]);
  if (!cliente) {
    return res.status(404).json({ error: 'Cliente não encontrado' });
  }

  const dados = safeJsonParse(cliente.dados, {});
  dados.nome = `${dados.nome || 'Cliente'} (Cópia)`;

  const result = await dbRun('INSERT INTO clientes (empresa_id, dados) VALUES (?, ?)', [req.tenantId, JSON.stringify(dados)]);

  return res.status(201).json({
    id: result.lastID,
    empresa_id: req.tenantId,
    dados,
  });
}));

router.post('/importar', authenticateToken, tenantRequired(), csvUpload.single('arquivo'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Arquivo CSV é obrigatório' });
  }

  const filePath = req.file.path;
  const imported = [];
  const errors = [];

  try {
    const csv = fs.readFileSync(filePath, 'utf-8');
    const lines = csv
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      return res.status(400).json({ error: 'CSV deve conter cabeçalho e ao menos uma linha de dados' });
    }

    const headers = parseCsvLine(lines[0]).map((h) => h.replace(/^"|"$/g, '').trim());
    if (!headers.includes('nome')) {
      return res.status(400).json({ error: 'CSV precisa ter a coluna "nome"' });
    }

    await dbRun('BEGIN TRANSACTION');

    for (let i = 1; i < lines.length; i += 1) {
      const line = lines[i];
      if (!line) continue;

      const values = parseCsvLine(line);
      if (values.length !== headers.length) {
        errors.push({ linha: i + 1, error: 'Número de colunas diferente do cabeçalho' });
        continue;
      }

      const dados = {};
      headers.forEach((header, idx) => {
        dados[header] = String(values[idx] || '').trim();
      });

      if (!String(dados.nome || '').trim()) {
        errors.push({ linha: i + 1, error: 'Nome é obrigatório' });
        continue;
      }

      const result = await dbRun(
        'INSERT INTO clientes (empresa_id, dados) VALUES (?, ?)',
        [req.tenantId, JSON.stringify(dados)],
      );

      imported.push({ id: result.lastID, ...dados });
    }

    await dbRun('COMMIT');

    return res.json({
      success: true,
      importados: imported.length,
      erros: errors,
      message: `${imported.length} clientes importados com sucesso. ${errors.length} erro(s).`,
    });
  } catch (error) {
    await dbRun('ROLLBACK').catch(() => null);
    return res.status(500).json({ error: `Erro ao importar CSV: ${error.message}` });
  } finally {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}));

export default router;
