<template>
  <div class="flow-simulator">
    <div class="flex h-screen">
      <!-- Left Sidebar -->
      <div class="sidebar-left">
        <FlowSidebar 
          :context="studentContext"
          :current-page-id="currentPageId"
          :visited-pages="visitedPages"
          :is-simulating="isSimulating"
          :is-complete="isComplete"
          :active-rules="activeRules"
          @update:context="handleContextUpdate"
          @start="startSimulation"
          @step="stepForward"
          @reset="resetSimulation"
        />
      </div>

      <!-- Flow Canvas -->
      <div class="flow-canvas">
        <VueFlow
          v-model:nodes="nodes"
          v-model:edges="edges"
          :node-types="nodeTypes"
          :edge-types="edgeTypes"
          :default-zoom="0.8"
          :min-zoom="0.1"
          :max-zoom="2"
          class="vue-flow-container"
          @node-click="handleNodeClick"
        >
          <Background pattern-color="#ddd" :gap="16" />
          <Controls />
          <MiniMap />
          
          <Panel :position="PanelPosition.TopRight" class="flow-panel">
            <div class="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
              <div class="flex items-center gap-2 mb-3">
                <i class="pi pi-info-circle text-blue-500"></i>
                <span class="font-semibold">Path Simulation</span>
              </div>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between gap-4">
                  <span class="text-gray-600">Track:</span>
                  <Tag :value="studentContext.track" severity="info" />
                </div>
                <div class="flex justify-between gap-4">
                  <span class="text-gray-600">Accuracy:</span>
                  <span class="font-semibold">{{ (studentContext.accuracy * 100).toFixed(0) }}%</span>
                </div>
                <div class="flex justify-between gap-4">
                  <span class="text-gray-600">Engagement:</span>
                  <span class="font-semibold">{{ (studentContext.engagement * 100).toFixed(0) }}%</span>
                </div>
                <div class="flex justify-between gap-4">
                  <span class="text-gray-600">Progress:</span>
                  <Tag 
                    :value="`${visitedPages.size}/${nodes.length} pages`"
                    :severity="isComplete ? 'success' : 'info'"
                  />
                </div>
              </div>
            </div>
          </Panel>
        </VueFlow>
      </div>

      <!-- Right Sidebar - Path Replay & Node Details -->
      <div class="sidebar-right">
        <!-- Path Replay -->
        <PathReplay 
          v-if="simulationPath.length > 1"
          :path="simulationPath"
          :current-step="currentStep"
          :pages="pagesMap"
          :decisions="pathDecisions"
          class="mb-4"
        />

        <!-- Node Details -->
        <Card v-if="selectedNode">
          <template #title>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <i class="pi pi-file text-blue-500"></i>
                Page Details
              </div>
              <Button 
                icon="pi pi-times" 
                text 
                rounded 
                size="small"
                @click="selectedNode = null"
              />
            </div>
          </template>

          <template #content>
            <div class="space-y-4">
              <div>
                <div class="text-xs text-gray-600 mb-1">Page ID</div>
                <div class="font-mono text-sm">{{ selectedNode.id }}</div>
              </div>

              <div>
                <div class="text-xs text-gray-600 mb-1">Title</div>
                <div class="font-semibold">{{ selectedNode.data.title }}</div>
              </div>

              <div v-if="selectedNode.data.track">
                <div class="text-xs text-gray-600 mb-1">Required Track</div>
                <Tag :value="selectedNode.data.track" />
              </div>

              <!-- Variants -->
              <div v-if="selectedNode.data.variants && selectedNode.data.variants.length > 0">
                <Divider />
                <div class="text-xs text-gray-600 mb-2">Content Variants</div>
                <div class="space-y-2">
                  <div 
                    v-for="variant in selectedNode.data.variants" 
                    :key="variant.id"
                    class="variant-card"
                    :class="{ 'selected': variant.id === selectedNode.data.selectedVariantId }"
                  >
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-xs font-medium">{{ variant.id }}</span>
                      <Tag 
                        :value="variant.meta?.difficulty || 'std'" 
                        :severity="getDifficultySeverity(variant.meta?.difficulty)"
                        size="small"
                      />
                    </div>
                    <div class="flex gap-1">
                      <Tag v-if="variant.meta?.theme" :value="variant.meta.theme" size="small" class="text-xs" />
                      <Tag v-if="variant.meta?.modality" :value="variant.meta.modality" size="small" class="text-xs" />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Blocks -->
              <div v-if="selectedNode.data.blocks">
                <Divider />
                <div class="text-xs text-gray-600 mb-2">Content Blocks</div>
                <div class="space-y-1">
                  <div 
                    v-for="block in selectedNode.data.blocks" 
                    :key="block.id"
                    class="block-item"
                  >
                    <i :class="getBlockIcon(block.type)" class="text-xs mr-2"></i>
                    <span class="text-xs">{{ block.type }}</span>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { VueFlow, Panel, PanelPosition, useVueFlow } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';
