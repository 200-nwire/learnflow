/**
 * IndexedDB-backed signal outbox for reliable offline-first signal storage and sync.
 */
import { openDB, type IDBPDatabase } from "idb";
import type { Signal } from "../signals.js";

const DB_NAME = "adaptivity-signals";
const DB_VERSION = 1;
const SIGNAL_STORE = "signals";
const SESSION_STORE = "sessions";

export interface OutboxDB {
  signals: {
    key: string;
    value: Signal;
    indexes: {
      "by-synced": boolean;
      "by-timestamp": number;
      "by-user": string;
    };
  };
  sessions: {
    key: string;
    value: {
      sessionId: string;
      userId: string;
      data: any;
      lastUpdated: number;
    };
  };
}

/**
 * Signal outbox with IndexedDB persistence
 */
export class SignalOutbox {
  private db: IDBPDatabase<OutboxDB> | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    
    this.initPromise = (async () => {
      this.db = await openDB<OutboxDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
          // Signals store
          if (!db.objectStoreNames.contains(SIGNAL_STORE)) {
            const signalStore = db.createObjectStore(SIGNAL_STORE, { keyPath: "id" });
            signalStore.createIndex("by-synced", "synced");
            signalStore.createIndex("by-timestamp", "timestamp");
            signalStore.createIndex("by-user", "sessionIds.userId");
          }

          // Sessions store
          if (!db.objectStoreNames.contains(SESSION_STORE)) {
            db.createObjectStore(SESSION_STORE, { keyPath: "sessionId" });
          }
        },
      });
    })();

    return this.initPromise;
  }

  async addSignal(signal: Signal): Promise<void> {
    await this.init();
    if (!this.db) throw new Error("DB not initialized");
    await this.db.add(SIGNAL_STORE, signal);
  }

  async addSignals(signals: Signal[]): Promise<void> {
    await this.init();
    if (!this.db) throw new Error("DB not initialized");
    const tx = this.db.transaction(SIGNAL_STORE, "readwrite");
    await Promise.all([
      ...signals.map(signal => tx.store.add(signal)),
      tx.done,
    ]);
  }

  async getUnsyncedSignals(limit = 50): Promise<Signal[]> {
    await this.init();
    if (!this.db) throw new Error("DB not initialized");
    
    const index = this.db.transaction(SIGNAL_STORE).store.index("by-synced");
    const signals = await index.getAll(IDBKeyRange.only(false), limit);
    return signals;
  }

  async getAllSignals(): Promise<Signal[]> {
    await this.init();
    if (!this.db) throw new Error("DB not initialized");
    return await this.db.getAll(SIGNAL_STORE);
  }

  async markSynced(signalIds: string[]): Promise<void> {
    await this.init();
    if (!this.db) throw new Error("DB not initialized");
    
    const tx = this.db.transaction(SIGNAL_STORE, "readwrite");
    await Promise.all([
      ...signalIds.map(async id => {
        const signal = await tx.store.get(id);
        if (signal) {
          signal.synced = true;
          await tx.store.put(signal);
        }
      }),
      tx.done,
    ]);
  }

  async incrementSyncAttempt(signalId: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error("DB not initialized");
    
    const signal = await this.db.get(SIGNAL_STORE, signalId);
    if (signal) {
      signal.syncAttempts++;
      await this.db.put(SIGNAL_STORE, signal);
    }
  }

  async deleteSignal(signalId: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error("DB not initialized");
    await this.db.delete(SIGNAL_STORE, signalId);
  }

  async clearOldSignals(olderThanMs: number): Promise<number> {
    await this.init();
    if (!this.db) throw new Error("DB not initialized");
    
    const cutoff = Date.now() - olderThanMs;
    const signals = await this.db.getAll(SIGNAL_STORE);
    const toDelete = signals.filter(s => s.synced && s.timestamp < cutoff);
    
    const tx = this.db.transaction(SIGNAL_STORE, "readwrite");
    await Promise.all([
      ...toDelete.map(s => tx.store.delete(s.id)),
      tx.done,
    ]);
    
    return toDelete.length;
  }

  async getStats() {
    await this.init();
    if (!this.db) throw new Error("DB not initialized");
    
    const signals = await this.db.getAll(SIGNAL_STORE);
    const unsynced = signals.filter(s => !s.synced);
    
    return {
      total: signals.length,
      synced: signals.filter(s => s.synced).length,
      unsynced: unsynced.length,
      oldestUnsynced: unsynced.length > 0 
        ? Math.min(...unsynced.map(s => s.timestamp))
        : null,
      byType: signals.reduce((acc, s) => {
        acc[s.type] = (acc[s.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  async saveSession(sessionId: string, userId: string, data: any): Promise<void> {
    await this.init();
    if (!this.db) throw new Error("DB not initialized");
    
    await this.db.put(SESSION_STORE, {
      sessionId,
      userId,
      data,
      lastUpdated: Date.now(),
    });
  }

  async getSession(sessionId: string) {
    await this.init();
    if (!this.db) throw new Error("DB not initialized");
    return await this.db.get(SESSION_STORE, sessionId);
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
    }
  }
}

