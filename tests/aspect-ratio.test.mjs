import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateAspectRatio } from '../src/scripts/aspect-ratio-core.ts';
test('known landscape, portrait and square ratios reduce exactly',()=>{
  for(const [w,h,ratio,width,height]of [[1920,1080,'16:9',16,9],[1080,1920,'9:16',9,16],[640,480,'4:3',4,3],[100000,100000,'1:1',1,1]])
    assert.deepEqual(calculateAspectRatio(w,h),{ratio,width,height});
});
test('inclusive dimension boundaries and coprime dimensions preserve proportions',()=>{
  assert.deepEqual(calculateAspectRatio(1,100000),{ratio:'1:100000',width:1,height:100000});
  assert.deepEqual(calculateAspectRatio(100000,1),{ratio:'100000:1',width:100000,height:1});
  assert.deepEqual(calculateAspectRatio(997,991),{ratio:'997:991',width:997,height:991});
});
test('invalid dimensions reject on either axis without coercion or clamping',()=>{
  for(const value of [0,-1,100001,1.5,NaN,Infinity,-Infinity,'1920',null,undefined]){
    assert.throws(()=>calculateAspectRatio(value,1080));assert.throws(()=>calculateAspectRatio(1920,value));
  }
});
