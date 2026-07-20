import { describe, it, expect, beforeEach } from 'vitest';
import { handle, type DocStore, type PutArgs, type PutOutcome, type StoredDoc } from './_lib/handler';

// In-memory DocStore mirroring the semantics the Lua script implements in
// redisStore.ts: claim-on-first-write, auth check, then If-Match check.
function memStore(): DocStore {
  const docs = new Map<string, StoredDoc>();
  return {
    async get(id: string) {
      return docs.get(id) ?? null;
    },
    async put(id: string, a: PutArgs): Promise<PutOutcome> {
      const cur = docs.get(id);
      if (!cur) {
        docs.set(id, { authHash: a.presentedHash, version: 1, updatedAt: a.updatedAt, blob: a.blob });
        return { status: 'ok', version: 1 };
      }
      if (cur.authHash !== a.presentedHash) return { status: 'unauthorized' };
      if (a.ifMatch != null && a.ifMatch !== '' && a.ifMatch !== '*' && Number(a.ifMatch) !== cur.version) {
        return { status: 'conflict', version: cur.version };
      }
      const version = cur.version + 1;
      docs.set(id, { ...cur, version, updatedAt: a.updatedAt, blob: a.blob });
      return { status: 'ok', version };
    },
    async delete(id: string) {
      docs.delete(id);
    },
  };
}

const ACCOUNT = 'a'.repeat(32);
const TOKEN = 'auth-token-abc';
const OTHER_TOKEN = 'auth-token-xyz';

