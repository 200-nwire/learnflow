/**
 * Web Worker for background session management.
 * Handles:
 * - Session state updates
 * - Periodic session persistence
 * 
 * Note: Signal/telemetry logic has been moved to @amit/telemetry package
 */
import { expose } from "comlink";
import { openDB } from "idb";
import type { SessionSnapshot } from "../types.js";

const DB_NAME = "adaptivity-session";
const DB_VERSION = 1;
const SESSION_STORE = "sessions";

export interface SessionWorkerAPI {
  init(): Promise<void>;
  updateSession(sessionSnapshot: Partial<SessionSnapshot>): Promise<void>;
  getSession(): Promise<SessionSnapshot | null>;
  getStats(): Promise<any>;
  clearOldData(olderThanMs: number): Promise<number>;
}

class SessionWorker implements SessionWorkerAPI {
  private db: any = null;
  private currentSession: SessionSnapshot | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    
    this.initPromise = (async () => {
      this.db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(SESSION_STORE)) {
            db.createObjectStore(SESSION_STORE, { keyPath: "sessionId" });
          }
        },
      });
    })();

    return this.initPromise;
  }


  async updateSession(sessionSnapshot: Partial<SessionSnapshot>): Promise<void> {
    await this.init();
    
    if (!this.currentSession && sessionSnapshot.ids) {
      this.currentSession = sessionSnapshot as SessionSnapshot;
    } else if (this.currentSession) {
      this.currentSession = { ...this.currentSession, ...sessionSnapshot };
    }

    if (this.currentSession?.ids && this.db) {
      const sessionId = `${this.currentSession.ids.userId}_${this.currentSession.ids.lessonId}`;
      await this.db.put(SESSION_STORE, {
        sessionId,
        userId: this.currentSession.ids.userId,
        data: this.currentSession,
        lastUpdated: Date.now(),
      });
    }
  }

  async getSession(): Promise<SessionSnapshot | null> {
    return this.currentSession;
  }

  async getStats(): Promise<any> {
    await this.init();
    
    return {
      session: this.currentSession ? {
        userId: this.currentSession.ids?.userId,
        lessonId: this.currentSession.ids?.lessonId,
        pageId: this.currentSession.ids?.pageId,
        accuracy: this.currentSession.metrics?.accEWMA,
        attempts: this.currentSession.metrics?.attempts,
      } : null,
    };
  }

  async clearOldData(olderThanMs: number): Promise<number> {
    await this.init();
    if (!this.db) return 0;
    
    const cutoff = Date.now() - olderThanMs;
    const sessions = await this.db.getAll(SESSION_STORE);
    const toDelete = sessions.filter((s: any) => s.lastUpdated < cutoff);
    
    const tx = this.db.transaction(SESSION_STORE, "readwrite");
    await Promise.all([
      ...toDelete.map((s: any) => tx.store.delete(s.sessionId)),
      tx.done,
    ]);
    
    return toDelete.length;
  }
}

// Expose worker API via Comlink
const worker = new SessionWorker();
expose(worker as any);

