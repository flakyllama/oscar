// Passcode gate: entries encrypted at rest with AES-GCM, key derived
// from the passcode via PBKDF2. Only the entries blob is encrypted —
// times/hours/settings stay plain (they contain no written text).

const PBKDF2_ITERATIONS = 310000;

export interface LockMeta {
  salt: string; // base64
  check: string; // base64 AES-GCM encryption of the literal 'oscar'
  checkIv: string; // base64
}

export interface EncryptedBlob {
  __enc: true;
  iv: string; // base64
  data: string; // base64
}

function toB64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s);
}

function fromB64(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function deriveKey(passcode: string, saltB64: string): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passcode),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: fromB64(saltB64), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function makeLockMeta(passcode: string): Promise<{ meta: LockMeta; key: CryptoKey }> {
  const salt = toB64(crypto.getRandomValues(new Uint8Array(16)));
  const key = await deriveKey(passcode, salt);
  const checkIv = crypto.getRandomValues(new Uint8Array(12));
  const check = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: checkIv },
    key,
    new TextEncoder().encode('oscar'),
  );
  return { meta: { salt, check: toB64(check), checkIv: toB64(checkIv) }, key };
}

// Resolves to the key when the passcode matches, null otherwise.
export async function verifyPasscode(passcode: string, meta: LockMeta): Promise<CryptoKey | null> {
  const key = await deriveKey(passcode, meta.salt);
  try {
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromB64(meta.checkIv) },
      key,
      fromB64(meta.check),
    );
    return new TextDecoder().decode(plain) === 'oscar' ? key : null;
  } catch {
    return null;
  }
}

export async function encryptJson(value: unknown, key: CryptoKey): Promise<EncryptedBlob> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(JSON.stringify(value)),
  );
  return { __enc: true, iv: toB64(iv), data: toB64(data) };
}

export async function decryptJson<T>(blob: EncryptedBlob, key: CryptoKey): Promise<T> {
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromB64(blob.iv) },
    key,
    fromB64(blob.data),
  );
  return JSON.parse(new TextDecoder().decode(plain)) as T;
}

export function isEncryptedBlob(v: unknown): v is EncryptedBlob {
  return !!v && typeof v === 'object' && (v as EncryptedBlob).__enc === true;
}
