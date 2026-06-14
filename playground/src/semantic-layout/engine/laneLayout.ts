/**
 * Pure swimlane layout. No Vue, no DOM → runs in a worker.
 * Lanes are fixed columns (support·core·enrichment·advanced); stages are shared
 * rows. Any placeable item with {lane, stage, width, height} is positioned.
 */
export const LANE_ORDER = ['support', 'core', 'enrichment', 'advanced'] as const;
export type Lane = typeof LANE_ORDER[number];

export interface LayoutItem {
  id: string;
  lane: Lane;
  stage: number;
  width?: number;
  height?: number;
}
export interface LayoutConfig {
  laneWidth: number; railWidth: number; laneGap: number; innerPad: number;
  nodeGap: number; stageGap: number; topMargin: number; headerHeight: number; leftGutter: number;
}
export interface Placement { x: number; y: number; width: number; height: number; }
export interface Band { id: Lane; x: number; width: number; collapsed: boolean; count: number; }
export interface Row { stage: number; y: number; height: number; }
export interface LayoutResult {
  placements: Record<string, Placement>;
  bands: Band[];
  rows: Row[];
  contentTop: number; contentHeight: number; contentLeft: number; contentWidth: number;
}

export const DEFAULT_CONFIG: LayoutConfig = {
  laneWidth: 300, railWidth: 56, laneGap: 28, innerPad: 18,
  nodeGap: 18, stageGap: 40, topMargin: 28, headerHeight: 56, leftGutter: 92,
};

function fallbackSize(it: LayoutItem, contentWidth: number): { width: number; height: number } {
  if (it.width && it.height) return { width: it.width, height: it.height };
  return { width: it.width ?? contentWidth, height: it.height ?? 84 };
}

export function computeLaneLayout(
  items: LayoutItem[],
  collapsed: Lane[],
  config: LayoutConfig = DEFAULT_CONFIG,
): LayoutResult {
  const col = new Set(collapsed);
  const { laneWidth, railWidth, laneGap, innerPad, nodeGap, stageGap, topMargin, headerHeight, leftGutter } = config;

  // 1) lane bands
  const bands: Band[] = [];
  const laneX: Record<string, number> = {};
  const laneW: Record<string, number> = {};
  let x = leftGutter;
  for (const lane of LANE_ORDER) {
    const collapsedLane = col.has(lane);
    const width = collapsedLane ? railWidth : laneWidth;
    const count = items.filter(i => i.lane === lane).length;
    laneX[lane] = x; laneW[lane] = width;
    bands.push({ id: lane, x, width, collapsed: collapsedLane, count });
    x += width + laneGap;
  }
  const contentWidth = x - laneGap;

  // 2) stages (sorted union)
  const stages = Array.from(new Set(items.map(i => i.stage))).sort((a, b) => a - b);

  // 3) group by cell + size
  const cell: Record<string, LayoutItem[]> = {};
  const size: Record<string, { width: number; height: number }> = {};
  for (const it of items) {
    const key = `${it.lane}:${it.stage}`;
    (cell[key] ??= []).push(it);
    const cw = (col.has(it.lane) ? railWidth : laneW[it.lane]) - innerPad * 2;
    size[it.id] = fallbackSize(it, cw);
  }

  // 4) row heights
  const rows: Row[] = [];
  const rowY: Record<number, number> = {};
  const rowH: Record<number, number> = {};
  let y = topMargin + headerHeight;
  for (const stage of stages) {
    let h = 48;
    for (const lane of LANE_ORDER) {
      if (col.has(lane)) continue;
      const items2 = cell[`${lane}:${stage}`] ?? [];
      if (!items2.length) continue;
      const cellH = items2.reduce((s, it) => s + size[it.id].height, 0) + nodeGap * (items2.length - 1);
      h = Math.max(h, cellH);
    }
    rowY[stage] = y; rowH[stage] = h;
    rows.push({ stage, y, height: h });
    y += h + stageGap;
  }
  const contentTop = topMargin + headerHeight;
  const contentHeight = y - stageGap - contentTop;

  // 5) place
  const placements: Record<string, Placement> = {};
  for (const key in cell) {
    const [lane, stageStr] = key.split(':') as [Lane, string];
    if (col.has(lane)) continue;
    const stage = Number(stageStr);
    const lx = laneX[lane], lw = laneW[lane], ry = rowY[stage], rh = rowH[stage];
    const items2 = cell[key];
    const totalH = items2.reduce((s, it) => s + size[it.id].height, 0) + nodeGap * (items2.length - 1);
    let cy = ry + (rh - totalH) / 2;
    for (const it of items2) {
      const sz = size[it.id];
      placements[it.id] = { x: lx + (lw - sz.width) / 2, y: cy, width: sz.width, height: sz.height };
      cy += sz.height + nodeGap;
    }
  }

  return { placements, bands, rows, contentTop, contentHeight, contentLeft: 0, contentWidth };
}
