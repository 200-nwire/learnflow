/**
 * Obstacle-avoiding gutter router. Pure, no DOM.
 *
 * The layout is a grid of lanes (columns) and stages (rows). The strips BETWEEN
 * them — lane gaps (vertical gutters) and stage gaps (horizontal gutters) — are
 * guaranteed free of nodes. We route every edge orthogonally through those
 * gutters, so an arrow provably never crosses a section body:
 *
 *   • same lane            → straight down the lane (through the clear stage gap)
 *   • adjacent lanes       → Z through the single shared vertical gutter
 *   • lanes apart          → out to A's gutter, across a horizontal stage-gap
 *                            (clear full-width), down B's gutter, into B
 *
 * Parallel edges sharing a gutter are nudged onto sub-tracks so they never merge
 * into one blur.
 */
export interface Pt { x: number; y: number }
interface Band { x: number; width: number }
interface Row { y: number; height: number }
interface Rect { x: number; y: number; width: number; height: number }
interface Cfg { laneGap: number; stageGap: number }
interface Lnk { id: string; source: string; target: string }

export function routeEdges(
  placements: Record<string, Rect>, bands: Band[], rows: Row[], cfg: Cfg, links: Lnk[],
): Record<string, Pt[]> {
  const out: Record<string, Pt[]> = {};
  if (!bands.length || !rows.length) return out;

  const lanes = [...bands].sort((a, b) => a.x - b.x);
  const laneIdx = (cx: number) => {
    let i = lanes.findIndex(b => cx >= b.x && cx <= b.x + b.width);
    if (i === -1) { let best = Infinity; lanes.forEach((b, j) => { const d = Math.abs(cx - (b.x + b.width / 2)); if (d < best) { best = d; i = j; } }); }
    return i;
  };
  // gutter x to the RIGHT of lane i (i from -1 .. n-1)
  const gutterX = (i: number) => {
    if (i < 0) return lanes[0].x - cfg.laneGap / 2;
    if (i >= lanes.length - 1) { const l = lanes[lanes.length - 1]; return l.x + l.width + cfg.laneGap / 2; }
    return (lanes[i].x + lanes[i].width + lanes[i + 1].x) / 2;
  };
  const rs = [...rows].sort((a, b) => a.y - b.y);
  const hys = [rs[0].y - cfg.stageGap / 2,
    ...rs.slice(0, -1).map((r, i) => (r.y + r.height + rs[i + 1].y) / 2),
    rs[rs.length - 1].y + rs[rs.length - 1].height + cfg.stageGap / 2];
  const nearestHy = (y: number) => hys.reduce((p, c) => Math.abs(c - y) < Math.abs(p - y) ? c : p, hys[0]);

  const maxTrk = Math.max(0, cfg.laneGap / 2 - 7);
  const srcN: Record<string, number> = {};

  for (const l of links) {
    const A = placements[l.source], B = placements[l.target];
    if (!A || !B) continue;
    const Ac = { x: A.x + A.width / 2, y: A.y + A.height / 2 };
    const Bc = { x: B.x + B.width / 2, y: B.y + B.height / 2 };
    const la = laneIdx(Ac.x), lb = laneIdx(Bc.x);
    const k = (srcN[l.source] = (srcN[l.source] ?? 0)); srcN[l.source] = k + 1;
    const trk = Math.min(k * 9, maxTrk);

    let pts: Pt[];
    if (la === lb) {
      const down = Bc.y >= Ac.y;
      const ay = down ? A.y + A.height : A.y;
      const by = down ? B.y : B.y + B.height;
      const midY = (ay + by) / 2;
      pts = [{ x: Ac.x, y: ay }, { x: Ac.x, y: midY }, { x: Bc.x, y: midY }, { x: Bc.x, y: by }];
    } else {
      const right = lb > la;
      const aExit = { x: right ? A.x + A.width : A.x, y: Ac.y };
      const bEntry = { x: right ? B.x : B.x + B.width, y: Bc.y };
      const vA = (right ? gutterX(la) : gutterX(la - 1)) + (right ? trk : -trk);
      if (Math.abs(la - lb) === 1) {
        pts = [aExit, { x: vA, y: aExit.y }, { x: vA, y: bEntry.y }, bEntry];
      } else {
        const vB = (right ? gutterX(lb - 1) : gutterX(lb)) + (right ? trk : -trk);
        const hy = nearestHy((aExit.y + bEntry.y) / 2);
        pts = [aExit, { x: vA, y: aExit.y }, { x: vA, y: hy }, { x: vB, y: hy }, { x: vB, y: bEntry.y }, bEntry];
      }
    }
    out[l.id] = pts;
  }
  return out;
}

/** Build a rounded orthogonal SVG path from a polyline. */
export function roundedPath(pts: Pt[], radius = 9): string {
  if (pts.length < 2) return '';
  // collapse consecutive duplicates
  const p = pts.filter((pt, i) => i === 0 || pt.x !== pts[i - 1].x || pt.y !== pts[i - 1].y);
  if (p.length < 2) return '';
  let d = `M ${p[0].x} ${p[0].y}`;
  for (let i = 1; i < p.length - 1; i++) {
    const prev = p[i - 1], cur = p[i], next = p[i + 1];
    const r1 = Math.min(radius, Math.hypot(cur.x - prev.x, cur.y - prev.y) / 2);
    const r2 = Math.min(radius, Math.hypot(next.x - cur.x, next.y - cur.y) / 2);
    const u1 = unit(prev, cur), u2 = unit(cur, next);
    const a = { x: cur.x - u1.x * r1, y: cur.y - u1.y * r1 };
    const b = { x: cur.x + u2.x * r2, y: cur.y + u2.y * r2 };
    d += ` L ${a.x} ${a.y} Q ${cur.x} ${cur.y} ${b.x} ${b.y}`;
  }
  const last = p[p.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}
function unit(a: Pt, b: Pt): Pt { const dx = b.x - a.x, dy = b.y - a.y, m = Math.hypot(dx, dy) || 1; return { x: dx / m, y: dy / m }; }

/** Midpoint along the polyline (for label placement). */
export function midpoint(pts: Pt[]): Pt {
  if (!pts.length) return { x: 0, y: 0 };
  let total = 0; for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  let half = total / 2;
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    if (half <= seg) { const t = seg ? half / seg : 0; return { x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * t }; }
    half -= seg;
  }
  return pts[Math.floor(pts.length / 2)];
}
