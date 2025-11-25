/**
 * LRS Configuration Management
 * Centralized configuration - single source of truth
 * Used by both adaptivity and telemetry packages
 */

const STORAGE_KEY = "amit-lrs-config";

export interface LRSConfig {
  endpoint: string; // e.g., "https://lrs.example.com/xapi"
  username?: string; // For Basic Auth
  password?: string; // For Basic Auth
  authToken?: string; // For Bearer token auth
  version?: string; // xAPI version (default: "1.0.3")
  timeout?: number; // Request timeout in ms (default: 10000)
  retryAttempts?: number; // Max retry attempts (default: 3)
  retryDelay?: number; // Initial retry delay in ms (default: 1000)
}

export interface StoredLRSConfig extends LRSConfig {
  enabled: boolean; // Whether to send statements to LRS
  lastTested?: number; // Timestamp of last successful test
  lastTestResult?: boolean; // Result of last connection test
}

/**
 * Default LRS configuration
 * Default endpoint for testing: http://127.0.0.1:8000/trax/api/gateway/clients/default/stores/default/xapi
 */
export const DEFAULT_LRS_CONFIG: StoredLRSConfig = {
  endpoint: "http://127.0.0.1:8000/trax/api/gateway/clients/default/stores/default/xapi",
  username: "traxlrs",
  password: "aaaaaaaa",
  enabled: false, // Disabled by default - enable when ready to test
  version: "1.0.3",
  timeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000,
};

/**
 * Load LRS configuration from localStorage (main thread) or IndexedDB (worker)
 */
export function loadLRSConfig(): StoredLRSConfig {
  try {
    // Check if we're in a worker context
    if (typeof self !== "undefined" && self.constructor?.name === "DedicatedWorkerGlobalScope") {
      // In worker, return default - config should be loaded from IndexedDB by worker
      return { ...DEFAULT_LRS_CONFIG };
    }
    
    // Main thread - use localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_LRS_CONFIG, ...parsed };
    }
  } catch (error) {
    console.error("Failed to load LRS config:", error);
  }
  return { ...DEFAULT_LRS_CONFIG };
}

/**
 * Save LRS configuration to localStorage (main thread) or IndexedDB (worker)
 */
export function saveLRSConfig(config: Partial<StoredLRSConfig>): void {
  try {
    // Check if we're in a worker context
    if (typeof self !== "undefined" && self.constructor?.name === "DedicatedWorkerGlobalScope") {
      // In worker, this should be handled by the worker's IndexedDB
      console.warn("saveLRSConfig called in worker - use worker's configureLRS method");
      return;
    }
    
    // Main thread - use localStorage
    const current = loadLRSConfig();
    const updated = { ...current, ...config };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to save LRS config:", error);
  }
}

/**
 * Clear LRS configuration
 */
export function clearLRSConfig(): void {
  try {
    if (typeof self !== "undefined" && self.constructor?.name === "DedicatedWorkerGlobalScope") {
      // In worker, handled by worker
      return;
    }
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear LRS config:", error);
  }
}