function req(
  method: string,
  account: string,
  opts: { token?: string; body?: unknown; ifMatch?: string; path?: string } = {},
) {
  const headers: Record<string, string> = { Origin: 'https://oscar.app' };
  if (opts.token) headers.Authorization = 'Bearer ' + opts.token;
  if (opts.ifMatch) headers['If-Match'] = opts.ifMatch;
  const path = opts.path ?? '/v1/doc/';
  return new Request('https://oscar.test' + path + account, {
    method,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
}

describe('sync API handler', () => {
  let store: DocStore;
  beforeEach(() => {
    store = memStore();
  });

  it('PUT creates an account and GET reads it back', async () => {
    const put = await handle(req('PUT', ACCOUNT, { token: TOKEN, body: { blob: { iv: 'x', data: 'y' }, updatedAt: 5 } }), store);
    expect(put.status).toBe(200);
    expect((await put.json()).version).toBe(1);

    const get = await handle(req('GET', ACCOUNT, { token: TOKEN }), store);
    expect(get.status).toBe(200);
    const body = await get.json();
    expect(body.blob).toEqual({ iv: 'x', data: 'y' });
    expect(body.version).toBe(1);
    expect(get.headers.get('ETag')).toBe('1');
  });

  it('GET on a missing account is 404 (treated as empty by the client)', async () => {
    const get = await handle(req('GET', ACCOUNT, { token: TOKEN }), store);
    expect(get.status).toBe(404);
  });

  it('rejects a wrong auth token on an existing account', async () => {
    await handle(req('PUT', ACCOUNT, { token: TOKEN, body: { blob: 1 } }), store);
    const get = await handle(req('GET', ACCOUNT, { token: OTHER_TOKEN }), store);
    expect(get.status).toBe(401);
    const put = await handle(req('PUT', ACCOUNT, { token: OTHER_TOKEN, body: { blob: 2 } }), store);
    expect(put.status).toBe(401);
    const del = await handle(req('DELETE', ACCOUNT, { token: OTHER_TOKEN }), store);
    expect(del.status).toBe(401);
  });

  it('a wrong token cannot destroy an existing account', async () => {
    await handle(req('PUT', ACCOUNT, { token: TOKEN, body: { blob: 'mine' } }), store);
    await handle(req('DELETE', ACCOUNT, { token: OTHER_TOKEN }), store);
    const get = await handle(req('GET', ACCOUNT, { token: TOKEN }), store);
    expect(get.status).toBe(200);
    expect((await get.json()).blob).toBe('mine');
  });

  it('requires a bearer token', async () => {
    const get = await handle(req('GET', ACCOUNT), store);
    expect(get.status).toBe(401);
  });

  it('bumps version on each write', async () => {
    await handle(req('PUT', ACCOUNT, { token: TOKEN, body: { blob: 'a' } }), store);
    const p2 = await handle(req('PUT', ACCOUNT, { token: TOKEN, body: { blob: 'b' } }), store);
    expect((await p2.json()).version).toBe(2);
  });

  it('enforces If-Match (optimistic concurrency)', async () => {
    await handle(req('PUT', ACCOUNT, { token: TOKEN, body: { blob: 'a' } }), store); // version 1
    const stale = await handle(req('PUT', ACCOUNT, { token: TOKEN, body: { blob: 'b' }, ifMatch: '0' }), store);
    expect(stale.status).toBe(412);
    expect((await stale.json()).version).toBe(1);

    const ok = await handle(req('PUT', ACCOUNT, { token: TOKEN, body: { blob: 'b' }, ifMatch: '1' }), store);
    expect(ok.status).toBe(200);
    expect((await ok.json()).version).toBe(2);
  });

  it('If-Match: * always matches', async () => {
    await handle(req('PUT', ACCOUNT, { token: TOKEN, body: { blob: 'a' } }), store);
    const ok = await handle(req('PUT', ACCOUNT, { token: TOKEN, body: { blob: 'b' }, ifMatch: '*' }), store);
    expect(ok.status).toBe(200);
    expect((await ok.json()).version).toBe(2);
  });

  it('DELETE removes the account', async () => {
    await handle(req('PUT', ACCOUNT, { token: TOKEN, body: { blob: 'a' } }), store);
    const del = await handle(req('DELETE', ACCOUNT, { token: TOKEN }), store);
    expect(del.status).toBe(204);
    const get = await handle(req('GET', ACCOUNT, { token: TOKEN }), store);
    expect(get.status).toBe(404);
  });

  it('validates the account id shape', async () => {
    const bad = await handle(req('GET', 'not-hex', { token: TOKEN }), store);
    expect(bad.status).toBe(400);
  });

  it('rejects malformed JSON and a missing blob', async () => {
    const bad = new Request('https://oscar.test/v1/doc/' + ACCOUNT, {
      method: 'PUT',
      headers: { Authorization: 'Bearer ' + TOKEN },
      body: 'not json',
    });
    expect((await handle(bad, store)).status).toBe(400);

    const noBlob = await handle(req('PUT', ACCOUNT, { token: TOKEN, body: { updatedAt: 1 } }), store);
    expect(noBlob.status).toBe(400);
  });

  it('serves the same route under the /api prefix (unrewritten path)', async () => {
    const put = await handle(req('PUT', ACCOUNT, { token: TOKEN, body: { blob: 'a' }, path: '/api/v1/doc/' }), store);
    expect(put.status).toBe(200);
    const get = await handle(req('GET', ACCOUNT, { token: TOKEN, path: '/api/v1/doc/' }), store);
    expect(get.status).toBe(200);
  });

  it('answers CORS preflight, and echoes an allowlisted origin', async () => {
    const pre = await handle(req('OPTIONS', ACCOUNT), store);
    expect(pre.status).toBe(204);
    expect(pre.headers.get('Access-Control-Allow-Methods')).toContain('PUT');

    const scoped = await handle(req('OPTIONS', ACCOUNT), store, { allowedOrigin: 'https://oscar.app' });
    expect(scoped.headers.get('Access-Control-Allow-Origin')).toBe('https://oscar.app');

    const denied = await handle(req('OPTIONS', ACCOUNT), store, { allowedOrigin: 'https://other.app' });
    expect(denied.headers.get('Access-Control-Allow-Origin')).toBe('https://other.app');
  });

  it('rejects an unknown method and an unknown path', async () => {
    expect((await handle(req('PATCH', ACCOUNT, { token: TOKEN }), store)).status).toBe(405);
    const nope = new Request('https://oscar.test/nope', { headers: { Authorization: 'Bearer ' + TOKEN } });
    expect((await handle(nope, store)).status).toBe(404);
  });
});
