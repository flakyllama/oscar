# Oscar sync API

A zero-knowledge blob store that ships **with the app** as a Vercel Edge
Function. It holds one encrypted document per account, keyed by a
client-derived `accountId` and gated by a bearer token (of which it stores
only a SHA-256 hash). It never sees the encryption key or any journal
text — the body is opaque AES-GCM ciphertext produced on the client.

Because the API and the app share an origin, there is **no CORS to
configure** and no endpoint to enter: the client defaults to
`window.location.origin`.

## Layout

| File | Role |
| ---- | ---- |
| [`_lib/handler.ts`](_lib/handler.ts) | The HTTP contract, storage-agnostic and unit-tested |
| [`_lib/redisStore.ts`](_lib/redisStore.ts) | Upstash Redis backing store; the atomic compare-and-set |
| [`v1/doc/[accountId].ts`](v1/doc/[accountId].ts) | Vercel Edge Function entry point |
| [`handler.test.ts`](handler.test.ts) | 14 tests over the contract, using an in-memory store |

## API

| Method | Path | Notes |
| ------ | ---- | ----- |
| `GET` | `/v1/doc/:accountId` | `Authorization: Bearer <token>` → doc, or `404` |
| `PUT` | `/v1/doc/:accountId` | Body `{ blob, updatedAt }`; `If-Match: <version>` for optimistic concurrency |
| `DELETE` | `/v1/doc/:accountId` | Wipes the account |

An account is claimed by the first `PUT`; later requests must present the
same bearer token. `/api/v1/doc/:accountId` works too — [`vercel.json`](../vercel.json)
rewrites the clean path onto it.

## Storage

One Redis hash per account, `oscar:doc:<accountId>`, holding `authHash`,
`version`, `updatedAt` and `blob`.

Environment variables (the Upstash integration on Vercel sets the `KV_*`
pair automatically; a hand-made Upstash database gives you the
`UPSTASH_*` pair — either works):

```
KV_REST_API_URL / KV_REST_API_TOKEN
UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
```

## Security posture

- **Zero-knowledge.** The server stores `{ authHash, version, updatedAt,
  blob }`. The blob is AES-GCM ciphertext; the key is derived on the
  client from the master sync key and never sent.
- **Auth.** The bearer token is derived (via HKDF) independently of the
  encryption key, so holding the token's hash reveals nothing about the
  key. Comparison is constant-time.
- **Consistency.** Claim, auth check, version check and write happen in a
  single Lua script, so concurrent writers cannot lose an update — a
  genuine improvement over the read-then-write the Cloudflare KV version
  used to do.
- **Size.** Vercel caps Edge request bodies at 4 MB; the handler rejects
  over 3 MB with a `413`. Ample for a text journal — chunk per-day if you
  ever outgrow it.
- **Abuse.** For a public deployment, add rate limiting (Upstash
  publishes `@upstash/ratelimit`, which shares this Redis).

## Verifying a deployment

Unit tests cover the contract against an in-memory store; the Lua script
only runs against real Redis. After deploying, exercise the real thing:

```bash
node scripts/smoke-sync.mjs https://your-app.vercel.app
```

It creates a throwaway account, checks reads, auth rejection, the
optimistic-concurrency conflict, and cleans up after itself.
