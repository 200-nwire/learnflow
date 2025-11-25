/**
 * Worker entry point - instantiate and expose the session worker
 * This file is imported by the worker bundle to start the worker
 * 
 * When imported via: import "@amit/adaptivity/worker"
 * This file will execute and expose the worker API via Comlink
 */
export * from "./session-worker.js";

