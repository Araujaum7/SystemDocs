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
  await expect(page.locator('.workflow-step')).toHaveCount(4);
  await expect(page.locator('.workflow-step-number')).toHaveText(['1', '2', '3', '4']);
  await expect(page.locator('.workflow-progress-item')).toHaveCount(4);
  expect(await page.locator('.workflow-progress-item').evaluateAll((items) =>
    items.map((item) => item.getAttribute('data-step'))
  )).toEqual(['1', '2', '3', '4']);
  await expect(page.locator('.documentos-container')).toHaveCSS('gap', '24px');

  await page.locator('#searchClientesDoc').fill('Ana');
  await expect(page.locator('#clientesSelection label')).toHaveCount(1);
  await page.locator('#searchTemplatesDoc').fill('Contrato');
  await expect(page.locator('#templatesSelection label')).toHaveCount(1);

  await page.locator('#cliente_doc_1').check();
  await expect(page.locator('.workflow-progress-item').nth(0)).toHaveClass(/complete/);
  await expect(page.locator('.workflow-progress-item').nth(1)).toHaveClass(/active/);
  await page.locator('#template_doc_2').check();
  await expect(page.locator('#clientesSelecionadosCount')).toHaveText('1');
  await expect(page.locator('#templatesSelecionadosCount')).toHaveText('1');
  await expect(page.locator('#totalDocumentosCount')).toHaveText('1');
  await expect(page.locator('#gerarDocumentosBtn')).toBeEnabled();
  await expect(page.locator('#editarCamposBtn')).toBeEnabled();
  await expect(page.locator('.workflow-progress-item').nth(1)).toHaveClass(/complete/);
  await expect(page.locator('.workflow-progress-item').nth(2)).toHaveClass(/complete/);
  await expect(page.locator('.workflow-progress-item').nth(3)).toHaveClass(/active/);

  const generationRequest = page.waitForRequest(
    (request) => request.method() === 'POST' && request.url().endsWith('/api/gerar-documentos')
  );
  await page.locator('#gerarDocumentosBtn').click();
  await expect(page.locator('#progressModal')).toBeVisible();
  const request = await generationRequest;
  expect(request.postDataJSON()).toEqual({
    clienteIds: [1],
    templateIds: [2],
    outputFormat: 'both',
  });
  await expect(page.locator('#progressResults')).toBeVisible({ timeout: 3_000 });
});

test('generation request failure remains actionable inside the progress dialog', async ({ page }) => {
  await openDocuments(page);
  await page.route('**/api/gerar-documentos', async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Falha controlada na geração' }),
    });
  });
  await page.locator('#cliente_doc_1').check();
  await page.locator('#template_doc_2').check();
  await page.locator('#gerarDocumentosBtn').click();

  await expect(page.locator('#progressModal')).toBeVisible();
  await expect(page.locator('#progressFeedback[role="alert"]')).toContainText('Falha controlada');
  await expect(page.locator('#closeProgressBtn')).toBeVisible();
  await expect(page.locator('#downloadAllBtn')).toHaveCount(0);
});

test('a completed item without a download url is not presented as downloadable', async ({ page }) => {
  await openDocuments(page);
  await page.route('**/api/gerar-documentos/progresso/ui-generation', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'completed',
        completed: 1,
        total: 1,
        documentos: [{ nomeArquivo: 'Contrato final.docx', nomeCliente: 'Ana Martins' }],
      }),
    });
  });
  await page.locator('#cliente_doc_1').check();
  await page.locator('#template_doc_2').check();
  await page.locator('#gerarDocumentosBtn').click();

  await expect(page.locator('.generated-document__unavailable')).toContainText(/arquivo indisponível/i, {
    timeout: 3_000,
  });
  await expect(page.locator('#downloadAllBtn')).toHaveCount(0);
  await expect(page.locator('.generated-document__actions button')).toHaveCount(0);
});

test('completed generation keeps long file names contained in a clear result summary', async ({ page }) => {
  await openDocuments(page, { width: 1280, height: 800 });
  await page.route('**/api/gerar-documentos/progresso/ui-generation', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'completed',
        completed: 1,
        total: 1,
        documentos: [{
          nomeArquivo: 'Autorizacao de Pagamento Terceiros ATT - JAQUELINE DOS SANTOS - Caixa Economica Federal - 878772409843-0.docx',
          nomeCliente: 'JAQUELINE DOS SANTOS',
          pdfDownloadUrl: '/api/download/pdf',
        }],
      }),
    });
  });

  await page.locator('#cliente_doc_1').check();
  await page.locator('#template_doc_2').check();
  await page.locator('#gerarDocumentosBtn').click();

  const dialog = page.getByRole('dialog', { name: /gerando documentos/i });
  await expect(dialog).toBeVisible({ timeout: 3_000 });
  await expect(dialog.locator('.generation-complete-summary')).toContainText(/1 documento pronto/i);
  await expect(page.locator('.notification')).toContainText('1 documento gerado');
  await expect(dialog.locator('.generated-document__filename')).toHaveCSS('overflow', 'hidden');
  await expect(dialog.locator('.generated-document__actions button')).toHaveCSS('min-height', '44px');

  const overflow = await dialog.locator('.generated-document').evaluate((card) => ({
    scrollWidth: card.scrollWidth,
    clientWidth: card.clientWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
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

for (const viewport of [
  { width: 320, height: 720 },
  { width: 390, height: 844 },
]) {
  test(`document generation workspace remains usable at ${viewport.width}px`, async ({ page }) => {
    await openDocuments(page, viewport);
    await expect(page.locator('.actions-panel')).toHaveCSS('position', 'static');

    await page.locator('#cliente_doc_1').check();
    await page.locator('#template_doc_2').check();
    await expect(page.locator('#gerarDocumentosBtn')).toBeVisible();

    const dimensions = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      contentLeft: document.querySelector('.document-workflow-progress').getBoundingClientRect().left,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
    expect(dimensions.contentLeft).toBeGreaterThanOrEqual(15);
  });
}

test('document review remains sticky from 1024px upward', async ({ page }) => {
  await openDocuments(page, { width: 1024, height: 768 });
  await expect(page.locator('.actions-panel')).toHaveCSS('position', 'sticky');
});
