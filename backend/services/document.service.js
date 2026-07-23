import fs from 'fs';
import { join, resolve } from 'path';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import crypto from 'crypto';
import { TEMPLATES_DIR, GENERATED_DIR, ROOT_DIR } from '../config/paths.js';
import { DOCXTEMPLATER_OPTIONS, ENABLE_PDF } from '../config/env.js';
import { dbGet, dbAll, dbRun } from '../database/db.js';
import { auditLog, AcoesAuditoria } from '../utils/logger.js';
import { fixDocxTemplate } from '../docx-preprocessor.js';
import { convertToPDF } from '../lib/convert-wrapper.js';
import { formatDocxTemplateError, safeJsonParse, sanitizeFileName } from '../utils/helpers.js';

export const generationProgress = new Map();

export function cleanupOldProgress() {
  const now = Date.now();
  for (const [id, data] of generationProgress.entries()) {
    if (data.finishedAt && now - data.finishedAt > 1000 * 60 * 30) {
      generationProgress.delete(id);
    }
  }
}

export function resolveTemplateFilePath(fileName) {
  const candidates = [
    join(TEMPLATES_DIR, fileName),
    join(ROOT_DIR, 'uploads', 'templates', fileName),
    join(ROOT_DIR, 'backend', 'uploads', 'templates', fileName),
  ];

  return candidates.find((candidate) => fs.existsSync(candidate)) || join(TEMPLATES_DIR, fileName);
}

export async function validateTemplateStructure(filePath) {
  const fixedBuffer = await fixDocxTemplate(filePath);
  const zip = new PizZip(fixedBuffer);
  new Docxtemplater(zip, DOCXTEMPLATER_OPTIONS);
}

