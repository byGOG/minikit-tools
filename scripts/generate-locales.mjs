import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const provider = 'https://api.mymemory.translated.net';
// Start with Spanish as the single additional locale. The anonymous provider
// quota is deliberately kept small; add more languages after reviewing quality.
const candidates = [['es', 'Español']];
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const htmlEscape = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

function readObject(source, start) {
  const opening = source.indexOf('{', start);
  if (opening < 0) throw new Error('Could not locate the English translation object.');
  let depth = 0;
  let quote = '';
  let escaped = false;
  for (let index = opening; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === "'" || char === '"' || char === '`') { quote = char; continue; }
    if (char === '{') depth += 1;
    if (char === '}' && --depth === 0) return source.slice(opening, index + 1);
  }
  throw new Error('The English translation object is incomplete.');
}

function sanitizeTranslatedHtml(value) {
  return value
    .replace(/<(?!\/?(?:span|br)\b)[^>]*>/gi, '')
    .replace(/<span\b[^>]*>/gi, '<span>')
    .replace(/<\/span\s*>/gi, '</span>')
    .replace(/<br\s*\/?>/gi, '<br/>');
}

async function translateEntry(value, target) {
  const tags = [];
  const marked = value.replace(/<br\s*\/?\s*>|<span\b[^>]*>|<\/span\s*>/gi, (tag) => {
    const index = tags.push(tag.toLowerCase().startsWith('<br') ? '<br/>' : tag.startsWith('</') ? '</span>' : '<span>') - 1;
    return `___MINIKIT_TAG_${index}___`;
  });
  const params = new URLSearchParams({ q: marked, langpair: `en|${target}` });
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(`${provider}/get?${params}`, {
        signal: AbortSignal.timeout(30000),
      });
      if (!response.ok) throw new Error(`MyMemory returned HTTP ${response.status}.`);
      const payload = await response.json();
      if (payload.responseStatus !== 200 || typeof payload.responseData?.translatedText !== 'string') {
        throw new Error(payload.responseDetails || 'MyMemory returned no translated text.');
      }
      const escaped = htmlEscape(payload.responseData.translatedText);
      return escaped.replace(/___MINIKIT_TAG_(\d+)___/gi, (_match, index) => tags[Number(index)] ?? '');
    } catch (error) {
      lastError = error;
      await delay(900 * (attempt + 1));
    }
  }
  throw lastError;
}

