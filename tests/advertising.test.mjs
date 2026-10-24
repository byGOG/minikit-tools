import test from 'node:test';
import assert from 'node:assert/strict';
import {validateAdvertising} from '../src/scripts/advertising-config.ts';
const off={publisherId:'',enabled:false,siteApproved:false,googleCmpPublished:false,topSlot:'',bottomSlot:''};
test('unconnected and verification-only configurations do not enable ads',()=>{
 assert.equal(validateAdvertising(off).enabled,false);
 assert.equal(validateAdvertising({...off,publisherId:'ca-pub-1234567890123456'}).enabled,false);
});
test('publisher and ad unit values cannot inject markup or scripts',()=>{
 for(const publisherId of ['pub-1234567890123456','ca-pub-123','<script>','ca-pub-1234567890123456?x'])assert.throws(()=>validateAdvertising({...off,publisherId}));
 assert.throws(()=>validateAdvertising({...off,topSlot:'123 onclick=alert(1)'}));
});
test('live advertisements require all setup dependencies',()=>{
 const live={publisherId:'ca-pub-1234567890123456',enabled:true,siteApproved:true,googleCmpPublished:true,topSlot:'1234567890',bottomSlot:'0987654321'};
 assert.equal(validateAdvertising(live).enabled,true);
 for(const [key,value]of Object.entries({publisherId:'',siteApproved:false,googleCmpPublished:false,topSlot:'',bottomSlot:''}))assert.throws(()=>validateAdvertising({...live,[key]:value}));
});
