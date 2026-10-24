import test from'node:test';import assert from'node:assert/strict';import{replaceLiteral,numberLines,compareLines}from'../src/scripts/text-extras.ts';
test('replacement is literal, case-sensitive and non-overlapping, including dollar patterns',()=>{
 assert.deepEqual(replaceLiteral('aa aa AA','aa','$&'),{text:'$& $& AA',count:2});assert.deepEqual(replaceLiteral('aaaaa','aa',''),{text:'a',count:2});assert.deepEqual(replaceLiteral('<b>İ😀</b>','İ😀','<script>'),{text:'<b><script></b>',count:1});assert.deepEqual(replaceLiteral('','x','y'),{text:'',count:0});
 assert.throws(()=>replaceLiteral('abc','','x'));assert.throws(()=>replaceLiteral('a'.repeat(101),'a','x'.repeat(10000)));assert.equal(replaceLiteral('a'.repeat(100),'a','x'.repeat(10000)).text.length,1000000);
});
test('line numbering preserves blank/whitespace rows and normalizes CRLF/CR to LF',()=>{
 assert.equal(numberLines('first\r\n\r  last\n',9,true),'09. first\n10. \n11.   last\n12. ');assert.equal(numberLines(''), '');assert.equal(numberLines('\n'),'1. \n2. ');assert.equal(numberLines('last',1000000000),'1000000000. last');
 for(const start of [0,-1,1.5,NaN,1000000001])assert.throws(()=>numberLines('x',start));assert.throws(()=>numberLines('a\nb',1000000000));assert.throws(()=>numberLines('\n'.repeat(10000)));
});
test('line diff reports whole-line changes and treats line endings consistently',()=>{
 assert.deepEqual(compareLines('a\nb','a\nc'),[{kind:'equal',text:'a'},{kind:'remove',text:'b'},{kind:'add',text:'c'}]);assert.deepEqual(compareLines('a\r\nb\r','a\nb\n').map(r=>r.kind),['equal','equal','equal']);assert.deepEqual(compareLines('','x'),[{kind:'add',text:'x'}]);assert.deepEqual(compareLines('',''),[]);
 assert.throws(()=>compareLines('\n'.repeat(500),''));assert.throws(()=>compareLines('a'.repeat(100001),''));
});
test('diff rows reconstruct both inputs despite repeated/reordered lines',()=>{
 const inputs=['','a','a\na','a\nb\na','b\na\nb','\n','a\n','  a','<script>'];
 for(const a of inputs)for(const b of inputs){const rows=compareLines(a,b);assert.equal(rows.filter(r=>r.kind!=='add').map(r=>r.text).join('\n'),a);assert.equal(rows.filter(r=>r.kind!=='remove').map(r=>r.text).join('\n'),b);}
});