import { MiniMap } from '@vue-flow/minimap';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import Slider from 'primevue/slider';
import InputNumber from 'primevue/inputnumber';
import Checkbox from 'primevue/checkbox';
import Tag from 'primevue/tag';
import Divider from 'primevue/divider';
import PageNode from '../components/flow/PageNode.vue';
import ConditionalEdge from '../components/flow/ConditionalEdge.vue';
import FlowSidebar, { type StudentContext } from '../components/flow/FlowSidebar.vue';
import PathReplay from '../components/flow/PathReplay.vue';

// Import VueFlow styles
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import '@vue-flow/controls/dist/style.css';
import '@vue-flow/minimap/dist/style.css';

// Register custom node and edge types
const nodeTypes = {
  page: PageNode,
};

const edgeTypes = {
  conditional: ConditionalEdge,
};

// Student simulation context
const studentContext = ref<StudentContext>({
  track: 'core',
  accuracy: 0.75,
  engagement: 0.7,
  streak: 2,
  enrichmentEnabled: false,
});

const currentPageId = ref('P1');
const visitedPages = ref(new Set(['P1']));
const isSimulating = ref(false);
const isComplete = ref(false);
const selectedNode = ref<any>(null);
const simulationPath = ref<string[]>(['P1']);
const currentStep = ref(0);
const pathDecisions = ref<Array<{ fromPage: string; toPage: string; reason: string }>>([]);

// Pages map for quick lookup
const pagesMap = computed(() => {
  const map = new Map();
  nodes.value.forEach(node => {
    map.set(node.id, node.data);
  });
  return map;
});

// Define nodes (pages) - Rich learning path with branching
const nodes = ref([
  {
    id: 'P1',
    type: 'page',
    position: { x: 450, y: 50 },
    data: {
      id: 'P1',
      code: 'P1',
      title: 'Intro - Fractions Basics',
      track: 'core',
      isActive: true,
      isVisited: true,
      variants: [
        { id: 'easy_video_soccer', meta: { difficulty: 'easy', modality: 'video', theme: 'soccer', durationSec: 90 } },
        { id: 'std_reading', meta: { difficulty: 'std', modality: 'reading', durationSec: 120 } },
        { id: 'hard_interactive', meta: { difficulty: 'hard', modality: 'interactive', durationSec: 180 } },
      ],
      selectedVariantId: 'std_reading',
      blocks: [
        { id: 'b1', type: 'text' },
        { id: 'b2', type: 'video' },
        { id: 'b3', type: 'question' },
      ],
      modality: 'video',
      duration: 120,
    },
  },
  {
    id: 'P2',
    type: 'page',
    position: { x: 450, y: 250 },
    data: {
      id: 'P2',
      code: 'P2',
      title: 'Practice Quiz',
      track: 'core',
      isActive: false,
      isVisited: false,
      variants: [
        { id: 'easy_hints', meta: { difficulty: 'easy', modality: 'quiz' } },
        { id: 'std_quiz', meta: { difficulty: 'std', modality: 'quiz' } },
      ],
      selectedVariantId: 'std_quiz',
      blocks: [
        { id: 'b1', type: 'text' },
        { id: 'b2', type: 'multiple_choice' },
        { id: 'b3', type: 'multiple_choice' },
      ],
    },
  },
  {
    id: 'P3a',
    type: 'page',
    position: { x: 250, y: 450 },
    data: {
      id: 'P3a',
      code: 'P3a',
      title: 'Project Work',
      track: 'project',
      isActive: false,
      isVisited: false,
      blocks: [
        { id: 'b1', type: 'text' },
        { id: 'b2', type: 'file_upload' },
        { id: 'b3', type: 'image' },
      ],
    },
  },
  {
    id: 'P3b',
    type: 'page',
    position: { x: 650, y: 450 },
    data: {
      id: 'P3b',
      code: 'P3b',
      title: 'Extended Practice',
      track: 'enrichment',
      isActive: false,
      isVisited: false,
      variants: [
        { id: 'guided_practice', meta: { difficulty: 'easy', modality: 'interactive' } },
        { id: 'independent_work', meta: { difficulty: 'hard', modality: 'simulation' } },
      ],
      selectedVariantId: 'guided_practice',
      blocks: [
        { id: 'b1', type: 'text' },
        { id: 'b2', type: 'question' },
      ],
    },
  },
  {
    id: 'P4',
    type: 'page',
    position: { x: 450, y: 650 },
    data: {
      id: 'P4',
      code: 'P4',
      title: 'Final Assessment',
      track: 'core',
      isActive: false,
      isVisited: false,
      blocks: [
        { id: 'b1', type: 'text' },
        { id: 'b2', type: 'question' },
        { id: 'b3', type: 'question' },
        { id: 'b4', type: 'question' },
      ],
    },
  },
]);

