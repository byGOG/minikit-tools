import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function openTool(page: Page, slug: string) {
  await page.goto(`/tools/${slug}/`);
  await expect(page.locator('html')).toHaveAttribute('data-tools-ready', 'true');
}

test('changing QR input cancels an old encoding without replacing a newer result', async ({ page }) => {
  await openTool(page, 'qr-code-generator');
  await page.evaluate(() => {
    const scope = window as typeof window & {
      qrRegression: { holdNext: boolean; urls: string[]; release?: () => void };
    };
    scope.qrRegression = { holdNext: true, urls: [] };
    const original = HTMLCanvasElement.prototype.toDataURL;
    // qrcode's Promise assimilates the renderer result. Hold only the first
    // encoding after rendering real pixels, without depending on chunk names.
    Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
      configurable: true,
      value: function (this: HTMLCanvasElement, ...args: Parameters<HTMLCanvasElement['toDataURL']>) {
        const url = original.apply(this, args), state = scope.qrRegression;
        state.urls.push(url);
        if (!state.holdNext) return url;
        state.holdNext = false;
        return new Promise<string>(resolve => { state.release = () => resolve(url); });
      },
    });
  });

  const first = 'https://example.com/first-qr';
  const second = 'https://example.com/second-qr';
  const input = page.locator('#qr-input'), generate = page.locator('#generate-qr');
  const image = page.locator('#qr-image'), download = page.locator('#download-qr');
  await input.fill(first); await generate.click();
  await page.waitForFunction(() => typeof (window as any).qrRegression.release === 'function');
  await expect(generate).toBeDisabled();

  await input.fill(second);
  await expect(image).toBeHidden();
  await expect(image).not.toHaveAttribute('src');
  await expect(download).toBeHidden(); await expect(download).toBeDisabled();
  await expect(generate).toBeVisible(); await expect(generate).toBeEnabled();
  await generate.click();
  await expect(download).toBeVisible(); await expect(download).toBeEnabled();
  const [oldResult, newResult] = await page.evaluate(() => (window as any).qrRegression.urls as string[]);
  expect(oldResult).toMatch(/^data:image\/png;base64,/);
  expect(newResult).toMatch(/^data:image\/png;base64,/);
  expect(newResult).not.toBe(oldResult);
  await expect(image).toHaveAttribute('src', newResult);

  await page.evaluate(async () => {
    (window as any).qrRegression.release();
    // Let the resolved renderer Promise and async click handler finish before
    // checking that stale work did not overwrite the newer preview/download.
    await new Promise<void>(resolve => setTimeout(resolve, 0));
  });
  await expect(image).toHaveAttribute('src', newResult);
  await expect(download).toBeEnabled();
  const newDownload = page.waitForEvent('download'); await download.click();
  const newBytes = await readFile((await (await newDownload).path())!);
  expect(newBytes).toEqual(Buffer.from(newResult.split(',')[1], 'base64'));

  // Re-requesting the first value must still produce its original real QR.
  await input.fill(first); await generate.click();
  await expect(image).toHaveAttribute('src', oldResult);
  await expect(download).toBeEnabled();
  const firstDownload = page.waitForEvent('download'); await download.click();
  const firstBytes = await readFile((await (await firstDownload).path())!);
  expect(firstBytes).toEqual(Buffer.from(oldResult.split(',')[1], 'base64'));
});

test('Markdown preview strips active markup and keeps its network sandbox', async ({ page }) => {
  const attemptedLeaks: string[] = [];
  // Intercept before any input is supplied: even a regression must never send
  // the marker to an external service. .invalid is also a non-routable domain.
  await page.route('https://privacy-sentinel.invalid/**', route => {
    attemptedLeaks.push(route.request().url());
    return route.abort();
  });
  await openTool(page, 'markdown-preview');
  const markerUrl = 'https://privacy-sentinel.invalid/pixel?sentinel=MINIKIT_PRIVACY_TEST';
  await page.locator('#mdpreview-suite-input').fill([
    '# Readable heading',
    `![image alternative](${markerUrl})`,
    `[external link](${markerUrl})`,
    '<script>parent.document.documentElement.dataset.markdownXss="executed"</script>',
    `<img src="${markerUrl}" onerror="parent.document.documentElement.dataset.markdownXss='executed'">`,
    `<iframe src="${markerUrl}"></iframe>`,
    `<style>@import url("${markerUrl}");</style>`,
    `<form action="${markerUrl}"><input name="sentinel" value="MINIKIT_PRIVACY_TEST"></form>`,
    '<a href="javascript:parent.document.documentElement.dataset.markdownXss=\'executed\'" onclick="alert(1)">unsafe link</a>',
    `<svg><image href="${markerUrl}"></image></svg>`,
  ].join('\n\n'));
  await page.locator('#mdpreview-suite-apply').click();
  const iframe = page.locator('#mdpreview-frame');
  await expect(iframe).toBeVisible();
  await expect(iframe).toHaveAttribute('sandbox', '');
  await expect(iframe).toHaveAttribute('referrerpolicy', 'no-referrer');
  const preview = page.frameLocator('#mdpreview-frame');
  await expect(preview.locator('h1')).toHaveText('Readable heading');
  await expect(preview.locator('body').locator(
    'script,img,iframe,object,embed,svg,form,input,link,meta,style,[onclick],[onerror],[onload],[href],[src]',
  )).toHaveCount(0);
  await expect(preview.locator('meta[http-equiv="Content-Security-Policy"]')).toHaveAttribute(
    'content', "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'",
  );
  await expect(page.locator('#mdpreview-suite-output')).toHaveValue(/<h1>Readable heading<\/h1>/);
  expect(await page.locator('html').getAttribute('data-markdown-xss')).toBeNull();
  await page.evaluate(() => new Promise<void>(resolve => setTimeout(resolve, 0)));
  expect(attemptedLeaks).toEqual([]);
});
