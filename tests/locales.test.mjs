import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { catalog, dictionaries, escapeHtml, translatedHtml, localePath, rootUrl, siteBase } from '../scripts/i18n.mjs';

const toolCatalog = JSON.parse(await readFile(new URL('../src/data/tools.json', import.meta.url), 'utf8'));
const tools = toolCatalog.map(({slug,title,desc}) => [slug,title,desc]);
const pageCount = catalog.length * (tools.length + 1);
const expectedUrls = new Set();

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
      for (const tool of toolCatalog) assert.ok(html.includes('id="'+tool.anchor+'"'));
      expectedUrls.add(url);
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
      for (const key of ['heroTitle', 'imageTitle', 'qrTitle', 'wordTitle', 'colorTitle', 'caseTitle', 'dedupeTitle', 'sortTitle', 'jsonTitle', 'base64Title', 'urlTitle', 'passwordTitle', 'unitTitle', 'percentTitle', 'resizeTitle', 'cropTitle', 'rotateTitle', 'privacyLead', 'skipTools']) {
        assert.ok(html.includes(`data-i18n="${key}">${translatedHtml(d[key])}`), `${path}: translated ${key}`);
      }
      assert.ok(html.includes(`aria-label="${escapeHtml(d.chooseLanguage)}"`), `${path}: accessible selector label`);
      assert.ok(html.includes(`placeholder="${escapeHtml(d.pasteText)}"`), `${path}: translated text placeholder`);
      for (const [tool] of tools) assert.ok(html.includes(`href="${siteBase}${prefix}tools/${tool}/"`), `${path}: tool link ${tool}`);
      if (slug) {
        assert.ok(html.includes(`<h2>${escapeHtml(d.guideHow)}</h2>`));
        assert.ok(html.includes(`<h2>${escapeHtml(d.guideFaq)}</h2>`));
        const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
        const graph = schemas.find((s) => s['@graph'])?.['@graph'];
        assert.equal(graph?.[0].name, d[title]);
        assert.equal(graph?.[1].mainEntity[0].name, d.guidePrivacyQuestion);
        assert.equal(graph?.[1].mainEntity[0].acceptedAnswer.text, d.privacyLead);
      }
    }
  });
}

test('sitemap lists every generated page and all published dictionaries exist', async () => {
  const xml = await readFile('dist/sitemap.xml', 'utf8');
  const locations = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.equal(locations.length, pageCount);
  assert.equal(new Set(locations).size, pageCount);
  assert.deepEqual(new Set(locations), expectedUrls);
  assert.equal((await readdir('dist/locales')).filter((f) => f.endsWith('.json')).length, 50);
});
