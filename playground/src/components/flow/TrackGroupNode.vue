<template>
  <div 
    class="track-group-node"
    :style="{
      width: `${data.width}px`,
      height: `${data.height}px`,
      borderColor: data.color,
      backgroundColor: data.color + '15',
    }"
  >
    <!-- Track header -->
    <div class="track-group-header" :style="{ backgroundColor: data.color }">
      <i :class="getTrackIcon(data.track)" class="mr-2"></i>
      <span class="font-bold">{{ data.label }}</span>
      <Tag 
        :value="`${data.pageCount} pages`" 
        severity="secondary" 
        size="small" 
        class="ml-auto bg-white/30"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import Tag from 'primevue/tag';

interface TrackGroupData {
  track: string;
  label: string;
  color: string;
  width: number;
  height: number;
  pageCount: number;
}

interface Props {
  data: TrackGroupData;
}

defineProps<Props>();

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
.track-group-node {
  @apply rounded-2xl border-[3px] border-dashed relative;
  pointer-events: none;
}

.track-group-header {
  @apply absolute -top-10 left-0 px-4 py-2 rounded-t-xl text-white text-sm flex items-center gap-2 shadow-lg;
  pointer-events: auto;
}
</style>

