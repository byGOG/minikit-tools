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
  await page.goto(`${locale === 'tr' ? '' : '/' + locale}/tools/random-number-generator/`);
  await expect(page.locator('html')).toHaveAttribute('data-tools-ready', 'true');
}

for(const locale of ['en','tr'])test(`${locale} random ranges, deterministic equal endpoints and reset stay local`,async({page,baseURL})=>{
  if(!baseURL)throw new Error('Random privacy test requires baseURL');const origin=new URL(baseURL).origin,leaks:string[]=[];
  await page.route('**/*',route=>{const request=route.request(),url=new URL(request.url());
    if(request.method()==='GET'&&url.origin==='https://static.cloudflareinsights.com'&&(url.pathname==='/beacon.min.js'||url.pathname.startsWith('/beacon.min.js/')))return route.abort();
    if(request.method()!=='GET'||url.origin!==origin){leaks.push(request.url());return route.abort();}return route.continue();});
  await open(page,locale);const output=page.locator('#random-number-output'),copy=page.locator('#random-number-copy'),feedback=page.locator('#random-number-feedback');
  await page.locator('#random-number-generate').click();const values=(await output.inputValue()).split('\n').map(Number);expect(values).toHaveLength(10);for(const n of values){expect(Number.isInteger(n)).toBe(true);expect(n).toBeGreaterThanOrEqual(1);expect(n).toBeLessThanOrEqual(100);}
  await expect(feedback).toHaveText(dictionaries[locale].ready);await expect(copy).toBeEnabled();
  for(const [id,value]of [['min','-7'],['max','-7'],['count','3']]){await page.locator(`#random-number-${id}`).fill(value);await expect(output).toHaveValue('');await expect(copy).toBeDisabled();await expect(feedback).toHaveText('');await page.locator('#random-number-generate').click();}
  await expect(output).toHaveValue('-7\n-7\n-7');await page.locator('#random-number-clear').click();
  for(const [id,value]of [['min','1'],['max','100'],['count','10']])await expect(page.locator(`#random-number-${id}`)).toHaveValue(value);
  await expect(output).toHaveValue('');await expect(copy).toBeDisabled();await expect(feedback).toHaveText('');expect(leaks).toEqual([]);
});
test('strict raw integers and invalid bounds show exact validation',async({page})=>{
  await open(page);for(const [id,value]of [['min',''],['min','1.0000000000000001'],['min','1e-400'],['min','101'],['max','1000000001'],['count','0'],['count','101'],['count','1.5']]){
    await page.locator('#random-number-clear').click();await page.locator(`#random-number-${id}`).fill(value);await page.locator('#random-number-generate').click();await expect(page.locator('#random-number-feedback')).toHaveText(dictionaries.en.randomNumberInvalid);await expect(page.locator('#random-number-feedback')).toHaveClass(/error/);await expect(page.locator('#random-number-output')).toHaveValue('');await expect(page.locator('#random-number-copy')).toBeDisabled();
  }
});
test('random source failure has distinct message and recovers on next generation',async({page})=>{
  await open(page);await page.evaluate(()=>{
    const original=crypto.getRandomValues.bind(crypto);let fail=true;
    Object.defineProperty(crypto,'getRandomValues',{configurable:true,value:(array:Uint32Array)=>{if(fail){fail=false;throw new Error('synthetic unavailable');}return original(array);}});
  });
  await page.locator('#random-number-generate').click();await expect(page.locator('#random-number-feedback')).toHaveText(dictionaries.en.randomNumberUnavailable);await expect(page.locator('#random-number-output')).toHaveValue('');await expect(page.locator('#random-number-copy')).toBeDisabled();
  await page.locator('#random-number-generate').click();await expect(page.locator('#random-number-feedback')).toHaveText(dictionaries.en.ready);expect((await page.locator('#random-number-output').inputValue()).split('\n')).toHaveLength(10);await expect(page.locator('#random-number-copy')).toBeEnabled();
});
for(const outcome of ['resolve','reject'])test(`stale clipboard ${outcome} preserves newer validation`,async({page})=>{
  await open(page);await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:(value:string)=>{(window as any).randomCopied=value;return new Promise<void>((resolve,reject)=>{(window as any).finishRandomCopy={resolve,reject};});}}});});
  await page.locator('#random-number-min').fill('7');await page.locator('#random-number-max').fill('7');await page.locator('#random-number-count').fill('1');await page.locator('#random-number-generate').click();await page.locator('#random-number-copy').click();await page.waitForFunction(()=>Boolean((window as any).finishRandomCopy));expect(await page.evaluate(()=>(window as any).randomCopied)).toBe('7');
  await page.locator('#random-number-count').fill('0');await page.locator('#random-number-generate').click();await page.evaluate(async outcome=>{(window as any).finishRandomCopy[outcome]();await new Promise(resolve=>setTimeout(resolve,0));},outcome);
  await expect(page.locator('#random-number-feedback')).toHaveText(dictionaries.en.randomNumberInvalid);await expect(page.locator('#random-number-output')).toHaveValue('');await expect(page.locator('#random-number-copy')).toBeDisabled();
});
test('Arabic mobile deterministic output stays LTR without overflow',async({page})=>{
  await page.setViewportSize({width:390,height:844});await open(page,'ar');await expect(page.locator('html')).toHaveAttribute('dir','rtl');
  await page.locator('#random-number-min').fill('-1000000000');await page.locator('#random-number-max').fill('-1000000000');await page.locator('#random-number-count').fill('100');await page.locator('#random-number-generate').click();await expect(page.locator('#random-number-output')).toHaveValue(Array(100).fill('-1000000000').join('\n'));await expect(page.locator('#random-number-output')).toHaveAttribute('dir','ltr');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
