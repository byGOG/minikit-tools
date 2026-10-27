export function normalizeHexColor(value: string): string {
  if (value.length > 32) throw new RangeError('Color input exceeds 32 characters');
  const color = value.trim();
  if (!/^#(?:[a-fA-F0-9]{3}|[a-fA-F0-9]{6})$/.test(color)) throw new RangeError('Expected #RGB or #RRGGBB');
  const hex = color.slice(1).toLowerCase();
  return '#' + (hex.length === 3 ? Array.from(hex, digit => digit + digit).join('') : hex);
}

export function createGradient(start: string, end: string, angle: number): { backgroundImage: string; css: string } {
  if (!Number.isInteger(angle) || angle < 0 || angle > 360) throw new RangeError('Expected an integer angle from 0 to 360');
  const backgroundImage = `linear-gradient(${angle}deg, ${normalizeHexColor(start)} 0%, ${normalizeHexColor(end)} 100%)`;
  return { backgroundImage, css: `background: ${backgroundImage};` };
}
