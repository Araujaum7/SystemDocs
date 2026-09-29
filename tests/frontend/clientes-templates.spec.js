import { expect, test } from '@playwright/test';
import { installSession, mockApi } from './helpers/session.js';

const clients = [
  {
    id: 1,
    dados: {
      nome: 'Ana Martins com um nome empresarial deliberadamente longo para validar o recorte responsivo',
      cpf: '12345678901',
      email: 'ana.martins.com.endereco.extenso@example.com',
      telefone: '11999999999',
      endereco: 'Avenida das Operações Documentais, 1500, conjunto 120',
    },
    created_at: '2026-09-28T12:00:00Z',
  },
  {
    id: 2,
    dados: { nome: 'Beatriz Lima', cpf: '98765432100' },
    created_at: '2026-09-27T12:00:00Z',
  },
];

const templates = [
  {
    id: 7,
    nome: 'Contrato de prestação de serviços corporativos',
    arquivo: 'contrato-corporativo.docx',
    campos: [
      'nome',
      'cpf',
      'endereco_completo_com_identificador_deliberadamente_extenso_sem_espacos_para_validar_quebra',
    ],
    created_at: '2026-09-28T12:00:00Z',
  },
];

test('clients keep search, create, import and bulk actions in the redesigned cards', async ({
  page,
}) => {
  await installSession(page, { role: 'admin' });
  await mockApi(page, { '/api/clientes': { status: 200, body: clients } });
  await page.goto('/clientes.html');

  const cards = page.locator('.cliente-card');
  await expect(cards).toHaveCount(2);
  await expect(page.locator('.aurora-toolbar')).toBeVisible();
  await expect(page.locator('.aurora-selection-bar')).toBeVisible();
  await expect(cards.first()).toHaveClass(/aurora-data-card/);
  await expect(cards.first().locator('.client-primary-data')).toContainText('Ana Martins');
  await expect(cards.first().locator('.client-meta')).toContainText('123.456.789-01');
  await expect(page.locator('#clientesList')).toHaveCSS('gap', '16px');

  await page.locator('#searchClientes').fill('Beatriz');
  await expect(cards).toHaveCount(1);
  await page.locator('#searchClientes').fill('');

  await page.locator('#addClienteBtn').click();
  await expect(page.locator('#modalCliente')).toBeVisible();
  await page.evaluate(() => window.closeModal('modalCliente'));
  await page.locator('#importClientesBtn').click();
  await expect(page.locator('#modalImport')).toBeVisible();
  await page.evaluate(() => window.closeModal('modalImport'));

  await cards.first().locator('.checkbox').click();
  await expect(cards.first().locator('input[type="checkbox"]')).toBeChecked();
  await expect(page.locator('#deleteMultipleBtn')).toBeEnabled();
  await expect(page.locator('#duplicateMultipleBtn')).toBeEnabled();
  await expect(page.locator('.selection-count')).toContainText('1 selecionado');
});

test('bulk actions and client card emphasis follow the current selection', async ({ page }) => {
  await installSession(page, { role: 'admin' });
  await mockApi(page, { '/api/clientes': { status: 200, body: clients } });
  await page.goto('/clientes.html');

  const selectionBar = page.locator('.aurora-selection-bar');
  const firstCard = page.locator('.cliente-card').first();
  const firstCheckbox = firstCard.locator('input[type="checkbox"]');

  await expect(selectionBar).not.toHaveClass(/is-active/);
  await expect(selectionBar).toHaveAttribute('data-selection-count', '0');
  await expect(firstCard).not.toHaveClass(/is-selected/);

  await firstCard.locator('.checkbox').click();
  await expect(selectionBar).toHaveClass(/is-active/);
  await expect(selectionBar).toHaveAttribute('data-selection-count', '1');
  await expect(firstCard).toHaveClass(/is-selected/);

  await page.locator('#searchClientes').fill('Beatriz');
  await page.locator('#searchClientes').fill('');
  await expect(firstCheckbox).toBeChecked();
  await expect(firstCard).toHaveClass(/is-selected/);

  await firstCard.locator('.checkbox').click();
  await expect(selectionBar).not.toHaveClass(/is-active/);
  await expect(selectionBar).toHaveAttribute('data-selection-count', '0');
});

