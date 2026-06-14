/**
 * Pure rule engine — evaluate conditions against a learner profile, and derive
 * the "active path" (which sections are eligible and which links fire).
 * No Vue, no side effects → trivially testable and worker-safe.
 */
import {
  type Condition, type Comparison, type Field, type LearnerProfile,
  type Course, type CourseNode, type Link, type GroupMode, isSection,
} from './types';

/* ── field resolution ─────────────────────────────────────────────────────*/
function resolve(field: Field, p: LearnerProfile): number | string | boolean | undefined {
  switch (field.kind) {
    case 'mastery':   return p.mastery[field.skill] ?? 0;
    case 'score':     return p.score;
    case 'completed': return !!p.completed[field.sectionId];
    case 'outcome':   return !!p.outcomes[field.key];
    case 'attempts':  return p.attempts[field.sectionId] ?? 0;
    case 'var':       return p.vars[field.name];
  }
}

function compare(a: any, op: Comparison['op'], b: any): boolean {
  switch (op) {
    case '<':  return a <  b;
    case '<=': return a <= b;
    case '>':  return a >  b;
    case '>=': return a >= b;
    case '==': return a === b;
    case '!=': return a !== b;
  }
}

export function evaluate(cond: Condition | undefined, p: LearnerProfile): boolean {
  if (!cond || cond.type === 'always') return true;
  if (cond.type === 'cmp') return compare(resolve(cond.field, p), cond.op, cond.value);
  if (cond.type === 'all') return cond.of.every(c => evaluate(c, p));
  if (cond.type === 'any') return cond.of.some(c => evaluate(c, p));
  return true;
}

/** Human-readable condition (for link/decision labels). */
export function describe(cond: Condition | undefined): string {
  if (!cond || cond.type === 'always') return 'always';
  if (cond.type === 'cmp') return `${fieldLabel(cond.field)} ${cond.op} ${cond.value}`;
  if (cond.type === 'all') return cond.of.map(describe).join(' AND ');
  if (cond.type === 'any') return cond.of.map(describe).join(' OR ');
  return '';
}
function fieldLabel(f: Field): string {
  switch (f.kind) {
    case 'mastery':   return `mastery(${f.skill})`;
    case 'score':     return 'score';
    case 'completed': return `done(${f.sectionId})`;
    case 'outcome':   return `outcome(${f.key})`;
    case 'attempts':  return `attempts(${f.sectionId})`;
    case 'var':       return f.name;
  }
}

/* ── active-path derivation ───────────────────────────────────────────────*/
export interface ActivePath {
  sections: Set<string>;   // eligible AND reached
  links: Set<string>;      // links that fire
  eligible: Set<string>;   // entryRule passes (independent of reach)
}

/* ── cell-tree selection: which sections are "shown" given group modes ─────*/
interface SelNode { id: string; isGroup: boolean; mode?: GroupMode; order: number; children: SelNode[]; node?: CourseNode; }

/**
 * Resolve every cell's tree against the profile:
 *  - 'all' groups show all showable children (in order)
 *  - 'one-of' groups show the FIRST showable child (variants)
 *  - a section is showable when its entryRule passes; a group when any child is
 * Returns the set of section/decision ids that are actually shown.
 */
export function resolveCellSelection(course: Course, p: LearnerProfile): Set<string> {
  const gnode: Record<string, SelNode> = {};
  for (const g of course.groups) gnode[g.id] = { id: g.id, isGroup: true, mode: g.mode, order: g.order ?? 0, children: [] };
  const roots: SelNode[] = [];
  for (const g of course.groups) {
    const n = gnode[g.id];
    (g.parentGroupId && gnode[g.parentGroupId] ? gnode[g.parentGroupId].children : roots).push(n);
  }
  for (const cn of course.nodes) {
    const n: SelNode = { id: cn.id, isGroup: false, order: cn.order ?? 0, children: [], node: cn };
    (cn.parentGroupId && gnode[cn.parentGroupId] ? gnode[cn.parentGroupId].children : roots).push(n);
  }
  const sortRec = (ns: SelNode[]) => { ns.sort((a, b) => a.order - b.order); ns.forEach(x => sortRec(x.children)); };
  sortRec(roots);

  const showable = (n: SelNode): boolean =>
    !n.isGroup ? (n.node && isSection(n.node) ? evaluate(n.node.entryRule, p) : true) : n.children.some(showable);

  const selected = new Set<string>();
  const collect = (n: SelNode) => {
    if (!n.isGroup) { if (showable(n)) selected.add(n.id); return; }
    if (n.mode === 'one-of') { const pick = n.children.find(showable); if (pick) collect(pick); }
    else n.children.forEach(collect);
  };
  roots.forEach(collect);
  return selected;
}

/**
 * Walk the course from its start nodes, honouring:
 *  - section entryRule + cell-tree selection (eligibility)
 *  - guarded links (first-match-wins among siblings sharing a source)
 *  - decision nodes route purely via their guarded outgoing links
 */
export function deriveActivePath(course: Course, p: LearnerProfile): ActivePath {
  const byId = new Map(course.nodes.map(n => [n.id, n]));
  const eligible = resolveCellSelection(course, p);

  const outBySource = new Map<string, Link[]>();
  for (const l of course.links) {
    (outBySource.get(l.source) ?? outBySource.set(l.source, []).get(l.source)!).push(l);
  }

  const starts = course.nodes.filter(n => isSection(n) && (n as any).isStart).map(n => n.id);
  const roots = starts.length ? starts : course.nodes.length ? [course.nodes[0].id] : [];

  const sections = new Set<string>();
  const links = new Set<string>();
  const seen = new Set<string>();

  const reach = (id: string) => {
    if (seen.has(id)) return;
    seen.add(id);
    const node = byId.get(id);
    if (!node) return;
    if (eligible.has(id) && isSection(node)) sections.add(id);

    // gravity model: every outgoing link whose guard passes fires independently
    // (an unguarded link is always taken — e.g. the core spine)
    for (const l of outBySource.get(id) ?? []) {
      if (!evaluate(l.guard, p)) continue;
      const targetNode = byId.get(l.target);
      if (!targetNode) continue;
      if (isSection(targetNode) && !eligible.has(l.target)) continue; // ineligible target blocks
      links.add(l.id);
      reach(l.target);
    }
  };

  roots.forEach(reach);
  return { sections, links, eligible };
}
