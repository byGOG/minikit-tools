const NUMERALS: ReadonlyArray<readonly [number, string]> = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
  [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
];

export function toRoman(n: number): string {
  if (!Number.isInteger(n) || n < 1 || n > 3999) throw new RangeError('Expected an integer from 1 to 3999');
  let result = '';
  for (const [value, numeral] of NUMERALS) {
    while (n >= value) { result += numeral; n -= value; }
  }
  return result;
}

function boundedInput(value: string): string {
  if (value.length > 100) throw new RangeError('Input exceeds 100 characters');
  return value.trim();
}

export function fromRoman(value: string): number {
  const input = boundedInput(value);
  if (!/^[IVXLCDM]+$/i.test(input)) throw new RangeError('Invalid Roman numeral');
  const roman = input.toUpperCase();
  let total = 0, position = 0;
  for (const [number, numeral] of NUMERALS) {
    while (roman.startsWith(numeral, position)) { total += number; position += numeral.length; }
  }
  if (position !== roman.length || total < 1 || total > 3999 || toRoman(total) !== roman) {
    throw new RangeError('Noncanonical Roman numeral');
  }
  return total;
}

export function convertRoman(input: string, mode: 'to-roman' | 'to-decimal'): string {
  const value = boundedInput(input);
  if (mode === 'to-decimal') return String(fromRoman(input));
  if (mode !== 'to-roman' || !/^[0-9]+$/.test(value)) throw new RangeError('Invalid decimal input or mode');
  return toRoman(Number(value));
}
