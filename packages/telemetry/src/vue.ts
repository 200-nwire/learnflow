/**
 * Vue Composables for Telemetry
 * Provides onSignal() and recordSignal() hooks
 */

import { ref, onUnmounted, type Ref } from "vue";
import { wrap, type Remote } from "comlink";
import type { TelemetrySignal, SignalSource, SignalPriority } from "./types.js";
import { getSignalCollector, type SignalCollector } from "./signal-collector.js";
import { SignalQueue } from "./queue.js";
import type { TelemetryWorkerAPI } from "./worker/telemetry-worker.js";

let workerInstance: Worker | null = null;
let workerApi: Remote<TelemetryWorkerAPI> | null = null;
let collector: SignalCollector | null = null;
let queue: SignalQueue | null = null;

/**
 * Initialize telemetry system
 */
export async function initTelemetry(config?: {
  workerPath?: string;
  queueConfig?: {
    batchSize?: number;
    flushInterval?: number;
    maxQueueSize?: number;
  };
}): Promise<void> {
  // Initialize collector
  collector = getSignalCollector();

  // Initialize queue
  queue = new SignalQueue(collector, config?.queueConfig);
  
  // Set up queue processor
  queue.setProcessor(async (signals: TelemetrySignal[]) => {
    if (workerApi) {
      await workerApi.processSignals(signals);
    }
  });

  // Initialize worker
  if (config?.workerPath) {
    workerInstance = new Worker(
      new URL(config.workerPath, import.meta.url),
      { type: "module" }
    );
    workerApi = wrap<TelemetryWorkerAPI>(workerInstance);
    await workerApi.init();
  }

  // Connect collector to queue
  collector.getGlobalHook().on((signal) => {
    if (queue) {
      queue.enqueue(signal);
    }
  });
}

/**
 * Record a signal (producer)
 * Triggers subscriptions and queues for processing
 */
export function recordSignal(
  type: string,
  payload: Record<string, any>,
  options?: {
    source?: SignalSource;
    priority?: SignalPriority;
    metadata?: TelemetrySignal["metadata"];
    tags?: string[];
  }
): void {
  if (!collector) {
    console.warn("Telemetry not initialized. Call initTelemetry() first.");
    return;
  }

  const signal: TelemetrySignal = {
    id: `sig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    source: options?.source || "custom",
    priority: options?.priority || "normal",
    timestamp: Date.now(),
    payload,
    metadata: options?.metadata,
    tags: options?.tags,
  };

  // Record in collector (triggers hooks and subscriptions)
  collector.recordSignal(signal);
}

/**
 * Subscribe to signals (subscriber)
 * Returns unsubscribe function
 */
export function onSignal(
  callback: (signal: TelemetrySignal) => void,
  filters?: {
    type?: string | string[];
    source?: SignalSource | SignalSource[];
    priority?: SignalPriority | SignalPriority[];
    tags?: string[];
  }
): () => void {
  if (!collector) {
    console.warn("Telemetry not initialized. Call initTelemetry() first.");
    return () => {}; // Return no-op unsubscribe
  }

  return collector.subscribe(callback, filters);
}

/**
 * Get signal hook for a specific type
 */
export function useSignalType(type: string) {
  if (!collector) {
    throw new Error("Telemetry not initialized. Call initTelemetry() first.");
  }

  const hook = collector.getTypeHook(type);

  return {
    on: (callback: (signal: TelemetrySignal) => void) => {
      const unsubscribe = hook.on(callback);
      onUnmounted(() => unsubscribe());
      return unsubscribe;
    },
    trigger: (signal: TelemetrySignal) => {
      hook.trigger(signal);
    },
  };
}

/**
 * Get signal hook for a specific source
 */
export function useSignalSource(source: SignalSource) {
  if (!collector) {
    throw new Error("Telemetry not initialized. Call initTelemetry() first.");
  }

  const hook = collector.getSourceHook(source);

  return {
    on: (callback: (signal: TelemetrySignal) => void) => {
      const unsubscribe = hook.on(callback);
      onUnmounted(() => unsubscribe());
      return unsubscribe;
    },
    trigger: (signal: TelemetrySignal) => {
      hook.trigger(signal);
    },
  };
}

/**
 * Get global signal hook
 */
export function useSignalHook() {
  if (!collector) {
    throw new Error("Telemetry not initialized. Call initTelemetry() first.");
  }

  const hook = collector.getGlobalHook();

  return {
    on: (callback: (signal: TelemetrySignal) => void) => {
      const unsubscribe = hook.on(callback);
      onUnmounted(() => unsubscribe());
      return unsubscribe;
    },
    trigger: (signal: TelemetrySignal) => {
      hook.trigger(signal);
    },
  };
}

/**
 * Get telemetry stats
 */
export function useTelemetryStats(): Ref<any> {
  const stats = ref<any>(null);

  if (!collector) {
    return stats;
  }

  const updateStats = () => {
    stats.value = {
      collector: collector!.getStats(),
      queue: queue?.getStats(),
    };
  };

  updateStats();
  const interval = setInterval(updateStats, 2000);

  onUnmounted(() => {
    clearInterval(interval);
  });

  return stats;
}

/**
 * Flush signal queue manually
 */
export async function flushQueue(): Promise<void> {
  if (queue) {
    await queue.flush();
  }
}

/**
 * Get worker API (for advanced usage)
 */
export function getTelemetryWorker(): Remote<TelemetryWorkerAPI> | null {
  return workerApi;
}

/**
 * Serialize session data for worker (remove non-serializable fields)
 */
function serializeSession(session: any): any {
  try {
    // Deep clone and remove any functions or non-serializable data
    return JSON.parse(JSON.stringify(session, (key, value) => {
      // Remove functions
      if (typeof value === 'function') {
        return undefined;
      }
      // Remove undefined values (JSON.stringify will omit these)
      if (value === undefined) {
        return undefined;
      }
      // Handle Date objects
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    }));
  } catch (error) {
    console.error('Failed to serialize session, using fallback:', error);
    // Fallback: manually construct a serializable version
    return {
      ids: session.ids ? { ...session.ids } : undefined,
      user: session.user ? JSON.parse(JSON.stringify(session.user)) : undefined,
      env: session.env ? { ...session.env } : undefined,
      metrics: session.metrics ? { ...session.metrics } : undefined,
      perSkill: session.perSkill ? JSON.parse(JSON.stringify(session.perSkill)) : undefined,
      sticky: session.sticky ? JSON.parse(JSON.stringify(session.sticky)) : undefined,
      overrides: session.overrides ? JSON.parse(JSON.stringify(session.overrides)) : undefined,
      seenVariants: session.seenVariants ? JSON.parse(JSON.stringify(session.seenVariants)) : undefined,
      policy: session.policy ? {
        version: session.policy.version || '',
        caps: session.policy.caps ? { ...session.policy.caps } : undefined,
        hash: session.policy.hash,
      } : undefined,
    };
  }
}

/**
 * Update session in telemetry worker
 * Required for xAPI statement generation
 */
export async function updateTelemetrySession(session: any): Promise<void> {
  if (workerApi) {
    // Serialize before sending to worker to avoid DataCloneError
    const serialized = serializeSession(session);
    await workerApi.updateSession(serialized);
  } else {
    console.warn("Telemetry worker not initialized, cannot update session");
  }
}

// Re-export types
export type { TelemetrySignal, SignalSource, SignalPriority } from "./types.js";

