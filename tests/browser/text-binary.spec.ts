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
  await page.goto(`${locale === 'tr' ? '' : '/' + locale}/tools/text-binary-converter/`);
  await expect(page.locator('html')).toHaveAttribute('data-tools-ready', 'true');
}

for(const locale of ['en','tr'])test(`${locale} UTF-8 conversion, invalidation, defaults and privacy`,async({page,baseURL})=>{
  if(!baseURL)throw new Error('Binary privacy test requires baseURL');const origin=new URL(baseURL).origin,leaks:string[]=[];
  await page.route('**/*',route=>{const request=route.request(),url=new URL(request.url());
    if(request.method()==='GET'&&url.origin==='https://static.cloudflareinsights.com'&&(url.pathname==='/beacon.min.js'||url.pathname.startsWith('/beacon.min.js/')))return route.abort();
    if(request.method()!=='GET'||url.origin!==origin){leaks.push(request.url());return route.abort();}return route.continue();});
  await open(page,locale);const input=page.locator('#binary-input'),output=page.locator('#binary-output'),copy=page.locator('#binary-copy'),feedback=page.locator('#binary-feedback');
  await expect(page.locator('#binary-mode')).toHaveValue('encode');await input.fill('A');await page.locator('#binary-convert').click();
  await expect(output).toHaveValue('01000001');await expect(output).toHaveAttribute('dir','ltr');await expect(copy).toBeEnabled();await expect(feedback).toHaveText(dictionaries[locale].ready);
  const text='\uFEFFTürkçe 🙂\n ';await input.fill(text);await expect(output).toHaveValue('');await expect(copy).toBeDisabled();await expect(feedback).toHaveText('');
  await page.locator('#binary-convert').click();const code=await output.inputValue();
  await page.locator('#binary-mode').selectOption('decode');await expect(output).toHaveValue('');await expect(copy).toBeDisabled();await expect(feedback).toHaveText('');
  await input.fill(code);await page.locator('#binary-convert').click();await expect(output).toHaveValue(text);await expect(output).toHaveAttribute('dir','auto');
  await input.fill('11000011');await page.locator('#binary-convert').click();await expect(feedback).toHaveText(dictionaries[locale].binaryInvalid);await expect(feedback).toHaveClass(/error/);await expect(output).toHaveValue('');
  await page.locator('#binary-clear').click();await expect(page.locator('#binary-mode')).toHaveValue('encode');await expect(input).toHaveValue('');await expect(output).toHaveValue('');await expect(copy).toBeDisabled();await expect(feedback).toHaveText('');expect(leaks).toEqual([]);
});
test('invalid tokens and oversized text reject without truncation',async({page})=>{
  await open(page);await page.locator('#binary-input').fill('a'.repeat(5001));await expect(page.locator('#binary-input')).toHaveValue('a'.repeat(5001));await page.locator('#binary-convert').click();
  await expect(page.locator('#binary-feedback')).toHaveText(dictionaries.en.binaryInvalid);
  await page.locator('#binary-mode').selectOption('decode');
  for(const value of ['','0100000','0100000x','11000000 10101111',Array(5001).fill('01000001').join(' ')]){
    await page.locator('#binary-input').fill(value);await page.locator('#binary-convert').click();await expect(page.locator('#binary-feedback')).toHaveText(dictionaries.en.binaryInvalid);await expect(page.locator('#binary-feedback')).toHaveClass(/error/);await expect(page.locator('#binary-output')).toHaveValue('');await expect(page.locator('#binary-copy')).toBeDisabled();
  }
});
for(const outcome of ['resolve','reject'])test(`stale clipboard ${outcome} preserves later validation`,async({page})=>{
  await open(page);await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:(value:string)=>{(window as any).binaryCopied=value;return new Promise<void>((resolve,reject)=>{(window as any).finishBinaryCopy={resolve,reject};});}}});});
  await page.locator('#binary-input').fill('A');await page.locator('#binary-convert').click();await page.locator('#binary-copy').click();await page.waitForFunction(()=>Boolean((window as any).finishBinaryCopy));expect(await page.evaluate(()=>(window as any).binaryCopied)).toBe('01000001');
  await page.locator('#binary-input').fill('');await page.locator('#binary-convert').click();
  await page.evaluate(async outcome=>{(window as any).finishBinaryCopy[outcome]();await new Promise(resolve=>setTimeout(resolve,0));},outcome);
  await expect(page.locator('#binary-feedback')).toHaveText(dictionaries.en.binaryInvalid);await expect(page.locator('#binary-feedback')).toHaveClass(/error/);await expect(page.locator('#binary-output')).toHaveValue('');await expect(page.locator('#binary-copy')).toBeDisabled();
});
test('Arabic mobile binary stays LTR and decoded Arabic uses auto direction',async({page})=>{
  await page.setViewportSize({width:390,height:844});await open(page,'ar');await expect(page.locator('html')).toHaveAttribute('dir','rtl');
  await page.locator('#binary-input').fill('مرحبا');await page.locator('#binary-convert').click();await expect(page.locator('#binary-output')).toHaveAttribute('dir','ltr');const code=await page.locator('#binary-output').inputValue();
  await page.locator('#binary-mode').selectOption('decode');await page.locator('#binary-input').fill(code);await page.locator('#binary-convert').click();await expect(page.locator('#binary-output')).toHaveValue('مرحبا');await expect(page.locator('#binary-output')).toHaveAttribute('dir','auto');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
