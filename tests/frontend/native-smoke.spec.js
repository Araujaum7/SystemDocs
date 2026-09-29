import { expect, test } from '@playwright/test';

test('isolated native flow creates context, navigates, toggles theme and logs out', async ({
  page,
}) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.removeItem('darkTheme'));
  await page.reload();
  await page.getByLabel('E-mail').fill('admin@admin.com');
  await page.getByLabel('Senha').fill('admin123456');
  await page.getByRole('button', { name: /entrar no sistema/i }).click();
  await expect(page).toHaveURL(/\/empresas(?:\.html)?$/);
  await expect(page.locator('body')).toHaveClass(/dark-theme/);

  const promptAnswers = ['Empresa Smoke UI', '#0F766E', '#B45309'];
  page.on('dialog', async (dialog) => {
    await dialog.accept(promptAnswers.shift() ?? '');
  });
  await page.getByRole('button', { name: /nova empresa/i }).click();

  const companyCard = page.locator('.empresa-card').filter({ hasText: 'Empresa Smoke UI' });
  await expect(companyCard).toBeVisible();
  await companyCard.getByRole('button', { name: /entrar na empresa/i }).click();
  await expect(page).toHaveURL(/\/dashboard(?:\.html)?$/);
  await expect(page.locator('.company-context__name')).toHaveText('Empresa Smoke UI');
  await expect(page.locator('#dashboardShell')).toHaveAttribute('data-state', /ready|empty/);

  const themeToggle = page.locator('.theme-toggle');
  await themeToggle.click();
  await expect(page.locator('body')).not.toHaveClass(/dark-theme/);
  await expect.poll(() => page.evaluate(() => localStorage.getItem('darkTheme'))).toBe('false');

  for (const destination of [
    'clientes.html',
    'documentos.html',
    'templates.html',
    'auditoria.html',
    'usuarios.html',
    'empresas.html',
  ]) {
    await page.locator(`.nav-item[href="${destination}"]`).click();
    await expect(page.locator('h1')).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow, `${destination} must not overflow`).toBeLessThanOrEqual(1);
    await expect(page).toHaveURL(new RegExp(`/${destination.replace('.', '\\.')}$`));
  }

  await expect(
    page
      .locator('.empresa-card.is-active')
      .filter({ hasText: 'Empresa Smoke UI' })
      .locator('.active-company-label')
  ).toContainText('Empresa ativa');

  await page.locator('#logoutBtn').click();
  await expect(page).toHaveURL(/\/$/);
  await expect.poll(() => page.evaluate(() => localStorage.getItem('token'))).toBeNull();
});
