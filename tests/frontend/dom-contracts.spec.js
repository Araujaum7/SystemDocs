import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const contracts = JSON.parse(
  await readFile(resolve('tests/frontend/fixtures/dom-contracts.json'), 'utf8')
);

function valuesFrom(html, pattern) {
  return [...html.matchAll(pattern)].map((match) => match[1]);
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

for (const [pageName, contract] of Object.entries(contracts)) {
  test(`${pageName} preserves its DOM behavior contract`, async () => {
    const html = await readFile(resolve('frontend', pageName), 'utf8');
    const ids = valuesFrom(html, /\bid="([^"]+)"/g);
    const forms = valuesFrom(html, /<form\b[^>]*\bid="([^"]+)"/g);
    const scripts = valuesFrom(html, /<script\b[^>]*src="([^"]+)"/g);
    const classTokens = valuesFrom(html, /\bclass="([^"]+)"/g).flatMap((value) =>
      value.split(/\s+/)
    );

    expect(ids, `${pageName} must not contain duplicate IDs`).toHaveLength(new Set(ids).size);
    expect(uniqueSorted(ids)).toEqual(uniqueSorted(contract.ids));
    expect(uniqueSorted(forms)).toEqual(uniqueSorted(contract.forms));
    expect(scripts).toEqual(contract.scripts);

    for (const permissionClass of contract.permissionClasses) {
      expect(classTokens).toContain(permissionClass);
    }
  });
}
