export function decimalToFraction(input: string): { numerator: string; denominator: string; text: string } {
  if (typeof input !== 'string' || input.length > 64) throw new RangeError('Expected at most 64 input characters');
  const value = input.trim();
  if (!/^[+-]?(?:\d{1,12}(?:[.,]\d{1,12})?|[.,]\d{1,12})$/.test(value)) {
    throw new RangeError('Expected a decimal with at most 12 integer and 12 fractional digits');
  }
  const negative = value.startsWith('-');
  const unsigned = value.replace(/^[+-]/, '');
  const [integer, fraction = ''] = unsigned.split(/[.,]/);
  let numerator = BigInt((integer || '0') + fraction) * (negative ? -1n : 1n);
  let denominator = 10n ** BigInt(fraction.length);
  let a = numerator < 0n ? -numerator : numerator, b = denominator;
  while (b !== 0n) { const remainder = a % b; a = b; b = remainder; }
  numerator /= a;
  denominator /= a;
  const n = String(numerator), d = String(denominator);
  return { numerator: n, denominator: d, text: denominator === 1n ? n : `${n}/${d}` };
}
