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
  await page.goto(`${locale === 'tr' ? '' : '/' + locale}/tools/css-border-radius-generator/`);
  await expect(page.locator('html')).toHaveAttribute('data-tools-ready', 'true');
}

const corners=['top-left','top-right','bottom-right','bottom-left'];
const defaultCSS='border-radius: 16px 32px 48px 0px;';
async function neutral(page:Page){
  await expect(page.locator('#radius-output')).toHaveValue('');await expect(page.locator('#radius-copy')).toBeDisabled();await expect(page.locator('#radius-feedback')).toHaveText('');
  for(const corner of corners)await expect(page.locator('#radius-target')).toHaveCSS(`border-${corner}-radius`,'0px');
}
for(const locale of ['en','tr'])test(`${locale} exact physical corner preview, invalidation and reset stay local`,async({page,baseURL})=>{
  if(!baseURL)throw new Error('Radius privacy test requires baseURL');const origin=new URL(baseURL).origin,leaks:string[]=[];
  await page.route('**/*',route=>{
    const request=route.request(),url=new URL(request.url());
    if(request.method()==='GET'&&url.origin==='https://static.cloudflareinsights.com'&&(url.pathname==='/beacon.min.js'||url.pathname.startsWith('/beacon.min.js/')))return route.abort();
    if(request.method()!=='GET'||url.origin!==origin){leaks.push(request.url());return route.abort();}return route.continue();
  });
  await open(page,locale);await neutral(page);await page.locator('#radius-generate').click();
  await expect(page.locator('#radius-output')).toHaveValue(defaultCSS);await expect(page.locator('#radius-copy')).toBeEnabled();await expect(page.locator('#radius-feedback')).toHaveText(dictionaries[locale].ready);
  for(const [index,corner]of corners.entries())await expect(page.locator('#radius-target')).toHaveCSS(`border-${corner}-radius`,`${[16,32,48,0][index]}px`);
  await expect(page.locator('#radius-target')).toHaveCSS('width','240px');await expect(page.locator('#radius-target')).toHaveCSS('height','160px');
  for(const corner of corners){await page.locator(`#radius-${corner}`).fill('1');await neutral(page);await page.locator('#radius-generate').click();}
  await page.locator('#radius-clear').click();await neutral(page);
  for(const [index,corner]of corners.entries())await expect(page.locator(`#radius-${corner}`)).toHaveValue(String([16,32,48,0][index]));
  expect(leaks).toEqual([]);
});
test('all corners reject blank, fractional and out-of-range values and accept endpoints',async({page})=>{
  await open(page);
  for(const corner of corners)for(const value of ['','-1','201','1.5']){
    await page.locator('#radius-clear').click();await page.locator(`#radius-${corner}`).fill(value);await page.locator('#radius-generate').click();
    await expect(page.locator('#radius-feedback')).toHaveText(dictionaries.en.radiusInvalid);await expect(page.locator('#radius-feedback')).toHaveClass(/error/);
    await expect(page.locator('#radius-output')).toHaveValue('');await expect(page.locator('#radius-copy')).toBeDisabled();
    for(const physical of corners)await expect(page.locator('#radius-target')).toHaveCSS(`border-${physical}-radius`,'0px');
  }
  for(const value of ['0','200']){
    for(const corner of corners)await page.locator(`#radius-${corner}`).fill(value);
    await page.locator('#radius-generate').click();await expect(page.locator('#radius-output')).toHaveValue(`border-radius: ${value}px ${value}px ${value}px ${value}px;`);
  }
});
for(const outcome of ['resolve','reject'])test(`stale clipboard ${outcome} preserves newer validation`,async({page})=>{
  await open(page);await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:(value:string)=>{
    (window as any).radiusCopied=value;return new Promise<void>((resolve,reject)=>{(window as any).finishRadiusCopy={resolve,reject};});
  }}});});
  await page.locator('#radius-generate').click();await page.locator('#radius-copy').click();await page.waitForFunction(()=>Boolean((window as any).finishRadiusCopy));
  expect(await page.evaluate(()=>(window as any).radiusCopied)).toBe(defaultCSS);
  await page.locator('#radius-top-left').fill('');await page.locator('#radius-generate').click();
  await page.evaluate(async outcome=>{(window as any).finishRadiusCopy[outcome]();await new Promise(resolve=>setTimeout(resolve,0));},outcome);
  await expect(page.locator('#radius-feedback')).toHaveText(dictionaries.en.radiusInvalid);await expect(page.locator('#radius-feedback')).toHaveClass(/error/);
  await expect(page.locator('#radius-output')).toHaveValue('');await expect(page.locator('#radius-copy')).toBeDisabled();
});
test('Arabic mobile retains physical corner order and LTR CSS without overflow',async({page})=>{
  await page.setViewportSize({width:390,height:844});await open(page,'ar');await expect(page.locator('html')).toHaveAttribute('dir','rtl');
  await page.locator('#radius-generate').click();await expect(page.locator('#radius-output')).toHaveValue(defaultCSS);await expect(page.locator('#radius-output')).toHaveAttribute('dir','ltr');
  for(const [index,corner]of corners.entries())await expect(page.locator('#radius-target')).toHaveCSS(`border-${corner}-radius`,`${[16,32,48,0][index]}px`);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
