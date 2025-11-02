/**
 * Vue composable for interacting with the session worker
 */
import { ref, onUnmounted } from "vue";
import { wrap, type Remote } from "comlink";
import type { SessionWorkerAPI } from "@amit/adaptivity/worker";
import type { Signal, SessionSnapshot } from "@amit/adaptivity";

let workerInstance: Worker | null = null;
let workerApi: Remote<SessionWorkerAPI> | null = null;

export function useSessionWorker() {
  const isReady = ref(false);
  const stats = ref<any>(null);
  const syncStatus = ref<{ synced: number; failed: number } | null>(null);

  const initWorker = async () => {
    if (workerApi) {
      isReady.value = true;
      return workerApi;
    }

    // Create worker (note: in production, this path needs to be configured in vite.config)
    workerInstance = new Worker(
      new URL("../workers/session-worker.js", import.meta.url),
      { type: "module" }
    );

    workerApi = wrap<SessionWorkerAPI>(workerInstance);
    await workerApi.init();
    isReady.value = true;

    return workerApi;
  };

  const updateSession = async (session: Partial<SessionSnapshot>) => {
    const api = await initWorker();
    await api.updateSession(session);
  };

  const getSession = async () => {
    const api = await initWorker();
    return await api.getSession();
  };

  const logSignal = async (signal: Signal) => {
    const api = await initWorker();
    await api.logSignal(signal);
  };

  const syncSignals = async () => {
    const api = await initWorker();
    const result = await api.syncSignals();
    syncStatus.value = result;
    return result;
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
    syncStatus,
    initWorker,
    updateSession,
    getSession,
    logSignal,
    syncSignals,
    getStats,
    clearOldData,
  };
}

