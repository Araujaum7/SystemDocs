import { dbGet } from '../database/db.js';
import { parseTenantId, extractMasterTenantId, asyncHandler } from '../utils/helpers.js';

export function resolveTenant(req, { required = false, allowBodyOrQueryForMaster = false } = {}) {
  if (req.user.role !== 'master') {
    return parseTenantId(req.user.empresa_id);
  }

  let tenantId = extractMasterTenantId(req);

  if (!tenantId && allowBodyOrQueryForMaster) {
    tenantId = parseTenantId(req.body?.empresa_id) || parseTenantId(req.query?.empresa_id);
  }

  if (!tenantId && required) {
    return null;
  }

  return tenantId;
}

export async function ensureTenantExists(tenantId) {
  if (!tenantId) return null;
  return dbGet('SELECT id, nome, slug FROM empresas WHERE id = ? AND ativo = 1', [tenantId]);
}

export function tenantRequired(options = {}) {
  return asyncHandler(async (req, res, next) => {
    const tenantId = resolveTenant(req, { required: true, ...options });
    if (!tenantId) {
      return res.status(400).json({ error: 'Selecione uma empresa antes de continuar.' });
    }

    const tenant = await ensureTenantExists(tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Empresa não encontrada ou inativa.' });
    }

    req.tenantId = tenantId;
    req.tenant = tenant;
    return next();
  });
}
