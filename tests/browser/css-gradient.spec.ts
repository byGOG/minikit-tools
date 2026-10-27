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
  await page.goto(`/${locale}/tools/css-gradient-generator/`);
  await expect(page.locator('html')).toHaveAttribute('data-tools-ready', 'true');
}

async function picker(page: Page, side: string, value: string) {
  await page.locator(`#gradient-${side}-picker`).evaluate((element, value) => {
    (element as HTMLInputElement).value = value;
    element.dispatchEvent(new Event('input', { bubbles:true }));
    element.dispatchEvent(new Event('change', { bubbles:true }));
  }, value);
}
async function neutral(page: Page) {
  await expect(page.locator('#gradient-output')).toHaveValue('');
  await expect(page.locator('#gradient-copy')).toBeDisabled();
  await expect(page.locator('#gradient-feedback')).toHaveText('');
  await expect(page.locator('#gradient-preview')).toHaveCSS('background-image', 'none');
}
test('default CSS, preview, bidirectional picker sync and clear remain local', async ({ page, baseURL }) => {
  if (!baseURL) throw new Error('Gradient privacy test requires baseURL');
  const origin = new URL(baseURL).origin, leaks:string[] = [];
  await page.route('**/*', route => {
    const request=route.request(), url=new URL(request.url());
    if (request.method()==='GET' && url.origin==='https://static.cloudflareinsights.com' &&
      (url.pathname==='/beacon.min.js'||url.pathname.startsWith('/beacon.min.js/'))) return route.abort();
    if (request.method()!=='GET'||url.origin!==origin) { leaks.push(request.url()); return route.abort(); }
    return route.continue();
  });
  await open(page); await neutral(page);
  await page.locator('#gradient-generate').click();
  await expect(page.locator('#gradient-output')).toHaveValue('background: linear-gradient(90deg, #155c42 0%, #c7f36b 100%);');
  await expect(page.locator('#gradient-preview')).toHaveCSS('background-image', 'linear-gradient(90deg, rgb(21, 92, 66) 0%, rgb(199, 243, 107) 100%)');
  await expect(page.locator('#gradient-feedback')).toHaveText(en.ready);
  await expect(page.locator('#gradient-copy')).toBeEnabled();
  await page.locator('#gradient-start').fill('#ABC'); await neutral(page);
  await expect(page.locator('#gradient-start-picker')).toHaveValue('#aabbcc');
  await page.locator('#gradient-generate').click();
  await picker(page,'end','#123456'); await neutral(page);
  await expect(page.locator('#gradient-end')).toHaveValue('#123456');
  await page.locator('#gradient-start').fill('url(https://privacy-sentinel.invalid/pixel)');
  await page.locator('#gradient-generate').click();
  await expect(page.locator('#gradient-feedback')).toHaveText(en.gradientInvalid);
  await expect(page.locator('#gradient-feedback')).toHaveClass(/error/);
  await expect(page.locator('#gradient-preview')).toHaveCSS('background-image','none');
  await page.locator('#gradient-clear').click(); await neutral(page);
  await expect(page.locator('#gradient-start')).toHaveValue('#155c42'); await expect(page.locator('#gradient-start-picker')).toHaveValue('#155c42');
  await expect(page.locator('#gradient-end')).toHaveValue('#c7f36b'); await expect(page.locator('#gradient-end-picker')).toHaveValue('#c7f36b');
  await expect(page.locator('#gradient-angle')).toHaveValue('90'); expect(leaks).toEqual([]);
});
test('invalid colors and angles reject without clamping or truncation', async ({ page }) => {
  await open(page);
  for (const value of ['#abcd','red','rgb(0,0,0)','#fff; color:red',' '.repeat(29)+'#abc']) {
    await page.locator('#gradient-start').fill(value); await expect(page.locator('#gradient-start')).toHaveValue(value);
    await page.locator('#gradient-generate').click();
    await expect(page.locator('#gradient-feedback')).toHaveText(en.gradientInvalid);
    await expect(page.locator('#gradient-output')).toHaveValue('');
    await expect(page.locator('#gradient-copy')).toBeDisabled();
    await expect(page.locator('#gradient-preview')).toHaveCSS('background-image','none');
  }
  await page.locator('#gradient-start').fill('#000');
  for (const value of ['', '-1','361','90.5']) {
    await page.locator('#gradient-angle').fill(value); await page.locator('#gradient-generate').click();
    await expect(page.locator('#gradient-feedback')).toHaveText(en.gradientInvalid);
    await expect(page.locator('#gradient-output')).toHaveValue('');
  }
  for (const value of ['0','360']) {
    await page.locator('#gradient-angle').fill(value); await neutral(page);
    await page.locator('#gradient-generate').click();
    await expect(page.locator('#gradient-output')).toHaveValue(`background: linear-gradient(${value}deg, #000000 0%, #c7f36b 100%);`);
  }
});
for (const outcome of ['resolve','reject']) {
  test(`stale clipboard ${outcome} preserves newer validation`, async ({ page }) => {
    await open(page);
    await page.evaluate(() => {
      Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:(value:string)=>{
        (window as any).gradientCopied=value;
        return new Promise<void>((resolve,reject)=>{(window as any).finishGradientCopy={resolve,reject};});
      }}});
    });
    await page.locator('#gradient-generate').click(); await page.locator('#gradient-copy').click();
    await page.waitForFunction(()=>Boolean((window as any).finishGradientCopy));
    expect(await page.evaluate(()=>(window as any).gradientCopied)).toBe('background: linear-gradient(90deg, #155c42 0%, #c7f36b 100%);');
    await page.locator('#gradient-end').fill('bad'); await page.locator('#gradient-generate').click();
    await page.evaluate(async outcome=>{(window as any).finishGradientCopy[outcome]();await new Promise(resolve=>setTimeout(resolve,0));},outcome);
    await expect(page.locator('#gradient-feedback')).toHaveText(en.gradientInvalid);
    await expect(page.locator('#gradient-feedback')).toHaveClass(/error/);
    await expect(page.locator('#gradient-output')).toHaveValue(''); await expect(page.locator('#gradient-copy')).toBeDisabled();
  });
}
test('Arabic mobile preview and CSS stay within viewport with LTR output', async ({ page }) => {
  await page.setViewportSize({width:390,height:844}); await open(page,'ar');
  await expect(page.locator('html')).toHaveAttribute('dir','rtl'); await page.locator('#gradient-generate').click();
  await expect(page.locator('#gradient-output')).toHaveAttribute('dir','ltr');
  await expect(page.locator('#gradient-output')).toHaveValue('background: linear-gradient(90deg, #155c42 0%, #c7f36b 100%);');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
