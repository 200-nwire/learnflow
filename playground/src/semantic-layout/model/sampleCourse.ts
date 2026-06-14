import type { Course } from './types';

/**
 * Demo: an intro course that adapts to the learner profile.
 *  • SECTION entry rules  → Refresher shows only when mastery is low.
 *  • DECISION node        → after Variables, a "Mastery check" forks 3 ways.
 *  • CONDITIONAL links    → guarded transitions out of the decision.
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
    { id: 'c1', kind: 'section', lane: 'core', stage: 1, label: 'Course Introduction', pages: 3, isStart: true, description: 'How the course works.' },
    { id: 'c2', kind: 'section', lane: 'core', stage: 2, label: 'Variables & Data Types', pages: 12, skill: 'variables', description: 'Numbers, strings, booleans.' },
    { id: 'dc', kind: 'decision', lane: 'core', stage: 3, prompt: 'Mastery check' },
    { id: 'c3', kind: 'section', lane: 'core', stage: 4, label: 'Data Structures', pages: 18, skill: 'structures', description: 'Lists, dicts, sets, tuples.' },
    { id: 'c4', kind: 'section', lane: 'core', stage: 5, label: 'Functions & Modules', pages: 15, skill: 'functions', description: 'Scope and imports.' },
    { id: 'c5', kind: 'section', lane: 'core', stage: 6, label: 'Build a CLI App', pages: 10, isEnd: true, description: 'Put it together.' },

    // support — entry rule: only when math/variables mastery is low
    { id: 's1', kind: 'section', lane: 'support', stage: 2, label: 'Math Refresher', pages: 8, optional: true, skill: 'math',
      description: 'Shown when foundations are shaky.',
      entryRule: { type: 'cmp', field: { kind: 'mastery', skill: 'math' }, op: '<', value: 0.6 } },
    { id: 's2', kind: 'section', lane: 'support', stage: 4, label: 'Thinking in Collections', pages: 6, optional: true,
      description: 'Gentle on-ramp to data structures.',
      entryRule: { type: 'cmp', field: { kind: 'mastery', skill: 'variables' }, op: '<', value: 0.7 } },

    // enrichment — always-on broadening
    { id: 'e1', kind: 'section', lane: 'enrichment', stage: 2, label: 'Where Types Show Up', pages: 5, description: 'Real-world examples.' },
    { id: 'e2', kind: 'section', lane: 'enrichment', stage: 4, label: 'Choosing a Structure', pages: 7, description: 'List vs dict, when & why.' },

    // advanced — entry rule: high score only
    { id: 'a1', kind: 'section', lane: 'advanced', stage: 4, label: 'Advanced Collections', pages: 14,
      description: 'Comprehensions, generators, perf.',
      entryRule: { type: 'cmp', field: { kind: 'score' }, op: '>=', value: 85 } },
    { id: 'a2', kind: 'section', lane: 'advanced', stage: 5, label: 'Decorators & Closures', pages: 8,
      description: 'Higher-order functions in depth.',
      entryRule: { type: 'cmp', field: { kind: 'score' }, op: '>=', value: 85 } },
  ],
  links: [
    { id: 'k1', source: 'c1', target: 'c2', kind: 'core' },
    { id: 'k2', source: 'c2', target: 'dc', kind: 'core' },

    // decision fork (conditional links, first-match-wins)
    { id: 'b1', source: 'dc', target: 's2', kind: 'branch', order: 1, label: 'needs help',
      guard: { type: 'cmp', field: { kind: 'mastery', skill: 'variables' }, op: '<', value: 0.5 } },
    { id: 'b2', source: 'dc', target: 'a1', kind: 'branch', order: 2, label: 'flying',
      guard: { type: 'cmp', field: { kind: 'score' }, op: '>=', value: 85 } },
    { id: 'b3', source: 'dc', target: 'c3', kind: 'core', order: 3, label: 'else → continue' },

    { id: 'k4', source: 'c3', target: 'c4', kind: 'core' },
    { id: 'k5', source: 'c4', target: 'c5', kind: 'core' },

    // support feeds the moment it scaffolds
    { id: 'sp1', source: 's1', target: 'c2', kind: 'support' },
    { id: 'sp2', source: 's2', target: 'c3', kind: 'support' },

    // enrichment branches off core
    { id: 'en1', source: 'c2', target: 'e1', kind: 'enrichment' },
    { id: 'en2', source: 'c3', target: 'e2', kind: 'enrichment' },

    // advanced chain
    { id: 'ad1', source: 'a1', target: 'a2', kind: 'advanced' },
  ],
};
