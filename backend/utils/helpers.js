export function safeJsonParse(value, fallback = null) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function parseTenantId(raw) {
  if (raw === undefined || raw === null || raw === '') return null;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

export function extractMasterTenantId(req) {
  return parseTenantId(req.headers['x-empresa-id']);
}

export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function sanitizeFileName(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s_-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function formatDocxTemplateError(error) {
  const nestedErrors = error?.properties?.errors;
  let details = [];

  if (Array.isArray(nestedErrors) && nestedErrors.length > 0) {
    details = nestedErrors
      .map((entry) => entry?.properties?.explanation || entry?.message)
      .filter(Boolean)
      .slice(0, 3);
  } else if (error?.properties?.explanation) {
    details = [error.properties.explanation];
  } else if (error?.message) {
    details = [error.message];
  }

  if (details.length === 0) {
    return 'O modelo Word não pôde ser lido. Verifique se o arquivo não está corrompido ou com tags incompletas.';
  }

  const translated = details.map((msg = '') => {
    const str = String(msg);
    if (str.includes('Unclosed tag')) {
      const match = str.match(/Unclosed tag : ['"]?([^'"\s]+)['"]?/i);
      const tag = match ? match[1] : '';
      return `Tag não fechada no Word${tag ? ` (tag: "${tag}")` : ''}: Há uma abertura '{{' ou '{' que não foi fechada com '}}' ou '}'.`;
    }
    if (str.includes('Unopened tag')) {
      return 'Tag não aberta no Word: Há um fechamento "}}" ou "}" sem o respectivo fecho de abertura "{{".';
    }
    if (str.includes('Tag') && str.includes('is not closed')) {
      return `Tag incompleta no documento Word: ${str}`;
    }
    if (str.includes('Corrupted zip') || str.includes('Can\'t find end of central directory') || str.includes('End of data reached')) {
      return 'O arquivo não é um documento Microsoft Word (.docx) válido ou o arquivo está corrompido.';
    }
    if (str.includes('File too large') || str.includes('LIMIT_FILE_SIZE')) {
      return 'O arquivo excede o tamanho máximo permitido de 50 MB.';
    }
    return str;
  });

  return `Falha na validação do arquivo Word:\n• ${translated.join('\n• ')}`;
}

export function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  result.push(current.trim());
  return result;
}
