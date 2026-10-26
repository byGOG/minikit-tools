import {readFile} from 'node:fs/promises';
const {indexNowKey:key}=JSON.parse(await readFile(new URL('../src/data/search.json',import.meta.url),'utf8'));
const origin='https://minikit.top';
const keyLocation=`${origin}/${key}.txt`;
const proof=await fetch(keyLocation);
if(!proof.ok || (await proof.text()).trim()!==key) throw new Error('Publish the ownership key before notifying IndexNow.');
const sitemap=await fetch(`${origin}/sitemap.xml`);
if(!sitemap.ok) throw new Error('Live sitemap unavailable');
let xml=await sitemap.text();
if(xml.includes('<sitemapindex')){
 const sitemapUrls=[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
 if(sitemapUrls.length>20||sitemapUrls.some(url=>new URL(url).origin!==origin))throw Error('Unexpected sitemap index');
 xml=(await Promise.all(sitemapUrls.map(async url=>{const response=await fetch(url);if(!response.ok)throw Error('Sitemap child unavailable');return response.text();}))).join('');
}
const urlList=[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
if(!urlList.length || urlList.length>10000 || urlList.some(url=>new URL(url).origin!==origin)) throw new Error('Unexpected sitemap URLs');
const result=await fetch('https://api.indexnow.org/IndexNow',{method:'POST',headers:{'Content-Type':'application/json; charset=utf-8'},body:JSON.stringify({host:'minikit.top',key,keyLocation,urlList})});
console.log(JSON.stringify({endpoint:'IndexNow',status:result.status,urlCount:urlList.length,response:await result.text()}));
if(![200,202].includes(result.status)) process.exitCode=1;
