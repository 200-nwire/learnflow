<template>
  <path v-if="!dim" :d="d" fill="none" class="casing" :stroke-width="w + 5" />
  <path :d="d" fill="none" class="stroke" :class="{ active, dashed }"
    :stroke="color" :stroke-width="w" :style="{ opacity: dim ? 0.16 : 1 }" :marker-end="markerEnd" />
  <EdgeLabelRenderer v-if="label && !dim">
    <div class="elabel" :style="{ transform: `translate(-50%,-50%) translate(${lpos.x}px,${lpos.y}px)`, color }">{{ label }}</div>
  </EdgeLabelRenderer>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { getSmoothStepPath, EdgeLabelRenderer, type Position } from '@vue-flow/core';
import { roundedPath, midpoint, type Pt } from '../engine/routeEdges';

const props = defineProps<{
  sourceX: number; sourceY: number; targetX: number; targetY: number;
  sourcePosition: Position; targetPosition: Position;
  markerEnd?: string;
  data?: { color?: string; active?: boolean; guarded?: boolean; label?: string; dim?: boolean; points?: Pt[] };
}>();

const color = computed(() => props.data?.color ?? '#94a3b8');
const active = computed(() => !!props.data?.active);
const dashed = computed(() => !!props.data?.guarded);
const dim = computed(() => !!props.data?.dim);
const label = computed(() => props.data?.label);
const w = computed(() => active.value ? (dashed.value ? 2.8 : 3.4) : (dashed.value ? 1.5 : 1.8));

const pts = computed(() => props.data?.points);
const hasPts = computed(() => Array.isArray(pts.value) && pts.value!.length >= 2);

const smooth = computed(() => getSmoothStepPath({
  sourceX: props.sourceX, sourceY: props.sourceY, sourcePosition: props.sourcePosition,
  targetX: props.targetX, targetY: props.targetY, targetPosition: props.targetPosition, borderRadius: 10,
}));
const d = computed(() => hasPts.value ? roundedPath(pts.value!) : smooth.value[0]);
const lpos = computed<Pt>(() => hasPts.value ? midpoint(pts.value!) : { x: smooth.value[1], y: smooth.value[2] });
</script>

<style scoped>
.casing { stroke: #fff; stroke-linecap: round; stroke-linejoin: round; }
.stroke { stroke-linecap: round; stroke-linejoin: round; transition: stroke-width .15s, opacity .15s; }
.stroke.dashed { stroke-dasharray: 7 5; }
.stroke.active { filter: drop-shadow(0 1px 2px rgba(0,0,0,.18)); }
.elabel { position: absolute; font-size: 10px; font-weight: 600; background: #fff; padding: 1px 6px; border-radius: 6px; border: 1px solid #eef1f6; pointer-events: none; white-space: nowrap; box-shadow: 0 1px 2px rgba(16,24,40,.06); }
</style>
