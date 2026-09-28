import { expect, test } from '@playwright/test';
import { installSession, mockApi } from './helpers/session.js';

async function openClients(page, viewport) {
  if (viewport) await page.setViewportSize(viewport);
  await installSession(page, { role: 'admin' });
  await mockApi(page);
  await page.goto('/clientes.html');
}

test('buttons and fields share accessible dimensions and focus treatment', async ({ page }) => {
  await openClients(page);

  const button = page.locator('#addClienteBtn');
  const field = page.locator('#searchClientes');
  await expect(button).toHaveCSS('min-height', '44px');
  await expect(field).toHaveCSS('min-height', '44px');

  await field.focus();
  const focusStyle = await field.evaluate((element) => {
    const style = getComputedStyle(element);
    return { outline: style.outlineStyle, shadow: style.boxShadow };
  });
  expect(focusStyle.outline !== 'none' || focusStyle.shadow !== 'none').toBeTruthy();
});

test('modal remains contained on a 390px viewport and keeps global helpers', async ({ page }) => {
  await openClients(page, { width: 390, height: 844 });
  await page.evaluate(() => window.openModal('modalCliente'));

  const modal = page.locator('#modalCliente');
  const content = modal.locator('.modal-content');
  await expect(modal).toBeVisible();
  const box = await content.boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(12);
  expect(box.width).toBeLessThanOrEqual(366);
  expect(box.height).toBeLessThanOrEqual(820);

  await page.evaluate(() => window.closeModal('modalCliente'));
  await expect(modal).toBeHidden();
});

test('toasts announce their status, retain duration and do not inject ripples', async ({
  page,
}) => {
  await openClients(page);

  await page.evaluate(() => window.showToast('Dados salvos', 'success', 80));
  const successToast = page.locator('.toast').filter({ hasText: 'Dados salvos' });
  await expect(successToast).toHaveAttribute('role', 'status');
  await expect(successToast).toHaveAttribute('aria-live', 'polite');
  await expect(successToast).toHaveCount(0, { timeout: 1_000 });

  await page.evaluate(() => window.showToast('Falha ao salvar', 'error', 500));
  await expect(page.locator('.toast').filter({ hasText: 'Falha ao salvar' })).toHaveAttribute(
    'role',
    'alert'
  );

  const button = page.locator('#addClienteBtn');
  await button.dispatchEvent('mousedown', { clientX: 10, clientY: 10 });
  await expect(button.locator('span[style*="ripple-effect"]')).toHaveCount(0);
});

test('disabled actions remain visibly unavailable without blocking semantics', async ({ page }) => {
  await openClients(page);
  const disabled = page.locator('#deleteMultipleBtn');
  await expect(disabled).toBeDisabled();
  await expect(disabled).toHaveCSS('cursor', 'not-allowed');
  const opacity = Number(await disabled.evaluate((element) => getComputedStyle(element).opacity));
  expect(opacity).toBeLessThan(1);
});
