import { ALLOW_NON_LAN, ALLOW_RADMIN_VPN } from '../config/env.js';

function normalizeIp(ip) {
  if (!ip) return '';
  if (ip === '::1') return '127.0.0.1';
  if (ip.startsWith('::ffff:')) return ip.replace('::ffff:', '');
  return ip;
}

function isLanIp(ip) {
  const normalized = normalizeIp(ip);
  if (!normalized) return false;
  if (normalized === '127.0.0.1') return true;
  if (normalized.startsWith('10.')) return true;
  if (normalized.startsWith('192.168.')) return true;
  if (normalized.startsWith('169.254.')) return true;

  if (normalized.startsWith('172.')) {
    const second = Number(normalized.split('.')[1]);
    return second >= 16 && second <= 31;
  }

  return false;
}

function isRadminVpnIp(ip) {
  const normalized = normalizeIp(ip);
  if (!normalized) return false;
  return normalized.startsWith('26.');
}

export function firewallMiddleware(req, res, next) {
  if (ALLOW_NON_LAN) return next();

  const ip = normalizeIp(req.ip);
  const allowedByLan = isLanIp(ip);
  const allowedByRadmin = ALLOW_RADMIN_VPN && isRadminVpnIp(ip);

  if (!allowedByLan && !allowedByRadmin) {
    return res.status(403).json({ error: 'Acesso permitido apenas na rede local (LAN) ou VPN autorizada.' });
  }

  next();
}
