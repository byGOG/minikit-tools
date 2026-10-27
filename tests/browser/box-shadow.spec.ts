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
  await page.goto(`/${locale}/tools/css-box-shadow-generator/`);
  await expect(page.locator('html')).toHaveAttribute('data-tools-ready', 'true');
}

async function neutral(page: Page) {
  await expect(page.locator('#shadow-output')).toHaveValue(''); await expect(page.locator('#shadow-copy')).toBeDisabled();
  await expect(page.locator('#shadow-feedback')).toHaveText(''); await expect(page.locator('#shadow-target')).toHaveCSS('box-shadow','none');
}
const defaultCSS='box-shadow: 0px 8px 24px 0px rgba(0, 0, 0, 0.2);';
test('default preview, color picker sync, invalidation and clear stay local',async({page,baseURL})=>{
  if(!baseURL) throw new Error('Shadow privacy test requires baseURL');
  const origin=new URL(baseURL).origin,leaks:string[]=[];
  await page.route('**/*',route=>{
    const request=route.request(),url=new URL(request.url());
    if(request.method()==='GET'&&url.origin==='https://static.cloudflareinsights.com'&&(url.pathname==='/beacon.min.js'||url.pathname.startsWith('/beacon.min.js/')))return route.abort();
    if(request.method()!=='GET'||url.origin!==origin){leaks.push(request.url());return route.abort();}return route.continue();
  });
  await open(page);await neutral(page);await page.locator('#shadow-generate').click();
  await expect(page.locator('#shadow-output')).toHaveValue(defaultCSS);
  await expect(page.locator('#shadow-target')).toHaveCSS('box-shadow','rgba(0, 0, 0, 0.2) 0px 8px 24px 0px');
  await expect(page.locator('#shadow-feedback')).toHaveText(en.ready);
  await page.locator('#shadow-color').fill('#ABC');await neutral(page);await expect(page.locator('#shadow-color-picker')).toHaveValue('#aabbcc');
  await page.locator('#shadow-generate').click();
  await page.locator('#shadow-color-picker').evaluate(element=>{(element as HTMLInputElement).value='#123456';element.dispatchEvent(new Event('input',{bubbles:true}));element.dispatchEvent(new Event('change',{bubbles:true}));});
  await neutral(page);await expect(page.locator('#shadow-color')).toHaveValue('#123456');
  await page.locator('#shadow-color').fill('url(https://privacy-sentinel.invalid/pixel)');await page.locator('#shadow-generate').click();
  await expect(page.locator('#shadow-feedback')).toHaveText(en.shadowInvalid);await expect(page.locator('#shadow-target')).toHaveCSS('box-shadow','none');
  await page.locator('#shadow-clear').click();await neutral(page);
  for(const [id,value]of Object.entries({x:'0',y:'8',blur:'24',spread:'0',opacity:'20',color:'#000000','color-picker':'#000000'}))await expect(page.locator(`#shadow-${id}`)).toHaveValue(value);
  await expect(page.locator('#shadow-inset')).not.toBeChecked();expect(leaks).toEqual([]);
});
test('numeric limits, inset and alpha endpoints are applied without silent coercion',async({page})=>{
  await open(page);
  for(const [id,values]of [['x',['','-101','101','0.5']],['y',['-101','101']],['blur',['-1','201']],['spread',['-101','101']],['opacity',['-1','101','20.5']]] as const){
    for(const value of values){
      await page.locator('#shadow-clear').click();await page.locator(`#shadow-${id}`).fill(value);await page.locator('#shadow-generate').click();
      await expect(page.locator('#shadow-feedback')).toHaveText(en.shadowInvalid);await expect(page.locator('#shadow-feedback')).toHaveClass(/error/);
      await expect(page.locator('#shadow-output')).toHaveValue('');await expect(page.locator('#shadow-copy')).toBeDisabled();
    }
  }
  await page.locator('#shadow-clear').click();
  for(const value of ['#abcd','red',' '.repeat(29)+'#abc']){
    await page.locator('#shadow-color').fill(value);await expect(page.locator('#shadow-color')).toHaveValue(value);await page.locator('#shadow-generate').click();
    await expect(page.locator('#shadow-feedback')).toHaveText(en.shadowInvalid);
  }
  await page.locator('#shadow-clear').click();await page.locator('#shadow-inset').check();await neutral(page);
  for(const [opacity,alpha]of [['0','0'],['100','1']]){
    await page.locator('#shadow-opacity').fill(opacity);await neutral(page);await page.locator('#shadow-generate').click();
    await expect(page.locator('#shadow-output')).toHaveValue(`box-shadow: inset 0px 8px 24px 0px rgba(0, 0, 0, ${alpha});`);
  }
});
for(const outcome of ['resolve','reject'])test(`stale clipboard ${outcome} preserves newer validation`,async({page})=>{
  await open(page);await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:(value:string)=>{
    (window as any).shadowCopied=value;return new Promise<void>((resolve,reject)=>{(window as any).finishShadowCopy={resolve,reject};});
  }}});});
  await page.locator('#shadow-generate').click();await page.locator('#shadow-copy').click();await page.waitForFunction(()=>Boolean((window as any).finishShadowCopy));
  expect(await page.evaluate(()=>(window as any).shadowCopied)).toBe(defaultCSS);
  await page.locator('#shadow-color').fill('bad');await page.locator('#shadow-generate').click();
  await page.evaluate(async outcome=>{(window as any).finishShadowCopy[outcome]();await new Promise(resolve=>setTimeout(resolve,0));},outcome);
  await expect(page.locator('#shadow-feedback')).toHaveText(en.shadowInvalid);await expect(page.locator('#shadow-feedback')).toHaveClass(/error/);
  await expect(page.locator('#shadow-output')).toHaveValue('');await expect(page.locator('#shadow-copy')).toBeDisabled();
});
test('Arabic mobile large effects stay clipped with LTR CSS',async({page})=>{
  await page.setViewportSize({width:390,height:844});await open(page,'ar');await expect(page.locator('html')).toHaveAttribute('dir','rtl');
  for(const [id,value]of [['x','100'],['y','100'],['blur','200'],['spread','100']])await page.locator(`#shadow-${id}`).fill(value);
  await page.locator('#shadow-generate').click();await expect(page.locator('#shadow-output')).toHaveAttribute('dir','ltr');
  await expect(page.locator('#shadow-output')).toHaveValue('box-shadow: 100px 100px 200px 100px rgba(0, 0, 0, 0.2);');
  await expect(page.locator('#shadow-preview')).toHaveCSS('overflow','hidden');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
