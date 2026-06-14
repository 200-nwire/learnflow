<template>
  <div class="routes">
    <div class="rh">
      <span class="rt">Quick routes</span>
      <span class="rs">{{ learner.active.value.sections.size }} sections on path</span>
    </div>
    <button v-for="p in learner.presets" :key="p.id" class="rb" :class="{ on: matched === p.id }"
      :style="{ '--a': accent(p.id) }" @click="learner.applyPreset(p)">
      <span class="ic">{{ p.icon }}</span>
      <span class="tx"><b>{{ p.label }}</b><span class="sub">{{ p.sub }}</span></span>
      <span class="go">→</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useLearner } from '../store/useLearner';

const learner = useLearner();
const { profile, presets, skills } = learner;

const matched = computed(() => {
  for (const p of presets) {
    if (Math.round(profile.score) !== p.score) continue;
    if (skills.every(s => Math.abs((profile.mastery[s.id] ?? 0) - p.mastery) < 0.03)) return p.id;
  }
  return null;
});
const accent = (id: string) => id === 'help' ? '#f59e0b' : id === 'adv' ? '#0d9488' : '#2563eb';
</script>

<style scoped>
.routes { width: 240px; background: rgba(255,255,255,.96); backdrop-filter: blur(6px); border: 1px solid #e7eaf0;
  border-radius: 14px; padding: 11px 12px; box-shadow: 0 10px 30px rgba(16,24,40,.14); }
.rh { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 8px; }
.rt { font-size: 12.5px; font-weight: 700; color: #111827; }
.rs { font-size: 10px; color: #94a3b8; }
.rb { display: flex; align-items: center; gap: 9px; width: 100%; text-align: left; margin-top: 6px;
  border: 1px solid #e5e7eb; border-left: 4px solid var(--a); background: #fff; border-radius: 9px;
  padding: 7px 9px; cursor: pointer; transition: box-shadow .15s, transform .15s, border-color .15s; }
.rb:hover { box-shadow: 0 4px 12px rgba(16,24,40,.1); transform: translateY(-1px); }
.rb.on { box-shadow: 0 0 0 2px color-mix(in srgb, var(--a) 50%, transparent); background: color-mix(in srgb, var(--a) 6%, white); }
.ic { font-size: 15px; flex: 0 0 auto; }
.tx { display: flex; flex-direction: column; line-height: 1.2; flex: 1; min-width: 0; }
.tx b { font-size: 12.5px; color: #111827; }
.sub { font-size: 10px; color: #8a94a6; }
.go { color: var(--a); font-weight: 800; flex: 0 0 auto; }
</style>
