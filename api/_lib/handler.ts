// Oscar cloud sync — HTTP contract, storage-agnostic.
//
// Zero-knowledge blob store: one encrypted document per account, keyed by
// a client-derived accountId and gated by a bearer auth token (of which
// only a SHA-256 hash is stored). It never sees the encryption key or any
// journal text — the body is opaque AES-GCM ciphertext.
//
//   GET    /v1/doc/:accountId   → { version, updatedAt, blob } | 404
//   PUT    /v1/doc/:accountId   → { version }   (If-Match for optimistic concurrency)
//   DELETE /v1/doc/:accountId   → 204
//
// The compare-and-set lives behind DocStore.put so the backing store can
// make it atomic (see redisStore.ts). This module only speaks HTTP.

export interface StoredDoc {
  authHash: string; // hex SHA-256 of the auth token
  version: number; // bumped every write; used for If-Match
  updatedAt: number; // client clock, informational
  blob: unknown; // opaque encrypted payload
}

/** Result of an attempted write. */
export type PutOutcome =
  | { status: 'ok'; version: number }
  | { status: 'unauthorized' }
  | { status: 'conflict'; version: number };

export interface PutArgs {
  presentedHash: string;
  ifMatch: string | null; // null when the header is absent; '*' matches any
  blob: unknown;
  updatedAt: number;
}

export interface DocStore {
  get(accountId: string): Promise<StoredDoc | null>;
  /**
   * Claim-or-update in one atomic step: creates the account when absent,
   * otherwise checks the auth hash and (when given) the If-Match version
   * before bumping. Implementations MUST NOT read-then-write racily.
   */
  put(accountId: string, args: PutArgs): Promise<PutOutcome>;
  delete(accountId: string): Promise<void>;
}

// Vercel caps Edge request bodies at 4 MB; stay under it with headroom.
// Plenty for a text journal — chunk per-day if you ever outgrow it.
export const MAX_BODY = 3 * 1024 * 1024;

export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

// Constant-time string compare (equal length hex).
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Same-origin needs no CORS; the allowlist exists for split deployments
// and local dev against a deployed API.
function corsHeaders(req: Request, allowedOrigin: string | undefined): Record<string, string> {
  const origin = req.headers.get('Origin') || '';
  const allow = (allowedOrigin || '').split(',').map((s) => s.trim()).filter(Boolean);
  const allowed = allow.length === 0 ? '*' : allow.includes(origin) ? origin : allow[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, If-Match',
    'Access-Control-Expose-Headers': 'ETag',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(body: unknown, status: number, headers: Record<string, string>): Response {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

function bearer(req: Request): string | null {
  const h = req.headers.get('Authorization') || '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
}

// Account IDs are 32 hex chars (16 bytes) from the client's HKDF.
const ACCOUNT_RE = /^[0-9a-f]{32}$/;

// Accepts both the public path (/v1/doc/:id) and the Vercel function path
// (/api/v1/doc/:id), so the rewrite is a convenience rather than a
// requirement.
const PATH_RE = /^(?:\/api)?\/v1\/doc\/([^/]+)\/?$/;

export async function handle(
  req: Request,
  store: DocStore,
  opts: { allowedOrigin?: string } = {},
): Promise<Response> {
  const cors = corsHeaders(req, opts.allowedOrigin);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

  const url = new URL(req.url);
  const match = url.pathname.match(PATH_RE);
  if (!match) return json({ error: 'not found' }, 404, cors);
  const accountId = match[1];
  if (!ACCOUNT_RE.test(accountId)) return json({ error: 'bad account id' }, 400, cors);

  const token = bearer(req);
  if (!token) return json({ error: 'missing bearer token' }, 401, cors);
  const presentedHash = await sha256Hex(token);

  if (req.method === 'GET') {
    const existing = await store.get(accountId);
    if (!existing) return json({ error: 'not found' }, 404, cors);
    if (!timingSafeEqual(existing.authHash, presentedHash)) {
      return json({ error: 'unauthorized' }, 401, cors);
    }
    return json(
      { version: existing.version, updatedAt: existing.updatedAt, blob: existing.blob },
      200,
      { ...cors, ETag: String(existing.version) },
    );
  }

  if (req.method === 'PUT') {
    const raw = await req.text();
    if (raw.length > MAX_BODY) return json({ error: 'payload too large' }, 413, cors);
    let body: { blob?: unknown; updatedAt?: number };
    try {
      body = JSON.parse(raw);
    } catch {
      return json({ error: 'invalid json' }, 400, cors);
    }
    if (body.blob === undefined) return json({ error: 'missing blob' }, 400, cors);

    // Auth + optimistic concurrency are resolved atomically by the store.
    const outcome = await store.put(accountId, {
      presentedHash,
      ifMatch: req.headers.get('If-Match'),
      blob: body.blob,
      updatedAt: typeof body.updatedAt === 'number' ? body.updatedAt : Date.now(),
    });

    if (outcome.status === 'unauthorized') return json({ error: 'unauthorized' }, 401, cors);
    if (outcome.status === 'conflict') {
      return json({ error: 'version conflict', version: outcome.version }, 412, {
        ...cors,
        ETag: String(outcome.version),
      });
    }
    return json({ version: outcome.version }, 200, { ...cors, ETag: String(outcome.version) });
  }

  if (req.method === 'DELETE') {
    const existing = await store.get(accountId);
    if (existing) {
      if (!timingSafeEqual(existing.authHash, presentedHash)) {
        return json({ error: 'unauthorized' }, 401, cors);
      }
      await store.delete(accountId);
    }
    return json(null, 204, cors);
  }

  return json({ error: 'method not allowed' }, 405, cors);
}
