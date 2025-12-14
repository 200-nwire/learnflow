/**
 * @package @amit/player-signals
 * UI API for signals - emits/subscribes, internally manages worker
 */

import { ref, type Ref } from 'vue';
import type { Signal, SignalMeta, Started, Experienced, Answered, Selected, Completed } from './types.js';
import { SignalSchema } from './schemas.js';
import { createWorker } from './worker-client.js';

export type SignalsConfig = {
  outbox?: {
    enabled?: boolean;
  };
  xapi?: {
    enabled?: boolean;
    endpoint?: string; // base xapi endpoint (no /statements) OR full, your choice
    auth?: { kind: 'basic'; token: string } | { kind: 'bearer'; token: string };
  };
};

type SignalCallback = (signal: Signal) => void;
type Unsubscribe = () => void;

export function useSignals(opts?: { config?: SignalsConfig }) {
  const config = opts?.config ?? {};
  const subscribers = new Map<string | symbol, Set<SignalCallback>>();
  const anySubscribers = new Set<SignalCallback>();
  
  // Create worker instance
  const worker = createWorker(config);

  /**
   * Record a signal - emits locally and sends to worker
   */
  function record(signal: Signal): void {
    // Validate signal with Zod
    const validated = SignalSchema.parse(signal);
    
    // Emit locally to subscribers
    const typeSubscribers = subscribers.get(validated.type);
    if (typeSubscribers) {
      typeSubscribers.forEach(cb => cb(validated));
    }
    anySubscribers.forEach(cb => cb(validated));

    // Send to worker for outbox/xAPI processing
    worker.postMessage({ type: 'signal', signal: validated });
  }

  /**
   * Subscribe to specific signal types
   */
  function on(type: Signal['type'] | Signal['type'][], cb: SignalCallback): Unsubscribe {
    const types = Array.isArray(type) ? type : [type];
    const key = types.length === 1 ? types[0] : Symbol('multi-type');
    
    if (!subscribers.has(key)) {
      subscribers.set(key, new Set());
    }
    subscribers.get(key)!.add(cb);

    return () => {
      const set = subscribers.get(key);
      if (set) {
        set.delete(cb);
        if (set.size === 0) {
          subscribers.delete(key);
        }
      }
    };
  }

  /**
   * Subscribe to all signals
   */
  function onAny(cb: SignalCallback): Unsubscribe {
    anySubscribers.add(cb);
    return () => {
      anySubscribers.delete(cb);
    };
  }

  /**
   * Convenience methods for creating signals
   */
  function started(payload: Started['payload'], meta: SignalMeta): void {
    record({
      type: 'started',
      payload,
      meta: { ...meta, ts: meta.ts ?? Date.now() },
    });
  }

  function experienced(payload: Experienced['payload'], meta: SignalMeta): void {
    record({
      type: 'experienced',
      payload,
      meta: { ...meta, ts: meta.ts ?? Date.now() },
    });
  }

  function answered(payload: Answered['payload'], meta: SignalMeta): void {
    record({
      type: 'answered',
      payload,
      meta: { ...meta, ts: meta.ts ?? Date.now() },
    });
  }

  function selected(payload: Selected['payload'], meta: SignalMeta): void {
    record({
      type: 'selected',
      payload,
      meta: { ...meta, ts: meta.ts ?? Date.now() },
    });
  }

  function completed(payload: Completed['payload'], meta: SignalMeta): void {
    record({
      type: 'completed',
      payload,
      meta: { ...meta, ts: meta.ts ?? Date.now() },
    });
  }

  /**
   * Flush queues in worker (optional)
   */
  function flush(): void {
    worker.postMessage({ type: 'flush' });
  }

  return {
    record,
    on,
    onAny,
    started,
    experienced,
    answered,
    selected,
    completed,
    flush,
  };
}

// Re-export types
export type { Signal, SignalMeta, Started, Experienced, Answered, Selected, Completed } from './types.js';

