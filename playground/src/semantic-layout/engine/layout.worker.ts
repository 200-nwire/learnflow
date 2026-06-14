/// <reference lib="webworker" />
import { computeLaneLayout, type LayoutItem, type Lane, type LayoutConfig } from './laneLayout';

interface Req { id: number; items: LayoutItem[]; collapsed: Lane[]; config: LayoutConfig; }

self.onmessage = (e: MessageEvent<Req>) => {
  const { id, items, collapsed, config } = e.data;
  const result = computeLaneLayout(items, collapsed, config);
  (self as unknown as Worker).postMessage({ id, result });
};
