import test from 'node:test';
import assert from 'node:assert/strict';
import { toRoman, fromRoman, convertRoman } from '../src/scripts/roman-numerals-core.ts';

const vectors = [[1,'I'],[4,'IV'],[9,'IX'],[40,'XL'],[90,'XC'],[400,'CD'],[900,'CM'],[1944,'MCMXLIV'],[2026,'MMXXVI'],[3999,'MMMCMXCIX']];
test('known canonical vectors work in both directions', () => {
  for (const [decimal, roman] of vectors) {
    assert.equal(toRoman(decimal), roman);
    assert.equal(fromRoman(roman), decimal);
  }
  assert.equal(convertRoman(' 002026 ', 'to-roman'), 'MMXXVI');
  assert.equal(convertRoman(' mMxXvI ', 'to-decimal'), '2026');
});
test('all supported integers roundtrip to distinct canonical Roman spellings', () => {
  const seen = new Set();
  const canonical = /^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;
  for (let n = 1; n <= 3999; n++) {
    const roman = toRoman(n);
    assert.ok(roman.length > 0 && canonical.test(roman));
    assert.equal(fromRoman(roman), n);
    seen.add(roman);
  }
  assert.equal(seen.size, 3999);
});
test('rejects invalid decimal numbers and alternate numeric syntaxes', () => {
  for (const n of [0,-1,4000,1.5,NaN,Infinity,-Infinity]) assert.throws(() => toRoman(n));
  for (const input of ['', ' ', '0', '4000', '-1', '+1', '1.0', '1e3', '1,000', '1_000', '١', '１', '0x10']) {
    assert.throws(() => convertRoman(input, 'to-roman'), input);
  }
});
test('rejects noncanonical, Unicode and decorated Roman input', () => {
  for (const input of ['', ' ', 'IIII', 'IL', 'IC', 'IIV', 'VV', 'MMMM', 'VX', 'MCMC', '0', 'Ⅳ', 'I\u0305V\u0305', 'X V', '<b>IV</b>']) {
    assert.throws(() => fromRoman(input), input);
    assert.throws(() => convertRoman(input, 'to-decimal'), input);
  }
});
test('raw 100 character limit is enforced before trim and unknown modes reject', () => {
  const decimal = ' '.repeat(99) + '1', roman = ' '.repeat(99) + 'I';
  assert.equal(convertRoman(decimal, 'to-roman'), 'I');
  assert.equal(fromRoman(roman), 1);
  assert.throws(() => convertRoman(' ' + decimal, 'to-roman'));
  assert.throws(() => fromRoman(' ' + roman));
  assert.throws(() => convertRoman(' ' + roman, 'to-decimal'));
  assert.throws(() => convertRoman('1', 'unknown'));
});
