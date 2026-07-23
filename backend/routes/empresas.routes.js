import { Router } from 'express';
import { dbGet, dbAll, dbRun } from '../database/db.js';
import { authenticateToken, requireMaster } from '../middlewares/auth.middleware.js';
import { asyncHandler, parseTenantId } from '../utils/helpers.js';
import { ensureTenantExists } from '../middlewares/tenant.middleware.js';

const router = Router();

function slugify(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

router.get('/', authenticateToken, requireMaster, asyncHandler(async (_req, res) => {
  const empresas = await dbAll(`
    SELECT
      e.*,
      (SELECT COUNT(1) FROM usuarios u WHERE u.empresa_id = e.id AND u.role != 'master') as total_usuarios,
      (SELECT COUNT(1) FROM clientes c WHERE c.empresa_id = e.id) as total_clientes,
      (SELECT COUNT(1) FROM templates t WHERE t.empresa_id = e.id) as total_templates
    FROM empresas e
    WHERE e.ativo = 1
    ORDER BY e.nome
  `);

  return res.json(empresas);
}));

router.post('/', authenticateToken, requireMaster, asyncHandler(async (req, res) => {
  const nome = String(req.body?.nome || '').trim();
  const config = typeof req.body?.config === 'object' ? JSON.stringify(req.body.config) : '{}';

  if (!nome) {
    return res.status(400).json({ error: 'Nome da empresa é obrigatório' });
  }

  const baseSlug = slugify(nome);
  if (!baseSlug) {
    return res.status(400).json({ error: 'Nome da empresa inválido' });
  }

  let slug = baseSlug;
  let suffix = 2;
  while (await dbGet('SELECT id FROM empresas WHERE slug = ?', [slug])) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  const result = await dbRun(
    'INSERT INTO empresas (nome, slug, config, ativo) VALUES (?, ?, ?, 1)',
    [nome, slug, config],
  );

  return res.status(201).json({ id: result.lastID, nome, slug, config });
}));

router.put('/:id', authenticateToken, requireMaster, asyncHandler(async (req, res) => {
  const id = parseTenantId(req.params.id);
  const nome = String(req.body?.nome || '').trim();
  const config = typeof req.body?.config === 'object' ? JSON.stringify(req.body.config) : (req.body.config || '{}');

  if (!id || !nome) {
    return res.status(400).json({ error: 'Empresa inválida' });
  }

  const result = await dbRun('UPDATE empresas SET nome = ?, config = ? WHERE id = ?', [nome, config, id]);
  
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Empresa não encontrada' });
  }

  return res.json({ id, nome, config });
}));

router.delete('/:id', authenticateToken, requireMaster, asyncHandler(async (req, res) => {
  const id = parseTenantId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Empresa inválida' });
  }

  const counts = await dbGet(`
    SELECT
      (SELECT COUNT(1) FROM usuarios WHERE empresa_id = ? AND role != 'master') as usuarios,
      (SELECT COUNT(1) FROM clientes WHERE empresa_id = ?) as clientes,
      (SELECT COUNT(1) FROM templates WHERE empresa_id = ?) as templates
  `, [id, id, id]);

  if ((counts?.usuarios || 0) > 0 || (counts?.clientes || 0) > 0 || (counts?.templates || 0) > 0) {
    return res.status(400).json({ error: 'Empresa possui dados vinculados. Exclua usuários/clientes/templates antes.' });
  }

  await dbRun('UPDATE empresas SET ativo = 0 WHERE id = ?', [id]);
  return res.json({ message: 'Empresa desativada com sucesso' });
}));

router.post('/:id/entrar', authenticateToken, requireMaster, asyncHandler(async (req, res) => {
  const id = parseTenantId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Empresa inválida' });
  }

  const empresa = await ensureTenantExists(id);
  if (!empresa) {
    return res.status(404).json({ error: 'Empresa não encontrada' });
  }

  return res.json({
    empresa,
    message: 'Contexto de empresa validado com sucesso.',
  });
}));

export default router;
