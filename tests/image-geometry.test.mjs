import test from 'node:test';import assert from 'node:assert/strict';
import {validRasterHeader,validateImageSize,proportionalSize,cropRectangle,centeredSquare,rotatedSize} from '../src/scripts/image-geometry.ts';
test('aspect-ratio sizing rounds to whole positive pixels',()=>{
 assert.deepEqual(proportionalSize(800,600,400,'width'),{width:400,height:300});
 assert.deepEqual(proportionalSize(800,600,150,'height'),{width:200,height:150});
 assert.deepEqual(proportionalSize(800,600,1,'width'),{width:1,height:1});
});
test('image bounds reject empty/fractional/oversized dimensions',()=>{
 assert.deepEqual(validateImageSize(4000,4000),{width:4000,height:4000});
 for(const [w,h]of [[0,1],[1,0],[2.5,3],[8193,1],[4001,4000],[Infinity,1],[NaN,1]])assert.throws(()=>validateImageSize(w,h));
});
test('crop bounds stay inside original and centered squares use top-left coordinates',()=>{
 assert.deepEqual(centeredSquare(800,600),{x:100,y:0,width:600,height:600});
 assert.deepEqual(centeredSquare(600,801),{x:0,y:100,width:600,height:600});
 assert.deepEqual(cropRectangle(800,600,799,599,1,1),{x:799,y:599,width:1,height:1});
 for(const rect of [[-1,0,1,1],[0,0,801,600],[800,0,1,1],[0,600,1,1],[.5,0,1,1]])assert.throws(()=>cropRectangle(800,600,...rect));
});
test('quarter turns swap dimensions without allowing unsupported angles',()=>{
 for(const angle of [90,270])assert.deepEqual(rotatedSize(800,600,angle),{width:600,height:800});
 for(const angle of [0,180])assert.deepEqual(rotatedSize(800,600,angle),{width:800,height:600});
 for(const angle of [45,-90,360,NaN])assert.throws(()=>rotatedSize(800,600,angle));
});
test('file signatures reject SVG/text spoofing and validate supported raster headers',()=>{
 assert.equal(validRasterHeader(new Uint8Array([137,80,78,71,13,10,26,10]),'image/png'),true);
 assert.equal(validRasterHeader(new Uint8Array([255,216,255]),'image/jpeg'),true);
 assert.equal(validRasterHeader(new TextEncoder().encode('RIFF0000WEBP'),'image/webp'),true);
 assert.equal(validRasterHeader(new TextEncoder().encode('<svg onload='),'image/png'),false);
 assert.equal(validRasterHeader(new Uint8Array([255,216,255]),'image/png'),false);
});
