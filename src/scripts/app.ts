import QRCode from 'qrcode';
import { setupTextExtras } from './text-extras';
import { setupDeveloperExtras } from './developer-extras';
import { setupPdfTools } from './pdf-tools';
import { setupImageExtras } from './image-extras';
import { setupImageEditors } from './image-editors';
import { generatePassword, UNIT_GROUPS, convertUnit, parseNumeric, calculatePercentage, type UnitCategory, type PercentageMode, type PASSWORD_GROUPS } from './everyday-tools';
import { formatJson, encodeBase64, decodeBase64, convertUrlComponent } from './developer-tools';
import { changeCase, removeDuplicateLines, sortLines } from './text-tools';

import tr from '../i18n/locales/tr.json';
import en from '../i18n/locales/en.json';
import catalog from '../i18n/catalog.json';

type Lang = string;
const translations: Record<Lang, Record<string, string>> = { tr, en };

const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
let lang: Lang = document.documentElement.lang || 'tr';
const siteBase = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
let imageFile: File | null = null;
let qrDataUrl = '';
let toastTimer: number;
const t = (key: string) => translations[lang]?.[key] ?? translations.en[key] ?? key;

function showToast(message: string) {
  const toast = $('#toast'); toast.textContent = message; toast.classList.add('show');
  window.clearTimeout(toastTimer); toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2200);
}

function applyLanguage(next: Lang) {
  lang = next; localStorage.setItem('minikit-lang', lang); document.documentElement.lang = lang;
  document.documentElement.dir = catalog.find(({ code }) => code === lang)?.dir ?? 'ltr';
  const currentTranslations = translations[lang] ?? translations.en;
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n; if (key && currentTranslations[key]) el.innerHTML = currentTranslations[key];
  });
  for (const [data, attribute] of [['i18nAria', 'aria-label'], ['i18nPlaceholder', 'placeholder'], ['i18nAlt', 'alt']]) {
    const selector = attribute === 'aria-label' ? '[data-i18n-aria]' : attribute === 'placeholder' ? '[data-i18n-placeholder]' : '[data-i18n-alt]';
    document.querySelectorAll<HTMLElement>(selector).forEach((el) => { const key = el.dataset[data]; if (key) el.setAttribute(attribute, t(key)); });
  }
  ($('#language-select') as HTMLSelectElement).value = lang;
  $('#mobile-menu-btn').setAttribute('aria-label', t('menuOpen'));
  const isToolPage = /\/tools\/[^/]+\/?$/.test(window.location.pathname);
  if (!isToolPage) {
    const localizedTitle = currentTranslations.metaTitle;
    document.title = localizedTitle && localizedTitle !== 'metaTitle'
      ? localizedTitle
      : lang === 'tr' ? 'MiniKit — Günlük işler için ücretsiz araçlar' : 'MiniKit — Free tools for everyday tasks';
    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const localizedDescription = currentTranslations.metaDescription;
    if (meta) meta.content = localizedDescription && localizedDescription !== 'metaDescription'
      ? localizedDescription
      : lang === 'tr' ? 'Görselini dönüştür, QR kod oluştur, metnini say ve renklerini çevir. Ücretsiz, hızlı ve gizli.' : 'Convert images, generate QR codes, count words and convert colors. Free, fast and private.';
  }
  $('#word-count').textContent = String(countWords($<HTMLTextAreaElement>('#word-input').value)); updateReadTime(); updateColorFromHex();
  updateMobileNav();
  updateTextTools();
}

type SegmentPart = { segment: string; isWordLike?: boolean };
type SegmenterLike = { segment(input: string): Iterable<SegmentPart> };
const Segmenter = (Intl as unknown as { Segmenter?: new (locale?: string, options?: { granularity: 'word' | 'grapheme' }) => SegmenterLike }).Segmenter;
function countWords(text: string) {
  if (!text.trim()) return 0;
  if (Segmenter) return Array.from(new Segmenter(lang, { granularity: 'word' }).segment(text)).filter((part) => part.isWordLike === true).length;
  return text.trim().split(/\s+/u).length;
}
function countCharacters(text: string) {
  return Segmenter ? Array.from(new Segmenter(lang, { granularity: 'grapheme' }).segment(text)).length : Array.from(text).length;
}
function updateReadTime() {
  const value = $<HTMLTextAreaElement>('#word-input').value;
  const count = countWords(value);
  const minutes = lang === 'zh' || lang === 'ja' ? countCharacters(value) / 500 : count / 200;
  $('#read-time').textContent = count === 0 ? `0 ${t('sec')}` : minutes < 1 ? `${Math.max(1, Math.ceil(minutes * 60))} ${t('sec')}` : `${Math.ceil(minutes)} ${t('min')}`;
}

