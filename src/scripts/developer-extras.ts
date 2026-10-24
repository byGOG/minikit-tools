export function generateUuids(count:number,random:(bytes:Uint8Array)=>Uint8Array=bytes=>globalThis.crypto.getRandomValues(bytes)){
 if(!Number.isInteger(count)||count<1||count>100)throw Error('UUID count');
 return Array.from({length:count},()=>{const bytes=random(new Uint8Array(16));if(bytes.length!==16)throw Error('Random source');bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;const hex=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');return[hex.slice(0,8),hex.slice(8,12),hex.slice(12,16),hex.slice(16,20),hex.slice(20)].join('-');});
}
export async function sha256Text(text:string){
 if(text.length>100000)throw Error('Text limit');
 for(let i=0;i<text.length;i++){const code=text.charCodeAt(i);if(code>=0xd800&&code<=0xdbff){const next=text.charCodeAt(++i);if(!(next>=0xdc00&&next<=0xdfff))throw Error('Unpaired surrogate');}else if(code>=0xdc00&&code<=0xdfff)throw Error('Unpaired surrogate');}
 const result=await globalThis.crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return Array.from(new Uint8Array(result),b=>b.toString(16).padStart(2,'0')).join('');
}
export type UnixUnit='seconds'|'milliseconds';
const MIN_MS=-62135596800000n,MAX_MS=253402300799999n;
function checkMillis(value:bigint){if(value<MIN_MS||value>MAX_MS)throw Error('Date range');return value;}
export function parseUnix(value:string,unit:UnixUnit){
 if(value.length>40)throw Error('Timestamp');const match=value.trim().match(unit==='seconds'?/^([+-]?)(\d+)(?:\.(\d{1,3}))?$/:/^([+-]?)(\d+)$/);if(!match||!['seconds','milliseconds'].includes(unit))throw Error('Timestamp');
 const magnitude=unit==='seconds'?BigInt(match[2])*1000n+BigInt((match[3]??'').padEnd(3,'0')):BigInt(match[2]);return Number(checkMillis(match[1]==='-'?-magnitude:magnitude));
}
export function formatUnix(milliseconds:number,unit:UnixUnit){
 if(!Number.isSafeInteger(milliseconds)||!['seconds','milliseconds'].includes(unit))throw Error('Timestamp');const n=checkMillis(BigInt(milliseconds));if(unit==='milliseconds')return n.toString();const sign=n<0n?'-':'',abs=n<0n?-n:n,decimal=(abs%1000n).toString().padStart(3,'0').replace(/0+$/,'');return sign+(abs/1000n).toString()+(decimal?'.'+decimal:'');
}
export function parseUtcDate(value:string){
 const m=value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/);if(!m)throw Error('UTC date');const [year,month,day,hour,minute,second,millisecond]=[Number(m[1]),Number(m[2]),Number(m[3]),Number(m[4]),Number(m[5]),Number(m[6]??0),Number((m[7]??'').padEnd(3,'0'))];if(year<1||year>9999||month<1||month>12||day<1||day>31||hour>23||minute>59||second>59)throw Error('UTC date');
 const date=new Date(0);date.setUTCFullYear(year,month-1,day);date.setUTCHours(hour,minute,second,millisecond);if(date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day)throw Error('Calendar date');return date.getTime();
}
export function setupDeveloperExtras(t:(key:string)=>string){
 const get=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
 for(const id of ['uuid','sha','unix'] as const){
  const output=get<HTMLTextAreaElement>(id+'-extra-output');if(!output)continue;const feedback=get<HTMLElement>(id+'-extra-feedback'),copy=get<HTMLButtonElement>(id+'-extra-copy');let revision=0;
  function clear(){revision++;output.value='';copy.disabled=true;feedback.textContent='';feedback.classList.remove('error');}
  function result(value:string){output.value=value;copy.disabled=!value;feedback.textContent=t('ready');feedback.classList.remove('error');}
  function error(){output.value='';copy.disabled=true;feedback.textContent=t('devExtraInvalid');feedback.classList.add('error');}
  get<HTMLElement>(id+'-extra-options').addEventListener('input',clear);
  if(id==='uuid')get<HTMLButtonElement>('uuid-generate').addEventListener('click',()=>{clear();try{result(generateUuids(get<HTMLInputElement>('uuid-count').valueAsNumber).join('\n'));}catch{error();}});
  if(id==='sha')get<HTMLButtonElement>('sha-compute').addEventListener('click',async()=>{clear();const ticket=revision;try{const hash=await sha256Text(get<HTMLTextAreaElement>('sha-text').value);if(ticket===revision)result(hash);}catch{if(ticket===revision)error();}});
  if(id==='unix'){
   const unit=()=>get<HTMLSelectElement>('unix-unit').value as UnixUnit;
   get<HTMLButtonElement>('unix-to-date').addEventListener('click',()=>{clear();try{result(new Date(parseUnix(get<HTMLInputElement>('unix-timestamp').value,unit())).toISOString());}catch{error();}});
   get<HTMLButtonElement>('unix-from-date').addEventListener('click',()=>{clear();try{result(formatUnix(parseUtcDate(get<HTMLInputElement>('unix-date').value),unit()));}catch{error();}});
   get<HTMLButtonElement>('unix-now').addEventListener('click',()=>{clear();const now=Date.now();get<HTMLInputElement>('unix-timestamp').value=formatUnix(now,unit());get<HTMLInputElement>('unix-date').value=new Date(now).toISOString().slice(0,-1);});
  }
  get<HTMLButtonElement>(id+'-extra-clear').addEventListener('click',()=>{clear();if(id==='sha')get<HTMLTextAreaElement>('sha-text').value='';if(id==='unix'){get<HTMLInputElement>('unix-timestamp').value='';get<HTMLInputElement>('unix-date').value='';}});
  copy.addEventListener('click',async()=>{const value=output.value;if(!value)return;try{await navigator.clipboard.writeText(value);feedback.textContent=t('copied');}catch{output.focus();output.select();feedback.textContent=t('devExtraCopyFailed');}});
 }
}
