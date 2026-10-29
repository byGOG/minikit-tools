import { validRasterHeader, validateImageSize } from './image-geometry';
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
let imageRevision = 0;
let qrDataUrl = '';
let toastTimer: number;
const t = (key: string) => translations[lang]?.[key] ?? translations.en[key] ?? key;

function showToast(message: string) {
  const toast = $('#toast'); toast.textContent = message; toast.classList.add('show');
  window.clearTimeout(toastTimer); toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2200);
}

function applyLanguage(next: Lang) {
  lang = next;
  try { localStorage.setItem('minikit-lang', lang); } catch { /* Language navigation also works without browser storage. */ }
  document.documentElement.lang = lang;
  document.documentElement.dir = catalog.find(({ code }) => code === lang)?.dir ?? 'ltr';
  const currentTranslations = translations[lang] ?? translations.en;
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n; if (key && currentTranslations[key]) el.innerHTML = currentTranslations[key];
  });
  for (const [data, attribute] of [['i18nAria', 'aria-label'], ['i18nPlaceholder', 'placeholder'], ['i18nAlt', 'alt'], ['i18nTitle', 'title']]) {
    const selector = attribute === 'aria-label' ? '[data-i18n-aria]' : attribute === 'placeholder' ? '[data-i18n-placeholder]' : attribute === 'title' ? '[data-i18n-title]' : '[data-i18n-alt]';
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
  if ($('#word-input')) { $('#word-count').textContent = String(countWords($<HTMLTextAreaElement>('#word-input').value)); updateReadTime(); }
  if ($('#color-hex')) updateColorFromHex();
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
  imageRevision++; imageFile = null;
  const feedback = $('#image-feedback'); feedback.classList.remove('error');
  $('#image-controls').classList.add('hidden'); $('#selected-file').textContent = '';
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size === 0) { feedback.textContent = t('imageInvalid'); feedback.classList.add('error'); return; }
  if (file.size > 20 * 1024 * 1024) { feedback.textContent = t('imageTooLarge'); feedback.classList.add('error'); return; }
  imageFile = file; $('#selected-file').textContent = `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB`;
  $('#image-controls').classList.remove('hidden'); feedback.textContent = '';
  $<HTMLButtonElement>('#convert-image').disabled = false;
}
if ($('#image-file')) {
  const fileInput = $<HTMLInputElement>('#image-file');
  fileInput.accept = 'image/png,image/jpeg,image/webp';
  fileInput.addEventListener('change', () => { const file = fileInput.files?.[0]; if (file) setImage(file); else { imageRevision++; imageFile = null; $('#image-controls').classList.add('hidden'); } });
  const uploadZone = $('.upload-zone');
  uploadZone.addEventListener('dragover', (event) => { event.preventDefault(); uploadZone.classList.add('dragging'); });
  uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragging'));
  uploadZone.addEventListener('drop', (event) => { event.preventDefault(); uploadZone.classList.remove('dragging'); const file = (event as DragEvent).dataTransfer?.files[0]; if (file) setImage(file); });
  $('#image-quality').addEventListener('input', (event) => { $('#quality-value').textContent = `${(event.target as HTMLInputElement).value}%`; });
  $('#image-controls').addEventListener('input', () => { imageRevision++; $<HTMLButtonElement>('#convert-image').disabled = false; });
  $('#convert-image').addEventListener('click', async () => {
    const source = imageFile; if (!source) return;
    const ticket = ++imageRevision;
    const feedback = $('#image-feedback'), button = $<HTMLButtonElement>('#convert-image');
    const mime = $<HTMLSelectElement>('#image-format').value;
    const quality = Number($<HTMLInputElement>('#image-quality').value) / 100;
    feedback.textContent = ''; feedback.classList.remove('error'); button.disabled = true;
    let sourceUrl = '';
    try {
      if (!validRasterHeader(new Uint8Array(await source.slice(0, 12).arrayBuffer()), source.type)) throw Error('Image header');
      if (ticket !== imageRevision) return;
      sourceUrl = URL.createObjectURL(source);
      const image = new Image(); image.src = sourceUrl; await image.decode();
      validateImageSize(image.naturalWidth, image.naturalHeight);
      if (ticket !== imageRevision) return;
      const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d'); if (!context) throw Error('Canvas unavailable');
      context.drawImage(image, 0, 0);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime, quality));
      if (ticket !== imageRevision) return;
      if (!blob || blob.type !== mime) throw Error('Conversion unsupported');
      const url = URL.createObjectURL(blob), anchor = document.createElement('a');
      anchor.href = url; anchor.download = `${source.name.replace(/\.[^.]+$/, '')}.${mime.split('/')[1]}`; anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      feedback.textContent = `${t('imageConverted')} ${(blob.size / 1024 / 1024).toFixed(2)} MB`;
    } catch { if (ticket === imageRevision) { feedback.textContent = t('imageFailed') + ' ' + t('editorLimits'); feedback.classList.add('error'); } }
    finally { if (sourceUrl) URL.revokeObjectURL(sourceUrl); if (ticket === imageRevision) button.disabled = false; }
  });
}

