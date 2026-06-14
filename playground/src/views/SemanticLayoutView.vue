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
        <button class="btn" :disabled="!course.canUndo.value" @click="course.undo()" title="Undo (⌘Z)">↶</button>
        <button class="btn" :disabled="!course.canRedo.value" @click="course.redo()" title="Redo (⇧⌘Z)">↷</button>
        <button class="btn" @click="addDecisionQuick" title="Add a decision fork">◆ Decision</button>
        <button class="btn" @click="toggleExtras">{{ extrasCollapsed ? 'Show extras' : 'Focus core' }}</button>
        <button class="btn primary" @click="doFit">Fit</button>
      </div>
    </header>

    <!-- Body: canvas + inspector -->
    <div class="body">
      <div class="canvas">
        <VueFlow
          v-model:nodes="flowNodes"
          :edges="displayEdges"
          :node-types="nodeTypes"
          :nodes-draggable="false"
          :default-viewport="{ zoom: 0.82, x: 0, y: 0 }"
          :min-zoom="0.2" :max-zoom="2.5"
          :class="['flow', { hovering: !!hovered }]"
          @nodes-change="onNodesChange"
          @connect="onConnect"
          @edge-click="onEdgeClick"
          @pane-click="course.clearSelection()"
        >
          <Background :gap="22" pattern-color="#eef1f6" />
          <Controls :show-interactive="false" />
          <MiniMap pannable zoomable :node-color="miniColor" />

          <template #node-section="n"><SectionNode :data="n.data" :node-id="n.id" /></template>
          <template #node-decision="n"><DecisionNode :data="n.data" :node-id="n.id" /></template>

          <!-- Canvas-space overlay: bands, rows, gutter, ghost add-cells -->
          <div class="overlay-wrap">
            <div class="overlay" :style="overlayStyle">
              <div v-for="band in bands" :key="'b' + band.id" class="band" :class="{ collapsed: band.collapsed }"
                :style="bandStyle(band)">
                <div v-if="band.collapsed" class="rail">
                  <span class="ri">{{ LANES[band.id].icon }}</span>
                  <span class="rt">{{ LANES[band.id].short }}</span>
                </div>
              </div>

              <template v-for="row in rows" :key="'r' + row.stage">
                <div class="rowsep" :style="{ top: row.y - 20 + 'px', width: contentWidth + 'px' }" />
                <div class="slabel" :style="{ top: row.y + 'px', height: row.height + 'px' }">
                  <span class="sn">{{ row.stage }}</span><span class="sw">stage</span>
                </div>
              </template>

              <!-- ghost add-cells in empty (lane, stage) cells -->
              <button v-for="g in ghosts" :key="g.key" class="ghost"
                :style="{ left: g.x + 'px', top: g.y + 'px', width: g.w + 'px', height: g.h + 'px' }"
                @click="course.addSection(g.lane, g.stage)">+ add {{ g.lane }}</button>

              <!-- add a new stage -->
              <button class="ghost addstage" :style="addStageStyle" @click="addStage">+ add stage</button>
            </div>
          </div>
        </VueFlow>

        <!-- Sticky lane headers -->
        <div class="sticky">
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

        <ProfilePanel />
      </div>

      <Inspector />
    </div>

    <footer class="info">
      <span><b>{{ sectionCount }}</b> sections</span>
      <span><b>{{ rows.length }}</b> stages</span>
      <span><b>{{ 4 - collapsed.size }}</b>/4 lanes</span>
      <span :class="['pdot', { busy: pending }]">{{ pending ? 'laying out…' : 'idle' }}</span>
      <span class="muted">drag a handle → another node to link · click a link to add a condition · ⌘Z undo</span>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick, provide } from 'vue';
import { VueFlow, useVueFlow, MarkerType } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';
import { MiniMap } from '@vue-flow/minimap';
import SectionNode from '../semantic-layout/components/SectionNode.vue';
import DecisionNode from '../semantic-layout/components/DecisionNode.vue';
import Inspector from '../semantic-layout/components/Inspector.vue';
import ProfilePanel from '../semantic-layout/components/ProfilePanel.vue';
import { useCourse } from '../semantic-layout/store/useCourse';
import { useLearner } from '../semantic-layout/store/useLearner';
import { useLayout } from '../semantic-layout/engine/useLayout';
import { LANES, LANE_ORDER, isSection, type SectionLane } from '../semantic-layout/model/types';
import { describe } from '../semantic-layout/model/rules';

