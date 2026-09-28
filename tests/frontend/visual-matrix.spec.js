import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { installSession, mockApi } from './helpers/session.js';

const companies = [
  {
    id: 1,
    slug: 'amethyst',
    nome: 'Amethyst Legal',
    temaCor: '#7C3AED',
    temaCorSecundaria: '#2563EB',
  },
  {
    id: 2,
    slug: 'executive',
    nome: 'Executive Docs',
    temaCor: '#0F766E',
    temaCorSecundaria: '#B45309',
  },
];

const viewports = [
  { slug: 'desktop', width: 1440, height: 1000 },
  { slug: 'tablet', width: 1024, height: 900 },
  { slug: 'mobile', width: 390, height: 844 },
];

const authenticatedPages = [
  'dashboard.html',
  'clientes.html',
  'documentos.html',
  'templates.html',
  'auditoria.html',
  'empresas.html',
  'usuarios.html',
];

const criticalPages = new Set([
  'dashboard.html',
  'documentos.html',
  'templates.html',
  'usuarios.html',
]);

const responses = {
  '/api/health': { status: 200, body: { ok: true } },
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
  '/api/templates': {
    status: 200,
    body: [
      {
        id: 2,
        nome: 'Contrato padrão',
        arquivo: 'contrato.docx',
        campos: ['nome', 'cpf'],
        created_at: '2026-09-28T12:00:00Z',
      },
    ],
  },
  '/api/usuarios': {
    status: 200,
    body: [
      {
        id: 8,
        nome: 'Marina Costa',
        email: 'marina@example.com',
        role: 'admin',
        created_at: '2026-09-28T12:00:00Z',
      },
    ],
  },
  '/api/empresas': { status: 200, body: [] },
  '/api/auditoria': {
    status: 200,
    body: [
      {
        id: 1,
        usuario_nome: 'Marina Costa',
        acao: 'LOGIN',
        detalhe: 'Acesso autorizado',
        ip: '127.0.0.1',
        created_at: '2026-09-28T12:00:00Z',
      },
    ],
  },
  '/api/dashboard/stats': {
    status: 200,
    body: { graficos: { docsPorDia: [{ data: '2026-09-28', quantidade: 3 }] } },
  },
};

async function expectLayoutHealth(page, pageName) {
  const health = await page.evaluate(() => {
    const root = document.documentElement;
    const controls = [...document.querySelectorAll('button, input, select, textarea')]
      .filter((element) => {
        const style = getComputedStyle(element);
        const type = element.getAttribute('type');
        return (
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          element.getClientRects().length > 0 &&
          type !== 'hidden' &&
          type !== 'checkbox' &&
          type !== 'radio'
        );
      })
      .map((element) => ({
        label:
          element.getAttribute('aria-label') ||
          element.textContent?.trim() ||
          element.id ||
          element.tagName,
        height: element.getBoundingClientRect().height,
      }))
      .filter(({ height }) => height < 43.5);

    const clippedHeadings = [...document.querySelectorAll('h1, h2')]
      .filter((element) => element.getClientRects().length > 0)
      .filter((element) => element.scrollWidth > element.clientWidth + 1)
      .map((element) => element.textContent?.trim());

    const overflowingElements = [...document.querySelectorAll('body *')]
      .filter((element) => element.getClientRects().length > 0)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          selector: `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}${element.classList.length ? `.${[...element.classList].join('.')}` : ''}`,
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        };
      })
      .filter(({ left, right }) => left < -1 || right > window.innerWidth + 1)
      .slice(0, 10);

    return {
      overflow: root.scrollWidth - root.clientWidth,
      controls,
      clippedHeadings,
      overflowingElements,
    };
  });

  expect(
    health.overflow,
    `${pageName} has horizontal page overflow: ${JSON.stringify(health.overflowingElements)}`
  ).toBeLessThanOrEqual(1);
  expect(health.controls, `${pageName} has controls below 44px`).toEqual([]);
  expect(health.clippedHeadings, `${pageName} has clipped headings`).toEqual([]);

  const focusTarget = page
    .locator('button:visible, input:not([type="checkbox"]):not([type="radio"]):visible')
    .first();
  if (await focusTarget.count()) {
    await focusTarget.focus();
    const focus = await focusTarget.evaluate((element) => {
      const style = getComputedStyle(element);
      return { outline: style.outlineStyle, shadow: style.boxShadow };
    });
    expect(
      focus.outline !== 'none' || focus.shadow !== 'none',
      `${pageName} lacks visible focus`
    ).toBeTruthy();
  }
}

test.describe.configure({ timeout: 120_000 });

for (const viewport of viewports) {
  for (const darkTheme of [false, true]) {
    for (const company of companies) {
      test(`${viewport.slug} ${darkTheme ? 'dark' : 'light'} ${company.slug}`, async ({ page }) => {
        await mkdir(resolve('test-results/visual-matrix'), { recursive: true });
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await installSession(page, { role: 'master', company, darkTheme });
        await mockApi(page, {
          ...responses,
          '/api/empresas': {
            status: 200,
            body: [
              {
                id: company.id,
                nome: company.nome,
                slug: company.slug,
                total_usuarios: 1,
                total_clientes: 1,
                total_templates: 1,
                config: { temaCor: company.temaCor, temaCorSecundaria: company.temaCorSecundaria },
              },
            ],
          },
        });

        for (const pageName of authenticatedPages) {
          await page.goto(`/${pageName}`);
          await expectLayoutHealth(page, pageName);

          if (criticalPages.has(pageName) && viewport.slug !== 'tablet') {
            await page.screenshot({
              path: resolve(
                'test-results/visual-matrix',
                `${pageName.replace('.html', '')}-${viewport.slug}-${darkTheme ? 'dark' : 'light'}-${company.slug}.png`
              ),
              fullPage: true,
            });
          }
        }
      });
    }
  }
}

for (const viewport of viewports) {
  for (const darkTheme of [false, true]) {
    test(`login ${viewport.slug} ${darkTheme ? 'dark' : 'light'}`, async ({ browser }) => {
      const context = await browser.newContext({ viewport });
      await context.addInitScript(
        (dark) => localStorage.setItem('darkTheme', String(dark)),
        darkTheme
      );
      const page = await context.newPage();
      await page.goto('http://127.0.0.1:7101/');
      await expectLayoutHealth(page, 'index.html');
      if (viewport.slug !== 'tablet') {
        await mkdir(resolve('test-results/visual-matrix'), { recursive: true });
        await page.screenshot({
          path: resolve(
            'test-results/visual-matrix',
            `login-${viewport.slug}-${darkTheme ? 'dark' : 'light'}.png`
          ),
          fullPage: true,
        });
      }
      await context.close();
    });
  }
}
