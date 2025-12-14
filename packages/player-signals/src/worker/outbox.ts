/**
 * @package @amit/player-signals/worker
 * IndexedDB-backed signal outbox
 */

import { openDB, type IDBPDatabase } from 'idb';
import type { Signal } from '../types.js';

const DB_NAME = 'player-signals-outbox';
const DB_VERSION = 1;
const SIGNAL_STORE = 'signals';

interface OutboxDB {
  signals: {
    key: string;
    value: Signal & { id: string; synced: boolean; syncAttempts: number };
    indexes: {
      'by-synced': boolean;
      'by-timestamp': number;
    };
  };
}

export class SignalOutbox {
  private db: IDBPDatabase<OutboxDB> | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      this.db = await openDB<OutboxDB>(DB_NAME, DB_VERSION, {
        upgrade(db: IDBPDatabase<OutboxDB>) {
          if (!db.objectStoreNames.contains(SIGNAL_STORE)) {
            const store = db.createObjectStore(SIGNAL_STORE, { keyPath: 'id' });
            store.createIndex('by-synced', 'synced');
            store.createIndex('by-timestamp', 'meta.ts');
          }
        },
      });
    })();

    return this.initPromise;
  }

  async addSignal(signal: Signal): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('DB not initialized');

    // Generate unique ID if not present
    const signalId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${signal.type}`;
    const signalWithId = {
      ...signal,
      id: signalId,
      synced: false,
      syncAttempts: 0,
    };

    // Use put instead of add to handle duplicates gracefully
    await this.db.put(SIGNAL_STORE, signalWithId);
  }

  async getUnsyncedSignals(limit = 50): Promise<Signal[]> {
    await this.init();
    if (!this.db) throw new Error('DB not initialized');

    const index = this.db.transaction(SIGNAL_STORE).store.index('by-synced');
    const signals = await index.getAll(IDBKeyRange.only(false), limit);
    return signals;
  }

  async markSynced(signalIds: string[]): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('DB not initialized');

    const tx = this.db.transaction(SIGNAL_STORE, 'readwrite');
    await Promise.all([
      ...signalIds.map(async (id) => {
        const signal = await tx.store.get(id);
        if (signal) {
          signal.synced = true;
          await tx.store.put(signal);
        }
      }),
      tx.done,
    ]);
  }
}

