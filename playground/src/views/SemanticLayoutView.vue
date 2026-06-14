<template>
  <div class="lane-view">
    <!-- Toolbar -->
    <header class="toolbar">
      <div class="tb-left">
        <h1>{{ course.state.title }}</h1>
        <p>4 lanes · adaptive · worker-offloaded layout</p>
      </div>

      <div class="legend">
        <button v-for="band in bands" :key="band.id" class="chip" :class="{ collapsed: band.collapsed }"
          :style="{ '--accent': LANES[band.id].accent }" :title="LANES[band.id].blurb"
          @click="toggleLane(band.id)">
          <span>{{ LANES[band.id].icon }}</span>
          <span class="cn">{{ LANES[band.id].short }}</span>
          <span class="cc">{{ band.count }}</span>
        </button>
      </div>

      <div class="tb-actions">
        <button class="btn round" @click="showHelp = true" title="How this works — theory &amp; guides">?</button>
        <button class="btn" :disabled="!course.canUndo.value" @click="course.undo()" title="Undo (⌘Z)">↶</button>
        <button class="btn" :disabled="!course.canRedo.value" @click="course.redo()" title="Redo (⇧⌘Z)">↷</button>
        <button class="btn" @click="addDecisionQuick" title="Add a decision fork">◆ Decision</button>
        <button class="btn" @click="toggleExtras">{{ extrasCollapsed ? 'Show extras' : 'Focus core' }}</button>
        <button class="btn" :class="{ on: showFlow }" @click="showFlow = !showFlow" title="Show the resolved learner journey">Flow ▸</button>
        <span class="vsep" />
        <button class="btn sm" :class="{ on: view.lanes }" @click="view.lanes = !view.lanes" title="Show / hide lanes">Lanes</button>
        <button class="btn sm" :class="{ on: view.stages }" @click="view.stages = !view.stages" title="Show / hide stages">Stages</button>
        <button class="btn sm" :class="{ on: view.edges }" @click="view.edges = !view.edges" title="Show / hide flows">Edges</button>
        <button class="btn sm" :class="{ on: view.edgesTop }" @click="view.edgesTop = !view.edgesTop" title="Draw flows above sections">⬆ top</button>
        <button class="btn sm" @click="flowsOnly" title="Declutter — just sections &amp; flows">Flows only</button>
        <button class="btn sm" :class="{ on: mode === 'dag' }" @click="toggleMode" title="See the whole flow as one directed graph">DAG</button>
        <button class="btn primary" @click="doFit">Fit</button>
      </div>
    </header>

    <!-- Body: canvas + inspector -->
    <div class="body">
      <div class="canvas">
        <VueFlow
          v-model:nodes="flowNodes"
          :edges="view.edges ? displayEdges : []"
          :node-types="nodeTypes"
          :edge-types="edgeTypes"
          :nodes-draggable="mode === 'grid'"
          :nodes-connectable="false"
          :default-viewport="{ zoom: 0.82, x: 0, y: 0 }"
          :min-zoom="0.2" :max-zoom="2.5"
          :class="['flow', { hovering: !!hovered, dragging: !!draggingId, 'edges-top': view.edgesTop }]"
          @nodes-change="onNodesChange"
          @connect="onConnect"
          @edge-click="onEdgeClick"
          @pane-click="course.clearSelection()"
          @node-drag-start="onDragStart"
          @node-drag="onDrag"
          @node-drag-stop="onDragStop"
        >
          <Background :gap="22" pattern-color="#eef1f6" />
          <Controls :show-interactive="false" />
          <MiniMap pannable zoomable :node-color="miniColor" />

          <template #node-section="n"><SectionNode :data="n.data" :node-id="n.id" /></template>
          <template #node-decision="n"><DecisionNode :data="n.data" :node-id="n.id" /></template>

          <!-- Canvas-space overlay: bands, rows, gutter, ghost add-cells -->
          <div class="overlay-wrap">
            <div class="overlay" :style="overlayStyle">
              <div v-for="band in bands" :key="'b' + band.id" v-show="view.lanes && mode === 'grid'" class="band" :class="{ collapsed: band.collapsed }"
                :style="bandStyle(band)">
                <div v-if="band.collapsed" class="rail">
                  <span class="ri">{{ LANES[band.id].icon }}</span>
                  <span class="rt">{{ LANES[band.id].short }}</span>
                </div>
              </div>

              <!-- drag-and-drop target indicator -->
              <template v-if="dropHint">
                <div class="drop-cell" :style="dropCellStyle" />
                <div class="drop-line" :style="dropLineStyle" />
              </template>

              <template v-for="row in rows" :key="'r' + row.stage">
                <div v-show="view.stages && mode === 'grid'" class="rowsep" :style="{ top: row.y - 20 + 'px', width: contentWidth + 'px' }" />
                <div v-show="view.stages && mode === 'grid'" class="slabel" :style="{ top: row.y + 'px', height: row.height + 'px' }">
                  <span class="sn">{{ row.stage }}</span><span class="sw">stage</span>
                </div>
              </template>

              <!-- ghost add-cells in empty (lane, stage) cells -->
              <button v-for="g in ghosts" :key="g.key" v-show="mode === 'grid'" class="ghost"
                :style="{ left: g.x + 'px', top: g.y + 'px', width: g.w + 'px', height: g.h + 'px' }"
                @click="course.addSection(g.lane, g.stage)">+ add {{ g.lane }}</button>

              <!-- add a new stage -->
              <button class="ghost addstage" v-show="mode === 'grid'" :style="addStageStyle" @click="addStage">+ add stage</button>
            </div>
          </div>
        </VueFlow>

        <!-- Sticky lane headers -->
        <div v-show="view.lanes" class="sticky">
          <div v-for="h in headerScreens" :key="'h' + h.id" class="lh" :class="{ collapsed: h.collapsed }"
            :style="{ left: h.left + 'px', width: h.width + 'px', '--accent': LANES[h.id].accent }">
            <span class="lhi" @click="toggleLane(h.id)">{{ LANES[h.id].icon }}</span>
            <span v-if="!h.collapsed" class="lht" @click="toggleLane(h.id)">
              <span class="lhn">{{ LANES[h.id].label }}</span>
              <span class="lhb">{{ LANES[h.id].blurb }}</span>
            </span>
            <span class="lhc">{{ h.count }}</span>
            <button v-if="!h.collapsed" class="lhadd" title="Add a section in this lane" @click.stop="addInLane(h.id)">＋</button>
          </div>
        </div>

        <div class="bl-stack">
          <RoutesQuick />
          <ProfilePanel />
        </div>

        <!-- live sense-check: does the student path make sense? -->
        <div class="sensecheck" :class="{ bad: issues.some(i => i.level === 'error'), warn: issues.length && !issues.some(i => i.level === 'error') }">
          <button class="sc-toggle" @click="showIssues = !showIssues">
            <template v-if="!issues.length">✓ path makes sense</template>
            <template v-else>⚠ {{ issues.length }} to check</template>
          </button>
          <div v-if="showIssues && issues.length" class="sc-list">
            <div v-for="(it, i) in issues" :key="i" class="sc-item" :class="it.level"
              @click="it.nodeId && course.select(it.nodeId)">{{ it.msg }}</div>
          </div>
        </div>
      </div>

      <Inspector />
      <FlowPreview v-if="showFlow" @close="showFlow = false" />
    </div>

    <footer class="info">
      <span><b>{{ sectionCount }}</b> sections</span>
      <span><b>{{ rows.length }}</b> stages</span>
      <span><b>{{ 4 - collapsed.size }}</b>/4 lanes</span>
      <span :class="['pdot', { busy: pending }]">{{ pending ? 'laying out…' : 'idle' }}</span>
      <span class="muted">drag a section to move/reorganize · slide the profile to adapt · ? for the guide</span>
    </footer>

    <HelpPanel v-if="showHelp" @close="showHelp = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount, nextTick, provide } from 'vue';