// Define edges (connections with conditional rules)
const edges = ref([
  {
    id: 'e1-2',
    source: 'P1',
    target: 'P2',
    type: 'conditional',
    animated: true,
    data: {
      condition: 'track: core',
      conditionMet: true,
    },
  },
  {
    id: 'e2-3a',
    source: 'P2',
    target: 'P3a',
    type: 'conditional',
    data: {
      condition: 'track: project',
      conditionMet: false,
    },
  },
  {
    id: 'e2-3b',
    source: 'P2',
    target: 'P3b',
    type: 'conditional',
    data: {
      condition: 'track: enrichment && engagement > 0.6',
      conditionMet: false,
    },
  },
  {
    id: 'e2-4',
    source: 'P2',
    target: 'P4',
    type: 'conditional',
    data: {
      condition: 'track: core && accuracy > 0.8',
      conditionMet: false,
    },
  },
  {
    id: 'e3a-4',
    source: 'P3a',
    target: 'P4',
    type: 'conditional',
    data: {
      condition: 'completed',
      conditionMet: false,
    },
  },
  {
    id: 'e3a-3b',
    source: 'P3a',
    target: 'P3b',
    type: 'conditional',
    data: {
      condition: 'enrichment && engagement <= 0.6',
      conditionMet: false,
    },
  },
  {
    id: 'e3b-4',
    source: 'P3b',
    target: 'P4',
    type: 'conditional',
    data: {
      condition: 'completed',
      conditionMet: false,
    },
  },
]);

// Active rules from current page
const activeRules = computed(() => {
  const outgoingEdges = edges.value.filter(e => e.source === currentPageId.value);
  return outgoingEdges.map(e => ({
    id: e.id,
    condition: e.data?.condition || '',
    conditionMet: evaluateCondition(e.data?.condition || ''),
    targetPageId: e.target,
  }));
});

// Evaluate condition based on student context
const evaluateCondition = (condition: string): boolean => {
  if (!condition) return true;
  
  const ctx = studentContext.value;
  
  try {
    // Parse simple conditions
    if (condition.includes('track:')) {
      const trackMatch = condition.match(/track:\s*(\w+)/);
      if (trackMatch) {
        return ctx.track === trackMatch[1];
      }
    }
    
    if (condition.includes('engagement')) {
      if (condition.includes('>')) {
        const threshold = parseFloat(condition.match(/>([\d.]+)/)?.[1] || '0');
        return ctx.engagement > threshold;
      }
      if (condition.includes('<=')) {
        const threshold = parseFloat(condition.match(/<=([\d.]+)/)?.[1] || '0');
        return ctx.engagement <= threshold;
      }
    }
    
    if (condition.includes('accuracy')) {
      if (condition.includes('>')) {
        const threshold = parseFloat(condition.match(/>([\d.]+)/)?.[1] || '0');
        return ctx.accuracy > threshold;
      }
    }
    
    if (condition === 'completed') {
      return visitedPages.value.has(currentPageId.value);
    }
    
    if (condition.includes('&&')) {
      const parts = condition.split('&&').map(p => p.trim());
      return parts.every(p => evaluateCondition(p));
    }
    
    return true;
  } catch (e) {
    console.error('Error evaluating condition:', condition, e);
    return false;
  }
};

// Update edge conditions based on context
const updateEdgeConditions = () => {
  edges.value.forEach(edge => {
    if (edge.data) {
      edge.data.conditionMet = evaluateCondition(edge.data.condition || '');
    }
  });
};

