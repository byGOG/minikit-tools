import{validRasterHeader,validateImageSize}from'./image-geometry';
export function setupPdfTools(t:(key:string)=>string){
 const get=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
 for(const id of ['images-pdf','merge-pdf','split-pdf'] as const){
  const input=get<HTMLInputElement>(id+'-files');if(!input)continue;
  const action=get<HTMLButtonElement>(id+'-apply'),download=get<HTMLButtonElement>(id+'-download'),list=get<HTMLOListElement>(id+'-list'),feedback=get<HTMLElement>(id+'-feedback');
  let files:File[]=[],revision=0,resultUrl='';
  function invalidate(){revision++;download.disabled=true;if(resultUrl)URL.revokeObjectURL(resultUrl);resultUrl='';feedback.textContent='';feedback.classList.remove('error');get<HTMLElement>(id+'-pages').textContent='—';action.disabled=files.length<(id==='merge-pdf'?2:1);}
  function renderList(){list.replaceChildren();for(const[fileIndex,file]of files.entries()){const row=document.createElement('li'),name=document.createElement('span');name.textContent=`${fileIndex+1}. ${file.name}`;row.append(name);for(const[delta,key]of [[-1,'pdfMoveUp'],[1,'pdfMoveDown'],[0,'pdfRemove']] as const){const button=document.createElement('button');button.type='button';button.className='pdf-file-action';button.textContent=delta===-1?'↑':delta===1?'↓':'×';button.setAttribute('aria-label',t(key)+' · '+file.name);button.disabled=delta!==0&&(fileIndex+delta<0||fileIndex+delta>=files.length);button.addEventListener('click',()=>{if(delta===0)files.splice(fileIndex,1);else[files[fileIndex],files[fileIndex+delta]]=[files[fileIndex+delta],files[fileIndex]];invalidate();renderList();});row.append(button);}list.append(row);}get<HTMLElement>(id+'-count').textContent=String(files.length);}
  input.addEventListener('change',()=>{const added=Array.from(input.files??[]);const next=id==='split-pdf'?added:[...files,...added];input.value='';invalidate();if(next.length>(id==='images-pdf'?20:id==='split-pdf'?1:10)||next.some(f=>f.size<=0||f.size>(id==='images-pdf'?20:50)*1024*1024)||next.reduce((sum,f)=>sum+f.size,0)>50*1024*1024){feedback.textContent=t('pdfInvalid');feedback.classList.add('error');return;}files=next;invalidate();renderList();});
  get<HTMLButtonElement>(id+'-clear').addEventListener('click',()=>{files=[];input.value='';invalidate();renderList();});
  get<HTMLElement>(id+'-options')?.addEventListener('input',invalidate);
  action.addEventListener('click',async()=>{
   invalidate();const ticket=revision,chosen=[...files];action.disabled=true;feedback.textContent=t('pdfWorking');
   try{
    const core=await import('./pdf-core');core.validatePdfBatch(chosen.map(file=>file.size),id==='images-pdf');
    let result:{bytes:Uint8Array;pages:number};
    if(id==='images-pdf'){
     const pngs:Uint8Array[]=[];let encodedBytes=0;
     for(const file of chosen){if(ticket!==revision)return;if(!['image/png','image/jpeg','image/webp'].includes(file.type)||!validRasterHeader(new Uint8Array(await file.slice(0,12).arrayBuffer()),file.type))throw Error('Image');const url=URL.createObjectURL(file);try{const image=new Image();image.src=url;await image.decode();validateImageSize(image.naturalWidth,image.naturalHeight);if(ticket!==revision)return;const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;const context=canvas.getContext('2d');if(!context)throw Error('Canvas');context.drawImage(image,0,0);const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('Image encoding');encodedBytes+=blob.size;if(encodedBytes>100*1024*1024)throw Error('Decoded image budget');pngs.push(new Uint8Array(await blob.arrayBuffer()));}finally{URL.revokeObjectURL(url);}}
     result=await core.imagesToPdf(pngs,get<HTMLSelectElement>('pdf-page-size').value==='original');
    }else{
     if(id==='merge-pdf'&&chosen.length<2)throw Error('Two files required');
     const bytes=[];for(const file of chosen){if(ticket!==revision)return;bytes.push(new Uint8Array(await file.arrayBuffer()));}
     result=await core.combinePdfs(bytes,id==='split-pdf'?get<HTMLInputElement>('pdf-range').value:undefined);
    }
    if(ticket!==revision)return;const buffer=new Uint8Array(result.bytes).buffer;resultUrl=URL.createObjectURL(new Blob([buffer],{type:'application/pdf'}));download.disabled=false;get<HTMLElement>(id+'-pages').textContent=String(result.pages);feedback.textContent=t('ready');
   }catch{if(ticket===revision){feedback.textContent=t('pdfInvalid');feedback.classList.add('error');}}
   finally{if(ticket===revision)action.disabled=files.length<(id==='merge-pdf'?2:1);}
  });
  download.addEventListener('click',()=>{if(!resultUrl||download.disabled)return;const link=document.createElement('a');link.href=resultUrl;link.download=`minikit-${id}.pdf`;link.click();});
 }
}