import { VueFlow, useVueFlow, MarkerType } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';
import { MiniMap } from '@vue-flow/minimap';
import SectionNode from '../semantic-layout/components/SectionNode.vue';
import DecisionNode from '../semantic-layout/components/DecisionNode.vue';
import FlowEdge from '../semantic-layout/components/FlowEdge.vue';
import Inspector from '../semantic-layout/components/Inspector.vue';
import ProfilePanel from '../semantic-layout/components/ProfilePanel.vue';
import RoutesQuick from '../semantic-layout/components/RoutesQuick.vue';
import FlowPreview from '../semantic-layout/components/FlowPreview.vue';
import HelpPanel from '../semantic-layout/components/HelpPanel.vue';
import { dagLayout } from '../semantic-layout/engine/dagLayout';
import { useCourse } from '../semantic-layout/store/useCourse';
import { useLearner } from '../semantic-layout/store/useLearner';
import { useLayout } from '../semantic-layout/engine/useLayout';
import { routeEdges } from '../semantic-layout/engine/routeEdges';
import { LANES, LANE_ORDER, isSection, type SectionLane } from '../semantic-layout/model/types';
import { describe } from '../semantic-layout/model/rules';
import { validateCourse } from '../semantic-layout/model/wiring';

const course = useCourse();
const { active } = useLearner();
const { fitView, viewport } = useVueFlow();
const { result, pending, schedule, config } = useLayout();

