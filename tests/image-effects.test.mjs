import test from'node:test';import assert from'node:assert/strict';import{adjustImagePixels,grayscalePixels,avatarGeometry}from'../src/scripts/image-effects.ts';
test('brightness and contrast follow defined RGB transform without mutating alpha or source',()=>{
 const pixels=new Uint8ClampedArray([40,80,160,128,0,128,255,0]);assert.deepEqual([...adjustImagePixels(pixels,0,0)],[...pixels]);assert.deepEqual([...adjustImagePixels(pixels,20,0)],[91,131,211,128,51,179,255,0]);assert.deepEqual([...adjustImagePixels(pixels,0,-100)],[128,128,128,128,128,128,128,0]);assert.deepEqual([...pixels],[40,80,160,128,0,128,255,0]);assert.deepEqual([...adjustImagePixels(new Uint8ClampedArray([64,128,192,255]),0,100)],[0,128,255,255]);
 assert.throws(()=>adjustImagePixels(pixels,101,0));assert.throws(()=>adjustImagePixels(pixels,0,NaN));assert.throws(()=>adjustImagePixels(new Uint8ClampedArray(3),0,0));
});
test('grayscale uses weighted luminance and preserves transparency',()=>{
 const input=new Uint8ClampedArray([255,0,0,255,0,255,0,128,0,0,255,0]);assert.deepEqual([...grayscalePixels(input)],[54,54,54,255,182,182,182,128,18,18,18,0]);assert.equal(input[0],255);
});
test('round avatar geometry uses the centered maximal square and bounded output sizes',()=>{
 assert.deepEqual(avatarGeometry(400,200,512),{x:100,y:0,width:200,height:200,size:512});assert.deepEqual(avatarGeometry(80,201,128),{x:0,y:60,width:80,height:80,size:128});for(const size of [0,64,2048,NaN])assert.throws(()=>avatarGeometry(200,200,size));assert.throws(()=>avatarGeometry(8193,10,128));
});
