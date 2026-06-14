import type { Course } from './types';

const score = (op: '<' | '>=', value: number) => ({ type: 'cmp' as const, field: { kind: 'score' as const }, op, value });
const mastery = (skill: string, op: '<' | '>=', value: number) => ({ type: 'cmp' as const, field: { kind: 'mastery' as const, skill }, op, value });

/**
 * Gravity model with multi-step branches. Links are DERIVED (autoWire):
 *  • core spine c1…c6
 *  • support / single-step detours (remediation)
 *  • enrichment: stage-2 variants (one-of by score) + a 2-step chain (4→5)
 *  • advanced: a 3-step chain (3→4→5), entered only when score ≥ 85
 * Consecutive same-lane sections chain into one path that merges back at the end.
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
    // core spine
    { id: 'c1', kind: 'section', lane: 'core', stage: 1, label: 'Course Introduction', pages: 3, description: 'How the course works.' },
    { id: 'c2', kind: 'section', lane: 'core', stage: 2, label: 'Variables & Data Types', pages: 12, skill: 'variables', description: 'Numbers, strings, booleans.' },
    { id: 'c3', kind: 'section', lane: 'core', stage: 3, label: 'Data Structures', pages: 18, skill: 'structures', description: 'Lists, dicts, sets, tuples.' },
    { id: 'c4', kind: 'section', lane: 'core', stage: 4, label: 'Functions & Modules', pages: 15, skill: 'functions', description: 'Scope and imports.' },
    { id: 'c5', kind: 'section', lane: 'core', stage: 5, label: 'Files & Errors', pages: 10, description: 'IO and exceptions.' },
    { id: 'c6', kind: 'section', lane: 'core', stage: 6, label: 'Build a CLI App', pages: 10, description: 'Put it together.' },

    // support — single-step remediation detours
    { id: 's1', kind: 'section', lane: 'support', stage: 2, label: 'Math Refresher', pages: 8, optional: true,
      description: 'Before variables, if math is shaky.', entryRule: mastery('math', '<', 0.6) },
    { id: 's2', kind: 'section', lane: 'support', stage: 4, label: 'Logic Review', pages: 6, optional: true,
      description: 'Booleans & conditions, gently.', entryRule: mastery('variables', '<', 0.5) },

    // enrichment — stage-2 variants (one-of) + a 2-step chain (always-on broadening)
    { id: 'ew', kind: 'section', lane: 'enrichment', stage: 2, label: 'Worked Example', pages: 4, description: 'Step-by-step, when score is low.', entryRule: score('<', 60) },
    { id: 'es', kind: 'section', lane: 'enrichment', stage: 2, label: 'Standard Example', pages: 4, description: 'The default walkthrough.', entryRule: score('>=', 60) },
    { id: 'en1', kind: 'section', lane: 'enrichment', stage: 4, label: 'Real-World Applications', pages: 6, description: 'Where this shows up in practice.' },
    { id: 'en2', kind: 'section', lane: 'enrichment', stage: 5, label: 'Case Study', pages: 7, description: 'A worked real example, end to end.' },

    // advanced — a 3-step challenge chain, entered only when flying (score ≥ 85)
    { id: 'a1', kind: 'section', lane: 'advanced', stage: 3, label: 'Advanced Collections', pages: 14, description: 'Comprehensions & performance.', entryRule: score('>=', 85) },
    { id: 'a2', kind: 'section', lane: 'advanced', stage: 4, label: 'Generators & Iterators', pages: 10, description: 'Lazy evaluation.' },
    { id: 'a3', kind: 'section', lane: 'advanced', stage: 5, label: 'Decorators & Closures', pages: 8, description: 'Higher-order functions in depth.' },
  ],
  groups: [],
  links: [], // derived by autoWire()
};
