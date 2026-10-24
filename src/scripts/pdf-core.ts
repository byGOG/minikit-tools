import {PDFDocument,PDFName} from 'pdf-lib';
export const PDF_MAX_BYTES=50*1024*1024;
export function validatePdfBatch(sizes:number[],images=false){
 if(!sizes.length||sizes.length>(images?20:10)||sizes.some(n=>!Number.isInteger(n)||n<=0||n>(images?20*1024*1024:PDF_MAX_BYTES))||sizes.reduce((a,b)=>a+b,0)>PDF_MAX_BYTES)throw Error('File limits');
}
export function parsePageSelection(value:string,pageCount:number){
 if(!Number.isInteger(pageCount)||pageCount<1||pageCount>200||!value.trim()||value.length>2000)throw Error('Page selection');
 const selected=new Set<number>();
 for(const part of value.split(',')){const match=part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);if(!match)throw Error('Page selection');const first=Number(match[1]),last=Number(match[2]??match[1]);if(first<1||last<first||last>pageCount)throw Error('Page selection');for(let page=first;page<=last;page++)selected.add(page-1);}
 return [...selected];
}
export function fitPdfImage(width:number,height:number,original=false){
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0||width>8192||height>8192||width*height>16000000)throw Error('Image bounds');
 const pageWidth=original?width:width>height?841.89:595.28,pageHeight=original?height:width>height?595.28:841.89;
 const margin=original?0:24,scale=Math.min((pageWidth-2*margin)/width,(pageHeight-2*margin)/height);
 return{pageWidth,pageHeight,width:width*scale,height:height*scale,x:(pageWidth-width*scale)/2,y:(pageHeight-height*scale)/2};
}
export async function loadPlainPdf(bytes:Uint8Array){
 if(bytes.length>PDF_MAX_BYTES||String.fromCharCode(...bytes.subarray(0,5))!=='%PDF-')throw Error('PDF header');
 const doc=await PDFDocument.load(bytes,{throwOnInvalidObject:true,updateMetadata:false});
 if(doc.isEncrypted||doc.catalog.has(PDFName.of('AcroForm'))||doc.catalog.has(PDFName.of('Perms'))||doc.catalog.has(PDFName.of('Collection'))||doc.getPageCount()<1||doc.getPageCount()>200)throw Error('Unsupported PDF');
 return doc;
}
export async function combinePdfs(inputs:Uint8Array[],selection?:string){
 validatePdfBatch(inputs.map(b=>b.length));if(selection!==undefined&&inputs.length!==1)throw Error('Single source required');
 const output=await PDFDocument.create();let total=0;
 for(const bytes of inputs){const source=await loadPlainPdf(bytes);total+=source.getPageCount();if(total>200)throw Error('Page budget');const indices=selection===undefined?source.getPageIndices():parsePageSelection(selection,source.getPageCount());for(const page of await output.copyPages(source,indices))output.addPage(page);}
 return{bytes:await output.save(),pages:output.getPageCount()};
}
export async function imagesToPdf(pngs:Uint8Array[],original=false){
 if(!pngs.length||pngs.length>20)throw Error('Image count');const output=await PDFDocument.create();
 for(const bytes of pngs){const image=await output.embedPng(bytes),fit=fitPdfImage(image.width,image.height,original);const page=output.addPage([fit.pageWidth,fit.pageHeight]);page.drawImage(image,{x:fit.x,y:fit.y,width:fit.width,height:fit.height});}
 return{bytes:await output.save(),pages:output.getPageCount()};
}
