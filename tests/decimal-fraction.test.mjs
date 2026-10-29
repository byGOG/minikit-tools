import test from 'node:test';
import assert from 'node:assert/strict';
import { decimalToFraction } from '../src/scripts/decimal-fraction-core.ts';
test('finite decimal syntax gives exact reduced positive-denominator fractions',()=>{
  for(const [input,numerator,denominator,text]of [['0.125','1','8','1/8'],['-1.25','-5','4','-5/4'],[' -1,25 ','-5','4','-5/4'],['+.5','1','2','1/2'],[',5','1','2','1/2'],['00012','12','1','12'],['-0.000','0','1','0']])assert.deepEqual(decimalToFraction(input),{numerator,denominator,text});
});
test('12 digit precision stays exact beyond floating point safety',()=>{
  assert.deepEqual(decimalToFraction('999999999999.999999999999'),{numerator:'999999999999999999999999',denominator:'1000000000000',text:'999999999999999999999999/1000000000000'});
  assert.equal(decimalToFraction('0.000000000001').text,'1/1000000000000');
});
test('invalid syntax, digit counts and types reject instead of approximating',()=>{
  for(const value of ['', ' ', '1.', '1,', '.', '+', '1e-3','1/2','0.(3)','1,000.5','1.2.3','1 000','１２','١','1000000000000','.1234567890123',null,undefined,1,{}])assert.throws(()=>decimalToFraction(value),String(value));
});
test('raw 64 character limit applies before whitespace trimming',()=>{
  assert.equal(decimalToFraction(' '.repeat(59)+'0.125').text,'1/8');
  assert.throws(()=>decimalToFraction(' '.repeat(60)+'0.125'));
});