const nodeTypes: any = { section: SectionNode, decision: DecisionNode };
const edgeTypes: any = { flow: FlowEdge };
const view = reactive({ lanes: true, stages: true, edges: true, edgesTop: false });
function flowsOnly() { const off = view.lanes || view.stages; view.lanes = !off; view.stages = !off; }

// measured sizes kept OUT of course state (no undo pollution)
const measured = ref<Record<string, { w: number; h: number }>>({});
const collapsed = ref<Set<SectionLane>>(new Set());
const selGroup = course.selectedGroupId;
const showFlow = ref(false);
const showHelp = ref(false);
const mode = ref<'grid' | 'dag'>('grid');
const showIssues = ref(false);
const issues = computed(() => validateCourse(course.state));
function toggleMode() {
  mode.value = mode.value === 'grid' ? 'dag' : 'grid';
  nextTick(() => setTimeout(() => fitView({ padding: 0.15, duration: 400 }), 60));
}

const sectionCount = computed(() => course.state.nodes.filter(isSection).length);
const maxStage = computed(() => course.state.nodes.reduce((m, n) => Math.max(m, n.stage), 1));

// items + groups → layout (worker)
const items = computed(() => course.state.nodes.map(n => {
  const m = measured.value[n.id];
  const common = { id: n.id, lane: n.lane, stage: n.stage, parentGroupId: n.parentGroupId, order: n.order };
  return n.kind === 'decision'
    ? { ...common, width: m?.w ?? 140, height: m?.h ?? 64 }
    : { ...common, height: m?.h };
}));
const groupsForLayout = computed(() => course.state.groups.map(g => ({
  id: g.id, lane: g.lane, stage: g.stage, parentGroupId: g.parentGroupId, order: g.order, mode: g.mode, label: g.label,
})));
watch([items, groupsForLayout, collapsed],
  () => schedule(items.value as any, groupsForLayout.value as any, Array.from(collapsed.value)),
  { immediate: true });

const dagResult = computed(() => mode.value === 'dag'
  ? dagLayout(course.state.nodes as any, course.state.links as any, id => ({ w: 230, h: measured.value[id]?.h ?? 84 }))
  : { boxes: {}, routes: {} });
const dagPlacements = computed(() => dagResult.value.boxes);
const placements = computed(() => mode.value === 'dag' ? dagPlacements.value : (result.value?.placements ?? {}));
const groupRects = computed(() => result.value?.groups ?? []);
const groupById = computed(() => Object.fromEntries(course.state.groups.map(g => [g.id, g])));
const bands = computed(() => result.value?.bands ?? LANE_ORDER.map(id => ({ id, x: 0, width: 0, collapsed: collapsed.value.has(id), count: 0 })));
const rows = computed(() => result.value?.rows ?? []);
const contentWidth = computed(() => result.value?.contentWidth ?? 0);

// ── nodes (ref, rebuilt only when layout result changes) ───────────────────
const flowNodes = ref<any[]>([]);
watch([result, mode, dagPlacements], () => {
  const p = placements.value;
  flowNodes.value = course.state.nodes.filter(n => p[n.id]).map(n => {
    const pl = p[n.id];
    const base = { id: n.id, position: { x: pl.x, y: pl.y }, draggable: mode.value === 'grid', style: { width: pl.width + 'px' } };
    if (n.kind === 'decision') return { ...base, type: 'decision', data: { prompt: n.prompt } };
    const g = n.parentGroupId ? groupById.value[n.parentGroupId] : undefined;
    return { ...base, type: 'section', data: {
      lane: n.lane, label: n.label, description: n.description, pages: n.pages,
      isStart: n.isStart, isEnd: n.isEnd, optional: n.optional,
      rule: n.entryRule ? describe(n.entryRule) : undefined,
      groupMode: g?.mode,
      seq: g?.mode === 'all' ? n.order : undefined,
    } };
  });
});

