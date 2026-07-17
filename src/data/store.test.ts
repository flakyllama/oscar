// Passcode lifecycle at the store level: enable, change (re-key), and
// verify entries persist encrypted under the *new* key only. Uses an
// in-memory StorageLike so the store never touches the DOM/localStorage.

import { describe, it, expect } from 'vitest';
import { Store } from './store';
import { verifyPasscode, isEncryptedBlob, decryptJson, type LockMeta } from './crypto';

function memStorage() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => (m.has(k) ? m.get(k)! : null),
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    _raw: m,
  };
}

const KEY = 'daybook.entries';
const LOCK = 'daybook.lock';

describe('Store passcode lifecycle', () => {
  it('encrypts entries at rest once a passcode is set', async () => {
    const storage = memStorage();
    const store = new Store(storage);
    store.setEntry('2026-07-17', 'a secret thought');
    await store.enablePasscode('first-pass');

    const persisted = JSON.parse(storage.getItem(KEY)!);
    expect(isEncryptedBlob(persisted)).toBe(true);
    expect(storage.getItem(KEY)).not.toContain('secret');
  });

  it('re-keys with changePasscode: new passcode decrypts, old does not', async () => {
    const storage = memStorage();
    const store = new Store(storage);
    store.setEntry('2026-07-17', 'a secret thought');
    await store.enablePasscode('first-pass');

    const oldMeta = JSON.parse(storage.getItem(LOCK)!) as LockMeta;

    const ok = await store.changePasscode('first-pass', 'second-pass');
    expect(ok).toBe(true);

    const newMeta = JSON.parse(storage.getItem(LOCK)!) as LockMeta;
    expect(newMeta.salt).not.toBe(oldMeta.salt); // fresh derivation

    // The new passcode verifies; the old one no longer does.
    expect(await verifyPasscode('second-pass', newMeta)).not.toBeNull();
    expect(await verifyPasscode('first-pass', newMeta)).toBeNull();

    // The persisted blob decrypts under the new key and still holds the text.
    const key = await verifyPasscode('second-pass', newMeta);
    const blob = JSON.parse(storage.getItem(KEY)!);
    const entries = await decryptJson<Record<string, string>>(blob, key!);
    expect(entries['2026-07-17']).toBe('a secret thought');
  });

  it('rejects a wrong current passcode and leaves the key unchanged', async () => {
    const storage = memStorage();
    const store = new Store(storage);
    store.setEntry('2026-07-17', 'a secret thought');
    await store.enablePasscode('first-pass');
    const before = storage.getItem(LOCK);

    const ok = await store.changePasscode('wrong', 'second-pass');
    expect(ok).toBe(false);
    expect(storage.getItem(LOCK)).toBe(before); // meta untouched
  });

  it('a fresh Store over the same storage stays locked until the new passcode unlocks it', async () => {
    const storage = memStorage();
    const first = new Store(storage);
    first.setEntry('2026-07-17', 'a secret thought');
    await first.enablePasscode('first-pass');
    await first.changePasscode('first-pass', 'second-pass');

    const reopened = new Store(storage);
    expect(reopened.getSnapshot().locked).toBe(true);
    expect(await reopened.unlock('first-pass')).toBe(false);
    expect(await reopened.unlock('second-pass')).toBe(true);
    expect(reopened.getSnapshot().entries['2026-07-17']).toBe('a secret thought');
  });
});
