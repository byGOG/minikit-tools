export const MAX_IMAGE_PIXELS = 16000000;
export const MAX_IMAGE_SIDE = 8192;
export function validRasterHeader(bytes: Uint8Array, mime: string) {
  if (mime === 'image/png') return [137,80,78,71,13,10,26,10].every((value,index)=>bytes[index]===value);
  if (mime === 'image/jpeg') return bytes[0]===255 && bytes[1]===216 && bytes[2]===255;
  if (mime === 'image/webp') return String.fromCharCode(...bytes.subarray(0,4))==='RIFF' && String.fromCharCode(...bytes.subarray(8,12))==='WEBP';
  return false;
}
export function validateImageSize(width: number, height: number) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > MAX_IMAGE_SIDE || height > MAX_IMAGE_SIDE || width * height > MAX_IMAGE_PIXELS) throw new RangeError('Invalid image dimensions');
  return { width, height };
}
export function proportionalSize(originalWidth: number, originalHeight: number, value: number, axis: 'width' | 'height') {
  validateImageSize(originalWidth, originalHeight);
  const width = axis === 'width' ? value : Math.max(1, Math.round(value * originalWidth / originalHeight));
  const height = axis === 'height' ? value : Math.max(1, Math.round(value * originalHeight / originalWidth));
  return validateImageSize(width, height);
}
export function cropRectangle(sourceWidth: number, sourceHeight: number, x: number, y: number, width: number, height: number) {
  validateImageSize(sourceWidth, sourceHeight);validateImageSize(width, height);
  if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x + width > sourceWidth || y + height > sourceHeight) throw new RangeError('Crop outside source');
  return { x, y, width, height };
}
export function centeredSquare(width: number, height: number) {
  validateImageSize(width, height);const side=Math.min(width,height);
  return {x:Math.floor((width-side)/2),y:Math.floor((height-side)/2),width:side,height:side};
}
export function rotatedSize(width: number, height: number, angle: number) {
  validateImageSize(width,height);
  if (![0,90,180,270].includes(angle)) throw new RangeError('Invalid rotation');
  return angle===90||angle===270 ? {width:height,height:width} : {width,height};
}
