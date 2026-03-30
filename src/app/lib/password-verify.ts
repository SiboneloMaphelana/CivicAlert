/**
 * Constant-time compare of PBKDF2-derived keys using Web Crypto (browser).
 */
export async function verifyPbkdf2Sha256(
  password: string,
  saltB64: string,
  expectedHashB64: string,
  iterations = 210_000
): Promise<boolean> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    return false;
  }

  const enc = new TextEncoder();
  const saltView = base64ToBytes(saltB64);
  const saltBuf = saltView.buffer.slice(
    saltView.byteOffset,
    saltView.byteOffset + saltView.byteLength
  ) as ArrayBuffer;
  const expected = base64ToBytes(expectedHashB64);
  if (expected.length === 0) return false;

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuf,
      iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    expected.length * 8
  );

  const derived = new Uint8Array(bits);
  if (derived.length !== expected.length) return false;

  let diff = 0;
  for (let i = 0; i < derived.length; i++) {
    diff |= derived[i]! ^ expected[i]!;
  }
  return diff === 0;
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    out[i] = bin.charCodeAt(i);
  }
  return out;
}
