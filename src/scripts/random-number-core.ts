import { randomIndex } from './everyday-tools.ts';

export function generateRandomNumbers(min: number, max: number, count: number, pick: (size: number) => number = randomIndex): number[] {
  if (![min, max].every(value => typeof value === 'number' && Number.isInteger(value) && value >= -1e9 && value <= 1e9) ||
      min > max || typeof count !== 'number' || !Number.isInteger(count) || count < 1 || count > 100) {
    throw new RangeError('Invalid integer range or count');
  }
  if (min === max) return Array.from({ length: count }, () => min);
  const size = max - min + 1;
  return Array.from({ length: count }, () => {
    const offset = pick(size);
    if (!Number.isInteger(offset) || offset < 0 || offset >= size) throw new Error('Random source unavailable');
    return min + offset;
  });
}
