<template>
  <div class="page-navigation">
    <Card>
      <template #title>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <i class="pi pi-book text-blue-500"></i>
            <span>{{ currentPage.title }}</span>
          </div>
          <Tag :value="`Page ${currentPageIndex + 1} of ${pages.length}`" />
        </div>
      </template>

      <template #content>
        <!-- Page Progress -->
        <div class="mb-6">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm text-gray-600">Lesson Progress</span>
            <span class="text-sm font-semibold">{{ Math.round(progress) }}%</span>
          </div>
          <ProgressBar :value="progress" />
        </div>

        <!-- Current Page Content -->
        <div class="page-content">
          <div class="flex items-center gap-2 mb-4">
            <Tag :value="currentPage.id" severity="info" icon="pi pi-tag" />
            <span class="text-sm text-gray-500">{{ currentPage.description }}</span>
          </div>

          <!-- Page Blocks -->
          <div class="space-y-4">
            <slot />
          </div>
        </div>

        <!-- Navigation Controls -->
        <div class="navigation-controls">
          <div class="flex items-center justify-between">
            <Button 
              label="Previous"
              icon="pi pi-arrow-left"
              @click="goToPrevious"
              :disabled="currentPageIndex === 0"
              outlined
            />

            <!-- Page Dots -->
            <div class="flex gap-2">
              <button
                v-for="(page, index) in pages"
                :key="page.id"
                @click="goToPage(index)"
                class="page-dot"
                :class="{ 
                  'active': index === currentPageIndex,
                  'visited': visitedPages.has(page.id)
                }"
                :title="page.title"
              />
            </div>

            <Button 
              label="Next"
              icon="pi pi-arrow-right"
              iconPos="right"
              @click="goToNext"
              :disabled="currentPageIndex === pages.length - 1"
            />
          </div>
        </div>

        <!-- Time Tracking -->
        <div class="time-tracking">
          <div class="flex items-center justify-between text-sm text-gray-600">
            <span>Time on page: {{ formatTime(timeOnCurrentPage) }}</span>
            <span>Total time: {{ formatTime(totalTime) }}</span>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import ProgressBar from 'primevue/progressbar';

export interface Page {
  id: string;
  title: string;
  description: string;
}

interface Props {
  pages: Page[];
  initialPageIndex?: number;
}

interface Emits {
  (e: 'page-change', data: { from: Page; to: Page; direction: 'next' | 'prev' | 'jump'; timeOnPageMs: number }): void;
}

const props = withDefaults(defineProps<Props>(), {
  initialPageIndex: 0,
});

const emit = defineEmits<Emits>();

const currentPageIndex = ref(props.initialPageIndex);
const visitedPages = ref(new Set<string>([props.pages[props.initialPageIndex]?.id]));
const timeOnCurrentPage = ref(0);
const totalTime = ref(0);
const pageStartTime = ref(Date.now());

let timerInterval: number | null = null;

const currentPage = computed(() => props.pages[currentPageIndex.value] || props.pages[0]);

const progress = computed(() => {
  return ((currentPageIndex.value + 1) / props.pages.length) * 100;
});

const goToNext = () => {
  if (currentPageIndex.value < props.pages.length - 1) {
    navigateToPage(currentPageIndex.value + 1, 'next');
  }
};

const goToPrevious = () => {
  if (currentPageIndex.value > 0) {
    navigateToPage(currentPageIndex.value - 1, 'prev');
  }
};

const goToPage = (index: number) => {
  if (index !== currentPageIndex.value) {
    navigateToPage(index, 'jump');
  }
};

const navigateToPage = (newIndex: number, direction: 'next' | 'prev' | 'jump') => {
  const timeOnPage = Date.now() - pageStartTime.value;
  const fromPage = currentPage.value;
  const toPage = props.pages[newIndex];

  currentPageIndex.value = newIndex;
  visitedPages.value.add(toPage.id);
  
  emit('page-change', {
    from: fromPage,
    to: toPage,
    direction,
    timeOnPageMs: timeOnPage,
  });

  // Reset page timer
  timeOnCurrentPage.value = 0;
  pageStartTime.value = Date.now();
};

const formatTime = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${seconds}s`;
};

onMounted(() => {
  timerInterval = window.setInterval(() => {
    timeOnCurrentPage.value = Date.now() - pageStartTime.value;
    totalTime.value += 1000;
  }, 1000);
});

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
});

// Watch for external page changes
watch(() => props.initialPageIndex, (newIndex) => {
  if (newIndex !== currentPageIndex.value) {
    currentPageIndex.value = newIndex;
  }
});
</script>

<style scoped>
.page-navigation {
  @apply w-full;
}

.page-content {
  @apply min-h-[200px] p-4 bg-gray-50 rounded-lg border border-gray-200 mb-6;
}

.navigation-controls {
  @apply pt-4 border-t border-gray-200 mb-4;
}

.page-dot {
  @apply w-3 h-3 rounded-full bg-gray-300 transition-all cursor-pointer;
}

.page-dot:hover {
  @apply bg-gray-400 scale-125;
}

.page-dot.active {
  @apply bg-blue-500 scale-125;
}

.page-dot.visited {
  @apply bg-green-400;
}

.page-dot.visited.active {
  @apply bg-blue-500;
}

.time-tracking {
  @apply pt-3 border-t border-gray-200;
}
</style>

