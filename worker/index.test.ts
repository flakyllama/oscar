import { describe, it, expect, beforeEach } from 'vitest';
import { handle, type Env } from './src/index';

// In-memory KV mock mirroring the subset the Worker uses.
function mockKV() {
  const store = new Map<string, string>();
  return {
    kv: {
      async get(key: string, _type: 'json') {
        const raw = store.get(key);
        return raw ? JSON.parse(raw) : null;
      },
      async put(key: string, value: string) {
        store.set(key, value);
      },
      async delete(key: string) {
        store.delete(key);
      },
    },
    store,
  };
}

const ACCOUNT = 'a'.repeat(32);
const TOKEN = 'auth-token-abc';
const OTHER_TOKEN = 'auth-token-xyz';

function req(method: string, account: string, opts: { token?: string; body?: unknown; ifMatch?: string } = {}) {
  const headers: Record<string, string> = { Origin: 'https://oscar.app' };
  if (opts.token) headers.Authorization = 'Bearer ' + opts.token;
  if (opts.ifMatch) headers['If-Match'] = opts.ifMatch;
  return new Request('https://api.test/v1/doc/' + account, {
    method,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
}

describe('worker sync API', () => {
  let env: Env;
  beforeEach(() => {
    env = { OSCAR_KV: mockKV().kv } as Env;
  });

  it('PUT creates an account and GET reads it back', async () => {
    const put = await handle(req('PUT', ACCOUNT, { token: TOKEN, body: { blob: { iv: 'x', data: 'y' }, updatedAt: 5 } }), env);
    expect(put.status).toBe(200);
    expect((await put.json()).version).toBe(1);

    const get = await handle(req('GET', ACCOUNT, { token: TOKEN }), env);
    expect(get.status).toBe(200);
    const body = await get.json();
    expect(body.blob).toEqual({ iv: 'x', data: 'y' });
    expect(body.version).toBe(1);
    expect(get.headers.get('ETag')).toBe('1');
  });

  it('GET on a missing account is 404 (treated as empty by the client)', async () => {
    const get = await handle(req('GET', ACCOUNT, { token: TOKEN }), env);
    expect(get.status).toBe(404);
  });

  it('rejects a wrong auth token on an existing account', async () => {
    await handle(req('PUT', ACCOUNT, { token: TOKEN, body: { blob: 1 } }), env);
    const get = await handle(req('GET', ACCOUNT, { token: OTHER_TOKEN }), env);
    expect(get.status).toBe(401);
    const put = await handle(req('PUT', ACCOUNT, { token: OTHER_TOKEN, body: { blob: 2 } }), env);
    expect(put.status).toBe(401);
  });

  it('requires a bearer token', async () => {
    const get = await handle(req('GET', ACCOUNT), env);
    expect(get.status).toBe(401);
  });

  it('bumps version on each write', async () => {
    await handle(req('PUT', ACCOUNT, { token: TOKEN, body: { blob: 'a' } }), env);
    const p2 = await handle(req('PUT', ACCOUNT, { token: TOKEN, body: { blob: 'b' } }), env);
    expect((await p2.json()).version).toBe(2);
  });

  it('enforces If-Match (optimistic concurrency)', async () => {
    await handle(req('PUT', ACCOUNT, { token: TOKEN, body: { blob: 'a' } }), env); // version 1
    // Stale writer thinks it's still on version 0 → 412.
    const stale = await handle(req('PUT', ACCOUNT, { token: TOKEN, body: { blob: 'b' }, ifMatch: '0' }), env);
    expect(stale.status).toBe(412);
    expect((await stale.json()).version).toBe(1);
    // Correct version → succeeds.
    const ok = await handle(req('PUT', ACCOUNT, { token: TOKEN, body: { blob: 'b' }, ifMatch: '1' }), env);
    expect(ok.status).toBe(200);
    expect((await ok.json()).version).toBe(2);
  });

  it('DELETE removes the account', async () => {
    await handle(req('PUT', ACCOUNT, { token: TOKEN, body: { blob: 'a' } }), env);
    const del = await handle(req('DELETE', ACCOUNT, { token: TOKEN }), env);
    expect(del.status).toBe(204);
    const get = await handle(req('GET', ACCOUNT, { token: TOKEN }), env);
    expect(get.status).toBe(404);
  });

  it('validates the account id shape', async () => {
    const bad = await handle(req('GET', 'not-hex', { token: TOKEN }), env);
    expect(bad.status).toBe(400);
  });

  it('answers CORS preflight', async () => {
    const pre = await handle(req('OPTIONS', ACCOUNT), env);
    expect(pre.status).toBe(204);
    expect(pre.headers.get('Access-Control-Allow-Methods')).toContain('PUT');
  });
});
