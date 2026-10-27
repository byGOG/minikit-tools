import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeMorse, decodeMorse, convertMorse } from '../src/scripts/morse-code-core.ts';
// Independent acceptance fixtures: International Morse A–Z and 0–9.
const fixtures = {
  A:'.-', B:'-...', C:'-.-.', D:'-..', E:'.', F:'..-.', G:'--.', H:'....', I:'..', J:'.---', K:'-.-', L:'.-..', M:'--',
  N:'-.', O:'---', P:'.--.', Q:'--.-', R:'.-.', S:'...', T:'-', U:'..-', V:'...-', W:'.--', X:'-..-', Y:'-.--', Z:'--..',
  0:'-----', 1:'.----', 2:'..---', 3:'...--', 4:'....-', 5:'.....', 6:'-....', 7:'--...', 8:'---..', 9:'----.',
};
test('all 36 International Morse symbols match independent fixtures both ways', () => {
  for (const [symbol, code] of Object.entries(fixtures)) {
    assert.equal(encodeMorse(symbol), code, symbol);
    assert.equal(decodeMorse(code), symbol, code);
  }
});
test('normalizes case and whitespace while preserving words and digits', () => {
  assert.equal(convertMorse(' \tSoS\n 123 ', 'encode'), '... --- ... / .---- ..--- ...--');
  assert.equal(convertMorse(' ...\t--- .../.---- ..--- ...-- ', 'decode'), 'SOS 123');
  assert.equal(decodeMorse(encodeMorse('hello\n\tWORLD 09')), 'HELLO WORLD 09');
});
test('limits count raw input before trim and bound decoded output', () => {
  const code = encodeMorse('1'.repeat(1000));
  assert.equal(code.length, 5999);
  assert.equal(decodeMorse(code), '1'.repeat(1000));
  assert.equal(decodeMorse(' ' + code), '1'.repeat(1000));
  assert.equal(encodeMorse(' '.repeat(999) + 'E'), '.');
  assert.throws(() => encodeMorse(' '.repeat(1000) + 'E'));
  assert.throws(() => decodeMorse('  ' + code));
  assert.throws(() => decodeMorse(Array(1001).fill('.').join(' ')));
});
test('unsupported text is rejected before uppercasing or stripping characters', () => {
  for (const input of ['', ' \n', 'ß', 'ı', 'é', 'SOS!', '<script>', 'A/B', '🙂', 'Ａ']) assert.throws(() => encodeMorse(input), input);
});
test('nonstandard tokens, empty words and unknown modes reject', () => {
  for (const input of ['', ' ', '/', '/ ...', '... /', '... // ---', '......', '...---...', '−', '–', '.-.-.-', 'SOS']) {
    assert.throws(() => decodeMorse(input), input);
  }
  assert.throws(() => convertMorse('SOS', 'unknown'));
});
