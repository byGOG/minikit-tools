import{validRasterHeader,validateImageSize}from'./image-geometry.ts';
export function borderGeometry(width:number,height:number,border:number){validateImageSize(width,height);if(!Number.isInteger(border)||border<0||border>512)throw Error('Border');return{...validateImageSize(width+border*2,height+border*2),border};}
export function cornerRadius(width:number,height:number,radius:number){validateImageSize(width,height);if(!Number.isFinite(radius)||radius<0||radius>4096)throw Error('Radius');return Math.min(radius,width/2,height/2);}
export function setupImageDecoration(t:(key:string)=>string){
 const get=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
 for(const id of ['flip','border','rounded'] as const){
  const input=get<HTMLInputElement>(id+'-decorate-file');if(!input)continue;const action=get<HTMLButtonElement>(id+'-decorate-apply'),download=get<HTMLButtonElement>(id+'-decorate-download'),preview=get<HTMLImageElement>(id+'-decorate-preview'),feedback=get<HTMLElement>(id+'-decorate-feedback'),controls=get<HTMLFieldSetElement>(id+'-decorate-options');let source:HTMLCanvasElement|null=null,revision=0,outputUrl='';
  function clear(){revision++;download.disabled=true;preview.hidden=true;preview.removeAttribute('src');if(outputUrl)URL.revokeObjectURL(outputUrl);outputUrl='';feedback.textContent='';feedback.classList.remove('error');get<HTMLElement>(id+'-decorate-size').textContent='—';action.disabled=!source;}
  function error(){feedback.textContent=t('decorationInvalid');feedback.classList.add('error');}
  function reset(){if(id==='flip')get<HTMLSelectElement>('flip-axis').value='horizontal';if(id==='border'){get<HTMLInputElement>('border-width').value='10';get<HTMLInputElement>('border-color').value='#ffffff';}if(id==='rounded')get<HTMLInputElement>('rounded-radius').value='32';}
  input.addEventListener('change',async()=>{
   source=null;clear();controls.disabled=true;get<HTMLElement>(id+'-decorate-selected').textContent='';const file=input.files?.[0];const ticket=revision;if(!file)return;
   if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size<=0||file.size>20*1024*1024){error();return;}
   let url='';try{
    if(!validRasterHeader(new Uint8Array(await file.slice(0,12).arrayBuffer()),file.type))throw Error('Header');if(ticket!==revision)return;feedback.textContent=t('editorLoading');url=URL.createObjectURL(file);const image=new Image();image.src=url;await image.decode();validateImageSize(image.naturalWidth,image.naturalHeight);if(ticket!==revision)return;
    const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;const context=canvas.getContext('2d');if(!context)throw Error('Canvas');context.drawImage(image,0,0);source=canvas;reset();controls.disabled=false;action.disabled=false;get<HTMLElement>(id+'-decorate-selected').textContent=`${file.name} · ${canvas.width} × ${canvas.height}`;feedback.textContent=t('ready');
   }catch{if(ticket===revision){source=null;controls.disabled=true;action.disabled=true;error();}}finally{if(url)URL.revokeObjectURL(url);}
  });
  controls.addEventListener('input',clear);get<HTMLButtonElement>(id+'-decorate-reset').addEventListener('click',()=>{reset();clear();});
  action.addEventListener('click',async()=>{
   clear();const original=source;if(!original)return;const ticket=revision;action.disabled=true;feedback.textContent=t('editorLoading');try{
    const canvas=document.createElement('canvas');
    const width=original.width,height=original.height;
    if(id==='border'){const geometry=borderGeometry(width,height,get<HTMLInputElement>('border-width').valueAsNumber);canvas.width=geometry.width;canvas.height=geometry.height;const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas');const color=get<HTMLInputElement>('border-color').value;if(!/^#[0-9a-f]{6}$/i.test(color))throw Error('Color');ctx.fillStyle=color;ctx.fillRect(0,0,canvas.width,canvas.height);ctx.clearRect(geometry.border,geometry.border,width,height);ctx.drawImage(original,geometry.border,geometry.border);}
    else{canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas');if(id==='flip'){const axis=get<HTMLSelectElement>('flip-axis').value;if(!['horizontal','vertical','both'].includes(axis))throw Error('Axis');const x=axis!=='vertical',y=axis!=='horizontal';ctx.translate(x?width:0,y?height:0);ctx.scale(x?-1:1,y?-1:1);}else{const radius=cornerRadius(width,height,get<HTMLInputElement>('rounded-radius').valueAsNumber);ctx.beginPath();ctx.moveTo(radius,0);ctx.lineTo(width-radius,0);ctx.quadraticCurveTo(width,0,width,radius);ctx.lineTo(width,height-radius);ctx.quadraticCurveTo(width,height,width-radius,height);ctx.lineTo(radius,height);ctx.quadraticCurveTo(0,height,0,height-radius);ctx.lineTo(0,radius);ctx.quadraticCurveTo(0,0,radius,0);ctx.closePath();ctx.clip();}ctx.drawImage(original,0,0);}
    const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/png'));if(ticket!==revision)return;if(!blob||blob.type!=='image/png')throw Error('Encode');outputUrl=URL.createObjectURL(blob);preview.src=outputUrl;preview.hidden=false;download.disabled=false;get<HTMLElement>(id+'-decorate-size').textContent=`${canvas.width} × ${canvas.height}`;feedback.textContent=t('ready');
   }catch{if(ticket===revision){download.disabled=true;error();}}finally{if(ticket===revision)action.disabled=!source;}
  });
  download.addEventListener('click',()=>{if(!outputUrl||download.disabled)return;const link=document.createElement('a');link.href=outputUrl;link.download=`minikit-${id}.png`;link.click();});
 }
}
