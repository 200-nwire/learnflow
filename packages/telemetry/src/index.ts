/**
 * Telemetry Package
 * Main entry point
 */

export * from "./types.js";
export * from "./event-hook.js";
export * from "./signal-collector.js";
export * from "./queue.js";
export * from "./worker/telemetry-worker.js";

// Re-export LRS config from adaptivity (single source of truth)
export type { LRSConfig, StoredLRSConfig } from "@amit/adaptivity/xapi";
export { DEFAULT_LRS_CONFIG, loadLRSConfig, saveLRSConfig, clearLRSConfig } from "@amit/adaptivity/xapi";

