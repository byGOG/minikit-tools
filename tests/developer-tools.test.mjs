import test from 'node:test';
import assert from 'node:assert/strict';
import {formatJson,encodeBase64,decodeBase64,convertUrlComponent} from '../src/scripts/developer-tools.ts';

test('JSON formatting preserves number lexemes, duplicate keys and string escapes',()=>{
 const json=' {"n":9007199254740993,"n":1e400,"s":"hello\\nworld","empty":[]} ';
 const compact='{"n":9007199254740993,"n":1e400,"s":"hello\\nworld","empty":[]}';
 assert.equal(formatJson(json,true),compact);
 const pretty=formatJson(json);
 assert.ok(pretty.includes('"n": 9007199254740993'));
 assert.ok(pretty.includes('"n": 1e400'));
 assert.equal(formatJson(pretty,true),compact);
 assert.equal(formatJson('{"a":"quote: \\"; comma, : brackets[]{}"}',true),'{"a":"quote: \\"; comma, : brackets[]{}"}');
 for(const literal of ['null','true','false','0','-0','"text"','[]','{}'])assert.equal(formatJson(literal),literal);
});
test('JSON rejects invalid syntax and bounded resources',()=>{
 for(const value of ['', '{a:1}','[1,]','{"x":NaN}','"broken'])assert.throws(()=>formatJson(value));
 assert.throws(()=>formatJson('['.repeat(101)+'0'+']'.repeat(101)),RangeError);
 assert.throws(()=>formatJson(' '.repeat(100001)),RangeError);
 const wide='['.repeat(99)+Array(10000).fill('0').join(',')+']'.repeat(99);
 assert.throws(()=>formatJson(wide),RangeError);
});
test('Base64 round-trips Unicode, emoji, BOM and long input',()=>{
 for(const text of ['', 'İstanbul ı ş ğ 👋 中文 العربية', '\uFEFFtext', 'a'.repeat(70000)]) assert.equal(decodeBase64(encodeBase64(text)),text);
 assert.equal(encodeBase64('a'.repeat(100000)).length,133336);
 assert.equal(encodeBase64('Hello'),'SGVsbG8=');
 assert.equal(decodeBase64(' SGVs\nbG8= '),'Hello');
 assert.equal(decodeBase64('SGVsbG8'),'Hello');
});
test('Base64 rejects broken padding/alphabet/pad bits, binary UTF-8 and malformed Unicode',()=>{
 for(const text of ['A','AA=','A===','AA=A','AB==','====','__8=','/w==','wK8='])assert.throws(()=>decodeBase64(text),text);
 assert.throws(()=>encodeBase64('\ud800'),URIError);
 assert.throws(()=>encodeBase64('a'.repeat(100001)),RangeError);
});
test('URL values round-trip Unicode and reserved characters without interpreting plus as space',()=>{
 const text='İstanbul & a+b=👋/%?#';
 assert.equal(convertUrlComponent(convertUrlComponent(text),true),text);
 assert.equal(convertUrlComponent('a+b'), 'a%2Bb');
 assert.equal(convertUrlComponent('a+b',true),'a+b');
 assert.equal(convertUrlComponent('%20',true),' ');
 assert.equal(convertUrlComponent('%252F',true),'%2F');
 for(const text of ['%','%GG','%FF','%E0%A4'])assert.throws(()=>convertUrlComponent(text,true),URIError);
 assert.throws(()=>convertUrlComponent('\ud800'),URIError);
});
