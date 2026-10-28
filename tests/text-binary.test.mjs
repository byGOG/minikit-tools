import test from 'node:test';
import assert from 'node:assert/strict';
import { convertBinary } from '../src/scripts/text-binary-core.ts';
test('known UTF-8 bytes and Unicode text roundtrip without dropping whitespace or BOM',()=>{
  assert.equal(convertBinary('A','encode'),'01000001');
  assert.equal(convertBinary('é','encode'),'11000011 10101001');
  for(const text of ['Türkçe 🙂',' \t\n','\uFEFFhello','😀','A\r\nB'])assert.equal(convertBinary(convertBinary(text,'encode'),'decode'),text);
  assert.equal(convertBinary(' 01000001\n01000010\t','decode'),'AB');
});
test('rejects malformed UTF-8 and non-eight-bit tokens',()=>{
  for(const code of ['', '  ', '1', '010000010', '0100000x','11000000 10101111','11101101 10100000 10000000','11110100 10010000 10000000 10000000','11000011','10000000'])assert.throws(()=>convertBinary(code,'decode'),code);
});
test('rejects lone surrogates, unknown modes and invalid types',()=>{
  for(const text of ['', '\uD800','\uDC00','A\uD800B'])assert.throws(()=>convertBinary(text,'encode'));
  for(const value of [null,undefined,42,{}])for(const mode of ['encode','decode'])assert.throws(()=>convertBinary(value,mode));
  assert.throws(()=>convertBinary('A','unknown'));
});
test('raw input, byte count and decoded UTF-16 limits are independently enforced',()=>{
  assert.equal(convertBinary('a'.repeat(5000),'encode').split(' ').length,5000);
  assert.throws(()=>convertBinary('a'.repeat(5001),'encode'));
  const full=convertBinary('漢'.repeat(5000),'encode');assert.equal(full.split(' ').length,15000);assert.equal(convertBinary(full,'decode'),'漢'.repeat(5000));
  assert.throws(()=>convertBinary(Array(15001).fill('01000001').join(' '),'decode'));
  assert.throws(()=>convertBinary(Array(5001).fill('01000001').join(' '),'decode'));
  assert.equal(convertBinary(' '.repeat(135000-8)+'01000001','decode'),'A');
  assert.throws(()=>convertBinary(' '.repeat(135000-7)+'01000001','decode'));
});
