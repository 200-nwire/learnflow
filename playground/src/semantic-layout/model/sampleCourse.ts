import type { Course } from './types';

const score = (op: '<' | '>=', value: number) => ({ type: 'cmp' as const, field: { kind: 'score' as const }, op, value });
const mastery = (skill: string, op: '<' | '>=', value: number) => ({ type: 'cmp' as const, field: { kind: 'mastery' as const, skill }, op, value });

/**
 * Gravity model: a core spine + branches that auto-wire and merge back.
 * Links are DERIVED by autoWire() (see store init) — none are authored here.
 * Variants = sibling branches with mutually-exclusive conditions (Worked < 60 /
 * Standard ≥ 60). Support is remediation; advanced is challenge.
 */
export const sampleCourse: Course = {
  title: 'Intro to Python — Adaptive Path',
  skills: [
    { id: 'math', label: 'Math sense' },
    { id: 'variables', label: 'Variables' },
    { id: 'structures', label: 'Data structures' },
    { id: 'functions', label: 'Functions' },
  ],
  profile: { mastery: { math: 0.8, variables: 0.5, structures: 0.6, functions: 0.5 }, score: 78 },
  nodes: [
    // core spine (Start/End auto-assigned to first/last)
    { id: 'c1', kind: 'section', lane: 'core', stage: 1, label: 'Course Introduction', pages: 3, description: 'How the course works.' },
    { id: 'c2', kind: 'section', lane: 'core', stage: 2, label: 'Variables & Data Types', pages: 12, skill: 'variables', description: 'Numbers, strings, booleans.' },
    { id: 'c3', kind: 'section', lane: 'core', stage: 3, label: 'Data Structures', pages: 18, skill: 'structures', description: 'Lists, dicts, sets, tuples.' },
    { id: 'c4', kind: 'section', lane: 'core', stage: 4, label: 'Functions & Modules', pages: 15, skill: 'functions', description: 'Scope and imports.' },
    { id: 'c5', kind: 'section', lane: 'core', stage: 5, label: 'Build a CLI App', pages: 10, description: 'Put it together.' },

    // support — remediation branches (shown when struggling)
    { id: 's1', kind: 'section', lane: 'support', stage: 2, label: 'Math Refresher', pages: 8, optional: true,
      description: 'Before variables, if math is shaky.', entryRule: mastery('math', '<', 0.6) },
    { id: 's2', kind: 'section', lane: 'support', stage: 3, label: 'Thinking in Collections', pages: 6, optional: true,
      description: 'Gentle on-ramp to data structures.', entryRule: mastery('variables', '<', 0.5) },

    // enrichment — variants at stage 2 (mutually exclusive) + a lateral extension
    { id: 'ew', kind: 'section', lane: 'enrichment', stage: 2, label: 'Worked Example', pages: 4,
      description: 'Step-by-step, when score is low.', entryRule: score('<', 60) },
    { id: 'es', kind: 'section', lane: 'enrichment', stage: 2, label: 'Standard Example', pages: 4,
      description: 'The default walkthrough.', entryRule: score('>=', 60) },
    { id: 'e2', kind: 'section', lane: 'enrichment', stage: 3, label: 'Choosing a Structure', pages: 7,
      description: 'List vs dict, when & why.' },

    // advanced — challenge branches (high score only)
    { id: 'a1', kind: 'section', lane: 'advanced', stage: 3, label: 'Advanced Collections', pages: 14,
      description: 'Comprehensions, generators, perf.', entryRule: score('>=', 85) },
    { id: 'a2', kind: 'section', lane: 'advanced', stage: 4, label: 'Decorators & Closures', pages: 8,
      description: 'Higher-order functions in depth.', entryRule: score('>=', 85) },
  ],
  groups: [],
  links: [], // derived by autoWire()
};
