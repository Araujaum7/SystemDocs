import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbGet, dbAll } from '../database/db.js';
import { JWT_SECRET } from '../config/env.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { authLimiter } from '../middlewares/ratelimit.middleware.js';
import { asyncHandler } from '../utils/helpers.js';
import { auditLog, AcoesAuditoria } from '../utils/logger.js';

const router = Router();

function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      empresa_id: user.empresa_id,
      role: user.role,
      nome: user.nome,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: '12h' },
  );
}

router.post('/login', authLimiter, asyncHandler(async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const senha = String(req.body?.senha || '');

  if (!email || !senha) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  const usuario = await dbGet('SELECT * FROM usuarios WHERE email = ? AND ativo = 1', [email]);
  if (!usuario) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const ok = bcrypt.compareSync(senha, usuario.senha);
  if (!ok) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  if (usuario.role !== 'master' && !usuario.empresa_id) {
    return res.status(403).json({ error: 'Usuário sem empresa vinculada. Contate o administrador.' });
  }

  const token = createToken(usuario);

  let empresa = null;
  if (usuario.empresa_id) {
    empresa = await dbGet('SELECT id, nome, slug, config FROM empresas WHERE id = ?', [usuario.empresa_id]);
  }

  const empresas = usuario.role === 'master'
    ? await dbAll('SELECT id, nome, slug, config FROM empresas WHERE ativo = 1 ORDER BY nome')
    : [];

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  await auditLog(usuario.empresa_id, usuario.id, AcoesAuditoria.LOGIN, 'Login bem-sucedido', ip);

  return res.json({
    token,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role,
      empresa_id: usuario.empresa_id,
      empresa_nome: empresa?.nome || null,
      empresa_config: empresa?.config || null,
    },
    empresas,
  });
}));

router.get('/me', authenticateToken, asyncHandler(async (req, res) => {
  const user = await dbGet(
    `SELECT u.id, u.nome, u.email, u.role, u.empresa_id, e.nome as empresa_nome
     FROM usuarios u
     LEFT JOIN empresas e ON e.id = u.empresa_id
     WHERE u.id = ?`,
    [req.user.id],
  );

  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

  const empresas = user.role === 'master'
    ? await dbAll('SELECT id, nome, slug, config FROM empresas WHERE ativo = 1 ORDER BY nome')
    : [];

  return res.json({ usuario: user, empresas });
}));

export default router;
