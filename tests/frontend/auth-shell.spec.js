import { expect, test } from '@playwright/test';
import { installSession, mockApi } from './helpers/session.js';

test('master authenticates through the real login route and logs out', async ({ page }) => {
  await page.goto('/');
  await page.getByPlaceholder('Seu e-mail').fill('admin@admin.com');
  await page.getByPlaceholder('Sua senha').fill('admin123456');
  await page.getByRole('button', { name: /entrar/i }).click();

  await expect(page).toHaveURL(/\/empresas$/);
  await page.getByRole('button', { name: /sair do sistema/i }).click();
  await expect(page).toHaveURL(/\/$/);
});

test('theme and collapsed sidebar preferences are restored', async ({ page }) => {
  await installSession(page, { darkTheme: true, sidebarCollapsed: true });
  await mockApi(page, {
    '/api/empresas': {
      status: 200,
      body: [],
    },
  });

  await page.goto('/empresas');

  await expect(page.locator('body')).toHaveClass(/dark-theme/);
  await expect(page.locator('.sidebar')).toHaveClass(/collapsed/);
});
