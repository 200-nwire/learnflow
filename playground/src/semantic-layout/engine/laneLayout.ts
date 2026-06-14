/**
 * Pure swimlane layout with per-cell TREES. No Vue, no DOM → runs in a worker.
 *
 * Lanes are fixed columns; stages are shared rows. A cell (lane × stage) holds a
 * tree: leaves (sections/decisions) and groups (one-of / all) that nest. The
 * engine lays each cell's tree top-down with indentation and emits both leaf
 * placements and group rectangles (containers drawn behind the nodes).
 */
export const LANE_ORDER = ['support', 'core', 'enrichment', 'advanced'] as const;
export type Lane = typeof LANE_ORDER[number];
export type GroupMode = 'one-of' | 'all';

export interface LayoutItem {           // a leaf (section or decision)
  id: string;
  lane: Lane;
  stage: number;
  parentGroupId?: string;
  order?: number;
  width?: number;
  height?: number;
}
export interface LayoutGroup {          // a container
  id: string;
  lane: Lane;
  stage: number;
  parentGroupId?: string;
  order?: number;
  mode: GroupMode;
  label?: string;
}
export interface LayoutConfig {
  laneWidth: number; railWidth: number; laneGap: number; innerPad: number;
  nodeGap: number; stageGap: number; topMargin: number; headerHeight: number; leftGutter: number;
  indent: number; groupHeader: number; groupPad: number; siblingGap: number;
}
export interface Placement { x: number; y: number; width: number; height: number; }
export interface GroupRect {
  id: string; x: number; y: number; width: number; height: number;
  mode: GroupMode; depth: number; label?: string;
}
export interface Band { id: Lane; x: number; width: number; collapsed: boolean; count: number; }
export interface Row { stage: number; y: number; height: number; }
export interface LayoutResult {
  placements: Record<string, Placement>;
  groups: GroupRect[];
  bands: Band[];
  rows: Row[];
  contentTop: number; contentHeight: number; contentLeft: number; contentWidth: number;
}

export const DEFAULT_CONFIG: LayoutConfig = {
  laneWidth: 340, railWidth: 60, laneGap: 34, innerPad: 16,
  nodeGap: 14, stageGap: 56, topMargin: 30, headerHeight: 58, leftGutter: 104,
  indent: 18, groupHeader: 30, groupPad: 12, siblingGap: 14,
};

interface TreeNode {
  id: string;
  isGroup: boolean;
  order: number;
  mode?: GroupMode;
  label?: string;
  children: TreeNode[];
}

function leafHeight(it: LayoutItem | undefined): number {
  return it?.height ?? 84;
}

