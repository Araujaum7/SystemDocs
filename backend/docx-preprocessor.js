import fs from 'fs';
import PizZip from 'pizzip';

const XML_FILE_PATTERNS = [
  'word/document.xml',
  /^word\/header\d*\.xml$/,
  /^word\/footer\d*\.xml$/,
  'word/footnotes.xml',
  'word/endnotes.xml',
];

function normalizeBraceRuns(xml) {
  // Collapse repeated braces: {{{{NOME}}}} -> {{NOME}}
  let fixed = xml.replace(/\{{3,}/g, '{{').replace(/\}{3,}/g, '}}');

  // Repair braces split by XML runs/tags: {</w:t><w:t>{NOME ... -> {{NOME ...}}
  fixed = fixed.replace(/\{(?:\s|<[^>]+>)*\{/g, '{{');
  fixed = fixed.replace(/\}(?:\s|<[^>]+>)*\}/g, '}}');

  return fixed;
}

function normalizeBrokenSingleSideTags(xml) {
  let fixed = xml;

  // {{CPF}  -> {{CPF}}
  fixed = fixed.replace(
    /(?<!\{)\{\{\s*([^{}<>]{1,120}?)\s*\}(?!\})/g,
    (_match, tagName) => `{{${String(tagName).trim()}}}`,
  );

  // {CPF}}  -> {{CPF}}
  fixed = fixed.replace(
    /(?<!\{)\{\s*([^{}<>]{1,120}?)\s*\}\}(?!\})/g,
    (_match, tagName) => `{{${String(tagName).trim()}}}`,
  );

  return fixed;
}

function normalizeSingleBraceTagsToDouble(xml) {
  // Convert {CAMPO} -> {{CAMPO}} for plain placeholder-like tags.
  // Keep GUID-like values untouched: {909E8E84-426E-40DD-AFC4-6F175D3DCCD1}
  return xml.replace(
    /(?<!\{)\{\s*([A-Za-zÀ-ÿ_#/@^][A-Za-z0-9À-ÿ_#/@^.:\-]*)\s*\}(?!\})/g,
    (_match, tagName) => {
      const raw = String(tagName).trim();
      const looksLikeGuid = /^[0-9A-Fa-f-]{30,}$/.test(raw);
      if (looksLikeGuid) return `{${raw}}`;
      return `{{${raw}}}`;
    },
  );
}

function cleanInnerXmlBetweenDelimiters(xml) {
  // Remove XML tags inside placeholders to join Word-broken runs:
  // {{NO</w:t><w:t>ME}} -> {{NOME}}
  return xml.replace(/\{\{([\s\S]*?)\}\}/g, (_match, inner) => {
    const clean = String(inner)
      .replace(/<\/?[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    return `{{${clean}}}`;
  });
}

function normalizeTemplateXml(xml) {
  let fixed = xml;
  fixed = normalizeBraceRuns(fixed);
  fixed = normalizeBrokenSingleSideTags(fixed);
  fixed = normalizeSingleBraceTagsToDouble(fixed);
  fixed = cleanInnerXmlBetweenDelimiters(fixed);
  fixed = normalizeBraceRuns(fixed);
  return fixed;
}

export async function fixDocxTemplate(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Template not found: ${filePath}`);
  }

  const content = fs.readFileSync(filePath);
  const zip = new PizZip(content);

  Object.keys(zip.files).forEach((name) => {
    const shouldProcess = XML_FILE_PATTERNS.some((pattern) => (
      pattern instanceof RegExp ? pattern.test(name) : pattern === name
    ));
    if (!shouldProcess) return;

    const fileRef = zip.file(name);
    if (!fileRef) return;

    const xml = fileRef.asText();
    const fixed = normalizeTemplateXml(xml);
    zip.file(name, fixed);
  });

  return zip.generate({ type: 'nodebuffer' });
}
