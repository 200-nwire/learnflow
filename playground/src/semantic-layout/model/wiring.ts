/**
 * Gravity auto-wiring — connections are DERIVED from structure, not drawn.
 *
 *  • Core lane is the spine: Start → … → End (linked in stage order).
 *  • A branch section (support / enrichment / advanced) diverges from a core
 *    node and merges back into core:
 *      - support      : in from the PREVIOUS core, out to the core it supports
 *      - enrichment/  : in from its core, out to the NEXT core
 *        advanced
 *  • The in-link's guard = the section's entryRule (so "show when …" drives the
 *    branch). Variants are just sibling branches with mutually-exclusive guards.
 *
 * Re-running autoWire after any move keeps the graph sensible for the student.
 */
import { type Course, type Link, type SectionNode, isSection } from './types';
import { describe } from './rules';

const lid = (source: string, target: string) => `a:${source}>${target}`;
const coreOf = (course: Course) =>
  course.nodes.filter(n => isSection(n) && n.lane === 'core').sort((a, b) => a.stage - b.stage) as SectionNode[];

/** Keep exactly one Start (first core) and one End (last core); create if empty. */
export function ensureCoreStartEnd(course: Course): void {
  const core = coreOf(course);
  if (core.length === 0) {
    course.nodes.push({ id: 'core-start', kind: 'section', lane: 'core', stage: 1, label: 'Start', isStart: true, pages: 1 } as SectionNode);
    course.nodes.push({ id: 'core-end', kind: 'section', lane: 'core', stage: 2, label: 'End', isEnd: true, pages: 1 } as SectionNode);
    return;
  }
  core.forEach(c => { c.isStart = false; c.isEnd = false; });
  core[0].isStart = true;
  core[core.length - 1].isEnd = true;
}

export function autoWire(course: Course): Link[] {
  const core = coreOf(course);
  const links: Link[] = [];

  // core spine
  for (let i = 0; i < core.length - 1; i++)
    links.push({ id: lid(core[i].id, core[i + 1].id), source: core[i].id, target: core[i + 1].id, kind: 'core' });

  const rev = [...core].reverse();
  const coreBefore = (s: number) => rev.find(c => c.stage < s);
  const coreAtOrBefore = (s: number) => rev.find(c => c.stage <= s);
  const coreAtOrAfter = (s: number) => core.find(c => c.stage >= s);
  const coreAfter = (s: number) => core.find(c => c.stage > s);

  // Branch lanes: chain consecutive same-lane sections into a multi-step path.
  // A run is a maximal sequence at stages s, s+1, s+2, …; same-stage sections or
  // a gap start a new run (so variants stay parallel, not chained).
  for (const L of ['support', 'enrichment', 'advanced'] as const) {
    const secs = (course.nodes.filter(n => isSection(n) && n.lane === L) as SectionNode[])
      .sort((a, b) => a.stage - b.stage || (a.order ?? 0) - (b.order ?? 0));
    const runs: SectionNode[][] = [];
    let cur: SectionNode[] = [];
    for (const s of secs) {
      if (cur.length && s.stage === cur[cur.length - 1].stage + 1) cur.push(s);
      else { if (cur.length) runs.push(cur); cur = [s]; }
    }
    if (cur.length) runs.push(cur);

    for (const run of runs) {
      const first = run[0], last = run[run.length - 1];
      const inFrom = L === 'support' ? coreBefore(first.stage) : coreAtOrBefore(first.stage); // enter from core (gated by the run's entry rule)
      if (inFrom && inFrom.id !== first.id)
        links.push({ id: lid(inFrom.id, first.id), source: inFrom.id, target: first.id, kind: L, guard: first.entryRule, label: first.entryRule ? describe(first.entryRule) : undefined });
      for (let i = 1; i < run.length; i++)                                                    // chain the steps
        links.push({ id: lid(run[i - 1].id, run[i].id), source: run[i - 1].id, target: run[i].id, kind: L });
      const outTo = L === 'support' ? coreAtOrAfter(last.stage) : coreAfter(last.stage);       // merge back once, at the end
      if (outTo && outTo.id !== last.id)
        links.push({ id: lid(last.id, outTo.id), source: last.id, target: outTo.id, kind: L });
    }
  }
  return links;
}

/* ── sense-check: does the student path make sense? ───────────────────────── */
export interface Issue { level: 'error' | 'warn'; msg: string; nodeId?: string }

export function validateCourse(course: Course): Issue[] {
  const issues: Issue[] = [];
  const core = coreOf(course);
  if (!core.some(c => c.isStart)) issues.push({ level: 'error', msg: 'Core has no Start' });
  if (!core.some(c => c.isEnd)) issues.push({ level: 'error', msg: 'Core has no End' });

  // structural reachability from Start (ignore guards)
  const out = new Map<string, string[]>();
  for (const l of course.links) (out.get(l.source) ?? out.set(l.source, []).get(l.source)!).push(l.target);
  const start = core.find(c => c.isStart);
  const seen = new Set<string>();
  const walk = (id: string) => { if (seen.has(id)) return; seen.add(id); (out.get(id) ?? []).forEach(walk); };
  if (start) walk(start.id);

  const inCount = new Map<string, number>();
  const outCount = new Map<string, number>();
  for (const l of course.links) {
    inCount.set(l.target, (inCount.get(l.target) ?? 0) + 1);
    outCount.set(l.source, (outCount.get(l.source) ?? 0) + 1);
  }
  for (const n of course.nodes) {
    if (!isSection(n)) continue;
    if (!seen.has(n.id)) issues.push({ level: 'warn', msg: `“${n.label}” is unreachable`, nodeId: n.id });
    else if (n.lane !== 'core' && !(outCount.get(n.id) ?? 0))
      issues.push({ level: 'warn', msg: `“${n.label}” is a dead-end (never merges back to core)`, nodeId: n.id });
  }
  return issues;
}
