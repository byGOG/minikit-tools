import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { MAX_FILE_BYTES, normalizeExpectedHash, sha256File } from '../src/scripts/file-checksum-core.ts';

const oracle = bytes => createHash('sha256').update(bytes).digest('hex');
for (const [name, bytes] of [
  ['empty file', Buffer.alloc(0)],
  ['ASCII abc', Buffer.from('abc')],
  ['binary with zero and invalid UTF-8', Buffer.from([0, 255, 192, 128, 0, 254, 65])],
]) {
  test(`file SHA-256 hashes raw bytes: ${name}`, async () => {
    assert.equal(await sha256File(new Blob([bytes])), oracle(bytes));
  });
}
test('expected digest accepts optional whitespace and case, rejects malformed values', () => {
  assert.equal(normalizeExpectedHash(' \t\n'), null);
  const hash = oracle(Buffer.from('abc'));
  assert.equal(normalizeExpectedHash(` \n${hash.toUpperCase()}\t`), hash);
  for (const invalid of ['a'.repeat(63), 'a'.repeat(65), 'g'.repeat(64), '0x' + 'a'.repeat(64), 'a'.repeat(32) + ' ' + 'a'.repeat(32)]) {
    assert.throws(() => normalizeExpectedHash(invalid));
  }
});
test('50 MiB limit rejects before reading any bytes', async () => {
  assert.equal(MAX_FILE_BYTES, 50 * 1024 * 1024);
  let read = false;
  const oversized = { size: MAX_FILE_BYTES + 1, arrayBuffer() { read = true; throw new Error('must not read'); } };
  await assert.rejects(() => sha256File(oversized));
  assert.equal(read, false);
});
