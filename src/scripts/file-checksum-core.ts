export const MAX_FILE_BYTES = 50 * 1024 * 1024;

export function normalizeExpectedHash(value: string): string | null {
  const hash = value.trim();
  if (!hash) return null;
  if (!/^[a-fA-F0-9]{64}$/.test(hash)) throw new TypeError('Invalid SHA-256 hash');
  return hash.toLowerCase();
}

export async function sha256File(file: Blob): Promise<string> {
  if (!file || !Number.isInteger(file.size) || file.size < 0 || file.size > MAX_FILE_BYTES) {
    throw new RangeError('File exceeds the byte limit');
  }
  if (!globalThis.crypto?.subtle) throw new Error('Web Crypto unavailable');
  const bytes = await file.arrayBuffer();
  if (bytes.byteLength !== file.size || bytes.byteLength > MAX_FILE_BYTES) {
    throw new RangeError('Unexpected file byte length');
  }
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}