function hexToRgb(hex: string) {
  const clean = hex.replace(/^#/, '');
  if (!/^(?:[\da-f]{3}|[\da-f]{6})$/i.test(clean)) return null;
  const full = clean.length === 3 ? [...clean].map((char) => char + char).join('') : clean;
  return { r: parseInt(full.slice(0, 2), 16), g: parseInt(full.slice(2, 4), 16), b: parseInt(full.slice(4, 6), 16) };
}

function rgbToHsl({ r, g, b }: {r:number;g:number;b:number}) {
  const red = r / 255, green = g / 255, blue = b / 255;
  const max = Math.max(red, green, blue), min = Math.min(red, green, blue); const delta = max - min;
  let h = 0; const l = (max + min) / 2; let s = 0;
  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    if (max === red) h = ((green - blue) / delta) % 6;
    else if (max === green) h = (blue - red) / delta + 2;
    else h = (red - green) / delta + 4;
    h *= 60; if (h < 0) h += 360;
  }
  return `${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%`;
}

function updateColorFromHex() {
  const field = $<HTMLInputElement>('#color-hex'); const rgb = hexToRgb(field.value);
  if (!rgb) { field.classList.add('invalid'); $('#color-feedback').textContent = field.value ? t('invalidColor') : ''; $('#color-feedback').classList.toggle('error', !!field.value); return; }
  field.classList.remove('invalid'); $('#color-feedback').textContent = ''; $('#color-feedback').classList.remove('error');
  const canonical = `#${field.value.replace(/^#/, '').toUpperCase()}`; const normalized = `#${field.value.replace(/^#/, '')}`;
  $<HTMLInputElement>('#color-picker').value = normalized; $('#swatch').style.background = normalized;
  $('#swatch-label').textContent = canonical; $('#rgb-value').textContent = `${rgb.r}, ${rgb.g}, ${rgb.b}`; $('#hsl-value').textContent = rgbToHsl(rgb);
}

function setImage(file: File) {
  const feedback = $('#image-feedback'); feedback.classList.remove('error');
  if (!file.type.startsWith('image/')) { feedback.textContent = t('imageInvalid'); feedback.classList.add('error'); return; }
  if (file.size > 20 * 1024 * 1024) { feedback.textContent = t('imageTooLarge'); feedback.classList.add('error'); return; }
  imageFile = file; $('#selected-file').textContent = `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB`;
  $('#image-controls').classList.remove('hidden'); feedback.textContent = '';
}

const fileInput = $('#image-file') as HTMLInputElement;
fileInput.addEventListener('change', () => { const file = fileInput.files?.[0]; if (file) setImage(file); });
const uploadZone = $('.upload-zone');
uploadZone.addEventListener('dragover', (event) => { event.preventDefault(); uploadZone.classList.add('dragging'); });
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragging'));
uploadZone.addEventListener('drop', (event) => { event.preventDefault(); uploadZone.classList.remove('dragging'); const file = (event as DragEvent).dataTransfer?.files[0]; if (file) setImage(file); });
$('#image-quality').addEventListener('input', (event) => { $('#quality-value').textContent = `${(event.target as HTMLInputElement).value}%`; });
$('#convert-image').addEventListener('click', async () => {
  if (!imageFile) return;
  const feedback = $('#image-feedback'); feedback.classList.remove('error');
  try {
    const sourceUrl = URL.createObjectURL(imageFile);
    const image = new Image(); image.src = sourceUrl;
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('Image decode failed')); });
    const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d'); if (!context) throw new Error('Canvas unavailable');
    context.drawImage(image, 0, 0); URL.revokeObjectURL(sourceUrl);
    const mime = ($('#image-format') as HTMLSelectElement).value;
    const quality = Number(($('#image-quality') as HTMLInputElement).value) / 100;
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime, quality));
    if (!blob) throw new Error('Conversion unsupported');
    const url = URL.createObjectURL(blob); const ext = mime.split('/')[1]; const anchor = document.createElement('a');
    anchor.href = url; anchor.download = `${imageFile.name.replace(/\.[^.]+$/, '')}.${ext}`; anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    feedback.textContent = `${t('imageConverted')} ${(blob.size / 1024 / 1024).toFixed(2)} MB`;
  } catch { feedback.textContent = t('imageFailed'); feedback.classList.add('error'); }
});

