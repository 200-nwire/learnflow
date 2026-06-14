/**
 * Course store — the single source of truth. Plain reactive singleton (no Pinia
 * dependency). All mutations go through commands that snapshot for undo/redo, so
 * the editor is trustworthy: every change is reversible.
 */
import { reactive, ref, computed } from 'vue';
import { sampleCourse } from '../model/sampleCourse';
import type { Course, CourseNode, Link, SectionLane, LinkKind, Condition, Group, GroupMode } from '../model/types';
import { autoWire, ensureCoreStartEnd } from '../model/wiring';

let idc = 1000;
const nid = (p: string) => `${p}${++idc}`;
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

const state = reactive<Course>(clone(sampleCourse));
/** Derive all connections from structure (gravity wiring) + enforce core Start/End. */
function recomputeLinks() { ensureCoreStartEnd(state); state.links = autoWire(state); }
recomputeLinks(); // initial wiring

const selectedNodeId = ref<string | null>(null);
const selectedLinkId = ref<string | null>(null);
const selectedGroupId = ref<string | null>(null);

/* ── undo / redo ───────────────────────────────────────────────────────────*/
const undoStack: string[] = [];
const redoStack: string[] = [];
const canUndo = computed(() => undoStack.length > 0);
const canRedo = computed(() => redoStack.length > 0);

const snapshot = () => JSON.stringify({ nodes: state.nodes, links: state.links, groups: state.groups });
function commit() {
  undoStack.push(snapshot());
  if (undoStack.length > 100) undoStack.shift();
  redoStack.length = 0;
}
function restore(s: string) {
  const o = JSON.parse(s);
  state.nodes = o.nodes;
  state.links = o.links;
  state.groups = o.groups ?? [];
}
function undo() {
  if (!undoStack.length) return;
  redoStack.push(snapshot());
  restore(undoStack.pop()!);
}
function redo() {
  if (!redoStack.length) return;
  undoStack.push(snapshot());
  restore(redoStack.pop()!);
}

/* ── selectors ─────────────────────────────────────────────────────────────*/
const getNode = (id: string | null) => state.nodes.find(n => n.id === id);
const getLink = (id: string | null) => state.links.find(l => l.id === id);

/* ── node commands ─────────────────────────────────────────────────────────*/
function addSection(lane: SectionLane, stage: number): string {
  commit();
  const id = nid('s');
  state.nodes.push({ id, kind: 'section', lane, stage, label: 'New section', pages: 1 });
  recomputeLinks();
  select(id);
  return id;
}
function addDecision(lane: SectionLane, stage: number): string {
  commit();
  const id = nid('d');
  state.nodes.push({ id, kind: 'decision', lane, stage, prompt: 'Decision' });
  recomputeLinks();
  select(id);
  return id;
}
function updateNode(id: string, patch: Partial<CourseNode>) {
  const n = getNode(id);
  if (!n) return;
  commit();
  Object.assign(n, patch);
  recomputeLinks();
}
function moveNode(id: string, lane: SectionLane, stage: number) {
  updateNode(id, { lane, stage } as Partial<CourseNode>);
}
function setEntryRule(id: string, entryRule: Condition | undefined) {
  const n = getNode(id);
  if (!n || n.kind !== 'section') return;
  commit();
  (n as any).entryRule = entryRule;
  recomputeLinks();
}
function deleteNode(id: string) {
  commit();
  state.nodes = state.nodes.filter(n => n.id !== id);
  state.groups = state.groups.filter(g => g.id !== id);
  recomputeLinks();
  if (selectedNodeId.value === id) selectedNodeId.value = null;
}

/* ── link commands ─────────────────────────────────────────────────────────*/
function addLink(source: string, target: string, kind: LinkKind = 'branch'): string | null {
  if (source === target) return null;
  if (state.links.some(l => l.source === source && l.target === target)) return null;
  commit();
  const id = nid('l');
  const order = state.links.filter(l => l.source === source).length + 1;
  state.links.push({ id, source, target, kind, order });
  selectLink(id);
  return id;
}
function updateLink(id: string, patch: Partial<Link>) {
  const l = getLink(id);
  if (!l) return;
  commit();
  Object.assign(l, patch);
}
function deleteLink(id: string) {
  commit();
  state.links = state.links.filter(l => l.id !== id);
  if (selectedLinkId.value === id) selectedLinkId.value = null;
}

