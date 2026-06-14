<template>
  <div
    class="dec"
    :class="{ active: isActive, selected: isSelected, dim: isDim }"
    @mouseenter="hover?.set(nodeId)"
    @mouseleave="hover?.set(null)"
    @click.stop="select?.(nodeId)"
  >
    <div class="diamond">◆</div>
    <div class="label">{{ data.prompt }}</div>
    <div class="hint">if / else</div>

    <Handle id="t-top" type="target" :position="Position.Top" class="h ht" />
    <Handle id="s-bottom" type="source" :position="Position.Bottom" class="h hb" />
    <Handle id="s-right" type="source" :position="Position.Right" class="h hr" />
    <Handle id="s-left" type="source" :position="Position.Left" class="h hl" />
  </div>
</template>

<script setup lang="ts">
import { computed, inject, type Ref } from 'vue';
import { Handle, Position } from '@vue-flow/core';
import type { ActivePath } from '../model/rules';

const props = defineProps<{ data: { prompt: string }; nodeId: string }>();
const active = inject<Ref<ActivePath> | null>('active', null);
const hover = inject<{ set: (id: string | null) => void; neighbors: Ref<Set<string> | null> } | null>('hover', null);
const select = inject<((id: string) => void) | null>('select', null);
const selectedId = inject<Ref<string | null> | null>('selectedId', null);

const isActive = computed(() => {
  // a decision is "active" if any of its links fired (handled via reach) — approximate by selection of any neighbor
  return false;
});
const isSelected = computed(() => selectedId?.value === props.nodeId);
const isDim = computed(() => {
  const n = hover?.neighbors.value;
  return !!n && !n.has(props.nodeId);
});
</script>

<style scoped>
.dec {
  position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 1px; padding: 8px 14px; background: #fff; border: 1.5px solid #cbd5e1; border-radius: 10px;
  box-shadow: 0 1px 3px rgba(16,24,40,.08); cursor: pointer; transition: all .18s; min-width: 120px;
}
.dec:hover { box-shadow: 0 6px 16px rgba(16,24,40,.14); transform: translateY(-1px); }
.dec.selected { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,.4); }
.dec.dim { opacity: .3; }
.diamond { color: #6366f1; font-size: 16px; line-height: 1; }
.label { font-size: 12px; font-weight: 700; color: #1f2937; }
.hint { font-size: 9px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: #94a3b8; }
.h { width: 7px; height: 7px; background: #6366f1; border: 1.5px solid #fff; opacity: .5; }
.dec:hover .h { opacity: 1; }
.ht, .hb { left: 50%; transform: translateX(-50%); }
.hr { top: 50%; right: -3px; transform: translateY(-50%); }
.hl { top: 50%; left: -3px; transform: translateY(-50%); }
</style>
