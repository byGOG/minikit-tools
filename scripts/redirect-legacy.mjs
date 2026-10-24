import {readdir,writeFile} from 'node:fs/promises';
import {join,relative,sep} from 'node:path';
async function walk(dir){
 for(const entry of await readdir(dir,{withFileTypes:true})){
  const path=join(dir,entry.name);
  if(entry.isDirectory()) await walk(path);
  else if(entry.name==='index.html'){
   const route=relative('dist',path).split(sep).join('/').replace(/index\.html$/,'');
   const target='https://minikit.top/'+route;
   await writeFile(path,'<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url='+target+'"><link rel="canonical" href="'+target+'"><title>MiniKit</title><script>location.replace('+JSON.stringify(target)+'+location.search+location.hash)</script></head><body><a href="'+target+'">MiniKit →</a></body></html>');
  }
 }
}
await walk('dist');
await writeFile('dist/robots.txt','User-agent: *\nAllow: /\nSitemap: https://minikit.top/sitemap.xml\n');
