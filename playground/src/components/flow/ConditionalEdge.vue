<template>
  <g>
    <!-- Edge path -->
    <path
      :id="id"
      :d="path[0]"
      :marker-end="markerEnd"
      :class="edgeClass"
      class="conditional-edge"
    />
    
    <!-- Condition label -->
    <foreignObject
      v-if="data?.condition"
      :x="labelX - 75"
      :y="labelY - 15"
      width="150"
      height="30"
      class="edge-label-wrapper"
    >
      <div class="edge-label" :class="{ 'active': isActive }">
        <Tag 
          :value="data.condition" 
          :severity="isActive ? 'success' : 'secondary'"
          size="small"
          class="text-xs"
        />
      </div>
    </foreignObject>
  </g>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { getSmoothStepPath, EdgeProps } from '@vue-flow/core';
import Tag from 'primevue/tag';

interface Props extends EdgeProps {
  data?: {
    condition?: string;
    conditionMet?: boolean;
  };
}

const props = defineProps<Props>();

const path = computed(() => {
  return getSmoothStepPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
    sourcePosition: props.sourcePosition,
    targetPosition: props.targetPosition,
  });
});

const labelX = computed(() => {
  return (props.sourceX + props.targetX) / 2;
});

const labelY = computed(() => {
  return (props.sourceY + props.targetY) / 2;
});

const isActive = computed(() => props.data?.conditionMet === true);

const edgeClass = computed(() => {
  if (isActive.value) return 'stroke-green-500 stroke-[3]';
  if (props.data?.conditionMet === false) return 'stroke-gray-300 stroke-[2] opacity-50';
  return 'stroke-gray-400 stroke-[2]';
});
</script>

<style scoped>
.conditional-edge {
  @apply fill-none transition-all;
}

.edge-label-wrapper {
  overflow: visible;
  pointer-events: none;
}

.edge-label {
  @apply flex items-center justify-center pointer-events-auto;
}

.edge-label.active {
  @apply animate-pulse;
}
</style>

