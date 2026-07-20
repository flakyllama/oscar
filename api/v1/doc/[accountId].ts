// Vercel Edge Function: the sync endpoint.
//
// Runs on the Edge runtime so it uses the same Web-standard Request /
// Response / WebCrypto APIs the handler is written against. Routing is by
// pathname (the [accountId] segment just tells Vercel to route here).

import { handle } from '../../_lib/handler';
import { ConfigError, redisFromEnv, redisStore } from '../../_lib/redisStore';

export const config = { runtime: 'edge' };

// Upstream errors can echo back the command that failed — which for us
// includes the account's auth hash and the whole Lua script. Never pass
// those to the caller; log them and return something safe instead.
function safeMessage(err: unknown): string {
  if (err instanceof ConfigError) return err.message;
  const raw = err instanceof Error ? err.message : String(err);
  if (/WRONGPASS|NOPERM|unauthorized/i.test(raw)) {
    return 'Sync storage rejected the configured credentials — check the Redis REST token.';
  }
  return 'Sync storage is unavailable.';
}

export default async function handler(req: Request): Promise<Response> {
  try {
    return await handle(req, redisStore(redisFromEnv()), {
      allowedOrigin: process.env.ALLOWED_ORIGIN,
    });
  } catch (err) {
    // Full detail goes to the Vercel logs, never over the wire.
    console.error('sync api error', err);
    return new Response(JSON.stringify({ error: safeMessage(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
