import { normalizeHexColor } from './gradient-core.ts';

type BoxShadowOptions = {
  x: number; y: number; blur: number; spread: number;
  opacity: number; color: string; inset: boolean;
};

export function createBoxShadow(options: BoxShadowOptions): { boxShadow: string; css: string } {
  const { x, y, blur, spread, opacity, color, inset } = options;
  const integerInRange = (value: number, min: number, max: number) => Number.isInteger(value) && value >= min && value <= max;
  if (![x, y, spread].every(value => integerInRange(value, -100, 100)) ||
      !integerInRange(blur, 0, 200) || !integerInRange(opacity, 0, 100) || typeof inset !== 'boolean') {
    throw new RangeError('Invalid box-shadow options');
  }
  const hex = normalizeHexColor(color).slice(1);
  const [red, green, blue] = [0, 2, 4].map(offset => parseInt(hex.slice(offset, offset + 2), 16));
  const boxShadow = `${inset ? 'inset ' : ''}${x}px ${y}px ${blur}px ${spread}px rgba(${red}, ${green}, ${blue}, ${opacity / 100})`;
  return { boxShadow, css: `box-shadow: ${boxShadow};` };
}
