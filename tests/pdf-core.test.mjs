import {readFile} from 'node:fs/promises';
import test from 'node:test';import assert from 'node:assert/strict';
import {PDFDocument,PDFName} from 'pdf-lib';
import {parsePageSelection,fitPdfImage,validatePdfBatch,combinePdfs,loadPlainPdf} from '../src/scripts/pdf-core.ts';
async function source(widths){const doc=await PDFDocument.create();for(const w of widths)doc.addPage([w,400]);return doc.save();}
test('page selections preserve requested order and reject invalid or out-of-bounds ranges',()=>{
 assert.deepEqual(parsePageSelection('3,1-2,3',5),[2,0,1]);assert.deepEqual(parsePageSelection(' 1 - 3 , 5 ',5),[0,1,2,4]);
 for(const value of ['', '0','2-1','1,,2','-1','1.5','6','1-999999999'])assert.throws(()=>parsePageSelection(value,5));
});
test('A4 fitting centers landscape images and original dimensions use PDF points',()=>{
 const fit=fitPdfImage(800,400);assert.equal(fit.pageWidth,841.89);assert.equal(fit.x,24);assert.ok(fit.height<fit.pageHeight-48);
 assert.deepEqual(fitPdfImage(800,400,true),{pageWidth:800,pageHeight:400,width:800,height:400,x:0,y:0});assert.throws(()=>fitPdfImage(8193,1));
});
test('PDF merges and extracts preserve page order and geometry',async()=>{
 const one=await source([200,300]),two=await source([500]);
 const merged=await combinePdfs([two,one]);const doc=await PDFDocument.load(merged.bytes);assert.equal(merged.pages,3);assert.deepEqual(doc.getPages().map(p=>p.getWidth()),[500,200,300]);
 const extracted=await combinePdfs([merged.bytes],'3,1-2,3');assert.deepEqual((await PDFDocument.load(extracted.bytes)).getPages().map(p=>p.getWidth()),[300,500,200]);
 await assert.rejects(()=>combinePdfs([one],'3'));await assert.rejects(()=>combinePdfs([one,two],'1'));
});
test('plain PDF checks reject malformed, form, signed and oversized-page inputs',async()=>{
 await assert.rejects(()=>loadPlainPdf(new TextEncoder().encode('%PDF-broken')));
 const form=await PDFDocument.create();form.addPage();form.getForm().createTextField('name');const formBytes=await form.save();await assert.rejects(()=>loadPlainPdf(formBytes));
 const signed=await PDFDocument.create();signed.addPage();signed.catalog.set(PDFName.of('Perms'),signed.context.obj({}));const signedBytes=await signed.save();await assert.rejects(()=>loadPlainPdf(signedBytes));
 const many=await source(Array(201).fill(200));await assert.rejects(()=>loadPlainPdf(many));
});
test('input budgets are enforced before processing',()=>{
 validatePdfBatch([25*1024*1024,25*1024*1024]);assert.throws(()=>validatePdfBatch([50*1024*1024+1]));assert.throws(()=>validatePdfBatch(Array(11).fill(10)));assert.throws(()=>validatePdfBatch([20*1024*1024+1],true));
});

test('encrypted PDFs are rejected rather than silently copied',async()=>{const encoded=await readFile(new URL('./fixtures/encrypted-pdf.txt',import.meta.url),'utf8');await assert.rejects(()=>loadPlainPdf(new Uint8Array(Buffer.from(encoded,'base64'))));});
