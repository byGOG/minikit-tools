import {test,expect,type Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
const dict=(locale:string):Record<string,string>=>JSON.parse(readFileSync(new URL(`../../src/i18n/locales/${locale}.json`,import.meta.url),'utf8'));
const catalog=JSON.parse(readFileSync(new URL('../../src/data/tools.json',import.meta.url),'utf8'));
const examples=JSON.parse(readFileSync(new URL('../../src/data/tool-examples.json',import.meta.url),'utf8'));
test.beforeEach(async({page})=>{await page.route('https://static.cloudflareinsights.com/**',route=>{
  const url=new URL(route.request().url());if(url.pathname==='/beacon.min.js'||url.pathname.startsWith('/beacon.min.js/'))return route.abort();return route.fallback();
});});
async function open(page:Page,locale:string,slug:string){
  await page.goto(`${locale==='tr'?'':'/'+locale}/tools/${slug}/`);await expect(page.locator('html')).toHaveAttribute('data-tools-ready','true');
  const tool=catalog.find((tool:{slug:string})=>tool.slug===slug),d=dict(locale);
  await expect(page.locator('.tool-card')).toHaveCount(1);await expect(page.locator('.tool-card')).toHaveAttribute('id',tool.anchor);
  await expect(page.locator('h1')).toHaveText(d[tool.title]);
  expect(await page.locator('.tool-card').evaluate(card => { const guide = document.querySelector('.tool-usage-guide'); return Boolean(guide && (card.compareDocumentPosition(guide) & Node.DOCUMENT_POSITION_FOLLOWING)); })).toBe(true);
  await expect(page.locator('.seo-guide').first().locator('a.button-primary')).toHaveText(d.useTool);
  const key=slug==='word-counter'?'wordSeoTitle':slug==='text-sorter'?'sortSeoTitle':'percentSeoTitle';
  await expect(page).toHaveTitle(`${d[key]} — MiniKit`);
  const canonical=`https://minikit.top${locale==='tr'?'':'/'+locale}/tools/${slug}/`;
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href',canonical);
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(51);
}
for(const locale of ['tr','en','pl','sv'])test(`${locale} word example updates counts and clears`,async({page})=>{
  await open(page,locale,'word-counter');await expect(page.locator('#word-input')).toHaveAttribute('aria-describedby',/word-input-hint/);
  await expect(page.locator('#word-input-hint')).toHaveText(dict(locale).wordInputHint);
  await page.locator('#word-example').click();await expect(page.locator('#word-input')).toHaveValue(examples['word-counter'][0]);
  await expect(page.locator('#word-count')).toHaveText('3');await expect(page.locator('#char-count')).toHaveText('13');
  await page.locator('#clear-text').click();await expect(page.locator('#word-input')).toHaveValue('');await expect(page.locator('#word-count')).toHaveText('0');await expect(page.locator('#char-count')).toHaveText('0');
});
for(const locale of ['tr','en','it'])test(`${locale} sorter example performs natural ascending and descending order`,async({page})=>{
  await open(page,locale,'text-sorter');await expect(page.locator('#sort-input-hint')).toHaveText(dict(locale).sortInputHint);
  await page.locator('#sort-example').click();await expect(page.locator('#sort-input')).toHaveValue('10\n2\n1');await expect(page.locator('#sort-output')).toHaveValue('1\n2\n10');
  await page.locator('#sort-order').selectOption('desc');await expect(page.locator('#sort-output')).toHaveValue('10\n2\n1');await expect(page.locator('[data-copy-output="sort-output"]')).toBeEnabled();
  await page.locator('[data-clear-input="sort-input"]').click();await expect(page.locator('#sort-output')).toHaveValue('');await expect(page.locator('[data-copy-output="sort-output"]')).toBeDisabled();
});
for(const locale of ['tr','en','hr'])test(`${locale} percentage labels and examples follow each selected formula`,async({page,baseURL})=>{
  if(!baseURL)throw new Error('Privacy test requires baseURL');const origin=new URL(baseURL).origin,leaks:string[]=[];
  await page.route('**/*',route=>{const request=route.request(),url=new URL(request.url());if(request.method()==='GET'&&url.origin==='https://static.cloudflareinsights.com'&&(url.pathname==='/beacon.min.js'||url.pathname.startsWith('/beacon.min.js/')))return route.abort();if(request.method()!=='GET'||url.origin!==origin){leaks.push(request.url());return route.abort();}return route.continue();});
  await open(page,locale,'percentage-calculator');const d=dict(locale);
  for(const [mode,a,b,hint,result]of [['of','percentAmountLabel','percentTotalLabel','percentOfHint','30'],['ratio','percentPartLabel','percentWholeLabel','percentRatioHint','15%'],['change','percentInitialLabel','percentFinalLabel','percentChangeHint','20%']]){
    await page.locator('#percent-mode').selectOption(mode);await expect(page.locator('#percent-output')).toHaveValue('');
    await expect(page.locator('#percent-a-label')).toHaveText(d[a]);await expect(page.locator('#percent-b-label')).toHaveText(d[b]);await expect(page.locator('#percent-formula-hint')).toHaveText(d[hint]);
    for(const id of ['a','b'])await expect(page.locator(`#percent-${id}`)).toHaveAttribute('aria-describedby','percent-number-hint percent-formula-hint');
    await page.locator('#percent-example').click();await expect(page.locator('#percent-output')).toHaveValue(result);
  }
  await page.locator('#percent-a').fill('0');await page.locator('#calculate-percent').click();await expect(page.locator('#percent-feedback')).toHaveText(d.percentInvalid);await expect(page.locator('#percent-output')).toHaveValue('');expect(leaks).toEqual([]);
});
test('Arabic mobile percentage examples retain RTL layout and LTR result',async({page})=>{
  await page.setViewportSize({width:390,height:844});await open(page,'ar','percentage-calculator');await expect(page.locator('html')).toHaveAttribute('dir','rtl');await page.locator('#percent-mode').selectOption('change');await page.locator('#percent-example').click();await expect(page.locator('#percent-output')).toHaveValue('20%');await expect(page.locator('#percent-output')).toHaveAttribute('dir','ltr');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
