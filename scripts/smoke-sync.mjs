#!/usr/bin/env node
// Post-deploy smoke test for the sync API.
//
//   node scripts/smoke-sync.mjs https://your-app.vercel.app
//
// Exercises the whole HTTP contract against the *real* deployment —
// including the atomic compare-and-set, which unit tests can only mock.
// Uses a throwaway random account and deletes it at the end.

const base = (process.argv[2] || '').replace(/\/$/, '');
if (!base) {
  console.error('Usage: node scripts/smoke-sync.mjs https://your-app.vercel.app');
  process.exit(2);
}

const hex = (n) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => b.toString(16).padStart(2, '0')).join('');
const account = hex(16); // 32 hex chars, matching the client's HKDF output
const token = 'smoke-' + hex(16);
const otherToken = 'smoke-' + hex(16);
const url = `${base}/v1/doc/${account}`;

let failures = 0;
function check(name, cond, detail = '') {
  if (cond) {
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
  } else {
    failures++;
    console.log(`  \x1b[31m✗\x1b[0m ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

const call = (method, { tok = token, body, ifMatch } = {}) =>
  fetch(url, {
    method,
    headers: {
      ...(tok ? { Authorization: 'Bearer ' + tok } : {}),
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(ifMatch ? { 'If-Match': ifMatch } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

console.log(`\nSmoke-testing ${url}\n`);

// 1. A fresh account reads as empty.
check('GET on a new account → 404', (await call('GET')).status === 404);

// 2. Missing credentials are refused.
check('GET without a token → 401', (await call('GET', { tok: null })).status === 401);

// 3. First write claims the account at version 1.
const created = await call('PUT', { body: { blob: { iv: 'aa', data: 'bb' }, updatedAt: Date.now() } });
const createdBody = await created.json().catch(() => ({}));
check('PUT creates the account at version 1', created.status === 200 && createdBody.version === 1,
  `got ${created.status} ${JSON.stringify(createdBody)}`);

// 4. Read it back intact.
const read = await call('GET');
const readBody = await read.json().catch(() => ({}));
check('GET returns the stored blob', read.status === 200 && readBody.blob?.data === 'bb',
  `got ${read.status} ${JSON.stringify(readBody)}`);
check('GET reports version 1', readBody.version === 1);

// 5. Another device's token must not read or write this account.
check('GET with a wrong token → 401', (await call('GET', { tok: otherToken })).status === 401);
check('PUT with a wrong token → 401', (await call('PUT', { tok: otherToken, body: { blob: 'x' } })).status === 401);

// 6. Optimistic concurrency: a stale writer is rejected, a current one wins.
const stale = await call('PUT', { body: { blob: 'stale' }, ifMatch: '0' });
const staleBody = await stale.json().catch(() => ({}));
check('stale If-Match → 412 with the current version', stale.status === 412 && staleBody.version === 1,
  `got ${stale.status} ${JSON.stringify(staleBody)}`);

const fresh = await call('PUT', { body: { blob: 'fresh' }, ifMatch: '1' });
const freshBody = await fresh.json().catch(() => ({}));
check('correct If-Match → 200 and version 2', fresh.status === 200 && freshBody.version === 2,
  `got ${fresh.status} ${JSON.stringify(freshBody)}`);

// 7. The server stores ciphertext opaquely — whatever we sent comes back.
const after = await (await call('GET')).json().catch(() => ({}));
check('the newer write is what persists', after.blob === 'fresh');

// 8. A wrong token cannot destroy the account.
await call('DELETE', { tok: otherToken });
check('DELETE with a wrong token leaves data intact', (await call('GET')).status === 200);

// 9. Clean up.
check('DELETE removes the account', (await call('DELETE')).status === 204);
check('GET after DELETE → 404', (await call('GET')).status === 404);

console.log(
  failures === 0
    ? '\n\x1b[32mAll checks passed — sync is live.\x1b[0m\n'
    : `\n\x1b[31m${failures} check(s) failed.\x1b[0m\n`,
);
process.exit(failures === 0 ? 0 : 1);
