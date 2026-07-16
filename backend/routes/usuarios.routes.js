import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { dbGet, dbAll, dbRun } from '../database/db.js';
import { authenticateToken, requireMaster, requireMasterOrAdmin } from '../middlewares/auth.middleware.js';
import { tenantRequired } from '../middlewares/tenant.middleware.js';
import { asyncHandler, parseTenantId } from '../utils/helpers.js';

const router = Router();

router.get('/', authenticateToken, requireMasterOrAdmin, tenantRequired(), asyncHandler(async (req, res) => {
  const usuarios = await dbAll(
    `SELECT id, empresa_id, email, nome, role, ativo, created_at
     FROM usuarios
     WHERE empresa_id = ? AND role != 'master'
     ORDER BY nome`,
    [req.tenantId],
  );

  return res.json(usuarios);
}));

router.post('/', authenticateToken, requireMasterOrAdmin, tenantRequired({ allowBodyOrQueryForMaster: true }), asyncHandler(async (req, res) => {
  const nome = String(req.body?.nome || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const senha = String(req.body?.senha || '');

  if (!nome || !email || !senha) {
    return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
  }

  if (senha.length < 6) {
    return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
  }

  const exists = await dbGet('SELECT id FROM usuarios WHERE email = ?', [email]);
  if (exists) {
    return res.status(400).json({ error: 'Já existe usuário com este email' });
  }

  const roleBody = String(req.body?.role || '').trim();
  const role = roleBody === 'admin' ? 'admin' : 'user';

  const hash = bcrypt.hashSync(senha, 10);
  const result = await dbRun(
    "INSERT INTO usuarios (empresa_id, email, senha, nome, role, ativo) VALUES (?, ?, ?, ?, ?, 1)",
    [req.tenantId, email, hash, nome, role],
  );

  return res.status(201).json({
    id: result.lastID,
    empresa_id: req.tenantId,
    nome,
    email,
    role,
  });
}));

router.delete('/:id', authenticateToken, requireMasterOrAdmin, tenantRequired(), asyncHandler(async (req, res) => {
  const id = parseTenantId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Usuário inválido' });
  }

  const result = await dbRun(
    "DELETE FROM usuarios WHERE id = ? AND empresa_id = ? AND role != 'master'",
    [id, req.tenantId],
  );

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

  return res.json({ message: 'Usuário excluído com sucesso' });
}));

// Rota para alterar a senha de um usuário
router.put('/:id/senha', authenticateToken, requireMasterOrAdmin, tenantRequired(), asyncHandler(async (req, res) => {
  const id = parseTenantId(req.params.id);
  const novaSenha = String(req.body?.senha || '');

  if (!id) {
    return res.status(400).json({ error: 'Usuário inválido' });
  }

  if (novaSenha.length < 6) {
    return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres' });
  }

  // Verifica se o usuário pertence à empresa atual
  const exists = await dbGet('SELECT id FROM usuarios WHERE id = ? AND empresa_id = ? AND role != \'master\'', [id, req.tenantId]);
  
  if (!exists) {
    return res.status(404).json({ error: 'Usuário não encontrado ou sem permissão' });
  }

  const hash = bcrypt.hashSync(novaSenha, 10);
  
  await dbRun(
    "UPDATE usuarios SET senha = ? WHERE id = ?",
    [hash, id]
  );

  return res.json({ message: 'Senha redefinida com sucesso' });
}));

// Rota para alterar o cargo de um usuário
router.put('/:id/role', authenticateToken, requireMasterOrAdmin, tenantRequired(), asyncHandler(async (req, res) => {
  const id = parseTenantId(req.params.id);
  const roleBody = String(req.body?.role || '').trim();
  const role = roleBody === 'admin' ? 'admin' : 'user';

  if (!id) {
    return res.status(400).json({ error: 'Usuário inválido' });
  }

  const exists = await dbGet('SELECT id FROM usuarios WHERE id = ? AND empresa_id = ? AND role != \'master\'', [id, req.tenantId]);
  
  if (!exists) {
    return res.status(404).json({ error: 'Usuário não encontrado ou sem permissão' });
  }

  await dbRun(
    "UPDATE usuarios SET role = ? WHERE id = ?",
    [role, id]
  );

  return res.json({ message: 'Cargo atualizado com sucesso' });
}));

export default router;
