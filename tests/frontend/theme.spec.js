import { expect, test } from '@playwright/test';
import { installSession, mockApi } from './helpers/session.js';

const companies = {
  amethyst: {
    id: 1,
    nome: 'Amethyst Legal',
    temaCor: '#7C3AED',
    temaCorSecundaria: '#2563EB',
  },
  executive: {
    id: 2,
    nome: 'Verde Executivo',
    temaCor: '#0F766E',
    temaCorSecundaria: '#B45309',
  },
};

async function openDashboard(page, options = {}) {
  await installSession(page, options);
  await mockApi(page);
  await page.goto('/dashboard.html');
}

async function rootToken(page, name) {
  return page.locator('body').evaluate((body, tokenName) => {
    return getComputedStyle(body).getPropertyValue(tokenName).trim().toLowerCase();
  }, name);
}

function rgbChannels(cssColor) {
  return cssColor
    .match(/[\d.]+/g)
    .slice(0, 3)
    .map(Number);
}

function relativeLuminance(cssColor) {
  return rgbChannels(cssColor)
    .map((channel) => channel / 255)
    .map((channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4))
    .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
}

function contrastRatio(first, second) {
  const lighter = Math.max(relativeLuminance(first), relativeLuminance(second));
  const darker = Math.min(relativeLuminance(first), relativeLuminance(second));
  return (lighter + 0.05) / (darker + 0.05);
}

test('light theme uses the approved neutral foundations', async ({ page }) => {
  await openDashboard(page, { company: companies.amethyst });

  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(246, 245, 242)');
  await expect(page.locator('.panel').first()).toHaveCSS('background-color', 'rgb(255, 255, 255)');
});

test('dark theme uses charcoal foundations instead of violet-black', async ({ page }) => {
  await openDashboard(page, { company: companies.amethyst, darkTheme: true });

  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(16, 19, 24)');
  await expect(page.locator('.panel').first()).toHaveCSS('background-color', 'rgb(24, 28, 34)');
});

for (const [name, company] of Object.entries(companies)) {
  test(`${name} company palette reaches semantic brand tokens`, async ({ page }) => {
    await openDashboard(page, { company });

    expect(await rootToken(page, '--primary-500')).toBe(company.temaCor.toLowerCase());
    expect(await rootToken(page, '--secondary-500')).toBe(company.temaCorSecundaria.toLowerCase());
  });
}

for (const company of [
  { ...companies.amethyst, temaCor: '#F5F5F5' },
  { ...companies.amethyst, temaCor: '#101010' },
]) {
  test(`primary action remains readable for extreme brand color ${company.temaCor}`, async ({
    page,
  }) => {
    await openDashboard(page, { company });
    await page.evaluate(() => {
      const button = document.createElement('button');
      button.className = 'btn btn-primary';
      button.textContent = 'Gerar documentos';
      button.id = 'contrastProbe';
      document.body.appendChild(button);
    });

    const colors = await page.locator('#contrastProbe').evaluate((button) => {
      const style = getComputedStyle(button);
      return { background: style.backgroundColor, foreground: style.color };
    });

    expect(contrastRatio(colors.background, colors.foreground)).toBeGreaterThanOrEqual(4.5);
    await expect(page.locator('#contrastProbe')).toHaveCSS('min-height', '44px');
  });
}
