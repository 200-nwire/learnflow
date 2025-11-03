<template>
  <div class="layout-controls">
    <div class="controls-group">
      <!-- Layout Mode Switcher -->
      <button
        @click="toggleLayout"
        class="control-button"
        :class="{ 'active': layoutMode === 'linear' }"
        :title="layoutMode === 'flow' ? 'Switch to Linear (Authoring)' : 'Switch to Flow (Graph)'"
      >
        <i :class="layoutMode === 'flow' ? 'pi pi-list' : 'pi pi-sitemap'"></i>
      </button>

      <!-- Apply Layout -->
      <button
        @click="applyLayout"
        class="control-button"
        title="Re-apply Auto Layout"
      >
        <i class="pi pi-refresh"></i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  layoutMode: 'flow' | 'linear';
}

interface Emits {
  (e: 'toggle-layout'): void;
  (e: 'apply-layout'): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

const toggleLayout = () => {
  emit('toggle-layout');
};

const applyLayout = () => {
  emit('apply-layout');
};
</script>

<style scoped>
.layout-controls {
  @apply bg-white rounded-lg shadow-lg border border-gray-300 p-1;
}

.controls-group {
  @apply flex flex-col gap-1;
}

.control-button {
  @apply w-8 h-8 flex items-center justify-center rounded transition-all bg-white hover:bg-gray-100 border border-transparent;
}

.control-button:hover {
  @apply border-blue-300 bg-blue-50;
}

.control-button.active {
  @apply bg-blue-500 text-white border-blue-600;
}

.control-button i {
  @apply text-sm;
}
</style>

