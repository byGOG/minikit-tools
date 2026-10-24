import{splitLines}from'./text-tools.ts';
const INPUT_LIMIT=100000,OUTPUT_LIMIT=1000000;
function validateText(text:string){if(text.length>INPUT_LIMIT)throw Error('Text limit');}
export function replaceLiteral(text:string,find:string,replacement:string){
 validateText(text);if(!find||find.length>10000||replacement.length>10000)throw Error('Search limit');
 let cursor=0,count=0,index:number;const pieces:string[]=[];let length=0;
 while((index=text.indexOf(find,cursor))!==-1){const before=text.slice(cursor,index);length+=before.length+replacement.length;if(length>OUTPUT_LIMIT)throw Error('Output limit');pieces.push(before,replacement);cursor=index+find.length;count++;}
 const rest=text.slice(cursor);if(length+rest.length>OUTPUT_LIMIT)throw Error('Output limit');pieces.push(rest);return{text:pieces.join(''),count};
}
export function numberLines(text:string,start=1,pad=false){
 validateText(text);const lines=splitLines(text);if(!Number.isInteger(start)||start<1||start>1000000000||lines.length>10000||start+lines.length-1>1000000000)throw Error('Line limit');const width=pad?String(start+Math.max(0,lines.length-1)).length:0;
 const result=lines.map((line,index)=>String(start+index).padStart(width,'0')+'. '+line).join('\n');if(result.length>OUTPUT_LIMIT)throw Error('Output limit');return result;
}
export type DiffRow={kind:'equal'|'add'|'remove';text:string};
export function compareLines(original:string,updated:string){
 validateText(original);validateText(updated);const a=splitLines(original),b=splitLines(updated);if(a.length>500||b.length>500)throw Error('Diff line limit');
 const table=Array.from({length:a.length+1},()=>new Uint16Array(b.length+1));
 for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)table[i][j]=a[i]===b[j]?table[i+1][j+1]+1:Math.max(table[i+1][j],table[i][j+1]);
 const rows:DiffRow[]=[];let i=0,j=0;
 while(i<a.length||j<b.length){if(i<a.length&&j<b.length&&a[i]===b[j]){rows.push({kind:'equal',text:a[i++]});j++;}else if(i<a.length&&(j>=b.length||table[i+1][j]>=table[i][j+1]))rows.push({kind:'remove',text:a[i++]});else rows.push({kind:'add',text:b[j++]});}
 return rows;
}
export function setupTextExtras(t:(key:string)=>string){
 const get=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
 for(const id of ['replace','diff','line-numbering'] as const){
  const output=get<HTMLTextAreaElement>(id+'-extra-output');if(!output)continue;const feedback=get<HTMLElement>(id+'-extra-feedback'),copy=get<HTMLButtonElement>(id+'-extra-copy'),summary=get<HTMLElement>(id+'-summary');
  function clear(){output.value='';copy.disabled=true;feedback.textContent='';feedback.classList.remove('error');summary.textContent='';if(id==='diff')get<HTMLElement>('diff-view').replaceChildren();}
  get<HTMLElement>(id+'-extra-options').addEventListener('input',clear);
  get<HTMLButtonElement>(id+'-apply').addEventListener('click',()=>{
   clear();try{
    if(id==='replace'){const result=replaceLiteral(get<HTMLTextAreaElement>('replace-text').value,get<HTMLInputElement>('replace-find').value,get<HTMLTextAreaElement>('replace-with').value);output.value=result.text;summary.textContent=t('replaceCount')+': '+result.count;}
    else if(id==='line-numbering')output.value=numberLines(get<HTMLTextAreaElement>('line-numbering-text').value,get<HTMLInputElement>('line-numbering-start').valueAsNumber,get<HTMLInputElement>('line-numbering-pad').checked);
    else{
     const rows=compareLines(get<HTMLTextAreaElement>('diff-original').value,get<HTMLTextAreaElement>('diff-updated').value);const labels={add:t('diffAdded'),remove:t('diffRemoved'),equal:t('diffUnchanged')},symbols={add:'+ ',remove:'- ',equal:'  '};const counts={add:0,remove:0,equal:0};const fragment=document.createDocumentFragment();
     for(const row of rows){counts[row.kind]++;const item=document.createElement('li');item.className='diff-line diff-'+row.kind;const prefix=document.createElement('span');prefix.textContent=symbols[row.kind];prefix.setAttribute('aria-label',labels[row.kind]);const code=document.createElement('code');code.textContent=row.text||' ';item.append(prefix,code);fragment.append(item);}get<HTMLElement>('diff-view').append(fragment);output.value=rows.map(row=>symbols[row.kind]+row.text).join('\n');summary.textContent=Object.entries(counts).map(([key,count])=>labels[key as keyof typeof labels]+': '+count).join(' · ');
    }
    copy.disabled=!output.value;feedback.textContent=t('ready');
   }catch{clear();feedback.textContent=t('textExtraInvalid');feedback.classList.add('error');}
  });
  get<HTMLButtonElement>(id+'-extra-clear').addEventListener('click',()=>{clear();for(const field of get<HTMLElement>(id+'-extra-options').querySelectorAll<HTMLTextAreaElement>('textarea'))field.value='';if(id==='replace')get<HTMLInputElement>('replace-find').value='';});
  copy.addEventListener('click',async()=>{const value=output.value;if(!value)return;try{await navigator.clipboard.writeText(value);feedback.textContent=t('copied');}catch{output.focus();output.select();feedback.textContent=t('textExtraCopyFailed');}});
 }
}