$('#generate-qr').addEventListener('click', async () => {
  const value = ($('#qr-input') as HTMLInputElement).value.trim(); const feedback = $('#qr-feedback');
  feedback.classList.remove('error');
  if (!value) { feedback.textContent = t('qrMissing'); feedback.classList.add('error'); return; }
  try {
    qrDataUrl = await QRCode.toDataURL(value, { width: 400, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#15251e', light: '#ffffff' } });
    const image = $('#qr-image') as HTMLImageElement; image.alt = t('qrTitle'); image.src = qrDataUrl; image.classList.remove('hidden'); $('.qr-empty').classList.add('hidden');
    $('#download-qr').classList.remove('hidden'); $('#generate-qr').classList.add('hidden'); feedback.textContent = t('qrReady');
  } catch { feedback.textContent = t('qrFailed'); feedback.classList.add('error'); }
});
$('#download-qr').addEventListener('click', () => { if (!qrDataUrl) return; const a = document.createElement('a'); a.href = qrDataUrl; a.download = 'minikit-qr.png'; a.click(); });
$('#qr-input').addEventListener('input', () => {
  $('#qr-feedback').textContent = ''; if (qrDataUrl) { qrDataUrl = ''; $('#qr-image').classList.add('hidden'); $('.qr-empty').classList.remove('hidden'); $('#download-qr').classList.add('hidden'); $('#generate-qr').classList.remove('hidden'); }
});

$('#word-input').addEventListener('input', (event) => { const value = (event.target as HTMLTextAreaElement).value; $('#word-count').textContent = String(countWords(value)); $('#char-count').textContent = String(countCharacters(value)); updateReadTime(); });
$('#clear-text').addEventListener('click', () => { ($('#word-input') as HTMLTextAreaElement).value = ''; $('#word-count').textContent = '0'; $('#char-count').textContent = '0'; updateReadTime(); showToast(t('cleared')); });
$('#color-picker').addEventListener('input', (event) => { $<HTMLInputElement>('#color-hex').value = (event.target as HTMLInputElement).value.toUpperCase(); updateColorFromHex(); });
$('#color-hex').addEventListener('input', updateColorFromHex);
document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((button) => button.addEventListener('click', async () => {
  const format = button.dataset.copy; const value = format === 'rgb' ? `rgb(${($('#rgb-value').textContent ?? '').replaceAll(' ', '')})` : `hsl(${($('#hsl-value').textContent ?? '').replaceAll(' ', '')})`;
  try { await navigator.clipboard.writeText(value); showToast(t('copied')); } catch { showToast(t('copyFail')); }
}));

$('#language-select').addEventListener('change', (event) => {
  const next = (event.target as HTMLSelectElement).value;
  const toolMatch = window.location.pathname.match(/\/tools\/([^/]+)\/?$/);
  const localePrefix = next === 'tr' ? '' : `${next}/`;
  window.location.assign(toolMatch ? `${siteBase}${localePrefix}tools/${toolMatch[1]}/` : next === 'tr' ? siteBase : `${siteBase}${next}/`);
});
let caseMode: 'upper' | 'lower' = 'upper';
function setTextResult(id: string, value: string) {
  $<HTMLTextAreaElement>(`#${id}`).value = value;
  $<HTMLButtonElement>(`[data-copy-output="${id}"]`).disabled = value.length === 0;
}
function updateTextTools() {
  setTextResult('case-output', changeCase($<HTMLTextAreaElement>('#case-input').value, caseMode, lang));
  const deduped = removeDuplicateLines($<HTMLTextAreaElement>('#dedupe-input').value, {
    ignoreCase: $<HTMLInputElement>('#dedupe-ignore-case').checked,
    trimSpaces: $<HTMLInputElement>('#dedupe-trim').checked,
    locale: lang,
  });
  setTextResult('dedupe-output', deduped.text);
  $('#dedupe-removed').textContent = String(deduped.removed);
  setTextResult('sort-output', sortLines($<HTMLTextAreaElement>('#sort-input').value, lang, $<HTMLSelectElement>('#sort-order').value === 'desc'));
}
for (const id of ['case-input', 'dedupe-input', 'sort-input']) $(`#${id}`).addEventListener('input', updateTextTools);
for (const id of ['dedupe-ignore-case', 'dedupe-trim', 'sort-order']) $(`#${id}`).addEventListener('change', updateTextTools);
for (const mode of ['upper', 'lower'] as const) {
  $(`#case-${mode}`).addEventListener('click', () => {
    caseMode = mode;
    $('#case-upper').setAttribute('aria-pressed', String(mode === 'upper'));
    $('#case-lower').setAttribute('aria-pressed', String(mode === 'lower'));
    updateTextTools();
  });
}
document.querySelectorAll<HTMLButtonElement>('[data-copy-output]').forEach((button) => button.addEventListener('click', async () => {
  const value = $<HTMLTextAreaElement>(`#${button.dataset.copyOutput}`).value;
  try { await navigator.clipboard.writeText(value); showToast(t('copied')); }
  catch { showToast(t('copyFail')); }
}));
for (const id of ['json', 'base64', 'url']) {
  $(`#${id}-input`).addEventListener('input', () => {
    setTextResult(`${id}-output`, '');
    $(`#${id}-feedback`).textContent = '';
    $(`#${id}-feedback`).classList.remove('error');
  });
}
document.querySelectorAll<HTMLButtonElement>('[data-dev-tool]').forEach((button) => button.addEventListener('click', () => {
  const id = button.dataset.devTool!;
  const action = button.dataset.devAction;
  const input = $<HTMLTextAreaElement>(`#${id}-input`).value;
  const feedback = $(`#${id}-feedback`);
  setTextResult(`${id}-output`, '');
  feedback.classList.remove('error');
  try {
    const result = id === 'json' ? formatJson(input, action === 'minify')
      : id === 'base64' ? (action === 'decode' ? decodeBase64(input) : encodeBase64(input))
      : convertUrlComponent(input, action === 'decode');
    setTextResult(`${id}-output`, result);
    feedback.textContent = t(id === 'json' ? 'jsonValid' : 'conversionReady');
  } catch (error) {
    feedback.classList.add('error');
    feedback.textContent = t(error instanceof RangeError ? 'devLimit' : id === 'json' ? 'jsonInvalid' : id === 'base64' ? 'base64Invalid' : 'urlInvalid');
  }
}));
document.querySelectorAll<HTMLButtonElement>('[data-clear-input]').forEach((button) => button.addEventListener('click', () => {
  const input = $<HTMLTextAreaElement>(`#${button.dataset.clearInput}`);
  input.value = '';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.focus();
  showToast(t('cleared'));
}));
const menuButton = $('#mobile-menu-btn');
function clearEverydayResult(id: string) {
  setTextResult(`${id}-output`, '');
  $(`#${id}-feedback`).textContent = '';
  $(`#${id}-feedback`).classList.remove('error');
}
function showEverydayError(id: string, key: string) {
  $(`#${id}-feedback`).textContent = t(key);
  $(`#${id}-feedback`).classList.add('error');
}
const formatNumericResult = (value: number) => new Intl.NumberFormat(lang, { maximumSignificantDigits: 12, useGrouping: false }).format(value);
for (const id of ['password-length','password-upper','password-lower','password-digits','password-symbols']) {
  $(`#${id}`).addEventListener('input', () => clearEverydayResult('password'));
}
$('#generate-password').addEventListener('click', () => {
  clearEverydayResult('password');
  try {
    const groups = (['upper','lower','digits','symbols'] as (keyof typeof PASSWORD_GROUPS)[]).filter(group => $<HTMLInputElement>(`#password-${group}`).checked);
    setTextResult('password-output', generatePassword(Number($<HTMLInputElement>('#password-length').value), groups));
    $('#password-feedback').textContent = t('ready');
  } catch { showEverydayError('password', 'passwordInvalid'); }
});
const unitLabel = (unit: string) => unit === 'C' ? '°C' : unit === 'F' ? '°F' : unit;
function populateUnits() {
  const category = $<HTMLSelectElement>('#unit-category').value as UnitCategory;
  const units = Object.keys(UNIT_GROUPS[category]);
  for (const id of ['unit-from','unit-to']) {
    const select = $<HTMLSelectElement>(`#${id}`);
    select.replaceChildren(...units.map(unit => { const option = document.createElement('option'); option.value = unit; option.textContent = unitLabel(unit); return option; }));
    select.value = units[id === 'unit-from' ? 0 : 1];
  }
  clearEverydayResult('unit');
}
populateUnits();
$('#unit-category').addEventListener('change', populateUnits);
for (const id of ['unit-from','unit-to','unit-value']) $(`#${id}`).addEventListener('input', () => clearEverydayResult('unit'));
$('#convert-unit').addEventListener('click', () => {
  clearEverydayResult('unit');
  try {
    const to = $<HTMLSelectElement>('#unit-to').value;
    const result = convertUnit(parseNumeric($<HTMLInputElement>('#unit-value').value), $<HTMLSelectElement>('#unit-category').value as UnitCategory, $<HTMLSelectElement>('#unit-from').value, to);
    setTextResult('unit-output', `${formatNumericResult(result)} ${unitLabel(to)}`);
    $('#unit-feedback').textContent = t('ready');
  } catch { showEverydayError('unit', 'unitInvalid'); }
});
for (const id of ['percent-mode','percent-a','percent-b']) $(`#${id}`).addEventListener('input', () => clearEverydayResult('percent'));
$('#calculate-percent').addEventListener('click', () => {
  clearEverydayResult('percent');
  try {
    const mode = $<HTMLSelectElement>('#percent-mode').value as PercentageMode;
    const result = calculatePercentage(parseNumeric($<HTMLInputElement>('#percent-a').value), parseNumeric($<HTMLInputElement>('#percent-b').value), mode);
    setTextResult('percent-output', formatNumericResult(result) + (mode === 'of' ? '' : '%'));
    $('#percent-feedback').textContent = t('ready');
  } catch { showEverydayError('percent', 'percentInvalid'); }
});
const mobileNav = document.createElement('nav'); mobileNav.id = 'mobile-nav'; mobileNav.className = 'mobile-nav'; mobileNav.setAttribute('aria-label', t('mobileNavigation'));
mobileNav.innerHTML = '<a href="#tools" data-mobile-nav="navTools"></a><a href="#why" data-mobile-nav="navWhy"></a><a href="#privacy" data-mobile-nav="navPrivacy"></a>';
document.querySelector('.site-header')?.insertAdjacentElement('afterend', mobileNav);
const updateMobileNav = () => {
  mobileNav.setAttribute('aria-label', t('mobileNavigation'));
  mobileNav.querySelectorAll<HTMLAnchorElement>('[data-mobile-nav]').forEach((a) => { a.textContent = t(a.dataset.mobileNav ?? ''); });
};
menuButton.addEventListener('click', () => { const open = mobileNav.classList.toggle('open'); menuButton.setAttribute('aria-label', open ? t('menuClose') : t('menuOpen')); menuButton.setAttribute('aria-expanded', String(open)); });
mobileNav.addEventListener('click', () => { mobileNav.classList.remove('open'); menuButton.setAttribute('aria-label', t('menuOpen')); menuButton.setAttribute('aria-expanded', 'false'); });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && mobileNav.classList.contains('open')) { mobileNav.classList.remove('open'); menuButton.setAttribute('aria-expanded', 'false'); menuButton.focus(); } });
$('#year').textContent = String(new Date().getFullYear());
async function loadLocale() {
  if (lang !== 'tr' && lang !== 'en') {
    try {
      const response = await fetch(`${siteBase}locales/${lang}.json`);
      if (response.ok) translations[lang] = { ...translations.en, ...await response.json() };
    } catch { /* The statically translated page remains readable when the locale JSON cannot be fetched. */ }
    if (!translations[lang]) {
      updateMobileNav();
      return; // Keep the localized static HTML if the dictionary cannot be loaded.
    }
  }
  updateMobileNav();
  applyLanguage(lang);
}
setupImageEditors(t);
setupImageExtras(t);
setupPdfTools(t);
setupDeveloperExtras(t);
setupTextExtras(t);
void loadLocale();
