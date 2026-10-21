import QRCode from 'qrcode';

type Lang = 'tr' | 'en';
const translations: Record<Lang, Record<string, string>> = {
  tr: {
    announcement: 'Küçük işler, daha kolay. MiniKit şimdi yayında.', explore: 'Keşfet', navTools: 'Araçlar', navWhy: 'Neden MiniKit?', navPrivacy: 'Gizlilik', navCta: 'Araçları keşfet', eyebrow: 'HER GÜN İŞE YARAYAN ARAÇLAR', heroTitle: 'Günlük işler için<br/><span>küçük bir kısayol.</span>', heroLead: 'Görseli dönüştür, QR kod oluştur, metnini say. İhtiyacın olan pratik araçlar, tek bir sakin yerde.', heroCta: 'Ücretsiz araçları dene', heroProof: 'Hesap gerekmez · Hep ücretsiz', privacyLine: 'Dosyaların cihazında kalır. Yükleme yok, hesap yok.', ready: 'Hazır!', quickTools: 'Hızlı araçlar', pickTool: 'Bugün ne yapmak istersin?', compress: 'Görsel sıkıştır', makeQr: 'QR kod oluştur', countWords: 'Kelime say', convertColor: 'Renk dönüştür', privateDevice: '%100 cihazında. Her zaman gizli.', statFast: 'Anında çalışır', statPrivate: 'Gizlilik önce gelir', statFree: 'Ücretsiz ve kolay', statNew: 'Her hafta yeni araçlar', toolsEyebrow: 'ARAÇ KUTUN', toolsTitle: 'İşini gören araçlar.<br/><span>Gereksiz kalabalık yok.</span>', toolsAvailable: 'araç hazır', free: 'ÜCRETSİZ', imageTitle: 'Görsel dönüştürücü', imageDesc: 'Görsellerini WebP, JPEG veya PNG’ye dönüştür ya da boyutunu küçült.', uploadChoose: 'Görsel seç veya sürükle bırak', fileLimit: 'JPG, PNG, WEBP · En fazla 20 MB', outputFormat: 'Çıktı formatı', quality: 'Kalite', convertDownload: 'Dönüştür ve indir', localImage: 'Görselin cihazında işlenir', qrTitle: 'QR kod oluşturucu', qrDesc: 'Bir bağlantı veya kısa metin yaz; QR kodunu indirip paylaş.', qrLabel: 'Bağlantı veya metin', qrEmpty: 'QR kodun burada görünecek', generateQr: 'QR kod oluştur', downloadQr: 'QR kodu indir', localQr: 'Kodun bu cihazda oluşturulur', wordTitle: 'Kelime sayacı', wordDesc: 'Kelime, karakter ve okuma süresi sayını anında öğren.', pasteText: 'Metnini buraya yaz', words: 'Kelime', characters: 'Karakter', readTime: 'Okuma süresi', clearText: 'Metni temizle', localWord: 'Metnin cihazından çıkmaz', colorTitle: 'Renk dönüştürücü', colorDesc: 'HEX, RGB ve HSL değerleri arasında kolayca geçiş yap.', chooseColor: 'Bir renk seç', preview: 'Önizleme', localColor: 'Değerler anında hesaplanır', whyEyebrow: 'DAHA AZ UĞRAŞ, DAHA ÇOK İŞ', whyTitle: 'Araç aramaya<br/>değil, işine odaklan.', whyLead: 'Her küçük iş için başka bir siteye gitmen gerekmiyor. MiniKit, en sık kullandığın pratik araçları temiz ve anlaşılır bir yerde toplar.', allTools: 'Araçları keşfet', benefitOneTitle: 'Gerçekten hızlı', benefitOne: 'Aç, yap, bitir. İndirme yok, kayıt formu yok, beklemek yok.', benefitTwoTitle: 'Önce gizlilik', benefitTwo: 'Dosyaların ve metnin cihazından ayrılmaz. Verilerini saklamayız.', benefitThreeTitle: 'Herkes için basit', benefitThree: 'Kafa karıştıran menüler yok. Aradığın şey, tam da olması gereken yerde.', privacyEyebrow: 'TASARLANDIĞI GİBİ GİZLİ', privacyTitle: 'Dosyaların bize<br/><span>uğramadan işini görür.</span>', privacyLead: 'Görsellerini tarayıcında işleriz. QR kodlarını ve renklerini cihazında oluştururuz. Yazdıkların seninle kalır. Kullanım analitiği veya reklam servisleri eklenirse bu bildirim güncellenir.', privacyStamp: 'GİZLİLİK ÖNCE GELİR', ctaTitle: 'Bir sonraki küçük işin<br/>daha kolay olsun.', ctaLead: 'İlk aracını hemen dene. Ücretsiz, hesapsız, zahmetsiz.', ctaButton: 'Hadi başlayalım', footerLine: 'Günlük işler için küçük kısayollar.', madeWith: 'Dikkatle yapıldı, herkes için.', imageTooLarge: 'Bu dosya 20 MB sınırını aşıyor.', imageInvalid: 'Lütfen geçerli bir görsel seç.', imageConverted: 'Dönüştürme tamamlandı, indirme başladı.', imageFailed: 'Görsel dönüştürülemedi. Başka bir format deneyin.', qrMissing: 'Lütfen bir bağlantı veya metin yazın.', qrReady: 'QR kodun hazır.', qrFailed: 'QR kod oluşturulamadı. Metnini kısaltıp tekrar dene.', copied: 'Panoya kopyalandı.', invalidColor: 'Geçerli bir HEX rengi yazın (ör. #155C42).', menuOpen: 'Menüyü aç', menuClose: 'Menüyü kapat', cleared: 'Metin temizlendi.', sec: 'sn', min: 'dk', copyFail: 'Kopyalanamadı; değeri seçip kopyalayın.'
  },
  en: {
    announcement: 'Small tasks, made easier. MiniKit is now live.', explore: 'Explore', navTools: 'Tools', navWhy: 'Why MiniKit?', navPrivacy: 'Privacy', navCta: 'Explore tools', eyebrow: 'TOOLS FOR EVERYDAY WINS', heroTitle: 'A little shortcut<br/><span>for everyday things.</span>', heroLead: 'Convert an image, make a QR code, count your words. The handy tools you need, all in one calm place.', heroCta: 'Try free tools', heroProof: 'No account needed · Always free', privacyLine: 'Your files stay on your device. No uploads, no account.', ready: 'Ready!', quickTools: 'Quick tools', pickTool: 'What would you like to do today?', compress: 'Compress image', makeQr: 'Make a QR code', countWords: 'Count words', convertColor: 'Convert color', privateDevice: '100% on your device. Always private.', statFast: 'Works instantly', statPrivate: 'Privacy comes first', statFree: 'Free and simple', statNew: 'New tools every week', toolsEyebrow: 'YOUR TOOLKIT', toolsTitle: 'Tools that get it done.<br/><span>Nothing you don’t need.</span>', toolsAvailable: 'tools ready', free: 'FREE', imageTitle: 'Image converter', imageDesc: 'Convert images to WebP, JPEG or PNG, or make the file smaller.', uploadChoose: 'Choose an image or drop it here', fileLimit: 'JPG, PNG, WEBP · Up to 20 MB', outputFormat: 'Output format', quality: 'Quality', convertDownload: 'Convert & download', localImage: 'Image processed on your device', qrTitle: 'QR code generator', qrDesc: 'Enter a link or short text, then download and share your QR code.', qrLabel: 'Link or text', qrEmpty: 'Your QR code will appear here', generateQr: 'Generate QR code', downloadQr: 'Download QR code', localQr: 'Code generated on this device', wordTitle: 'Word counter', wordDesc: 'Instantly check word count, character count and reading time.', pasteText: 'Type your text here', words: 'Words', characters: 'Characters', readTime: 'Read time', clearText: 'Clear text', localWord: 'Your text never leaves your device', colorTitle: 'Color converter', colorDesc: 'Switch easily between HEX, RGB and HSL values.', chooseColor: 'Choose a color', preview: 'Preview', localColor: 'Values calculated instantly', whyEyebrow: 'LESS FUSS, MORE DONE', whyTitle: 'Focus on your task,<br/>not finding a tool.', whyLead: 'You don’t need a different website for every little task. MiniKit brings the practical tools you use most together in one clear, easy place.', allTools: 'Explore the tools', benefitOneTitle: 'Actually fast', benefitOne: 'Open it, do the thing, move on. No downloads, sign-up forms or waiting.', benefitTwoTitle: 'Privacy first', benefitTwo: 'Your files and text stay on your device. We don’t store your data.', benefitThreeTitle: 'Simple for everyone', benefitThree: 'No confusing menus. What you need is right where it should be.', privacyEyebrow: 'PRIVATE BY DESIGN', privacyTitle: 'Your files get the job<br/><span>done without passing through us.</span>', privacyLead: 'Images are processed in your browser. QR codes and colors are created on your device. Your text stays with you. This notice will be updated if analytics or advertising services are added.', privacyStamp: 'PRIVACY FIRST', ctaTitle: 'Make your next little task<br/>a little easier.', ctaLead: 'Try your first tool now. Free, no account, no fuss.', ctaButton: 'Let’s get started', footerLine: 'Little shortcuts for everyday things.', madeWith: 'Made with care, for everyone.', imageTooLarge: 'This file exceeds the 20 MB limit.', imageInvalid: 'Please choose a valid image.', imageConverted: 'Conversion complete. Your download is starting.', imageFailed: 'Could not convert the image. Try another format.', qrMissing: 'Please enter a link or some text.', qrReady: 'Your QR code is ready.', qrFailed: 'Could not make the QR code. Try a shorter text.', copied: 'Copied to clipboard.', invalidColor: 'Enter a valid HEX color (e.g. #155C42).', menuOpen: 'Open menu', menuClose: 'Close menu', cleared: 'Text cleared.', sec: 'sec', min: 'min', copyFail: 'Could not copy; select and copy the value.'
  }
};

