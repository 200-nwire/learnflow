/**
 * Course store — the single source of truth. Plain reactive singleton (no Pinia
 * dependency). All mutations go through commands that snapshot for undo/redo, so
 * the editor is trustworthy: every change is reversible.
 */
import { reactive, ref, computed } from 'vue';
import { sampleCourse } from '../model/sampleCourse';
import type { Course, CourseNode, Link, SectionLane, LinkKind, Condition } from '../model/types';

let idc = 1000;
const nid = (p: string) => `${p}${++idc}`;
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

const state = reactive<Course>(clone(sampleCourse));
const selectedNodeId = ref<string | null>(null);
const selectedLinkId = ref<string | null>(null);

/* ── undo / redo ───────────────────────────────────────────────────────────*/
const undoStack: string[] = [];
const redoStack: string[] = [];
const canUndo = computed(() => undoStack.length > 0);
const canRedo = computed(() => redoStack.length > 0);

const snapshot = () => JSON.stringify({ nodes: state.nodes, links: state.links });
function commit() {
  undoStack.push(snapshot());
  if (undoStack.length > 100) undoStack.shift();
  redoStack.length = 0;
}
function restore(s: string) {
  const o = JSON.parse(s);
  state.nodes = o.nodes;
  state.links = o.links;
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
  select(id);
  return id;
}
function addDecision(lane: SectionLane, stage: number): string {
  commit();
  const id = nid('d');
  state.nodes.push({ id, kind: 'decision', lane, stage, prompt: 'Decision' });
  select(id);
  return id;
}
function updateNode(id: string, patch: Partial<CourseNode>) {
  const n = getNode(id);
  if (!n) return;
  commit();
  Object.assign(n, patch);
}
function moveNode(id: string, lane: SectionLane, stage: number) {
  updateNode(id, { lane, stage } as Partial<CourseNode>);
}
function setEntryRule(id: string, entryRule: Condition | undefined) {
  const n = getNode(id);
  if (!n || n.kind !== 'section') return;
  commit();
  (n as any).entryRule = entryRule;
}
function deleteNode(id: string) {
  commit();
  state.nodes = state.nodes.filter(n => n.id !== id);
  state.links = state.links.filter(l => l.source !== id && l.target !== id);
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

/* ── selection ─────────────────────────────────────────────────────────────*/
function select(id: string | null) { selectedNodeId.value = id; selectedLinkId.value = null; }
function selectLink(id: string | null) { selectedLinkId.value = id; selectedNodeId.value = null; }
function clearSelection() { selectedNodeId.value = null; selectedLinkId.value = null; }

const selectedNode = computed(() => getNode(selectedNodeId.value));
const selectedLink = computed(() => getLink(selectedLinkId.value));

export function useCourse() {
  return {
    state,
    selectedNodeId, selectedLinkId, selectedNode, selectedLink,
    getNode, getLink,
    addSection, addDecision, updateNode, moveNode, setEntryRule, deleteNode,
    addLink, updateLink, deleteLink,
    select, selectLink, clearSelection,
    undo, redo, canUndo, canRedo,
  };
}
