import { describe, it, expect } from 'vitest';
import { redisStore } from './_lib/redisStore';

// With automaticDeserialization off, Upstash's hgetall returns a flat
// [field, value, …] array. redisStore.get must reconstruct the doc from
// that shape (the bug that made every GET 404 in production), and also
// tolerate the object shape a differently-configured client returns.
function stubRedis(hgetallReturn: unknown) {
  return {
    hgetall: async () => hgetallReturn,
    eval: async () => [0, 1],
    del: async () => 1,
  } as never;
}

const stored = [
  'authHash', 'abc123',
  'version', '2',
  'updatedAt', '1700000000000',
  'blob', JSON.stringify({ iv: 'x', data: 'y' }),
];

describe('redisStore.get shape handling', () => {
  it('reconstructs a doc from the flat-array HGETALL form', async () => {
    const doc = await redisStore(stubRedis(stored)).get('a'.repeat(32));
    expect(doc).toEqual({
      authHash: 'abc123',
      version: 2,
      updatedAt: 1700000000000,
      blob: { iv: 'x', data: 'y' },
    });
  });

  it('also accepts the object HGETALL form', async () => {
    const obj = { authHash: 'abc123', version: '2', updatedAt: '1700000000000', blob: '{"iv":"x","data":"y"}' };
    const doc = await redisStore(stubRedis(obj)).get('a'.repeat(32));
    expect(doc?.authHash).toBe('abc123');
    expect(doc?.version).toBe(2);
    expect(doc?.blob).toEqual({ iv: 'x', data: 'y' });
  });

  it('treats an empty array/object/null as a missing account', async () => {
    expect(await redisStore(stubRedis([])).get('a'.repeat(32))).toBeNull();
    expect(await redisStore(stubRedis({})).get('a'.repeat(32))).toBeNull();
    expect(await redisStore(stubRedis(null)).get('a'.repeat(32))).toBeNull();
  });
});
