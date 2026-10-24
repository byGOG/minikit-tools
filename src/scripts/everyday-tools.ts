export const PASSWORD_GROUPS = {
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', lower: 'abcdefghijklmnopqrstuvwxyz',
  digits: '0123456789', symbols: '!@#$%^&*()-_=+[]{}:,.?',
};
type PasswordGroup = keyof typeof PASSWORD_GROUPS;

export function randomIndex(size: number, fill: (values: Uint32Array) => void = values => { globalThis.crypto.getRandomValues(values); }): number {
  if (!Number.isInteger(size) || size < 1 || size > 0x100000000) throw new RangeError('Invalid alphabet');
  const limit = Math.floor(0x100000000 / size) * size;
  const values = new Uint32Array(1);
  for (let attempt = 0; attempt < 1000; attempt++) {
    fill(values);
    if (values[0] < limit) return values[0] % size;
  }
  throw new Error('Random source unavailable');
}

export function generatePassword(length: number, groups: PasswordGroup[], pick: (size: number) => number = randomIndex): string {
  if (!Number.isInteger(length) || length < 8 || length > 128 || !groups.length || new Set(groups).size !== groups.length || groups.some(key => !Object.hasOwn(PASSWORD_GROUPS, key))) throw new RangeError('Invalid password options');
  const alphabets = groups.map(key => PASSWORD_GROUPS[key]);
  const all = alphabets.join('');
  const result = alphabets.map(alphabet => alphabet[pick(alphabet.length)]);
  while (result.length < length) result.push(all[pick(all.length)]);
  for (let index = result.length - 1; index > 0; index--) {
    const other = pick(index + 1);
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result.join('');
}

export const UNIT_GROUPS = {
  length: { m:1, km:1000, cm:0.01, mm:0.001, in:0.0254, ft:0.3048, yd:0.9144, mi:1609.344 },
  mass: { kg:1, g:0.001, mg:0.000001, lb:0.45359237, oz:0.028349523125 },
  temperature: { C:1, F:1, K:1 },
  volume: { L:1, mL:0.001, 'US gal':3.785411784, 'US fl oz':0.0295735295625 },
  speed: { 'm/s':1, 'km/h':1/3.6, mph:0.44704 },
};
export type UnitCategory = keyof typeof UNIT_GROUPS;

export function parseNumeric(text: string): number {
  const clean = text.trim();
  if (!/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:[eE][+-]?\d+)?$/.test(clean)) throw new Error('Invalid number');
  const result = Number(clean.replace(',', '.'));
  if (!Number.isFinite(result)) throw new Error('Invalid number');
  return result;
}
function finite(value: number) {
  if (!Number.isFinite(value)) throw new Error('Result out of range');
  return Object.is(value, -0) ? 0 : value;
}

export function convertUnit(value: number, category: UnitCategory, from: string, to: string): number {
  const group: Record<string, number> = UNIT_GROUPS[category];
  if (!group || !Object.hasOwn(group, from) || !Object.hasOwn(group, to)) throw new Error('Invalid unit');
  finite(value);
  if (category === 'temperature') {
    const kelvin = from === 'C' ? value + 273.15 : from === 'F' ? (value + 459.67) * 5 / 9 : value;
    if (kelvin < -1e-10) throw new Error('Below absolute zero');
    const bounded = Math.max(0, kelvin);
    if (from === to) return value;
    return finite(to === 'C' ? bounded - 273.15 : to === 'F' ? bounded * 9 / 5 - 459.67 : bounded);
  }
  if (from === to) return value;
  return finite(value * group[from] / group[to]);
}

export type PercentageMode = 'of' | 'ratio' | 'change';
export function calculatePercentage(a: number, b: number, mode: PercentageMode): number {
  finite(a); finite(b);
  if (mode === 'of') return finite((a / 100) * b);
  if (mode === 'ratio') { if (b === 0) throw new Error('Zero denominator'); return finite((a / b) * 100); }
  if (mode === 'change') { if (a === 0) throw new Error('Zero baseline'); return finite(((b - a) / Math.abs(a)) * 100); }
  throw new Error('Invalid percentage mode');
}
