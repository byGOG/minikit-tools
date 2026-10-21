import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const provider = 'https://api.mymemory.translated.net';
// Spanish is already cached by the previous deployment. Add ten widely used
// languages and reuse each published dictionary so free-provider quota is spent
// only on translations that have not succeeded before.
const candidates = [
  ['es', 'Español'],
  ['de', 'Deutsch'],
  ['fr', 'Français'],
  ['pt', 'Português'],
  ['ru', 'Русский'],
  ['it', 'Italiano'],
  ['ar', 'العربية'],
  ['zh', '简体中文'],
  ['ja', '日本語'],
  ['hi', 'हिन्दी'],
  ['id', 'Bahasa Indonesia'],
];
const spanishOverrides = {
  announcement: 'Tareas pequeñas, más sencillas. MiniKit ya está disponible.',
  eyebrow: 'HERRAMIENTAS PRÁCTICAS PARA EL DÍA A DÍA',
  heroTitle: 'Un pequeño atajo<br/><span>para tus tareas diarias.</span>',
  heroLead: 'Convierte imágenes, crea códigos QR y cuenta palabras. Las herramientas prácticas que necesitas, en un solo lugar.',
  heroCta: 'Prueba las herramientas gratis',
  heroProof: 'Sin cuenta · Siempre gratis',
  privacyLine: 'Tus archivos permanecen en tu dispositivo. Sin subir archivos ni crear una cuenta.',
  ready: '¡Listo!', quickTools: 'Accesos rápidos', pickTool: '¿Qué quieres hacer hoy?',
  makeQr: 'Crear código QR', countWords: 'Contar palabras',
  statPrivate: 'Privacidad ante todo', statFree: 'Gratis y fácil de usar',
  toolsEyebrow: 'TUS HERRAMIENTAS',
  toolsTitle: 'Herramientas prácticas.<br/><span>Solo lo que necesitas.</span>',
  toolsAvailable: 'herramientas disponibles',
  imageTitle: 'Convertidor de imágenes', imageDesc: 'Convierte imágenes a WebP, JPEG o PNG, o reduce su tamaño.',
  uploadChoose: 'Elige una imagen o arrástrala aquí', localImage: 'La imagen se procesa en tu dispositivo',
  qrTitle: 'Generador de códigos QR', qrDesc: 'Escribe un enlace o texto breve y descarga el código QR para compartirlo.',
  generateQr: 'Crear código QR', downloadQr: 'Descargar código QR', localQr: 'El código se crea en tu dispositivo',
  wordDesc: 'Consulta al instante el número de palabras, caracteres y el tiempo de lectura.',
  pasteText: 'Escribe o pega tu texto aquí', characters: 'Caracteres',
  colorTitle: 'Convertidor de colores', colorDesc: 'Convierte fácilmente entre los formatos HEX, RGB y HSL.',
  whyEyebrow: 'MENOS ESFUERZO, MÁS RESULTADOS',
  whyTitle: 'Concéntrate en tu tarea,<br/>no en buscar herramientas.',
  benefitOneTitle: 'Rápido de verdad', benefitTwo: 'Tus archivos y textos permanecen en tu dispositivo. No guardamos tus datos.',
  privacyEyebrow: 'PRIVACIDAD DESDE EL DISEÑO',
  privacyTitle: 'Tus archivos hacen su trabajo<br/><span>sin pasar por nuestros servidores.</span>',
  privacyLead: 'Las imágenes se procesan en tu navegador. Los códigos QR y los colores se crean en tu dispositivo. Tu texto se queda contigo. Este aviso se actualizará si añadimos servicios de análisis o publicidad.',
  privacyStamp: 'PRIVACIDAD ANTE TODO',
  ctaTitle: 'Haz que tu próxima tarea<br/>sea un poco más sencilla.',
  madeWith: 'Hecho con cuidado, para todos.',
  imageTooLarge: 'El archivo supera el límite de 20 MB.', imageInvalid: 'Elige un archivo de imagen válido.',
  imageConverted: 'Conversión lista. La descarga comenzará enseguida.',
  imageFailed: 'No se pudo convertir la imagen. Prueba con otro formato.',
  qrMissing: 'Escribe un enlace o un texto.', qrReady: 'Tu código QR está listo.',
  qrFailed: 'No se pudo crear el código QR. Prueba con un texto más corto.',
  invalidColor: 'Escribe un color HEX válido (por ejemplo, #155C42).',
  copyFail: 'No se pudo copiar. Selecciona y copia el valor.',
  metaTitle: 'MiniKit — Herramientas gratuitas para tus tareas diarias',
  metaDescription: 'Convierte imágenes, crea códigos QR, cuenta palabras y convierte colores. Gratis, rápido y privado.',
};
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

let providerLimitHit = false;
try {
  for (const [code, name] of candidates) {
    const dictionary = {};
    let failed = false;
    // Reuse the last successful deployment so routine builds do not spend the
    // provider's anonymous quota translating the same copy again.
    try {
      const cached = await fetch(new URL(`locales/${code}.json`, rootUrl), { signal: AbortSignal.timeout(10000) });
      if (cached.ok) Object.assign(dictionary, await cached.json());
    } catch { /* A first deployment has no published locale cache yet. */ }

    const missingEntries = Object.entries(english).filter(([key]) => typeof dictionary[key] !== 'string');
    for (const [key, value] of missingEntries) {
      try {
        dictionary[key] = await translateEntry(value, code);
        await delay(150);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`Skipping ${code}: ${message}`);
        failed = true;
        if (/HTTP (?:402|403|429)|quota|daily limit|limit exceeded|too many requests/i.test(message)) {
          providerLimitHit = true;
        }
        break;
      }
    }
    if (code === 'es') Object.assign(dictionary, spanishOverrides);
    if (failed || Object.keys(dictionary).length !== Object.keys(english).length) {
      if (providerLimitHit) break;
      continue;
    }

    localeOptions.push({ code, name });
    localeRoutes.push({ code, path: `${code}/` });
    generated[code] = dictionary;
    console.log(`Generated /${code}/ with ${Object.keys(dictionary).length} translated strings.`);
  }
  if (providerLimitHit) console.warn('Free translation quota reached; publishing all locales translated successfully so far.');
} catch (error) {
  console.warn(`Free translation mirror unavailable; keeping all locales translated successfully so far. ${error instanceof Error ? error.message : String(error)}`);
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
