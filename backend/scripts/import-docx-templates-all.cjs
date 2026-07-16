const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const ROOT_DIR = path.resolve(__dirname, '..');
const DB_PATH = path.join(ROOT_DIR, 'data', 'database.db');
const UPLOADS_TEMPLATES_DIR = path.join(ROOT_DIR, 'uploads', 'templates');
const SOURCE_ROOT = path.resolve('C:/Users/vitor/OneDrive/Documentos/ROBO/ROBO');

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '')
    .toLowerCase();
}

function toFileSafeName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
}

function all(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}

function get(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });
}

function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) return reject(err);
      return resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function walkDocxFiles(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkDocxFiles(fullPath));
      continue;
    }
    if (entry.isFile() && entry.name.toLowerCase().endsWith('.docx')) {
      files.push(fullPath);
    }
  }

  return files;
}

function pickFileByNormalizedName(allFiles, requestedFileName) {
  const requested = normalizeText(requestedFileName);
  const exact = allFiles.find((f) => normalizeText(path.basename(f)) === requested);
  if (exact) return exact;
  const partial = allFiles.find((f) => normalizeText(path.basename(f)).includes(requested));
  return partial || null;
}

const templateDefinitions = [
  {
    nome: 'Procuracao de Audiencia',
    fileName: 'PROCURAÇÃO AUDIÊNCIA.docx',
    campos: ['NOME', 'nacionalidade', 'estado_civil', 'profissao', 'RG', 'CPF', 'endereco', 'CEP', 'ESTADO', 'DATA_HOJE_EXTENSO'],
  },
  {
    nome: 'Procuracao Judicial',
    fileName: 'PROCURACAO ATUAL - DRA.KELLY.docx',
    campos: ['NOME', 'nacionalidade', 'estado_civil', 'profissao', 'RG', 'CPF', 'endereco', 'email', 'CEP', 'numero_contrato', 'NOME_DA_FINANCEIRA', 'ESTADO', 'DATA_HOJE_EXTENSO'],
  },
  {
    nome: 'Declaracao de Hipossuficiencia',
    fileName: '2-DECLARACAO DE HIPOSSUFICIENCIA.docx',
    campos: ['NOME', 'email', 'nacionalidade', 'estado_civil', 'profissao', 'RG', 'CPF', 'endereco', 'CEP', 'ESTADO', 'DATA_HOJE_EXTENSO'],
  },
  {
    nome: 'Declaracao de Isencao de IR',
    fileName: '8 - DECLARACAO DE INSENCAO E IR.docx',
    campos: ['NOME', 'nacionalidade', 'estado_civil', 'profissao', 'RG', 'CPF', 'endereco', 'CEP', 'ESTADO', 'DATA_HOJE_EXTENSO'],
  },
  {
    nome: 'Declaracao de Renda',
    fileName: 'DECLARACAO DE RENDA.docx',
    campos: ['NOME', 'RG', 'CPF', 'endereco', 'CEP', 'ESTADO', 'DATA_HOJE_EXTENSO'],
  },
  {
    nome: 'Protocolo de Formalizacao',
    fileName: 'Protocolo De Formalizacao (BANCO) - (NOME DO CLIENTE).docx',
    campos: ['PROTOCOLO_GOV', 'DATA_HOJE_EXTENSO', 'NOME', 'CPF', 'endereco', 'CEP', 'TELEFONE', 'email', 'NOME_DA_FINANCEIRA', 'CNPJ_FINANCEIRA', 'ENDERECO_FINANCEIRA', 'DILI_CALC1', 'DILI_CALC2'],
  },
  {
    nome: 'Declaracao de Residencia',
    fileName: 'DECLARACAO DE RESIDENCIA.docx',
    campos: ['NOME', 'nacionalidade', 'RG', 'CPF', 'endereco', 'CEP', 'ESTADO', 'DATA_HOJE_EXTENSO'],
  },
  {
    nome: 'Procuracao de Busca e Apreensao',
    fileName: '1- PROCURACAO DRA. KELLY (BUSCA E APREENSAO) -.docx',
    campos: ['NOME', 'nacionalidade', 'estado_civil', 'profissao', 'RG', 'CPF', 'endereco', 'email', 'CEP', 'PROCESSO', 'ESTADO', 'DATA_HOJE_EXTENSO'],
  },
];

async function main() {
  if (!fs.existsSync(DB_PATH)) {
    throw new Error(`Banco nao encontrado: ${DB_PATH}`);
  }
  if (!fs.existsSync(SOURCE_ROOT)) {
    throw new Error(`Pasta de origem nao encontrada: ${SOURCE_ROOT}`);
  }

  fs.mkdirSync(UPLOADS_TEMPLATES_DIR, { recursive: true });

  const allDocxFiles = walkDocxFiles(SOURCE_ROOT);
  const mappedTemplates = templateDefinitions.map((definition) => {
    const sourceFile = pickFileByNormalizedName(allDocxFiles, definition.fileName);
    if (!sourceFile) {
      throw new Error(`Arquivo de template nao encontrado para: ${definition.fileName}`);
    }
    return { ...definition, sourceFile };
  });

  const db = new sqlite3.Database(DB_PATH);

  try {
    const empresas = await all(db, 'SELECT id, nome, slug FROM empresas WHERE ativo = 1 ORDER BY nome');
    if (!empresas.length) {
      throw new Error('Nenhuma empresa ativa encontrada');
    }

    await run(db, 'BEGIN IMMEDIATE TRANSACTION');

    const resumo = [];

    for (const empresa of empresas) {
      for (const template of mappedTemplates) {
        const now = Date.now();
        const targetFileName = `${now}-${toFileSafeName(empresa.slug || empresa.nome)}-${toFileSafeName(template.nome)}.docx`;
        const targetPath = path.join(UPLOADS_TEMPLATES_DIR, targetFileName);
        fs.copyFileSync(template.sourceFile, targetPath);

        const existing = await get(
          db,
          'SELECT id FROM templates WHERE empresa_id = ? AND lower(nome) = lower(?) LIMIT 1',
          [empresa.id, template.nome],
        );

        if (existing) {
          await run(
            db,
            'UPDATE templates SET arquivo = ?, campos = ? WHERE id = ?',
            [targetFileName, JSON.stringify(template.campos), existing.id],
          );
          resumo.push({
            empresa: empresa.nome,
            template: template.nome,
            acao: 'atualizado',
            id: existing.id,
            arquivo: targetFileName,
          });
        } else {
          const insert = await run(
            db,
            'INSERT INTO templates (empresa_id, nome, arquivo, campos) VALUES (?, ?, ?, ?)',
            [empresa.id, template.nome, targetFileName, JSON.stringify(template.campos)],
          );
          resumo.push({
            empresa: empresa.nome,
            template: template.nome,
            acao: 'criado',
            id: insert.lastID,
            arquivo: targetFileName,
          });
        }
      }
    }

    await run(db, 'COMMIT');
    console.log(JSON.stringify({ sucesso: true, total: resumo.length, resumo }, null, 2));
  } catch (error) {
    await run(db, 'ROLLBACK').catch(() => null);
    throw error;
  } finally {
    db.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
