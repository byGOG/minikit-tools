import test from'node:test';import assert from'node:assert/strict';import{execFileSync}from'node:child_process';
import{parseCalendarDate,calculateAge,daysBetween,parseLocalTarget,countdownParts}from'../src/scripts/date-tools.ts';
test('calendar parsing validates leap years, early years and actual month lengths',()=>{
 assert.equal(parseCalendarDate('0001-01-01').milliseconds,-62135596800000);assert.equal(parseCalendarDate('0099-01-01').year,99);assert.equal(parseCalendarDate('2000-02-29').day,29);
 for(const value of ['0000-01-01','1900-02-29','2023-02-29','2024-04-31','2024-13-01','2024-01-00','2024-1-1',''])assert.throws(()=>parseCalendarDate(value));
});
test('age uses completed years and Feb 28 anniversaries for leap birthdays',()=>{
 assert.deepEqual(calculateAge('2000-02-29','2023-02-28'),{years:23,days:0,totalDays:8400});assert.equal(calculateAge('2000-02-29','2024-02-28').years,23);assert.equal(calculateAge('2000-02-29','2024-02-29').years,24);
 assert.deepEqual(calculateAge('2024-03-01','2024-03-01'),{years:0,days:0,totalDays:0});assert.equal(calculateAge('2000-12-31','2024-01-01').years,23);assert.throws(()=>calculateAge('2025-01-01','2024-12-31'));
});
test('calendar differences count days and inclusive end dates without hours',()=>{
 assert.deepEqual(daysBetween('2024-03-09','2024-03-11'),{days:2,weeks:0,remainingDays:2});assert.deepEqual(daysBetween('2024-01-01','2024-01-16'),{days:15,weeks:2,remainingDays:1});assert.equal(daysBetween('2024-01-01','2024-01-01').days,0);assert.equal(daysBetween('2024-01-01','2024-01-01',true).days,1);assert.equal(daysBetween('2024-02-28','2024-03-01').days,2);assert.throws(()=>daysBetween('2025-01-01','2024-01-01'));
});
test('countdown uses the deadline rather than accumulated ticks and never reaches zero early',()=>{
 assert.deepEqual(countdownParts(90061000,0),{days:1,hours:1,minutes:1,seconds:1,done:false});assert.equal(countdownParts(1000,999).seconds,1);assert.deepEqual(countdownParts(1000,5000),{days:0,hours:0,minutes:0,seconds:0,done:true});assert.equal(countdownParts(20000,19000).seconds,1);assert.throws(()=>countdownParts(NaN,0));
});
test('local parsing rejects DST gaps and picks the earlier repeated time',()=>{
 const moduleUrl=new URL('../src/scripts/date-tools.ts',import.meta.url).href;
 const script=`import assert from 'node:assert/strict';import {parseLocalTarget,daysBetween} from ${JSON.stringify(moduleUrl)};assert.throws(()=>parseLocalTarget('2024-03-10T02:30'));assert.equal(new Date(parseLocalTarget('2024-11-03T01:30')).toISOString(),'2024-11-03T05:30:00.000Z');assert.equal(daysBetween('2024-03-09','2024-03-11').days,2);`;
 execFileSync(process.execPath,['--experimental-strip-types','--input-type=module','-e',script],{env:{...process.env,TZ:'America/New_York'}});
 assert.throws(()=>parseLocalTarget('2024-01-01T24:00'));assert.throws(()=>parseLocalTarget('2024-02-30T12:00'));
});
