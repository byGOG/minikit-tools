import {validateImageSize,validRasterHeader,proportionalSize,cropRectangle,centeredSquare,rotatedSize} from './image-geometry';

type Translator = (key: string) => string;
export function setupImageEditors(t: Translator) {
  const get = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
  const number = (id: string) => get<HTMLInputElement>(id).valueAsNumber;
  for (const id of ['resize','crop','rotate'] as const) {
    let source: HTMLCanvasElement | null = null;
    let revision = 0;
    let outputUrl = '';
    let filename = 'image';
    const preview = get<HTMLImageElement>(`${id}-preview`);
    const empty = get<HTMLElement>(`${id}-empty`);
    const download = get<HTMLButtonElement>(`${id}-download`);
    const controls = get<HTMLFieldSetElement>(`${id}-controls`);
    const feedback = get<HTMLElement>(`${id}-feedback`);
    function clearOutput() {
      download.disabled = true;
      preview.hidden = true;
      preview.removeAttribute('src');
      if (outputUrl) URL.revokeObjectURL(outputUrl);
      outputUrl = '';
      empty.hidden = source !== null;
      get<HTMLElement>(`${id}-size`).textContent = '—';
    }
    function error() {
      clearOutput();feedback.textContent = t('editorInvalid');feedback.classList.add('error');
    }
    function resetControls() {
      if (!source) return;
      if (id === 'rotate') {
        get<HTMLSelectElement>('rotate-angle').value = '0';
        get<HTMLInputElement>('rotate-horizontal').checked = false;
        get<HTMLInputElement>('rotate-vertical').checked = false;
      } else {
        get<HTMLInputElement>(`${id}-width`).value = String(source.width);
        get<HTMLInputElement>(`${id}-height`).value = String(source.height);
        if (id === 'resize') get<HTMLInputElement>('resize-ratio').checked = true;
        else {get<HTMLInputElement>('crop-x').value='0';get<HTMLInputElement>('crop-y').value='0';}
      }
    }
    async function render() {
      if (!source) return;
      const original = source;
      const ticket = ++revision;
      clearOutput();feedback.classList.remove('error');feedback.textContent=t('editorLoading');
      try {
        const canvas=document.createElement('canvas');
        const width=original.width,height=original.height;
        const dimensions = id==='rotate' ? rotatedSize(width,height,Number(get<HTMLSelectElement>('rotate-angle').value)) : validateImageSize(number(`${id}-width`),number(`${id}-height`));
        canvas.width=dimensions.width;canvas.height=dimensions.height;
        const context=canvas.getContext('2d');if (!context) throw Error('Canvas unavailable');
        if (id==='crop') {
          const rect=cropRectangle(width,height,number('crop-x'),number('crop-y'),dimensions.width,dimensions.height);
          context.drawImage(original,rect.x,rect.y,rect.width,rect.height,0,0,rect.width,rect.height);
        } else if (id==='rotate') {
          context.translate(canvas.width/2,canvas.height/2);context.rotate(Number(get<HTMLSelectElement>('rotate-angle').value)*Math.PI/180);
          context.scale(get<HTMLInputElement>('rotate-horizontal').checked?-1:1,get<HTMLInputElement>('rotate-vertical').checked?-1:1);
          context.drawImage(original,-width/2,-height/2);
        } else {
          context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';context.drawImage(original,0,0,canvas.width,canvas.height);
        }
        const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/png'));
        if (ticket!==revision) return;
        if (!blob || blob.type!=='image/png') throw Error('PNG encoding unavailable');
        outputUrl=URL.createObjectURL(blob);preview.src=outputUrl;preview.hidden=false;empty.hidden=true;
        get<HTMLElement>(`${id}-size`).textContent=`${canvas.width} × ${canvas.height}`;
        feedback.textContent=t('ready');download.disabled=false;
      } catch {if(ticket===revision)error();}
    }
    get<HTMLInputElement>(`${id}-file`).addEventListener('change',async(event)=>{
      const file=(event.target as HTMLInputElement).files?.[0];
      const ticket=++revision;source=null;controls.disabled=true;clearOutput();feedback.textContent='';feedback.classList.remove('error');
      get<HTMLElement>(`${id}-selected`).textContent='';
      if(!file)return;
      if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>20*1024*1024){error();return;}
      try {
        const bytes=new Uint8Array(await file.slice(0,12).arrayBuffer());
        if(ticket!==revision)return;
        if(!validRasterHeader(bytes,file.type)){error();return;}
      }catch{if(ticket===revision)error();return;}
      const url=URL.createObjectURL(file);
      try {
        feedback.textContent=t('editorLoading');
        const image=new Image();image.src=url;await image.decode();
        validateImageSize(image.naturalWidth,image.naturalHeight);
        if(ticket!==revision)return;
        const original=document.createElement('canvas');original.width=image.naturalWidth;original.height=image.naturalHeight;
        const context=original.getContext('2d');if(!context)throw Error('Canvas unavailable');context.drawImage(image,0,0);
        source=original;filename=file.name.replace(/\.[^.]+$/,'')||'image';
        get<HTMLElement>(`${id}-selected`).textContent=`${file.name} · ${original.width} × ${original.height}`;
        resetControls();controls.disabled=false;await render();
      } catch {if(ticket===revision){source=null;controls.disabled=true;error();}}
      finally{URL.revokeObjectURL(url);}
    });
    controls.addEventListener('input',(event)=>{
      if(!source)return;
      if(id==='resize' && get<HTMLInputElement>('resize-ratio').checked) {
        const target=(event.target as HTMLElement).id;
        const axis=target==='resize-height'?'height':'width';
        try {
          const size=proportionalSize(source.width,source.height,number(`resize-${axis}`),axis);
          get<HTMLInputElement>('resize-width').value=String(size.width);get<HTMLInputElement>('resize-height').value=String(size.height);
        }catch{revision++;error();return;}
      }
      void render();
    });
    get<HTMLButtonElement>(`${id}-reset`).addEventListener('click',()=>{resetControls();void render();});
    if(id==='crop')get<HTMLButtonElement>('crop-square').addEventListener('click',()=>{
      if(!source)return;const rect=centeredSquare(source.width,source.height);
      for(const[key,value]of Object.entries(rect))get<HTMLInputElement>(`crop-${key}`).value=String(value);
      void render();
    });
    download.addEventListener('click',()=>{
      if(!outputUrl||download.disabled)return;
      const anchor=document.createElement('a');anchor.href=outputUrl;anchor.download=`${filename}-${id}.png`;anchor.click();
    });
  }
}
