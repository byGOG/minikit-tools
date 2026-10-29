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
  await page.goto(`${locale === 'tr' ? '' : '/' + locale}/tools/decimal-to-fraction/`);
  await expect(page.locator('html')).toHaveAttribute('data-tools-ready', 'true');
}

for(const locale of ['en','tr'])test(`${locale} exact decimal conversion, invalidation and defaults stay local`,async({page,baseURL})=>{
  if(!baseURL)throw new Error('Decimal fraction privacy test requires baseURL');const origin=new URL(baseURL).origin,leaks:string[]=[];
  await page.route('**/*',route=>{const request=route.request(),url=new URL(request.url());
    if(request.method()==='GET'&&url.origin==='https://static.cloudflareinsights.com'&&(url.pathname==='/beacon.min.js'||url.pathname.startsWith('/beacon.min.js/')))return route.abort();
    if(request.method()!=='GET'||url.origin!==origin){leaks.push(request.url());return route.abort();}return route.continue();});
  await open(page,locale);const input=page.locator('#decimal-fraction-input'),output=page.locator('#decimal-fraction-output'),copy=page.locator('#decimal-fraction-copy'),feedback=page.locator('#decimal-fraction-feedback');
  await expect(input).toHaveValue('0.125');await page.locator('#decimal-fraction-convert').click();await expect(output).toHaveValue('1/8');await expect(feedback).toHaveText(dictionaries[locale].ready);await expect(copy).toBeEnabled();
  for(const [value,result]of [[' -1,25 ','-5/4'],['+.5','1/2'],['-0.000','0'],['999999999999.999999999999','999999999999999999999999/1000000000000']]){
    await input.fill(value);await expect(output).toHaveValue('');await expect(copy).toBeDisabled();await expect(feedback).toHaveText('');await page.locator('#decimal-fraction-convert').click();await expect(output).toHaveValue(result);
  }
  await page.locator('#decimal-fraction-clear').click();await expect(input).toHaveValue('0.125');await expect(output).toHaveValue('');await expect(copy).toBeDisabled();await expect(feedback).toHaveText('');expect(leaks).toEqual([]);
});
test('invalid syntax, precision and raw length show exact errors without truncation',async({page})=>{
  await open(page);
  for(const value of ['','1.','1e-3','1/2','0.(3)','1,000.5','1000000000000','.1234567890123',' '.repeat(60)+'0.125']){
    await page.locator('#decimal-fraction-input').fill(value);await expect(page.locator('#decimal-fraction-input')).toHaveValue(value);await page.locator('#decimal-fraction-convert').click();
    await expect(page.locator('#decimal-fraction-feedback')).toHaveText(dictionaries.en.decimalFractionInvalid);await expect(page.locator('#decimal-fraction-feedback')).toHaveClass(/error/);await expect(page.locator('#decimal-fraction-output')).toHaveValue('');await expect(page.locator('#decimal-fraction-copy')).toBeDisabled();
  }
  await page.locator('#decimal-fraction-input').fill(' '.repeat(59)+'0.125');await page.locator('#decimal-fraction-convert').click();await expect(page.locator('#decimal-fraction-output')).toHaveValue('1/8');
});
for(const outcome of ['resolve','reject'])test(`stale clipboard ${outcome} preserves newer validation`,async({page})=>{
  await open(page);await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:(value:string)=>{(window as any).decimalCopied=value;return new Promise<void>((resolve,reject)=>{(window as any).finishDecimalCopy={resolve,reject};});}}});});
  await page.locator('#decimal-fraction-convert').click();await page.locator('#decimal-fraction-copy').click();await page.waitForFunction(()=>Boolean((window as any).finishDecimalCopy));expect(await page.evaluate(()=>(window as any).decimalCopied)).toBe('1/8');
  await page.locator('#decimal-fraction-input').fill('1.');await page.locator('#decimal-fraction-convert').click();await page.evaluate(async outcome=>{(window as any).finishDecimalCopy[outcome]();await new Promise(resolve=>setTimeout(resolve,0));},outcome);
  await expect(page.locator('#decimal-fraction-feedback')).toHaveText(dictionaries.en.decimalFractionInvalid);await expect(page.locator('#decimal-fraction-feedback')).toHaveClass(/error/);await expect(page.locator('#decimal-fraction-output')).toHaveValue('');await expect(page.locator('#decimal-fraction-copy')).toBeDisabled();
});
test('Arabic mobile exact result remains LTR without overflow',async({page})=>{
  await page.setViewportSize({width:390,height:844});await open(page,'ar');await expect(page.locator('html')).toHaveAttribute('dir','rtl');
  await page.locator('#decimal-fraction-input').fill('-999999999999.999999999999');await page.locator('#decimal-fraction-convert').click();await expect(page.locator('#decimal-fraction-output')).toHaveValue('-999999999999999999999999/1000000000000');await expect(page.locator('#decimal-fraction-output')).toHaveAttribute('dir','ltr');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
