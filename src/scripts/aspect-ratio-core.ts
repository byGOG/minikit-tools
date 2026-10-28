export function calculateAspectRatio(width: number, height: number): { ratio: string; width: number; height: number } {
  if (![width, height].every(value => Number.isInteger(value) && value >= 1 && value <= 100000)) {
    throw new RangeError('Expected integer dimensions from 1 to 100000');
  }
  let a = width, b = height;
  while (b !== 0) { const remainder = a % b; a = b; b = remainder; }
  const reducedWidth = width / a, reducedHeight = height / a;
  return { ratio: `${reducedWidth}:${reducedHeight}`, width: reducedWidth, height: reducedHeight };
}
