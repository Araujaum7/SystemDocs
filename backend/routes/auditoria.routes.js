import { Router } from 'express';
import { dbAll } from '../database/db.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { tenantRequired } from '../middlewares/tenant.middleware.js';
import { asyncHandler, safeJsonParse } from '../utils/helpers.js';

const router = Router();

router.get('/', authenticateToken, tenantRequired(), asyncHandler(async (req, res) => {
  // Apenas admins master ou gestores deveriam ver, mas por enquanto vamos restringir à empresa logada
  // Ou master vendo tudo.
  let sql = `
    SELECT a.*, u.nome as usuario_nome, e.nome as empresa_nome
    FROM auditoria a
    LEFT JOIN usuarios u ON u.id = a.usuario_id
    LEFT JOIN empresas e ON e.id = a.empresa_id
  `;
  const params = [];

  if (req.user.role !== 'master') {
    sql += ` WHERE a.empresa_id = ? `;
    params.push(req.tenantId);
  }

  sql += ` ORDER BY a.created_at DESC LIMIT 100`;

  const rows = await dbAll(sql, params);
  
  const logs = rows.map(row => ({
    ...row,
    detalhe: safeJsonParse(row.detalhe, row.detalhe)
  }));

  res.json(logs);
}));

export default router;
