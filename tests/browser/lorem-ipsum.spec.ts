import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
const en: Record<string, string> = JSON.parse(readFileSync(new URL('../../src/i18n/locales/en.json', import.meta.url), 'utf8'));
async function open(page: Page) {
  await page.goto('/en/tools/lorem-ipsum-generator/');
  await expect(page.locator('html')).toHaveAttribute('data-tools-ready', 'true');
}

test('default generation, input invalidation, exact small example and clear defaults stay local', async ({ page, baseURL }) => {
  if (!baseURL) throw new Error('Lorem privacy test requires baseURL');
  const allowedOrigin = new URL(baseURL).origin, leaks: string[] = [];
  await page.route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    if (request.method() === 'GET' && url.origin === 'https://static.cloudflareinsights.com' &&
      (url.pathname === '/beacon.min.js' || url.pathname.startsWith('/beacon.min.js/'))) return route.abort();
    if (request.method() !== 'GET' || url.origin !== allowedOrigin) {
      leaks.push(request.url()); return route.abort();
    }
    return route.continue();
  });
  await open(page);
  const output = page.locator('#lorem-output'), feedback = page.locator('#lorem-feedback'), copy = page.locator('#lorem-copy');
  await expect(page.locator('#lorem-paragraphs')).toHaveValue('3');
  await expect(page.locator('#lorem-words')).toHaveValue('50');
  await page.locator('#lorem-generate').click();
  const blocks = (await output.inputValue()).split('\n\n');
  expect(blocks).toHaveLength(3);
  for (const block of blocks) expect(block.split(/\s+/)).toHaveLength(50);
  await expect(feedback).toHaveText(en.ready); await expect(copy).toBeEnabled();
  await page.locator('#lorem-paragraphs').fill('1');
  await expect(output).toHaveValue(''); await expect(copy).toBeDisabled(); await expect(feedback).toHaveText('');
  await page.locator('#lorem-words').fill('5'); await page.locator('#lorem-generate').click();
  await expect(output).toHaveValue('Lorem ipsum dolor sit amet.');
  await page.locator('#lorem-clear').click();
  await expect(page.locator('#lorem-paragraphs')).toHaveValue('3');
  await expect(page.locator('#lorem-words')).toHaveValue('50');
  await expect(output).toHaveValue(''); await expect(copy).toBeDisabled(); await expect(feedback).toHaveText('');
  expect(leaks).toEqual([]);
});

test('blank, fractional and out-of-range counts show exact validation instead of clamping', async ({ page }) => {
  await open(page);
  for (const [paragraphs, words] of [['', '50'], ['3', ''], ['1.5', '50'], ['3', '5.5'], ['0', '50'], ['51', '50'], ['3', '4'], ['3', '201']]) {
    await page.locator('#lorem-paragraphs').fill(paragraphs); await page.locator('#lorem-words').fill(words);
    await page.locator('#lorem-generate').click();
    await expect(page.locator('#lorem-feedback')).toHaveText(en.loremInvalid);
    await expect(page.locator('#lorem-feedback')).toHaveClass(/error/);
    await expect(page.locator('#lorem-output')).toHaveValue('');
    await expect(page.locator('#lorem-copy')).toBeDisabled();
  }
});

for (const outcome of ['resolve', 'reject']) {
  test(`pending clipboard ${outcome} cannot overwrite a later validation message`, async ({ page }) => {
    await open(page);
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
        writeText: (text: string) => {
          (window as any).copiedLorem = text;
          return new Promise<void>((resolve, reject) => { (window as any).finishLoremCopy = { resolve, reject }; });
        },
      } });
    });
    await page.locator('#lorem-paragraphs').fill('1'); await page.locator('#lorem-words').fill('5');
    await page.locator('#lorem-generate').click(); await page.locator('#lorem-copy').click();
    await page.waitForFunction(() => Boolean((window as any).finishLoremCopy));
    expect(await page.evaluate(() => (window as any).copiedLorem)).toBe('Lorem ipsum dolor sit amet.');
    await page.locator('#lorem-words').fill(''); await page.locator('#lorem-generate').click();
    await expect(page.locator('#lorem-feedback')).toHaveText(en.loremInvalid);
    await page.evaluate(async outcome => {
      (window as any).finishLoremCopy[outcome]();
      await new Promise(resolve => setTimeout(resolve, 0));
    }, outcome);
    await expect(page.locator('#lorem-feedback')).toHaveText(en.loremInvalid);
    await expect(page.locator('#lorem-feedback')).toHaveClass(/error/);
    await expect(page.locator('#lorem-output')).toHaveValue('');
    await expect(page.locator('#lorem-copy')).toBeDisabled();
  });
}
