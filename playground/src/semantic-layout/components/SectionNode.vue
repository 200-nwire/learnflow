<template>
  <div
    class="sec"
    :class="[`lane-${data.lane}`, { optional: data.optional, dim: isDim, active: isActive, selected: isSelected, ineligible: !isEligible }]"
    :style="{ '--accent': accent }"
    @mouseenter="hover?.set(nodeId)"
    @mouseleave="hover?.set(null)"
    @click.stop="select?.(nodeId)"
  >
    <div class="stripe" />
    <div class="body">
      <div class="head">
        <span v-if="data.groupMode === 'one-of'" class="vdot" :class="{ on: isEligible }"
          :title="isEligible ? 'active variant' : 'inactive variant'" />
        <span v-else-if="data.groupMode === 'all'" class="seq">{{ data.seq }}</span>
        <span class="ic">{{ data.isStart ? '▶' : data.isEnd ? '■' : icon }}</span>
        <span class="title">{{ data.label }}</span>
        <span v-if="data.isStart" class="pill start">Start</span>
        <span v-else-if="data.isEnd" class="pill end">End</span>
        <span v-else-if="data.optional" class="pill opt">Optional</span>
      </div>
      <div v-if="data.description" class="desc">{{ data.description }}</div>
      <div class="foot">
        <span class="lane">{{ data.lane }}</span>
        <span v-if="data.rule" class="rule" :class="{ off: !isEligible }" :title="'show when ' + data.rule">
          ⓘ {{ data.rule }}
        </span>
        <span v-if="data.pages" class="pages">{{ data.pages }}p</span>
      </div>
    </div>

    <Handle id="t-top" type="target" :position="Position.Top" class="h ht" />
    <Handle id="t-left" type="target" :position="Position.Left" class="h hl" />
    <Handle id="s-bottom" type="source" :position="Position.Bottom" class="h hb" />
    <Handle id="s-right" type="source" :position="Position.Right" class="h hr" />
    <Handle id="s-left" type="source" :position="Position.Left" class="h hl2" />
    <Handle id="t-right" type="target" :position="Position.Right" class="h hr2" />
  </div>
</template>

<script setup lang="ts">
import { computed, inject, type Ref } from 'vue';
import { Handle, Position } from '@vue-flow/core';
import { LANES, type SectionLane } from '../model/types';
import type { ActivePath } from '../model/rules';

const props = defineProps<{ data: {
  lane: SectionLane; label: string; description?: string; pages?: number;
  isStart?: boolean; isEnd?: boolean; optional?: boolean; rule?: string;
  groupMode?: 'one-of' | 'all'; seq?: number;
}; nodeId: string }>();

const active = inject<Ref<ActivePath> | null>('active', null);
const hover = inject<{ set: (id: string | null) => void; neighbors: Ref<Set<string> | null> } | null>('hover', null);
const select = inject<((id: string) => void) | null>('select', null);
const selectedId = inject<Ref<string | null> | null>('selectedId', null);

const accent = computed(() => LANES[props.data.lane].accent);
const icon = computed(() => LANES[props.data.lane].icon);
const isActive = computed(() => !!active?.value.sections.has(props.nodeId));
const isEligible = computed(() => !active || active.value.eligible.has(props.nodeId));
const isSelected = computed(() => selectedId?.value === props.nodeId);
const isDim = computed(() => {
  const n = hover?.neighbors.value;
  return !!n && !n.has(props.nodeId);
});
</script>

<style scoped>
.sec {
  position: relative; display: flex; background: #fff; border: 1px solid #e5e7eb;
  border-radius: 12px; box-shadow: 0 1px 3px rgba(16,24,40,.06); overflow: hidden;
  transition: box-shadow .18s, transform .18s, opacity .18s, border-color .18s; cursor: pointer;
}
.sec:hover { box-shadow: 0 6px 16px rgba(16,24,40,.12); transform: translateY(-1px); }
.sec.optional { border-style: dashed; }
.sec.dim { opacity: .3; }
.sec.ineligible { opacity: .5; filter: grayscale(.5); }
.sec.active { border-color: var(--accent); box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 35%, transparent), 0 6px 16px rgba(16,24,40,.12); }
.sec.selected { border-color: var(--accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 55%, transparent); }
.stripe { width: 5px; background: var(--accent); flex: 0 0 5px; }
.body { padding: 9px 11px; flex: 1; min-width: 0; }
.head { display: flex; align-items: center; gap: 6px; }
.vdot { width: 11px; height: 11px; border-radius: 50%; border: 2px solid var(--accent); flex: 0 0 auto; box-sizing: border-box; }
.vdot.on { background: var(--accent); }
.seq { width: 17px; height: 17px; border-radius: 50%; background: color-mix(in srgb, var(--accent) 16%, white); color: var(--accent); font-size: 10px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex: 0 0 auto; }
.ic { font-size: 14px; }
.title { font-weight: 650; font-size: 13px; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; min-width: 0; }
.pill { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; padding: 2px 6px; border-radius: 999px; }
.pill.start { background: #dcfce7; color: #166534; }
.pill.end { background: #dbeafe; color: #1e40af; }
.pill.opt { background: #f3f4f6; color: #6b7280; }
.desc { margin-top: 4px; font-size: 11px; line-height: 1.4; color: #4b5563; }
.foot { margin-top: 7px; display: flex; align-items: center; gap: 6px; }
.lane { font-size: 9.5px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; color: var(--accent); opacity: .85; }
.rule { font-size: 10px; color: #6d28d9; background: #f5f3ff; border: 1px solid #ede9fe; border-radius: 6px; padding: 0 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px; }
.rule.off { color: #9ca3af; background: #f3f4f6; border-color: #e5e7eb; }
.pages { margin-left: auto; font-size: 10px; color: #9ca3af; }
.h { width: 7px; height: 7px; background: var(--accent); border: 1.5px solid #fff; opacity: .45; }
.sec:hover .h { opacity: .95; }
.ht, .hb { left: 50%; transform: translateX(-50%); }
.hl, .hr, .hl2, .hr2 { top: 50%; transform: translateY(-50%); }
</style>
