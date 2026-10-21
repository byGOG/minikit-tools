import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const dist = 'dist';
const config = await readFile('astro.config.mjs', 'utf8');
const site = config.match(/site:\s*['"]([^'"]+)['"]/i)?.[1];
const base = config.match(/base:\s*['"]([^'"]+)['"]/i)?.[1]?.replace(/\/$/, '');
if (!site || !base) throw new Error('Missing site/base in astro.config.mjs.');
const rootUrl = new URL(base + '/', site).toString();
const siteBase = base + '/';
const esc = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const tools = [
 { slug:'image-converter', title:'imageTitle', desc:'imageDesc', anchor:'image-tool', steps:['uploadChoose','outputFormat','convertDownload'] },
 { slug:'qr-code-generator', title:'qrTitle', desc:'qrDesc', anchor:'qr-tool', steps:['qrLabel','generateQr','downloadQr'] },
 { slug:'word-counter', title:'wordTitle', desc:'wordDesc', anchor:'word-tool', steps:['pasteText','words','readTime'] },
 { slug:'color-converter', title:'colorTitle', desc:'colorDesc', anchor:'color-tool', steps:['chooseColor','preview','localColor'] }
];
const labels = {
tr:['Nasıl kullanılır','Sık sorulan sorular','Girdim sunucuya gönderiliyor mu?','Bu araç ücretsiz mi?','Hangi görsel biçimini seçmeliyim?','Küçük dosya, web için iyi seçim.','Fotoğraflar ve geniş uyumluluk için uygun.','Şeffaflık ve kayıpsız grafikler için uygun.'],
en:['How to use','Frequently asked questions','Is my input sent to a server?','Is this tool free?','Which image format should I choose?','Small file sizes, ideal for web use.','Good for photos and broad compatibility.','Best for transparency and lossless graphics.'],
es:['Cómo usarlo','Preguntas frecuentes','¿Se envían mis datos a un servidor?','¿Es gratis esta herramienta?','¿Qué formato de imagen debo elegir?','Archivos pequeños, ideal para la web.','Adecuado para fotos y amplia compatibilidad.','Ideal para transparencia y gráficos sin pérdida.'],
de:['So funktioniert es','Häufige Fragen','Werden meine Eingaben an einen Server gesendet?','Ist dieses Tool kostenlos?','Welches Bildformat sollte ich wählen?','Kleine Dateien, ideal für das Web.','Gut für Fotos und breite Kompatibilität.','Geeignet für Transparenz und verlustfreie Grafiken.'],
fr:['Mode d’emploi','Questions fréquentes','Mes données sont-elles envoyées à un serveur ?','Cet outil est-il gratuit ?','Quel format d’image choisir ?','Fichiers légers, idéal pour le web.','Adapté aux photos et largement compatible.','Idéal pour la transparence et les images sans perte.'],
pt:['Como usar','Perguntas frequentes','Os meus dados são enviados para um servidor?','Esta ferramenta é gratuita?','Que formato de imagem devo escolher?','Ficheiros pequenos, ideal para a web.','Adequado para fotografias e ampla compatibilidade.','Ideal para transparência e gráficos sem perdas.'],
ru:['Как пользоваться','Частые вопросы','Мои данные отправляются на сервер?','Этот инструмент бесплатный?','Какой формат изображения выбрать?','Небольшой размер, подходит для веба.','Подходит для фотографий и широко совместим.','Подходит для прозрачности и графики без потерь.'],
it:['Come si usa','Domande frequenti','I miei dati vengono inviati a un server?','Questo strumento è gratuito?','Quale formato immagine scegliere?','File leggeri, ideale per il web.','Adatto alle foto e ampiamente compatibile.','Ideale per trasparenza e grafica senza perdita.'],
ar:['طريقة الاستخدام','الأسئلة الشائعة','هل تُرسل بياناتي إلى خادم؟','هل هذه الأداة مجانية؟','ما تنسيق الصورة الذي أختاره؟','حجم صغير، مناسب للويب.','مناسب للصور ومتوافق على نطاق واسع.','مناسب للشفافية والرسومات دون فقدان.'],
zh:['使用方法','常见问题','我的输入会发送到服务器吗？','这个工具免费吗？','应该选择哪种图片格式？','文件更小，适合网页使用。','适合照片，兼容性广。','适合透明背景和无损图形。'],
ja:['使い方','よくある質問','入力内容はサーバーに送信されますか？','このツールは無料ですか？','どの画像形式を選べばよいですか？','ファイルが小さく、Web用途に最適です。','写真向けで、幅広く対応しています。','透明背景や劣化のない画像に適しています。'],
hi:['इस्तेमाल कैसे करें','अक्सर पूछे जाने वाले सवाल','क्या मेरा इनपुट सर्वर पर भेजा जाता है?','क्या यह टूल मुफ़्त है?','कौन-सा इमेज फ़ॉर्मैट चुनें?','छोटी फ़ाइलें, वेब के लिए अच्छा विकल्प।','फ़ोटो और व्यापक संगतता के लिए उपयुक्त।','पारदर्शिता और बिना गुणवत्ता खोए ग्राफ़िक्स के लिए उपयुक्त।'],
id:['Cara menggunakan','Pertanyaan umum','Apakah input saya dikirim ke server?','Apakah alat ini gratis?','Format gambar apa yang sebaiknya dipilih?','Ukuran file kecil, cocok untuk web.','Cocok untuk foto dan kompatibilitas luas.','Cocok untuk transparansi dan grafis tanpa kehilangan kualitas.']
};
const privacy = {
tr:'Şu anda analiz veya reklam hizmeti kullanmıyoruz. Görseller, QR içeriği, metin ve renk değerleri tarayıcında işlenir; sunucularımıza gönderilmez. Bu durum değişirse gizlilik bildirimini güncelleriz.',
en:'We currently use no analytics or advertising services. Images, QR content, text and color values are processed in your browser and are not sent to our servers. We will update this notice if that changes.',
es:'Actualmente no usamos servicios de análisis ni publicidad. Las imágenes, el contenido QR, el texto y los colores se procesan en tu navegador y no se envían a nuestros servidores. Actualizaremos este aviso si cambia.',
de:'Wir verwenden derzeit weder Analyse- noch Werbedienste. Bilder, QR-Inhalte, Texte und Farbwerte werden im Browser verarbeitet und nicht an unsere Server gesendet. Bei Änderungen aktualisieren wir diesen Hinweis.',
fr:'Nous n’utilisons actuellement aucun service d’analyse ni de publicité. Images, contenu QR, texte et couleurs sont traités dans le navigateur, pas envoyés à nos serveurs. Nous actualiserons cet avis en cas de changement.',
pt:'Atualmente não usamos análise nem publicidade. Imagens, conteúdo QR, texto e cores são processados no navegador e não enviados aos nossos servidores. Atualizaremos este aviso se isso mudar.',
ru:'Сейчас мы не используем аналитику или рекламу. Изображения, данные QR, текст и цвета обрабатываются в браузере и не отправляются на наши серверы. Если это изменится, мы обновим уведомление.',
it:'Al momento non utilizziamo analisi o pubblicità. Immagini, contenuti QR, testi e colori vengono elaborati nel browser e non inviati ai nostri server. Aggiorneremo questa informativa se cambierà.',
ar:'لا نستخدم حاليًا خدمات التحليلات أو الإعلانات. تُعالج الصور ومحتوى QR والنصوص والألوان في المتصفح ولا تُرسل إلى خوادمنا. سنحدّث هذا الإشعار إذا تغير ذلك.',
zh:'我们目前不使用分析或广告服务。图像、二维码内容、文本和颜色都在浏览器中处理，不会发送到我们的服务器。如有变化，我们会更新此说明。',
ja:'現在、アクセス解析や広告サービスは使用していません。画像、QRコードの内容、テキスト、色はブラウザー内で処理され、サーバーには送信されません。変更があればこの説明を更新します。',
hi:'हम फ़िलहाल एनालिटिक्स या विज्ञापन सेवाओं का उपयोग नहीं करते। चित्र, QR सामग्री, पाठ और रंग ब्राउज़र में संसाधित होते हैं और हमारे सर्वर पर नहीं भेजे जाते। बदलाव होने पर हम यह सूचना अपडेट करेंगे।',
id:'Saat ini kami tidak menggunakan analitik atau iklan. Gambar, konten QR, teks, dan warna diproses di browser dan tidak dikirim ke server kami. Kami akan memperbarui pemberitahuan ini jika ada perubahan.'
};
function findObject(source, marker) {
 const start=source.indexOf(marker); if(start<0) throw new Error('Missing locale: '+marker);
 const opening=source.indexOf('{',start); let depth=0,quote='',escaped=false;
 for(let i=opening;i<source.length;i++){
  const ch=source[i];
  if(quote){if(escaped)escaped=false;else if(ch==='\\')escaped=true;else if(ch===quote)quote='';continue;}
  if(ch==="'"||ch==='"'){quote=ch;continue;}
  if(ch==='{')depth++;
  if(ch==='}'&&--depth===0)return new Function('return ('+source.slice(opening,i+1)+')')();
 }
 throw new Error('Incomplete locale: '+marker);
}
const appSource=await readFile('src/scripts/app.ts','utf8');
const dictionaries={tr:findObject(appSource,'tr: {')};
for(const file of (await readdir(join(dist,'locales')).catch(()=>[])).filter((f)=>f.endsWith('.json'))){
 dictionaries[file.slice(0,-5)]=JSON.parse(await readFile(join(dist,'locales',file),'utf8'));
}
const locales=[{code:'tr',path:''},...Object.keys(dictionaries).filter((code)=>code!=='tr').map((code)=>({code,path:code+'/'}))];
if(!dictionaries.en)throw new Error('English dictionary missing.');
for(const locale of locales){
 const file=join(dist,locale.path,'index.html');
 let home=await readFile(file,'utf8');
 const prefix=locale.code==='tr'?'':locale.code+'/';
 home=home.replace(/<a class="tool-more" data-tool-page="([^"]+)" href="[^"]*"/g,(_m,slug)=>'<a class="tool-more" data-tool-page="'+slug+'" href="'+siteBase+prefix+'tools/'+slug+'/">');
 if(privacy[locale.code]){
  dictionaries[locale.code].privacyLead=privacy[locale.code];
  home=home.replace(/(<[^>]*data-i18n="privacyLead"[^>]*>)[\s\S]*?(<\/[^>]+>)/i,'$1'+privacy[locale.code]+'$2');
  if(locale.code!=='tr')await writeFile(join(dist,'locales',locale.code+'.json'),JSON.stringify(dictionaries[locale.code]),'utf8');
 }
 await writeFile(file,home,'utf8');
}
const xml=(v)=>v.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const sitemapPath=join(dist,'sitemap.xml');
let sitemap=await readFile(sitemapPath,'utf8');
const newUrls=[];
for(const tool of tools){
 const alternatives=locales.map(({code,path})=>({code,url:new URL(path+'tools/'+tool.slug+'/',rootUrl).toString()}));
 const defaultUrl=alternatives.find((a)=>a.code==='tr').url;
 const alternateTags=alternatives.map((a)=>'<xhtml:link rel="alternate" hreflang="'+a.code+'" href="'+xml(a.url)+'" />').join('');
 for(const locale of locales){
  const toolUrl=alternatives.find((a)=>a.code===locale.code).url;
  const d=dictionaries[locale.code]||dictionaries.en;
  const words=labels[locale.code]||labels.en;
  const titleText=d[tool.title]||dictionaries.en[tool.title];
  const descText=d[tool.desc]||dictionaries.en[tool.desc];
  const pageTitle=titleText+' — MiniKit';
  let html=await readFile(join(dist,locale.path,'index.html'),'utf8');
  html=html.replace(/<title>[\s\S]*?<\/title>/i,'<title>'+esc(pageTitle)+'</title>');
  html=html.replace(/(<meta\s+name="description"\s+content=")[^"]*("\s*\/?>)/i,'$1'+esc(descText)+'$2');
  html=html.replace(/(<meta\s+property="og:title"\s+content=")[^"]*("\s*\/?>)/i,'$1'+esc(pageTitle)+'$2');
  html=html.replace(/(<meta\s+property="og:description"\s+content=")[^"]*("\s*\/?>)/i,'$1'+esc(descText)+'$2');
  html=html.replace(/<link rel="canonical"[^>]*\/?>/gi,'').replace(/<link rel="alternate"[^>]*\/?>/gi,'');
  const head='<link rel="canonical" href="'+xml(toolUrl)+'" />'+alternatives.map((a)=>'<link rel="alternate" hreflang="'+a.code+'" href="'+xml(a.url)+'" />').join('')+'<link rel="alternate" hreflang="x-default" href="'+xml(defaultUrl)+'" />';
  html=html.replace('</head>',head+'</head>');
  const steps=tool.steps.map((k)=>'<li>'+esc(d[k]||dictionaries.en[k]||k)+'</li>').join('');
  const target=siteBase+locale.path+'#'+tool.anchor;
  const intro='<section class="seo-guide" aria-labelledby="guide-title"><nav aria-label="Breadcrumb"><a href="'+siteBase+locale.path+'">'+esc(d.navCta||dictionaries.en.navCta)+'</a> / '+esc(titleText)+'</nav><h1 id="guide-title">'+esc(titleText)+'</h1><p>'+esc(descText)+'</p><h2>'+esc(words[0])+'</h2><ol>'+steps+'</ol>'+
   (tool.slug==='image-converter'?'<h2>'+esc(words[4])+'</h2><div class="format-grid"><article><b>WebP</b><p>'+esc(words[5])+'</p></article><article><b>JPEG</b><p>'+esc(words[6])+'</p></article><article><b>PNG</b><p>'+esc(words[7])+'</p></article></div>':'')+
   '<a class="button-primary" href="'+target+'">'+esc(d.navCta||dictionaries.en.navCta)+'</a></section>';
  html=html.replace('<main id="top">','<main id="top">'+intro);
  const privacyAnswer=privacy[locale.code]||privacy.en;
  const freeAnswer=d.heroProof||dictionaries.en.heroProof;
  const faq='<section class="seo-faq"><h2>'+esc(words[1])+'</h2><details><summary>'+esc(words[2])+'</summary><p>'+esc(privacyAnswer)+'</p></details><details><summary>'+esc(words[3])+'</summary><p>'+esc(freeAnswer)+'</p></details></section>';
  html=html.replace('</main>',faq+'</main>');
  const schema={'@context':'https://schema.org','@graph':[
   {'@type':'WebApplication',name:titleText,applicationCategory:'UtilitiesApplication',operatingSystem:'Any',isAccessibleForFree:true,description:descText},
   {'@type':'FAQPage',mainEntity:[
    {'@type':'Question',name:words[2],acceptedAnswer:{'@type':'Answer',text:privacyAnswer}},
    {'@type':'Question',name:words[3],acceptedAnswer:{'@type':'Answer',text:freeAnswer}}
   ]}
  ]};
  html=html.replace('</head>','<script type="application/ld+json">'+JSON.stringify(schema).replaceAll('<','\\u003c')+'</script></head>');
  const css='.seo-guide{max-width:1190px;margin:10px auto 36px;padding:26px 24px 30px;background:#eef5e9;border:1px solid #e0eadb;border-radius:18px}.seo-guide nav{font-size:12px;color:#64756a;margin-bottom:18px}.seo-guide h1,.seo-guide h2,.seo-faq h2{font-family:Manrope,sans-serif;letter-spacing:-.7px}.seo-guide h1{font-size:clamp(28px,4vw,42px);margin:0 0 10px;color:#173a2b}.seo-guide>p{max-width:740px;line-height:1.7;color:#526258}.seo-guide h2{font-size:20px;margin:22px 0 10px}.seo-guide ol{padding-left:22px;color:#44544a;line-height:1.9}.format-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.format-grid article{padding:14px;background:#fff;border:1px solid #e7ede4;border-radius:10px}.format-grid p{font-size:12px;line-height:1.6;color:#66746a}.seo-guide .button-primary{margin-top:12px}.seo-faq{max-width:1142px;margin:0 auto 44px;padding:0 24px}.seo-faq details{padding:14px 0;border-bottom:1px solid #e3e9e1}.seo-faq summary{font-size:14px;font-weight:700;cursor:pointer}.seo-faq details p{max-width:800px;color:#66746a;line-height:1.7;font-size:13px}@media(max-width:640px){.seo-guide{margin:10px 16px 28px;padding:20px}.format-grid{grid-template-columns:1fr}.seo-guide h1{font-size:30px}}';
  html=html.replace('</style>',css+'</style>');
  const out=join(dist,locale.path,'tools',tool.slug,'index.html');
  await mkdir(join(dist,locale.path,'tools',tool.slug),{recursive:true});
  await writeFile(out,html,'utf8');
  newUrls.push('<url><loc>'+xml(toolUrl)+'</loc>'+alternateTags+'<xhtml:link rel="alternate" hreflang="x-default" href="'+xml(defaultUrl)+'" /></url>');
 }
}
sitemap=sitemap.replace('</urlset>',newUrls.join('')+'</urlset>');
await writeFile(sitemapPath,sitemap,'utf8');
console.log('Generated '+(tools.length*locales.length)+' localized tool pages for '+locales.map((x)=>x.code).join(', ')+'.');
