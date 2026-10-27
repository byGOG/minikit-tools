import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
const en: Record<string, string> = JSON.parse(readFileSync(new URL('../../src/i18n/locales/en.json', import.meta.url), 'utf8'));
test.beforeEach(async ({ page }) => {
  await page.route('https://static.cloudflareinsights.com/**', route => {
    const url = new URL(route.request().url());
    if (url.origin === 'https://static.cloudflareinsights.com' &&
      (url.pathname === '/beacon.min.js' || url.pathname.startsWith('/beacon.min.js/'))) return route.abort();
    return route.fallback();
  });
});

async function open(page: Page, locale = 'en') {
  await page.goto(`/${locale}/tools/roman-numeral-converter/`);
  await expect(page.locator('html')).toHaveAttribute('data-tools-ready', 'true');
}

test('both directions, invalidation and clear defaults work without outbound data', async ({ page, baseURL }) => {
  if (!baseURL) throw new Error('Roman privacy test requires baseURL');
  const origin = new URL(baseURL).origin, leaks: string[] = [];
  await page.route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    if (request.method() === 'GET' && url.origin === 'https://static.cloudflareinsights.com' &&
      (url.pathname === '/beacon.min.js' || url.pathname.startsWith('/beacon.min.js/'))) return route.abort();
    if (request.method() !== 'GET' || url.origin !== origin) { leaks.push(request.url()); return route.abort(); }
    return route.continue();
  });
  await open(page);
  const input = page.locator('#roman-input'), output = page.locator('#roman-output'), copy = page.locator('#roman-copy');
  await expect(page.locator('#roman-mode')).toHaveValue('to-roman'); await expect(input).toHaveValue('');
  await input.fill(' 002026 '); await page.locator('#roman-convert').click();
  await expect(output).toHaveValue('MMXXVI'); await expect(copy).toBeEnabled();
  await expect(page.locator('#roman-feedback')).toHaveText(en.ready);
  await input.fill('3999'); await expect(output).toHaveValue(''); await expect(copy).toBeDisabled();
  await expect(page.locator('#roman-feedback')).toHaveText('');
  await page.locator('#roman-convert').click(); await expect(output).toHaveValue('MMMCMXCIX');
  await page.locator('#roman-mode').selectOption('to-decimal');
  await expect(output).toHaveValue(''); await expect(copy).toBeDisabled();
  await expect(page.locator('#roman-feedback')).toHaveText('');
  await input.fill(' mMxXvI '); await page.locator('#roman-convert').click(); await expect(output).toHaveValue('2026');
  await page.locator('#roman-clear').click();
  await expect(page.locator('#roman-mode')).toHaveValue('to-roman'); await expect(input).toHaveValue('');
  await expect(output).toHaveValue(''); await expect(copy).toBeDisabled(); await expect(page.locator('#roman-feedback')).toHaveText('');
  expect(leaks).toEqual([]);
});

test('invalid syntax and over-limit raw input show exact error without silent truncation', async ({ page }) => {
  await open(page);
  for (const [mode, values] of [
    ['to-roman', ['', '+1', '1.5', '1e3', '0', '4000', ' '.repeat(100) + '1']],
    ['to-decimal', ['IIII', 'IL', 'IC', 'IIV', 'VV', 'MMMM', 'Ⅳ', 'I\u0305', ' '.repeat(100) + 'I']],
  ] as const) {
    await page.locator('#roman-mode').selectOption(mode);
    for (const value of values) {
      await page.locator('#roman-input').fill(value);
      await expect(page.locator('#roman-input')).toHaveValue(value);
      await page.locator('#roman-convert').click();
      await expect(page.locator('#roman-feedback')).toHaveText(en.romanInvalid);
      await expect(page.locator('#roman-feedback')).toHaveClass(/error/);
      await expect(page.locator('#roman-output')).toHaveValue(''); await expect(page.locator('#roman-copy')).toBeDisabled();
    }
  }
});

for (const outcome of ['resolve', 'reject']) {
  test(`stale clipboard ${outcome} preserves later validation`, async ({ page }) => {
    await open(page);
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
        writeText: (value: string) => {
          (window as any).romanCopied = value;
          return new Promise<void>((resolve, reject) => { (window as any).finishRomanCopy = { resolve, reject }; });
        },
      } });
    });
    await page.locator('#roman-input').fill('2026'); await page.locator('#roman-convert').click(); await page.locator('#roman-copy').click();
    await page.waitForFunction(() => Boolean((window as any).finishRomanCopy));
    expect(await page.evaluate(() => (window as any).romanCopied)).toBe('MMXXVI');
    await page.locator('#roman-input').fill('0'); await page.locator('#roman-convert').click();
    await expect(page.locator('#roman-feedback')).toHaveText(en.romanInvalid);
    await page.evaluate(async outcome => {
      (window as any).finishRomanCopy[outcome](); await new Promise(resolve => setTimeout(resolve, 0));
    }, outcome);
    await expect(page.locator('#roman-feedback')).toHaveText(en.romanInvalid);
    await expect(page.locator('#roman-feedback')).toHaveClass(/error/);
    await expect(page.locator('#roman-output')).toHaveValue(''); await expect(page.locator('#roman-copy')).toBeDisabled();
  });
}

test('Arabic mobile page keeps numeric results left-to-right', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await open(page, 'ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await page.locator('#roman-mode').selectOption('to-decimal');
  await page.locator('#roman-input').fill('MMMCMXCIX'); await page.locator('#roman-convert').click();
  await expect(page.locator('#roman-output')).toHaveValue('3999');
  await expect(page.locator('#roman-output')).toHaveAttribute('dir', 'ltr');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
