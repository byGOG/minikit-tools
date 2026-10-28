import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateFraction } from '../src/scripts/fraction-core.ts';
test('all operations return reduced exact fractions',()=>{
  for(const [op,n,d,text]of [['add','5','6','5/6'],['subtract','1','6','1/6'],['multiply','1','6','1/6'],['divide','3','2','3/2']])assert.deepEqual(calculateFraction(1,2,1,3,op),{numerator:n,denominator:d,text});
});
test('signs, whole numbers and zero have canonical denominators',()=>{
  assert.deepEqual(calculateFraction(1,-2,1,3,'add'),{numerator:'-1',denominator:'6',text:'-1/6'});
  assert.deepEqual(calculateFraction(-1,-2,1,-2,'add'),{numerator:'0',denominator:'1',text:'0'});
  assert.deepEqual(calculateFraction(1,2,-1,4,'divide'),{numerator:'-2',denominator:'1',text:'-2'});
});
test('large coprime results exceed safe integer precision without rounding',()=>{
  assert.deepEqual(calculateFraction(1000000000,999999999,999999998,1000000000,'add'),{numerator:'999999998500000001',denominator:'499999999500000000',text:'999999998500000001/499999999500000000'});
  assert.equal(calculateFraction(-1000000000,1,1000000000,1,'subtract').text,'-2000000000');
});
test('rejects zero denominators, zero divisor, unknown operation and invalid arguments',()=>{
  assert.throws(()=>calculateFraction(1,0,1,3,'add'));assert.throws(()=>calculateFraction(1,2,1,0,'add'));assert.throws(()=>calculateFraction(1,2,0,3,'divide'));assert.throws(()=>calculateFraction(1,2,1,3,'unknown'));
  for(let index=0;index<4;index++)for(const value of [-1000000001,1000000001,0.5,NaN,Infinity,-Infinity,'1',null,undefined]){
    const args=[1,2,1,3];args[index]=value;assert.throws(()=>calculateFraction(...args,'add'));
  }
});
