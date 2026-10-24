import test from 'node:test';import assert from 'node:assert/strict';import{createHash}from'node:crypto';
import{generateUuids,sha256Text,parseUnix,formatUnix,parseUtcDate}from'../src/scripts/developer-extras.ts';
test('UUID v4 sets version and RFC variant bits and enforces batch bounds',()=>{
 assert.deepEqual(generateUuids(1,bytes=>bytes.fill(0)),['00000000-0000-4000-8000-000000000000']);assert.deepEqual(generateUuids(1,bytes=>bytes.fill(255)),['ffffffff-ffff-4fff-bfff-ffffffffffff']);
 const batch=generateUuids(100);assert.equal(new Set(batch).size,100);for(const id of batch)assert.match(id,/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
 for(const n of [0,101,1.5,NaN])assert.throws(()=>generateUuids(n));assert.throws(()=>generateUuids(1,()=>{throw Error('No crypto');}));
});
test('SHA-256 matches known empty/abc vectors and UTF-8 byte hashing without normalization',async()=>{
 assert.equal(await sha256Text(''),'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');assert.equal(await sha256Text('abc'),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
 for(const value of ['İstanbul 😀',' abc\n','a\r\nb','é','e\u0301'])assert.equal(await sha256Text(value),createHash('sha256').update(value,'utf8').digest('hex'));
 await assert.rejects(()=>sha256Text('\ud800'));await assert.rejects(()=>sha256Text('a'.repeat(100001)));
});
test('Unix parsing preserves negative subsecond values and exact milliseconds',()=>{
 assert.equal(parseUnix('-0.001','seconds'),-1);assert.equal(parseUnix('1700000000.123','seconds'),1700000000123);assert.equal(parseUnix('1700000000123','milliseconds'),1700000000123);
 for(const ms of [-62135596800000,-1001,-1,0,1,1700000000123,253402300799999])for(const unit of ['seconds','milliseconds'])assert.equal(parseUnix(formatUnix(ms,unit),unit),ms);
});
test('timestamps reject unsupported syntax, precision and out-of-range dates',()=>{
 for(const v of ['','1e3','1,000','1.0001','NaN','Infinity','253402300800'])assert.throws(()=>parseUnix(v,'seconds'));assert.throws(()=>parseUnix('1.2','milliseconds'));assert.throws(()=>parseUnix('-62135596800001','milliseconds'));assert.throws(()=>formatUnix(1.5,'seconds'));
});
test('UTC date parsing validates leap days, early years and fractions independently of local time',()=>{
 assert.equal(parseUtcDate('1970-01-01T00:00'),0);assert.equal(parseUtcDate('0001-01-01T00:00'),-62135596800000);assert.equal(parseUtcDate('0099-01-01T00:00'),Date.parse('0099-01-01T00:00:00Z'));assert.equal(parseUtcDate('2024-02-29T23:59:59.123'),Date.parse('2024-02-29T23:59:59.123Z'));
 for(const v of ['0000-01-01T00:00','2023-02-29T00:00','2024-04-31T00:00','2024-01-01T24:00','2024-01-01T00:00:60','2024-01-01T00:00Z'])assert.throws(()=>parseUtcDate(v));
});
