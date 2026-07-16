import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido ou expirado' });
    }

    req.user = payload;
    return next();
  });
}

export function requireMaster(req, res, next) {
  if (req.user.role !== 'master') {
    return res.status(403).json({ error: 'Acesso permitido apenas para master' });
  }
  return next();
}

export function requireMasterOrAdmin(req, res, next) {
  if (req.user.role === 'master' || req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ error: 'Acesso permitido apenas para administradores ou master' });
}
