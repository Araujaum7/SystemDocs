import { expect, test } from '@playwright/test';
import { installSession, mockApi } from './helpers/session.js';

const clients = [
  {
    id: 1,
    dados: { nome: 'Ana Martins', cpf: '12345678901', banco: 'Banco Exemplo', contrato: '99881' },
  },
];
const templates = [{ id: 2, nome: 'Contrato padrão', campos: ['nome', 'cpf'] }];

async function openDocuments(page, viewport) {
  if (viewport) await page.setViewportSize(viewport);
  await installSession(page, { role: 'admin' });
  await mockApi(page, {
    '/api/clientes': { status: 200, body: clients },
    '/api/templates': { status: 200, body: templates },
    '/api/clientes/1/historico': { status: 200, body: [] },
    '/api/gerar-documentos': { status: 200, body: { generationId: 'ui-generation' } },
    '/api/gerar-documentos/progresso/ui-generation': {
      status: 200,
      body: { status: 'completed', completed: 1, total: 1, documentos: [] },
    },
  });
  await page.goto('/documentos.html');
}

test('selection, counters and generation request preserve the production flow', async ({
  page,
}) => {
  await openDocuments(page);

  await expect(page.locator('#clientesSelection label')).toHaveCount(1);
  await expect(page.locator('#templatesSelection label')).toHaveCount(1);
  await expect(page.locator('.documentos-container')).toHaveCSS('gap', '24px');

  await page.locator('#cliente_doc_1').check();
  await page.locator('#template_doc_2').check();
  await expect(page.locator('#clientesSelecionadosCount')).toHaveText('1');
  await expect(page.locator('#templatesSelecionadosCount')).toHaveText('1');
  await expect(page.locator('#totalDocumentosCount')).toHaveText('1');
  await expect(page.locator('#gerarDocumentosBtn')).toBeEnabled();
  await expect(page.locator('#editarCamposBtn')).toBeEnabled();

  const generationRequest = page.waitForRequest(
    (request) => request.method() === 'POST' && request.url().endsWith('/api/gerar-documentos')
  );
  await page.locator('#gerarDocumentosBtn').click();
  const request = await generationRequest;
  expect(request.postDataJSON()).toMatchObject({
    clienteIds: [1],
    templateIds: [2],
    outputFormat: 'both',
  });
});

test('specific-field editor keeps fields and history in a contained modal', async ({ page }) => {
  await openDocuments(page);
  await page.locator('#cliente_doc_1').check();
  await page.locator('#template_doc_2').check();
  await page.locator('#editarCamposBtn').click();

  await expect(page.locator('#modalEditarCampos')).toBeVisible();
  await expect(page.locator('#camposEspecificos .form-group')).toHaveCount(2);
  await expect(page.locator('#historyContainer')).toContainText(/nenhum documento/i);
});

test('document generation workspace remains usable at 390px', async ({ page }) => {
  await openDocuments(page, { width: 390, height: 844 });
  await expect(page.locator('.documentos-container')).toHaveCSS('grid-template-columns', '358px');

  await page.locator('#cliente_doc_1').check();
  await page.locator('#template_doc_2').check();
  await expect(page.locator('#gerarDocumentosBtn')).toBeVisible();

  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
});
