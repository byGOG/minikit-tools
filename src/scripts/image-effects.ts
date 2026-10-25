import{validRasterHeader,validateImageSize,centeredSquare}from'./image-geometry.ts';
function pixelCopy(pixels:Uint8ClampedArray){if(pixels.length%4||pixels.length>64000000)throw Error('Pixel data');return new Uint8ClampedArray(pixels);}
export function adjustImagePixels(pixels:Uint8ClampedArray,brightness:number,contrast:number){
 if(![brightness,contrast].every(value=>Number.isFinite(value)&&value>=-100&&value<=100))throw Error('Effect settings');const output=pixelCopy(pixels),factor=(100+contrast)/100,offset=brightness*2.55;for(let i=0;i<output.length;i+=4)for(let channel=0;channel<3;channel++)output[i+channel]=Math.round((pixels[i+channel]-128)*factor+128+offset);return output;
}
export function grayscalePixels(pixels:Uint8ClampedArray){const output=pixelCopy(pixels);for(let i=0;i<output.length;i+=4){const gray=Math.round(.2126*pixels[i]+.7152*pixels[i+1]+.0722*pixels[i+2]);output[i]=output[i+1]=output[i+2]=gray;}return output;}
export function avatarGeometry(width:number,height:number,size:number){validateImageSize(width,height);if(![128,256,512,1024].includes(size))throw Error('Avatar size');return{...centeredSquare(width,height),size};}
export function setupImageEffects(t:(key:string)=>string){
 const get=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
 for(const id of ['tone','grayscale','avatar'] as const){
  const input=get<HTMLInputElement>(id+'-effect-file');if(!input)continue;const action=get<HTMLButtonElement>(id+'-effect-apply'),download=get<HTMLButtonElement>(id+'-effect-download'),preview=get<HTMLImageElement>(id+'-effect-preview'),feedback=get<HTMLElement>(id+'-effect-feedback'),controls=get<HTMLFieldSetElement>(id+'-effect-options');let source:HTMLCanvasElement|null=null,revision=0,outputUrl='';
  function clear(){revision++;download.disabled=true;preview.hidden=true;preview.removeAttribute('src');if(outputUrl)URL.revokeObjectURL(outputUrl);outputUrl='';feedback.textContent='';feedback.classList.remove('error');get<HTMLElement>(id+'-effect-size').textContent='—';action.disabled=!source;}
  function error(){feedback.textContent=t('effectInvalid');feedback.classList.add('error');}
  function reset(){if(id==='tone'){get<HTMLInputElement>('tone-brightness').value='0';get<HTMLInputElement>('tone-contrast').value='0';}if(id==='avatar')get<HTMLSelectElement>('avatar-size').value='512';}
  input.addEventListener('change',async()=>{
   source=null;clear();controls.disabled=true;get<HTMLElement>(id+'-effect-selected').textContent='';const file=input.files?.[0];const ticket=revision;if(!file)return;
   if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size<=0||file.size>20*1024*1024){error();return;}
   let url='';try{
    if(!validRasterHeader(new Uint8Array(await file.slice(0,12).arrayBuffer()),file.type))throw Error('Header');if(ticket!==revision)return;feedback.textContent=t('editorLoading');url=URL.createObjectURL(file);const image=new Image();image.src=url;await image.decode();validateImageSize(image.naturalWidth,image.naturalHeight);if(ticket!==revision)return;
    const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;const context=canvas.getContext('2d');if(!context)throw Error('Canvas');context.drawImage(image,0,0);source=canvas;reset();controls.disabled=false;action.disabled=false;get<HTMLElement>(id+'-effect-selected').textContent=`${file.name} · ${canvas.width} × ${canvas.height}`;feedback.textContent=t('ready');
   }catch{if(ticket===revision){source=null;controls.disabled=true;action.disabled=true;error();}}finally{if(url)URL.revokeObjectURL(url);}
  });
  controls.addEventListener('input',clear);get<HTMLButtonElement>(id+'-effect-reset').addEventListener('click',()=>{reset();clear();});
  action.addEventListener('click',async()=>{
   clear();const original=source;if(!original)return;const ticket=revision;action.disabled=true;feedback.textContent=t('editorLoading');try{
    const canvas=document.createElement('canvas');
    if(id==='avatar'){
     const crop=avatarGeometry(original.width,original.height,Number(get<HTMLSelectElement>('avatar-size').value));canvas.width=canvas.height=crop.size;const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas');ctx.beginPath();ctx.arc(crop.size/2,crop.size/2,crop.size/2,0,Math.PI*2);ctx.clip();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(original,crop.x,crop.y,crop.width,crop.height,0,0,crop.size,crop.size);
    }else{
     canvas.width=original.width;canvas.height=original.height;const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)throw Error('Canvas');ctx.drawImage(original,0,0);const data=ctx.getImageData(0,0,canvas.width,canvas.height);const pixels=id==='grayscale'?grayscalePixels(data.data):adjustImagePixels(data.data,get<HTMLInputElement>('tone-brightness').valueAsNumber,get<HTMLInputElement>('tone-contrast').valueAsNumber);data.data.set(pixels);ctx.putImageData(data,0,0);
    }
    const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/png'));if(ticket!==revision)return;if(!blob||blob.type!=='image/png')throw Error('Encode');outputUrl=URL.createObjectURL(blob);preview.src=outputUrl;preview.hidden=false;download.disabled=false;get<HTMLElement>(id+'-effect-size').textContent=`${canvas.width} × ${canvas.height}`;feedback.textContent=t('ready');
   }catch{if(ticket===revision){download.disabled=true;error();}}finally{if(ticket===revision)action.disabled=!source;}
  });
  download.addEventListener('click',()=>{if(!outputUrl||download.disabled)return;const link=document.createElement('a');link.href=outputUrl;link.download=`minikit-${id}.png`;link.click();});
 }
}
