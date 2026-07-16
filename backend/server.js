import express from 'express';
import { join } from 'path';
import multer from 'multer';

import { PORT, ALLOW_NON_LAN, ALLOW_RADMIN_VPN, validateEnv } from './config/env.js';
import { DB_PATH, FRONTEND_DIR, ensureDirectories } from './config/paths.js';
import { ensureSchema } from './database/db.js';
import { cleanupOldProgress } from './services/document.service.js';
import { initCleanerJobs } from './services/cleaner.service.js';
import { firewallMiddleware } from './middlewares/firewall.middleware.js';
import { globalLimiter } from './middlewares/ratelimit.middleware.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import empresasRoutes from './routes/empresas.routes.js';
import usuariosRoutes from './routes/usuarios.routes.js';
import clientesRoutes from './routes/clientes.routes.js';
import templatesRoutes from './routes/templates.routes.js';
import documentosRoutes from './routes/documentos.routes.js';

// Initialization
validateEnv();
ensureDirectories();

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', false);

app.use(express.json({ limit: '2mb' }));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

// Firewall middleware
app.use(firewallMiddleware);

// Global Rate Limiter
app.use(globalLimiter);

// Serve static frontend
app.use(express.static(FRONTEND_DIR));

// Periodic cleanup of document generation progress
setInterval(cleanupOldProgress, 1000 * 60 * 5);

// Background Jobs
initCleanerJobs();

// API Health
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'DocumentosPro', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api', authRoutes);
app.use('/api/empresas', empresasRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/templates', templatesRoutes);
app.use('/api', documentosRoutes); // It defines /gerar-documentos, /gerar-documentos/progresso, /download

// Frontend Routes (Fallback)
app.get('/', (_req, res) => res.sendFile(join(FRONTEND_DIR, 'index.html')));
app.get('/dashboard', (_req, res) => res.sendFile(join(FRONTEND_DIR, 'dashboard.html')));
app.get('/clientes', (_req, res) => res.sendFile(join(FRONTEND_DIR, 'clientes.html')));
app.get('/documentos', (_req, res) => res.sendFile(join(FRONTEND_DIR, 'documentos.html')));
app.get('/templates', (_req, res) => res.sendFile(join(FRONTEND_DIR, 'templates.html')));
app.get('/empresas', (_req, res) => res.sendFile(join(FRONTEND_DIR, 'empresas.html')));
app.get('/usuarios', (_req, res) => res.sendFile(join(FRONTEND_DIR, 'usuarios.html')));

// Global Error Handler
app.use((error, req, res, _next) => {
  console.error('Erro interno:', error);

  if (error instanceof multer.MulterError) {
    return res.status(400).json({ error: `Erro de upload: ${error.message}` });
  }

  if (error.message?.includes('Apenas arquivos')) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(500).json({ error: 'Erro interno do servidor' });
});

ensureSchema()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[OK] Servidor rodando em http://localhost:${PORT}`);
      console.log(`[INFO] Banco ativo: ${DB_PATH}`);
      console.log(`[INFO] Modo LAN: ${ALLOW_NON_LAN ? 'desativado' : 'ativo'}`);
      console.log(`[INFO] Acesso por Radmin VPN (26.x.x.x): ${ALLOW_RADMIN_VPN ? 'ativo' : 'desativado'}`);
    });
  })
  .catch((error) => {
    console.error('Falha ao iniciar sistema:', error);
    process.exit(1);
  });
