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
  '/api/usuarios': { status: 200, body: [{ id: 1, nome: 'Marina Costa' }] },
  '/api/empresas': { status: 200, body: [{ id: 1, nome: 'Amethyst Legal' }] },
  '/api/health': { status: 200, body: { ok: true } },
  '/api/dashboard/stats': {
    status: 200,
    body: { graficos: { docsPorDia: [{ data: '2026-09-28', quantidade: 4 }] } },
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

test('dashboard presents editorial KPIs, chart, actions and master governance', async ({
  page,
}) => {
  await installSession(page, { role: 'master' });
  await mockApi(page, dashboardResponses);
  await page.goto('/dashboard.html');

  await expect(page.locator('.kpi-card')).toHaveCount(4);
  await expect(page.locator('#kpiClientes')).toHaveText('1');
  await expect(page.locator('#mainChart')).toBeVisible();
  await expect(page.locator('#quickLinks .action-card')).toHaveCount(4);
  await expect(page.locator('#masterPanel')).toBeVisible();
  await expect(page.locator('.dashboard-hero')).toHaveCSS('box-shadow', /none|rgba\(27, 31, 36/);
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
