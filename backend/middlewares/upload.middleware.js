import multer from 'multer';
import { extname } from 'path';
import { TEMPLATES_DIR, TEMP_DIR } from '../config/paths.js';

const templateStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, TEMPLATES_DIR),
  filename: (_req, file, cb) => {
    const safeOriginal = file.originalname
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '_');

    cb(null, `${Date.now()}-${safeOriginal}`);
  },
});

const csvStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, TEMP_DIR),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

export const templateUpload = multer({
  storage: templateStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (extname(file.originalname).toLowerCase() !== '.docx') {
      cb(new Error('Apenas arquivos .docx são permitidos'));
      return;
    }
    cb(null, true);
  },
});

export const csvUpload = multer({
  storage: csvStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase();
    if (ext !== '.csv') {
      cb(new Error('Apenas arquivos .csv são permitidos'));
      return;
    }
    cb(null, true);
  },
});
