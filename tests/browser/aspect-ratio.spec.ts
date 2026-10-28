import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
const dictionaries: Record<string, Record<string, string>> = Object.fromEntries(['en','tr'].map(locale => [locale, JSON.parse(readFileSync(new URL(`../../src/i18n/locales/${locale}.json`, import.meta.url), 'utf8'))]));
test.beforeEach(async ({ page }) => {
  await page.route('https://static.cloudflareinsights.com/**', route => {
    const url = new URL(route.request().url());
    if (url.origin === 'https://static.cloudflareinsights.com' &&
      (url.pathname === '/beacon.min.js' || url.pathname.startsWith('/beacon.min.js/'))) return route.abort();
    return route.fallback();
  });
});

async function open(page: Page, locale = 'en') {
  await page.goto(`${locale === 'tr' ? '' : '/' + locale}/tools/aspect-ratio-calculator/`);
  await expect(page.locator('html')).toHaveAttribute('data-tools-ready', 'true');
}

for(const locale of ['en','tr'])test(`${locale} known ratios, input invalidation, validation and defaults`,async({page,baseURL})=>{
  if(!baseURL)throw new Error('Aspect privacy test requires baseURL');
  const origin=new URL(baseURL).origin,leaks:string[]=[];
  await page.route('**/*',route=>{
    const request=route.request(),url=new URL(request.url());
    if(request.method()==='GET'&&url.origin==='https://static.cloudflareinsights.com'&&(url.pathname==='/beacon.min.js'||url.pathname.startsWith('/beacon.min.js/')))return route.abort();
    if(request.method()!=='GET'||url.origin!==origin){leaks.push(request.url());return route.abort();}return route.continue();
  });
  await open(page,locale);
  const output=page.locator('#aspect-output'),copy=page.locator('#aspect-copy'),feedback=page.locator('#aspect-feedback');
  await expect(page.locator('#aspect-width')).toHaveValue('1920');await expect(page.locator('#aspect-height')).toHaveValue('1080');
  await page.locator('#aspect-calculate').click();await expect(output).toHaveValue('16:9');await expect(copy).toBeEnabled();
  await expect(feedback).toHaveText(dictionaries[locale].ready);
  await page.locator('#aspect-height').fill('1920');await expect(output).toHaveValue('');await expect(copy).toBeDisabled();await expect(feedback).toHaveText('');
  await page.locator('#aspect-calculate').click();await expect(output).toHaveValue('1:1');
  await page.locator('#aspect-width').fill('1080');await expect(output).toHaveValue('');await page.locator('#aspect-calculate').click();await expect(output).toHaveValue('9:16');
  for(const value of ['','0','100001','1.5']){
    await page.locator('#aspect-width').fill(value);await page.locator('#aspect-calculate').click();
    await expect(feedback).toHaveText(dictionaries[locale].aspectInvalid);await expect(feedback).toHaveClass(/error/);
    await expect(output).toHaveValue('');await expect(copy).toBeDisabled();
  }
  await page.locator('#aspect-clear').click();await expect(page.locator('#aspect-width')).toHaveValue('1920');await expect(page.locator('#aspect-height')).toHaveValue('1080');
  await expect(output).toHaveValue('');await expect(copy).toBeDisabled();await expect(feedback).toHaveText('');expect(leaks).toEqual([]);
});
for(const outcome of ['resolve','reject'])test(`stale clipboard ${outcome} preserves newer invalid state`,async({page})=>{
  await open(page);await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:(value:string)=>{
    (window as any).aspectCopied=value;return new Promise<void>((resolve,reject)=>{(window as any).finishAspectCopy={resolve,reject};});
  }}});});
  await page.locator('#aspect-calculate').click();await page.locator('#aspect-copy').click();await page.waitForFunction(()=>Boolean((window as any).finishAspectCopy));
  expect(await page.evaluate(()=>(window as any).aspectCopied)).toBe('16:9');
  await page.locator('#aspect-height').fill('');await page.locator('#aspect-calculate').click();
  await page.evaluate(async outcome=>{(window as any).finishAspectCopy[outcome]();await new Promise(resolve=>setTimeout(resolve,0));},outcome);
  await expect(page.locator('#aspect-feedback')).toHaveText(dictionaries.en.aspectInvalid);await expect(page.locator('#aspect-feedback')).toHaveClass(/error/);
  await expect(page.locator('#aspect-output')).toHaveValue('');await expect(page.locator('#aspect-copy')).toBeDisabled();
});
test('Arabic mobile portrait ratio stays LTR without viewport overflow',async({page})=>{
  await page.setViewportSize({width:390,height:844});await open(page,'ar');await expect(page.locator('html')).toHaveAttribute('dir','rtl');
  await page.locator('#aspect-width').fill('1080');await page.locator('#aspect-height').fill('1920');await page.locator('#aspect-calculate').click();
  await expect(page.locator('#aspect-output')).toHaveValue('9:16');await expect(page.locator('#aspect-output')).toHaveAttribute('dir','ltr');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
