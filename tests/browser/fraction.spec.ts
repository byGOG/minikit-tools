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
  await page.goto(`${locale === 'tr' ? '' : '/' + locale}/tools/fraction-calculator/`);
  await expect(page.locator('html')).toHaveAttribute('data-tools-ready', 'true');
}

for(const locale of ['en','tr'])test(`${locale} exact arithmetic, invalidation, reset and privacy`,async({page,baseURL})=>{
  if(!baseURL)throw new Error('Fraction privacy test requires baseURL');const origin=new URL(baseURL).origin,leaks:string[]=[];
  await page.route('**/*',route=>{const request=route.request(),url=new URL(request.url());
    if(request.method()==='GET'&&url.origin==='https://static.cloudflareinsights.com'&&(url.pathname==='/beacon.min.js'||url.pathname.startsWith('/beacon.min.js/')))return route.abort();
    if(request.method()!=='GET'||url.origin!==origin){leaks.push(request.url());return route.abort();}return route.continue();});
  await open(page,locale);const output=page.locator('#fraction-output'),copy=page.locator('#fraction-copy'),feedback=page.locator('#fraction-feedback');
  await page.locator('#fraction-calculate').click();await expect(output).toHaveValue('5/6');await expect(copy).toBeEnabled();await expect(feedback).toHaveText(dictionaries[locale].ready);
  for(const [op,result]of [['subtract','1/6'],['multiply','1/6'],['divide','3/2']]){
    await page.locator('#fraction-operation').selectOption(op);await expect(output).toHaveValue('');await expect(copy).toBeDisabled();await expect(feedback).toHaveText('');await page.locator('#fraction-calculate').click();await expect(output).toHaveValue(result);
  }
  for(const [id,value]of [['a','-1'],['b','-2'],['c','0'],['d','-3']]){
    await page.locator(`#fraction-${id}`).fill(value);await expect(output).toHaveValue('');await expect(copy).toBeDisabled();await expect(feedback).toHaveText('');await page.locator('#fraction-operation').selectOption('add');await page.locator('#fraction-calculate').click();
  }
  await expect(output).toHaveValue('1/2');
  await page.locator('#fraction-clear').click();for(const [id,value]of [['a','1'],['b','2'],['c','1'],['d','3']])await expect(page.locator(`#fraction-${id}`)).toHaveValue(value);
  await expect(page.locator('#fraction-operation')).toHaveValue('add');await expect(output).toHaveValue('');await expect(copy).toBeDisabled();await expect(feedback).toHaveText('');expect(leaks).toEqual([]);
});
test('invalid numbers and zero denominators or divisor show exact errors',async({page})=>{
  await open(page);
  for(const [id,value,op]of [['a','','add'],['a','1.5','add'],['a','1.0000000000000001','add'],['a','1e-400','add'],['a','1000000001','add'],['b','0','add'],['d','0','multiply'],['c','0','divide']]){
    await page.locator('#fraction-clear').click();await page.locator(`#fraction-${id}`).fill(value);await page.locator('#fraction-operation').selectOption(op);await page.locator('#fraction-calculate').click();
    await expect(page.locator('#fraction-feedback')).toHaveText(dictionaries.en.fractionInvalid);await expect(page.locator('#fraction-feedback')).toHaveClass(/error/);await expect(page.locator('#fraction-output')).toHaveValue('');await expect(page.locator('#fraction-copy')).toBeDisabled();
  }
  await page.locator('#fraction-clear').click();for(const [id,value]of [['a','1000000000'],['b','999999999'],['c','999999998'],['d','1000000000']])await page.locator(`#fraction-${id}`).fill(value);
  await page.locator('#fraction-calculate').click();await expect(page.locator('#fraction-output')).toHaveValue('999999998500000001/499999999500000000');
});
for(const outcome of ['resolve','reject'])test(`stale clipboard ${outcome} preserves newer validation`,async({page})=>{
  await open(page);await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:(value:string)=>{(window as any).fractionCopied=value;return new Promise<void>((resolve,reject)=>{(window as any).finishFractionCopy={resolve,reject};});}}});});
  await page.locator('#fraction-calculate').click();await page.locator('#fraction-copy').click();await page.waitForFunction(()=>Boolean((window as any).finishFractionCopy));expect(await page.evaluate(()=>(window as any).fractionCopied)).toBe('5/6');
  await page.locator('#fraction-b').fill('0');await page.locator('#fraction-calculate').click();await page.evaluate(async outcome=>{(window as any).finishFractionCopy[outcome]();await new Promise(resolve=>setTimeout(resolve,0));},outcome);
  await expect(page.locator('#fraction-feedback')).toHaveText(dictionaries.en.fractionInvalid);await expect(page.locator('#fraction-feedback')).toHaveClass(/error/);await expect(page.locator('#fraction-output')).toHaveValue('');await expect(page.locator('#fraction-copy')).toBeDisabled();
});
test('Arabic mobile exact large fractions stay LTR without overflow',async({page})=>{
  await page.setViewportSize({width:390,height:844});await open(page,'ar');await expect(page.locator('html')).toHaveAttribute('dir','rtl');
  for(const [id,value]of [['a','1000000000'],['b','999999999'],['c','999999998'],['d','1000000000']])await page.locator(`#fraction-${id}`).fill(value);
  await page.locator('#fraction-calculate').click();await expect(page.locator('#fraction-output')).toHaveValue('999999998500000001/499999999500000000');await expect(page.locator('#fraction-output')).toHaveAttribute('dir','ltr');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
