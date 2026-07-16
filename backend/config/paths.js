import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ROOT_DIR is the project root (where package.json is)
// This file is in backend/config, so root is two levels up
export const ROOT_DIR = join(__dirname, '..', '..');
export const BACKEND_DIR = join(ROOT_DIR, 'backend');
export const FRONTEND_DIR = join(ROOT_DIR, 'frontend');

export const DATA_DIR = join(BACKEND_DIR, 'data');
export const UPLOADS_DIR = join(BACKEND_DIR, 'uploads');
export const TEMPLATES_DIR = join(UPLOADS_DIR, 'templates');
export const GENERATED_DIR = join(UPLOADS_DIR, 'gerados');
export const TEMP_DIR = join(UPLOADS_DIR, 'temp');

export const DB_PATH = process.env.DATABASE_PATH
  ? resolve(process.env.DATABASE_PATH)
  : join(DATA_DIR, 'database.db');

export function ensureDirectories() {
  [DATA_DIR, UPLOADS_DIR, TEMPLATES_DIR, GENERATED_DIR, TEMP_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });
}
