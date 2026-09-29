import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
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
    return {
      outline: style.outlineStyle,
      outlineColor: style.outlineColor,
      outlineWidth: style.outlineWidth,
      shadow: style.boxShadow,
    };
  });
  expect(focusStyle.outline !== 'none' || focusStyle.shadow !== 'none').toBeTruthy();
  expect(focusStyle.outlineWidth).toBe('2px');
  expect(focusStyle.outlineColor).not.toBe('rgba(0, 0, 0, 0)');
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

test('Aurora panels use progressive glass with a solid fallback', async ({ page }) => {
  await openClients(page);

  const panel = page.locator('.toolbar').first();
  const panelStyle = await panel.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      background: style.backgroundColor,
      border: style.borderTopColor,
      backdrop: style.backdropFilter,
    };
  });
  expect(panelStyle.background).toContain('rgba');
  expect(panelStyle.border).not.toBe('rgba(0, 0, 0, 0)');
  expect(panelStyle.backdrop).toContain('blur');

  const stylesheet = await readFile(
    resolve('frontend/css/editorial-components.css'),
    'utf8'
  );
  expect(stylesheet).toContain('@supports not ((backdrop-filter: blur(1px))');
});

test('specialized cards own layout while base card owns only surface', async ({ page }) => {
  await openClients(page);
  await page.evaluate(() => {
    const baseCard = document.createElement('article');
    baseCard.id = 'baseCardProbe';
    baseCard.className = 'card';
    baseCard.textContent = 'Conteúdo controlado pelo componente';
    document.body.appendChild(baseCard);
  });

  const baseCard = page.locator('#baseCardProbe');
  await expect(baseCard).toHaveCSS('padding', '0px');
  await expect(baseCard).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(baseCard).not.toHaveCSS('border-top-color', 'rgba(0, 0, 0, 0)');
});

test('glass fallback resolves directly to the solid surface token', async ({ page }) => {
  await openClients(page);
  await page.evaluate(() => {
    document.body.classList.add('force-solid-glass');
    document.body.style.setProperty('--surface-panel-strong', 'transparent');
  });

  const style = await page.locator('.toolbar').first().evaluate((element) => {
    const computed = getComputedStyle(element);
    return {
      background: computed.backgroundColor,
      backdrop: computed.backdropFilter,
      solid: getComputedStyle(document.body).getPropertyValue('--surface-panel-solid').trim(),
    };
  });
  expect(style.backdrop).toBe('none');
  expect(style.background).toBe('rgb(13, 27, 46)');
  expect(style.solid.toLowerCase()).toBe('#0d1b2e');
});

test('modal traps focus and returns it to the opener', async ({ page }) => {
  await openClients(page, { width: 390, height: 844 });
  const opener = page.locator('#addClienteBtn');
  await opener.focus();
  await page.evaluate(() => window.openModal('modalCliente'));

  const modal = page.locator('#modalCliente');
  await expect(modal).toBeVisible();
  await expect(modal.locator(':focus')).toHaveCount(1);

  await page.keyboard.press('Escape');
  await expect(modal).toBeHidden();
  await expect(opener).toBeFocused();
});

test('brand glow belongs to primary actions while destructive actions stay semantic', async ({
  page,
}) => {
  await openClients(page);

  const primary = page.locator('#addClienteBtn');
  await expect(primary).not.toHaveCSS('box-shadow', 'none');

  await page.evaluate(() => {
    const danger = document.createElement('button');
    danger.id = 'dangerProbe';
    danger.className = 'btn btn-danger';
    danger.textContent = 'Excluir';
    document.body.appendChild(danger);
  });
  const colors = await page.locator('#dangerProbe').evaluate((element) => {
    const style = getComputedStyle(element);
    return { background: style.backgroundColor, brand: getComputedStyle(document.body).getPropertyValue('--primary-500') };
  });
  expect(colors.background).not.toBe(colors.brand.trim());
});

test('disabled fields are explicit and reduced motion removes component animation', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openClients(page);

  await page.evaluate(() => {
    const input = document.createElement('input');
    input.id = 'disabledProbe';
    input.disabled = true;
    document.body.appendChild(input);
    window.showToast('Sem animação', 'info', 500);
  });

  await expect(page.locator('#disabledProbe')).toBeDisabled();
  await expect(page.locator('#disabledProbe')).toHaveCSS('cursor', 'not-allowed');
  const animationDuration = await page
    .locator('.toast')
    .evaluate((element) => Number.parseFloat(getComputedStyle(element).animationDuration));
  expect(animationDuration).toBeLessThanOrEqual(0.00001);
});