// ── edges ──────────────────────────────────────────────────────────────────
function ports(src: string, tgt: string) {
  const a = placements.value[src], b = placements.value[tgt];
  if (!a || !b) return { sh: 's-bottom', th: 't-top' };
  const dx = (b.x + b.width / 2) - (a.x + a.width / 2);
  const dy = (b.y + b.height / 2) - (a.y + a.height / 2);
  if (Math.abs(dx) > Math.abs(dy)) return dx >= 0 ? { sh: 's-right', th: 't-left' } : { sh: 's-left', th: 't-right' };
  return dy >= 0 ? { sh: 's-bottom', th: 't-top' } : { sh: 's-top', th: 't-bottom' };
}
const baseEdges = computed(() => {
  const links = course.state.links.filter(l => placements.value[l.source] && placements.value[l.target]);
  const seen: Record<string, number> = {};
  return links.map(l => {
    const kind = l.kind ?? 'branch';
    const color = kind === 'branch' ? '#6366f1' : LANES[kind as SectionLane]?.accent ?? '#94a3b8';
    const p = ports(l.source, l.target);
    const guarded = !!l.guard && l.guard.type !== 'always';
    const idx = seen[l.source] = (seen[l.source] ?? 0); seen[l.source] = idx + 1; // separate parallel siblings
    return { id: l.id, source: l.source, target: l.target, sourceHandle: p.sh, targetHandle: p.th,
      type: 'flow', markerEnd: { type: MarkerType.ArrowClosed, color, width: 16, height: 16 },
      _color: color, _guarded: guarded, _label: guarded ? (l.label ?? describe(l.guard)) : undefined, _offset: 14 + idx * 12 };
  });
});

// obstacle-avoiding routes through the gutters (recompute when layout changes)
const routes = computed<Record<string, any>>(() => mode.value === 'dag'
  ? dagResult.value.routes
  : routeEdges(placements.value, bands.value as any, rows.value as any, config, course.state.links as any));

// hover
const hovered = ref<string | null>(null);
const neighbors = computed<Set<string> | null>(() => {
  if (!hovered.value) return null;
  const s = new Set<string>([hovered.value]);
  for (const l of course.state.links) { if (l.source === hovered.value) s.add(l.target); if (l.target === hovered.value) s.add(l.source); }
  return s;
});
provide('hover', { set: (id: string | null) => (hovered.value = id), neighbors });
provide('active', active);
provide('select', (id: string) => course.select(id));
provide('selectedId', course.selectedNodeId);

const displayEdges = computed(() => baseEdges.value.map(e => {
  const h = hovered.value;
  const onHover = h ? (e.source === h || e.target === h) : false;
  const act = active.value.links.has(e.id);
  const dim = h ? !onHover : !act;
  return { ...e, animated: h ? onHover : act,
    data: { color: e._color, active: act || onHover, guarded: e._guarded, label: e._label, dim, points: routes.value[e.id] } };
}));

// ── interactions ────────────────────────────────────────────────────────────
// ── drag & drop: move/reorder sections across lanes, stages and group trees ─
const draggingId = ref<string | null>(null);
const dropHint = ref<{ lane: SectionLane; stage: number; parentGroupId?: string; index: number; lineY: number } | null>(null);

