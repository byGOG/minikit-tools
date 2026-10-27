import test from 'node:test';
import assert from 'node:assert/strict';
import { createBoxShadow } from '../src/scripts/box-shadow-core.ts';
const defaults = { x:0, y:8, blur:24, spread:0, color:'#000000', opacity:20, inset:false };
test('default shadow and declaration are exact', () => {
  assert.deepEqual(createBoxShadow(defaults), { boxShadow:'0px 8px 24px 0px rgba(0, 0, 0, 0.2)', css:'box-shadow: 0px 8px 24px 0px rgba(0, 0, 0, 0.2);' });
});
test('inset, signed boundaries, normalized RGB and opacity endpoints stay exact', () => {
  assert.equal(createBoxShadow({...defaults,x:-100,y:100,blur:200,spread:-100,color:' #AbC ',opacity:100,inset:true}).css,
    'box-shadow: inset -100px 100px 200px -100px rgba(170, 187, 204, 1);');
  assert.equal(createBoxShadow({...defaults,x:100,y:-100,blur:0,spread:100,color:'#123456',opacity:0}).boxShadow,
    '100px -100px 0px 100px rgba(18, 52, 86, 0)');
  assert.equal(createBoxShadow({...defaults,opacity:1}).boxShadow,'0px 8px 24px 0px rgba(0, 0, 0, 0.01)');
});
test('rejects invalid numeric fields and nonboolean inset instead of coercing or clamping', () => {
  for (const [key, min, max] of [['x',-100,100],['y',-100,100],['spread',-100,100],['blur',0,200],['opacity',0,100]]) {
    for (const value of [min-1,max+1,0.5,NaN,Infinity,-Infinity,'20',null]) assert.throws(()=>createBoxShadow({...defaults,[key]:value}),`${key}: ${value}`);
  }
  for (const value of [undefined,null,0,1,'false']) assert.throws(()=>createBoxShadow({...defaults,inset:value}));
});
test('strict color syntax and raw length reject CSS injection', () => {
  assert.equal(createBoxShadow({...defaults,color:' '.repeat(28)+'#abc'}).boxShadow,'0px 8px 24px 0px rgba(170, 187, 204, 0.2)');
  for (const color of [' '.repeat(29)+'#abc','#abcd','#12345678','red','rgb(0,0,0)','#fff; color:red','url(https://privacy-sentinel.invalid/pixel)']) assert.throws(()=>createBoxShadow({...defaults,color}),color);
});
