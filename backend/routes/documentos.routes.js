import { Router } from 'express';
import fs from 'fs';
import { resolve } from 'path';
import crypto from 'crypto';
import { dbGet } from '../database/db.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { tenantRequired } from '../middlewares/tenant.middleware.js';
import { asyncHandler, parseTenantId } from '../utils/helpers.js';
import { ENABLE_PDF } from '../config/env.js';
import { GENERATED_DIR } from '../config/paths.js';
import { generationProgress, processGeneration } from '../services/document.service.js';
import { documentLimiter } from '../middlewares/ratelimit.middleware.js';

const router = Router();

router.post('/gerar-documentos', documentLimiter, authenticateToken, tenantRequired(), asyncHandler(async (req, res) => {
  const clienteIds = Array.isArray(req.body?.clienteIds) ? req.body.clienteIds.map((v) => Number(v)).filter((v) => Number.isInteger(v)) : [];
  const templateIds = Array.isArray(req.body?.templateIds) ? req.body.templateIds.map((v) => Number(v)).filter((v) => Number.isInteger(v)) : [];
  const outputFormat = String(req.body?.outputFormat || 'both').toLowerCase();
  
  if (clienteIds.length === 0 || templateIds.length === 0) {
    return res.status(400).json({ error: 'Selecione clientes e templates' });
  }
  if (!['docx', 'pdf', 'both'].includes(outputFormat)) {
    return res.status(400).json({ error: 'Formato de saida invalido. Use docx, pdf ou both.' });
  }
  if (outputFormat !== 'docx' && !ENABLE_PDF) {
    return res.status(400).json({ error: 'Geracao em PDF esta desativada no servidor.' });
  }

  const generationId = crypto.randomUUID();
  generationProgress.set(generationId, {
    id: generationId,
    ownerId: req.user.id,
    empresaId: req.tenantId,
    status: 'running',
    total: clienteIds.length * templateIds.length,
    completed: 0,
    documentos: [],
    erros: [],
    startedAt: Date.now(),
    finishedAt: null,
  });

  res.json({
    generationId,
    total: clienteIds.length * templateIds.length,
    message: 'Geracao iniciada',
    outputFormat,
  });

  processGeneration({
    generationId,
    tenantId: req.tenantId,
    userId: req.user.id,
    clienteIds,
    templateIds,
    outputFormat,
  }).catch((error) => {
    const progress = generationProgress.get(generationId);
    if (progress) {
      progress.status = 'failed';
      progress.erros.push({ error: error.message || 'Erro inesperado na geracao' });
      progress.finishedAt = Date.now();
    }
  });
}));

router.get('/gerar-documentos/progresso/:generationId', authenticateToken, asyncHandler(async (req, res) => {
  const generation = generationProgress.get(req.params.generationId);
  if (!generation) {
    return res.status(404).json({ error: 'Geração não encontrada' });
  }

  if (generation.ownerId !== req.user.id && req.user.role !== 'master') {
    return res.status(403).json({ error: 'Sem permissão para acessar esta geração' });
  }

  return res.json(generation);
}));

router.get('/download/:id', authenticateToken, tenantRequired(), asyncHandler(async (req, res) => {
  const id = parseTenantId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Documento inválido' });
  }

  const doc = await dbGet('SELECT * FROM documentos_gerados WHERE id = ? AND empresa_id = ?', [id, req.tenantId]);
  if (!doc) {
    return res.status(404).json({ error: 'Documento não encontrado' });
  }

  const format = String(req.query?.format || 'docx').toLowerCase() === 'pdf' ? 'pdf' : 'docx';
  const fileName = format === 'pdf' ? doc.arquivo_pdf : doc.arquivo_docx;

  if (!fileName) {
    return res.status(404).json({ error: `Arquivo ${format.toUpperCase()} não disponível` });
  }

  const filePath = resolve(GENERATED_DIR, fileName);
  if (!filePath.startsWith(resolve(GENERATED_DIR))) {
    return res.status(400).json({ error: 'Caminho de arquivo inválido' });
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Arquivo físico não encontrado' });
  }

  return res.download(filePath, fileName);
}));

export default router;
