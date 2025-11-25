/**
 * Telemetry Worker
 * Handles background processing of signals and xAPI statement generation/sending
 */

import { expose } from "comlink";
import { openDB, type IDBPDatabase } from "idb";
import type { TelemetrySignal } from "../types.js";
// Import from adaptivity package
// Note: In production, these will be resolved from the built package
import { xAPIStatementConverter } from "@amit/adaptivity/xapi";
import { LRSClientXAPI } from "@amit/adaptivity/xapi";
import type { SessionSnapshot } from "@amit/adaptivity";
import { loadLRSConfig, saveLRSConfig, type StoredLRSConfig } from "@amit/adaptivity/xapi";

const DB_NAME = "telemetry-signals";
const DB_VERSION = 2; // Incremented to add config store
const SIGNAL_STORE = "signals";
const XAPI_STORE = "xapi_statements";
const CONFIG_STORE = "config";

interface TelemetryDB {
  signals: {
    key: string;
    value: TelemetrySignal & {
      synced: boolean;
      syncAttempts: number;
    };
    indexes: {
      "by-synced": boolean;
      "by-timestamp": number;
    };
  };
  xapi_statements: {
    key: string;
    value: {
      id: string;
      statement: any;
      signalId: string;
      synced: boolean;
      syncAttempts: number;
      timestamp: number;
    };
    indexes: {
      "by-synced": boolean;
      "by-timestamp": number;
    };
  };
  config: {
    key: string;
    value: {
      key: string;
      value: any;
    };
  };
}

export interface TelemetryWorkerAPI {
  init(): Promise<void>;
  processSignals(signals: TelemetrySignal[]): Promise<void>;
  updateSession(session: SessionSnapshot): Promise<void>;
  syncXAPIStatements(): Promise<{ synced: number; failed: number }>;
  getStats(): Promise<any>;
  configureLRS(config: Partial<StoredLRSConfig>): Promise<void>;
  testLRSConnection(): Promise<{ success: boolean; error?: string }>;
}

class TelemetryWorker implements TelemetryWorkerAPI {
  private db: IDBPDatabase<TelemetryDB> | null = null;
  private xapiConverter: xAPIStatementConverter;
  private lrsClient: LRSClientXAPI | null = null;
  private lrsConfig: any = null;
  private currentSession: SessionSnapshot | null = null;
  private syncInterval: number | null = null;

  constructor() {
    this.xapiConverter = new xAPIStatementConverter();
  }

