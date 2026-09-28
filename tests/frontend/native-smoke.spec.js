import { expect, test } from '@playwright/test';

test('isolated native flow creates context, navigates, toggles theme and logs out', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByLabel('E-mail').fill('admin@admin.com');
  await page.getByLabel('Senha').fill('admin123456');
  await page.getByRole('button', { name: /entrar no sistema/i }).click();
  await expect(page).toHaveURL(/\/empresas(?:\.html)?$/);

  const promptAnswers = ['Empresa Smoke UI', '#0F766E', '#B45309'];
  page.on('dialog', async (dialog) => {
    await dialog.accept(promptAnswers.shift() ?? '');
  });
  await page.getByRole('button', { name: /nova empresa/i }).click();

  const companyCard = page.locator('.empresa-card').filter({ hasText: 'Empresa Smoke UI' });
  await expect(companyCard).toBeVisible();
  await companyCard.getByRole('button', { name: /entrar na empresa/i }).click();
  await expect(page).toHaveURL(/\/dashboard(?:\.html)?$/);
  await expect(page.getByText('Empresa Smoke UI', { exact: true })).toBeVisible();

  const themeToggle = page.locator('.theme-toggle');
  await themeToggle.click();
  await expect(page.locator('body')).toHaveClass(/dark-theme/);
  await expect.poll(() => page.evaluate(() => localStorage.getItem('darkTheme'))).toBe('true');

  for (const destination of [
    'clientes.html',
    'documentos.html',
    'templates.html',
    'auditoria.html',
    'usuarios.html',
    'empresas.html',
  ]) {
    await page.locator(`.nav-item[href="${destination}"]`).click();
    await expect(page).toHaveURL(new RegExp(`/${destination.replace('.', '\\.')}$`));
  }

  await page.locator('#logoutBtn').click();
  await expect(page).toHaveURL(/\/$/);
  await expect.poll(() => page.evaluate(() => localStorage.getItem('token'))).toBeNull();
});
