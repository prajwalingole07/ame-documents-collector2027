import { sha256 as nobleSha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';

/**
 * SHA-256 that works everywhere:
 * - Vercel (HTTPS) uses the browser's native Web Crypto.
 * - Phones opening the local LAN address over plain HTTP still work,
 *   because a pure-JS implementation is available as a fallback.
 * Both paths produce the identical lowercase hex digest.
 */
export async function sha256(message) {
  const text = String(message ?? '');
  const bytes = new TextEncoder().encode(text);

  if (globalThis.crypto?.subtle) {
    try {
      const digest = await crypto.subtle.digest('SHA-256', bytes);
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    } catch (e) {
      // Fall through to the pure-JS implementation.
    }
  }

  return bytesToHex(nobleSha256(bytes));
}
