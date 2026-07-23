import sqlite3 from 'sqlite3';
import fs from 'fs';
import { join } from 'path';
import bcrypt from 'bcryptjs';
import { DB_PATH, ROOT_DIR } from '../config/paths.js';

export function bootstrapDatabaseFile() {
  if (fs.existsSync(DB_PATH)) return;

  const candidates = [
    join(ROOT_DIR, 'database.db'),
    join(ROOT_DIR, 'backend', 'database.db'),
  ];

  const source = candidates.find((candidate) => fs.existsSync(candidate));
  if (source) {
    fs.copyFileSync(source, DB_PATH);
    console.log(`[INFO] Banco inicial copiado de: ${source}`);
    return;
  }

  console.log('[INFO] Banco novo sera criado automaticamente');
}

// Call it before initializing DB
bootstrapDatabaseFile();

export const db = new sqlite3.Database(DB_PATH);
db.run('PRAGMA foreign_keys = ON');
db.run('PRAGMA journal_mode = WAL');

export function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

export function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
}

export function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

async function ensureColumn(table, column, definition) {
  const columns = await dbAll(`PRAGMA table_info(${table})`);
  const exists = columns.some((col) => col.name === column);
  if (!exists) {
    await dbRun(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
  }
}

function slugify(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export async function ensureSchema() {
  await dbRun(`CREATE TABLE IF NOT EXISTS empresas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL UNIQUE,
    slug TEXT UNIQUE,
    config TEXT DEFAULT '{}',
    ativo INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await dbRun(`CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa_id INTEGER,
    email TEXT NOT NULL UNIQUE,
    senha TEXT NOT NULL,
    nome TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    ativo INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(empresa_id) REFERENCES empresas(id)
  )`);

  await dbRun(`CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa_id INTEGER NOT NULL,
    dados TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(empresa_id) REFERENCES empresas(id)
  )`);

  await dbRun(`CREATE TABLE IF NOT EXISTS templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa_id INTEGER NOT NULL,
    nome TEXT NOT NULL,
    arquivo TEXT NOT NULL,
    campos TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(empresa_id) REFERENCES empresas(id)
  )`);

  await dbRun(`CREATE TABLE IF NOT EXISTS documentos_gerados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa_id INTEGER NOT NULL,
    cliente_id INTEGER,
    template_id INTEGER,
    nome_arquivo TEXT NOT NULL,
    arquivo_docx TEXT NOT NULL,
    arquivo_pdf TEXT,
    campos_usados TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(empresa_id) REFERENCES empresas(id),
    FOREIGN KEY(cliente_id) REFERENCES clientes(id),
    FOREIGN KEY(template_id) REFERENCES templates(id),
    FOREIGN KEY(created_by) REFERENCES usuarios(id)
  )`);

  await dbRun(`CREATE TABLE IF NOT EXISTS auditoria (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa_id INTEGER,
    usuario_id INTEGER,
    acao TEXT NOT NULL,
    detalhe TEXT,
    ip TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(empresa_id) REFERENCES empresas(id),
    FOREIGN KEY(usuario_id) REFERENCES usuarios(id)
  )`);

  await dbRun('CREATE INDEX IF NOT EXISTS idx_clientes_empresa ON clientes (empresa_id)');
  await dbRun('CREATE INDEX IF NOT EXISTS idx_templates_empresa ON templates (empresa_id)');
  await dbRun('CREATE INDEX IF NOT EXISTS idx_usuarios_empresa ON usuarios (empresa_id)');
  await dbRun('CREATE INDEX IF NOT EXISTS idx_doc_gerados_empresa ON documentos_gerados (empresa_id)');
  await dbRun('CREATE INDEX IF NOT EXISTS idx_auditoria_empresa ON auditoria (empresa_id)');
  await dbRun('CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON auditoria (usuario_id)');

  await ensureColumn('empresas', 'slug', 'slug TEXT');
  await ensureColumn('empresas', 'config', "config TEXT DEFAULT '{}'");
  await ensureColumn('empresas', 'ativo', 'ativo INTEGER DEFAULT 1');
  await ensureColumn('usuarios', 'ativo', 'ativo INTEGER DEFAULT 1');
  await ensureColumn('documentos_gerados', 'campos_usados', 'campos_usados TEXT');

  const empresasSemSlug = await dbAll('SELECT id, nome FROM empresas WHERE slug IS NULL OR slug = ""');
  for (const empresa of empresasSemSlug) {
    const base = slugify(empresa.nome || `empresa-${empresa.id}`);
    let slug = base || `empresa-${empresa.id}`;
    let suffix = 2;
    while (await dbGet('SELECT id FROM empresas WHERE slug = ? AND id != ?', [slug, empresa.id])) {
      slug = `${base}-${suffix}`;
      suffix += 1;
    }
    await dbRun('UPDATE empresas SET slug = ? WHERE id = ?', [slug, empresa.id]);
  }

  await dbRun('UPDATE empresas SET ativo = 1 WHERE ativo IS NULL');
  await dbRun('UPDATE usuarios SET ativo = 1 WHERE ativo IS NULL');

  const hasMaster = await dbGet("SELECT id FROM usuarios WHERE role = 'master' LIMIT 1");
  if (!hasMaster) {
    const defaultPassword = process.env.MASTER_BOOTSTRAP_PASSWORD || 'admin123456';
    const hash = bcrypt.hashSync(defaultPassword, 10);
    await dbRun(
      "INSERT INTO usuarios (empresa_id, email, senha, nome, role, ativo) VALUES (NULL, ?, ?, 'Administrador Master', 'master', 1)",
      ['admin@admin.com', hash],
    );
    console.log('[OK] Usuario master bootstrap criado: admin@admin.com');
    console.log(`[INFO] Senha inicial: ${defaultPassword}`);
    console.log('[AVISO] Altere essa senha imediatamente.');
  }
}
