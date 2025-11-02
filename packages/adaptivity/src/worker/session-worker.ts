/**
 * Web Worker for background session management and signal syncing.
 * Handles:
 * - Session state updates
 * - Signal buffering and sync to backend
 * - Periodic session persistence
 * - Offline queue management
 */
import { expose } from "comlink";
import { SignalOutbox } from "./signal-outbox.js";
import type { Signal, SignalType } from "../signals.js";
import type { SessionSnapshot } from "../types.js";

export interface SessionWorkerAPI {
  init(): Promise<void>;
  updateSession(sessionSnapshot: Partial<SessionSnapshot>): Promise<void>;
  getSession(): Promise<SessionSnapshot | null>;
  logSignal(signal: Signal): Promise<void>;
  syncSignals(): Promise<{ synced: number; failed: number }>;
  getStats(): Promise<any>;
  clearOldData(olderThanMs: number): Promise<number>;
}

class SessionWorker implements SessionWorkerAPI {
  private outbox: SignalOutbox;
  private currentSession: SessionSnapshot | null = null;
  private syncInterval: number | null = null;
  private apiEndpoint: string = "/api/signals"; // Mock endpoint

  constructor() {
    this.outbox = new SignalOutbox();
  }

  async init(): Promise<void> {
    await this.outbox.init();
    
    // Start periodic sync every 5 seconds
    this.syncInterval = self.setInterval(() => {
      this.syncSignals().catch(err => {
        console.error("Background sync failed:", err);
      });
    }, 5000) as any;

    console.log("Session worker initialized");
  }

  async updateSession(sessionSnapshot: Partial<SessionSnapshot>): Promise<void> {
    if (!this.currentSession && sessionSnapshot.ids) {
      this.currentSession = sessionSnapshot as SessionSnapshot;
    } else if (this.currentSession) {
      this.currentSession = { ...this.currentSession, ...sessionSnapshot };
    }

    if (this.currentSession?.ids) {
      const sessionId = `${this.currentSession.ids.userId}_${this.currentSession.ids.lessonId}`;
      await this.outbox.saveSession(
        sessionId,
        this.currentSession.ids.userId,
        this.currentSession
      );
    }
  }

  async getSession(): Promise<SessionSnapshot | null> {
    return this.currentSession;
  }

  async logSignal(signal: Signal): Promise<void> {
    await this.outbox.addSignal(signal);
    
    // Log to console for debugging
    console.log(`[Signal] ${signal.type}:`, signal.payload);
  }

  async syncSignals(): Promise<{ synced: number; failed: number }> {
    const unsyncedSignals = await this.outbox.getUnsyncedSignals(50);
    
    if (unsyncedSignals.length === 0) {
      return { synced: 0, failed: 0 };
    }

    let synced = 0;
    let failed = 0;

    // Batch sync signals
    try {
      // Simulate API call (in production, this would be a real fetch)
      const response = await this.mockApiSync(unsyncedSignals);
      
      if (response.success) {
        await this.outbox.markSynced(unsyncedSignals.map(s => s.id));
        synced = unsyncedSignals.length;
        console.log(`Synced ${synced} signals to backend`);
      } else {
        failed = unsyncedSignals.length;
        // Increment sync attempts for failed signals
        for (const signal of unsyncedSignals) {
          await this.outbox.incrementSyncAttempt(signal.id);
        }
      }
    } catch (error) {
      console.error("Signal sync error:", error);
      failed = unsyncedSignals.length;
      
      // Increment sync attempts for failed signals
      for (const signal of unsyncedSignals) {
        await this.outbox.incrementSyncAttempt(signal.id);
      }
    }

    return { synced, failed };
  }

  private async mockApiSync(signals: Signal[]): Promise<{ success: boolean }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Mock successful sync (90% success rate for demo)
    const success = Math.random() > 0.1;
    
    if (success) {
      console.log(`[Mock API] Received ${signals.length} signals:`, signals);
    }
    
    return { success };
  }

  async getStats(): Promise<any> {
    const outboxStats = await this.outbox.getStats();
    
    return {
      session: this.currentSession ? {
        userId: this.currentSession.ids?.userId,
        lessonId: this.currentSession.ids?.lessonId,
        pageId: this.currentSession.ids?.pageId,
        accuracy: this.currentSession.metrics?.accEWMA,
        attempts: this.currentSession.metrics?.attempts,
      } : null,
      outbox: outboxStats,
    };
  }

  async clearOldData(olderThanMs: number): Promise<number> {
    return await this.outbox.clearOldSignals(olderThanMs);
  }

  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    this.outbox.close();
  }
}

// Expose worker API via Comlink
const worker = new SessionWorker();
expose(worker);

