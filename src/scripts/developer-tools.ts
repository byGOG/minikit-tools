const INPUT_LIMIT = 100000;
function checkInput(text: string) {
  if (text.length > INPUT_LIMIT) throw new RangeError('Input limit exceeded');
}

export function formatJson(text: string, compact = false): string {
  checkInput(text);
  JSON.parse(text); // Validate only: never serialize parsed numbers or duplicate keys.
  const tokens = text.match(/"(?:\\.|[^"\\])*"|[{}\[\],:]|true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/g) ?? [];
  let depth = 0, size = 0;
  const parts: string[] = [];
  const append = (value: string) => {
    size += value.length;
    if (size > 2000000) throw new RangeError('Output limit exceeded');
    parts.push(value);
  };
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    if (token === '{' || token === '[') {
      if (++depth > 100) throw new RangeError('Nesting limit exceeded');
      append(token);
      if (!compact && !['}', ']'].includes(tokens[index + 1])) append('\n' + '  '.repeat(depth));
    } else if (token === '}' || token === ']') {
      depth--;
      if (!compact && !['{', '['].includes(tokens[index - 1])) append('\n' + '  '.repeat(depth));
      append(token);
    } else if (token === ',') {
      append(compact ? ',' : ',\n' + '  '.repeat(depth));
    } else append(token === ':' && !compact ? ': ' : token);
  }
  return parts.join('');
}

export function encodeBase64(text: string): string {
  checkInput(text);
  for (const char of text) {
    if (char.length === 1 && char.charCodeAt(0) >= 0xd800 && char.charCodeAt(0) <= 0xdfff) throw new URIError('Invalid Unicode');
  }
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 4096) binary += String.fromCharCode(...bytes.subarray(offset, offset + 4096));
  return btoa(binary);
}

export function decodeBase64(text: string): string {
  checkInput(text);
  const clean = text.replace(/[\t\n\r ]/g, '');
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(clean) || clean.length % 4 === 1 || (clean.includes('=') && clean.length % 4 !== 0)) throw new Error('Invalid Base64');
  const binary = atob(clean);
  if (btoa(binary).replace(/=+$/, '') !== clean.replace(/=+$/, '')) throw new Error('Noncanonical Base64');
  return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(Uint8Array.from(binary, char => char.charCodeAt(0)));
}

export function convertUrlComponent(text: string, decode = false): string {
  checkInput(text);
  return decode ? decodeURIComponent(text) : encodeURIComponent(text);
}