const course = useCourse();
const { active } = useLearner();
const { fitView, viewport } = useVueFlow();
const { result, pending, schedule } = useLayout();

const nodeTypes: any = { section: SectionNode, decision: DecisionNode };

// measured sizes kept OUT of course state (no undo pollution)
const measured = ref<Record<string, { w: number; h: number }>>({});
const collapsed = ref<Set<SectionLane>>(new Set());

const sectionCount = computed(() => course.state.nodes.filter(isSection).length);
const maxStage = computed(() => course.state.nodes.reduce((m, n) => Math.max(m, n.stage), 1));

// items → layout (worker)
const items = computed(() => course.state.nodes.map(n => {
  const m = measured.value[n.id];
  return n.kind === 'decision'
    ? { id: n.id, lane: n.lane, stage: n.stage, width: m?.w ?? 140, height: m?.h ?? 64 }
    : { id: n.id, lane: n.lane, stage: n.stage, height: m?.h };
}));
watch([items, collapsed], () => schedule(items.value as any, Array.from(collapsed.value)), { immediate: true });

const placements = computed(() => result.value?.placements ?? {});
const bands = computed(() => result.value?.bands ?? LANE_ORDER.map(id => ({ id, x: 0, width: 0, collapsed: collapsed.value.has(id), count: 0 })));
const rows = computed(() => result.value?.rows ?? []);
const contentWidth = computed(() => result.value?.contentWidth ?? 0);

// ── nodes (ref, rebuilt only when layout result changes) ───────────────────
const flowNodes = ref<any[]>([]);
watch(result, () => {
  const p = placements.value;
  flowNodes.value = course.state.nodes.filter(n => p[n.id]).map(n => {
    const pl = p[n.id];
    const base = { id: n.id, position: { x: pl.x, y: pl.y }, draggable: false, style: { width: pl.width + 'px' } };
    if (n.kind === 'decision') return { ...base, type: 'decision', data: { prompt: n.prompt } };
    return { ...base, type: 'section', data: {
      lane: n.lane, label: n.label, description: n.description, pages: n.pages,
      isStart: n.isStart, isEnd: n.isEnd, optional: n.optional,
      rule: n.entryRule ? describe(n.entryRule) : undefined,
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
const baseEdges = computed(() => course.state.links.filter(l => placements.value[l.source] && placements.value[l.target]).map(l => {
  const kind = l.kind ?? 'branch';
  const color = kind === 'branch' ? '#6366f1' : LANES[kind as SectionLane]?.accent ?? '#94a3b8';
  const p = ports(l.source, l.target);
  const guarded = !!l.guard && l.guard.type !== 'always';
  return { id: l.id, source: l.source, target: l.target, sourceHandle: p.sh, targetHandle: p.th,
    type: 'smoothstep', markerEnd: MarkerType.ArrowClosed, label: guarded ? (l.label ?? describe(l.guard)) : undefined,
    labelBgStyle: { fill: '#fff' }, labelStyle: { fontSize: '10px', fill: color, fontWeight: 600 },
    _color: color, _guarded: guarded };
}));

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
  const onHover = h ? (e.source === h || e.target === h) : null;
  const act = active.value.links.has(e.id);
  const opacity = h ? (onHover ? 1 : 0.12) : (act ? 1 : 0.28);
  const animated = h ? !!onHover : act;
  return { ...e, animated, style: {
    stroke: e._color, strokeWidth: e._guarded ? 1.6 : (act ? 2.4 : 1.8),
    strokeDasharray: e._guarded ? '6 4' : undefined, opacity,
  } };
}));

// ── interactions ────────────────────────────────────────────────────────────
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
</style>

<style>
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';
@import '@vue-flow/controls/dist/style.css';
@import '@vue-flow/minimap/dist/style.css';
</style>
