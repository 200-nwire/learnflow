<template>
  <div class="profile">
    <div class="ph">
      <span class="dot" />
      <div>
        <div class="pt">Learner profile</div>
        <div class="ps">Move a slider — the path adapts live</div>
      </div>
      <button class="reset" @click="learner.reset()">Reset</button>
    </div>

    <div class="field">
      <div class="flabel"><span>Score</span><b>{{ Math.round(profile.score) }}</b></div>
      <input type="range" min="0" max="100" step="1" :value="profile.score"
        @input="learner.setScore(+($event.target as HTMLInputElement).value)" />
    </div>

    <div class="field" v-for="s in skills" :key="s.id">
      <div class="flabel"><span>{{ s.label }}</span><b>{{ Math.round((profile.mastery[s.id] ?? 0) * 100) }}%</b></div>
      <input type="range" min="0" max="1" step="0.05" :value="profile.mastery[s.id] ?? 0"
        @input="learner.setMastery(s.id, +($event.target as HTMLInputElement).value)" />
    </div>

    <div class="counts">
      <span class="c on">{{ active.sections.size }} active</span>
      <span class="c">{{ active.eligible.size }} eligible</span>
      <span class="c">{{ active.links.size }} links fire</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLearner } from '../store/useLearner';
const learner = useLearner();
const { profile, active, skills } = learner;
</script>

<style scoped>
.profile { width: 240px; background: rgba(255,255,255,.96);
  backdrop-filter: blur(6px); border: 1px solid #e7eaf0; border-radius: 14px; padding: 13px 14px;
  box-shadow: 0 10px 30px rgba(16,24,40,.14); }
.ph { display: flex; align-items: center; gap: 9px; margin-bottom: 10px; }
.dot { width: 9px; height: 9px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 0 4px rgba(34,197,94,.18); }
.pt { font-size: 12.5px; font-weight: 700; color: #111827; }
.ps { font-size: 10px; color: #98a2b3; }
.reset { margin-left: auto; border: 1px solid #e5e7eb; background: #fff; border-radius: 7px; font-size: 11px; padding: 3px 8px; cursor: pointer; color: #6b7280; }
.field { margin: 9px 0; }
.flabel { display: flex; justify-content: space-between; font-size: 11.5px; color: #475467; margin-bottom: 3px; }
.flabel b { color: #111827; font-variant-numeric: tabular-nums; }
input[type=range] { width: 100%; accent-color: #6366f1; }
.counts { display: flex; gap: 6px; margin-top: 12px; padding-top: 10px; border-top: 1px solid #eef1f6; }
.c { font-size: 10.5px; font-weight: 700; color: #64748b; background: #f1f5f9; border-radius: 999px; padding: 2px 8px; }
.c.on { color: #166534; background: #dcfce7; }
</style>
