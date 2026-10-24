import test from 'node:test';import assert from 'node:assert/strict';
import {dominantPalette,watermarkPlacement,validateImageFile} from '../src/scripts/image-extras.ts';
test('dominant colors follow frequency, ignore transparency and merge quantized neighbors',()=>{
 const data=new Uint8ClampedArray([255,0,0,255,255,0,0,255,0,0,255,255,0,255,0,0]);
 assert.deepEqual(dominantPalette(data),['#FF0000','#0000FF']);
 assert.deepEqual(dominantPalette(new Uint8ClampedArray([248,0,0,255,254,0,0,255])),['#FB0000']);
 assert.deepEqual(dominantPalette(new Uint8ClampedArray([0,0,0,127])),[]);
 assert.throws(()=>dominantPalette(new Uint8ClampedArray([1])));
});
test('watermark positions align inside margins and reject invalid settings',()=>{
 assert.deepEqual(watermarkPlacement(1000,500,200,30,'br'),{x:780,y:465});
 assert.deepEqual(watermarkPlacement(1000,500,200,30,'center'),{x:400,y:250});
 assert.deepEqual(watermarkPlacement(1000,500,200,30,'tl'),{x:20,y:35});
 assert.throws(()=>watermarkPlacement(1000,500,200,NaN,'tl'));
 assert.throws(()=>watermarkPlacement(1000,500,200,30,'bad'));
});
test('image file budgets distinguish original-byte Base64 from canvas tools',()=>{
 validateImageFile('image/png',5*1024*1024,true);validateImageFile('image/jpeg',20*1024*1024);
 assert.throws(()=>validateImageFile('image/png',5*1024*1024+1,true));
 assert.throws(()=>validateImageFile('image/svg+xml',100));assert.throws(()=>validateImageFile('image/png',0));
});
