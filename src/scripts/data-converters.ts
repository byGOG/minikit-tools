type Cell={text:string;string:boolean};
const MAX_INPUT=100000,MAX_OUTPUT=2000000;
function unicode(text:string){for(const char of text)if(char.length===1&&char.charCodeAt(0)>=0xd800&&char.charCodeAt(0)<=0xdfff)throw Error('Invalid Unicode');return text;}
function input(text:string){if(text.length>MAX_INPUT)throw Error('Input limit');unicode(text);}
function delimiter(value:string){if(![',',';','\t'].includes(value))throw Error('Delimiter');}
export function jsonToCsv(text:string,separator=',',protect=true,bom=false){
 input(text);delimiter(separator);JSON.parse(text);
 const tokens=text.match(/"(?:\\.|[^"\\])*"|[{}\[\],:]|true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/g)??[];let cursor=0;const take=(value:string)=>{if(tokens[cursor++]!==value)throw Error('Flat object array required');};take('[');const rows:Map<string,Cell>[]=[],headers:string[]=[],known=new Set<string>();
 if(tokens[cursor]!==']')while(true){take('{');const row=new Map<string,Cell>();if(tokens[cursor]==='}')throw Error('Empty object');while(true){const keyToken=tokens[cursor++];if(!keyToken?.startsWith('"'))throw Error('Key');const key=unicode(JSON.parse(keyToken));if(!key||row.has(key))throw Error('Duplicate or empty key');take(':');const value=tokens[cursor++];let cell:Cell;if(value?.startsWith('"'))cell={text:unicode(JSON.parse(value)),string:true};else if(value==='null')cell={text:'',string:false};else if(value==='true'||value==='false'||/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(value??''))cell={text:value,string:false};else throw Error('Nested value');row.set(key,cell);if(!known.has(key)){known.add(key);headers.push(key);if(headers.length>100)throw Error('Columns');}if(tokens[cursor]!==',')break;cursor++;}take('}');rows.push(row);if(rows.length>1000)throw Error('Rows');if(tokens[cursor]!==',')break;cursor++;}
 take(']');if(cursor!==tokens.length)throw Error('Trailing JSON');if(rows.length*headers.length>10000)throw Error('Cells');if(!rows.length)return '';
 const quote=(cell:Cell)=>{let value=cell.text;if(protect&&cell.string&&/^\s*[=+\-@\u2212]/.test(value))value="'"+value;return '"'+value.replaceAll('"','""')+'"';};
 const result=(bom?'\uFEFF':'')+[headers.map(key=>quote({text:key,string:true})).join(separator),...rows.map(row=>headers.map(key=>quote(row.get(key)??{text:'',string:false})).join(separator))].join('\r\n');if(result.length>MAX_OUTPUT)throw Error('Output limit');return result;
}
export function parseCsv(text:string,separator=','){
 input(text);delimiter(separator);if(text.startsWith('\uFEFF'))text=text.slice(1);if(!text)return[];
 const rows:string[][]=[];let row:string[]=[],field='',quoted=false,closed=false,started=false,ended=false,cells=0;
 const push=()=>{row.push(field);field='';closed=false;started=false;if(row.length>100||++cells>10100)throw Error('Cells');};
 const end=()=>{push();rows.push(row);row=[];ended=true;if(rows.length>1001)throw Error('Rows');};
 for(let i=0;i<text.length;i++){const char=text[i];if(quoted){if(char==='"'){if(text[i+1]==='"'){field+='"';i++;}else{quoted=false;closed=true;}}else field+=char;continue;}if(char===separator){push();ended=false;continue;}if(char==='\n'||char==='\r'){end();if(char==='\r'&&text[i+1]==='\n')i++;continue;}if(closed)throw Error('Characters after quote');if(char==='"'){if(started)throw Error('Unexpected quote');quoted=true;started=true;ended=false;}else{field+=char;started=true;ended=false;}}
 if(quoted)throw Error('Unclosed field');if(!ended||row.length||started||closed)end();return rows;
}
export function csvToJson(text:string,separator=','){
 const rows=parseCsv(text,separator);if(!rows.length)throw Error('Header required');const headers=rows.shift()!;if(headers.some(key=>!key)||new Set(headers).size!==headers.length||rows.length*headers.length>10000)throw Error('Headers or cells');
 const result=rows.map(row=>{if(row.length!==headers.length)throw Error('Row width');const object:Record<string,string>=Object.create(null);headers.forEach((key,index)=>{object[key]=row[index];});return object;});const output=JSON.stringify(result,null,2);if(output.length>MAX_OUTPUT)throw Error('Output limit');return output;
}
export function setupDataConverters(t:(key:string)=>string){
 const get=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
 for(const id of ['css-min','json-csv','csv-json'] as const){
  const source=get<HTMLTextAreaElement>(id+'-input');if(!source)continue;const output=get<HTMLTextAreaElement>(id+'-output'),feedback=get<HTMLElement>(id+'-feedback'),copy=get<HTMLButtonElement>(id+'-copy'),download=get<HTMLButtonElement>(id+'-download');let revision=0;
  function clear(){revision++;output.value='';copy.disabled=download.disabled=true;feedback.textContent='';feedback.classList.remove('error');}
  get<HTMLElement>(id+'-options').addEventListener('input',clear);
  get<HTMLButtonElement>(id+'-apply').addEventListener('click',async()=>{clear();const ticket=revision,value=source.value;try{let result:string;if(id==='css-min'){const{minifyCss}=await import('./css-minifier.ts');result=minifyCss(value);}else if(id==='json-csv')result=jsonToCsv(value,get<HTMLSelectElement>(id+'-delimiter').value,get<HTMLInputElement>('csv-protect').checked,get<HTMLInputElement>('csv-bom').checked);else result=csvToJson(value,get<HTMLSelectElement>(id+'-delimiter').value);if(ticket!==revision)return;output.value=result;copy.disabled=download.disabled=!result;feedback.textContent=t('ready');}catch{if(ticket!==revision)return;clear();feedback.textContent=t('transformInvalid');feedback.classList.add('error');}});
  get<HTMLButtonElement>(id+'-clear').addEventListener('click',()=>{clear();source.value='';});copy.addEventListener('click',async()=>{const value=output.value;if(!value)return;try{await navigator.clipboard.writeText(value);feedback.textContent=t('copied');}catch{output.focus();output.select();feedback.textContent=t('transformCopyFailed');}});
  download.addEventListener('click',()=>{if(download.disabled)return;const ext=id==='css-min'?'css':id==='json-csv'?'csv':'json';const url=URL.createObjectURL(new Blob([output.value],{type:'text/plain;charset=utf-8'})),link=document.createElement('a');link.href=url;link.download=`minikit-result.${ext}`;link.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);});
 }
}