export async function processGeneration({ generationId, tenantId, userId, clienteIds, templateIds, outputFormat }) {
  const progress = generationProgress.get(generationId);
  if (!progress) return;

  const includeDocx = outputFormat === 'docx' || outputFormat === 'both';
  const includePdf = outputFormat === 'pdf' || outputFormat === 'both';

  const clientes = await dbAll(
    `SELECT * FROM clientes WHERE empresa_id = ? AND id IN (${clienteIds.map(() => '?').join(',')})`,
    [tenantId, ...clienteIds],
  );

  const templates = await dbAll(
    `SELECT * FROM templates WHERE empresa_id = ? AND id IN (${templateIds.map(() => '?').join(',')})`,
    [tenantId, ...templateIds],
  );

  const clienteMap = new Map(clientes.map((c) => [c.id, c]));
  const templateMap = new Map(templates.map((t) => [t.id, t]));

  for (const clienteId of clienteIds) {
    const clienteRow = clienteMap.get(clienteId);
    if (!clienteRow) {
      templateIds.forEach((templateId) => {
        progress.completed += 1;
        progress.erros.push({ clienteId, templateId, error: 'Cliente nao encontrado na empresa selecionada' });
      });
      continue;
    }

    const clienteDados = safeJsonParse(clienteRow.dados, {});
    const clienteLookup = {};
    Object.keys(clienteDados).forEach((key) => {
      clienteLookup[key.toLowerCase().replace(/\s+/g, '')] = clienteDados[key];
    });
    const normalizeField = (value) => String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    const clienteNormalizedLookup = {};
    Object.keys(clienteDados).forEach((key) => {
      clienteNormalizedLookup[normalizeField(key)] = clienteDados[key];
    });
    const getClienteField = (...aliases) => {
      for (const alias of aliases) {
        const raw = String(alias || '');
        const compact = raw.toLowerCase().replace(/\s+/g, '');
        const normalized = normalizeField(raw);
        const value = clienteLookup[compact]
          ?? clienteNormalizedLookup[normalized]
          ?? clienteDados[raw];
        if (value !== undefined && value !== null && String(value).trim() !== '') {
          return String(value).trim();
        }
      }
      return '';
    };

    for (const templateId of templateIds) {
      const templateRow = templateMap.get(templateId);
      if (!templateRow) {
        progress.completed += 1;
        progress.erros.push({ clienteId, templateId, error: 'Template nao encontrado na empresa selecionada' });
        continue;
      }

      try {
        const templatePath = resolveTemplateFilePath(templateRow.arquivo);
        if (!fs.existsSync(templatePath)) {
          throw new Error('Arquivo do template nao encontrado');
        }

        let zip;
        try {
          const fixedBuffer = await fixDocxTemplate(templatePath);
          zip = new PizZip(fixedBuffer);
        } catch {
          const raw = fs.readFileSync(templatePath);
          zip = new PizZip(raw);
        }

        let doc;
        try {
          doc = new Docxtemplater(zip, DOCXTEMPLATER_OPTIONS);
        } catch (compileError) {
          throw new Error(formatDocxTemplateError(compileError));
        }

        const camposTemplate = safeJsonParse(templateRow.campos, []);
        const data = {};
        camposTemplate.forEach((campo) => {
          const key = String(campo).toLowerCase().replace(/\s+/g, '');
          const value = clienteLookup[key] ?? clienteDados[campo];
          data[campo] = value !== undefined && value !== null && String(value).trim() !== ''
            ? value
            : `[${String(campo).toUpperCase()} NAO INFORMADO]`;
        });

        try {
          doc.render(data);
        } catch (renderError) {
          const detail = renderError?.properties?.errors?.[0]?.properties?.explanation
            || renderError?.message
            || 'Erro ao renderizar template';
          throw new Error(detail);
        }

        const docxBuffer = doc.getZip().generate({ type: 'nodebuffer' });
        const clienteNome = sanitizeFileName(getClienteField('nome') || 'cliente');
        const clienteCpf = String(getClienteField('cpf') || 'sem-cpf').replace(/[^\\d]/g, '') || 'sem-cpf';
        const nomeFinanceira = sanitizeFileName(getClienteField(
          'nome_da_financeira',
          'financeira',
          'nome_financeira',
          'instituicao_financeira',
          'banco',
        ) || 'sem-banco');
        const numeroContrato = sanitizeFileName(getClienteField(
          'numero_do_contrato',
          'numero_contrato',
          'contrato'
        ) || 'sem-contrato');
        const templateNome = sanitizeFileName(templateRow.nome || 'template');

        const fileBase = `${templateNome} - ${clienteNome} - ${nomeFinanceira} - ${numeroContrato}`;
        const docxName = `${fileBase}.docx`;
        let savedDocxFileName = null;

        if (includeDocx || includePdf) {
          const docxPath = join(GENERATED_DIR, docxName);
          fs.writeFileSync(docxPath, docxBuffer);
          savedDocxFileName = docxName;
        }

        let pdfName = null;
        if (includePdf && ENABLE_PDF) {
          try {
            const pdfBuffer = await convertToPDF(docxBuffer);
            pdfName = `${fileBase}.pdf`;
            fs.writeFileSync(join(GENERATED_DIR, pdfName), pdfBuffer);
          } catch (pdfError) {
            progress.erros.push({ clienteId, templateId, error: `PDF nao gerado: ${pdfError.message}` });
            if (outputFormat === 'pdf') {
              throw new Error(`Falha ao gerar PDF: ${pdfError.message}`);
            }
          }
        }

        const saved = await dbRun(
          `INSERT INTO documentos_gerados
          (empresa_id, cliente_id, template_id, nome_arquivo, arquivo_docx, arquivo_pdf, campos_usados, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [tenantId, clienteId, templateId, fileBase, savedDocxFileName || docxName, pdfName, JSON.stringify(data), userId],
        );

        await auditLog(tenantId, userId, AcoesAuditoria.DOCUMENTO_GERADO, {
          id: saved.lastID,
          template: templateRow.nome,
          cliente: clienteNome
        });

        progress.documentos.push({
          id: saved.lastID,
          nome: fileBase,
          nomeArquivo: savedDocxFileName || pdfName || fileBase,
          nomeCliente: clienteNome,
          nomeFinanceira,
          numeroContrato,
          cliente: clienteNome || 'cliente',
          template: templateRow.nome,
          cpfCliente: clienteCpf,
          docxFileName: savedDocxFileName,
          pdfFileName: pdfName,
          docxDownloadUrl: includeDocx && savedDocxFileName ? `/api/download/${saved.lastID}?format=docx` : null,
          pdfDownloadUrl: includePdf && pdfName ? `/api/download/${saved.lastID}?format=pdf` : null,
        });
      } catch (error) {
        progress.erros.push({ clienteId, templateId, error: error.message || 'Erro ao gerar documento' });
      } finally {
        progress.completed += 1;
      }
    }
  }

  progress.status = 'completed';
  progress.finishedAt = Date.now();
}
