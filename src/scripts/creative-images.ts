import{validRasterHeader,validateImageSize}from'./image-geometry.ts';
import{invertPixels}from'./practical-core.ts';
export function setupCreativeImages(t:(key:string)=>string){
 const get=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
 for(const id of ['blur','invert'] as const){
  const input=get<HTMLInputElement>(id+'-creative-file');if(!input)continue;const action=get<HTMLButtonElement>(id+'-creative-apply'),download=get<HTMLButtonElement>(id+'-creative-download'),preview=get<HTMLImageElement>(id+'-creative-preview'),feedback=get<HTMLElement>(id+'-creative-feedback'),controls=get<HTMLFieldSetElement>(id+'-creative-options');let source:HTMLCanvasElement|null=null,revision=0,outputUrl='';
  function clear(){revision++;download.disabled=true;preview.hidden=true;preview.removeAttribute('src');if(outputUrl)URL.revokeObjectURL(outputUrl);outputUrl='';feedback.textContent='';feedback.classList.remove('error');get<HTMLElement>(id+'-creative-size').textContent='—';action.disabled=!source;}
  function error(){feedback.textContent=t('creativeInvalid');feedback.classList.add('error');}
  function reset(){if(id==='blur')get<HTMLInputElement>('blur-radius').value='5';}
  input.addEventListener('change',async()=>{
   source=null;clear();controls.disabled=true;get<HTMLElement>(id+'-creative-selected').textContent='';const file=input.files?.[0];const ticket=revision;if(!file)return;
   if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size<=0||file.size>20*1024*1024){error();return;}
   let url='';try{
    if(!validRasterHeader(new Uint8Array(await file.slice(0,12).arrayBuffer()),file.type))throw Error('Header');if(ticket!==revision)return;feedback.textContent=t('editorLoading');url=URL.createObjectURL(file);const image=new Image();image.src=url;await image.decode();validateImageSize(image.naturalWidth,image.naturalHeight);if(ticket!==revision)return;
    const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;const context=canvas.getContext('2d');if(!context)throw Error('Canvas');context.drawImage(image,0,0);source=canvas;reset();controls.disabled=false;action.disabled=false;get<HTMLElement>(id+'-creative-selected').textContent=`${file.name} · ${canvas.width} × ${canvas.height}`;feedback.textContent=t('ready');
   }catch{if(ticket===revision){source=null;controls.disabled=true;action.disabled=true;error();}}finally{if(url)URL.revokeObjectURL(url);}
  });
  controls.addEventListener('input',clear);get<HTMLButtonElement>(id+'-creative-reset').addEventListener('click',()=>{reset();clear();});
  action.addEventListener('click',async()=>{
   clear();const original=source;if(!original)return;const ticket=revision;action.disabled=true;feedback.textContent=t('editorLoading');try{
    const canvas=document.createElement('canvas');
    canvas.width=original.width;canvas.height=original.height;const ctx=canvas.getContext('2d',{willReadFrequently:id==='invert'});if(!ctx)throw Error('Canvas');
    if(id==='blur'){const radius=get<HTMLInputElement>('blur-radius').valueAsNumber;if(!Number.isFinite(radius)||radius<0||radius>50||!('filter'in ctx))throw Error('Blur');ctx.filter=`blur(${radius}px)`;if(radius>0&&ctx.filter==='none')throw Error('Unsupported blur');ctx.drawImage(original,0,0);}else{ctx.drawImage(original,0,0);const data=ctx.getImageData(0,0,canvas.width,canvas.height);data.data.set(invertPixels(data.data));ctx.putImageData(data,0,0);}
    const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/png'));if(ticket!==revision)return;if(!blob||blob.type!=='image/png')throw Error('Encode');outputUrl=URL.createObjectURL(blob);preview.src=outputUrl;preview.hidden=false;download.disabled=false;get<HTMLElement>(id+'-creative-size').textContent=`${canvas.width} × ${canvas.height}`;feedback.textContent=t('ready');
   }catch{if(ticket===revision){download.disabled=true;error();}}finally{if(ticket===revision)action.disabled=!source;}
  });
  download.addEventListener('click',()=>{if(!outputUrl||download.disabled)return;const link=document.createElement('a');link.href=outputUrl;link.download=`minikit-${id}.png`;link.click();});
 }
}
