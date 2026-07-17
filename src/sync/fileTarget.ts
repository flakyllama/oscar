// File System Access backend: syncs to a user-owned JSON file (drop it
// in an iCloud/Dropbox/Drive folder for multi-device). Encryption is the
// app's optional passcode (store.sealForSync); the file is plaintext
// when no passcode is set.

import { getStore } from '../data/store';
import type { SyncSide } from './merge';
import { type SyncTarget, type SyncPull, idbGet, idbSet } from './target';

export interface FSFileHandle {
  readonly name: string;
  getFile(): Promise<File>;
  createWritable(): Promise<{ write(data: string): Promise<void>; close(): Promise<void> }>;
  queryPermission(opts: { mode: 'readwrite' }): Promise<PermissionState>;
  requestPermission(opts: { mode: 'readwrite' }): Promise<PermissionState>;
}

declare global {
  interface Window {
    showSaveFilePicker?: (opts?: unknown) => Promise<FSFileHandle>;
    showOpenFilePicker?: (opts?: unknown) => Promise<FSFileHandle[]>;
  }
}

interface SyncDocOnDisk {
  app: 'oscar-sync';
  version: 1;
  updatedAt: number;
  deviceId: string;
  payload: unknown; // SyncSide, AES-GCM-sealed when a passcode is set
}

export function fileSyncSupported(): boolean {
  return typeof window !== 'undefined' && !!window.showSaveFilePicker;
}

export class FileSyncTarget implements SyncTarget {
  readonly kind = 'file' as const;
  private askedThisGesture = false;

  constructor(private handle: FSFileHandle) {}

  label(): string {
    return this.handle.name;
  }

  static async restore(): Promise<FileSyncTarget | null> {
    const handle = await idbGet<FSFileHandle>('file');
    return handle ? new FileSyncTarget(handle) : null;
  }

  static async createNew(): Promise<FileSyncTarget | null> {
    if (!window.showSaveFilePicker) return null;
    const handle = await window.showSaveFilePicker({
      suggestedName: 'oscar-sync.json',
      types: [{ description: 'Oscar sync file', accept: { 'application/json': ['.json'] } }],
    });
    await idbSet('file', handle);
    return new FileSyncTarget(handle);
  }

  static async openExisting(): Promise<FileSyncTarget | null> {
    if (!window.showOpenFilePicker) return null;
    const [handle] = await window.showOpenFilePicker({
      types: [{ description: 'Oscar sync file', accept: { 'application/json': ['.json'] } }],
    });
    await idbSet('file', handle);
    return new FileSyncTarget(handle);
  }

  async ensureAccess(): Promise<'granted' | 'needs-permission' | 'error'> {
    try {
      if ((await this.handle.queryPermission({ mode: 'readwrite' })) === 'granted') return 'granted';
      // requestPermission only resolves inside a user gesture; the engine
      // calls this from a button (reconnect) as well as on load.
      if (!this.askedThisGesture) {
        this.askedThisGesture = true;
        if ((await this.handle.requestPermission({ mode: 'readwrite' })) === 'granted') return 'granted';
      }
      return 'needs-permission';
    } catch {
      return 'error';
    }
  }

  async pull(): Promise<SyncPull> {
    const file = await this.handle.getFile();
    const text = await file.text();
    if (!text.trim()) return { side: null, version: file.lastModified };
    const doc = JSON.parse(text) as SyncDocOnDisk;
    if (doc.app !== 'oscar-sync') throw new Error('That file is not an Oscar sync file.');
    const side = await getStore().openFromSync<SyncSide>(doc.payload);
    return { side, version: file.lastModified };
  }

  async push(side: SyncSide): Promise<number> {
    const store = getStore();
    const doc: SyncDocOnDisk = {
      app: 'oscar-sync',
      version: 1,
      updatedAt: Date.now(),
      deviceId: store.deviceId(),
      payload: await store.sealForSync(side),
    };
    const writable = await this.handle.createWritable();
    await writable.write(JSON.stringify(doc, null, 2));
    await writable.close();
    return (await this.handle.getFile()).lastModified;
  }

  async remoteToken(): Promise<number> {
    return (await this.handle.getFile()).lastModified;
  }

  async teardown(): Promise<void> {
    await idbSet('file', undefined);
  }
}
