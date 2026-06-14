/**
 * Semantic-layout domain model (framework-free).
 *
 * One condition language evaluated against a LearnerProfile powers all three
 * branching surfaces:
 *   • a guarded LINK            → conditional transition (if / elif / else)
 *   • a DECISION node           → an explicit fork whose outputs are guarded links
 *   • a SECTION entryRule       → "show when" eligibility
 */
import { LANES, LANE_ORDER, type SectionLane, type LaneDef } from '../../types/semantic-layout';

export { LANES, LANE_ORDER };
export type { SectionLane, LaneDef };

/* ── Learner profile ──────────────────────────────────────────────────────*/
export interface LearnerProfile {
  /** skill/topic → mastery 0..1 */
  mastery: Record<string, number>;
  /** last assessment score 0..100 */
  score: number;
  /** objective key → achieved */
  outcomes: Record<string, boolean>;
  /** sectionId → completed */
  completed: Record<string, boolean>;
  /** sectionId → attempt count */
  attempts: Record<string, number>;
  /** free-form numeric/string/bool variables */
  vars: Record<string, number | string | boolean>;
}

export function emptyProfile(): LearnerProfile {
  return { mastery: {}, score: 0, outcomes: {}, completed: {}, attempts: {}, vars: {} };
}

/* ── Conditions (predicate tree) ──────────────────────────────────────────*/
export type CompareOp = '<' | '<=' | '>' | '>=' | '==' | '!=';

export type Field =
  | { kind: 'mastery'; skill: string }
  | { kind: 'score' }
  | { kind: 'completed'; sectionId: string }
  | { kind: 'outcome'; key: string }
  | { kind: 'attempts'; sectionId: string }
  | { kind: 'var'; name: string };

export interface Comparison {
  type: 'cmp';
  field: Field;
  op: CompareOp;
  value: number | string | boolean;
}
export interface BoolGroup {
  type: 'all' | 'any'; // AND / OR
  of: Condition[];
}
export interface Always { type: 'always'; }
export type Condition = Comparison | BoolGroup | Always;

export const ALWAYS: Always = { type: 'always' };

/* ── Graph: nodes (sections / decisions) + links ──────────────────────────*/
export type NodeKind = 'section' | 'decision';

export interface BaseNode {
  id: string;
  kind: NodeKind;
  lane: SectionLane;
  stage: number;
  /** containing group inside the cell (undefined ⇒ direct cell child) */
  parentGroupId?: string;
  /** ordering among siblings in the same group/cell */
  order?: number;
  width?: number;
  height?: number;
}

export interface SectionNode extends BaseNode {
  kind: 'section';
  label: string;
  description?: string;
  pages?: number;
  skill?: string;           // skill this section builds (for mastery tracking)
  isStart?: boolean;
  isEnd?: boolean;
  optional?: boolean;
  /** eligibility: section is only offered when this passes (default: always) */
  entryRule?: Condition;
}

export interface DecisionNode extends BaseNode {
  kind: 'decision';
  prompt: string;           // e.g. "Mastery check"
}

export type CourseNode = SectionNode | DecisionNode;

export type LinkKind = 'core' | 'support' | 'enrichment' | 'advanced' | 'branch';

export interface Link {
  id: string;
  source: string;
  target: string;
  kind?: LinkKind;
  /** guard: link is taken only when this passes (undefined ⇒ always / default) */
  guard?: Condition;
  label?: string;           // author label, e.g. "score < 70"
  /** ordering among sibling guarded links sharing a source (first match wins) */
  order?: number;
  /** user-drawn link — preserved across auto re-wiring */
  manual?: boolean;
}

/* ── Cell trees: groups of sections (variations / sequences) ───────────────*/
export type GroupMode =
  | 'one-of'   // learner profile / rules pick ONE child (variants)
  | 'all';     // every child is shown, in order (sequence)

export interface Group {
  id: string;
  lane: SectionLane;
  stage: number;
  mode: GroupMode;
  parentGroupId?: string;   // nested group (undefined ⇒ direct cell child)
  order: number;
  label?: string;
}

export interface Course {
  title?: string;
  nodes: CourseNode[];
  links: Link[];
  groups: Group[];
  /** auto links the user removed/overrode, keyed "source>target" */
  suppressed?: string[];
  /** seed/default learner profile for the simulator */
  profile?: Partial<LearnerProfile>;
  /** skills catalog (for mastery sliders) */
  skills?: { id: string; label: string }[];
}

/* ── type guards ──────────────────────────────────────────────────────────*/
export const isSection = (n: CourseNode): n is SectionNode => n.kind === 'section';
export const isDecision = (n: CourseNode): n is DecisionNode => n.kind === 'decision';
