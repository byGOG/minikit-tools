import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {changeCase} from '../src/scripts/text-tools.ts';
import {compareJson} from '../src/scripts/structured-core.ts';

const examples=JSON.parse(await readFile(new URL('../src/data/tool-examples.json',import.meta.url),'utf8'));
const locales=JSON.parse(await readFile(new URL('../src/i18n/catalog.json',import.meta.url),'utf8'));

test('published uppercase example matches the tool in every supported locale',()=>{
 const [input,expected]=examples['case-converter'];
 for(const {code} of locales)assert.equal(changeCase(input,'upper',code),expected,`${code}: published uppercase example`);
});

test('published JSON comparison example shows the real JSON Pointer result',()=>{
 const [input,expected]=examples['json-compare'];
 const operands=input.split(' ↔ ');
 assert.equal(operands.length,2,'comparison example provides two JSON inputs');
 const result=compareJson(operands[0],operands[1]);
 assert.equal(result.equal,false);
 assert.equal(result.text,expected,'published output must match the tool output, including paths and formatting');
});
