// Cloud backend: the zero-knowledge Worker (worker/). The client derives
// its identity from the master sync key, encrypts the document with the
// derived key, and stores it as an opaque blob keyed by accountId. The
// server never sees plaintext or the encryption key.

import type { SyncSide } from './merge';
import {
  type SyncTarget,
  type SyncPull,
  VersionConflictError,
  idbGet,
  idbSet,
} from './target';
import {
  type SyncIdentity,
  deriveIdentity,
  encodeSyncKey,
  decodeSyncKey,
  generateMasterKey,
  sealWithKey,
  openWithKey,
  type SealedBlob,
} from './identity';

interface CloudConfig {
  masterKeyB64: string;
  endpoint: string;
}

// Build-time default endpoint (your deployed Worker); overridable at
// connect time so self-hosters can point at their own.
export const DEFAULT_ENDPOINT: string =
  (import.meta.env.VITE_SYNC_ENDPOINT as string | undefined)?.replace(/\/$/, '') || '';

function b64(bytes: Uint8Array): string {
  let s = '';
  bytes.forEach((x) => (s += String.fromCharCode(x)));
  return btoa(s);
}
function unb64(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export class CloudSyncTarget implements SyncTarget {
  readonly kind = 'cloud' as const;

  private constructor(
    private identity: SyncIdentity,
    private endpoint: string,
    private master: Uint8Array,
  ) {}

  label(): string {
    try {
      return new URL(this.endpoint).host;
    } catch {
      return 'cloud';
    }
  }

  // The key to copy to another device.
  syncKey(): string {
    return encodeSyncKey(this.master);
  }

  private static async build(master: Uint8Array, endpoint: string): Promise<CloudSyncTarget> {
    const identity = await deriveIdentity(master);
    return new CloudSyncTarget(identity, endpoint.replace(/\/$/, ''), master);
  }

  static async restore(): Promise<CloudSyncTarget | null> {
    const cfg = await idbGet<CloudConfig>('cloud');
    if (!cfg) return null;
    return CloudSyncTarget.build(unb64(cfg.masterKeyB64), cfg.endpoint);
  }

  // Start a fresh account (new random key).
  static async createNew(endpoint: string): Promise<CloudSyncTarget> {
    const master = generateMasterKey();
    await idbSet('cloud', { masterKeyB64: b64(master), endpoint } satisfies CloudConfig);
    return CloudSyncTarget.build(master, endpoint);
  }

  // Join an existing account from a pasted sync key.
  static async connectWithKey(syncKey: string, endpoint: string): Promise<CloudSyncTarget> {
    const master = decodeSyncKey(syncKey);
    if (!master) throw new Error('That sync key looks wrong — check for typos.');
    await idbSet('cloud', { masterKeyB64: b64(master), endpoint } satisfies CloudConfig);
    return CloudSyncTarget.build(master, endpoint);
  }

  async ensureAccess(): Promise<'granted' | 'needs-permission' | 'error'> {
    return this.endpoint ? 'granted' : 'error';
  }

  private url(): string {
    return `${this.endpoint}/v1/doc/${this.identity.accountId}`;
  }

  private authHeaders(extra: Record<string, string> = {}): Record<string, string> {
    return { Authorization: 'Bearer ' + this.identity.authToken, ...extra };
  }

  async pull(): Promise<SyncPull> {
    const res = await fetch(this.url(), { headers: this.authHeaders() });
    if (res.status === 404) return { side: null, version: 0 };
    if (res.status === 401) throw new Error('The server rejected this sync key.');
    if (!res.ok) throw new Error(`Sync read failed (${res.status}).`);
    const body = (await res.json()) as { version: number; blob: SealedBlob };
    const side = await openWithKey<SyncSide>(body.blob, this.identity.encKey);
    return { side, version: body.version };
  }

  async push(side: SyncSide, expectedVersion: string | number): Promise<number> {
    const blob = await sealWithKey(side, this.identity.encKey);
    const res = await fetch(this.url(), {
      method: 'PUT',
      headers: this.authHeaders({ 'Content-Type': 'application/json', 'If-Match': String(expectedVersion) }),
      body: JSON.stringify({ blob, updatedAt: Date.now() }),
    });
    if (res.status === 412) {
      const body = (await res.json()) as { version: number };
      throw new VersionConflictError(body.version);
    }
    if (res.status === 401) throw new Error('The server rejected this sync key.');
    if (res.status === 413) throw new Error('Journal is too large for the sync server.');
    if (!res.ok) throw new Error(`Sync write failed (${res.status}).`);
    return ((await res.json()) as { version: number }).version;
  }

  async remoteToken(): Promise<number> {
    // The doc is small; a GET returning the version is a fine change
    // probe for a personal journal (add a HEAD route to optimize later).
    const res = await fetch(this.url(), { headers: this.authHeaders() });
    if (res.status === 404) return 0;
    if (!res.ok) throw new Error(`Sync probe failed (${res.status}).`);
    return ((await res.json()) as { version: number }).version;
  }

  async teardown(): Promise<void> {
    await idbSet('cloud', undefined);
  }
}
