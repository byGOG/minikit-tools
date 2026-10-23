import { readFile } from 'node:fs/promises';

export const catalog = JSON.parse(await readFile(new URL('../src/i18n/catalog.json', import.meta.url), 'utf8'));
export const dictionaries = {};
if (catalog.length !== 50 || new Set(catalog.map(({ code }) => code)).size !== 50) {
  throw new Error('The language catalog must contain exactly 50 unique locales.');
}
for (const locale of catalog) {
  if (!/^[a-z]{2,3}$/.test(locale.code) || !['ltr', 'rtl'].includes(locale.dir)) throw new Error('Invalid locale metadata.');
  dictionaries[locale.code] = JSON.parse(await readFile(new URL(`../src/i18n/locales/${locale.code}.json`, import.meta.url), 'utf8'));
}
const keys = Object.keys(dictionaries.en).sort();
for (const { code } of catalog) {
  const dictionary = dictionaries[code];
  if (JSON.stringify(Object.keys(dictionary).sort()) !== JSON.stringify(keys)) throw new Error(`Incomplete dictionary: ${code}`);
  for (const key of keys) {
    if (typeof dictionary[key] !== 'string' || !dictionary[key].trim() || /MK\s*\d{4}\s*[:：]|___|MINIKIT_TAG/i.test(dictionary[key])) {
      throw new Error(`Invalid translation: ${code}.${key}`);
    }
    const tags = dictionary[key].match(/<[^>]+>/g) ?? [];
    if (tags.some((tag) => !/^<\/?span>$|^<br\s*\/?>$/i.test(tag))) throw new Error(`Unexpected HTML: ${code}.${key}`);
    let depth = 0;
    for (const tag of tags) {
      if (tag === '<span>') depth++;
      if (tag === '</span>') depth--;
      if (depth < 0) throw new Error(`Unbalanced HTML: ${code}.${key}`);
    }
    if (depth !== 0) throw new Error(`Unbalanced HTML: ${code}.${key}`);
  }
}

export const escapeHtml = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
export const translatedHtml = (value) => escapeHtml(value)
  .replaceAll('&lt;span&gt;', '<span>').replaceAll('&lt;/span&gt;', '</span>')
  .replace(/&lt;br\s*\/?&gt;/gi, '<br/>');

const config = await readFile(new URL('../astro.config.mjs', import.meta.url), 'utf8');
const site = config.match(/site:\s*['"]([^'"]+)['"]/i)?.[1];
export const siteBase = (config.match(/base:\s*['"]([^'"]+)['"]/i)?.[1] ?? '').replace(/\/$/, '') + '/';
if (!site) throw new Error('Missing public site URL.');
export const rootUrl = new URL(siteBase, site);
export const localePath = (code) => code === 'tr' ? '' : `${code}/`;
