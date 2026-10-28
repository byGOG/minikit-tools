type Operation = 'add' | 'subtract' | 'multiply' | 'divide';

export function calculateFraction(a: number, b: number, c: number, d: number, operation: Operation): { numerator: string; denominator: string; text: string } {
  if (![a, b, c, d].every(value => typeof value === 'number' && Number.isInteger(value) && value >= -1e9 && value <= 1e9) || b === 0 || d === 0) {
    throw new RangeError('Expected integer fraction components from -1000000000 to 1000000000 with nonzero denominators');
  }
  const [aa, bb, cc, dd] = [a, b, c, d].map(value => BigInt(value));
  let numerator: bigint, denominator: bigint;
  switch (operation) {
    case 'add': numerator = aa * dd + cc * bb; denominator = bb * dd; break;
    case 'subtract': numerator = aa * dd - cc * bb; denominator = bb * dd; break;
    case 'multiply': numerator = aa * cc; denominator = bb * dd; break;
    case 'divide':
      if (cc === 0n) throw new RangeError('Cannot divide by a zero fraction');
      numerator = aa * dd; denominator = bb * cc; break;
    default: throw new RangeError('Unknown fraction operation');
  }
  if (denominator < 0n) { numerator = -numerator; denominator = -denominator; }
  let x = numerator < 0n ? -numerator : numerator, y = denominator;
  while (y !== 0n) { const remainder = x % y; x = y; y = remainder; }
  numerator /= x;
  denominator /= x;
  const n = String(numerator), den = String(denominator);
  return { numerator: n, denominator: den, text: denominator === 1n ? n : `${n}/${den}` };
}
