<template>
  <aside class="flowp">
    <header>
      <div>
        <div class="ft">Resolved journey</div>
        <div class="fs">How this learner flows · live</div>
      </div>
      <button class="x" @click="$emit('close')">✕</button>
    </header>

    <div class="steps" v-if="steps.length">
      <template v-for="(st, i) in steps" :key="st.stage">
        <div class="stage">
          <span class="sbadge">Stage {{ st.stage }}</span>
          <div class="items">
            <div v-for="it in st.items" :key="it.id" class="card" :class="{ sel: selectedId === it.id }"
              :style="{ '--accent': it.color }" @click="course.select(it.id)">
              <span class="ic">{{ it.icon }}</span>
              <div class="main">
                <div class="lbl">{{ it.label }}</div>
                <div v-if="it.why" class="why">{{ it.why }}</div>
              </div>
              <span class="tag">{{ it.tag }}</span>
            </div>
          </div>
        </div>
        <div v-if="i < steps.length - 1" class="link"><span /></div>
      </template>
    </div>
    <div v-else class="empty">No sections are active for this profile.</div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useCourse } from '../store/useCourse';
import { useLearner } from '../store/useLearner';
import { LANES, isSection, type SectionLane } from '../model/types';
import { describe } from '../model/rules';

defineEmits<{ close: [] }>();
const course = useCourse();
const { active } = useLearner();
const selectedId = course.selectedNodeId;

const laneRank: Record<string, number> = { decision: -1, core: 0, support: 1, enrichment: 2, advanced: 3 };

const steps = computed(() => {
  const ap = active.value;
  const byStage = new Map<number, any[]>();
  const push = (stage: number, item: any) => { (byStage.get(stage) ?? byStage.set(stage, []).get(stage)!).push(item); };

  for (const n of course.state.nodes) {
    if (isSection(n)) {
      if (!ap.sections.has(n.id)) continue;
      const lane = n.lane as SectionLane;
      const g = n.parentGroupId ? course.getGroup(n.parentGroupId) : undefined;
      let why: string | undefined;
      if (n.entryRule) why = 'when ' + describe(n.entryRule);
      else if (g?.mode === 'one-of') why = 'chosen variant';
      else if (g?.mode === 'all') why = `step ${n.order}`;
      push(n.stage, {
        id: n.id, rank: laneRank[lane], lane,
        icon: n.isStart ? '▶' : n.isEnd ? '■' : LANES[lane].icon,
        color: LANES[lane].accent, tag: lane, label: n.label, why,
      });
    } else {
      const out = course.state.links.find(l => l.source === n.id && ap.links.has(l.id));
      if (!out) continue;
      const choice = out.label || (out.guard ? describe(out.guard) : 'default');
      push(n.stage, {
        id: n.id, rank: laneRank.decision, lane: 'decision',
        icon: '◆', color: '#6366f1', tag: 'decision', label: n.prompt, why: `→ ${choice}`,
      });
    }
  }

  return Array.from(byStage.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([stage, items]) => ({ stage, items: items.sort((a, b) => a.rank - b.rank) }));
});
</script>

<style scoped>
.flowp { width: 320px; flex: 0 0 320px; background: #fff; border-left: 1px solid #e7eaf0; display: flex; flex-direction: column; }
header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid #eef1f6; }
.ft { font-size: 13px; font-weight: 800; color: #111827; }
.fs { font-size: 10.5px; color: #94a3b8; margin-top: 2px; }
.x { border: none; background: #f3f4f6; border-radius: 6px; width: 24px; height: 24px; cursor: pointer; color: #6b7280; }
.steps { overflow-y: auto; padding: 14px 16px; }
.stage { }
.sbadge { font-size: 9.5px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: #cbd5e1; }
.items { margin-top: 6px; display: flex; flex-direction: column; gap: 6px; }
.card { display: flex; align-items: center; gap: 9px; padding: 8px 10px; border: 1px solid #e5e7eb;
  border-left: 4px solid var(--accent); border-radius: 9px; cursor: pointer; transition: box-shadow .15s, transform .15s; background: #fff; }
.card:hover { box-shadow: 0 4px 12px rgba(16,24,40,.1); transform: translateY(-1px); }
.card.sel { box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 55%, transparent); }
.ic { font-size: 14px; flex: 0 0 auto; }
.main { flex: 1; min-width: 0; }
.lbl { font-size: 12.5px; font-weight: 650; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.why { font-size: 10px; color: #8a94a6; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tag { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: var(--accent); flex: 0 0 auto; }
.link { display: flex; justify-content: center; height: 16px; }
.link span { width: 2px; height: 16px; background: linear-gradient(#cbd5e1, #cbd5e1); border-radius: 2px; }
.empty { padding: 24px 16px; color: #94a3b8; font-size: 12.5px; text-align: center; }
</style>
