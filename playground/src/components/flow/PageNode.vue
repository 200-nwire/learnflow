<template>
  <div 
    class="page-node"
    :class="[
      `difficulty-${difficulty}`,
      { 'active': isActive, 'visited': isVisited, 'has-variants': hasVariants }
    ]"
  >
    <!-- Node Header -->
    <div class="node-header">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Tag :value="data.code || data.id" severity="info" class="text-xs" />
          <Tag v-if="data.track" :value="data.track" severity="secondary" class="text-xs" />
        </div>
        <i v-if="hasVariants" class="pi pi-layers text-xs" v-tooltip="'Multiple variants'"></i>
      </div>
    </div>

    <!-- Node Content -->
    <div class="node-content">
      <div class="font-semibold text-sm mb-2">{{ data.title }}</div>
      
      <!-- Variants Indicator -->
      <div v-if="hasVariants" class="variants-slider">
        <div class="flex items-center justify-between text-xs mb-1">
          <span class="text-gray-600">{{ variantCount }} variants</span>
          <Tag :value="selectedVariant?.meta.difficulty || 'std'" :severity="getDifficultySeverity()" size="small" />
        </div>
        <div class="variant-dots">
          <div 
            v-for="(variant, idx) in data.variants" 
            :key="variant.id"
            class="variant-dot"
            :class="{ 'active': idx === selectedVariantIndex }"
            :title="variant.id"
          />
        </div>
      </div>

      <!-- Blocks Count -->
      <div v-if="data.blocks" class="blocks-info">
        <div class="flex items-center gap-1 text-xs text-gray-600">
          <i class="pi pi-th-large"></i>
          <span>{{ data.blocks.length }} blocks</span>
        </div>
      </div>

      <!-- Metadata Tags -->
      <div class="meta-tags">
        <Tag v-if="data.modality" :value="data.modality" size="small" class="text-xs" />
        <Tag v-if="data.duration" :value="`${data.duration}s`" size="small" class="text-xs" icon="pi pi-clock" />
      </div>
    </div>

    <!-- Status Indicators -->
    <div v-if="isActive || isVisited" class="node-status">
      <i v-if="isActive" class="pi pi-map-marker text-blue-500"></i>
      <i v-else-if="isVisited" class="pi pi-check-circle text-green-500"></i>
    </div>

    <!-- Handles for connections -->
    <Handle type="target" :position="Position.Top" />
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Handle, Position } from '@vue-flow/core';
import Tag from 'primevue/tag';

interface PageNodeData {
  id: string;
  code?: string;
  title: string;
  track?: string;
  variants?: any[];
  blocks?: any[];
  modality?: string;
  duration?: number;
  isActive?: boolean;
  isVisited?: boolean;
  selectedVariantId?: string;
}

interface Props {
  data: PageNodeData;
}

const props = defineProps<Props>();

const hasVariants = computed(() => (props.data.variants?.length || 0) > 1);
const variantCount = computed(() => props.data.variants?.length || 0);
const isActive = computed(() => props.data.isActive);
const isVisited = computed(() => props.data.isVisited);

const selectedVariant = computed(() => {
  if (!props.data.variants || !props.data.selectedVariantId) return null;
  return props.data.variants.find(v => v.id === props.data.selectedVariantId);
});

const selectedVariantIndex = computed(() => {
  if (!props.data.variants || !props.data.selectedVariantId) return 0;
  return props.data.variants.findIndex(v => v.id === props.data.selectedVariantId);
});

const difficulty = computed(() => {
  if (selectedVariant.value?.meta?.difficulty) {
    return selectedVariant.value.meta.difficulty;
  }
  return 'std';
});

const getDifficultySeverity = () => {
  const diff = difficulty.value;
  if (diff === 'easy') return 'success';
  if (diff === 'hard') return 'danger';
  return 'info';
};
</script>

<style scoped>
.page-node {
  @apply bg-white rounded-lg shadow-lg border-2 border-gray-300 p-4 min-w-[200px] transition-all;
}

.page-node:hover {
  @apply shadow-xl scale-105;
}

.page-node.active {
  @apply border-blue-500 ring-4 ring-blue-200;
}

.page-node.visited {
  @apply border-green-400;
}

.page-node.difficulty-easy {
  @apply bg-green-50;
}

.page-node.difficulty-std {
  @apply bg-blue-50;
}

.page-node.difficulty-hard {
  @apply bg-red-50;
}

.page-node.has-variants {
  @apply border-purple-400;
}

.node-header {
  @apply mb-3 pb-2 border-b border-gray-200;
}

.node-content {
  @apply space-y-2;
}

.variants-slider {
  @apply p-2 bg-purple-50 rounded border border-purple-200;
}

.variant-dots {
  @apply flex gap-1 justify-center;
}

.variant-dot {
  @apply w-2 h-2 rounded-full bg-gray-300 transition-all;
}

.variant-dot.active {
  @apply bg-purple-500 scale-150;
}

.blocks-info {
  @apply py-1;
}

.meta-tags {
  @apply flex gap-1 flex-wrap;
}

.node-status {
  @apply absolute top-2 right-2;
}
</style>