function cellHit(cx: number, cy: number): { lane: SectionLane; stage: number } | null {
  const band = bands.value.find(b => !b.collapsed && cx >= b.x && cx <= b.x + b.width);
  const row = rows.value.find(r => cy >= r.y - config.stageGap / 2 && cy <= r.y + r.height + config.stageGap / 2);
  if (!band || !row) return null;
  return { lane: band.id as SectionLane, stage: row.stage };
}
function computeDrop(cx: number, cy: number, dragId: string) {
  const hit = cellHit(cx, cy); if (!hit) return null;
  let parentGroupId: string | undefined; let bestDepth = -1; let parentRect: any = null;
  for (const g of groupRects.value) {
    const grp = groupById.value[g.id];
    if (!grp || grp.lane !== hit.lane || grp.stage !== hit.stage) continue;
    if (cx >= g.x && cx <= g.x + g.width && cy >= g.y && cy <= g.y + g.height && g.depth > bestDepth) {
      bestDepth = g.depth; parentGroupId = g.id; parentRect = g;
    }
  }
  const sibs = [
    ...course.state.nodes.filter(x => x.id !== dragId && x.lane === hit.lane && x.stage === hit.stage && x.parentGroupId === parentGroupId),
    ...course.state.groups.filter(g => g.lane === hit.lane && g.stage === hit.stage && g.parentGroupId === parentGroupId),
  ].map(s => {
    const pl = placements.value[s.id]; const gr = groupRects.value.find(r => r.id === s.id);
    return { id: s.id, yc: pl ? pl.y + pl.height / 2 : gr ? gr.y + 16 : 0 };
  }).sort((a, b) => a.yc - b.yc);
  const index = sibs.filter(s => s.yc < cy).length;
  const row = rows.value.find(r => r.stage === hit.stage)!;
  const lineY = !sibs.length ? (parentRect ? parentRect.y + 30 : row.y + 14)
    : index === 0 ? sibs[0].yc - 26 : sibs[index - 1].yc + 24;
  return { lane: hit.lane, stage: hit.stage, parentGroupId, index, lineY };
}
function nodeCenter(node: any) {
  const w = node.dimensions?.width ?? 200, h = node.dimensions?.height ?? 80;
  return { cx: node.position.x + w / 2, cy: node.position.y + h / 2 };
}
function onDragStart(e: any) { draggingId.value = e?.node?.id ?? null; hovered.value = null; }
function onDrag(e: any) {
  if (!draggingId.value || !e?.node) return;
  const { cx, cy } = nodeCenter(e.node);
  dropHint.value = computeDrop(cx, cy, draggingId.value);
}
function onDragStop(e: any) {
  const id = draggingId.value;
  if (id && e?.node) {
    const { cx, cy } = nodeCenter(e.node);
    const t = computeDrop(cx, cy, id);
    if (t) course.dropNode(id, { lane: t.lane, stage: t.stage, parentGroupId: t.parentGroupId, index: t.index });
    else schedule(items.value as any, groupsForLayout.value as any, Array.from(collapsed.value)); // snap back
  }
  draggingId.value = null; dropHint.value = null;
}

function onConnect(c: any) {
  const tgt = course.getNode(c.target);
  const kind = tgt && tgt.kind === 'section' ? tgt.lane : 'branch';
  course.addLink(c.source, c.target, kind as any);
}
function onEdgeClick(e: any) { course.selectLink(e.edge.id); }
function toggleLane(id: SectionLane) {
  const n = new Set(collapsed.value); n.has(id) ? n.delete(id) : n.add(id); collapsed.value = n;
}
const extrasCollapsed = computed(() => (['support', 'enrichment', 'advanced'] as SectionLane[]).every(l => collapsed.value.has(l)));
function toggleExtras() {
  collapsed.value = extrasCollapsed.value ? new Set() : new Set<SectionLane>(['support', 'enrichment', 'advanced']);
}
function addInLane(lane: SectionLane) { course.addSection(lane, maxStage.value); }
function addDecisionQuick() { course.addDecision('core', maxStage.value + 1); }
function addStage() { course.addSection('core', maxStage.value + 1); }

// measurement → reflow
let mt: any = null;
function onNodesChange(changes: any[]) {
  let touched = false;
  for (const c of changes) if (c.type === 'dimensions' && c.dimensions?.height) {
    const m = measured.value[c.id];
    if (!m || Math.abs(m.h - c.dimensions.height) > 1 || Math.abs(m.w - c.dimensions.width) > 1) {
      measured.value = { ...measured.value, [c.id]: { w: c.dimensions.width, h: c.dimensions.height } };
      touched = true;
    }
  }
  if (touched) { clearTimeout(mt); mt = setTimeout(() => schedule(items.value as any, Array.from(collapsed.value)), 30); }
}