export function computeLaneLayout(
  items: LayoutItem[],
  groups: LayoutGroup[],
  collapsed: Lane[],
  config: LayoutConfig = DEFAULT_CONFIG,
): LayoutResult {
  const col = new Set(collapsed);
  const c = config;

  // 1) lane bands
  const bands: Band[] = [];
  const laneX: Record<string, number> = {};
  const laneW: Record<string, number> = {};
  let x = c.leftGutter;
  for (const lane of LANE_ORDER) {
    const collapsedLane = col.has(lane);
    const width = collapsedLane ? c.railWidth : c.laneWidth;
    const count = items.filter(i => i.lane === lane).length;
    laneX[lane] = x; laneW[lane] = width;
    bands.push({ id: lane, x, width, collapsed: collapsedLane, count });
    x += width + c.laneGap;
  }
  const contentWidth = x - c.laneGap;

  // 2) stages
  const stages = Array.from(new Set([...items, ...groups].map(i => i.stage))).sort((a, b) => a - b);

  // index leaves by id for height lookup
  const itemById: Record<string, LayoutItem> = {};
  for (const it of items) itemById[it.id] = it;

  // 3) build per-cell forests
  const cellForest: Record<string, TreeNode[]> = {};
  const ensureCell = (lane: Lane, stage: number) => (cellForest[`${lane}:${stage}`] ??= []);
  // map every group to a TreeNode
  const groupNode: Record<string, TreeNode> = {};
  for (const g of groups) groupNode[g.id] = { id: g.id, isGroup: true, order: g.order ?? 0, mode: g.mode, label: g.label, children: [] };
  // attach groups to parents / cell roots
  for (const g of groups) {
    const node = groupNode[g.id];
    if (g.parentGroupId && groupNode[g.parentGroupId]) groupNode[g.parentGroupId].children.push(node);
    else ensureCell(g.lane, g.stage).push(node);
  }
  // attach leaves
  for (const it of items) {
    const node: TreeNode = { id: it.id, isGroup: false, order: it.order ?? 0, children: [] };
    if (it.parentGroupId && groupNode[it.parentGroupId]) groupNode[it.parentGroupId].children.push(node);
    else ensureCell(it.lane, it.stage).push(node);
  }
  // sort every children list by order
  const sortRec = (nodes: TreeNode[]) => { nodes.sort((a, b) => a.order - b.order); nodes.forEach(n => sortRec(n.children)); };
  for (const k in cellForest) sortRec(cellForest[k]);

  // recursive layout of a forest; mutates `places`/`rects`; returns bottom Y
  function layoutForest(
    nodes: TreeNode[], x0: number, y0: number, avail: number, depth: number,
    places: Record<string, Placement>, rects: GroupRect[],
  ): number {
    let y = y0;
    nodes.forEach((n, i) => {
      if (i > 0) y += c.siblingGap;
      if (!n.isGroup) {
        const it = itemById[n.id];
        const h = leafHeight(it);
        // fixed-width leaves (e.g. decision nodes) stay compact + centered;
        // sections fill the indented width so the tree reads as a column
        const w = it?.width ? Math.min(it.width, avail) : avail;
        const lx = it?.width ? x0 + (avail - w) / 2 : x0;
        places[n.id] = { x: lx, y, width: w, height: h };
        y += h;
      } else {
        const headerTop = y;
        const childStartY = y + c.groupHeader + c.groupPad;
        const childBottom = n.children.length
          ? layoutForest(n.children, x0 + c.indent, childStartY, avail - c.indent, depth + 1, places, rects)
          : childStartY + 8;
        const bottom = childBottom + c.groupPad;
        rects.push({ id: n.id, x: x0, y: headerTop, width: avail, height: bottom - headerTop, mode: n.mode!, depth, label: n.label });
        y = bottom;
      }
    });
    return y;
  }

  // 4) measure each cell's tree height (relative), keep relative placements to offset later
  const cellRelPlaces: Record<string, Record<string, Placement>> = {};
  const cellRelRects: Record<string, GroupRect[]> = {};
  const cellHeight: Record<string, number> = {};
  for (const key in cellForest) {
    const [lane] = key.split(':') as [Lane, string];
    if (col.has(lane)) continue;
    const avail = laneW[lane] - c.innerPad * 2;
    const p: Record<string, Placement> = {};
    const r: GroupRect[] = [];
    const bottom = layoutForest(cellForest[key], 0, 0, avail, 0, p, r);
    cellRelPlaces[key] = p; cellRelRects[key] = r; cellHeight[key] = bottom;
  }

  // 5) row heights from tallest cell tree
  const rows: Row[] = [];
  const rowY: Record<number, number> = {};
  const rowH: Record<number, number> = {};
  let y = c.topMargin + c.headerHeight;
  for (const stage of stages) {
    let h = 40;
    for (const lane of LANE_ORDER) {
      if (col.has(lane)) continue;
      const ch = cellHeight[`${lane}:${stage}`];
      if (ch) h = Math.max(h, ch + c.innerPad * 2);
    }
    rowY[stage] = y; rowH[stage] = h;
    rows.push({ stage, y, height: h });
    y += h + c.stageGap;
  }
  const contentTop = c.topMargin + c.headerHeight;
  const contentHeight = y - c.stageGap - contentTop;

  // 6) offset relative placements to absolute (top-aligned in cell, indented from lane left)
  const placements: Record<string, Placement> = {};
  const groupRects: GroupRect[] = [];
  for (const key in cellRelPlaces) {
    const [lane, stageStr] = key.split(':') as [Lane, string];
    const stage = Number(stageStr);
    const dx = laneX[lane] + c.innerPad;
    const dy = (rowY[stage] ?? 0) + c.innerPad;
    const p = cellRelPlaces[key];
    for (const id in p) placements[id] = { x: p[id].x + dx, y: p[id].y + dy, width: p[id].width, height: p[id].height };
    for (const r of cellRelRects[key]) groupRects.push({ ...r, x: r.x + dx, y: r.y + dy });
  }

  return { placements, groups: groupRects, bands, rows, contentTop, contentHeight, contentLeft: 0, contentWidth };
}
