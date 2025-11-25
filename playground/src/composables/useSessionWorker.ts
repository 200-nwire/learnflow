/**
 * Vue composable for interacting with the session worker
 * Simplified - only handles session management
 * Telemetry is handled by @amit/telemetry package
 */
import { ref, onUnmounted } from "vue";
import { wrap, type Remote } from "comlink";
import type { SessionWorkerAPI } from "@amit/adaptivity/worker";
import type { SessionSnapshot } from "@amit/adaptivity";

let workerInstance: Worker | null = null;
let workerApi: Remote<SessionWorkerAPI> | null = null;

export function useSessionWorker() {
  const isReady = ref(false);
  const stats = ref<any>(null);

  const initWorker = async () => {
    if (workerApi) {
      isReady.value = true;
      return workerApi;
    }

    // Create worker
    workerInstance = new Worker(
      new URL("../workers/session-worker.js", import.meta.url),
      { type: "module" }
    );

    workerApi = wrap<SessionWorkerAPI>(workerInstance);
    await workerApi.init();
    isReady.value = true;

    return workerApi;
  };

  /**
   * Serialize session data for worker (remove non-serializable fields)
   */
  const serializeSession = (session: Partial<SessionSnapshot>): Partial<SessionSnapshot> => {
    try {
      // Deep clone and remove any functions or non-serializable data
      const serialized = JSON.parse(JSON.stringify(session, (key, value) => {
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
      return serialized;
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
        // Explicitly exclude trace if it causes issues
      };
    }
  };

  const updateSession = async (session: Partial<SessionSnapshot>) => {
    const api = await initWorker();
    // Serialize before sending to worker
    const serialized = serializeSession(session);
    await api.updateSession(serialized);
  };

  const getSession = async () => {
    const api = await initWorker();
    return await api.getSession();
  };

  const getStats = async () => {
    const api = await initWorker();
    const result = await api.getStats();
    stats.value = result;
    return result;
  };

  const clearOldData = async (olderThanMs: number) => {
    const api = await initWorker();
    return await api.clearOldData(olderThanMs);
  };

  onUnmounted(() => {
    // Note: we keep the worker alive across component lifecycles
    // It will be terminated when the page unloads
  });

  return {
    isReady,
    stats,
    initWorker,
    updateSession,
    getSession,
    getStats,
    clearOldData,
  };
}

