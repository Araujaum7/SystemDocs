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
  if (Array.isArray(nestedErrors) && nestedErrors.length > 0) {
    const details = nestedErrors
      .map((entry) => entry?.properties?.explanation || entry?.message)
      .filter(Boolean)
      .slice(0, 3);

    if (details.length > 0) {
      return `Template invalido: ${details.join(' | ')}`;
    }
  }

  if (error?.properties?.explanation) {
    return `Template invalido: ${error.properties.explanation}`;
  }

  return error?.message || 'Template invalido para o Docxtemplater';
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
