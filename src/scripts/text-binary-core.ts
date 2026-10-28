export function convertBinary(input: string, mode: 'encode' | 'decode'): string {
  if (typeof input !== 'string' || (mode !== 'encode' && mode !== 'decode')) {
    throw new RangeError('Expected text and a supported conversion mode');
  }
  if (mode === 'encode') {
    if (!input || input.length > 5000) throw new RangeError('Expected 1–5000 UTF-16 units');
    for (const symbol of input) {
      const point = symbol.codePointAt(0)!;
      if (point >= 0xd800 && point <= 0xdfff) throw new RangeError('Unpaired Unicode surrogate');
    }
    return Array.from(new TextEncoder().encode(input), byte => byte.toString(2).padStart(8, '0')).join(' ');
  }
  if (input.length > 135000 || !input.trim()) throw new RangeError('Expected at most 135000 binary input characters');
  const tokens = input.trim().split(/\s+/);
  if (tokens.length > 15000 || tokens.some(token => !/^[01]{8}$/.test(token))) {
    throw new RangeError('Expected at most 15000 eight-bit binary bytes');
  }
  let result: string;
  try {
    result = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(Uint8Array.from(tokens, token => parseInt(token, 2)));
  } catch {
    throw new RangeError('Invalid UTF-8 bytes');
  }
  if (result.length > 5000) throw new RangeError('Decoded text exceeds 5000 UTF-16 units');
  return result;
}