test('template admin keeps download, optional-file edit and delete actions', async ({ page }) => {
  await installSession(page, { role: 'admin' });
  await mockApi(page, {
    '/api/templates': { status: 200, body: templates },
    '/api/templates/7': async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });
    },
  });
  await page.goto('/templates.html');

  const card = page.locator('.template-card');
  await expect(card).toBeVisible();
  await expect(page.locator('.aurora-toolbar')).toBeVisible();
  await expect(card).toHaveClass(/aurora-data-card/);
  await expect(card.locator('.template-file')).toContainText('contrato-corporativo.docx');
  await expect(card.locator('.field-chip')).toHaveCount(3);
  await expect(card.getByRole('button', { name: 'Baixar' })).toBeVisible();
  await expect(card.getByRole('button', { name: 'Editar' })).toBeVisible();
  await expect(card.getByRole('button', { name: 'Excluir' })).toBeVisible();

  await card.getByRole('button', { name: 'Editar' }).click();
  await expect(page.locator('#modalEditTemplate')).toBeVisible();
  await page.locator('#editTemplateNome').fill('Contrato atualizado');
  await page.locator('#editTemplateCampos').fill('nome, cpf');
  const updateRequest = page.waitForRequest(
    (request) => request.method() === 'PUT' && request.url().endsWith('/api/templates/7')
  );
  await page
    .locator('#templateEditForm')
    .getByRole('button', { name: /salvar/i })
    .click();
  await updateRequest;
});

test('standard user sees templates without administrative actions', async ({ page }) => {
  await installSession(page, { role: 'user' });
  await mockApi(page, { '/api/templates': { status: 200, body: templates } });
  await page.goto('/templates.html');

  await expect(page.locator('.template-card')).toBeVisible();
  await expect(page.locator('#addTemplateBtn')).toBeHidden();
  await expect(page.locator('.template-card button')).toHaveCount(0);
});

for (const pageName of ['clientes.html', 'templates.html']) {
  test(`${pageName} contains long content at 390px`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await installSession(page, { role: 'admin' });
    await mockApi(page, {
      '/api/clientes': { status: 200, body: clients },
      '/api/templates': { status: 200, body: templates },
    });
    await page.goto(`/${pageName}`);
    const layout = await page.evaluate(() => {
      const root = document.documentElement;
      const card = document.querySelector('.cliente-card, .template-card');
      const cardRect = card.getBoundingClientRect();
      const controls = [...card.querySelectorAll('.checkbox, .card-footer .btn')].map((control) => {
        const rect = control.getBoundingClientRect();
        return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
      });
      return {
        overflow: root.scrollWidth - root.clientWidth,
        cardOverflow: card.scrollWidth - card.clientWidth,
        card: { left: cardRect.left, right: cardRect.right, top: cardRect.top, bottom: cardRect.bottom },
        controls,
      };
    });
    expect(layout.overflow).toBeLessThanOrEqual(1);
    expect(layout.cardOverflow).toBeLessThanOrEqual(1);
    for (const control of layout.controls) {
      expect(control.left).toBeGreaterThanOrEqual(layout.card.left - 1);
      expect(control.right).toBeLessThanOrEqual(layout.card.right + 1);
      expect(control.top).toBeGreaterThanOrEqual(layout.card.top - 1);
      expect(control.bottom).toBeLessThanOrEqual(layout.card.bottom + 1);
    }

    const actionLabels = await page.locator('.card-footer .btn').allTextContents();
    if (actionLabels.length) {
      expect(actionLabels.at(-1)).toContain('Excluir');
    }
  });
}