function localizeHtml(html, dictionary, locale, options) {
  let output = html.replace(/<html\b[^>]*>/i, `<html lang="${locale}"${locale === 'ar' ? ' dir="rtl"' : ''}>`);

  for (const [key, value] of Object.entries(dictionary)) {
    const safeValue = sanitizeTranslatedHtml(value);
    const expression = new RegExp(`(<([a-z][\\w:-]*)\\b[^>]*\\bdata-i18n=["']${key}["'][^>]*>)([\\s\\S]*?)(<\\/\\2>)`, 'gi');
    output = output.replace(expression, (_all, opening, _tag, _old, closing) => `${opening}${safeValue}${closing}`);
  }

  const title = htmlEscape(dictionary.metaTitle);
  const description = htmlEscape(dictionary.metaDescription);
  output = output.replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`);
  output = output.replace(/(<meta\s+name="description"\s+content=")[^"]*("\s*\/?>)/i, `$1${description}$2`);
  output = output.replace(/(<meta\s+property="og:title"\s+content=")[^"]*("\s*\/?>)/i, `$1${title}$2`);
  output = output.replace(/(<meta\s+property="og:description"\s+content=")[^"]*("\s*\/?>)/i, `$1${description}$2`);

  const optionsHtml = options.map(({ code, name }) => `<option value="${code}"${code === locale ? ' selected' : ''}>${htmlEscape(name)}</option>`).join('');
  output = output.replace(/<select id="language-select"[^>]*>[\s\S]*?<\/select>/i, `<select id="language-select" class="lang-switch" aria-label="Choose language">${optionsHtml}</select>`);
  return output;
}

const source = await readFile('src/scripts/app.ts', 'utf8');
const enStart = source.indexOf('en: {');
if (enStart < 0) throw new Error('English source translations are missing.');
const english = new Function(`return (${readObject(source, enStart)})`)();
english.metaTitle = 'MiniKit — Free tools for everyday tasks';
english.metaDescription = 'Convert images, generate QR codes, count words and convert colors. Free, fast and private.';

const siteConfig = await readFile('astro.config.mjs', 'utf8');
const site = siteConfig.match(/site:\s*['"]([^'"]+)['"]/i)?.[1];
const base = siteConfig.match(/base:\s*['"]([^'"]+)['"]/i)?.[1]?.replace(/\/$/, '');
if (!site || !base) throw new Error('Could not read the public site URL and base path from astro.config.mjs.');
const rootUrl = new URL(`${base}/`, site).toString();
const dist = 'dist';
const rootHtml = await readFile(join(dist, 'index.html'), 'utf8');
const localeOptions = [{ code: 'tr', name: 'Türkçe' }, { code: 'en', name: 'English' }];
const localeRoutes = [{ code: 'tr', path: '' }];
const generated = { en: english };

try {
  for (const [code, name] of candidates) {
    const dictionary = {};
    let failed = false;
    for (const [key, value] of Object.entries(english)) {
      try {
        dictionary[key] = await translateEntry(value, code);
        await delay(150);
      } catch (error) {
        console.warn(`Skipping ${code}: ${error instanceof Error ? error.message : String(error)}`);
        failed = true;
        break;
      }
    }
    if (failed || Object.keys(dictionary).length !== Object.keys(english).length) continue;

    localeOptions.push({ code, name });
    localeRoutes.push({ code, path: `${code}/` });
    generated[code] = dictionary;
    console.log(`Generated /${code}/ with ${Object.keys(dictionary).length} translated strings.`);
  }
} catch (error) {
  console.warn(`Free translation mirror unavailable; keeping the Turkish and English site only. ${error instanceof Error ? error.message : String(error)}`);
}

// English is available independently of the community translation mirror.
localeRoutes.push({ code: 'en', path: 'en/' });
await mkdir(join(dist, 'en'), { recursive: true });
for (const [code, dictionary] of Object.entries(generated)) {
  if (code === 'en') continue;
  await mkdir(join(dist, code), { recursive: true });
  await writeFile(join(dist, code, 'index.html'), localizeHtml(rootHtml, dictionary, code, localeOptions), 'utf8');
}
await writeFile(join(dist, 'en', 'index.html'), localizeHtml(rootHtml, english, 'en', localeOptions), 'utf8');

// Rebuild the root language picker after the mirror reports its actual coverage.
const rootOptionsHtml = localeOptions.map(({ code, name }) => `<option value="${code}"${code === 'tr' ? ' selected' : ''}>${htmlEscape(name)}</option>`).join('');
let localizedRoot = rootHtml.replace(/<select id="language-select"[^>]*>[\s\S]*?<\/select>/i, `<select id="language-select" class="lang-switch" aria-label="Choose language">${rootOptionsHtml}</select>`);

const alternatives = localeRoutes.map(({ code, path }) => {
  const href = new URL(path, rootUrl).toString();
  return `<link rel="alternate" hreflang="${code}" href="${href}" />`;
});
alternatives.push(`<link rel="alternate" hreflang="x-default" href="${rootUrl}" />`);
const pages = localeRoutes.map(({ code, path }) => {
  const href = new URL(path, rootUrl).toString();
  const alternateLinks = localeRoutes.map(({ code: alternateCode, path: alternatePath }) => `<xhtml:link rel="alternate" hreflang="${alternateCode}" href="${new URL(alternatePath, rootUrl)}" />`).join('');
  return `<url><loc>${href}</loc>${alternateLinks}<xhtml:link rel="alternate" hreflang="x-default" href="${rootUrl}" /></url>`;
});

async function addSeo(html, url) {
  const headLinks = `<link rel="canonical" href="${url}" />${alternatives.join('')}`;
  return html.replace(/<\/head>/i, `${headLinks}</head>`);
}

localizedRoot = await addSeo(localizedRoot, rootUrl);
await writeFile(join(dist, 'index.html'), localizedRoot, 'utf8');
for (const { code, path } of localeRoutes.filter(({ code }) => code !== 'tr')) {
  const file = join(dist, path, 'index.html');
  try { await writeFile(file, await addSeo(await readFile(file, 'utf8'), new URL(path, rootUrl).toString()), 'utf8'); }
  catch (error) { if (code === 'en') throw error; }
}

await mkdir(join(dist, 'locales'), { recursive: true });
for (const [code, dictionary] of Object.entries(generated)) {
  await writeFile(join(dist, 'locales', `${code}.json`), JSON.stringify(dictionary), 'utf8');
}

await writeFile(join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${pages.join('')}</urlset>\n`, 'utf8');
const robotsPath = join(dist, 'robots.txt');
const robots = await readFile(robotsPath, 'utf8').catch(() => 'User-agent: *\nAllow: /\n');
await writeFile(robotsPath, `${robots.trim()}\nSitemap: ${new URL('sitemap.xml', rootUrl)}\n`, 'utf8');

console.log(`Built ${localeRoutes.length} static locale pages: ${localeRoutes.map(({ code }) => code).join(', ')}.`);