// Update node states
const updateNodeStates = () => {
  nodes.value.forEach(node => {
    node.data.isActive = node.id === currentPageId.value;
    node.data.isVisited = visitedPages.value.has(node.id);
  });
};

// Handle context updates from sidebar
const handleContextUpdate = (newContext: StudentContext) => {
  studentContext.value = newContext;
  updateEdgeConditions();
};

// Start simulation
const startSimulation = () => {
  isSimulating.value = true;
  isComplete.value = false;
  currentPageId.value = 'P1';
  visitedPages.value = new Set(['P1']);
  simulationPath.value = ['P1'];
  currentStep.value = 0;
  pathDecisions.value = [];
  updateNodeStates();
  updateEdgeConditions();
};

// Step forward in simulation
const stepForward = () => {
  const currentEdges = edges.value.filter(e => e.source === currentPageId.value);
  const validEdges = currentEdges.filter(e => e.data?.conditionMet);
  
  if (validEdges.length === 0) {
    // No valid path forward - end simulation
    isComplete.value = true;
    return;
  }
  
  // Take first valid edge (in real scenario, might need user choice)
  const nextEdge = validEdges[0];
  const nextPageId = nextEdge.target;
  const fromPageId = currentPageId.value;
  
  // Record decision
  pathDecisions.value.push({
    fromPage: fromPageId,
    toPage: nextPageId,
    reason: nextEdge.data?.condition || 'Auto-progress',
  });
  
  currentPageId.value = nextPageId;
  visitedPages.value.add(nextPageId);
  simulationPath.value.push(nextPageId);
  currentStep.value = simulationPath.value.length - 1;
  
  // Animate the edge
  edges.value.forEach(e => {
    if (e.id === nextEdge.id) {
      e.animated = true;
    }
  });
  
  updateNodeStates();
  updateEdgeConditions();
  
  // Check if we reached final page
  const hasNextSteps = edges.value.some(e => e.source === nextPageId && e.data?.conditionMet);
  if (!hasNextSteps) {
    isComplete.value = true;
  }
};

// Reset simulation
const resetSimulation = () => {
  isSimulating.value = false;
  isComplete.value = false;
  currentPageId.value = 'P1';
  visitedPages.value = new Set(['P1']);
  simulationPath.value = ['P1'];
  currentStep.value = 0;
  pathDecisions.value = [];
  
  // Reset edge animations
  edges.value.forEach(e => {
    e.animated = e.id === 'e1-2'; // Only first edge animated initially
  });
  
  updateNodeStates();
  updateEdgeConditions();
};

// Handle node click
const handleNodeClick = ({ node }: any) => {
  selectedNode.value = node;
};

// Utility functions
const getDifficultySeverity = (difficulty?: string) => {
  if (difficulty === 'easy') return 'success';
  if (difficulty === 'hard') return 'danger';
  return 'info';
};

const getBlockIcon = (type: string) => {
  const icons: Record<string, string> = {
    text: 'pi pi-align-left',
    video: 'pi pi-video',
    question: 'pi pi-question-circle',
    multiple_choice: 'pi pi-list',
    file_upload: 'pi pi-upload',
    image: 'pi pi-image',
  };
  return icons[type] || 'pi pi-circle';
};

onMounted(() => {
  updateNodeStates();
  updateEdgeConditions();
});
</script>

<style scoped>
.flow-simulator {
  @apply h-screen overflow-hidden bg-gray-50;
}

.sidebar-left {
  @apply w-80 bg-white border-r border-gray-200 overflow-y-auto;
}

.sidebar-right {
  @apply w-96 bg-white border-l border-gray-200 overflow-y-auto p-4;
}

.flow-canvas {
  @apply flex-1 relative;
}

.vue-flow-container {
  @apply w-full h-full;
}

.flow-panel {
  @apply pointer-events-auto;
}

.variant-card {
  @apply p-2 bg-gray-50 rounded border border-gray-200 transition-all;
}

.variant-card.selected {
  @apply bg-purple-50 border-purple-400 ring-2 ring-purple-200;
}

.block-item {
  @apply flex items-center p-2 bg-gray-50 rounded text-gray-700;
}

:deep(.vue-flow__minimap) {
  @apply shadow-lg rounded-lg overflow-hidden border border-gray-300;
}

:deep(.vue-flow__controls) {
  @apply shadow-lg rounded-lg overflow-hidden border border-gray-300;
}
</style>

