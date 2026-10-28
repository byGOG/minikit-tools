import test from 'node:test';
import assert from 'node:assert/strict';
import { createBorderRadius } from '../src/scripts/border-radius-core.ts';
test('physical corner order produces exact CSS',()=>{
  assert.deepEqual(createBorderRadius(16,32,48,0),{borderRadius:'16px 32px 48px 0px',css:'border-radius: 16px 32px 48px 0px;'});
  assert.equal(createBorderRadius(1,2,3,4).borderRadius,'1px 2px 3px 4px');
});
test('both inclusive bounds remain valid on every corner',()=>{
  assert.equal(createBorderRadius(0,0,0,0).css,'border-radius: 0px 0px 0px 0px;');
  assert.equal(createBorderRadius(200,200,200,200).css,'border-radius: 200px 200px 200px 200px;');
});
test('every invalid corner rejects instead of clamping or coercing',()=>{
  for(let corner=0;corner<4;corner++)for(const value of [-1,201,0.5,NaN,Infinity,-Infinity,'16',null,undefined]){
    const args=[16,32,48,0];args[corner]=value;assert.throws(()=>createBorderRadius(...args));
  }
});
