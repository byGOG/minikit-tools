import {validRasterHeader,validateImageSize} from './image-geometry.ts';
export type MarkPosition='tl'|'tr'|'bl'|'br'|'center';
export function watermarkPlacement(width:number,height:number,textWidth:number,fontSize:number,position:MarkPosition){
 validateImageSize(width,height);
 if(!['tl','tr','bl','br','center'].includes(position)||![textWidth,fontSize].every(Number.isFinite)||textWidth<0||fontSize<=0)throw new RangeError('Invalid watermark');
 const margin=Math.min(width,height)*0.04;
 const x=position==='center'?(width-textWidth)/2:position.endsWith('r')?width-margin-textWidth:margin;
 const y=position==='center'?height/2:position.startsWith('t')?margin+fontSize/2:height-margin-fontSize/2;
 return {x,y};
}
export function dominantPalette(pixels:Uint8ClampedArray,limit=6){
 if(!Number.isInteger(limit)||limit<1||limit>6||pixels.length%4)throw new RangeError('Invalid pixel data');
 const bins=new Map<number,{count:number;r:number;g:number;b:number}>();
 for(let i=0;i<pixels.length;i+=4){if(pixels[i+3]<128)continue;const r=pixels[i],g=pixels[i+1],b=pixels[i+2];const key=((r>>3)<<10)|((g>>3)<<5)|(b>>3);const bin=bins.get(key)??{count:0,r:0,g:0,b:0};bin.count++;bin.r+=r;bin.g+=g;bin.b+=b;bins.set(key,bin);}
 return [...bins.values()].sort((a,b)=>b.count-a.count).slice(0,limit).map(bin=>'#'+[bin.r,bin.g,bin.b].map(v=>Math.round(v/bin.count).toString(16).padStart(2,'0')).join('').toUpperCase());
}
const supported=['image/png','image/jpeg','image/webp'];
export function validateImageFile(type:string,size:number,base64=false){if(!supported.includes(type)||!Number.isInteger(size)||size<=0||size>(base64?5:20)*1024*1024)throw new RangeError('Invalid file');}
export function setupImageExtras(t:(key:string)=>string){
 const get=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
 for(const id of ['watermark','palette','image64'] as const){
  const input=get<HTMLInputElement>(id+'-file');if(!input)continue;
  const action=get<HTMLButtonElement>(id+'-apply'),download=get<HTMLButtonElement>(id+'-download');
  const feedback=get<HTMLElement>(id+'-feedback'),preview=get<HTMLImageElement>(id+'-preview');
  const output=get<HTMLTextAreaElement>(id+'-output');
  let file:File|null=null,revision=0,resultUrl='',sourceUrl='',textResult='';
  function clear(){download.disabled=true;if(output)output.value='';textResult='';if(resultUrl)URL.revokeObjectURL(resultUrl);resultUrl='';if(id==='watermark'){preview.hidden=true;preview.removeAttribute('src');}if(id==='palette')get<HTMLElement>('palette-colors').replaceChildren();const copy=get<HTMLButtonElement>(id+'-copy');if(copy)copy.disabled=true;}
  function message(key:string,error=false){feedback.textContent=t(key);feedback.classList.toggle('error',error);}
  input.addEventListener('change',()=>{revision++;file=input.files?.[0]??null;clear();feedback.textContent='';preview.hidden=true;preview.removeAttribute('src');if(sourceUrl)URL.revokeObjectURL(sourceUrl);sourceUrl='';action.disabled=!file;});
  if(id==='watermark')get<HTMLElement>('watermark-options').addEventListener('input',()=>{revision++;clear();action.disabled=!file;feedback.textContent='';});
  action.addEventListener('click',async()=>{
   const current=file;if(!current)return;const ticket=++revision;clear();preview.hidden=true;preview.removeAttribute('src');if(sourceUrl)URL.revokeObjectURL(sourceUrl);sourceUrl='';action.disabled=true;message('editorLoading');
   let url='';
   try{
    validateImageFile(current.type,current.size,id==='image64');
    if(!validRasterHeader(new Uint8Array(await current.slice(0,12).arrayBuffer()),current.type))throw Error('Header');
    if(ticket!==revision)return;
    url=URL.createObjectURL(current);const image=new Image();image.src=url;await image.decode();validateImageSize(image.naturalWidth,image.naturalHeight);
    if(ticket!==revision)return;
    if(id==='watermark'){
     const text=get<HTMLInputElement>('watermark-text').value.trim();const size=get<HTMLInputElement>('watermark-size').valueAsNumber,opacity=get<HTMLInputElement>('watermark-opacity').valueAsNumber;
     if(!text||text.length>140||!Number.isFinite(size)||size<2||size>15||!Number.isFinite(opacity)||opacity<10||opacity>100)throw Error('Settings');
     const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas');ctx.drawImage(image,0,0);
     let font=Math.min(canvas.width,canvas.height)*size/100;ctx.font=`bold ${font}px sans-serif`;let measured=ctx.measureText(text).width;if(measured>canvas.width*.92){font*=canvas.width*.92/measured;ctx.font=`bold ${font}px sans-serif`;measured=ctx.measureText(text).width;}
     const {x,y}=watermarkPlacement(canvas.width,canvas.height,measured,font,get<HTMLSelectElement>('watermark-position').value as MarkPosition);
     ctx.globalAlpha=opacity/100;ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillStyle=get<HTMLInputElement>('watermark-color').value;ctx.strokeStyle=ctx.fillStyle.toLowerCase()==='#000000'?'#ffffff':'#000000';ctx.lineWidth=Math.max(1,font*.04);ctx.strokeText(text,x,y);ctx.fillText(text,x,y);
     const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/png'));if(ticket!==revision)return;if(!blob)throw Error('Encode');resultUrl=URL.createObjectURL(blob);preview.src=resultUrl;preview.hidden=false;
    }else if(id==='palette'){
     const canvas=document.createElement('canvas');const ratio=Math.min(1,256/Math.max(image.naturalWidth,image.naturalHeight));canvas.width=Math.max(1,Math.round(image.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(image.naturalHeight*ratio));const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)throw Error('Canvas');ctx.drawImage(image,0,0,canvas.width,canvas.height);const colors=dominantPalette(ctx.getImageData(0,0,canvas.width,canvas.height).data);if(!colors.length){message('imageExtraEmptyPalette',true);return;}
     textResult=colors.join('\n');const swatches=get<HTMLElement>('palette-colors');for(const hex of colors){const item=document.createElement('span');item.className='palette-swatch';const chip=document.createElement('i');chip.style.backgroundColor=hex;chip.setAttribute('aria-hidden','true');const code=document.createElement('code');code.textContent=hex;item.append(chip,code);swatches.append(item);}output.value=textResult;sourceUrl=url;url='';preview.src=sourceUrl;preview.hidden=false;get<HTMLButtonElement>('palette-copy').disabled=false;
    }else{
     const value=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(Error('Read'));reader.readAsDataURL(current);});if(ticket!==revision)return;textResult=value;output.value=value;sourceUrl=url;url='';preview.src=sourceUrl;preview.hidden=false;get<HTMLButtonElement>('image64-copy').disabled=false;
    }
    download.disabled=false;message('ready');
   }catch{if(ticket===revision){clear();message('imageExtraInvalid',true);}}
   finally{if(url)URL.revokeObjectURL(url);if(ticket===revision)action.disabled=!file;}
  });
  const copy=get<HTMLButtonElement>(id+'-copy');if(copy)copy.addEventListener('click',async()=>{const value=textResult;if(!value)return;try{await navigator.clipboard.writeText(value);message('copied');}catch{output.focus();output.select();message('imageExtraCopyFailed',true);}});
  download.addEventListener('click',()=>{if(download.disabled)return;const link=document.createElement('a');const blob=id==='watermark'?'':URL.createObjectURL(new Blob([textResult],{type:'text/plain;charset=utf-8'}));link.href=id==='watermark'?resultUrl:blob;link.download=id==='watermark'?'minikit-watermark.png':`minikit-${id}.txt`;link.click();if(blob)setTimeout(()=>URL.revokeObjectURL(blob),1000);});
 }
}