  async init(): Promise<void> {
    this.db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (!db.objectStoreNames.contains(SIGNAL_STORE)) {
          const signalStore = db.createObjectStore(SIGNAL_STORE, { keyPath: "id" });
          signalStore.createIndex("by-synced", "synced");
          signalStore.createIndex("by-timestamp", "timestamp");
        }

        if (!db.objectStoreNames.contains(XAPI_STORE)) {
          const xapiStore = db.createObjectStore(XAPI_STORE, { keyPath: "id" });
          xapiStore.createIndex("by-synced", "synced");
          xapiStore.createIndex("by-timestamp", "timestamp");
        }

        if (oldVersion < 2 && !db.objectStoreNames.contains(CONFIG_STORE)) {
          db.createObjectStore(CONFIG_STORE, { keyPath: "key" });
        }
      },
    });

    // Load LRS config from IndexedDB (workers can't use localStorage)
    try {
      if (this.db) {
        const configRecord = await this.db.get(CONFIG_STORE, "lrs-config");
        if (configRecord) {
          this.lrsConfig = configRecord.value;
          console.log("[Telemetry Worker] Loaded LRS config from IndexedDB", {
            enabled: this.lrsConfig?.enabled,
            endpoint: this.lrsConfig?.endpoint,
          });
        } else {
          // Try loading from main thread's localStorage via message
          this.lrsConfig = loadLRSConfig();
          console.log("[Telemetry Worker] Loaded LRS config from localStorage", {
            enabled: this.lrsConfig?.enabled,
            endpoint: this.lrsConfig?.endpoint,
          });
          // Save to IndexedDB for future use
          if (this.db) {
            await this.db.put(CONFIG_STORE, { key: "lrs-config", value: this.lrsConfig });
          }
        }
        
        if (this.lrsConfig?.enabled && this.lrsConfig?.endpoint) {
          this.initializeLRSClient();
          console.log("[Telemetry Worker] LRS client initialized");
        } else {
          console.log("[Telemetry Worker] LRS not enabled or endpoint not configured");
        }
      }
    } catch (error) {
      console.error("Failed to load LRS config:", error);
      this.lrsConfig = loadLRSConfig(); // Fallback
    }

    // Start periodic sync
    this.syncInterval = self.setInterval(() => {
      if (this.lrsConfig?.enabled) {
        this.syncXAPIStatements().catch(err => {
          console.error("Background xAPI sync failed:", err);
        });
      }
    }, 10000) as any;

    console.log("Telemetry worker initialized");
  }

  async processSignals(signals: TelemetrySignal[]): Promise<void> {
    if (!this.db) throw new Error("DB not initialized");

    // Store signals
    const tx = this.db.transaction(SIGNAL_STORE, "readwrite");
    await Promise.all([
      ...signals.map(signal => tx.store.add({
        ...signal,
        synced: false,
        syncAttempts: 0,
      })),
      tx.done,
    ]);

    // Generate xAPI statements if we have a session
    if (this.currentSession) {
      console.log(`[Telemetry Worker] Processing ${signals.length} signals with session`, {
        userId: this.currentSession.ids?.userId,
        lessonId: this.currentSession.ids?.lessonId,
      });
      
      for (const signal of signals) {
        try {
          const adaptivitySignal = this.convertToAdaptivitySignal(signal);
          const statement = this.xapiConverter.convertSignalToStatement(
            adaptivitySignal,
            this.currentSession!
          );
          
          await this.db.add(XAPI_STORE, {
            id: statement.id || `stmt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            statement,
            signalId: signal.id,
            synced: false,
            syncAttempts: 0,
            timestamp: Date.now(),
          });
          
          console.log(`[Telemetry Worker] Generated xAPI statement for signal ${signal.type}`, statement.id);
        } catch (error) {
          console.error("Failed to generate xAPI statement:", error, signal);
        }
      }
    } else {
      console.warn("[Telemetry Worker] No session available, skipping xAPI statement generation. Call updateSession() first.");
    }
  }

  async syncXAPIStatements(): Promise<{ synced: number; failed: number }> {
    if (!this.db) {
      console.warn("[Telemetry Worker] DB not initialized, cannot sync xAPI");
      return { synced: 0, failed: 0 };
    }
    
    if (!this.lrsConfig?.enabled) {
      console.log("[Telemetry Worker] LRS not enabled, skipping sync");
      return { synced: 0, failed: 0 };
    }
    
    if (!this.lrsClient) {
      console.warn("[Telemetry Worker] LRS client not initialized, cannot sync");
      return { synced: 0, failed: 0 };
    }

    // Get unsynced statements - use getAll and filter instead of IDBKeyRange.only(false)
    // IDBKeyRange.only(false) can fail in some browsers for boolean indexes
    const tx = this.db.transaction(XAPI_STORE, "readonly");
    const store = tx.store;
    
    // Get all records and filter for unsynced (more reliable than boolean key range)
    const allRecords = await store.getAll();
    const unsynced = allRecords
      .filter((record: any) => record.synced === false)
      .slice(0, 50); // Limit to 50
    
    await tx.done;

    if (unsynced.length === 0) {
      console.log("[Telemetry Worker] No unsynced xAPI statements");
      return { synced: 0, failed: 0 };
    }

    console.log(`[Telemetry Worker] Syncing ${unsynced.length} xAPI statements to LRS`);

    try {
      const statements = unsynced.map((r: any) => r.statement);
      console.log("[Telemetry Worker] Sending statements:", statements.length);
      const response = await this.lrsClient.sendStatements(statements);
      console.log("[Telemetry Worker] LRS response:", response);

      if (response.success && response.statementIds && response.statementIds.length > 0) {
        // Mark statements as synced
        const updateTx = this.db.transaction(XAPI_STORE, "readwrite");
        const updateStore = updateTx.store;
        
        await Promise.all(
          response.statementIds.map(async (id: string) => {
            const record = unsynced.find((r: any) => r.id === id);
            if (record) {
              record.synced = true;
              await updateStore.put(record);
            }
          })
        );
        
        await updateTx.done;

        return { synced: response.statementIds.length, failed: 0 };
      } else {
        // Increment sync attempts for failed statements
        const failTx = this.db.transaction(XAPI_STORE, "readwrite");
        const failStore = failTx.store;
        
        await Promise.all(
          unsynced.map(async (record: any) => {
            record.syncAttempts = (record.syncAttempts || 0) + 1;
            await failStore.put(record);
          })
        );
        
        await failTx.done;
        
        return { synced: 0, failed: unsynced.length };
      }
    } catch (error) {
      console.error("xAPI sync error:", error);
      
      // Increment sync attempts for failed statements
      try {
        const errorTx = this.db.transaction(XAPI_STORE, "readwrite");
        const errorStore = errorTx.store;
        
        await Promise.all(
          unsynced.map(async (record: any) => {
            record.syncAttempts = (record.syncAttempts || 0) + 1;
            await errorStore.put(record);
          })
        );
        
        await errorTx.done;
      } catch (updateError) {
        console.error("Failed to update sync attempts:", updateError);
      }
      
      return { synced: 0, failed: unsynced.length };
    }
  }

  async getStats(): Promise<any> {
    if (!this.db) return {};

    const signals = await this.db.getAll(SIGNAL_STORE);
    const xapiStatements = await this.db.getAll(XAPI_STORE);

    return {
      signals: {
        total: signals.length,
        synced: signals.filter(s => s.synced).length,
        unsynced: signals.filter(s => !s.synced).length,
      },
      xapi: {
        total: xapiStatements.length,
        synced: xapiStatements.filter(s => s.synced).length,
        unsynced: xapiStatements.filter(s => !s.synced).length,
      },
      lrs: {
        enabled: this.lrsConfig?.enabled || false,
        endpoint: this.lrsConfig?.endpoint,
      },
    };
  }

  async configureLRS(config: Partial<StoredLRSConfig>): Promise<void> {
    this.lrsConfig = { ...this.lrsConfig, ...config };
    
    console.log("[Telemetry Worker] Configuring LRS", {
      enabled: this.lrsConfig.enabled,
      endpoint: this.lrsConfig.endpoint,
      hasAuth: !!(this.lrsConfig.authToken || (this.lrsConfig.username && this.lrsConfig.password)),
    });
    
    // Save to IndexedDB
    if (this.db) {
      await this.db.put(CONFIG_STORE, { key: "lrs-config", value: this.lrsConfig });
    }
    
    // Also save to main thread's localStorage if possible
    try {
      saveLRSConfig(this.lrsConfig);
    } catch (error) {
      // Ignore - we're in worker
    }
    
    this.initializeLRSClient();
    
    // If enabled, trigger an immediate sync
    if (this.lrsConfig.enabled && this.lrsClient) {
      console.log("[Telemetry Worker] LRS enabled, triggering immediate sync");
      this.syncXAPIStatements().catch(err => {
        console.error("[Telemetry Worker] Immediate sync failed:", err);
      });
    }
  }

  async testLRSConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.lrsClient) {
      return { success: false, error: "LRS client not initialized" };
    }

    try {
      const result = await this.lrsClient.testConnection();
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async updateSession(session: SessionSnapshot): Promise<void> {
    // Serialize session to remove any non-serializable data
    try {
      const serialized = JSON.parse(JSON.stringify(session, (key, value) => {
        if (typeof value === 'function') return undefined;
        if (value === undefined) return undefined;
        return value;
      }));
      this.currentSession = serialized as SessionSnapshot;
      console.log("Telemetry worker session updated", {
        userId: this.currentSession?.ids?.userId,
        lessonId: this.currentSession?.ids?.lessonId,
      });
    } catch (error) {
      console.error("Failed to update session in telemetry worker:", error);
      // Fallback: try to set directly
      this.currentSession = session;
    }
  }

  private initializeLRSClient(): void {
    if (this.lrsConfig?.enabled && this.lrsConfig?.endpoint) {
      try {
        this.lrsClient = new LRSClientXAPI({
          endpoint: this.lrsConfig.endpoint,
          username: this.lrsConfig.username,
          password: this.lrsConfig.password,
          authToken: this.lrsConfig.authToken,
          version: this.lrsConfig.version || "1.0.3",
          timeout: this.lrsConfig.timeout || 10000,
          retryAttempts: this.lrsConfig.retryAttempts || 3,
          retryDelay: this.lrsConfig.retryDelay || 1000,
        });
        console.log("[Telemetry Worker] LRS client created successfully", {
          endpoint: this.lrsConfig.endpoint,
          hasAuth: !!(this.lrsConfig.authToken || (this.lrsConfig.username && this.lrsConfig.password)),
        });
      } catch (error) {
        console.error("[Telemetry Worker] Failed to initialize LRS client:", error);
        this.lrsClient = null;
      }
    } else {
      console.log("[Telemetry Worker] LRS client not created - not enabled or no endpoint");
      this.lrsClient = null;
    }
  }

  private convertToAdaptivitySignal(signal: TelemetrySignal): any {
    // Convert telemetry signal to adaptivity signal format
    return {
      id: signal.id,
      type: signal.type as any,
      timestamp: signal.timestamp,
      sessionIds: {
        userId: signal.metadata?.userId || "",
        courseId: signal.metadata?.courseId || "",
        lessonId: signal.metadata?.lessonId || "",
        pageId: signal.metadata?.pageId || "",
      },
      payload: signal.payload,
      synced: false,
      syncAttempts: 0,
    };
  }
}

// Expose worker API
const worker = new TelemetryWorker();
expose(worker as any);