const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const langLabel = $('#lang-label');
let lang: Lang = localStorage.getItem('minikit-lang') === 'en' ? 'en' : 'tr';
let imageFile: File | null = null;
let qrDataUrl = '';
let toastTimer: number;
const t = (key: string) => translations[lang][key] ?? key;

function showToast(message: string) {
  const toast = $('#toast'); toast.textContent = message; toast.classList.add('show');
  window.clearTimeout(toastTimer); toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2200);
}

function applyLanguage(next: Lang) {
  lang = next; localStorage.setItem('minikit-lang', lang); document.documentElement.lang = lang;
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n; if (key && translations[lang][key]) el.innerHTML = translations[lang][key];
  });
  langLabel.textContent = lang === 'tr' ? 'EN' : 'TR';
  $('#language-toggle').setAttribute('aria-label', lang === 'tr' ? 'Switch to English' : 'Türkçeye geç');
  $('#mobile-menu-btn').setAttribute('aria-label', t('menuOpen'));
  document.title = lang === 'tr' ? 'MiniKit — Günlük işler için ücretsiz araçlar' : 'MiniKit — Free tools for everyday tasks';
  const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (meta) meta.content = lang === 'tr' ? 'Görselini dönüştür, QR kod oluştur, metnini say ve renklerini çevir. Ücretsiz, hızlı ve gizli.' : 'Convert images, generate QR codes, count words and convert colors. Free, fast and private.';
  $('#word-count').textContent = String(countWords($('#word-input').value)); updateReadTime(); updateColorFromHex();
}

