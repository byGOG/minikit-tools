const SYMBOLS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const CODES = '.- -... -.-. -.. . ..-. --. .... .. .--- -.- .-.. -- -. --- .--. --.- .-. ... - ..- ...- .-- -..- -.-- --.. ----- .---- ..--- ...-- ....- ..... -.... --... ---.. ----.'.split(' ');
const ENCODE = new Map(Array.from(SYMBOLS, (symbol, index) => [symbol, CODES[index]]));
const DECODE = new Map(CODES.map((code, index) => [code, SYMBOLS[index]]));

export function encodeMorse(text: string): string {
  if (text.length > 1000 || !/^[A-Za-z0-9\s]+$/.test(text)) throw new RangeError('Use at most 1000 characters containing A–Z, 0–9 and whitespace');
  const words = text.trim().split(/\s+/);
  if (!words[0]) throw new RangeError('Enter text to encode');
  return words.map(word => Array.from(word.toUpperCase(), symbol => ENCODE.get(symbol)!).join(' ')).join(' / ');
}

export function decodeMorse(code: string): string {
  if (code.length > 6000 || !code.trim()) throw new RangeError('Enter at most 6000 Morse characters');
  const words = code.trim().split('/');
  const output = words.map(word => {
    const value = word.trim();
    if (!value) throw new RangeError('Empty Morse word');
    return value.split(/\s+/).map(token => {
      const symbol = DECODE.get(token);
      if (symbol === undefined) throw new RangeError('Unknown Morse code');
      return symbol;
    }).join('');
  }).join(' ');
  if (output.length > 1000) throw new RangeError('Decoded text exceeds 1000 characters');
  return output;
}

export function convertMorse(input: string, mode: 'encode' | 'decode'): string {
  if (mode === 'encode') return encodeMorse(input);
  if (mode === 'decode') return decodeMorse(input);
  throw new RangeError('Unknown Morse conversion mode');
}
