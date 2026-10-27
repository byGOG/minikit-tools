import test from 'node:test';
import assert from 'node:assert/strict';
import { generateLoremIpsum } from '../src/scripts/lorem-ipsum-core.ts';

function assertShape(text, paragraphs, words) {
  const blocks = text.split('\n\n');
  assert.equal(blocks.length, paragraphs);
  for (const block of blocks) assert.equal(block.split(/\s+/).length, words);
  assert.equal(text.trim(), text);
}
test('minimum example is readable and exact', () => {
  assert.equal(generateLoremIpsum(1, 5), 'Lorem ipsum dolor sit amet.');
});
test('default-size output has exact paragraph/word counts and is deterministic', () => {
  const text = generateLoremIpsum(3, 50);
  assertShape(text, 3, 50);
  assert.match(text, /^Lorem ipsum dolor sit amet\b/);
  assert.equal(generateLoremIpsum(3, 50), text);
});
test('maximum output stays bounded at 10,000 words', () => {
  const text = generateLoremIpsum(50, 200);
  assertShape(text, 50, 200);
  assert.equal(text.split(/\s+/).length, 10_000);
  assert.ok(text.length <= 100_000);
});
test('counts reject nonintegers and out-of-range values without clamping', () => {
  for (const value of [NaN, Infinity, -Infinity, 0, -1, 1.5, 51]) {
    assert.throws(() => generateLoremIpsum(value, 50), RangeError);
  }
  for (const value of [NaN, Infinity, -Infinity, 0, 4, -1, 5.5, 201]) {
    assert.throws(() => generateLoremIpsum(3, value), RangeError);
  }
});
