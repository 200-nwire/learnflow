/**
 * Pure rule engine — evaluate conditions against a learner profile, and derive
 * the "active path" (which sections are eligible and which links fire).
 * No Vue, no side effects → trivially testable and worker-safe.
 */
import {
  type Condition, type Comparison, type Field, type LearnerProfile,
  type Course, type CourseNode, type Link, isSection,
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

/**
 * Walk the course from its start nodes, honouring:
 *  - section entryRule (eligibility)
 *  - guarded links (first-match-wins among siblings sharing a source)
 *  - decision nodes route purely via their guarded outgoing links
 */
export function deriveActivePath(course: Course, p: LearnerProfile): ActivePath {
  const byId = new Map(course.nodes.map(n => [n.id, n]));
  const eligible = new Set<string>(
    course.nodes.filter(n => !isSection(n) || evaluate(n.entryRule, p)).map(n => n.id),
  );

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

    const outs = (outBySource.get(id) ?? []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    // partition: guarded (conditional) vs plain (always/default)
    const guarded = outs.filter(l => l.guard && l.guard.type !== 'always');
    const plain = outs.filter(l => !l.guard || l.guard.type === 'always');

    // first guarded whose condition passes wins its "branch group"
    const firstPass = guarded.find(l => evaluate(l.guard, p));
    const taken: Link[] = [];
    if (firstPass) taken.push(firstPass);
    // plain links always fire (core progression / unconditional enrichment)
    taken.push(...plain);
    // if no guarded passed and there were guards, the plain ones act as 'else'

    for (const l of taken) {
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
