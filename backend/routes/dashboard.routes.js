import { Router } from 'express';
import { dbAll, dbGet } from '../database/db.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { tenantRequired } from '../middlewares/tenant.middleware.js';
import { asyncHandler } from '../utils/helpers.js';

const router = Router();

router.get('/stats', authenticateToken, tenantRequired(), asyncHandler(async (req, res) => {
  const empresaId = req.tenantId;

  // KPIs
  const totalClientes = await dbGet('SELECT COUNT(*) as count FROM clientes WHERE empresa_id = ?', [empresaId]);
  const totalDocumentos = await dbGet('SELECT COUNT(*) as count FROM documentos_gerados WHERE empresa_id = ?', [empresaId]);
  
  // Gráfico de Documentos Gerados (Últimos 7 dias)
  const docsPorDia = await dbAll(`
    SELECT date(created_at) as data, COUNT(*) as quantidade
    FROM documentos_gerados 
    WHERE empresa_id = ? AND created_at >= date('now', '-7 days')
    GROUP BY date(created_at)
    ORDER BY date(created_at) ASC
  `, [empresaId]);

  // Gráfico de Templates Mais Usados (Top 5)
  const topTemplates = await dbAll(`
    SELECT t.nome, COUNT(d.id) as quantidade
    FROM documentos_gerados d
    JOIN templates t ON t.id = d.template_id
    WHERE d.empresa_id = ?
    GROUP BY d.template_id
    ORDER BY quantidade DESC
    LIMIT 5
  `, [empresaId]);

  res.json({
    kpis: {
      clientes: totalClientes.count,
      documentos: totalDocumentos.count
    },
    graficos: {
      docsPorDia,
      topTemplates
    }
  });
}));

export default router;
