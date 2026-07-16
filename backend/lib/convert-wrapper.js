import fs from 'fs';
import os from 'os';
import path from 'path';
import { pathToFileURL } from 'url';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

function resolveSofficePath() {
  const configured = process.env.LIBRE_OFFICE_EXE;
  if (configured && fs.existsSync(configured)) return configured;

  if (process.platform === 'win32') {
    const candidates = [
      'C:\\Program Files\\LibreOffice\\program\\soffice.com',
      'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
      path.join(process.env.PROGRAMFILES || '', 'LibreOffice', 'program', 'soffice.com'),
      path.join(process.env.PROGRAMFILES || '', 'LibreOffice', 'program', 'soffice.exe'),
      path.join(process.env['PROGRAMFILES(X86)'] || '', 'LibreOffice', 'program', 'soffice.com'),
      path.join(process.env['PROGRAMFILES(X86)'] || '', 'LibreOffice', 'program', 'soffice.exe'),
    ];
    const found = candidates.find((candidate) => candidate && fs.existsSync(candidate));
    if (found) return found;
  }

  if (process.platform === 'darwin') {
    const candidate = '/Applications/LibreOffice.app/Contents/MacOS/soffice';
    if (fs.existsSync(candidate)) return candidate;
  }

  const linuxCandidates = [
    '/usr/bin/libreoffice',
    '/usr/bin/soffice',
    '/snap/bin/libreoffice',
    '/opt/libreoffice/program/soffice',
    '/opt/libreoffice7.6/program/soffice',
  ];
  const linuxFound = linuxCandidates.find((candidate) => fs.existsSync(candidate));
  if (linuxFound) return linuxFound;

  throw new Error(
    'LibreOffice nao encontrado. Instale o LibreOffice e, se necessario, configure LIBRE_OFFICE_EXE com o caminho do soffice.',
  );
}

export async function convertToPDF(docxBuffer) {
  if (!Buffer.isBuffer(docxBuffer) || docxBuffer.length === 0) {
    throw new Error('Buffer DOCX invalido para conversao em PDF');
  }

  const sofficePath = resolveSofficePath();
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'docpro-pdf-'));
  const profileDir = path.join(tempRoot, 'lo-profile');
  const inputPath = path.join(tempRoot, 'source.docx');
  const outputPath = path.join(tempRoot, 'source.pdf');

  try {
    fs.mkdirSync(profileDir, { recursive: true });
    fs.writeFileSync(inputPath, docxBuffer);

    const args = [
      `-env:UserInstallation=${pathToFileURL(profileDir).href}`,
      '--headless',
      '--convert-to',
      'pdf:writer_pdf_Export',
      '--outdir',
      tempRoot,
      inputPath,
    ];

    const result = await execFileAsync(sofficePath, args, {
      windowsHide: true,
      timeout: 180000,
      maxBuffer: 10 * 1024 * 1024,
    });

    if (!fs.existsSync(outputPath)) {
      const stdout = String(result?.stdout || '').trim();
      const stderr = String(result?.stderr || '').trim();
      throw new Error(`Conversao DOCX->PDF falhou. ${stdout} ${stderr}`.trim());
    }

    return fs.readFileSync(outputPath);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}
