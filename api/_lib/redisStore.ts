// Upstash Redis backing store for the sync API.
//
// The claim-or-update step runs as a Lua script so auth check, version
// check and write happen in one atomic operation server-side. (The
// Cloudflare KV version this replaces did a read-then-write, which could
// lose a concurrent update; Redis lets us close that window properly.)

import { Redis } from '@upstash/redis';
import type { DocStore, PutArgs, PutOutcome, StoredDoc } from './handler';

// The Vercel/Upstash marketplace integration sets KV_REST_API_*; a
// hand-made Upstash database sets UPSTASH_REDIS_REST_*. Accept either.
export function redisFromEnv(env: Record<string, string | undefined> = process.env): Redis {
  const url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
  const token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error(
      'Sync storage is not configured — set KV_REST_API_URL and KV_REST_API_TOKEN ' +
        '(added automatically by the Upstash integration on Vercel).',
    );
  }
  // Deterministic types: we serialize/deserialize explicitly.
  return new Redis({ url, token, automaticDeserialization: false });
}

const key = (accountId: string) => `oscar:doc:${accountId}`;

// Returns [status, version] — status 0 ok, 1 unauthorized, 2 conflict.
const PUT_SCRIPT = `
local k = KEYS[1]
local presented = ARGV[1]
local ifMatch = ARGV[2]
local blob = ARGV[3]
local updatedAt = ARGV[4]

if redis.call('EXISTS', k) == 0 then
  redis.call('HSET', k, 'authHash', presented, 'version', 1, 'updatedAt', updatedAt, 'blob', blob)
  return {0, 1}
end

if redis.call('HGET', k, 'authHash') ~= presented then
  return {1, 0}
end

local ver = tonumber(redis.call('HGET', k, 'version'))
if ifMatch ~= '' and ifMatch ~= '*' and tonumber(ifMatch) ~= ver then
  return {2, ver}
end

local nv = ver + 1
redis.call('HSET', k, 'version', nv, 'updatedAt', updatedAt, 'blob', blob)
return {0, nv}
`;

export function redisStore(redis: Redis): DocStore {
  return {
    async get(accountId: string): Promise<StoredDoc | null> {
      const h = await redis.hgetall<Record<string, string>>(key(accountId));
      if (!h || !h.authHash) return null;
      return {
        authHash: h.authHash,
        version: Number(h.version),
        updatedAt: Number(h.updatedAt),
        blob: h.blob ? JSON.parse(h.blob) : null,
      };
    },

    async put(accountId: string, args: PutArgs): Promise<PutOutcome> {
      const raw = (await redis.eval(
        PUT_SCRIPT,
        [key(accountId)],
        [args.presentedHash, args.ifMatch ?? '', JSON.stringify(args.blob), String(args.updatedAt)],
      )) as unknown;

      // Redis returns a 2-element integer array; coerce defensively in case
      // the REST layer hands them back as strings.
      if (!Array.isArray(raw) || raw.length < 2) {
        throw new Error('Unexpected response from sync storage.');
      }
      const status = Number(raw[0]);
      const version = Number(raw[1]);

      if (status === 1) return { status: 'unauthorized' };
      if (status === 2) return { status: 'conflict', version };
      return { status: 'ok', version };
    },

    async delete(accountId: string): Promise<void> {
      await redis.del(key(accountId));
    },
  };
}
