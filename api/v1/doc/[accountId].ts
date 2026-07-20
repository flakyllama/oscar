// Vercel Edge Function: the sync endpoint.
//
// Runs on the Edge runtime so it uses the same Web-standard Request /
// Response / WebCrypto APIs the handler is written against. Routing is by
// pathname (the [accountId] segment just tells Vercel to route here).

import { handle } from '../../_lib/handler';
import { redisFromEnv, redisStore } from '../../_lib/redisStore';

export const config = { runtime: 'edge' };

export default async function handler(req: Request): Promise<Response> {
  try {
    return await handle(req, redisStore(redisFromEnv()), {
      allowedOrigin: process.env.ALLOWED_ORIGIN,
    });
  } catch (err) {
    // Misconfiguration (missing Upstash env vars) or a storage outage.
    const message = err instanceof Error ? err.message : 'Sync backend error.';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
