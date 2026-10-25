import test from'node:test';import assert from'node:assert/strict';import{minifyCss}from'../src/scripts/css-minifier.ts';import{jsonToCsv,parseCsv,csvToJson}from'../src/scripts/data-converters.ts';
test('CSS parser minifies conservatively, preserving important comments, strings and calc spacing',()=>{
 const source='/*! license */ .a { color: rgb(255, 0, 0); margin: 0px 0px; width: calc(100% - 2px); content: "a  b"; --message: "x  y"; }';const result=minifyCss(source);assert.ok(result.length<source.length);assert.ok(result.includes('license'));assert.ok(result.includes('a  b'));assert.ok(result.includes('x  y'));assert.ok(result.includes('100% - 2px'));assert.throws(()=>minifyCss('.a { color: red; ??? }'));assert.throws(()=>minifyCss('x'.repeat(100001)));
});
test('JSON to CSV preserves scalar spelling, quoting and first-seen columns',()=>{
 const csv=jsonToCsv('[{"id":9007199254740993,"name":"A, B","yes":true},{"name":"say \\"hi\\"","other":null}]',',',false);const rows=parseCsv(csv);assert.deepEqual(rows[0],['id','name','yes','other']);assert.equal(rows[1][0],'9007199254740993');assert.equal(rows[1][1],'A, B');assert.equal(rows[1][2],'true');assert.equal(rows[2][1],'say "hi"');assert.equal(rows[2][0],'');
});
test('CSV quoted delimiters, double quotes, multiline cells, BOM and string values round-trip',()=>{
 const source='\uFEFFid;note\r\n001;"a;b\r\n""quote"""\r\n';assert.deepEqual(JSON.parse(csvToJson(source,';')),[{id:'001',note:'a;b\r\n"quote"'}]);assert.deepEqual(parseCsv('h\n\n'),[['h'],['']]);assert.deepEqual(parseCsv('h\n'),[['h']]);assert.deepEqual(JSON.parse(csvToJson('n\n9007199254740993')),[{n:'9007199254740993'}]);
});
test('formula protection is explicit, includes headers, and can be disabled without changing scalar strings',()=>{
 const json='[{"=header":"  =SUM(A1)","n":-42}]';const safe=jsonToCsv(json,',',true,true);assert.ok(safe.startsWith('\uFEFF'));assert.deepEqual(parseCsv(safe),[["'=header",'n'],["'  =SUM(A1)",'-42']]);assert.deepEqual(parseCsv(jsonToCsv(json,',',false)),[['=header','n'],['  =SUM(A1)','-42']]);
});
test('invalid CSV, duplicate keys, nesting and budgets are rejected',()=>{
 for(const csv of ['a,a\n1,2',',b\n1,2','a,b\n1','a\n"unterminated','a\n"x" trailing','a\na"b'])assert.throws(()=>csvToJson(csv));for(const json of ['[{"x":1,"x":2}]','[{"":1}]','[{"x":{}}]','[{}]','{"x":1}','[1]'])assert.throws(()=>jsonToCsv(json));assert.throws(()=>jsonToCsv('['+Array(1001).fill('{"x":1}').join(',')+']'));assert.throws(()=>parseCsv('x'.repeat(100001)));assert.throws(()=>parseCsv('a|b','|'));
});
test('CSV header names cannot pollute Object.prototype',()=>{const result=JSON.parse(csvToJson('__proto__,constructor\nx,y'));assert.equal(result[0].__proto__,'x');assert.equal(result[0].constructor,'y');assert.equal({}.x,undefined);});
