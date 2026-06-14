/**
 * Reactive bridge to the layout worker.
 *  - schedule() coalesces calls to one rAF and keeps last-wins (stale results dropped)
 *  - offloads compute to a Web Worker; falls back to synchronous compute if the
 *    worker can't be created (tests / unsupported env)
 */
import { shallowRef, onScopeDispose } from 'vue';
import {
  computeLaneLayout, DEFAULT_CONFIG,
  type LayoutItem, type Lane, type LayoutConfig, type LayoutResult,
} from './laneLayout';

export function useLayout(config: LayoutConfig = DEFAULT_CONFIG) {
  const result = shallowRef<LayoutResult | null>(null);
  const pending = shallowRef(false);

  let worker: Worker | null = null;
  let reqId = 0;          // latest request issued
  let appliedId = 0;      // latest request applied (last-wins)
  let frame = 0;
  let queued: { items: LayoutItem[]; collapsed: Lane[] } | null = null;
  let lastArgs: { items: LayoutItem[]; collapsed: Lane[] } | null = null;

  function applySync(items: LayoutItem[], collapsed: Lane[], id: number) {
    const r = computeLaneLayout(items, collapsed, config);
    if (id >= appliedId) { appliedId = id; result.value = r; pending.value = false; }
  }

  try {
    worker = new Worker(new URL('./layout.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<{ id: number; result: LayoutResult }>) => {
      const { id, result: r } = e.data;
      if (id < appliedId) return;          // stale — drop
      appliedId = id;
      result.value = r;
      if (id === reqId) pending.value = false;
    };
    worker.onerror = () => {
      worker = null;                        // disable worker; recompute the last request inline
      if (lastArgs) applySync(lastArgs.items, lastArgs.collapsed, reqId);
    };
  } catch {
    worker = null;
  }

  function run(items: LayoutItem[], collapsed: Lane[]) {
    const id = ++reqId;
    lastArgs = { items, collapsed };
    pending.value = true;
    if (worker) worker.postMessage({ id, items, collapsed, config });
    else applySync(items, collapsed, id);   // sync fallback (last-wins guarded)
  }

  /** Coalesce bursts (collapse + measure + edit) into a single layout pass. */
  function schedule(items: LayoutItem[], collapsed: Lane[]) {
    queued = { items, collapsed };
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (queued) { run(queued.items, queued.collapsed); queued = null; }
    });
  }

  onScopeDispose(() => {
    if (frame) cancelAnimationFrame(frame);
    worker?.terminate();
  });

  return { result, pending, schedule, config };
}
