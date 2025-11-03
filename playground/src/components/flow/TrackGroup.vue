<template>
  <div 
    class="track-group"
    :style="{
      left: `${position.x}px`,
      top: `${position.y}px`,
      width: `${width}px`,
      height: `${height}px`,
      borderColor: color,
      backgroundColor: bgColor,
    }"
  >
    <div class="track-header" :style="{ backgroundColor: color }">
      <i :class="getTrackIcon(trackName)" class="mr-2"></i>
      <span class="font-semibold">{{ trackLabel }}</span>
      <Tag :value="`${pageCount} pages`" severity="secondary" size="small" class="ml-auto" />
    </div>
  </div>
</template>

<script setup lang="ts">
import Tag from 'primevue/tag';

interface Props {
  trackName: string;
  trackLabel: string;
  position: { x: number; y: number };
  width: number;
  height: number;
  color: string;
  pageCount: number;
}

defineProps<Props>();

const bgColor = (color: string) => {
  return color + '10'; // Add transparency
};

const getTrackIcon = (track: string) => {
  const icons: Record<string, string> = {
    core: 'pi pi-book',
    project: 'pi pi-briefcase',
    enrichment: 'pi pi-star',
    remedial: 'pi pi-heart',
  };
  return icons[track] || 'pi pi-folder';
};
</script>

<style scoped>
.track-group {
  @apply absolute rounded-lg border-2 border-dashed pointer-events-none;
  z-index: 0;
}

.track-header {
  @apply absolute -top-6 left-0 px-3 py-1 rounded-t-lg text-white text-sm flex items-center gap-2;
  pointer-events: auto;
}
</style>

