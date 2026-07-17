# Oscar sync worker

A zero-knowledge blob store on Cloudflare Workers + KV. It holds one
encrypted document per account, keyed by a client-derived `accountId` and
gated by a bearer token (of which it stores only a SHA-256 hash). It
never sees the encryption key or any journal text — the body is opaque
AES-GCM ciphertext produced on the client. See [`src/index.ts`](src/index.ts).

## API

| Method | Path                 | Notes                                            |
| ------ | -------------------- | ------------------------------------------------ |
| `GET`  | `/v1/doc/:accountId` | `Authorization: Bearer <token>` → doc, or `404`  |
| `PUT`  | `/v1/doc/:accountId` | Body `{ blob, updatedAt }`; `If-Match: <version>` for optimistic concurrency |
| `DELETE` | `/v1/doc/:accountId` | Wipes the account                              |

An account is claimed by the first `PUT`; later requests must present the
same bearer token (matched against the stored hash).

## Deploy

```bash
cd worker
npm install                                   # installs wrangler
npx wrangler login

# Create the KV namespace and paste the printed id into wrangler.toml
npx wrangler kv namespace create OSCAR_KV

# (optional) lock CORS to your app origin in wrangler.toml:
#   [vars]  ALLOWED_ORIGIN = "https://your-oscar.app"

npx wrangler deploy                           # prints https://oscar-sync.<you>.workers.dev
```

Then point the app at it — either bake the URL in at build time:

```bash
VITE_SYNC_ENDPOINT=https://oscar-sync.<you>.workers.dev npm run build
```

or leave it unset and paste the URL into the Sync panel in Settings.

### Local development

```bash
npx wrangler dev        # http://localhost:8787
```

## Security posture

- **Zero-knowledge.** The server stores `{ authHash, version, updatedAt,
  blob }`. The blob is AES-GCM ciphertext; the key is derived on the
  client from the master sync key and never sent. Even with the stored
  data, the server cannot read journals.
- **Auth.** The bearer token is derived (via HKDF) independently of the
  encryption key, so holding the token's hash reveals nothing about the
  key.
- **Consistency.** KV is eventually consistent and read-modify-write is
  not atomic, so two devices writing the *same instant* can still race
  past the `If-Match` guard. The client's merge engine re-merges on the
  next sync and surfaces genuine conflicts, so nothing is lost — but for
  strict ordering, swap KV for a Durable Object per account.
- **Abuse.** For a public deployment add rate limiting (e.g. Cloudflare
  WAF / a Durable Object token bucket) and consider a max account count;
  the Worker itself is stateless beyond KV.
- **Size.** The whole document is written each sync. Fine for a text
  journal (KV values cap at 25 MB); chunk per-day if you ever outgrow it.
