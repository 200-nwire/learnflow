/// <reference lib="webworker" />
import { computeLaneLayout, type LayoutItem, type LayoutGroup, type Lane, type LayoutConfig } from './laneLayout';

interface Req { id: number; items: LayoutItem[]; groups: LayoutGroup[]; collapsed: Lane[]; config: LayoutConfig; }

self.onmessage = (e: MessageEvent<Req>) => {
  const { id, items, groups, collapsed, config } = e.data;
  const result = computeLaneLayout(items, groups, collapsed, config);
  (self as unknown as Worker).postMessage({ id, result });
};
