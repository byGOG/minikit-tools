import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { catalog, dictionaries, escapeHtml as esc, siteBase, rootUrl, localePath } from './i18n.mjs';
const dist = 'dist';
const tools = [
 { slug:'image-converter', title:'imageTitle', desc:'imageDesc', anchor:'image-tool', steps:['uploadChoose','outputFormat','convertDownload'] },
 { slug:'qr-code-generator', title:'qrTitle', desc:'qrDesc', anchor:'qr-tool', steps:['qrLabel','generateQr','downloadQr'] },
 { slug:'word-counter', title:'wordTitle', desc:'wordDesc', anchor:'word-tool', steps:['pasteText','words','readTime'] },
 { slug:'color-converter', title:'colorTitle', desc:'colorDesc', anchor:'color-tool', steps:['chooseColor','preview','localColor'] }
];
const locales=catalog.map(({code})=>({code,path:localePath(code)}));
for (const locale of locales) {
 const file=join(dist,locale.path,'index.html');
 let home=await readFile(file,'utf8');
 home=home.replace(/<a class="tool-more" data-tool-page="([^"]+)" href="[^"]*"/g,(_m,slug)=>'<a class="tool-more" data-tool-page="'+slug+'" href="'+siteBase+locale.path+'tools/'+slug+'/"');
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
  const d=dictionaries[locale.code];
  const words=['guideHow','guideFaq','guidePrivacyQuestion','guideFreeQuestion','guideFormatQuestion','guideWebp','guideJpeg','guidePng'].map((key)=>d[key]);
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
  const privacyAnswer=d.privacyLead;
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
  html=html.replace('</head>','<style>'+css+'</style></head>');
  const out=join(dist,locale.path,'tools',tool.slug,'index.html');
  await mkdir(join(dist,locale.path,'tools',tool.slug),{recursive:true});
  await writeFile(out,html,'utf8');
  newUrls.push('<url><loc>'+xml(toolUrl)+'</loc>'+alternateTags+'<xhtml:link rel="alternate" hreflang="x-default" href="'+xml(defaultUrl)+'" /></url>');
 }
}
sitemap=sitemap.replace('</urlset>',newUrls.join('')+'</urlset>');
await writeFile(sitemapPath,sitemap,'utf8');
console.log('Generated '+(tools.length*locales.length)+' localized tool pages for '+locales.map((x)=>x.code).join(', ')+'.');
