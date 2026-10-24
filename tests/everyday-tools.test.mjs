import test from 'node:test';import assert from 'node:assert/strict';
import {generatePassword,randomIndex,PASSWORD_GROUPS,convertUnit,parseNumeric,calculatePercentage,UNIT_GROUPS} from '../src/scripts/everyday-tools.ts';
const near=(a,b)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*1e-10,`${a} != ${b}`);
test('passwords cover selected groups, bounds and digits-only choices',()=>{
 for(const length of [8,20,128]){
  const value=generatePassword(length,['upper','lower','digits','symbols']);assert.equal(value.length,length);
  for(const alphabet of Object.values(PASSWORD_GROUPS))assert.ok([...value].some(c=>alphabet.includes(c)));
 }
 assert.match(generatePassword(20,['digits']),/^\d{20}$/);
 for(const length of [0,7,129,8.5,NaN])assert.throws(()=>generatePassword(length,['lower']));
 assert.throws(()=>generatePassword(20,[]));assert.throws(()=>generatePassword(20,['bogus']));assert.throws(()=>generatePassword(20,['digits','digits']));
});
test('random index rejects biased tail values and fails closed without a usable RNG',()=>{
 let calls=0;assert.equal(randomIndex(10,array=>{array[0]=calls++===0?0xffffffff:27;}),7);assert.equal(calls,2);
 assert.throws(()=>randomIndex(0));assert.throws(()=>randomIndex(10,array=>array[0]=0xffffffff));
 assert.throws(()=>generatePassword(20,['lower'],()=>{throw Error('RNG unavailable');}));
});
test('unit conversions use known metric/US factors and affine temperature conversion',()=>{
 near(convertUnit(1,'length','in','cm'),2.54);near(convertUnit(1,'length','mi','m'),1609.344);
 near(convertUnit(1,'mass','lb','kg'),0.45359237);near(convertUnit(16,'mass','oz','lb'),1);
 near(convertUnit(1,'volume','US gal','L'),3.785411784);near(convertUnit(128,'volume','US fl oz','US gal'),1);
 near(convertUnit(36,'speed','km/h','m/s'),10);near(convertUnit(60,'speed','mph','km/h'),96.56064);
 near(convertUnit(0,'temperature','C','F'),32);near(convertUnit(212,'temperature','F','C'),100);
 near(convertUnit(-273.15,'temperature','C','K'),0);near(convertUnit(-459.67,'temperature','F','K'),0);
 assert.throws(()=>convertUnit(-274,'temperature','C','K'));assert.throws(()=>convertUnit(1,'length','kg','m'));
 assert.throws(()=>convertUnit(Infinity,'mass','kg','g'));
 for(const [category,group] of Object.entries(UNIT_GROUPS))for(const unit of Object.keys(group))near(convertUnit(10,category,unit,unit),10);
});
test('numeric parsing accepts decimal comma/dot and rejects incomplete/grouped/nonfinite inputs',()=>{
 near(parseNumeric(' 1,25 '),1.25);near(parseNumeric('-1.2e3'),-1200);near(parseNumeric('.5'),.5);
 for(const value of ['', '1 000','1,000.00','1.000,00','NaN','Infinity','1e9999','1,2,3'])assert.throws(()=>parseNumeric(value));
});
test('percentage modes handle decreases, negatives and zero denominators explicitly',()=>{
 near(calculatePercentage(15,200,'of'),30);near(calculatePercentage(25,200,'ratio'),12.5);
 near(calculatePercentage(100,125,'change'),25);near(calculatePercentage(100,75,'change'),-25);
 near(calculatePercentage(-100,-50,'change'),50);near(calculatePercentage(0,20,'of'),0);
 assert.throws(()=>calculatePercentage(1,0,'ratio'));assert.throws(()=>calculatePercentage(0,1,'change'));
 assert.throws(()=>calculatePercentage(NaN,1,'of'));assert.throws(()=>calculatePercentage(1,2,'invalid'));
});
