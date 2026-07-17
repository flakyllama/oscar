// Zero-knowledge sync identity.
//
// Everything derives from one 256-bit random master key, which the user
// copies between devices (shown once as a "sync key"). From it we derive
// three INDEPENDENT secrets via HKDF:
//
//   accountId  — names the row in the backend (not secret)
//   authToken  — bearer credential; the server stores only its hash
//   encKey     — AES-GCM key; never leaves the device
//
// Because the master key is high-entropy random, a backend holding the
// accountId + auth-token hash + ciphertext cannot feasibly reverse to the
// encryption key. That's what makes the sync zero-knowledge.

const HKDF_SALT = new TextEncoder().encode('oscar/sync/v1');

export interface SyncIdentity {
  accountId: string; // hex, 16 bytes
  authToken: string; // base64url, 32 bytes
  encKey: CryptoKey; // AES-GCM 256
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function toB64url(bytes: Uint8Array): string {
  let s = '';
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function generateMasterKey(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

async function hkdf(master: Uint8Array, info: string, bytes: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', master as BufferSource, 'HKDF', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: HKDF_SALT, info: new TextEncoder().encode(info) },
    key,
    bytes * 8,
  );
  return new Uint8Array(bits);
}

export async function deriveIdentity(master: Uint8Array): Promise<SyncIdentity> {
  const [idBytes, authBytes, encBytes] = await Promise.all([
    hkdf(master, 'account-id', 16),
    hkdf(master, 'auth-token', 32),
    hkdf(master, 'enc-key', 32),
  ]);
  const encKey = await crypto.subtle.importKey('raw', encBytes as BufferSource, 'AES-GCM', false, [
    'encrypt',
    'decrypt',
  ]);
  return { accountId: toHex(idBytes), authToken: toB64url(authBytes), encKey };
}

// ── AES-GCM payload sealing with the derived key ─────────────────

export interface SealedBlob {
  iv: string; // base64
  data: string; // base64
}

function b64(bytes: Uint8Array): string {
  let s = '';
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s);
}
function unb64(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function sealWithKey(value: unknown, key: CryptoKey): Promise<SealedBlob> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(JSON.stringify(value)),
  );
  return { iv: b64(iv), data: b64(new Uint8Array(data)) };
}

export async function openWithKey<T>(blob: SealedBlob, key: CryptoKey): Promise<T> {
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: unb64(blob.iv) as BufferSource },
    key,
    unb64(blob.data) as BufferSource,
  );
  return JSON.parse(new TextDecoder().decode(plain)) as T;
}

// ── Sync-key codec ───────────────────────────────────────────────
// Human-copyable encoding of the master key: Crockford base32 of
// [master:32][fletcher16:2], grouped and prefixed. The checksum catches
// typos before a wrong key silently fails to decrypt.

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford (no I,L,O,U)
const PREFIX = 'oscar1';

function fletcher16(bytes: Uint8Array): [number, number] {
  let a = 0;
  let b = 0;
  for (const byte of bytes) {
    a = (a + byte) % 255;
    b = (b + a) % 255;
  }
  return [b, a];
}

function base32Encode(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

function base32Decode(str: string): Uint8Array | null {
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of str.toUpperCase()) {
    const idx = ALPHABET.indexOf(ch);
    if (idx < 0) return null;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}

export function encodeSyncKey(master: Uint8Array): string {
  const check = fletcher16(master);
  const payload = new Uint8Array(34);
  payload.set(master, 0);
  payload.set(check, 32);
  const b32 = base32Encode(payload);
  const groups = b32.match(/.{1,5}/g) || [];
  return PREFIX + '-' + groups.join('-');
}

// Returns the master key, or null if the string is malformed / mistyped.
export function decodeSyncKey(input: string): Uint8Array | null {
  const cleaned = input.trim().toLowerCase().replace(/\s+/g, '');
  if (!cleaned.startsWith(PREFIX + '-')) return null;
  const body = cleaned.slice(PREFIX.length + 1).replace(/-/g, '');
  const bytes = base32Decode(body);
  if (!bytes || bytes.length < 34) return null;
  const master = bytes.slice(0, 32);
  const check = bytes.slice(32, 34);
  const expected = fletcher16(master);
  if (check[0] !== expected[0] || check[1] !== expected[1]) return null;
  return master;
}
