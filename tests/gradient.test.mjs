import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeHexColor, createGradient } from '../src/scripts/gradient-core.ts';
test('strict hex colors normalize to lowercase six digits', () => {
  for (const [input, expected] of [['#ABC','#aabbcc'],[' #155C42 ','#155c42'],['#000','#000000'],['#fff','#ffffff']]) assert.equal(normalizeHexColor(input), expected);
  assert.equal(normalizeHexColor(' '.repeat(28) + '#abc'), '#aabbcc');
  assert.throws(() => normalizeHexColor(' '.repeat(29) + '#abc'));
});
test('rejects unsupported color syntax and CSS injection', () => {
  for (const color of ['', '#abcd', '#12345678', 'red', 'rgb(0,0,0)', '#12', '#ggg', '#fff; color:red', 'url(https://privacy-sentinel.invalid/pixel)', '#fff\n!important']) {
    assert.throws(() => normalizeHexColor(color), color);
    assert.throws(() => createGradient(color, '#fff', 90), color);
    assert.throws(() => createGradient('#fff', color, 90), color);
  }
});
test('default declaration is exact and angles retain both boundaries', () => {
  assert.deepEqual(createGradient('#155c42', '#c7f36b', 90), {
    backgroundImage:'linear-gradient(90deg, #155c42 0%, #c7f36b 100%)',
    css:'background: linear-gradient(90deg, #155c42 0%, #c7f36b 100%);',
  });
  for (const angle of [0,360]) assert.equal(createGradient('#000', '#FFF', angle).css, `background: linear-gradient(${angle}deg, #000000 0%, #ffffff 100%);`);
  for (const angle of [-1,361,0.5,NaN,Infinity,-Infinity]) assert.throws(() => createGradient('#000','#fff',angle));
});
