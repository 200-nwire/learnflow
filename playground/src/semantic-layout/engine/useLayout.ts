/**
 * Reactive bridge to the layout worker.
 *  - schedule() coalesces calls to one rAF and keeps last-wins (stale results dropped)
 *  - offloads compute to a Web Worker; falls back to synchronous compute if the
 *    worker can't be created (tests / unsupported env)
 */
import { shallowRef, onScopeDispose } from 'vue';
import {
  computeLaneLayout, DEFAULT_CONFIG,
  type LayoutItem, type LayoutGroup, type Lane, type LayoutConfig, type LayoutResult,
} from './laneLayout';

type Args = { items: LayoutItem[]; groups: LayoutGroup[]; collapsed: Lane[] };

export function useLayout(config: LayoutConfig = DEFAULT_CONFIG) {
  const result = shallowRef<LayoutResult | null>(null);
  const pending = shallowRef(false);

  let worker: Worker | null = null;
  let reqId = 0;
  let appliedId = 0;
  let frame = 0;
  let queued: Args | null = null;
  let lastArgs: Args | null = null;

  function applySync(a: Args, id: number) {
    const r = computeLaneLayout(a.items, a.groups, a.collapsed, config);
    if (id >= appliedId) { appliedId = id; result.value = r; pending.value = false; }
  }

  try {
    worker = new Worker(new URL('./layout.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<{ id: number; result: LayoutResult }>) => {
      const { id, result: r } = e.data;
      if (id < appliedId) return;
      appliedId = id;
      result.value = r;
      if (id === reqId) pending.value = false;
    };
    worker.onerror = () => { worker = null; if (lastArgs) applySync(lastArgs, reqId); };
  } catch {
    worker = null;
  }

  function run(a: Args) {
    const id = ++reqId;
    lastArgs = a;
    pending.value = true;
    if (worker) worker.postMessage({ id, items: a.items, groups: a.groups, collapsed: a.collapsed, config });
    else applySync(a, id);
  }

  function schedule(items: LayoutItem[], groups: LayoutGroup[], collapsed: Lane[]) {
    queued = { items, groups, collapsed };
    if (frame) return;
    frame = requestAnimationFrame(() => { frame = 0; if (queued) { run(queued); queued = null; } });
  }

  onScopeDispose(() => { if (frame) cancelAnimationFrame(frame); worker?.terminate(); });

  return { result, pending, schedule, config };
}
