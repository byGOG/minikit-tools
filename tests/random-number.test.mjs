import test from 'node:test';
import assert from 'node:assert/strict';
import { generateRandomNumbers } from '../src/scripts/random-number-core.ts';
test('inclusive endpoints and extreme range are passed to the random source exactly',()=>{
  const sizes=[];let call=0;
  assert.deepEqual(generateRandomNumbers(-1e9,1e9,2,size=>{sizes.push(size);return call++===0?0:size-1;}),[-1e9,1e9]);
  assert.deepEqual(sizes,[2000000001,2000000001]);
});
test('duplicates are allowed and equal endpoints bypass random source',()=>{
  assert.deepEqual(generateRandomNumbers(1,100,3,()=>0),[1,1,1]);
  assert.deepEqual(generateRandomNumbers(-7,-7,100,()=>{throw new Error('must not call');}),Array(100).fill(-7));
});
test('invalid options reject before calling the random source',()=>{
  const pick=()=>{assert.fail('invalid options must not sample');};
  for(const args of [[2,1,1],[0,1,0],[0,1,101],[-1000000001,1,1],[0,1000000001,1],[0.5,1,1],[0,1,1.5],[NaN,1,1],[0,Infinity,1],['1',2,1],[0,1,null]])assert.throws(()=>generateRandomNumbers(...args,pick),RangeError);
});
test('invalid random source samples reject and source errors propagate',()=>{
  for(const value of [-1,10,0.5,NaN,Infinity,'0',undefined])assert.throws(()=>generateRandomNumbers(1,10,1,()=>value));
  const failure=new Error('synthetic random failure');assert.throws(()=>generateRandomNumbers(1,10,1,()=>{throw failure;}),error=>error===failure);
});