function countWords(text: string) { const normalized = text.trim(); return normalized ? normalized.split(/\s+/u).length : 0; }
function updateReadTime() {
  const count = countWords($('#word-input').value); const minutes = count / 200;
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
  const field = $('#color-hex'); const rgb = hexToRgb(field.value);
  if (!rgb) { field.classList.add('invalid'); $('#color-feedback').textContent = field.value ? t('invalidColor') : ''; $('#color-feedback').classList.toggle('error', !!field.value); return; }
  field.classList.remove('invalid'); $('#color-feedback').textContent = ''; $('#color-feedback').classList.remove('error');
  const canonical = `#${field.value.replace(/^#/, '').toUpperCase()}`; const normalized = `#${field.value.replace(/^#/, '')}`;
  $('#color-picker').value = normalized; $('#swatch').style.background = normalized;
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
    const image = $('#qr-image') as HTMLImageElement; image.src = qrDataUrl; image.classList.remove('hidden'); $('.qr-empty').classList.add('hidden');
    $('#download-qr').classList.remove('hidden'); $('#generate-qr').classList.add('hidden'); feedback.textContent = t('qrReady');
  } catch { feedback.textContent = t('qrFailed'); feedback.classList.add('error'); }
});
$('#download-qr').addEventListener('click', () => { if (!qrDataUrl) return; const a = document.createElement('a'); a.href = qrDataUrl; a.download = 'minikit-qr.png'; a.click(); });
$('#qr-input').addEventListener('input', () => {
  $('#qr-feedback').textContent = ''; if (qrDataUrl) { qrDataUrl = ''; $('#qr-image').classList.add('hidden'); $('.qr-empty').classList.remove('hidden'); $('#download-qr').classList.add('hidden'); $('#generate-qr').classList.remove('hidden'); }
});

