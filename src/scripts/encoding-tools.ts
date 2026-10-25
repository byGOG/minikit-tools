import{decodeBase64,formatJson}from'./developer-tools.ts';
export{convertHtmlEntities}from'./html-entities.ts';
export function inspectJwt(value:string){
 if(value.length>100000)throw Error('Token limit');const parts=value.trim().split('.');if(parts.length!==3||!parts[0]||!parts[1]||parts.some((part,index)=>!(/^[A-Za-z0-9_-]*$/).test(part)||(index<2&&part.length%4===1))||parts[2].length%4===1)throw Error('JWT compact structure');
 const texts=parts.slice(0,2).map(part=>decodeBase64(part.replaceAll('-','+').replaceAll('_','/')));
 const objects=texts.map(text=>JSON.parse(text));if(objects.some(object=>!object||typeof object!=='object'||Array.isArray(object))||typeof objects[0].alg!=='string'||!objects[0].alg)throw Error('JWT objects');
 return{header:formatJson(texts[0]),payload:formatJson(texts[1]),combined:formatJson('{"header":'+texts[0]+',"payload":'+texts[1]+'}')};
}
export function convertNumberBase(value:string,source:number,target:number){
 if(![source,target].every(base=>Number.isInteger(base)&&base>=2&&base<=36)||value.length>4097)throw Error('Base limit');let text=value.trim().replace(/^\u2212/,'-'),negative=false;if(text[0]==='-'||text[0]==='+'){negative=text[0]==='-';text=text.slice(1);}if(!text||text.length>4096||!/^[0-9a-z]+$/i.test(text))throw Error('Integer digits');let number=0n;for(const digit of text.toLowerCase()){const n='0123456789abcdefghijklmnopqrstuvwxyz'.indexOf(digit);if(n>=source)throw Error('Digit outside base');number=number*BigInt(source)+BigInt(n);}return(negative?-number:number).toString(target);
}
export function setupEncodingTools(t:(key:string)=>string){
 const get=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
 for(const id of ['html','jwt','number-base'] as const){
  const output=get<HTMLTextAreaElement>(id+'-encoding-output');if(!output)continue;const feedback=get<HTMLElement>(id+'-encoding-feedback'),copy=get<HTMLButtonElement>(id+'-encoding-copy');let revision=0;
  function clear(){revision++;output.value='';copy.disabled=true;feedback.textContent='';feedback.classList.remove('error');if(id==='jwt'){get<HTMLTextAreaElement>('jwt-header').value='';get<HTMLTextAreaElement>('jwt-payload').value='';}}
  get<HTMLElement>(id+'-encoding-options').addEventListener('input',clear);
  async function apply(decode=false){clear();const ticket=revision;try{
   if(id==='html'){const value=get<HTMLTextAreaElement>('html-encoding-input').value;const {convertHtmlEntities}=await import('./html-entities.ts');const converted=convertHtmlEntities(value,decode);if(ticket!==revision)return;output.value=converted;}
   else if(id==='jwt'){const jwt=inspectJwt(get<HTMLTextAreaElement>('jwt-encoding-input').value);get<HTMLTextAreaElement>('jwt-header').value=jwt.header;get<HTMLTextAreaElement>('jwt-payload').value=jwt.payload;output.value=jwt.combined;}
   else output.value=convertNumberBase(get<HTMLTextAreaElement>('number-base-encoding-input').value,get<HTMLInputElement>('base-source').valueAsNumber,get<HTMLInputElement>('base-target').valueAsNumber);
   copy.disabled=!output.value;feedback.textContent=t('ready');
  }catch{if(ticket!==revision)return;clear();feedback.textContent=t('encodingInvalid');feedback.classList.add('error');}}
  get<HTMLButtonElement>(id+'-encoding-apply').addEventListener('click',()=>apply());if(id==='html')get<HTMLButtonElement>('html-encoding-decode').addEventListener('click',()=>apply(true));
  get<HTMLButtonElement>(id+'-encoding-clear').addEventListener('click',()=>{clear();get<HTMLTextAreaElement>(id+'-encoding-input').value='';});
  copy.addEventListener('click',async()=>{const value=output.value;if(!value)return;try{await navigator.clipboard.writeText(value);feedback.textContent=t('copied');}catch{output.focus();output.select();feedback.textContent=t('encodingCopyFailed');}});
 }
}
