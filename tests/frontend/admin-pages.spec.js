import { expect, test } from '@playwright/test';
import { installSession, mockApi } from './helpers/session.js';

const companies = [
  {
    id: 1,
    nome: 'Amethyst Legal',
    slug: 'amethyst-legal',
    total_usuarios: 4,
    total_clientes: 120,
    total_templates: 8,
    config: { temaCor: '#7C3AED', temaCorSecundaria: '#2563EB' },
  },
];

const companiesWithLongIdentity = [
  {
    ...companies[0],
    nome: 'Amethyst Consultoria Jurídica e Operações Documentais Empresariais',
    slug: 'amethyst-consultoria-juridica-operacoes-documentais-empresariais',
  },
];

const users = [
  {
    id: 8,
    nome: 'Pessoa com nome extenso para validar o layout administrativo',
    email: 'pessoa.com.email.extenso@example.com',
    role: 'admin',
    created_at: '2026-09-28T12:00:00Z',
  },
];

const logs = [
  {
    id: 1,
    usuario_nome: 'Marina Costa',
    acao: 'DOCUMENTO_GERADO',
    detalhe: { arquivo: 'contrato-com-nome-muito-longo.docx', cliente: 'Ana Martins' },
    ip: '127.0.0.1',
    created_at: '2026-09-28T12:00:00Z',
  },
];

test('audit presents count and detailed log table', async ({ page }) => {
  await installSession(page, { role: 'admin' });
  await mockApi(page, { '/api/auditoria': { status: 200, body: logs } });
  await page.goto('/auditoria.html');

  await expect(page.locator('#totalLogsCount')).toHaveText('1');
  await expect(page.locator('.audit-summary')).toBeVisible();
  await expect(page.locator('#logsTableBody tr')).toHaveCount(1);
  await expect(page.locator('#logsTableBody')).toContainText('DOCUMENTO_GERADO');
  await expect(page.locator('.audit-action-badge.brand')).toBeVisible();
  await expect(page.locator('#logsTableBody pre')).toContainText(
    'contrato-com-nome-muito-longo.docx'
  );
});

test('master company cards retain context and management actions', async ({ page }) => {
  await installSession(page, { role: 'master' });
  await mockApi(page, { '/api/empresas': { status: 200, body: companies } });
  await page.goto('/empresas.html');

  const card = page.locator('.empresa-card');
  await expect(card).toBeVisible();
  await expect(card).toHaveCSS('padding', '0px');
  await expect(card).toHaveClass(/aurora-data-card/);
  await expect(card).toHaveClass(/is-active/);
  await expect(card.locator('.company-monogram')).toHaveText('A');
  await expect(card.locator('.company-palette-swatch')).toHaveCount(2);
  await expect(card.locator('.company-palette-code')).toHaveText(['#7C3AED', '#2563EB']);
  await expect(card).toContainText('120');
  await expect(card.locator('.active-company-label')).toContainText('Empresa ativa');
  await expect(card.getByRole('button', { name: /empresa ativa/i })).toBeVisible();
  await expect(card.getByRole('button', { name: 'Editar' })).toBeVisible();
  await expect(card.getByRole('button', { name: 'Excluir' })).toBeVisible();
});

test('audit api error remains distinct from an empty log and offers retry', async ({ page }) => {
  await installSession(page, { role: 'admin' });
  await mockApi(page, {
    '/api/auditoria': { status: 503, body: { error: 'Auditoria indisponível' } },
  });
  await page.goto('/auditoria.html');

  await expect(page.locator('#logsTableBody')).toHaveAttribute('data-state', 'error');
  await expect(page.locator('#logsTableBody [role="alert"]')).toContainText(/não foi possível carregar/i);
  await expect(page.locator('#retryAuditBtn')).toContainText('Tentar novamente');

  await page.route('**/api/auditoria', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  await page.locator('#retryAuditBtn').click();
  await expect(page.locator('#logsTableBody')).toHaveAttribute('data-state', 'empty');
  await expect(page.locator('#logsTableBody')).toContainText('Nenhum registro encontrado');
  await expect(page.locator('#logsTableBody [role="alert"]')).toHaveCount(0);
});

test('company management remains master-only', async ({ page }) => {
  await installSession(page, { role: 'admin' });
  await mockApi(page);
  await page.goto('/empresas.html');
  await expect(page).toHaveURL(/\/dashboard(?:\.html)?$/);
});

test('administrators retain user role and password controls', async ({ page }) => {
  await installSession(page, { role: 'admin' });
  await mockApi(page, { '/api/usuarios': { status: 200, body: users } });
  await page.goto('/usuarios.html');

  const card = page.locator('.usuario-card');
  await expect(card).toBeVisible();
  await expect(card).toHaveCSS('padding', '0px');
  await expect(card).toHaveClass(/aurora-data-card/);
  await expect(card.locator('.user-avatar-card')).toHaveText('P');
  await expect(card.locator('.role-badge.admin')).toContainText(/administrador/i);

  await card.getByRole('button', { name: /alterar cargo/i }).click();
  await expect(page.locator('#modalAlterarCargo')).toBeVisible();
  await page.evaluate(() => window.closeModal('modalAlterarCargo'));

  await card.getByRole('button', { name: /alterar senha/i }).click();
  await expect(page.locator('#modalRedefinirSenha')).toBeVisible();
});

for (const pageName of ['auditoria.html', 'empresas.html', 'usuarios.html']) {
  test(`${pageName} avoids document overflow at 390px`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await installSession(page, { role: pageName === 'empresas.html' ? 'master' : 'admin' });
    await mockApi(page, {
      '/api/auditoria': { status: 200, body: logs },
      '/api/empresas': { status: 200, body: companiesWithLongIdentity },
      '/api/usuarios': { status: 200, body: users },
    });
    await page.goto(`/${pageName}`);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(1);

    const card = page.locator('.empresa-card, .usuario-card').first();
    if (await card.count()) {
      const cardBox = await card.boundingBox();
      const actionBoxes = await card.locator('.card-footer .btn').evaluateAll((buttons) =>
        buttons.map((button) => {
          const rect = button.getBoundingClientRect();
          return { left: rect.left, right: rect.right };
        })
      );
      for (const actionBox of actionBoxes) {
        expect(actionBox.left).toBeGreaterThanOrEqual(cardBox.x - 1);
        expect(actionBox.right).toBeLessThanOrEqual(cardBox.x + cardBox.width + 1);
      }
      const actionLabels = await card.locator('.card-footer .btn').allTextContents();
      expect(actionLabels.at(-1)).toContain('Excluir');
    }
  });
}
