<template>
  <div class="branch-indicator" :class="{ 'active': isActive }">
    <div class="indicator-line"></div>
    <div class="indicator-badge">
      <Tag 
        :value="branchLabel" 
        :severity="isActive ? 'success' : 'secondary'"
        size="small"
        class="text-xs"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  branchLabel: string;
  isActive: boolean;
}

defineProps<Props>();
</script>

<style scoped>
.branch-indicator {
  @apply absolute left-1/2 -translate-x-1/2 flex flex-col items-center;
  top: -30px;
  z-index: 10;
}

.indicator-line {
  @apply w-px h-6 bg-gray-300;
}

.branch-indicator.active .indicator-line {
  @apply bg-green-500 w-0.5;
}

.indicator-badge {
  @apply -mt-1;
}
</style>