if ($('#qr-input')) {
  const input = $<HTMLInputElement>('#qr-input');
  const feedback = $('#qr-feedback');
  const image = $<HTMLImageElement>('#qr-image');
  const generate = $<HTMLButtonElement>('#generate-qr');
  const download = $<HTMLButtonElement>('#download-qr');
  let revision = 0;

  function resetQr() {
    revision++;
    qrDataUrl = '';
    image.classList.add('hidden'); image.removeAttribute('src');
    $('.qr-empty').classList.remove('hidden');
    download.classList.add('hidden'); download.disabled = true;
    generate.classList.remove('hidden'); generate.disabled = false;
    feedback.textContent = ''; feedback.classList.remove('error');
    return revision;
  }

  generate.addEventListener('click', async () => {
    const ticket = resetQr();
    const source = input.value;
    const value = source.trim();
    if (!value || source.length > 1200) {
      feedback.textContent = t(!value ? 'qrMissing' : 'qrFailed');
      feedback.classList.add('error');
      return;
    }
    generate.disabled = true;
    try {
      const { default: QRCode } = await import('qrcode');
      if (ticket !== revision) return;
      const result = await QRCode.toDataURL(value, { width: 400, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#15251e', light: '#ffffff' } });
      if (ticket !== revision) return;
      qrDataUrl = result;
      image.alt = t('qrTitle'); image.src = result; image.classList.remove('hidden');
      $('.qr-empty').classList.add('hidden');
      download.classList.remove('hidden'); download.disabled = false;
      generate.classList.add('hidden'); feedback.textContent = t('qrReady');
    } catch {
      if (ticket === revision) { feedback.textContent = t('qrFailed'); feedback.classList.add('error'); }
    } finally {
      if (ticket === revision) generate.disabled = false;
    }
  });
  download.addEventListener('click', () => {
    if (!qrDataUrl || download.disabled) return;
    const anchor = document.createElement('a'); anchor.href = qrDataUrl; anchor.download = 'minikit-qr.png'; anchor.click();
  });
  input.addEventListener('input', resetQr);
}
if ($('#word-input')) {
$('#word-input').addEventListener('input', (event) => { const value = (event.target as HTMLTextAreaElement).value; $('#word-count').textContent = String(countWords(value)); $('#char-count').textContent = String(countCharacters(value)); updateReadTime(); });
$('#clear-text').addEventListener('click', () => { ($('#word-input') as HTMLTextAreaElement).value = ''; $('#word-count').textContent = '0'; $('#char-count').textContent = '0'; updateReadTime(); showToast(t('cleared')); });
}
if ($('#color-hex')) {
$('#color-picker').addEventListener('input', (event) => { $<HTMLInputElement>('#color-hex').value = (event.target as HTMLInputElement).value.toUpperCase(); updateColorFromHex(); });
$('#color-hex').addEventListener('input', updateColorFromHex);
document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((button) => button.addEventListener('click', async () => {
  const format = button.dataset.copy; const value = format === 'rgb' ? `rgb(${($('#rgb-value').textContent ?? '').replaceAll(' ', '')})` : `hsl(${($('#hsl-value').textContent ?? '').replaceAll(' ', '')})`;
  try { await navigator.clipboard.writeText(value); showToast(t('copied')); } catch { showToast(t('copyFail')); }
}));

}
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
  if ($('#case-input')) setTextResult('case-output', changeCase($<HTMLTextAreaElement>('#case-input').value, caseMode, lang));
  if ($('#dedupe-input')) {
  const deduped = removeDuplicateLines($<HTMLTextAreaElement>('#dedupe-input').value, {
    ignoreCase: $<HTMLInputElement>('#dedupe-ignore-case').checked,
    trimSpaces: $<HTMLInputElement>('#dedupe-trim').checked,
    locale: lang,
  });
  setTextResult('dedupe-output', deduped.text);
  $('#dedupe-removed').textContent = String(deduped.removed);
  }
  if ($('#sort-input')) setTextResult('sort-output', sortLines($<HTMLTextAreaElement>('#sort-input').value, lang, $<HTMLSelectElement>('#sort-order').value === 'desc'));
}
for (const id of ['case-input', 'dedupe-input', 'sort-input']) $(`#${id}`)?.addEventListener('input', updateTextTools);
for (const id of ['dedupe-ignore-case', 'dedupe-trim', 'sort-order']) $(`#${id}`)?.addEventListener('change', updateTextTools);
for (const mode of ['upper', 'lower'] as const) {
  $(`#case-${mode}`)?.addEventListener('click', () => {
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
  $(`#${id}-input`)?.addEventListener('input', () => {
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
  $(`#${id}`)?.addEventListener('input', () => clearEverydayResult('password'));
}
$('#generate-password')?.addEventListener('click', () => {
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
if ($('#unit-category')) populateUnits();
$('#unit-category')?.addEventListener('change', populateUnits);
for (const id of ['unit-from','unit-to','unit-value']) $(`#${id}`)?.addEventListener('input', () => clearEverydayResult('unit'));
$('#convert-unit')?.addEventListener('click', () => {
  clearEverydayResult('unit');
  try {
    const to = $<HTMLSelectElement>('#unit-to').value;
    const result = convertUnit(parseNumeric($<HTMLInputElement>('#unit-value').value), $<HTMLSelectElement>('#unit-category').value as UnitCategory, $<HTMLSelectElement>('#unit-from').value, to);
    setTextResult('unit-output', `${formatNumericResult(result)} ${unitLabel(to)}`);
    $('#unit-feedback').textContent = t('ready');
  } catch { showEverydayError('unit', 'unitInvalid'); }
});
for (const id of ['percent-mode','percent-a','percent-b']) $(`#${id}`)?.addEventListener('input', () => clearEverydayResult('percent'));
$('#calculate-percent')?.addEventListener('click', () => {
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




















async function initialize() {
  await loadLocale();
  if (document.body.dataset.page !== 'directory' && document.querySelector('#anagram-check-tool,#palindrome-check-tool,#emailextract-check-tool')) (await import('./text-checks')).setupTextChecks(t);
  if (document.body.dataset.page !== 'directory' && document.querySelector('#audiotrim-lab-tool,#audiojoin-lab-tool,#audionormal-lab-tool')) (await import('./audio-tools')).setupAudioTools(t);
  if (document.body.dataset.page !== 'directory' && document.querySelector('#primecheck-lab-tool,#factorize-lab-tool,#gcdlcm-lab-tool,#ipv4subnet-lab-tool,#ipv6format-lab-tool,#cidrcheck-lab-tool')) (await import('./math-network-tools')).setupMathNetworkTools(t);
  if (document.body.dataset.page !== 'directory' && document.querySelector('#regex-suite-tool,#htmlmd-suite-tool,#mdpreview-suite-tool,#tipcalc-suite-tool,#fuelcalc-suite-tool,#dateadd-suite-tool')) (await import('./practical-tools')).setupPracticalTools(t);
  if (document.body.dataset.page !== 'directory' && document.querySelector('#blur-creative-tool,#invert-creative-tool')) (await import('./creative-images')).setupCreativeImages(t);
  if (document.body.dataset.page !== 'directory' && document.querySelector('#combine-creative-tool')) (await import('./combine-images')).setupCombineImages(t);
  if (document.body.dataset.page !== 'directory' && document.querySelector('#pdfrotate-new-tool,#pdfreorder-new-tool,#pdfdelete-new-tool,#jsonyaml-new-tool,#yamljson-new-tool,#jsondiff-new-tool,#stopwatch-new-tool,#pomodoro-new-tool,#chance-new-tool')) (await import('./expansion-tools')).setupExpansionTools(t);
  if (document.body.dataset.page !== 'directory' && document.querySelector('#reading-pack-tool,#frequency-pack-tool,#picker-pack-tool,#xmlformat-pack-tool,#urlparse-pack-tool,#contrast-pack-tool')) (await import('./utility-pack')).setupUtilityPack(t);
  if (document.body.dataset.page !== 'directory' && document.querySelector('#flip-tool,#border-tool,#rounded-tool')) (await import('./image-decoration')).setupImageDecoration(t);
  if (document.body.dataset.page !== 'directory' && document.querySelector('#discount-daily-tool,#proportion-daily-tool,#travel-daily-tool')) (await import('./daily-calculators')).setupDailyCalculators(t);
  if (document.body.dataset.page !== 'directory' && document.querySelector('#slug-utility-tool,#reverse-utility-tool,#whitespace-utility-tool')) (await import('./text-utilities')).setupTextUtilities(t);
  if (document.body.dataset.page !== 'directory' && document.querySelector('#css-min-tool,#json-csv-tool,#csv-json-tool')) (await import('./data-converters')).setupDataConverters(t);
  if (document.body.dataset.page !== 'directory' && document.querySelector('#tone-tool,#grayscale-tool,#avatar-tool')) (await import('./image-effects')).setupImageEffects(t);
  if (document.body.dataset.page !== 'directory' && document.querySelector('#html-tool,#jwt-tool,#number-base-tool')) (await import('./encoding-tools')).setupEncodingTools(t);
  if (document.body.dataset.page !== 'directory' && document.querySelector('#age-tool,#date-diff-tool,#countdown-tool')) (await import('./date-tools')).setupDateTools(t);
  if (document.body.dataset.page !== 'directory' && document.querySelector('#replace-tool,#diff-tool,#line-numbering-tool')) (await import('./text-extras')).setupTextExtras(t);
  if (document.body.dataset.page !== 'directory' && document.querySelector('#uuid-tool,#sha-tool,#unix-tool')) (await import('./developer-extras')).setupDeveloperExtras(t);
  if (document.body.dataset.page !== 'directory' && document.querySelector('#images-pdf-tool,#merge-pdf-tool,#split-pdf-tool')) (await import('./pdf-tools')).setupPdfTools(t);
  if (document.body.dataset.page !== 'directory' && document.querySelector('#watermark-tool,#palette-tool,#image64-tool')) (await import('./image-extras')).setupImageExtras(t);
  if (document.body.dataset.page !== 'directory' && document.querySelector('#resize-tool,#crop-tool,#rotate-tool')) (await import('./image-editors')).setupImageEditors(t);
  if (document.body.dataset.page !== 'directory' && document.querySelector('#file-checksum-tool')) (await import('./file-checksum')).setupFileChecksum(t);
  if (document.body.dataset.page !== 'directory' && document.querySelector('#lorem-ipsum-tool')) (await import('./lorem-ipsum')).setupLoremIpsum(t);
  if (document.body.dataset.page !== 'directory' && document.querySelector('#roman-numeral-tool')) (await import('./roman-numerals')).setupRomanNumerals(t);
  if (document.body.dataset.page !== 'directory' && document.querySelector('#morse-code-tool')) (await import('./morse-code')).setupMorseCode(t);
  if (document.body.dataset.page !== 'directory' && document.querySelector('#css-gradient-tool')) (await import('./css-gradient')).setupCSSGradient(t);
  if (document.body.dataset.page !== 'directory' && document.querySelector('#css-shadow-tool')) (await import('./box-shadow')).setupBoxShadow(t);
  if (document.body.dataset.page !== 'directory' && document.querySelector('#aspect-ratio-tool')) (await import('./aspect-ratio')).setupAspectRatio(t);
  if (document.body.dataset.page !== 'directory' && document.querySelector('#css-radius-tool')) (await import('./border-radius')).setupBorderRadius(t);
  if (document.body.dataset.page !== 'directory' && document.querySelector('#text-binary-tool')) (await import('./text-binary')).setupTextBinary(t);
  if (document.body.dataset.page !== 'directory' && document.querySelector('#fraction-tool')) (await import('./fraction')).setupFractionCalculator(t);
  if (document.body.dataset.page !== 'directory' && document.querySelector('#decimal-fraction-tool')) (await import('./decimal-fraction')).setupDecimalFraction(t);
  document.documentElement.dataset.toolsReady = "true";
}
void initialize();

const search = document.querySelector<HTMLInputElement>('#tool-search');
const category = document.querySelector<HTMLSelectElement>('#tool-category');
if (search && category) {
  search.form?.addEventListener('submit', event => event.preventDefault());
  const cards = [...document.querySelectorAll<HTMLElement>('.directory-card')];
  const normalize = (value: string) => value.normalize('NFKC').toLocaleLowerCase(lang).normalize('NFD').replace(/\p{M}/gu, '');
  const filter = () => {
    const terms = normalize(search.value.trim()).split(/\s+/u).filter(Boolean);
    let visible = 0;
    for (const card of cards) {
      const matches = (category.value === 'all' || card.dataset.category === category.value) && terms.every(term => normalize(card.textContent ?? '').includes(term));
      card.hidden = !matches; if (matches) visible++;
    }
    $('#directory-count').textContent = `${visible} / ${cards.length}`;
  };
  search.addEventListener('input', filter); category.addEventListener('change', filter);
}
