/**
 * Semantic Grid Auto-Layout Type Definitions
 * Production-ready type system for learning path visualization
 */

export interface SemanticNode {
  id: string;
  type: 'section';
  data: {
    label: string;
    description?: string;
    pages?: number;
  };
  position: { x: number; y: number };
  measured?: boolean;
  width?: number;
  height?: number;
}

export interface SemanticEdge {
  id: string;
  source: string;
  target: string;
  type?: 'default' | 'base' | 'prerequisite' | 'extension';
}

export interface SemanticGraph {
  nodes: Map<string, SemanticNode>;
  edges: Map<string, SemanticEdge>;
  basePath: string[]; // Ordered array of node IDs representing the main learning path
}

export interface SemanticCoordinate {
  stage: number;      // Row (1-indexed)
  column: number;     // -n to +n (0 = base path)
}

export interface SemanticNodeWithCoordinate extends SemanticNode {
  semanticCoordinate: SemanticCoordinate;
  isBasePath: boolean;
  basePathOrder?: number;
}

export type ColumnType = 'base' | 'prerequisite' | 'extension';

export interface ColumnMetadata {
  type: ColumnType;
  depth: number;  // Distance from base path
}

export interface GridDimensions {
  columnWidths: Map<number, number>;
  rowHeights: Map<number, number>;
  columnOffsets: Map<number, number>;
  rowOffsets: Map<number, number>;
}

export interface LayoutState {
  semanticCoordinates: Map<string, SemanticCoordinate>;
  gridDimensions: GridDimensions;
  nodePositions: Map<string, { x: number; y: number }>;
  edgePaths?: Map<string, any>; // ELK routing data
}

export interface LayoutConfig {
  horizontalGap: number;   // 60px
  verticalGap: number;     // 40px
  minColumnWidth: number;  // 200px
  maxColumnWidth: number;  // 600px
  minRowHeight: number;    // 100px
  maxRowHeight: number;    // 300px
  canvasTopMargin: number; // 40px
  canvasCenterX: number;   // Will be computed
  canvasScale?: number;    // Canvas zoom/scale factor (default: 1.0)
  nodePadding?: number;    // Minimum padding between nodes (default: 10px)
}

/* ============================================================================
 * LANE MODEL — 4 pedagogical swimlanes (authored, not inferred)
 * The author assigns each section a `lane`; the system knows the pedagogy.
 * Order (left → right): support · core · enrichment · advanced
 * ==========================================================================*/

export type SectionLane = 'support' | 'core' | 'enrichment' | 'advanced';

export const LANE_ORDER: SectionLane[] = ['support', 'core', 'enrichment', 'advanced'];

export interface LaneDef {
  id: SectionLane;
  label: string;   // full name
  short: string;   // header short name
  blurb: string;   // pedagogical purpose (one line)
  icon: string;    // emoji glyph
  accent: string;  // strong color (border / header)
  soft: string;    // translucent band background
  text: string;    // header text color
}

export const LANES: Record<SectionLane, LaneDef> = {
  support: {
    id: 'support', label: 'Support', short: 'Support',
    blurb: 'For those who need help — scaffolding, remediation, prerequisites',
    icon: '🛟', accent: '#f59e0b', soft: 'rgba(245,158,11,0.07)', text: '#92400e',
  },
  core: {
    id: 'core', label: 'Core', short: 'Core',
    blurb: 'The base path everyone follows — the spine of the course',
    icon: '📘', accent: '#2563eb', soft: 'rgba(37,99,235,0.06)', text: '#1e40af',
  },
  enrichment: {
    id: 'enrichment', label: 'Enrichment', short: 'Enrichment',
    blurb: 'Broaden & connect — context, applications, related ideas',
    icon: '🌱', accent: '#7c3aed', soft: 'rgba(124,58,237,0.06)', text: '#5b21b6',
  },
  advanced: {
    id: 'advanced', label: 'Advanced', short: 'Advanced',
    blurb: 'For those who need a challenge — depth, theory, harder problems',
    icon: '🚀', accent: '#0d9488', soft: 'rgba(13,148,136,0.06)', text: '#115e59',
  },
};

export type LaneEdgeKind = 'core' | 'support' | 'enrichment' | 'advanced' | 'link';

export interface LaneSection {
  id: string;
  lane: SectionLane;
  stage: number;          // shared row index (core defines the canonical sequence)
  label: string;
  description?: string;
  pages?: number;
  isStart?: boolean;
  isEnd?: boolean;
  optional?: boolean;     // dashed treatment — not required for everyone
  // measured at runtime
  width?: number;
  height?: number;
}

export interface LaneEdge {
  id: string;
  source: string;
  target: string;
  kind?: LaneEdgeKind;    // defaults inferred from target lane
}

export interface LaneGraph {
  title?: string;
  sections: LaneSection[];
  edges: LaneEdge[];
}

export interface LaneLayoutConfig {
  laneWidth: number;      // expanded lane content width
  railWidth: number;      // collapsed lane width
  laneGap: number;        // gap between lanes
  innerPad: number;       // horizontal padding inside a lane
  nodeGap: number;        // vertical gap between stacked nodes in a cell
  stageGap: number;       // gap between stage rows
  topMargin: number;      // space above first row (under headers)
  headerHeight: number;   // lane header band height (canvas space)
  leftGutter: number;     // width of the stage-label gutter on the left
}

export interface LanePlacement {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LaneBand {
  id: SectionLane;
  x: number;
  width: number;
  collapsed: boolean;
  count: number;
}

export interface StageRow {
  stage: number;
  y: number;
  height: number;
}

export interface LaneLayoutResult {
  placements: Map<string, LanePlacement>;
  bands: LaneBand[];
  rows: StageRow[];
  contentTop: number;     // y where rows begin
  contentHeight: number;
  contentLeft: number;
  contentWidth: number;
}

