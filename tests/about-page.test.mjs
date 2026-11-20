import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseHTML } from 'linkedom';
import { rootUrl, siteBase } from '../scripts/i18n.mjs';

const articles = JSON.parse(await readFile(new URL('../src/data/usage-articles.json', import.meta.url), 'utf8'));
const advertising = JSON.parse(await readFile(new URL('../src/data/advertising.json', import.meta.url), 'utf8'));
const aboutRoute = (locale) => locale === 'tr' ? 'about/' : 'en/about/';
const prefix = (locale) => locale === 'tr' ? '' : 'en/';
const documentAt = async (route) => parseHTML(await readFile(join('dist', route, 'index.html'), 'utf8')).document;

test('about pages have distinct translated routes, self canonicals and reciprocal language links', async () => {
  for (const locale of ['tr', 'en']) {
    const route = aboutRoute(locale);
    const document = await documentAt(route);
    assert.equal(document.documentElement.getAttribute('lang'), locale, route);
    assert.equal(document.querySelectorAll('h1').length, 1, `${route}: single primary heading`);
    const canonicals = document.querySelectorAll('link[rel="canonical"]');
    assert.equal(canonicals.length, 1, `${route}: single canonical`);
    assert.equal(canonicals[0].getAttribute('href'), new URL(route, rootUrl).href);

    const alternates = [...document.querySelectorAll('link[rel="alternate"][hreflang]')];
    assert.equal(alternates.length, 3, `${route}: only available translations and default`);
    for (const language of ['tr', 'en', 'x-default']) {
      const alternate = alternates.find((link) => link.getAttribute('hreflang') === language);
      const translatedRoute = aboutRoute(language === 'en' ? 'en' : 'tr');
      assert.equal(alternate?.getAttribute('href'), new URL(translatedRoute, rootUrl).href);
    }

    const hrefs = [...document.querySelectorAll('a[href]')].map((link) => link.getAttribute('href'));
    assert.ok(hrefs.includes(siteBase + aboutRoute(locale === 'tr' ? 'en' : 'tr')), `${route}: reachable other language`);
    assert.ok(hrefs.includes('https://github.com/byGOG/minikit-tools'), `${route}: public source repository`);
    assert.ok(hrefs.some((href) => /^https:\/\/github\.com\/byGOG\/minikit-tools\/issues(?:[/?#]|$)/.test(href)), `${route}: feedback destination`);
    assert.doesNotMatch(document.body.textContent, /önder\s+gög/i, `${route}: public content uses site identity`);
  }
});

test('home, tool and usage routes expose the matching about page', async () => {
  const toolSlugs = [...new Set(articles.flatMap((article) => article.toolSlugs))];
  for (const locale of ['tr', 'en']) {
    const routes = [
      prefix(locale),
      ...toolSlugs.map((slug) => `${prefix(locale)}tools/${slug}/`),
      `${prefix(locale)}guides/`,
      ...articles.map((article) => `${prefix(locale)}guides/${article.slug}/`),
    ];
    for (const route of routes) {
      const document = await documentAt(route);
      const links = [...document.querySelectorAll('a[href]')];
      assert.ok(links.some((link) => link.getAttribute('href') === siteBase + aboutRoute(locale)), `${route || '/'}: localized about link`);
    }
  }
});

test('publisher verification is published while advertisements await approval', async () => {
  assert.equal(await readFile('dist/ads.txt', 'utf8'), 'google.com, pub-9919014575326142, DIRECT, f08c47fec0942fa0\n');
  assert.equal(advertising.enabled, false);
  assert.equal(advertising.siteApproved, false);
  for (const locale of ['tr', 'en']) {
    const document = await documentAt(aboutRoute(locale));
    assert.equal(document.querySelectorAll('.adsbygoogle').length, 0);
    assert.equal(document.querySelectorAll('script[src*="googlesyndication.com"]').length, 0);
  }
});
