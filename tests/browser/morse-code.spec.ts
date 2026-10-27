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
  await page.goto(`/${locale}/tools/morse-code-translator/`);
  await expect(page.locator('html')).toHaveAttribute('data-tools-ready', 'true');
}

test('both directions, invalidation and reset stay local', async ({ page, baseURL }) => {
  if (!baseURL) throw new Error('Morse privacy test requires baseURL');
  const origin = new URL(baseURL).origin, leaks: string[] = [];
  await page.route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    if (request.method() === 'GET' && url.origin === 'https://static.cloudflareinsights.com' &&
      (url.pathname === '/beacon.min.js' || url.pathname.startsWith('/beacon.min.js/'))) return route.abort();
    if (request.method() !== 'GET' || url.origin !== origin) { leaks.push(request.url()); return route.abort(); }
    return route.continue();
  });
  await open(page);
  const input = page.locator('#morse-input'), output = page.locator('#morse-output'), copy = page.locator('#morse-copy');
  await expect(page.locator('#morse-mode')).toHaveValue('encode'); await expect(input).toHaveValue('');
  await input.fill('SoS\n 123'); await page.locator('#morse-convert').click();
  await expect(output).toHaveValue('... --- ... / .---- ..--- ...--'); await expect(copy).toBeEnabled();
  await expect(page.locator('#morse-feedback')).toHaveText(en.ready);
  await input.fill('HELLO'); await expect(output).toHaveValue(''); await expect(copy).toBeDisabled();
  await expect(page.locator('#morse-feedback')).toHaveText('');
  await page.locator('#morse-convert').click(); await expect(output).toHaveValue('.... . .-.. .-.. ---');
  await page.locator('#morse-mode').selectOption('decode'); await expect(output).toHaveValue(''); await expect(copy).toBeDisabled();
  await expect(page.locator('#morse-feedback')).toHaveText('');
  await input.fill('... --- .../.---- ..--- ...--'); await page.locator('#morse-convert').click(); await expect(output).toHaveValue('SOS 123');
  await page.locator('#morse-clear').click();
  await expect(page.locator('#morse-mode')).toHaveValue('encode'); await expect(input).toHaveValue('');
  await expect(output).toHaveValue(''); await expect(copy).toBeDisabled(); await expect(page.locator('#morse-feedback')).toHaveText('');
  expect(leaks).toEqual([]);
});

test('unsupported symbols and raw limits give exact errors without truncation', async ({ page }) => {
  await open(page);
  for (const [mode, values] of [
    ['encode', ['', 'ß', 'ı', 'é', 'SOS!', ' '.repeat(1000) + 'E']],
    ['decode', ['... // ---', '...---...', '−', '.-.-.-', ' '.repeat(6000) + '.', Array(1001).fill('.').join(' ')]],
  ] as const) {
    await page.locator('#morse-mode').selectOption(mode);
    for (const value of values) {
      await page.locator('#morse-input').fill(value); await expect(page.locator('#morse-input')).toHaveValue(value);
      await page.locator('#morse-convert').click();
      await expect(page.locator('#morse-feedback')).toHaveText(en.morseInvalid);
      await expect(page.locator('#morse-feedback')).toHaveClass(/error/);
      await expect(page.locator('#morse-output')).toHaveValue(''); await expect(page.locator('#morse-copy')).toBeDisabled();
    }
  }
  await page.locator('#morse-mode').selectOption('encode'); await page.locator('#morse-input').fill('1'.repeat(1000));
  await page.locator('#morse-convert').click();
  const code = (await page.locator('#morse-output').inputValue()); expect(code).toHaveLength(5999);
  await page.locator('#morse-mode').selectOption('decode'); await page.locator('#morse-input').fill(code);
  await page.locator('#morse-convert').click(); await expect(page.locator('#morse-output')).toHaveValue('1'.repeat(1000));
});

for (const outcome of ['resolve', 'reject']) {
  test(`stale clipboard ${outcome} preserves newer validation`, async ({ page }) => {
    await open(page);
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
        writeText: (value: string) => {
          (window as any).morseCopied = value;
          return new Promise<void>((resolve, reject) => { (window as any).finishMorseCopy = { resolve, reject }; });
        },
      } });
    });
    await page.locator('#morse-input').fill('SOS'); await page.locator('#morse-convert').click(); await page.locator('#morse-copy').click();
    await page.waitForFunction(() => Boolean((window as any).finishMorseCopy));
    expect(await page.evaluate(() => (window as any).morseCopied)).toBe('... --- ...');
    await page.locator('#morse-input').fill('ß'); await page.locator('#morse-convert').click();
    await expect(page.locator('#morse-feedback')).toHaveText(en.morseInvalid);
    await page.evaluate(async outcome => {
      (window as any).finishMorseCopy[outcome](); await new Promise(resolve => setTimeout(resolve, 0));
    }, outcome);
    await expect(page.locator('#morse-feedback')).toHaveText(en.morseInvalid);
    await expect(page.locator('#morse-feedback')).toHaveClass(/error/);
    await expect(page.locator('#morse-output')).toHaveValue(''); await expect(page.locator('#morse-copy')).toBeDisabled();
  });
}

test('Arabic mobile page retains LTR Morse output without overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await open(page, 'ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await page.locator('#morse-input').fill('SOS 123'); await page.locator('#morse-convert').click();
  await expect(page.locator('#morse-output')).toHaveValue('... --- ... / .---- ..--- ...--');
  await expect(page.locator('#morse-output')).toHaveAttribute('dir', 'ltr');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