/* ── group / cell-tree commands ──────────────────────────────────────────────*/
const getGroup = (id: string | null) => state.groups.find(g => g.id === id);
function nextOrder(lane: SectionLane, stage: number, parentGroupId?: string): number {
  const peers = [
    ...state.nodes.filter(n => n.lane === lane && n.stage === stage && n.parentGroupId === parentGroupId),
    ...state.groups.filter(g => g.lane === lane && g.stage === stage && g.parentGroupId === parentGroupId),
  ];
  return peers.reduce((m, x) => Math.max(m, x.order ?? 0), 0) + 1;
}
function addGroup(lane: SectionLane, stage: number, mode: GroupMode, parentGroupId?: string): string {
  commit();
  const id = nid('g');
  state.groups.push({ id, lane, stage, mode, parentGroupId, order: nextOrder(lane, stage, parentGroupId), label: mode === 'one-of' ? 'Variants' : 'Sequence' });
  selectGroup(id);
  return id;
}
function updateGroup(id: string, patch: Partial<Group>) {
  const g = getGroup(id); if (!g) return;
  commit(); Object.assign(g, patch);
}
function deleteGroup(id: string) {
  const g = getGroup(id); if (!g) return;
  commit();
  for (const n of state.nodes) if (n.parentGroupId === id) n.parentGroupId = g.parentGroupId;
  for (const sg of state.groups) if (sg.parentGroupId === id) sg.parentGroupId = g.parentGroupId;
  state.groups = state.groups.filter(x => x.id !== id);
  if (selectedGroupId.value === id) selectedGroupId.value = null;
}
function setNodeGroup(nodeId: string, parentGroupId: string | undefined) {
  const n = getNode(nodeId); if (!n) return;
  commit();
  if (parentGroupId) { const g = getGroup(parentGroupId); if (g) { (n as any).lane = g.lane; n.stage = g.stage; } }
  n.parentGroupId = parentGroupId;
  n.order = nextOrder(n.lane, n.stage, parentGroupId);
}
function wrapInGroup(nodeId: string, mode: GroupMode): string | null {
  const n = getNode(nodeId); if (!n) return null;
  commit();
  const id = nid('g');
  state.groups.push({ id, lane: n.lane, stage: n.stage, mode, parentGroupId: n.parentGroupId, order: n.order ?? nextOrder(n.lane, n.stage, n.parentGroupId), label: mode === 'one-of' ? 'Variants' : 'Sequence' });
  n.parentGroupId = id; n.order = 1;
  selectGroup(id);
  return id;
}
function addSectionToGroup(groupId: string): string | undefined {
  const g = getGroup(groupId); if (!g) return;
  commit();
  const id = nid('s');
  state.nodes.push({ id, kind: 'section', lane: g.lane, stage: g.stage, parentGroupId: groupId, order: nextOrder(g.lane, g.stage, groupId), label: 'New variant', pages: 1 });
  select(id);
  return id;
}
/** Drag-and-drop placement: move a node into a target cell/group at an index. */
function dropNode(nodeId: string, target: { lane: SectionLane; stage: number; parentGroupId?: string; index: number }) {
  const n = getNode(nodeId); if (!n) return;
  commit();
  (n as any).lane = target.lane; n.stage = target.stage; n.parentGroupId = target.parentGroupId;
  const sibs = [
    ...state.nodes.filter(x => x.id !== nodeId && x.lane === target.lane && x.stage === target.stage && x.parentGroupId === target.parentGroupId),
    ...state.groups.filter(g => g.lane === target.lane && g.stage === target.stage && g.parentGroupId === target.parentGroupId),
  ].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) as { order?: number }[];
  const idx = Math.max(0, Math.min(target.index, sibs.length));
  sibs.splice(idx, 0, n as { order?: number });
  sibs.forEach((x, i) => { x.order = i + 1; });
  recomputeLinks();
}

/* ── selection ─────────────────────────────────────────────────────────────*/
function select(id: string | null) { selectedNodeId.value = id; selectedLinkId.value = null; selectedGroupId.value = null; }
function selectLink(id: string | null) { selectedLinkId.value = id; selectedNodeId.value = null; selectedGroupId.value = null; }
function selectGroup(id: string | null) { selectedGroupId.value = id; selectedNodeId.value = null; selectedLinkId.value = null; }
function clearSelection() { selectedNodeId.value = null; selectedLinkId.value = null; selectedGroupId.value = null; }

const selectedNode = computed(() => getNode(selectedNodeId.value));
const selectedLink = computed(() => getLink(selectedLinkId.value));
const selectedGroup = computed(() => getGroup(selectedGroupId.value));

export function useCourse() {
  return {
    state,
    selectedNodeId, selectedLinkId, selectedGroupId, selectedNode, selectedLink, selectedGroup,
    getNode, getLink, getGroup,
    addSection, addDecision, updateNode, moveNode, setEntryRule, deleteNode,
    addLink, updateLink, deleteLink,
    addGroup, updateGroup, deleteGroup, setNodeGroup, wrapInGroup, addSectionToGroup, dropNode,
    select, selectLink, selectGroup, clearSelection,
    undo, redo, canUndo, canRedo,
  };
}