// ── overlay geometry ─────────────────────────────────────────────────────────
const overlayStyle = computed(() => {
  const v = viewport.value;
  return { transform: `translate(${v?.x ?? 0}px, ${v?.y ?? 0}px) scale(${v?.zoom ?? 1})`, transformOrigin: '0 0' };
});
const dropCellStyle = computed(() => {
  const d = dropHint.value; if (!d) return {};
  if (d.parentGroupId) {
    const g = groupRects.value.find(r => r.id === d.parentGroupId);
    if (g) return { left: g.x + 'px', top: g.y + 'px', width: g.width + 'px', height: g.height + 'px' };
  }
  const band = bands.value.find(b => b.id === d.lane);
  const row = rows.value.find(r => r.stage === d.stage);
  if (!band || !row) return {};
  return { left: band.x + 'px', top: row.y + 'px', width: band.width + 'px', height: row.height + 'px' };
});
const dropLineStyle = computed(() => {
  const d = dropHint.value; if (!d) return {};
  const band = bands.value.find(b => b.id === d.lane); if (!band) return {};
  let x = band.x + 10, w = band.width - 20;
  if (d.parentGroupId) { const g = groupRects.value.find(r => r.id === d.parentGroupId); if (g) { x = g.x + 8; w = g.width - 16; } }
  return { left: x + 'px', top: d.lineY + 'px', width: w + 'px' };
});
function bandStyle(band: any) {
  const top = (result.value?.contentTop ?? 84) - 14;
  const height = (result.value?.contentHeight ?? 200) + 70;
  return { left: band.x + 'px', width: band.width + 'px', top: top + 'px', height: Math.max(height, 200) + 'px',
    background: LANES[band.id as SectionLane].soft, '--accent': LANES[band.id as SectionLane].accent };
}
const ghosts = computed(() => {
  const out: any[] = [];
  const occupied = new Set(course.state.nodes.map(n => `${n.lane}:${n.stage}`));
  for (const band of bands.value) {
    if (band.collapsed) continue;
    for (const row of rows.value) {
      if (occupied.has(`${band.id}:${row.stage}`)) continue;
      out.push({ key: `${band.id}:${row.stage}`, lane: band.id, stage: row.stage,
        x: band.x + 12, y: row.y + 10, w: band.width - 24, h: Math.max(40, row.height - 20) });
    }
  }
  return out;
});
const addStageStyle = computed(() => {
  const core = bands.value.find(b => b.id === 'core');
  const lastY = rows.value.length ? rows.value[rows.value.length - 1].y + rows.value[rows.value.length - 1].height + 14 : 100;
  return { left: (core?.x ?? 100) + 'px', top: lastY + 'px', width: (core?.width ?? 280) + 'px', height: '44px' };
});

const headerScreens = computed(() => {
  const v = viewport.value; const z = v?.zoom ?? 1; const ox = v?.x ?? 0;
  return bands.value.map(b => ({ id: b.id, collapsed: b.collapsed, count: b.count, left: ox + b.x * z, width: b.width * z }));
});
const miniColor = (n: any) => n.type === 'decision' ? '#6366f1' : LANES[n.data?.lane as SectionLane]?.accent ?? '#cbd5e1';

function doFit() { fitView({ padding: 0.12, duration: 450 }); }

// keyboard
function onKey(e: KeyboardEvent) {
  const t = e.target as HTMLElement;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? course.redo() : course.undo(); }
  else if (e.key === 'Backspace' || e.key === 'Delete') {
    if (course.selectedNodeId.value) course.deleteNode(course.selectedNodeId.value);
    else if (course.selectedLinkId.value) course.deleteLink(course.selectedLinkId.value);
  }
}
onMounted(async () => { window.addEventListener('keydown', onKey); await nextTick(); setTimeout(() => fitView({ padding: 0.12, duration: 0 }), 120); });
onBeforeUnmount(() => window.removeEventListener('keydown', onKey));
</script>

