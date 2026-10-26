import {convertHtmlEntities} from '../src/scripts/html-entities.ts';
import test from'node:test';import assert from'node:assert/strict';import{inspectJwt,convertNumberBase}from'../src/scripts/encoding-tools.ts';
const b64=text=>Buffer.from(text,'utf8').toString('base64url');const token=(header,payload,signature='AA')=>b64(header)+'.'+b64(payload)+'.'+signature;
test('HTML5 entities round-trip Unicode and decode once as data',()=>{
 const value='<script>"İ 😀" & \'x\'</script>';assert.equal(convertHtmlEntities(convertHtmlEntities(value),true),value);assert.equal(convertHtmlEntities('&copy; &#x1F600; &NotEqualTilde;',true),'© 😀 ≂̸');assert.equal(convertHtmlEntities('&amp;lt;',true),'&lt;');assert.equal(convertHtmlEntities('&lt;img src=x onerror=alert(1)&gt;',true),'<img src=x onerror=alert(1)>');assert.throws(()=>convertHtmlEntities('x'.repeat(100001)));
});
test('JWT viewer handles UTF-8 without rounding large numbers or duplicate keys',()=>{
 const result=inspectJwt(token('{"alg":"HS256","typ":"JWT"}','{"sub":"İstanbul 😀","n":9007199254740993,"x":1,"x":2}'));assert.ok(result.payload.includes('9007199254740993'));assert.equal((result.payload.match(/"x"/g)??[]).length,2);assert.equal(JSON.parse(result.combined).payload.sub,'İstanbul 😀');assert.ok(inspectJwt(token('{"alg":"none"}','{}','')).header.includes('none'));
});
test('JWT structure checks reject JWE, nonobjects, malformed UTF-8 and padded/noncanonical encoding',()=>{
 for(const value of ['a.b.c.d.e',token('{"alg":"HS256"}','[]'),token('{}','{}'),token('{"alg":"HS256"}','null'),'e30=.e30.AA',b64('{"alg":"HS256"}')+'.'+Buffer.from([255]).toString('base64url')+'.AA',token('{"alg":"HS256"}','{}','!')])assert.throws(()=>inspectJwt(value));assert.throws(()=>inspectJwt('x'.repeat(100001)));
});
test('integer base conversion is exact past safe-integer range and accepts signed/case-insensitive digits',()=>{
 assert.equal(convertNumberBase('9007199254740993',10,16),'20000000000001');assert.equal(convertNumberBase('20000000000001',16,10),'9007199254740993');assert.equal(convertNumberBase('-FF',16,2),'-11111111');assert.equal(convertNumberBase('−ff',16,10),'-255');assert.equal(convertNumberBase('+000',10,36),'0');assert.equal(convertNumberBase('zz',36,10),'1295');for(const base of [2,8,10,16,36]){const value='123456789012345678901234567890';assert.equal(convertNumberBase(convertNumberBase(value,10,base),base,10),value);}
});
test('base conversion enforces digit, length and base bounds',()=>{
 for(const value of ['', '-', '0xFF','12.5','1,000','2'])assert.throws(()=>convertNumberBase(value,2,10));assert.throws(()=>convertNumberBase('1',1,10));assert.throws(()=>convertNumberBase('1',10,37));assert.throws(()=>convertNumberBase('1'.repeat(4097),2,10));assert.ok(convertNumberBase('z'.repeat(4096),36,2).length<22000);
});
