import { test, expect, type Page } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
const en: Record<string, string> = JSON.parse(readFileSync(new URL('../../src/i18n/locales/en.json', import.meta.url), 'utf8'));
const digest = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
async function open(page: Page) {
  await page.goto('/en/tools/file-sha256-checker/');
  await expect(page.locator('html')).toHaveAttribute('data-tools-ready', 'true');
}
async function file(page: Page, bytes: Buffer, name = 'synthetic.bin') {
  await page.locator('#filehash-file').setInputFiles({ name, mimeType: 'application/octet-stream', buffer: bytes });
}

test('raw binary and empty hashes, optional expected digest, mismatch and clearing', async ({ page, baseURL }) => {
  if (!baseURL) throw new Error('File checksum privacy test requires Playwright baseURL');
  const allowedOrigin = new URL(baseURL).origin;
  const leaks: string[] = [];
  await page.route('**/*', route => {
    const request = route.request();
    const url = new URL(request.url());
    // Block the existing RUM loader before it can start collecting anything.
    if (request.method() === 'GET' && url.origin === 'https://static.cloudflareinsights.com' && (url.pathname === '/beacon.min.js' || url.pathname.startsWith('/beacon.min.js/'))) {
      return route.abort();
    }
    if (request.method() !== 'GET' || url.origin !== allowedOrigin) {
      leaks.push(request.url()); return route.abort();
    }
    return route.continue();
  });
  await open(page);
  const bytes = Buffer.from([0, 255, 192, 128, 0, 254, 65]), hash = digest(bytes);
  const output = page.locator('#filehash-output'), expected = page.locator('#filehash-expected');
  await file(page, bytes); await expected.fill(`  ${hash.toUpperCase()}  `);
  await page.locator('#filehash-apply').click(); await expect(output).toHaveValue(hash);
  await expect(page.locator('#filehash-feedback')).toHaveText(en.fileHashMatch);
  await expect(page.locator('#filehash-feedback')).not.toHaveClass(/error/);
  await expect(page.locator('#filehash-copy')).toBeEnabled();
  await expected.fill('0'.repeat(64)); await expect(output).toHaveValue('');
  await expect(page.locator('#filehash-copy')).toBeDisabled();
  await page.locator('#filehash-apply').click(); await expect(output).toHaveValue(hash);
  await expect(page.locator('#filehash-feedback')).toHaveText(en.fileHashMismatch);
  await expect(page.locator('#filehash-feedback')).toHaveClass(/error/);
  await page.locator('#filehash-clear').click();
  await expect(output).toHaveValue(''); await expect(expected).toHaveValue('');
  await expect(page.locator('#filehash-file')).toHaveValue('');
  await expect(page.locator('#filehash-copy')).toBeDisabled();
  await file(page, Buffer.alloc(0)); await page.locator('#filehash-apply').click();
  await expect(output).toHaveValue(digest(Buffer.alloc(0)));
  expect(leaks).toEqual([]);
});

test('invalid expected digest and oversized file are rejected before reading', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    (window as any).fileReads = 0;
    const original = Blob.prototype.arrayBuffer;
    Blob.prototype.arrayBuffer = function() { (window as any).fileReads++; return original.call(this); };
  });
  await file(page, Buffer.from('abc')); await page.locator('#filehash-expected').fill('not-a-hash');
  await page.locator('#filehash-apply').click();
  await expect(page.locator('#filehash-feedback')).not.toHaveText('');
  expect(await page.evaluate(() => (window as any).fileReads)).toBe(0);
  await page.locator('#filehash-expected').fill('');
  await page.evaluate(() => {
    const file = new File(['small synthetic content'], 'oversized.bin');
    Object.defineProperty(file, 'size', { value: 50 * 1024 * 1024 + 1 });
    const files = new DataTransfer(); files.items.add(file);
    const input = document.querySelector<HTMLInputElement>('#filehash-file')!;
    input.files = files.files; input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expect(page.locator('#filehash-apply')).toBeDisabled();
  await expect(page.locator('#filehash-feedback')).toContainText(/50/);
  await expect(page.locator('#filehash-output')).toHaveValue('');
  expect(await page.evaluate(() => (window as any).fileReads)).toBe(0);
});

for (const outcome of ['success', 'error'] as const) {
  test(`stale file read ${outcome} cannot replace or unlock a newer computation`, async ({ page }) => {
    await open(page);
    await page.evaluate(() => {
      const original = Blob.prototype.arrayBuffer;
      (window as any).heldReads = [];
      Blob.prototype.arrayBuffer = function() {
        return new Promise<ArrayBuffer>((resolve, reject) => {
          (window as any).heldReads.push({ resolve: () => original.call(this).then(resolve, reject), reject: () => reject(new Error('synthetic read failure')) });
        });
      };
    });
    await file(page, Buffer.from('first')); await page.locator('#filehash-apply').click();
    await page.waitForFunction(() => (window as any).heldReads.length === 1);
    await page.locator('#filehash-clear').click();
    await expect(page.locator('#filehash-output')).toHaveValue('');
    await expect(page.locator('#filehash-copy')).toBeDisabled();
    await file(page, Buffer.from('second')); await page.locator('#filehash-apply').click();
    await page.waitForFunction(() => (window as any).heldReads.length === 2);
    await page.evaluate(async outcome => {
      const reads = (window as any).heldReads;
      await reads[0][outcome === 'success' ? 'resolve' : 'reject']();
      await new Promise(resolve => setTimeout(resolve, 0));
    }, outcome);
    await expect(page.locator('#filehash-apply')).toBeDisabled();
    await expect(page.locator('#filehash-output')).toHaveValue('');
    await page.evaluate(() => (window as any).heldReads[1].resolve());
    await expect(page.locator('#filehash-output')).toHaveValue(digest(Buffer.from('second')));
    await expect(page.locator('#filehash-apply')).toBeEnabled();
    await expect(page.locator('#filehash-copy')).toBeEnabled();
  });
}

test('expected hash changes invalidate pending native digest results', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    const original = crypto.subtle.digest.bind(crypto.subtle);
    (window as any).heldDigests = [];
    Object.defineProperty(crypto.subtle, 'digest', { configurable: true, value: (...args: Parameters<SubtleCrypto['digest']>) => {
      const realResult = original(...args);
      return new Promise<ArrayBuffer>((resolve, reject) => {
        (window as any).heldDigests.push(() => realResult.then(resolve, reject));
      });
    } });
  });
  const bytes = Buffer.from('abc'), hash = digest(bytes);
  await file(page, bytes); await page.locator('#filehash-apply').click();
  await page.waitForFunction(() => (window as any).heldDigests.length === 1);
  await page.locator('#filehash-expected').fill(hash.toUpperCase());
  await expect(page.locator('#filehash-apply')).toBeEnabled();
  await page.locator('#filehash-apply').click();
  await page.waitForFunction(() => (window as any).heldDigests.length === 2);
  await page.evaluate(async () => {
    await (window as any).heldDigests[0]();
    await new Promise(resolve => setTimeout(resolve, 0));
  });
  await expect(page.locator('#filehash-output')).toHaveValue('');
  await expect(page.locator('#filehash-apply')).toBeDisabled();
  await expect(page.locator('#filehash-copy')).toBeDisabled();
  await page.evaluate(() => (window as any).heldDigests[1]());
  await expect(page.locator('#filehash-output')).toHaveValue(hash);
  await expect(page.locator('#filehash-feedback')).toHaveText(en.fileHashMatch);
  await expect(page.locator('#filehash-feedback')).not.toHaveClass(/error/);
});
