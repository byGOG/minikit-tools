import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { catalog, dictionaries, escapeHtml as esc, translatedHtml, rootUrl, localePath } from './i18n.mjs';

const dist = 'dist';
const rootHtml = await readFile(join(dist, 'index.html'), 'utf8');
const alternatives = catalog.map(({ code }) => ({ code, url: new URL(localePath(code), rootUrl).href }));

function localizeHtml(dictionary, locale) {
  let html = rootHtml.replace(/<html\b[^>]*>/i, `<html lang="${locale.code}" dir="${locale.dir}">`);
  for (const [key, value] of Object.entries(dictionary)) {
    const expression = new RegExp(`(<([a-z][\\w:-]*)\\b[^>]*\\bdata-i18n=["']${key}["'][^>]*>)([\\s\\S]*?)(<\\/\\2>)`, 'gi');
    html = html.replace(expression, (_all, opening, _tag, _old, closing) => opening + translatedHtml(value) + closing);
  }
  for (const [data, attr] of [['aria', 'aria-label'], ['placeholder', 'placeholder'], ['alt', 'alt']]) {
    const expression = new RegExp(`<[^>]+data-i18n-${data}="([^"]+)"[^>]*>`, 'gi');
    html = html.replace(expression, (tag, key) => {
      if (!dictionary[key]) throw new Error(`Missing attribute translation: ${key}`);
      const attribute = `${attr}="${esc(dictionary[key])}"`;
      return new RegExp(`\\b${attr}="[^"]*"`, 'i').test(tag) ? tag.replace(new RegExp(`\\b${attr}="[^"]*"`, 'i'), attribute) : tag.replace(/\/?>(?=$)/, ` ${attribute}>`);
    });
  }
  html = html.replace(/<title>[\s\S]*?<\/title>/i, () => `<title>${esc(dictionary.metaTitle)}</title>`);
  for (const [name, key] of [['name="description"', 'metaDescription'], ['property="og:title"', 'metaTitle'], ['property="og:description"', 'metaDescription']]) {
    const expression = new RegExp(`(<meta\\s+${name}\\s+content=")[^"]*("\\s*\\/?>)`, 'i');
    html = html.replace(expression, (_all, before, after) => before + esc(dictionary[key]) + after);
  }
  const options = catalog.map(({ code, name }) => `<option value="${code}"${code === locale.code ? ' selected' : ''}>${esc(name)}</option>`).join('');
  html = html.replace(/<select id="language-select"[^>]*>[\s\S]*?<\/select>/i, `<select id="language-select" class="lang-switch" data-i18n-aria="chooseLanguage" aria-label="${esc(dictionary.chooseLanguage)}">${options}</select>`);
  html = html.replace(/<link\b[^>]*rel="(?:canonical|alternate)"[^>]*>/gi, '');
  const links = `<link rel="canonical" href="${new URL(localePath(locale.code), rootUrl)}">` +
    alternatives.map(({ code, url }) => `<link rel="alternate" hreflang="${code}" href="${url}">`).join('') +
    `<link rel="alternate" hreflang="x-default" href="${rootUrl}">`;
  return html.replace('</head>', links + '</head>');
}

await mkdir(join(dist, 'locales'), { recursive: true });
for (const locale of catalog) {
  const directory = join(dist, localePath(locale.code));
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, 'index.html'), localizeHtml(dictionaries[locale.code], locale), 'utf8');
  await writeFile(join(dist, 'locales', `${locale.code}.json`), JSON.stringify(dictionaries[locale.code]), 'utf8');
}
const alternateXml = alternatives.map(({ code, url }) => `<xhtml:link rel="alternate" hreflang="${code}" href="${url}"/>`).join('') + `<xhtml:link rel="alternate" hreflang="x-default" href="${rootUrl}"/>`;
const pages = alternatives.map(({ url }) => `<url><loc>${url}</loc>${alternateXml}</url>`).join('');
await writeFile(join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${pages}</urlset>\n`);
await writeFile(join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${new URL('sitemap.xml', rootUrl)}\n`);
console.log(`Built ${catalog.length} static language pages without translation network requests.`);
