import { expect, test } from '@playwright/test';
import { installSession, mockApi } from './helpers/session.js';

const dashboardResponses = {
  '/api/clientes': {
    status: 200,
    body: [
      {
        id: 1,
        dados: { nome: 'Ana Martins', cpf: '12345678901', email: 'ana@example.com' },
        created_at: '2026-09-28T12:00:00Z',
      },
    ],
  },
  '/api/templates': { status: 200, body: [{ id: 1, nome: 'Contrato', campos: ['nome', 'cpf'] }] },
  '/api/usuarios': { status: 200, body: Array.from({ length: 12 }, (_, index) => ({ id: index + 1, nome: `Usuário ${index + 1}` })) },
  '/api/empresas': { status: 200, body: [{ id: 1, nome: 'Amethyst Legal' }] },
  '/api/health': { status: 200, body: { ok: true } },
  '/api/dashboard/stats': {
    status: 200,
    body: {
      kpis: { documentos: 1248, clientes: 284 },
      graficos: {
        docsPorDia: [
          { data: '2026-09-22', quantidade: 32 },
          { data: '2026-09-23', quantidade: 41 },
          { data: '2026-09-24', quantidade: 37 },
          { data: '2026-09-25', quantidade: 56 },
          { data: '2026-09-26', quantidade: 48 },
          { data: '2026-09-27', quantidade: 63 },
          { data: '2026-09-28', quantidade: 71 },
        ],
        topTemplates: [
          { nome: 'Contratos', quantidade: 42 },
          { nome: 'Procurações', quantidade: 24 },
          { nome: 'Declarações', quantidade: 18 },
        ],
      },
    },
  },
};

test('login is an editorial form with explicit labels and no Tailwind runtime', async ({
  page,
}) => {
  await page.goto('/');

  await expect(page.locator('script[src*="tailwindcss"]')).toHaveCount(0);
  await expect(page.locator('.animate-blob')).toHaveCount(0);
  await expect(page.locator('.login-shell')).toBeVisible();
  await expect(page.getByLabel('E-mail')).toHaveAttribute('id', 'email');
  await expect(page.getByLabel('Senha')).toHaveAttribute('id', 'senha');
  await expect(page.getByRole('button', { name: /entrar no sistema/i })).toBeVisible();
});

test('dashboard reproduces the approved Aurora bento with truthful data', async ({
  page,
}) => {
  await installSession(page, { role: 'master' });
  await mockApi(page, dashboardResponses);
  await page.goto('/dashboard.html');

  await expect(page.locator('.kpi-card')).toHaveCount(4);
  await expect(page.locator('.kpi-card .kpi-label')).toHaveText([
    'Documentos gerados',
    'Clientes',
    'Templates',
    'Usuários',
  ]);
  await expect(page.locator('#kpiDocumentos')).toHaveText('1.248');
  await expect(page.locator('#kpiClientes')).toHaveText('284');
  await expect(page.locator('#kpiTemplates')).toHaveText('1');
  await expect(page.locator('#kpiUsuarios')).toHaveText('12');
  await expect(page.locator('#dashboardPrimaryAction')).toHaveText(/gerar documento/i);
  await expect(page.locator('#mainChart')).toBeVisible();
  await expect(page.locator('#topTemplatesChart')).toBeVisible();
  await expect(page.locator('#topTemplatesLegend')).toContainText('Contratos');
  await expect(page.locator('#topTemplatesLegend')).toContainText('42');
  await expect(page.locator('#companyIdentityPanel')).toContainText('Amethyst Legal');
  await expect(page.locator('#recentActivity')).toContainText('Ana Martins');
  await expect(page.locator('#quickLinks .action-card')).toHaveCount(4);
  await expect(page.locator('#masterPanel')).toBeVisible();
  const kpiSubtexts = await page.locator('.kpi-trend').allTextContents();
  expect(kpiSubtexts.every((text) => !/[↑↓]|\d+%/.test(text))).toBeTruthy();
});

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
  { width: 390, height: 844 },
]) {
  test(`dashboard avoids page overflow at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await installSession(page, { role: 'admin' });
    await mockApi(page, dashboardResponses);
    await page.goto('/dashboard.html');

    const dimensions = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
  });
}
