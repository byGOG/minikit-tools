import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
const articles=JSON.parse(readFileSync(new URL('../../src/data/usage-articles.json',import.meta.url),'utf8'));
const path=(locale:string,slug?:string)=>`${locale==='tr'?'':'/'+locale}/guides/${slug?slug+'/':''}`;
test.beforeEach(async({page})=>{await page.route('https://static.cloudflareinsights.com/**',route=>route.abort());});
for(const locale of ['tr','en'])for(const article of articles)test(`${locale} guide ${article.slug} leads from the index to a working tool`,async({page})=>{
 await page.goto(path(locale));
 await page.locator('.usage-list a').filter({hasText:article[locale].title}).click();
 await expect(page.locator('h1')).toHaveText(article[locale].title);
 const toc=page.locator('.guide-toc a').first();await toc.click();await expect(page.locator(page.url().slice(page.url().lastIndexOf('#')))).toBeInViewport();
 const alternate=locale==='tr'?'en':'tr';
 await page.locator('.guide-language').click();await expect(page.locator('html')).toHaveAttribute('lang',alternate);await expect(page.locator('h1')).toHaveText(article[alternate].title);
 await page.locator('.guide-language').click();await expect(page.locator('h1')).toHaveText(article[locale].title);
 const slug=article.toolSlugs[0];await page.locator(`[data-guide-tool="${slug}"]`).click();
 await expect(page.locator('html')).toHaveAttribute('data-tools-ready','true');
 if(slug==='word-counter'){
  await page.locator('#word-input').fill(locale==='tr'?'Bugün kısa bir metin yazdım.':'Today I wrote a short paragraph.');await expect(page.locator('#word-count')).toHaveText(locale==='tr'?'5':'6');
  await page.locator('#word-input').fill(Array(400).fill('word').join(' '));await expect(page.locator('#read-time')).toHaveText(locale==='tr'?'2 dk':'2 min');
 }else if(slug==='text-sorter'){
  const prefix=locale==='tr'?'dosya':'file';await page.locator('#sort-input').fill(`${prefix}10\n${prefix}2\n${prefix}1`);await expect(page.locator('#sort-output')).toHaveValue(`${prefix}1\n${prefix}2\n${prefix}10`);
 }else if(slug==='percentage-calculator'){
  await page.locator('#percent-mode').selectOption('change');await page.locator('#percent-a').fill('100');await page.locator('#percent-b').fill('120');await page.locator('#calculate-percent').click();await expect(page.locator('#percent-output')).toHaveValue('20%');
 }else throw new Error(`Missing journey for first guide tool: ${slug}`);
 await expect(page.locator('.usage-reading a').filter({hasText:article[locale].title})).toHaveAttribute('href',path(locale,article.slug));
});
test('mobile guide supports keyboard skip, contents navigation and long titles without horizontal overflow',async({page,browserName})=>{
 await page.setViewportSize({width:390,height:844});await page.goto(path('tr',articles[0].slug));
 // macOS WebKit follows Safari's link-navigation preference: Option+Tab includes links.
 await page.keyboard.press(browserName==='webkit'&&process.platform==='darwin'?'Alt+Tab':'Tab');await expect(page.locator('.guide-skip')).toBeFocused();await page.keyboard.press('Enter');await expect(page.locator('#content')).toBeFocused();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.locator('.guide-language').click();await expect(page.locator('html')).toHaveAttribute('lang','en');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
