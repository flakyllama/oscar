// Oscar cloud sync — Cloudflare Worker over KV.
//
// Zero-knowledge blob store: it holds one encrypted document per account,
// keyed by a client-derived accountId and gated by a bearer auth token
// (of which it stores only a SHA-256 hash). It never sees the encryption
// key or any journal text — the body is opaque AES-GCM ciphertext.
//
//   GET    /v1/doc/:accountId   → { version, updatedAt, blob } | 404
//   PUT    /v1/doc/:accountId   → { version }   (If-Match for optimistic concurrency)
//   DELETE /v1/doc/:accountId   → 204
//
// See worker/README.md for deploy steps.

interface KV {
  get(key: string, type: 'json'): Promise<StoredDoc | null>;
  put(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface Env {
  OSCAR_KV: KV;
  ALLOWED_ORIGIN?: string; // comma-separated allowlist; omit to allow any
}

interface StoredDoc {
  authHash: string; // hex SHA-256 of the auth token
  version: number; // bumped every write; used for If-Match
  updatedAt: number; // client clock, informational
  blob: unknown; // opaque encrypted payload
}

const MAX_BODY = 8 * 1024 * 1024; // 8 MB guardrail

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

// Constant-time string compare (equal length hex).
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function corsHeaders(req: Request, env: Env): Record<string, string> {
  const origin = req.headers.get('Origin') || '';
  const allow = (env.ALLOWED_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean);
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

export async function handle(req: Request, env: Env): Promise<Response> {
  const cors = corsHeaders(req, env);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

  const url = new URL(req.url);
  const match = url.pathname.match(/^\/v1\/doc\/([^/]+)$/);
  if (!match) return json({ error: 'not found' }, 404, cors);
  const accountId = match[1];
  if (!ACCOUNT_RE.test(accountId)) return json({ error: 'bad account id' }, 400, cors);

  const token = bearer(req);
  if (!token) return json({ error: 'missing bearer token' }, 401, cors);
  const presentedHash = await sha256Hex(token);

  const existing = await env.OSCAR_KV.get(accountId, 'json');

  // Auth: an existing account must match its stored hash. A new account
  // is claimed by the first writer (PUT), so GET/DELETE on a missing
  // account is simply "empty".
  if (existing && !timingSafeEqual(existing.authHash, presentedHash)) {
    return json({ error: 'unauthorized' }, 401, cors);
  }

  if (req.method === 'GET') {
    if (!existing) return json({ error: 'not found' }, 404, cors);
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

    // Optimistic concurrency: If-Match must equal the current version.
    const ifMatch = req.headers.get('If-Match');
    if (existing && ifMatch != null && ifMatch !== '*' && ifMatch !== String(existing.version)) {
      return json({ error: 'version conflict', version: existing.version }, 412, {
        ...cors,
        ETag: String(existing.version),
      });
    }

    const version = (existing?.version ?? 0) + 1;
    const doc: StoredDoc = {
      authHash: existing?.authHash ?? presentedHash,
      version,
      updatedAt: typeof body.updatedAt === 'number' ? body.updatedAt : Date.now(),
      blob: body.blob,
    };
    await env.OSCAR_KV.put(accountId, JSON.stringify(doc));
    return json({ version }, 200, { ...cors, ETag: String(version) });
  }

  if (req.method === 'DELETE') {
    if (existing) await env.OSCAR_KV.delete(accountId);
    return json(null, 204, cors);
  }

  return json({ error: 'method not allowed' }, 405, cors);
}

export default {
  fetch(req: Request, env: Env): Promise<Response> {
    return handle(req, env);
  },
};
