<template>
  <Card class="path-replay">
    <template #title>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <i class="pi pi-route text-purple-500"></i>
          Learning Path
        </div>
        <Tag :value="`${path.length} steps`" severity="info" />
      </div>
    </template>

    <template #content>
      <div class="space-y-3">
        <!-- Path visualization -->
        <div class="path-steps">
          <div 
            v-for="(pageId, index) in path" 
            :key="`${pageId}-${index}`"
            class="path-step"
            :class="{ 'current': index === currentStep }"
          >
            <div class="step-number">{{ index + 1 }}</div>
            <div class="step-content">
              <div class="flex items-center gap-2">
                <Tag :value="pageId" severity="info" size="small" />
                <span class="text-sm font-medium">{{ getPageTitle(pageId) }}</span>
              </div>
              
              <!-- Show decision that led here -->
              <div v-if="index > 0" class="decision-info">
                <i class="pi pi-arrow-right text-xs text-gray-400 mr-1"></i>
                <span class="text-xs text-gray-600">{{ getDecisionReason(index) }}</span>
              </div>
            </div>
            <i 
              v-if="index === currentStep" 
              class="pi pi-map-marker text-blue-500"
            ></i>
            <i 
              v-else-if="index < currentStep" 
              class="pi pi-check-circle text-green-500"
            ></i>
          </div>
        </div>

        <!-- Path statistics -->
        <Divider />
        
        <div class="path-stats">
          <h4 class="text-sm font-semibold mb-2">Path Statistics</h4>
          <div class="grid grid-cols-2 gap-3">
            <div class="stat-item">
              <div class="text-lg font-bold text-blue-600">{{ path.length }}</div>
              <div class="text-xs text-gray-600">Total Steps</div>
            </div>
            <div class="stat-item">
              <div class="text-lg font-bold text-green-600">{{ uniquePages }}</div>
              <div class="text-xs text-gray-600">Unique Pages</div>
            </div>
            <div class="stat-item">
              <div class="text-lg font-bold text-purple-600">{{ branchingPoints }}</div>
              <div class="text-xs text-gray-600">Branch Points</div>
            </div>
            <div class="stat-item">
              <div class="text-lg font-bold text-orange-600">{{ trackSwitches }}</div>
              <div class="text-xs text-gray-600">Track Switches</div>
            </div>
          </div>
        </div>

        <!-- Export path -->
        <Divider />
        
        <div class="flex gap-2">
          <Button 
            label="Export Path" 
            icon="pi pi-download"
            @click="exportPath"
            size="small"
            outlined
            class="flex-1"
          />
          <Button 
            label="Share" 
            icon="pi pi-share-alt"
            @click="sharePath"
            size="small"
            outlined
            class="flex-1"
          />
        </div>
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Divider from 'primevue/divider';
import { useToast } from 'primevue/usetoast';

interface PageData {
  id: string;
  code?: string;
  title: string;
  track?: string;
}

interface Props {
  path: string[];
  currentStep: number;
  pages: Map<string, PageData>;
  decisions: Array<{ fromPage: string; toPage: string; reason: string }>;
}

const props = defineProps<Props>();
const toast = useToast();

const uniquePages = computed(() => new Set(props.path).size);

const branchingPoints = computed(() => {
  // Count pages that were visited more than once or had multiple options
  return props.decisions.filter(d => d.reason.includes('||')).length;
});

const trackSwitches = computed(() => {
  let switches = 0;
  for (let i = 1; i < props.path.length; i++) {
    const prevTrack = props.pages.get(props.path[i - 1])?.track;
    const currTrack = props.pages.get(props.path[i])?.track;
    if (prevTrack && currTrack && prevTrack !== currTrack) {
      switches++;
    }
  }
  return switches;
});

const getPageTitle = (pageId: string) => {
  return props.pages.get(pageId)?.title || pageId;
};

const getDecisionReason = (index: number) => {
  const decision = props.decisions[index - 1];
  return decision?.reason || 'Auto-progress';
};

const exportPath = () => {
  const data = {
    path: props.path,
    decisions: props.decisions,
    stats: {
      totalSteps: props.path.length,
      uniquePages: uniquePages.value,
      branchingPoints: branchingPoints.value,
      trackSwitches: trackSwitches.value,
    },
    timestamp: new Date().toISOString(),
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `learning-path-${Date.now()}.json`;
  a.click();
  
  toast.add({
    severity: 'success',
    summary: 'Path Exported',
    detail: 'Learning path saved to file',
    life: 2000,
  });
};

const sharePath = () => {
  const pathString = props.path.join(' → ');
  navigator.clipboard.writeText(pathString).then(() => {
    toast.add({
      severity: 'info',
      summary: 'Path Copied',
      detail: 'Learning path copied to clipboard',
      life: 2000,
    });
  });
};
</script>

<style scoped>
.path-replay {
  @apply shadow-lg;
}

.path-steps {
  @apply space-y-2 max-h-96 overflow-y-auto;
}

.path-step {
  @apply flex items-start gap-3 p-3 rounded-lg border border-gray-200 transition-all;
}

.path-step.current {
  @apply bg-blue-50 border-blue-400 ring-2 ring-blue-200;
}

.step-number {
  @apply flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 text-gray-700 text-xs font-bold flex items-center justify-center;
}

.path-step.current .step-number {
  @apply bg-blue-500 text-white;
}

.step-content {
  @apply flex-1;
}

.decision-info {
  @apply mt-1 flex items-center;
}

.path-stats {
  @apply p-3 bg-gray-50 rounded-lg;
}

.stat-item {
  @apply text-center p-2 bg-white rounded border border-gray-200;
}
</style>

