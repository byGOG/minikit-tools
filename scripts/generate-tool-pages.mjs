import { parseHTML } from 'linkedom';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { catalog, dictionaries, escapeHtml as esc, siteBase, rootUrl, localePath } from './i18n.mjs';
const dist = 'dist';
const labels=JSON.parse(await readFile('src/data/directory-labels.json','utf8'));
const templates=new Map();
const examples=JSON.parse(await readFile('src/data/tool-examples.json','utf8'));
const guides=JSON.parse(await readFile(new URL('../src/data/tool-guides.json',import.meta.url),'utf8'));
const tools = JSON.parse(await readFile(new URL('../src/data/tools.json', import.meta.url), 'utf8'));
const locales=catalog.map(({code})=>({code,path:localePath(code)}));
for (const locale of locales) {
 const file=join(dist,locale.path,'index.html');
 let home=await readFile(file,'utf8');
 home=home.replace(/<a class="tool-more" data-tool-page="([^"]+)" href="[^"]*"/g,(_m,slug)=>'<a class="tool-more" data-tool-page="'+slug+'" href="'+siteBase+locale.path+'tools/'+slug+'/"');
 const {document}=parseHTML(home);
 const grid=document.querySelector('.tool-grid');
 const cards=new Map([...grid.querySelectorAll(':scope > .tool-card')].map(card=>[card.id,card.outerHTML]));
 if(cards.size!==tools.length)throw Error('Tool card/catalog mismatch: '+locale.code);
 grid.innerHTML='<!-- TOOL_SLOT -->';
 const l=labels[locale.code];
 const controls='<form class="directory-filters" role="search"><label>'+esc(l.search)+'<input type="search" id="tool-search" autocomplete="off" aria-controls="tool-directory" /></label><label><span>'+esc(l.category)+'</span><select id="tool-category" aria-controls="tool-directory">'+['all','image','pdf','audio','text','developer','daily'].map(category=>'<option value="'+category+'">'+esc(l[category])+'</option>').join('')+'</select></label><output id="directory-count" aria-live="polite">'+tools.length+' / '+tools.length+'</output></form>';
 const directory=tools.map(tool=>'<article class="directory-card" id="'+tool.anchor+'" data-category="'+tool.category+'"><a href="'+siteBase+locale.path+'tools/'+tool.slug+'/"><span class="directory-category">'+esc(l[tool.category])+'</span><h3 data-i18n="'+tool.title+'">'+esc(dictionaries[locale.code][tool.title])+'</h3><p>'+esc(dictionaries[locale.code][tool.desc])+'</p><span aria-hidden="true">→</span></a></article>').join('');
 const directoryDoc=parseHTML(document.toString()).document;
 const directoryGrid=directoryDoc.querySelector('.tool-grid'); directoryGrid.id='tool-directory';directoryGrid.classList.add('directory-grid'); directoryGrid.innerHTML=directory;
 directoryGrid.insertAdjacentHTML('beforebegin',controls);
 directoryDoc.body.dataset.page='directory';
 await writeFile(file,directoryDoc.toString(),'utf8');
 document.querySelector('.hero')?.remove();
 templates.set(locale.code,{html:document.toString(),cards});
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
  const template=templates.get(locale.code);
  let html=template.html.replace('<!-- TOOL_SLOT -->',template.cards.get(tool.anchor));
  const related=tools.filter(other=>other.category===tool.category&&other.slug!==tool.slug).slice(0,4);
  html=html.replace('</main>','<aside class="related-tools"><h2>'+esc(labels[locale.code].related)+'</h2><ul>'+related.map(other=>'<li><a href="'+siteBase+locale.path+'tools/'+other.slug+'/">'+esc(d[other.title])+'</a></li>').join('')+'</ul></aside></main>');
  html=html.replace(/<title>[\s\S]*?<\/title>/i,'<title>'+esc(pageTitle)+'</title>');
  html=html.replace(/(<meta\s+name="description"\s+content=")[^"]*("\s*\/?>)/i,'$1'+esc(descText)+'$2');
  html=html.replace(/(<meta\s+property="og:title"\s+content=")[^"]*("\s*\/?>)/i,'$1'+esc(pageTitle)+'$2');
  html=html.replace(/(<meta\s+property="og:description"\s+content=")[^"]*("\s*\/?>)/i,'$1'+esc(descText)+'$2');
  html=html.replace(/<link rel="canonical"[^>]*\/?>/gi,'').replace(/<link rel="alternate"[^>]*\/?>/gi,'');
  const head='<link rel="canonical" href="'+xml(toolUrl)+'" />'+alternatives.map((a)=>'<link rel="alternate" hreflang="'+a.code+'" href="'+xml(a.url)+'" />').join('')+'<link rel="alternate" hreflang="x-default" href="'+xml(defaultUrl)+'" />';
  html=html.replace(/<meta property="og:url"[^>]*>/gi,'');
  html=html.replace('</head>',head+'<meta property="og:url" content="'+xml(toolUrl)+'" /></head>');
  const steps=tool.steps.map((k)=>'<li>'+esc(d[k]||dictionaries.en[k]||k)+'</li>').join('');
  const target='#'+tool.anchor;
  html=html.replace(/<h1([^>]*)data-i18n="heroTitle"([^>]*)>([\s\S]*?)<\/h1>/, '<h2$1data-i18n="heroTitle"$2>$3</h2>');
  html=html.replace(/<body([^>]*)>/, '<body$1 data-current-tool="'+tool.anchor+'">');
  const intro='<section class="seo-guide" aria-labelledby="guide-title"><nav aria-label="Breadcrumb"><a href="'+siteBase+locale.path+'">'+esc(d.navCta||dictionaries.en.navCta)+'</a> / '+esc(titleText)+'</nav><h1 id="guide-title">'+esc(titleText)+'</h1><p>'+esc(descText)+'</p><h2>'+esc(words[0])+'</h2><ol>'+steps+'</ol>'+
   (tool.slug==='image-converter'?'<h2>'+esc(words[4])+'</h2><div class="format-grid"><article><b>WebP</b><p>'+esc(words[5])+'</p></article><article><b>JPEG</b><p>'+esc(words[6])+'</p></article><article><b>PNG</b><p>'+esc(words[7])+'</p></article></div>':'')+
   (guides[tool.slug]?.[locale.code]?'<h2>'+esc(guides[tool.slug][locale.code].heading)+'</h2><p>'+esc(guides[tool.slug][locale.code].text)+'</p>':'')+
   (['json-to-yaml','yaml-to-json','json-compare'].includes(tool.slug)?'<p class="guide-limits">'+esc(d.structuredLimits)+'</p>':'')+
   '<a class="button-primary" href="'+target+'">'+esc(d.navCta||dictionaries.en.navCta)+'</a></section>';
  html=html.replace('<main id="top">','<main id="top">'+intro);
  const privacyAnswer=d.privacyLead;
  const freeAnswer=d.heroProof||dictionaries.en.heroProof;
  const faq='<section class="seo-faq"><h2>'+esc(words[1])+'</h2><details><summary>'+esc(words[2])+'</summary><p>'+esc(privacyAnswer)+'</p></details><details><summary>'+esc(words[3])+'</summary><p>'+esc(freeAnswer)+'</p></details></section>';
  const sample=examples[tool.slug];
  const example=sample?'<section class="tool-example"><h2>'+esc(labels[locale.code].example)+'</h2><pre dir="ltr">'+esc(sample[0])+'</pre><p aria-hidden="true">↓</p><pre dir="ltr">'+esc(sample[1])+'</pre></section>':'';
  html=html.replace('</main>',example+faq+'</main>');
  const schema={'@context':'https://schema.org','@graph':[
   {'@type':'WebApplication',name:titleText,applicationCategory:'UtilitiesApplication',operatingSystem:'Any',isAccessibleForFree:true,description:descText,url:toolUrl,inLanguage:locale.code,offers:{'@type':'Offer',price:'0',priceCurrency:'USD'}},
   {'@type':'FAQPage',mainEntity:[
    {'@type':'Question',name:words[2],acceptedAnswer:{'@type':'Answer',text:privacyAnswer}},
    {'@type':'Question',name:words[3],acceptedAnswer:{'@type':'Answer',text:freeAnswer}}
   ]}
   ,{'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'MiniKit',item:new URL(locale.path,rootUrl).href},{'@type':'ListItem',position:2,name:titleText,item:toolUrl}]}
  ]};
  html=html.replace('</head>','<script type="application/ld+json">'+JSON.stringify(schema).replaceAll('<','\\u003c')+'</script></head>');
  const css='body[data-current-tool] .hero{display:none}body[data-current-tool] .tool-grid{display:flex;flex-direction:column}body[data-current-tool] .tool-card{min-height:0}body[data-current-tool="'+tool.anchor+'"] #'+tool.anchor+'{border:2px solid #739c59;max-width:760px;width:100%;align-self:center}body[data-current-tool] .tools-section{padding-top:20px}.seo-guide{max-width:1190px;margin:10px auto 36px;padding:26px 24px 30px;background:#eef5e9;border:1px solid #e0eadb;border-radius:18px}.seo-guide nav{font-size:12px;color:#64756a;margin-bottom:18px}.seo-guide h1,.seo-guide h2,.seo-faq h2{font-family:Manrope,sans-serif;letter-spacing:-.7px}.seo-guide h1{font-size:clamp(28px,4vw,42px);margin:0 0 10px;color:#173a2b}.seo-guide>p{max-width:740px;line-height:1.7;color:#526258}.seo-guide h2{font-size:20px;margin:22px 0 10px}.seo-guide ol{padding-left:22px;color:#44544a;line-height:1.9}.format-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.format-grid article{padding:14px;background:#fff;border:1px solid #e7ede4;border-radius:10px}.format-grid p{font-size:12px;line-height:1.6;color:#66746a}.seo-guide .button-primary{margin-top:12px}.seo-faq{max-width:1142px;margin:0 auto 44px;padding:0 24px}.seo-faq details{padding:14px 0;border-bottom:1px solid #e3e9e1}.seo-faq summary{font-size:14px;font-weight:700;cursor:pointer}.seo-faq details p{max-width:800px;color:#66746a;line-height:1.7;font-size:13px}@media(max-width:640px){.seo-guide{margin:10px 16px 28px;padding:20px}.format-grid{grid-template-columns:1fr}.seo-guide h1{font-size:30px}}';
  html=html.replace('</head>','<style>'+css+'</style></head>');
  const out=join(dist,locale.path,'tools',tool.slug,'index.html');
  await mkdir(join(dist,locale.path,'tools',tool.slug),{recursive:true});
  await writeFile(out,html,'utf8');
  newUrls.push('<url><loc>'+xml(toolUrl)+'</loc>'+alternateTags+'<xhtml:link rel="alternate" hreflang="x-default" href="'+xml(defaultUrl)+'" /></url>');
 }
}
for (const page of ['privacy/', 'contact/']) newUrls.push('<url><loc>'+xml(new URL(page, rootUrl).href)+'</loc></url>');
sitemap=sitemap.replace('</urlset>',newUrls.join('')+'</urlset>').replace(/<xhtml:link[^>]*\/>/g,'');
const entries=[...sitemap.matchAll(/<url>[\s\S]*?<\/url>/g)].map(match=>match[0]);
const chunks=[];
for(let i=0;i<entries.length;i+=1000){const name='sitemap-'+(chunks.length+1)+'.xml';await writeFile(join(dist,name),'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+entries.slice(i,i+1000).join('')+'</urlset>');chunks.push(name);}
await writeFile(sitemapPath,'<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+chunks.map(name=>'<sitemap><loc>'+xml(new URL(name,rootUrl).href)+'</loc></sitemap>').join('')+'</sitemapindex>');
console.log('Generated '+(tools.length*locales.length)+' localized tool pages for '+locales.map((x)=>x.code).join(', ')+'.');