$('#word-input').addEventListener('input', (event) => { const value = (event.target as HTMLTextAreaElement).value; $('#word-count').textContent = String(countWords(value)); $('#char-count').textContent = String(value.length); updateReadTime(); });
$('#clear-text').addEventListener('click', () => { ($('#word-input') as HTMLTextAreaElement).value = ''; $('#word-count').textContent = '0'; $('#char-count').textContent = '0'; updateReadTime(); showToast(t('cleared')); });
$('#color-picker').addEventListener('input', (event) => { $('#color-hex').value = (event.target as HTMLInputElement).value.toUpperCase(); updateColorFromHex(); });
$('#color-hex').addEventListener('input', updateColorFromHex);
document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((button) => button.addEventListener('click', async () => {
  const format = button.dataset.copy; const value = format === 'rgb' ? `rgb(${($('#rgb-value').textContent ?? '').replaceAll(' ', '')})` : `hsl(${($('#hsl-value').textContent ?? '').replaceAll(' ', '')})`;
  try { await navigator.clipboard.writeText(value); showToast(t('copied')); } catch { showToast(t('copyFail')); }
}));

$('#language-toggle').addEventListener('click', () => applyLanguage(lang === 'tr' ? 'en' : 'tr'));
const menuButton = $('#mobile-menu-btn');
const mobileNav = document.createElement('nav'); mobileNav.className = 'mobile-nav'; mobileNav.setAttribute('aria-label', 'Mobile navigation');
mobileNav.innerHTML = '<a href="#tools" data-mobile-nav="navTools"></a><a href="#why" data-mobile-nav="navWhy"></a><a href="#privacy" data-mobile-nav="navPrivacy"></a>';
document.querySelector('.site-header')?.insertAdjacentElement('afterend', mobileNav);
const updateMobileNav = () => mobileNav.querySelectorAll<HTMLAnchorElement>('[data-mobile-nav]').forEach((a) => { a.textContent = t(a.dataset.mobileNav ?? ''); });
menuButton.addEventListener('click', () => { const open = mobileNav.classList.toggle('open'); menuButton.setAttribute('aria-label', open ? t('menuClose') : t('menuOpen')); });
mobileNav.addEventListener('click', () => { mobileNav.classList.remove('open'); menuButton.setAttribute('aria-label', t('menuOpen')); });
const originalApplyLanguage = applyLanguage;
applyLanguage = (next: Lang) => { originalApplyLanguage(next); updateMobileNav(); };
updateMobileNav(); applyLanguage(lang); $('#year').textContent = String(new Date().getFullYear());

