import { dbRun } from '../database/db.js';

export const AcoesAuditoria = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  CLIENTE_CRIADO: 'CLIENTE_CRIADO',
  CLIENTE_EDITADO: 'CLIENTE_EDITADO',
  CLIENTE_EXCLUIDO: 'CLIENTE_EXCLUIDO',
  DOCUMENTO_GERADO: 'DOCUMENTO_GERADO',
  TEMPLATE_CRIADO: 'TEMPLATE_CRIADO',
  TEMPLATE_EXCLUIDO: 'TEMPLATE_EXCLUIDO',
  USUARIO_CRIADO: 'USUARIO_CRIADO',
  CONFIGURACAO_ALTERADA: 'CONFIGURACAO_ALTERADA'
};

export async function auditLog(empresaId, usuarioId, acao, detalhe = '', ip = null) {
  try {
    const detalheJson = typeof detalhe === 'object' ? JSON.stringify(detalhe) : detalhe;
    await dbRun(
      'INSERT INTO auditoria (empresa_id, usuario_id, acao, detalhe, ip) VALUES (?, ?, ?, ?, ?)',
      [empresaId, usuarioId, acao, detalheJson, ip]
    );
  } catch (error) {
    console.error('[AUDIT ERROR] Falha ao registrar auditoria:', error);
  }
}
