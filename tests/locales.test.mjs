import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { catalog, dictionaries, escapeHtml, translatedHtml, localePath, rootUrl, siteBase } from '../scripts/i18n.mjs';

const advertising = JSON.parse(await readFile(new URL('../src/data/advertising.json', import.meta.url), 'utf8'));
const toolCatalog = JSON.parse(await readFile(new URL('../src/data/tools.json', import.meta.url), 'utf8'));
const tools = toolCatalog.map(({slug,title,desc}) => [slug,title,desc]);
const pageCount = catalog.length * (tools.length + 1) + 2;
const expectedUrls = new Set(['privacy/', 'contact/'].map(path=>new URL(path, rootUrl).href));

test('all 50 dictionaries are complete and contain balanced allowed markup', () => {
  assert.equal(catalog.length, 50);
  for (const { code } of catalog) {
    for (const [key, value] of Object.entries(dictionaries[code])) {
      let depth = 0;
      for (const tag of value.match(/<\/?span>/g) ?? []) {
        depth += tag === '<span>' ? 1 : -1;
        assert.ok(depth >= 0, `${code}.${key}: premature closing span`);
      }
      assert.equal(depth, 0, `${code}.${key}: unclosed span`);
    }
  }
});

for (const locale of catalog) {
  test(`${locale.code}: translated homepage, all tool guides, metadata and language links`, async () => {
    const d = dictionaries[locale.code];
    const prefix = localePath(locale.code);
    const dictionary = JSON.parse(await readFile(join('dist', 'locales', `${locale.code}.json`), 'utf8'));
    assert.deepEqual(dictionary, d);
    for (const [slug, title, description] of [['', 'metaTitle', 'metaDescription'], ...tools]) {
      const path = prefix + (slug ? `tools/${slug}/` : '');
      const html = await readFile(join('dist', path, 'index.html'), 'utf8');
      const url = new URL(path, rootUrl).href;
      assert.ok(html.includes('id="tool-total">' + String(tools.length).padStart(2, '0') + '</b>'));
      for (const tool of toolCatalog) assert.equal(html.includes('id="'+tool.anchor+'"'), !slug || tool.slug===slug, path+': only selected form');
      assert.equal([...html.matchAll(/<article[^>]*class="tool-card/g)].length,slug?1:0,path+': form count');
      if(!slug){assert.ok(html.includes('id="tool-search"'));assert.ok(html.includes('id="tool-category"'));}
      expectedUrls.add(url);
      for(const page of ['privacy/', 'contact/']) assert.ok(html.includes(`href="${siteBase}${page}"`), `${path}: policy/contact link`);
      assert.equal(html.includes('googlesyndication.com'), advertising.enabled, `${path}: advertising activation`);
      assert.equal([...html.matchAll(/class="adsbygoogle"/g)].length, advertising.enabled ? 2 : 0, `${path}: manual ad units`);
      assert.ok(html.includes(`<html lang="${locale.code}" dir="${locale.dir}">`), `${path}: language/direction`);
      const expectedTitle = d[title] + (slug ? ' — MiniKit' : '');
      assert.ok(html.includes(`<title>${escapeHtml(expectedTitle)}</title>`), `${path}: title`);
      assert.ok(html.includes(`name="description" content="${escapeHtml(d[description])}"`), `${path}: description`);
      assert.equal([...html.matchAll(/<link rel="canonical"[^>]*>/g)].length, 1, `${path}: single canonical`);
      assert.ok(html.includes(`rel="canonical" href="${url}"`), `${path}: canonical`);
      const alternates = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)];
      assert.equal(alternates.length, 51, `${path}: all alternate languages`);
      for (const alternate of catalog) {
        const target = new URL(localePath(alternate.code) + (slug ? `tools/${slug}/` : ''), rootUrl).href;
        assert.ok(alternates.some((a) => a[1] === alternate.code && a[2] === target), `${path}: ${alternate.code} alternate`);
      }
      const selector = html.match(/<select id="language-select"[^>]*>([\s\S]*?)<\/select>/)?.[1];
      assert.ok(selector, `${path}: selector exists`);
      assert.equal([...selector.matchAll(/<option /g)].length, 50, `${path}: selector count`);
      assert.equal([...selector.matchAll(/ selected/g)].length, 1);
      assert.ok(selector.includes(`value="${locale.code}" selected`));
      for (const key of ['heroTitle', 'imageTitle', 'qrTitle', 'wordTitle', 'colorTitle', 'caseTitle', 'dedupeTitle', 'sortTitle', 'jsonTitle', 'base64Title', 'urlTitle', 'passwordTitle', 'unitTitle', 'percentTitle', 'resizeTitle', 'cropTitle', 'rotateTitle', 'watermarkTitle', 'paletteTitle', 'image64Title', 'imagesPdfTitle', 'mergePdfTitle', 'splitPdfTitle', 'uuidTitle', 'shaTitle', 'unixTitle', 'replaceTitle', 'diffTitle', 'lineNumberTitle', 'ageTitle', 'dateDiffTitle', 'countdownTitle', 'htmlTitle', 'jwtTitle', 'baseTitle', 'toneTitle', 'grayscaleTitle', 'avatarTitle', 'anagramTitle', 'palindromeTitle', 'emailextractTitle', 'audiotrimTitle', 'audiojoinTitle', 'audionormalTitle', 'primecheckTitle', 'factorizeTitle', 'gcdlcmTitle', 'ipv4subnetTitle', 'ipv6formatTitle', 'cidrcheckTitle', 'combineTitle', 'blurTitle', 'invertTitle', 'regexTitle', 'htmlmdTitle', 'mdpreviewTitle', 'tipcalcTitle', 'fuelcalcTitle', 'dateaddTitle', 'pdfrotateTitle', 'pdfreorderTitle', 'pdfdeleteTitle', 'jsonyamlTitle', 'yamljsonTitle', 'jsondiffTitle', 'stopwatchTitle', 'pomodoroTitle', 'chanceTitle', 'readingTitle', 'frequencyTitle', 'pickerTitle', 'xmlformatTitle', 'urlparseTitle', 'contrastTitle', 'flipTitle', 'borderTitle', 'roundedTitle', 'discountTitle', 'proportionTitle', 'travelTitle', 'slugTitle', 'reverseTitle', 'whitespaceTitle', 'cssMinTitle', 'jsonCsvTitle', 'csvJsonTitle', 'privacyLead', 'skipTools']) {
        if ((!slug && key==='heroTitle') || (slug && (key===title || key==='privacyLead' || key==='skipTools'))) assert.ok(html.includes(`data-i18n="${key}">${translatedHtml(d[key]).replaceAll('<br/>','<br>').replaceAll('<br />','<br>').replaceAll('&quot;', String.fromCharCode(34)).replaceAll('&#39;', String.fromCharCode(39))}`), `${path}: translated ${key}`);
      }
      assert.ok(html.includes(`aria-label="${escapeHtml(d.chooseLanguage)}"`), `${path}: accessible selector label`);
      if(slug==='word-counter') assert.ok(html.includes(`placeholder="${escapeHtml(d.pasteText)}"`), `${path}: translated text placeholder`);
      if(!slug) for (const [tool] of tools) assert.ok(html.includes(`href="${siteBase}${prefix}tools/${tool}/"`), `${path}: tool link ${tool}`);
      assert.equal([...html.matchAll(/<h1[\s>]/g)].length,1,`${path}: one primary heading`);
      assert.ok(html.includes(`property="og:url" content="${url}"`),`${path}: share URL`);
      if (slug) {
        assert.ok(html.includes(`<h2>${escapeHtml(d.guideHow)}</h2>`));
        assert.ok(html.includes(`<h2>${escapeHtml(d.guideFaq)}</h2>`));
        const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
        const graph = schemas.find((s) => s['@graph'])?.['@graph'];
        assert.equal(graph?.[0].name, d[title]);
        assert.equal(graph?.[0].url,url);
        assert.equal(graph?.[2]['@type'],'BreadcrumbList');
        assert.equal(graph?.[2].itemListElement[1].item,url);
        assert.equal(graph?.[1].mainEntity[0].name, d.guidePrivacyQuestion);
        assert.equal(graph?.[1].mainEntity[0].acceptedAnswer.text, d.privacyLead);
      }
    }
  });
}

test('sitemap lists every generated page and all published dictionaries exist', async () => {
  const index = await readFile('dist/sitemap.xml', 'utf8');
  assert.ok(index.includes('<sitemapindex'));
  const sitemapPaths=[...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>new URL(m[1]).pathname.split('/').at(-1));
  const xml=(await Promise.all(sitemapPaths.map(path=>readFile(join('dist',path),'utf8')))).join('');
  assert.ok(!xml.includes('xhtml:link'),'hreflang is provided in HTML');
  const locations = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.equal(locations.length, pageCount);
  assert.equal(new Set(locations).size, pageCount);
  assert.deepEqual(new Set(locations), expectedUrls);
  assert.equal((await readdir('dist/locales')).filter((f) => f.endsWith('.json')).length, 50);
});

test('404 page exists and does not advertise',async()=>{const html=await readFile('dist/404.html','utf8');assert.ok(html.includes('404'));assert.ok(!html.includes('googlesyndication.com'));});
