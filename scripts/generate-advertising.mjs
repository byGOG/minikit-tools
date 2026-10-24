import {readFile,writeFile} from 'node:fs/promises';
const config=JSON.parse(await readFile('src/data/advertising.json','utf8'));
if(config.publisherId){
 const publisher=config.publisherId.replace(/^ca-/,'');
 await writeFile('dist/ads.txt',`google.com, ${publisher}, DIRECT, f08c47fec0942fa0\n`);
 console.log('Generated ads.txt. For GitHub project Pages also publish it at https://bygog.github.io/ads.txt.');
}else console.log('AdSense not connected; no ads.txt or advertising requests enabled.');
