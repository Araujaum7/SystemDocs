import { Router } from 'express';
import fs from 'fs';
import { resolve } from 'path';
import { dbGet, dbAll, dbRun } from '../database/db.js';
import { authenticateToken, requireMaster, requireMasterOrAdmin } from '../middlewares/auth.middleware.js';
import { tenantRequired } from '../middlewares/tenant.middleware.js';
import { templateUpload } from '../middlewares/upload.middleware.js';
import { asyncHandler, parseTenantId, safeJsonParse, formatDocxTemplateError } from '../utils/helpers.js';
import { GENERATED_DIR } from '../config/paths.js';
import { validateTemplateStructure, resolveTemplateFilePath } from '../services/document.service.js';

const router = Router();

router.get('/', authenticateToken, tenantRequired({ allowBodyOrQueryForMaster: true }), asyncHandler(async (req, res) => {
  const rows = await dbAll(
    `SELECT t.*, e.nome as empresa_nome
     FROM templates t
     JOIN empresas e ON e.id = t.empresa_id
     WHERE t.empresa_id = ?
     ORDER BY t.nome`,
    [req.tenantId],
  );

  return res.json(rows.map((row) => ({
    ...row,
    campos: safeJsonParse(row.campos, []),
  })));
}));

router.post('/', authenticateToken, requireMasterOrAdmin, tenantRequired({ allowBodyOrQueryForMaster: true }), templateUpload.single('arquivo'), asyncHandler(async (req, res) => {
  const nome = String(req.body?.nome || '').trim();
  const camposRaw = req.body?.campos;

  if (!nome || !camposRaw || !req.file) {
    return res.status(400).json({ error: 'Nome, campos e arquivo são obrigatórios' });
  }

  const campos = safeJsonParse(camposRaw, null);
  if (!Array.isArray(campos) || campos.length === 0) {
    return res.status(400).json({ error: 'Campos inválidos' });
  }

  const sanitizedCampos = campos
    .map((campo) => String(campo || '').trim())
    .filter(Boolean);

  const uploadedTemplatePath = resolveTemplateFilePath(req.file.filename);
  try {
    await validateTemplateStructure(uploadedTemplatePath);
  } catch (templateError) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(400).json({ error: formatDocxTemplateError(templateError) });
  }

  const result = await dbRun(
    'INSERT INTO templates (empresa_id, nome, arquivo, campos) VALUES (?, ?, ?, ?)',
    [req.tenantId, nome, req.file.filename, JSON.stringify(sanitizedCampos)],
  );

  return res.status(201).json({
    id: result.lastID,
    empresa_id: req.tenantId,
    nome,
    arquivo: req.file.filename,
    campos: sanitizedCampos,
  });
}));

router.delete('/:id', authenticateToken, requireMasterOrAdmin, tenantRequired(), asyncHandler(async (req, res) => {
  const id = parseTenantId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Template invalido' });
  }

  const template = await dbGet('SELECT * FROM templates WHERE id = ? AND empresa_id = ?', [id, req.tenantId]);
  if (!template) {
    return res.status(404).json({ error: 'Template nao encontrado' });
  }

  const linkedDocs = await dbAll(
    'SELECT id, arquivo_docx, arquivo_pdf FROM documentos_gerados WHERE empresa_id = ? AND template_id = ?',
    [req.tenantId, id],
  );

  await dbRun('BEGIN IMMEDIATE TRANSACTION');
  try {
    await dbRun('DELETE FROM documentos_gerados WHERE empresa_id = ? AND template_id = ?', [req.tenantId, id]);
    await dbRun('DELETE FROM templates WHERE id = ? AND empresa_id = ?', [id, req.tenantId]);
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
    const stillUsedDoc = await dbGet(
      'SELECT id FROM documentos_gerados WHERE arquivo_docx = ? OR arquivo_pdf = ? LIMIT 1',
      [fileName, fileName],
    );
    if (stillUsedDoc) continue;

    const generatedPath = resolve(GENERATED_DIR, fileName);
    if (!generatedPath.startsWith(resolve(GENERATED_DIR))) continue;
    if (fs.existsSync(generatedPath)) {
      fs.unlinkSync(generatedPath);
    }
  }

  const stillUsedTemplateFile = await dbGet('SELECT id FROM templates WHERE arquivo = ? LIMIT 1', [template.arquivo]);
  if (!stillUsedTemplateFile) {
    const filePath = resolveTemplateFilePath(template.arquivo);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  return res.json({
    message: 'Template excluido com sucesso',
    documentosRemovidos: linkedDocs.length,
  });
}));

export default router;
