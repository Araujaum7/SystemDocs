import cron from 'node-cron';
import fs from 'fs';
import { join, dirname } from 'path';
import { dbRun, dbGet } from '../database/db.js';
import { DB_PATH, GENERATED_DIR, TEMP_DIR } from '../config/paths.js';

// Tempo máximo de retenção de arquivos gerados: 30 dias
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export function initCleanerJobs() {
  // Roda todos os dias às 03:00 da manhã
  cron.schedule('0 3 * * *', async () => {
    console.log('[CRON] Iniciando limpeza de arquivos temporários e gerados...');
    try {
      await cleanDirectory(TEMP_DIR, 24 * 60 * 60 * 1000); // 24h temp
      await cleanGeneratedDocuments();
      console.log('[CRON] Limpeza concluída.');
    } catch (error) {
      console.error('[CRON] Erro durante a limpeza:', error);
    }
  });

  // Roda todos os dias às 02:00 da manhã
  cron.schedule('0 2 * * *', async () => {
    console.log('[CRON] Iniciando backup do banco de dados...');
    try {
      await backupDatabase();
      console.log('[CRON] Backup concluído.');
    } catch (error) {
      console.error('[CRON] Erro durante o backup:', error);
    }
  });
}

async function backupDatabase() {
  const backupDir = join(dirname(DB_PATH), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const dateStr = new Date().toISOString().split('T')[0];
  const backupPath = join(backupDir, `database_${dateStr}.db`);

  if (fs.existsSync(DB_PATH)) {
    fs.copyFileSync(DB_PATH, backupPath);
    console.log(`[CRON] Backup salvo: ${backupPath}`);
  }

  const MAX_BACKUP_AGE_DAYS = 7;
  const now = Date.now();
  const files = fs.readdirSync(backupDir);

  for (const file of files) {
    if (!file.endsWith('.db')) continue;
    const filePath = join(backupDir, file);
    const stats = fs.statSync(filePath);
    const ageInDays = (now - stats.mtimeMs) / (1000 * 60 * 60 * 24);

    if (ageInDays > MAX_BACKUP_AGE_DAYS) {
      fs.unlinkSync(filePath);
      console.log(`[CRON] Backup antigo removido: ${file}`);
    }
  }
}

async function cleanDirectory(dirPath, maxAge) {
  if (!fs.existsSync(dirPath)) return;

  const files = fs.readdirSync(dirPath);
  const now = Date.now();
  let deletedCount = 0;

  for (const file of files) {
    const fullPath = join(dirPath, file);
    const stats = fs.statSync(fullPath);

    if (stats.isFile() && now - stats.mtimeMs > maxAge) {
      try {
        fs.unlinkSync(fullPath);
        deletedCount++;
      } catch (err) {
        console.error(`[CRON] Erro ao deletar arquivo ${fullPath}:`, err.message);
      }
    }
  }

  if (deletedCount > 0) {
    console.log(`[CRON] ${deletedCount} arquivos deletados em ${dirPath}`);
  }
}

async function cleanGeneratedDocuments() {
  if (!fs.existsSync(GENERATED_DIR)) return;

  const files = fs.readdirSync(GENERATED_DIR);
  const now = Date.now();
  let deletedCount = 0;

  for (const file of files) {
    const fullPath = join(GENERATED_DIR, file);
    const stats = fs.statSync(fullPath);

    // Se o arquivo tiver mais que MAX_AGE_MS
    if (stats.isFile() && now - stats.mtimeMs > MAX_AGE_MS) {
      // Importante: NÃO vamos deletar do banco de dados (documentos_gerados)
      // para manter o "Histórico" (CRM) do cliente intacto. Quando o usuário tentar
      // baixar, a API retornará 404 (Arquivo Expirado).

      try {
        fs.unlinkSync(fullPath);
        deletedCount++;
      } catch (err) {
        console.error(`[CRON] Erro ao deletar arquivo gerado ${fullPath}:`, err.message);
      }
    }
  }

  if (deletedCount > 0) {
    console.log(`[CRON] ${deletedCount} documentos gerados antigos deletados de ${GENERATED_DIR}`);
  }
}
