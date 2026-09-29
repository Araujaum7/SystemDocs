import { expect, test } from '@playwright/test';
import { DEFAULT_COMPANY, installSession, mockApi } from './helpers/session.js';

async function openDashboard(page, options = {}) {
  await installSession(page, options);
  await mockApi(page);
  await page.goto('/dashboard.html');
}

test('desktop shell exposes company, active navigation and accessible controls', async ({
  page,
}) => {
  await openDashboard(page, { role: 'admin' });

  await expect(page.locator('.sidebar')).toHaveCSS('width', '228px');
  await expect(page.locator('.app-topbar')).toHaveCSS('height', '68px');
  await expect(page.locator('.global-search--disabled')).toHaveAttribute('aria-disabled', 'true');
  await expect(page.locator('.global-search--disabled')).toHaveAccessibleName(
    'Busca global indisponível'
  );
  await expect(page.locator('.nav-item.active')).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.topbar-company-context')).toContainText(DEFAULT_COMPANY.nome);
  await expect(page.locator('.app-topbar #userInfo')).toBeVisible();
  await expect(page.getByRole('button', { name: /ativar tema claro/i })).toBeVisible();

  const desktopToggle = page.locator('.sidebar-toggle');
  await expect(desktopToggle).toHaveAttribute('aria-expanded', 'true');
  await desktopToggle.click();
  await expect(page.locator('.sidebar')).toHaveClass(/collapsed/);
  await expect(page.locator('.sidebar')).toHaveCSS('width', '76px');
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('sidebarCollapsed')))
    .toBe('true');
});

test('mobile shell opens and closes as a drawer', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openDashboard(page, { role: 'user' });

  const mobileToggle = page.locator('.mobile-sidebar-toggle');
  await expect(mobileToggle).toHaveAccessibleName(/abrir menu/i);
  await expect(mobileToggle).toHaveAttribute('aria-expanded', 'false');
  await mobileToggle.click();
  await expect(page.locator('.sidebar')).toHaveClass(/active/);
  await expect(page.locator('body')).toHaveClass(/sidebar-open/);
  await expect(mobileToggle).toHaveAttribute('aria-expanded', 'true');
  await expect(mobileToggle).toHaveAccessibleName(/fechar menu/i);
  await expect(page.locator('.sidebar-overlay')).toHaveClass(/active/);

  await page.locator('.sidebar-overlay').click({ position: { x: 380, y: 20 } });
  await expect(page.locator('.sidebar')).not.toHaveClass(/active/);
  await expect(page.locator('body')).not.toHaveClass(/sidebar-open/);
  await expect(mobileToggle).toHaveAttribute('aria-expanded', 'false');

  await mobileToggle.click();
  await page.keyboard.press('Escape');
  await expect(page.locator('.sidebar')).not.toHaveClass(/active/);
  await expect(page.locator('body')).not.toHaveClass(/sidebar-open/);
});

test('mobile drawer owns secondary controls and restores trigger focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openDashboard(page, { role: 'user' });

  const toggle = page.locator('.mobile-sidebar-toggle');
  const drawer = page.locator('.sidebar');

  await expect(page.locator('.app-topbar')).toHaveCSS('height', '64px');
  await expect(page.locator('.app-topbar .global-search')).toBeHidden();
  await expect(page.locator('.app-topbar .theme-toggle')).toHaveCount(0);
  await expect(page.locator('.app-topbar .topbar-company-context')).toHaveCount(0);
  await expect(drawer.locator('.sidebar-mobile-tools .theme-toggle')).toBeVisible();
  await expect(drawer.locator('.sidebar-mobile-tools .topbar-company-context')).toContainText(
    DEFAULT_COMPANY.nome
  );

  await toggle.click();
  await expect(drawer).toHaveClass(/active/);
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
  await expect(drawer.locator(':focus')).toHaveCount(1);

  await page.keyboard.press('Escape');
  await expect(drawer).not.toHaveClass(/active/);
  await expect(page.locator('body')).not.toHaveClass(/sidebar-open/);
  await expect(toggle).toBeFocused();
});

test('shell remains usable at 320px and 200 percent zoom', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 900 });
  await openDashboard(page, { role: 'user' });
  await page.evaluate(() => {
    document.documentElement.style.zoom = '2';
  });

  const layout = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth + 1);
  await expect(page.locator('.mobile-sidebar-toggle')).toBeVisible();
  await expect(page.locator('.app-topbar #userInfo')).toBeVisible();
  await expect(page.locator('.app-topbar .theme-toggle')).toHaveCount(0);
  await expect(page.locator('.sidebar-mobile-tools .theme-toggle')).toBeVisible();
});

for (const [role, expected] of [
  ['master', true],
  ['admin', true],
  ['user', false],
]) {
  test(`${role} keeps the existing administrative navigation visibility`, async ({ page }) => {
    await openDashboard(page, { role });
    const administration = page.locator('.nav-section.admin-master-only');
    if (expected) await expect(administration).toBeVisible();
    else await expect(administration).toBeHidden();
  });
}
