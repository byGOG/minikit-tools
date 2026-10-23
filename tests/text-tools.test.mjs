import test from 'node:test';
import assert from 'node:assert/strict';
import { changeCase, removeDuplicateLines, sortLines } from '../src/scripts/text-tools.ts';

test('case conversion follows Turkish dotted/dotless I and Unicode casing', () => {
  assert.equal(changeCase('istanbul ısparta', 'upper', 'tr'), 'İSTANBUL ISPARTA');
  assert.equal(changeCase('I İ', 'lower', 'tr'), 'ı i');
  assert.equal(changeCase('istanbul', 'upper', 'en'), 'ISTANBUL');
  assert.equal(changeCase('straße 👋', 'upper', 'de'), 'STRASSE 👋');
  assert.equal(changeCase('中文', 'upper', 'zh'), '中文');
});
test('dedupe preserves original text/order, supports line endings and empty lines', () => {
  assert.deepEqual(removeDuplicateLines('a\r\nb\ra\n\n\n'), { text: 'a\nb\n', removed: 3 });
  assert.deepEqual(removeDuplicateLines(''), { text: '', removed: 0 });
  assert.deepEqual(removeDuplicateLines('A\na\n A '), { text: 'A\na\n A ', removed: 0 });
});
test('dedupe options match without rewriting the retained first line', () => {
  assert.deepEqual(removeDuplicateLines(' Apple \napple\nAPPLE\npear', {ignoreCase:true,trimSpaces:true}), {text:' Apple \npear',removed:2});
  assert.deepEqual(removeDuplicateLines('İ\ni\nI\nı', {ignoreCase:true,locale:'tr'}), {text:'İ\nI',removed:2});
  assert.deepEqual(removeDuplicateLines('café\ncafe\u0301'), {text:'café',removed:1});
});
test('sorting uses language collation and numeric order, preserves duplicates/blank lines', () => {
  assert.equal(sortLines('item10\nitem2\nitem1','en'), 'item1\nitem2\nitem10');
  assert.equal(sortLines('item10\nitem2\nitem1','en',true), 'item10\nitem2\nitem1');
  assert.equal(sortLines('z\nä','sv'), 'z\nä');
  assert.equal(sortLines('z\nä','de'), 'ä\nz');
  assert.equal(sortLines('b\r\na\r\na\r\n','en'), '\na\na\nb');
  assert.equal(sortLines('','tr'), '');
});
test('transformations keep markup as inert text and handle the full input limit', () => {
  assert.equal(removeDuplicateLines('<script>alert(1)</script>\n<script>alert(1)</script>').text, '<script>alert(1)</script>');
  const text='a'.repeat(100000);
  assert.equal(changeCase(text,'upper','tr').length,100000);
  assert.equal(removeDuplicateLines(text).text,text);
  assert.equal(sortLines(text,'en'),text);
});
