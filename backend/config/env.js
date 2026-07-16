export const PORT = Number(process.env.PORT || 7000);
export const DEFAULT_LOCAL_JWT_SECRET = 'dev_local_secret_change_me_1234567890_abcd';
export const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_LOCAL_JWT_SECRET;
export const ENABLE_PDF = String(process.env.ENABLE_PDF || 'true').toLowerCase() !== 'false';
export const ALLOW_NON_LAN = String(process.env.ALLOW_NON_LAN || 'false').toLowerCase() === 'true';
export const ALLOW_RADMIN_VPN = String(process.env.ALLOW_RADMIN_VPN || 'true').toLowerCase() === 'true';
export const DOCXTEMPLATER_OPTIONS = {
  paragraphLoop: true,
  linebreaks: true,
  delimiters: { start: '{{', end: '}}' },
};

export function validateEnv() {
  if (JWT_SECRET.length < 32) {
    console.error('[ERRO] JWT_SECRET ausente ou fraco. Defina pelo menos 32 caracteres.');
    console.error('Exemplo: set JWT_SECRET=uma_chave_super_longa_e_segura_com_32_chars');
    process.exit(1);
  }

  if (JWT_SECRET === DEFAULT_LOCAL_JWT_SECRET) {
    console.warn('[AVISO] JWT_SECRET de desenvolvimento em uso. Defina JWT_SECRET para producao.');
  }
}
