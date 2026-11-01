import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {parseHTML} from 'linkedom';
import {rootUrl,siteBase} from '../scripts/i18n.mjs';
const articles=JSON.parse(await readFile(new URL('../src/data/usage-articles.json',import.meta.url),'utf8'));
const tools=JSON.parse(await readFile(new URL('../src/data/tools.json',import.meta.url),'utf8'));
const path=(locale,slug)=>`${locale==='tr'?'':'en/'}guides/${slug?slug+'/':''}`;
const page=async(route)=>parseHTML(await readFile(join('dist',route,'index.html'),'utf8')).document;

test('usage articles are distinct tasks with complete Turkish and English content and valid tools',()=>{
 assert.equal(articles.length,3);assert.equal(new Set(articles.map(a=>a.slug)).size,articles.length);
 for(const a of articles){
  assert.match(a.slug,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);assert.ok(a.toolSlugs.length>0);
  for(const slug of a.toolSlugs)assert.ok(tools.some(t=>t.slug===slug),`${a.slug}: unknown tool ${slug}`);
  for(const locale of ['tr','en']){
   const c=a[locale];assert.ok(c.title.trim());assert.ok(c.description.trim());assert.ok(c.sections.length>1);
   for(const s of c.sections){assert.ok(s.heading.trim());assert.ok(s.paragraphs.length);for(const p of s.paragraphs)assert.ok(typeof p==='string'&&p.trim());}
  }
  assert.notEqual(a.tr.title,a.en.title);
 }
});

test('published usage routes have self canonicals and only genuine translated alternates',async()=>{
 for(const locale of ['tr','en'])for(const slug of [undefined,...articles.map(a=>a.slug)]){
  const route=path(locale,slug),doc=await page(route),article=articles.find(a=>a.slug===slug);
  assert.equal(doc.documentElement.getAttribute('lang'),locale,route);assert.equal(doc.querySelectorAll('h1').length,1,route);
  assert.equal(doc.querySelector('link[rel="canonical"]').getAttribute('href'),new URL(route,rootUrl).href);
  const alternates=[...doc.querySelectorAll('link[rel="alternate"][hreflang]')];assert.equal(alternates.length,3,route);
  for(const language of ['tr','en','x-default'])assert.equal(alternates.find(a=>a.getAttribute('hreflang')===language)?.getAttribute('href'),new URL(path(language==='en'?'en':'tr',slug),rootUrl).href);
  assert.equal(doc.querySelectorAll('.tool-card').length,0,'articles must not duplicate interactive forms');
  assert.equal(doc.querySelector('.guide-language').getAttribute('href'),siteBase+path(locale==='tr'?'en':'tr',slug));
  const schema=[...doc.querySelectorAll('script[type="application/ld+json"]')].map(s=>JSON.parse(s.textContent)).find(s=>s['@type']===(slug?'Article':'CollectionPage'));
  assert.ok(schema,route);assert.equal(schema.inLanguage,locale);
  if(article){assert.equal(doc.querySelector('h1').textContent,article[locale].title);assert.equal(schema.headline,article[locale].title);assert.equal(schema.mainEntityOfPage,new URL(route,rootUrl).href);}
 }
});

test('usage indexes, table of contents and relevant tool links resolve to built pages with backlinks',async()=>{
 for(const locale of ['tr','en']){
  const index=await page(path(locale));
  for(const article of articles){
   assert.ok([...index.querySelectorAll('a')].some(a=>a.getAttribute('href')===siteBase+path(locale,article.slug)));
   const doc=await page(path(locale,article.slug));
   for(const anchor of doc.querySelectorAll('.guide-toc a'))assert.ok(doc.getElementById(anchor.getAttribute('href').slice(1)),`${article.slug}: broken contents link`);
   for(const slug of article.toolSlugs){
    const toolRoute=`${locale==='tr'?'':'en/'}tools/${slug}/`;
    assert.equal(doc.querySelector(`[data-guide-tool="${slug}"]`)?.getAttribute('href'),siteBase+toolRoute);
    const tool=await page(toolRoute);assert.ok([...tool.querySelectorAll('.usage-reading a')].some(a=>a.getAttribute('href')===siteBase+path(locale,article.slug)),`${toolRoute}: article backlink`);
   }
  }
  const home=await page(locale==='tr'?'':'en');assert.ok([...home.querySelectorAll('a')].some(a=>a.getAttribute('href')===siteBase+path(locale)),'directory links to usage hub');
 }
});

test('sitemaps include each usage index and translated article exactly once',async()=>{
 const index=await readFile('dist/sitemap.xml','utf8');
 const chunks=[...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>new URL(m[1]).pathname.split('/').at(-1));
 const xml=(await Promise.all(chunks.map(chunk=>readFile(join('dist',chunk),'utf8')))).join('');
 const urls=[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
 for(const locale of ['tr','en'])for(const slug of [undefined,...articles.map(a=>a.slug)])assert.equal(urls.filter(u=>u===new URL(path(locale,slug),rootUrl).href).length,1);
});
