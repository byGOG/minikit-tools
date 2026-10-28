export function createBorderRadius(topLeft: number, topRight: number, bottomRight: number, bottomLeft: number): { borderRadius: string; css: string } {
  const corners = [topLeft, topRight, bottomRight, bottomLeft];
  if (!corners.every(value => Number.isInteger(value) && value >= 0 && value <= 200)) {
    throw new RangeError('Expected integer corner radii from 0 to 200');
  }
  const borderRadius = corners.map(value => `${value}px`).join(' ');
  return { borderRadius, css: `border-radius: ${borderRadius};` };
}
