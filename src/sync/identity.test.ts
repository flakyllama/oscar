import { describe, it, expect } from 'vitest';
import {
  generateMasterKey,
  deriveIdentity,
  encodeSyncKey,
  decodeSyncKey,
  sealWithKey,
  openWithKey,
} from './identity';

describe('deriveIdentity', () => {
  const master = new Uint8Array(32).fill(7);

  it('is deterministic — same master key → same identity', async () => {
    const a = await deriveIdentity(master);
    const b = await deriveIdentity(new Uint8Array(32).fill(7));
    expect(a.accountId).toBe(b.accountId);
    expect(a.authToken).toBe(b.authToken);
  });

  it('derives independent-looking secrets (id ≠ auth)', async () => {
    const id = await deriveIdentity(master);
    expect(id.accountId).toHaveLength(32); // 16 bytes hex
    expect(id.authToken).not.toBe(id.accountId);
    expect(id.authToken.length).toBeGreaterThan(20);
  });

  it('different master keys → different identities', async () => {
    const a = await deriveIdentity(new Uint8Array(32).fill(1));
    const b = await deriveIdentity(new Uint8Array(32).fill(2));
    expect(a.accountId).not.toBe(b.accountId);
    expect(a.authToken).not.toBe(b.authToken);
  });
});

describe('sync-key codec', () => {
  it('round-trips a master key', () => {
    const master = generateMasterKey();
    const encoded = encodeSyncKey(master);
    expect(encoded.startsWith('oscar1-')).toBe(true);
    const decoded = decodeSyncKey(encoded);
    expect(decoded).not.toBeNull();
    expect(Array.from(decoded!)).toEqual(Array.from(master));
  });

  it('is case- and whitespace-insensitive', () => {
    const master = new Uint8Array(32).fill(42);
    const encoded = encodeSyncKey(master);
    const messy = '  ' + encoded.toUpperCase().replace(/-/g, ' - ') + '  ';
    expect(Array.from(decodeSyncKey(messy)!)).toEqual(Array.from(master));
  });

  it('rejects a mistyped key via the checksum', () => {
    const encoded = encodeSyncKey(new Uint8Array(32).fill(9));
    // Flip one character in the body (not the prefix).
    const body = encoded.slice(7);
    const swap = body[0] === 'a' ? 'b' : 'a';
    const broken = 'oscar1-' + swap + body.slice(1);
    expect(decodeSyncKey(broken)).toBeNull();
  });

  it('rejects a foreign / prefixless string', () => {
    expect(decodeSyncKey('hello world')).toBeNull();
    expect(decodeSyncKey('')).toBeNull();
    expect(decodeSyncKey('other1-AAAA-BBBB')).toBeNull();
  });
});

describe('sealWithKey / openWithKey', () => {
  it('round-trips a value under the derived encryption key', async () => {
    const { encKey } = await deriveIdentity(new Uint8Array(32).fill(3));
    const value = { days: { '2026-07-16': { text: 'secret', time: 60, updatedAt: 1 } } };
    const sealed = await sealWithKey(value, encKey);
    expect(sealed.data).not.toContain('secret'); // opaque ciphertext
    const opened = await openWithKey<typeof value>(sealed, encKey);
    expect(opened).toEqual(value);
  });

  it('a different key cannot open the blob', async () => {
    const a = await deriveIdentity(new Uint8Array(32).fill(4));
    const b = await deriveIdentity(new Uint8Array(32).fill(5));
    const sealed = await sealWithKey({ x: 1 }, a.encKey);
    await expect(openWithKey(sealed, b.encKey)).rejects.toThrow();
  });
});
