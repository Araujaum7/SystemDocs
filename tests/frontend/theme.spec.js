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

test('Aurora Executive exposes exact light neutral foundations', async ({ page }) => {
  await openDashboard(page, { company: companies.amethyst, darkTheme: false });

  expect(await rootToken(page, '--surface-app')).toBe('#f4f7fb');
  expect(await rootToken(page, '--surface-panel-solid')).toBe('#ffffff');
  expect(await rootToken(page, '--text-primary')).toBe('#172033');
  expect(await rootToken(page, '--text-secondary')).toBe('#58677a');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(244, 247, 251)');
});

test('Aurora Executive exposes exact dark neutral foundations', async ({ page }) => {
  await openDashboard(page, { company: companies.amethyst, darkTheme: true });

  expect(await rootToken(page, '--surface-app')).toBe('#07111f');
  expect(await rootToken(page, '--surface-panel-solid')).toBe('#0d1b2e');
  expect(await rootToken(page, '--text-primary')).toBe('#f8fafc');
  expect(await rootToken(page, '--text-secondary')).toBe('#a5b4c7');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(7, 17, 31)');
});

test('ausência de darkTheme inicia body.dark-theme', async ({ page }) => {
  await openDashboard(page, { company: companies.amethyst, darkTheme: undefined });
  await expect(page.locator('body')).toHaveClass(/dark-theme/);
});

for (const [name, company] of Object.entries(companies)) {
  test(`${name} company palette reaches semantic brand tokens`, async ({ page }) => {
    await openDashboard(page, { company, darkTheme: false });

    expect(await rootToken(page, '--primary-500')).toBe(company.temaCor.toLowerCase());
    expect(await rootToken(page, '--secondary-500')).toBe(company.temaCorSecundaria.toLowerCase());
  });
}

test('empresa verde aplica cor mesmo se somente a lista empresas contiver a config', async ({ page }) => {
  await openDashboard(page, { company: companies.executive, omitContextConfig: true, darkTheme: false });
  expect(await rootToken(page, '--primary-500')).toBe(companies.executive.temaCor.toLowerCase());
});

test('setEmpresaContexto() troca de roxo para verde sem reload', async ({ page }) => {
  await openDashboard(page, { company: companies.amethyst, darkTheme: false });

  await page.evaluate((executive) => {
    window.auth.setEmpresaContexto({ id: executive.id, nome: executive.nome, config: { temaCor: executive.temaCor, temaCorSecundaria: executive.temaCorSecundaria } });
  }, companies.executive);

  expect(await rootToken(page, '--primary-500')).toBe(companies.executive.temaCor.toLowerCase());
});

test('troca de empresa remove o acento secundário que a nova empresa não fornece', async ({
  page,
}) => {
  await openDashboard(page, { company: companies.amethyst, darkTheme: false });

  await page.evaluate(() => {
    window.auth.setEmpresaContexto({
      id: 3,
      nome: 'Marca Primária',
      config: { temaCor: '#0F766E' },
    });
  });

  const inlineSecondary = await page.evaluate(() =>
    document.body.style.getPropertyValue('--secondary-500')
  );
  expect(inlineSecondary).toBe('');
});

test('clearEmpresaContexto() remove somente tokens injetados, sem apagar outros estilos inline do body', async ({ page }) => {
  await openDashboard(page, { company: companies.amethyst, darkTheme: false });

  await page.evaluate(() => {
    document.body.style.margin = '10px';
    window.auth.clearEmpresaContexto();
  });

  const inlinePrimary = await page.evaluate(() => document.body.style.getPropertyValue('--primary-500'));
  expect(inlinePrimary.trim()).toBe('');
  const margin = await page.evaluate(() => document.body.style.margin);
  expect(margin).toBe('10px');
});

test('config inválida mantém fallbacks e não lança erro', async ({ page }) => {
  await openDashboard(page, { company: companies.amethyst, darkTheme: false });

  await page.evaluate(() => {
    localStorage.setItem('empresaContextoConfig', 'invalid_json');
    window.auth.applyThemeColor();
  });

  // Does not throw and returns empty or default
  expect(await rootToken(page, '--primary-500')).not.toBe('');
});

test('evento documentospro:themechange é emitido após a empresa mudar', async ({ page }) => {
  await openDashboard(page, { company: companies.amethyst, darkTheme: false });

  const eventDetails = await page.evaluate((executive) => {
    return new Promise(resolve => {
      document.addEventListener('documentospro:themechange', (e) => resolve(e.detail), { once: true });
      window.auth.setEmpresaContexto({ id: executive.id, nome: executive.nome, config: { temaCor: executive.temaCor, temaCorSecundaria: executive.temaCorSecundaria } });
    });
  }, companies.executive);

  expect(eventDetails).toHaveProperty('isDark', false);
  expect(eventDetails).toHaveProperty('primary', companies.executive.temaCor);
});

test('evento documentospro:themechange é emitido após o tema mudar', async ({ page }) => {
  await openDashboard(page, { company: companies.amethyst, darkTheme: false });

  const eventDetails = await page.evaluate(() => {
    return new Promise((resolve) => {
      document.addEventListener('documentospro:themechange', (event) => resolve(event.detail), {
        once: true,
      });
      document.querySelector('.theme-toggle').click();
    });
  });

  expect(eventDetails).toHaveProperty('isDark', true);
  expect(eventDetails).toHaveProperty('primary', companies.amethyst.temaCor);
});

for (const company of [
  { ...companies.amethyst, temaCor: '#F5F5F5' },
  { ...companies.amethyst, temaCor: '#101010' },
]) {
  test(`action and focus remain readable for extreme brand color ${company.temaCor}`, async ({
    page,
  }) => {
    await openDashboard(page, { company });
    await page.evaluate(() => {
      const button = document.createElement('button');
      button.className = 'btn btn-primary';
      button.textContent = 'Gerar documentos';
      button.id = 'contrastProbe';
      document.body.appendChild(button);

      const input = document.createElement('input');
      input.id = 'focusContrastProbe';
      input.setAttribute('aria-label', 'Busca de contraste');
      document.body.appendChild(input);
    });

    const colors = await page.locator('#contrastProbe').evaluate((button) => {
      const style = getComputedStyle(button);
      return { background: style.backgroundColor, foreground: style.color };
    });

    expect(contrastRatio(colors.background, colors.foreground)).toBeGreaterThanOrEqual(4.5);
    await expect(page.locator('#contrastProbe')).toHaveCSS('min-height', '44px');

    await page.locator('#focusContrastProbe').focus();
    const focusColors = await page.locator('#focusContrastProbe').evaluate((input) => {
      const inputStyle = getComputedStyle(input);
      const bodyStyle = getComputedStyle(document.body);
      return {
        outline: inputStyle.outlineColor,
        surface: bodyStyle.backgroundColor,
      };
    });
    expect(contrastRatio(focusColors.outline, focusColors.surface)).toBeGreaterThanOrEqual(3);
  });
}