<style scoped>
.lane-view { height: 100vh; display: flex; flex-direction: column; background: #fbfcfe; }
.toolbar { display: flex; align-items: center; gap: 18px; padding: 11px 18px; background: #fff; border-bottom: 1px solid #e7eaf0; z-index: 30; }
.tb-left h1 { margin: 0; font-size: 15px; font-weight: 700; color: #111827; }
.tb-left p { margin: 1px 0 0; font-size: 11px; color: #8a94a6; }
.legend { display: flex; gap: 7px; flex: 1; flex-wrap: wrap; }
.chip { display: inline-flex; align-items: center; gap: 6px; padding: 5px 10px; border-radius: 999px; cursor: pointer;
  border: 1.5px solid var(--accent); background: color-mix(in srgb, var(--accent) 8%, white); font-size: 11.5px; color: #1f2937; }
.chip.collapsed { border-style: dashed; opacity: .55; background: #fff; }
.cn { font-weight: 650; } .cc { font-size: 10px; font-weight: 700; color: #fff; background: var(--accent); border-radius: 999px; padding: 0 6px; }
.tb-actions { display: flex; gap: 6px; }
.btn { padding: 6px 11px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1px solid #d6dbe5; background: #fff; color: #374151; }
.btn:hover:not(:disabled) { background: #f3f4f6; } .btn:disabled { opacity: .4; cursor: default; }
.btn.primary { background: #2563eb; color: #fff; border-color: #2563eb; }
.btn.on { background: #eef2ff; border-color: #818cf8; color: #4338ca; }
.btn.sm { padding: 6px 9px; font-size: 11.5px; }
.btn.round { width: 30px; padding: 0; border-radius: 999px; font-weight: 800; font-size: 14px; color: #2563eb; border-color: #bfdbfe; }
.vsep { width: 1px; height: 22px; background: #e7eaf0; margin: 0 3px; align-self: center; }

.body { flex: 1; display: flex; min-height: 0; }
.canvas { flex: 1; position: relative; overflow: hidden; }
.flow { width: 100%; height: 100%; }
.flow.hovering :deep(.vue-flow__edge.animated) { z-index: 90000 !important; }
.flow :deep(.vue-flow__node) { transition: transform .32s cubic-bezier(.22,1,.36,1); }

.overlay-wrap { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
.overlay { position: absolute; left: 0; top: 0; }
.band { position: absolute; border-radius: 16px; border: 1px solid color-mix(in srgb, var(--accent) 22%, transparent);
  transition: left .32s cubic-bezier(.22,1,.36,1), width .32s cubic-bezier(.22,1,.36,1); }
.band.collapsed { background: #f8fafc !important; border-style: dashed; }

/* cell-tree group containers */
.cgroup { position: absolute; border-radius: 12px; pointer-events: none;
  transition: left .3s cubic-bezier(.22,1,.36,1), top .3s cubic-bezier(.22,1,.36,1), width .3s, height .3s; }
.cg-one-of { border: 1.5px dashed #a5b4fc; background: rgba(99,102,241,.045); }
.cg-all { border: 1.5px solid #d6dde6; background: rgba(100,116,139,.04); }
.cgroup.selected { box-shadow: 0 0 0 2px #6366f1; }
.cg-head { position: absolute; top: 0; left: 0; right: 0; height: 26px; pointer-events: auto; cursor: pointer;
  display: flex; align-items: center; gap: 6px; padding: 0 8px; font-size: 11px; }
.cg-ic { font-size: 12px; }
.cg-one-of .cg-ic { color: #6366f1; } .cg-all .cg-ic { color: #64748b; }
.cg-lbl { font-weight: 700; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 0 1 auto; }
.cg-mode { font-size: 9px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; white-space: nowrap; }
.cg-add { margin-left: auto; border: none; background: rgba(99,102,241,.12); color: #6366f1; width: 19px; height: 19px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 700; flex: 0 0 auto; }
.cg-add:hover { background: rgba(99,102,241,.22); }

/* drag-and-drop target indicator */
.drop-cell { position: absolute; border: 2px dashed #6366f1; background: rgba(99,102,241,.07); border-radius: 12px; pointer-events: none; z-index: 2; }
.drop-line { position: absolute; height: 3px; background: #6366f1; border-radius: 2px; pointer-events: none; z-index: 3; box-shadow: 0 0 0 3px rgba(99,102,241,.18); }
.flow.dragging :deep(.vue-flow__node) { transition: none !important; }
.flow.dragging :deep(.vue-flow__node.dragging) { z-index: 10000 !important; filter: drop-shadow(0 12px 24px rgba(16,24,40,.28)); }
.flow :deep(.vue-flow__node) .sec, .flow :deep(.vue-flow__node) .dec { cursor: grab; }
.flow.dragging :deep(.vue-flow__node.dragging) .sec, .flow.dragging :deep(.vue-flow__node.dragging) .dec { cursor: grabbing; }
/* edges-on-top: lift the flows above sections so the path is never buried */
.flow.edges-top :deep(.vue-flow__edges) { z-index: 5; }
.flow.edges-top :deep(.vue-flow__node) { z-index: 1; }
.flow.edges-top :deep(.vue-flow__node.dragging) { z-index: 10000 !important; }
.rail { position: absolute; top: 16px; left: 0; width: 100%; display: flex; flex-direction: column; align-items: center; gap: 6px; }
.ri { font-size: 15px; } .rt { writing-mode: vertical-rl; font-size: 11px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--accent); }
.rowsep { position: absolute; left: 0; height: 1px; background: repeating-linear-gradient(to right, #e2e8f0 0 6px, transparent 6px 12px); }
.slabel { position: absolute; left: 8px; width: 70px; display: flex; flex-direction: column; justify-content: center; align-items: center; }
.sn { font-size: 20px; font-weight: 800; color: #cbd5e1; line-height: 1; } .sw { font-size: 8.5px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: #cbd5e1; }
.ghost { position: absolute; pointer-events: auto; border: 1.5px dashed #cbd5e1; background: rgba(255,255,255,.5); border-radius: 10px;
  color: #94a3b8; font-size: 11px; font-weight: 600; cursor: pointer; opacity: 0; transition: opacity .15s, border-color .15s, color .15s; }
.overlay:hover .ghost { opacity: .45; } .ghost:hover { opacity: 1 !important; border-color: #6366f1; color: #6366f1; background: #fff; }
.addstage { opacity: .5; }

.sticky { position: absolute; top: 10px; left: 0; right: 0; height: 52px; pointer-events: none; overflow: hidden; z-index: 10; }
.lh { position: absolute; top: 0; height: 48px; pointer-events: auto; display: flex; align-items: center; gap: 8px; padding: 0 10px;
  border-radius: 12px; background: #fff; border: 1px solid #e7eaf0; border-top: 3px solid var(--accent); box-shadow: 0 4px 14px rgba(16,24,40,.08);
  transition: left .32s cubic-bezier(.22,1,.36,1), width .32s cubic-bezier(.22,1,.36,1); overflow: hidden; }
.lh.collapsed { justify-content: center; padding: 0 4px; background: #f8fafc; }
.lhi { font-size: 15px; cursor: pointer; } .lht { display: flex; flex-direction: column; min-width: 0; cursor: pointer; line-height: 1.15; }
.lhn { font-size: 12.5px; font-weight: 700; color: #111827; } .lhb { font-size: 9.5px; color: #98a2b3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lhc { margin-left: auto; font-size: 10.5px; font-weight: 700; color: #fff; background: var(--accent); border-radius: 999px; padding: 1px 7px; }
.lh.collapsed .lhc { margin-left: 0; }
.lhadd { border: none; background: color-mix(in srgb, var(--accent) 12%, white); color: var(--accent); width: 24px; height: 24px; border-radius: 7px; cursor: pointer; font-size: 14px; font-weight: 700; }

.info { display: flex; align-items: center; gap: 18px; padding: 7px 18px; background: #fff; border-top: 1px solid #e7eaf0; font-size: 12px; color: #475467; }
.info b { color: #111827; } .info .muted { margin-left: auto; color: #98a2b3; }
.pdot { font-size: 11px; color: #94a3b8; } .pdot.busy { color: #2563eb; }

/* bottom-left stack: quick routes + learner profile */
.bl-stack { position: absolute; left: 14px; bottom: 14px; display: flex; flex-direction: column; gap: 10px; z-index: 15; }

/* live sense-check chip */
.sensecheck { position: absolute; right: 14px; bottom: 14px; z-index: 16; }
.sc-toggle { border: 1px solid #bbf7d0; background: #f0fdf4; color: #166534; border-radius: 999px; padding: 6px 14px; font-size: 12px; font-weight: 700; cursor: pointer; box-shadow: 0 6px 16px rgba(16,24,40,.1); }
.sensecheck.warn .sc-toggle { background: #fffbeb; border-color: #fde68a; color: #92400e; }
.sensecheck.bad .sc-toggle { background: #fef2f2; border-color: #fecaca; color: #991b1b; }
.sc-list { position: absolute; right: 0; bottom: 40px; width: 264px; background: #fff; border: 1px solid #e7eaf0; border-radius: 12px; box-shadow: 0 12px 30px rgba(16,24,40,.16); padding: 6px; }
.sc-item { font-size: 12px; padding: 7px 9px; border-radius: 8px; cursor: pointer; color: #475467; }
.sc-item:hover { background: #f3f4f6; }
.sc-item.error { color: #991b1b; font-weight: 600; } .sc-item.warn { color: #92400e; }
</style>

<style>
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';
@import '@vue-flow/controls/dist/style.css';
@import '@vue-flow/minimap/dist/style.css';
</style>
