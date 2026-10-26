import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import {readFileSync} from 'node:fs';
const tools: {slug:string;anchor:string}[]=JSON.parse(readFileSync(new URL('../../src/data/tools.json',import.meta.url),'utf8'));

async function open(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator('html')).toHaveAttribute('data-tools-ready', 'true');
}
async function png(page: Page, width = 2, height = 2) {
  return Buffer.from(await page.evaluate(({ width, height }) => {
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    const context = canvas.getContext('2d')!; context.fillStyle = '#00ff00'; context.fillRect(0, 0, width, height);
    return canvas.toDataURL('image/png').split(',')[1];
  }, { width, height }), 'base64');
}

for (const tool of tools) {
  test(`isolated form: ${tool.slug}`, async ({ page }) => {
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await open(page, `/tools/${tool.slug}/`);
    await expect(page.locator('.tool-card')).toHaveCount(1);
    await expect(page.locator('.tool-card')).toHaveAttribute('id', tool.anchor);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('.related-tools a')).not.toHaveCount(0);
    expect(errors).toEqual([]);
  });
}

test('mobile directory search and category filtering', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await open(page, '/');
  await expect(page.locator('.tool-card')).toHaveCount(0);
  await expect(page.locator('.directory-card')).toHaveCount(tools.length);
  await page.locator('#tool-search').fill('anagram');
  await expect(page.locator('.directory-card:visible')).toHaveCount(1);
  await page.locator('.directory-card:visible a').click();
  await expect(page).toHaveURL(/\/tools\/anagram-checker\/$/);
  await open(page, '/'); await page.locator('#tool-category').selectOption('pdf');
  await expect(page.locator('.directory-card:visible')).toHaveCount(6);
  await page.locator('#tool-search').fill('no-such-tool-8392');
  await expect(page.locator('#directory-count')).toHaveText('0 / 85');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('keyboard order reaches selected tool and language switch preserves it', async ({ page }) => {
  await open(page, '/tools/anagram-checker/');
  await page.locator('.seo-guide .button-primary').focus(); await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement?.closest('.tool-card')?.id)).toBe('anagram-check-tool');
  await page.locator('#language-select').selectOption('en');
  await expect(page).toHaveURL(/\/en\/tools\/anagram-checker\/$/);
  await expect(page.locator('h1')).toHaveText('Anagram checker');
});

test('Arabic directory retains RTL and functional filters', async ({ page }) => {
  await open(page, '/ar/'); await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await page.locator('#tool-category').selectOption('audio');
  await expect(page.locator('.directory-card:visible')).toHaveCount(3);
});

test('image conversion downloads correct bytes and rejects oversized dimensions', async ({ page }) => {
  await open(page, '/tools/image-converter/'); const tiny = await png(page);
  await page.locator('#image-file').setInputFiles({ name: 'tiny.png', mimeType: 'image/png', buffer: tiny });
  await page.locator('#image-format').selectOption('image/png');
  const download = page.waitForEvent('download'); await page.locator('#convert-image').click();
  const result = await download, bytes = await readFile((await result.path())!);
  expect(result.suggestedFilename()).toBe('tiny.png'); expect(bytes.readUInt32BE(16)).toBe(2);
  await page.locator('#image-file').setInputFiles({ name: 'wide.png', mimeType: 'image/png', buffer: await png(page, 8193, 1) });
  await page.locator('#convert-image').click(); await expect(page.locator('#image-feedback')).toHaveClass(/error/);
});

test('replacing a file cancels pending image encoding', async ({ page }) => {
  await open(page, '/tools/image-converter/'); const tiny = await png(page), downloads: string[] = [];
  page.on('download', download => downloads.push(download.suggestedFilename()));
  await page.locator('#image-file').setInputFiles({ name: 'first.png', mimeType: 'image/png', buffer: tiny });
  await page.locator('#image-format').selectOption('image/png');
  await page.evaluate(() => {
    const original = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function(callback, ...args) {
      original.call(this, blob => { (window as any).finishEncoding = () => callback(blob); }, ...args);
    };
  });
  await page.locator('#convert-image').click();
  await page.waitForFunction(() => typeof (window as any).finishEncoding === 'function');
  await page.locator('#image-file').setInputFiles({ name: 'second.png', mimeType: 'image/png', buffer: tiny });
  await page.evaluate(() => (window as any).finishEncoding());
  await expect(page.locator('#convert-image')).toBeEnabled();
  await page.waitForTimeout(150); expect(downloads).toEqual([]);
});

test('invalid image releases its temporary URL', async ({ page }) => {
  await open(page, '/tools/image-converter/');
  await page.evaluate(() => {
    const create = URL.createObjectURL.bind(URL), revoke = URL.revokeObjectURL.bind(URL);
    (window as any).temporaryUrls = new Set<string>();
    URL.createObjectURL = value => { const url = create(value); (window as any).temporaryUrls.add(url); return url; };
    URL.revokeObjectURL = url => { (window as any).temporaryUrls.delete(url); revoke(url); };
  });
  await page.locator('#image-file').setInputFiles({ name: 'broken.png', mimeType: 'image/png', buffer: Buffer.from([137,80,78,71,13,10,26,10,0,0,0,0]) });
  await page.locator('#convert-image').click(); await expect(page.locator('#image-feedback')).toHaveClass(/error/);
  expect(await page.evaluate(() => (window as any).temporaryUrls.size)).toBe(0);
});

test('QR, HEX and JSON work on independent pages', async ({ page }) => {
  await open(page, '/tools/qr-code-generator/'); await page.locator('#qr-input').fill('https://minikit.top/');
  await page.locator('#generate-qr').click(); await expect(page.locator('#download-qr')).toBeEnabled();
  await open(page, '/tools/color-converter/'); await page.locator('#color-hex').fill('#f00');
  await expect(page.locator('#rgb-value')).toHaveText('255, 0, 0'); await expect(page.locator('#color-picker')).toHaveValue('#ff0000');
  await open(page, '/tools/json-formatter/'); await page.locator('#json-input').fill('{"hello":1}');
  await page.locator('[data-dev-tool="json"][data-dev-action="format"]').click();
  await expect(page.locator('#json-output')).toHaveValue('{\n  "hello": 1\n}');
});

test('images create a downloadable two-page PDF', async ({ page }) => {
  const { PDFDocument } = await import('pdf-lib');
  await open(page, '/tools/images-to-pdf/'); const buffer = await png(page);
  await page.locator('#images-pdf-files').setInputFiles([
    { name: 'one.png', mimeType: 'image/png', buffer }, { name: 'two.png', mimeType: 'image/png', buffer },
  ]);
  await page.locator('#images-pdf-apply').click(); await expect(page.locator('#images-pdf-download')).toBeEnabled();
  const event = page.waitForEvent('download'); await page.locator('#images-pdf-download').click();
  const bytes = await readFile((await (await event).path())!);
  expect((await PDFDocument.load(bytes)).getPageCount()).toBe(2);
});

test('date difference reports one calendar day', async ({ page }) => {
  await open(page, '/en/tools/date-difference/');
  await page.locator('#date-diff-start').fill('2026-01-01'); await page.locator('#date-diff-end').fill('2026-01-02');
  await page.locator('#date-diff-date-apply').click();
  await expect(page.locator('#date-diff-date-output')).toHaveValue(/1/);
  await expect(page.locator('#date-diff-date-feedback')).not.toHaveClass(/error/);
});
