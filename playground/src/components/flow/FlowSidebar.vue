<template>
  <div class="flow-sidebar">
    <Card>
      <template #title>
        <div class="flex items-center gap-2">
          <i class="pi pi-sliders-h text-purple-500"></i>
          Student Simulation
        </div>
      </template>

      <template #content>
        <div class="space-y-6">
          <!-- Track Selection -->
          <div>
            <label class="block text-sm font-semibold mb-2">Learning Track</label>
            <Dropdown 
              v-model="localContext.track" 
              :options="trackOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full"
              @change="emitUpdate"
            />
          </div>

          <!-- Performance Metrics -->
          <div>
            <h4 class="text-sm font-semibold mb-3">Performance</h4>
            
            <div class="space-y-3">
              <div>
                <label class="block text-xs mb-1">
                  Accuracy: {{ (localContext.accuracy * 100).toFixed(0) }}%
                </label>
                <Slider 
                  v-model="accuracyPercent" 
                  :min="0" 
                  :max="100"
                  @change="emitUpdate"
                />
              </div>

              <div>
                <label class="block text-xs mb-1">
                  Engagement: {{ (localContext.engagement * 100).toFixed(0) }}%
                </label>
                <Slider 
                  v-model="engagementPercent" 
                  :min="0" 
                  :max="100"
                  @change="emitUpdate"
                />
              </div>

              <div>
                <label class="block text-xs mb-1">
                  Streak: {{ localContext.streak }}
                </label>
                <InputNumber 
                  v-model="localContext.streak" 
                  :min="0" 
                  :max="20"
                  showButtons
                  buttonLayout="horizontal"
                  class="w-full"
                  @update:model-value="emitUpdate"
                />
              </div>
            </div>
          </div>

          <Divider />

          <!-- Enrichment Settings -->
          <div>
            <h4 class="text-sm font-semibold mb-3">Enrichment</h4>
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <Checkbox 
                  v-model="localContext.enrichmentEnabled" 
                  inputId="enrichment" 
                  binary
                  @update:model-value="emitUpdate"
                />
                <label for="enrichment" class="text-sm">Enable Enrichment Track</label>
              </div>
            </div>
          </div>

          <Divider />

          <!-- Path Control -->
          <div>
            <h4 class="text-sm font-semibold mb-3">Path Simulation</h4>
            
            <div class="space-y-2">
              <Button 
                label="Start Simulation"
                icon="pi pi-play"
                @click="startSimulation"
                severity="success"
                :disabled="isSimulating"
                class="w-full"
              />
              
              <Button 
                label="Step Forward"
                icon="pi pi-step-forward"
                @click="stepForward"
                :disabled="!isSimulating || isComplete"
                outlined
                class="w-full"
              />
              
              <Button 
                label="Reset Path"
                icon="pi pi-refresh"
                @click="resetPath"
                severity="secondary"
                outlined
                class="w-full"
              />
            </div>
          </div>

          <Divider />

          <!-- Current State -->
          <div>
            <h4 class="text-sm font-semibold mb-3">Current State</h4>
            <div class="space-y-2 text-xs">
              <div class="flex justify-between">
                <span class="text-gray-600">Current Page:</span>
                <Tag :value="currentPageId" severity="info" />
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Pages Visited:</span>
                <span class="font-semibold">{{ visitedPages.size }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Status:</span>
                <Tag 
                  :value="isComplete ? 'Complete' : isSimulating ? 'Active' : 'Ready'" 
                  :severity="isComplete ? 'success' : isSimulating ? 'info' : 'secondary'"
                />
              </div>
            </div>
          </div>

          <Divider />

          <!-- Rules Preview -->
          <div>
            <h4 class="text-sm font-semibold mb-3">Active Rules</h4>
            <div class="space-y-2">
              <div 
                v-for="rule in activeRules" 
                :key="rule.id"
                class="rule-item"
                :class="{ 'met': rule.conditionMet }"
              >
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="text-xs font-mono">{{ rule.condition }}</div>
                  </div>
                  <i 
                    :class="rule.conditionMet ? 'pi pi-check-circle text-green-500' : 'pi pi-times-circle text-gray-400'"
                    class="text-sm"
                  ></i>
                </div>
              </div>
              
              <div v-if="activeRules.length === 0" class="text-xs text-gray-500 text-center py-2">
                No conditional rules from current page
              </div>
            </div>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import Card from 'primevue/card';
import Dropdown from 'primevue/dropdown';
import Slider from 'primevue/slider';
import InputNumber from 'primevue/inputnumber';
import Checkbox from 'primevue/checkbox';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Divider from 'primevue/divider';

export interface StudentContext {
  track: string;
  accuracy: number;
  engagement: number;
  streak: number;
  enrichmentEnabled: boolean;
}

interface Rule {
  id: string;
  condition: string;
  conditionMet: boolean;
  targetPageId: string;
}

interface Props {
  context: StudentContext;
  currentPageId: string;
  visitedPages: Set<string>;
  isSimulating: boolean;
  isComplete: boolean;
  activeRules: Rule[];
}

interface Emits {
  (e: 'update:context', context: StudentContext): void;
  (e: 'start'): void;
  (e: 'step'): void;
  (e: 'reset'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const localContext = ref<StudentContext>({ ...props.context });

const trackOptions = [
  { label: 'Core Track', value: 'core' },
  { label: 'Project Track', value: 'project' },
  { label: 'Enrichment Track', value: 'enrichment' },
];

const accuracyPercent = computed({
  get: () => localContext.value.accuracy * 100,
  set: (val) => { localContext.value.accuracy = val / 100; }
});

const engagementPercent = computed({
  get: () => localContext.value.engagement * 100,
  set: (val) => { localContext.value.engagement = val / 100; }
});

watch(() => props.context, (newContext) => {
  localContext.value = { ...newContext };
}, { deep: true });

const emitUpdate = () => {
  emit('update:context', localContext.value);
};

const startSimulation = () => {
  emit('start');
};

const stepForward = () => {
  emit('step');
};

const resetPath = () => {
  emit('reset');
};
</script>

<style scoped>
.flow-sidebar {
  @apply h-full overflow-y-auto;
}

.rule-item {
  @apply p-2 bg-gray-50 rounded border border-gray-200 transition-all;
}

.rule-item.met {
  @apply bg-green-50 border-green-300;
}
</style>

