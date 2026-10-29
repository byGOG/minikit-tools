import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {changeCase} from '../src/scripts/text-tools.ts';
import {compareJson} from '../src/scripts/structured-core.ts';
import {generateLoremIpsum} from '../src/scripts/lorem-ipsum-core.ts';
import {convertRoman} from '../src/scripts/roman-numerals-core.ts';
import {convertMorse} from '../src/scripts/morse-code-core.ts';
import {createGradient} from '../src/scripts/gradient-core.ts';
import {decimalToFraction} from '../src/scripts/decimal-fraction-core.ts';
import {calculateFraction} from '../src/scripts/fraction-core.ts';
import {convertBinary} from '../src/scripts/text-binary-core.ts';
import {createBorderRadius} from '../src/scripts/border-radius-core.ts';
import {calculateAspectRatio} from '../src/scripts/aspect-ratio-core.ts';
import {createBoxShadow} from '../src/scripts/box-shadow-core.ts';

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

test('published Lorem Ipsum example matches the generated text',()=>{
 const [input,expected]=examples['lorem-ipsum-generator'];
 assert.equal(input,'1 × 5');
 assert.equal(generateLoremIpsum(1,5),expected);
});

test('published Roman numeral example works in both directions',()=>{
 const [input,expected]=examples['roman-numeral-converter'];
 assert.equal(convertRoman(input,'to-roman'),expected);
 assert.equal(convertRoman(expected,'to-decimal'),input);
});

test('published Morse example works in both directions',()=>{
 const [input,expected]=examples['morse-code-translator'];
 assert.equal(convertMorse(input,'encode'),expected);
 assert.equal(convertMorse(expected,'decode'),input);
});

test('published CSS gradient example matches the real declaration',()=>{
 const [input,expected]=examples['css-gradient-generator'];
 assert.equal(input,'#155c42 → #c7f36b · 90°');
 assert.equal(createGradient('#155c42','#c7f36b',90).css,expected);
});

test('published CSS box-shadow example matches the real declaration',()=>{
 const [input,expected]=examples['css-box-shadow-generator'];
 assert.equal(input,'0px · 8px · 24px · 0px · #000000 · 20%');
 assert.equal(createBoxShadow({x:0,y:8,blur:24,spread:0,color:'#000000',opacity:20,inset:false}).css,expected);
});

test('published aspect ratio example matches the reduced ratio',()=>{
 const [input,expected]=examples['aspect-ratio-calculator'];
 assert.equal(input,'1920 × 1080');
 assert.equal(calculateAspectRatio(1920,1080).ratio,expected);
});

test('published CSS border-radius example matches the real declaration',()=>{
 const [input,expected]=examples['css-border-radius-generator'];
 assert.equal(input,'16px · 32px · 48px · 0px');
 assert.equal(createBorderRadius(16,32,48,0).css,expected);
});

test('published binary example matches UTF-8 bytes in both directions',()=>{
 const [input,expected]=examples['text-binary-converter'];
 assert.equal(convertBinary(input,'encode'),expected);
 assert.equal(convertBinary(expected,'decode'),input);
});

test('published fraction example matches exact reduced arithmetic',()=>{
 const [input,expected]=examples['fraction-calculator'];
 assert.equal(input,'1/2 + 1/3');
 assert.equal(calculateFraction(1,2,1,3,'add').text,expected);
});

test('published decimal example matches exact reduced fraction',()=>{
 const [input,expected]=examples['decimal-to-fraction'];
 assert.equal(decimalToFraction(input).text,expected);
 assert.equal(decimalToFraction(input.replace('.',',')).text,expected);
});
