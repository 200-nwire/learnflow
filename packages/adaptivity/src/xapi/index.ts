/**
 * xAPI Module
 * Exports for xAPI statement generation and LRS integration
 * 
 * Uses official @xapi/xapi library for LRS communication
 * 
 * Configuration is centralized in config.ts (single source of truth)
 */

export * from "./statement-converter.js";
export * from "./lrs-client-xapi.js";
export * from "./config.js";

// Re-export types for backward compatibility
export type { LRSConfig, LRSResponse } from "./lrs-client-xapi.js";
export type { StoredLRSConfig } from "./config.js";

