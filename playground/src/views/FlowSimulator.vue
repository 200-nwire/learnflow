<template>
  <div class="flow-simulator h-screen flex flex-col">
    <div class="flex flex-1 overflow-hidden">
      <!-- Left Sidebar -->
      <div class="sidebar-left">
        <FlowSidebar 
          :context="studentContext"
          :current-page-id="currentPageId"
          :visited-pages="visitedPages"
          :is-simulating="isSimulating"
          :is-complete="isComplete"
          :active-rules="activeRules"
          :layout-mode="layoutMode"
          @update:context="handleContextUpdate"
          @start="startSimulation"
          @step="stepForward"
          @reset="resetSimulation"
        />
      </div>

      <!-- Flow Canvas -->
      <div class="flow-canvas">
        <VueFlow
          v-model:nodes="allNodes"
          v-model:edges="visibleEdges"
          :node-types="nodeTypes"
          :edge-types="edgeTypes"
          :default-zoom="0.6"
          :min-zoom="0.1"
          :max-zoom="2"
          :fit-view-on-init="true"
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
              <div class="space-y-3 text-sm">
                <!-- Layout Switcher -->
                <div class="space-y-2">
                  <label class="text-xs font-semibold text-gray-700 uppercase tracking-wide">Layout View</label>
                  <div class="flex gap-1 p-1 bg-gray-100 rounded-lg">
                    <Button
                      :icon="'pi pi-sitemap'"
                      @click="setLayoutMode('flow')"
                      :severity="layoutMode === 'flow' ? 'info' : 'secondary'"
                      :outlined="layoutMode !== 'flow'"
                      :text="layoutMode !== 'flow'"
                      size="small"
                      class="flex-1"
                      v-tooltip.bottom="'Flow Graph'"
                    >
                      <span class="hidden sm:inline">Flow</span>
                    </Button>
                    <Button
                      :icon="'pi pi-bars'"
                      @click="setLayoutMode('linear')"
                      :severity="layoutMode === 'linear' ? 'info' : 'secondary'"
                      :outlined="layoutMode !== 'linear'"
                      :text="layoutMode !== 'linear'"
                      size="small"
                      class="flex-1"
                      v-tooltip.bottom="'Track Groups'"
                    >
                      <span class="hidden sm:inline">Track</span>
                    </Button>
                    <Button
                      :icon="'pi pi-sort-numeric-up'"
                      @click="setLayoutMode('sequential')"
                      :severity="layoutMode === 'sequential' ? 'info' : 'secondary'"
                      :outlined="layoutMode !== 'sequential'"
                      :text="layoutMode !== 'sequential'"
                      size="small"
                      class="flex-1"
                      v-tooltip.bottom="'Page Order'"
                    >
                      <span class="hidden sm:inline">Order</span>
                    </Button>
                  </div>
                  <div class="text-xs text-gray-500 text-center px-1">
                    {{ layoutMode === 'flow' ? '📊 Graph with connections' : 
                       layoutMode === 'linear' ? '📚 Grouped by tracks' : 
                       '🔢 Sequential order' }}
                  </div>
                </div>
                
                <Divider />
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

        <!-- Graph Overview (when no path) -->
        <Card v-else class="mb-4">
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-chart-network text-blue-500"></i>
              Learning Path Overview
            </div>
          </template>
          <template #content>
            <div class="space-y-4">
              <p class="text-sm text-gray-600">
                Start a simulation to visualize a student's learning journey through the content.
              </p>

              <!-- Graph Stats -->
              <Divider />
              <div class="space-y-3">
                <h4 class="text-sm font-semibold">Graph Statistics</h4>
                <div class="grid grid-cols-2 gap-3">
                  <div class="stat-item">
                    <div class="text-lg font-bold text-blue-600">{{ nodes.length }}</div>
                    <div class="text-xs text-gray-600">Total Pages</div>
                  </div>
                  <div class="stat-item">
                    <div class="text-lg font-bold text-purple-600">{{ edges.length }}</div>
                    <div class="text-xs text-gray-600">Connections</div>
                  </div>
                  <div class="stat-item">
                    <div class="text-lg font-bold text-green-600">{{ trackCounts?.core || 0 }}</div>
                    <div class="text-xs text-gray-600">Core Track</div>
                  </div>
                  <div class="stat-item">
                    <div class="text-lg font-bold text-red-600">{{ trackCounts?.remedial || 0 }}</div>
                    <div class="text-xs text-gray-600">Remedial</div>
                  </div>
                  <div class="stat-item">
                    <div class="text-lg font-bold text-purple-600">{{ trackCounts?.project || 0 }}</div>
                    <div class="text-xs text-gray-600">Project</div>
                  </div>
                  <div class="stat-item">
                    <div class="text-lg font-bold text-teal-600">{{ trackCounts?.enrichment || 0 }}</div>
                    <div class="text-xs text-gray-600">Enrichment</div>
                  </div>
                </div>
              </div>

              <!-- Quick Actions -->
              <Divider />
              <div class="space-y-2">
                <h4 class="text-sm font-semibold">Quick Actions</h4>
                <Button 
                  label="Start Simulation" 
                  icon="pi pi-play"
                  @click="startSimulation"
                  :disabled="isSimulating"
                  class="w-full"
                  severity="success"
                  size="small"
                />
              </div>
            </div>
          </template>
        </Card>

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
import { ref, computed, onMounted, watch, nextTick } from 'vue';
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
import TrackGroupNode from '../components/flow/TrackGroupNode.vue';
import ConditionalEdge from '../components/flow/ConditionalEdge.vue';
import FlowSidebar, { type StudentContext } from '../components/flow/FlowSidebar.vue';
import PathReplay from '../components/flow/PathReplay.vue';
import dagre from 'dagre';

// Import VueFlow styles
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import '@vue-flow/controls/dist/style.css';
import '@vue-flow/minimap/dist/style.css';

// Register custom node and edge types
const nodeTypes = {
  page: PageNode,
  trackGroup: TrackGroupNode,
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
const layoutMode = ref<'flow' | 'linear' | 'sequential'>('linear');

// All nodes including track groups and pages
const allNodes = computed(() => {
  const result = [...nodes.value];
  
  // Add track group nodes in linear mode
  if (layoutMode.value === 'linear') {
    const trackGroupNodes = createTrackGroupNodes();
    result.unshift(...trackGroupNodes); // Add at beginning (behind pages)
  }
  
  // Add track group nodes in sequential mode
  if (layoutMode.value === 'sequential') {
    const trackGroupNodes = createSequentialTrackGroupNodes();
    result.unshift(...trackGroupNodes); // Add at beginning (behind pages)
  }
  
  return result;
});

// Pages map for quick lookup
const pagesMap = computed(() => {
  const map = new Map();
  nodes.value.forEach(node => {
    map.set(node.id, node.data);
  });
  return map;
});

// Track counts for stats
const trackCounts = computed(() => {
  const counts: Record<string, number> = {};
  nodes.value.forEach(node => {
    const track = node.data.track || 'core';
    counts[track] = (counts[track] || 0) + 1;
  });
  return counts;
});

// Calculate estimated height of a page node based on its content
const calculateNodeHeight = (nodeData: any): number => {
  let height = 0;
  
  // Base: header + title + padding
  height += 80;
  
  // Branch info (doesn't add height, it's absolutely positioned)
  // height += 0;
  
  // Variants section
  const hasVariants = (nodeData.variants?.length || 0) > 1;
  if (hasVariants) {
    height += 70; // Variants slider with dots
  }
  
  // Blocks info
  if (nodeData.blocks && nodeData.blocks.length > 0) {
    height += 28; // Blocks line
  }
  
  // Meta tags (modality + duration)
  let metaTagsCount = 0;
  if (nodeData.modality) metaTagsCount++;
  if (nodeData.duration) metaTagsCount++;
  if (metaTagsCount > 0) {
    height += 32; // Tag row
  }
  
  // Add some buffer for padding and borders
  height += 20;
  
  return height;
};

// Create track group nodes for sequential mode (segments along the line)
const createSequentialTrackGroupNodes = () => {
  const trackInfo = {
    core: { color: '#3b82f6', label: 'Core Track', order: 0 },
    remedial: { color: '#ef4444', label: 'Remedial Track', order: 1 },
    project: { color: '#8b5cf6', label: 'Project Track', order: 2 },
    enrichment: { color: '#10b981', label: 'Enrichment Track', order: 3 },
  };

  // Sort nodes by page number
  const sortedNodes = [...nodes.value].sort((a, b) => {
    const numA = parseInt(a.id.replace('P', ''));
    const numB = parseInt(b.id.replace('P', ''));
    return numA - numB;
  });

  // Group consecutive pages by track (create segments)
  const segments: Array<{ track: string; nodes: any[] }> = [];
  let currentSegment: { track: string; nodes: any[] } | null = null;

  sortedNodes.forEach(node => {
    const track = node.data.track || 'core';
    
    if (!currentSegment || currentSegment.track !== track) {
      // Start a new segment
      if (currentSegment) {
        segments.push(currentSegment);
      }
      currentSegment = { track, nodes: [node] };
    } else {
      // Continue current segment
      currentSegment.nodes.push(node);
    }
  });
  
  if (currentSegment) {
    segments.push(currentSegment);
  }

  // Create group nodes for each segment
  const paddingX = 30;
  const paddingY = 40;
  const nodeWidth = 220;

  return segments.map((segment, segmentIndex) => {
    const info = trackInfo[segment.track as keyof typeof trackInfo] || { color: '#666', label: segment.track };
    
    // Calculate bounds
    const positions = segment.nodes.map(n => n.position);
    const xs = positions.map(p => p.x);
    const ys = positions.map(p => p.y);
    
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);

    // Calculate height
    const nodeHeights = segment.nodes.map(node => {
      if (node.dimensions?.height) return node.dimensions.height;
      return calculateNodeHeight(node.data);
    });
    const maxNodeHeight = Math.max(...nodeHeights, 150);

    const groupWidth = (maxX - minX) + nodeWidth + (paddingX * 2);
    const groupHeight = maxNodeHeight + (paddingY * 2);

    return {
      id: `group-seq-${segmentIndex}-${segment.track}`,
      type: 'trackGroup',
      position: {
        x: minX - paddingX,
        y: minY - paddingY,
      },
      data: {
        track: segment.track,
        label: `${info.label} (${segment.nodes.length})`,
        color: info.color,
        width: groupWidth,
        height: groupHeight,
        pageCount: segment.nodes.length,
      },
      draggable: false,
      selectable: false,
      zIndex: -1,
    };
  });
};

// Create track group nodes for linear mode
const createTrackGroupNodes = () => {
  const trackInfo = {
    core: { color: '#3b82f6', label: 'Core Track', order: 0 },
    remedial: { color: '#ef4444', label: 'Remedial Track', order: 1 },
    project: { color: '#8b5cf6', label: 'Project Track', order: 2 },
    enrichment: { color: '#10b981', label: 'Enrichment Track', order: 3 },
  };
  
  // Group pages by track
  const groups = new Map<string, any[]>();
  nodes.value.forEach(node => {
    const track = node.data.track || 'core';
    if (!groups.has(track)) {
      groups.set(track, []);
    }
    groups.get(track)!.push(node);
  });
  
  // Create group nodes
  return Array.from(groups.entries())
    .filter(([_, trackNodes]) => trackNodes.length > 0)
    .map(([track, trackNodes]) => {
      const info = trackInfo[track as keyof typeof trackInfo] || { color: '#666', label: track, order: 99 };
      
      // Calculate bounds from actual page positions
      const positions = trackNodes.map(n => n.position);
      const xs = positions.map(p => p.x);
      const ys = positions.map(p => p.y);
      
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      
      const nodeWidth = 220;
      const paddingX = 30;      // Horizontal padding
      const paddingY = 40;      // Vertical padding (consistent top/bottom)
      
      // Calculate the maximum height based on content
      const nodeHeights = trackNodes.map(node => {
        // Try to get actual rendered dimensions first
        if (node.dimensions?.height) {
          return node.dimensions.height;
        }
        // Otherwise calculate based on content
        return calculateNodeHeight(node.data);
      });
      const maxNodeHeight = Math.max(...nodeHeights, 150); // At least 150px
      
      // Width based on horizontal span of pages
      const groupWidth = (maxX - minX) + nodeWidth + (paddingX * 2);
      
      // Height fits the tallest page with consistent padding
      const groupHeight = maxNodeHeight + (paddingY * 2);
      
      return {
        id: `group-${track}`,
        type: 'trackGroup',
        position: {
          x: minX - paddingX,
          y: minY - paddingY,  // Consistent top padding
        },
        data: {
          track,
          label: info.label,
          color: info.color,
          width: groupWidth,
          height: groupHeight,
          pageCount: trackNodes.length,
        },
        draggable: false,
        selectable: false,
        zIndex: -1, // Behind page nodes
      };
    });
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

// Auto-layout logic using dagre for flow mode
const applyAutoLayout = (mode: 'flow' | 'linear' | 'sequential') => {
  if (mode === 'linear') {
    // Linear layout: Horizontal pages grouped by track
    applySimpleLinearLayout();
  } else if (mode === 'sequential') {
    // Sequential layout: Single horizontal line ordered by page number
    applySequentialLayout();
  } else {
    // Flow layout: Use dagre for optimal graph layout
    applyDagreFlowLayout();
  }
};

// Sequential layout - Single horizontal line ordered by page number
const applySequentialLayout = () => {
  // Sort nodes by page number (P1, P2, P3, etc.)
  const sortedNodes = [...nodes.value].sort((a, b) => {
    const numA = parseInt(a.id.replace('P', ''));
    const numB = parseInt(b.id.replace('P', ''));
    return numA - numB;
  });

  const startX = 100;
  const startY = 200;
  const pageSpacing = 260;
  const groupGap = 80; // Extra gap between different track groups
  
  let currentX = startX;
  let previousTrack: string | null = null;

  // Position all nodes in a single horizontal line with gaps between track changes
  sortedNodes.forEach((node, index) => {
    const currentTrack = node.data.track || 'core';
    
    // Add extra gap when track changes (except for first node)
    if (previousTrack !== null && previousTrack !== currentTrack) {
      currentX += groupGap;
    }
    
    node.position = {
      x: currentX,
      y: startY,
    };

    // Clear track-specific positioning data
    node.data.trackGroup = undefined;
    node.data.trackRow = undefined;
    node.data.branchInfo = undefined;
    
    // Move X for next node
    currentX += pageSpacing;
    previousTrack = currentTrack;
  });
};

// Linear layout - Horizontal pages within track rows
const applySimpleLinearLayout = () => {
  // Group nodes by track
  const trackGroups = new Map<string, any[]>();

  nodes.value.forEach(node => {
    const track = node.data.track || 'core';
    if (!trackGroups.has(track)) {
      trackGroups.set(track, []);
    }
    trackGroups.get(track)!.push(node);
  });

  // Define track order
  const trackLayout = [
    { track: 'core', label: 'Core Track', color: '#3b82f6' },
    { track: 'remedial', label: 'Remedial Track', color: '#ef4444' },
    { track: 'project', label: 'Project Track', color: '#8b5cf6' },
    { track: 'enrichment', label: 'Enrichment Track', color: '#10b981' },
  ];

  const startX = 100;          // Starting X position
  const startY = 150;          // Starting Y position for first track
  const pageSpacing = 260;     // Horizontal spacing between pages
  const groupGap = 60;         // Vertical gap between track groups
  const paddingY = 40;         // Padding inside each group

  // Position nodes dynamically, stacking groups vertically
  let currentY = startY;

  trackLayout.forEach(({ track }, trackIndex) => {
    const trackNodes = trackGroups.get(track) || [];
    if (trackNodes.length === 0) return;

    // Calculate max height for this track
    const nodeHeights = trackNodes.map(node => {
      if (node.dimensions?.height) return node.dimensions.height;
      return calculateNodeHeight(node.data);
    });
    const maxNodeHeight = Math.max(...nodeHeights, 150);

    // Position all nodes in this track at the same Y
    trackNodes.forEach((node, index) => {
      node.position = {
        x: startX + (index * pageSpacing),  // Horizontal left-to-right
        y: currentY,                         // Same Y for all in track
      };

      // Add track info for grouping
      node.data.trackGroup = track;
      node.data.trackRow = trackIndex;
      node.data.branchInfo = undefined;
    });

    // Move Y down for next track (node height + padding + gap)
    currentY += maxNodeHeight + (paddingY * 2) + groupGap;
  });
};

// Dagre flow layout with better edge routing
const applyDagreFlowLayout = () => {
  try {
    // Create dagre graph
    const dagreGraph = new dagre.graphlib.Graph({ compound: true });
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    
    // Configure graph for optimal layout
    dagreGraph.setGraph({
      rankdir: 'TB',          // Top to bottom
      nodesep: 150,           // Horizontal spacing (wider to prevent overlap)
      ranksep: 200,           // Vertical spacing
      edgesep: 50,            // Edge separation
      ranker: 'longest-path', // Better for complex graphs
      align: 'UL',            // Upper-left alignment
      marginx: 100,           // Graph margins
      marginy: 100,
    });
    
    // Add nodes with dimensions
    nodes.value.forEach(node => {
      dagreGraph.setNode(node.id, { 
        width: 220, 
        height: 150,
        label: node.data.title,
      });
    });
    
    // Add edges with weight (prefer straight paths)
    edges.value.forEach(edge => {
      dagreGraph.setEdge(edge.source, edge.target, {
        weight: 1,           // Equal weight
        minlen: 1,          // Minimum edge length
        width: 1,
        height: 1,
      });
    });
    
    // Run dagre layout
    dagre.layout(dagreGraph);
    
    // Apply positions with better centering
    nodes.value.forEach(node => {
      const nodeWithPosition = dagreGraph.node(node.id);
      if (nodeWithPosition) {
        node.position = {
          x: nodeWithPosition.x - 110,  // Center horizontally
          y: nodeWithPosition.y - 75,   // Center vertically
        };
        // Clear branch info in flow mode
        node.data.branchInfo = undefined;
        node.data.trackGroup = undefined;
      }
    });
  } catch (error) {
    console.error('Dagre layout failed:', error);
  }
};

// Get VueFlow instance for fit view
const { fitView, onNodesInitialized } = useVueFlow();

// Flag to track if we've done the initial fit
const hasInitialFit = ref(false);

// Set layout mode
const setLayoutMode = (mode: 'flow' | 'linear' | 'sequential') => {
  layoutMode.value = mode;
  applyAutoLayout(mode);
  
  // Auto-fit view after layout change (don't use hasInitialFit flag for manual toggles)
  setTimeout(() => {
    fitView({ padding: 0.2, duration: 500 });
  }, 100);
};

// Define nodes (pages) - Rich learning path with branching (15 pages)
const nodes = ref([
  // Core Track - Main Path
  {
    id: 'P1',
    type: 'page',
    position: { x: 500, y: 50 },
    data: {
      id: 'P1',
      code: 'P1',
      title: 'Intro',
      track: 'core',
      isActive: true,
      isVisited: true,
      variants: [
        { id: 'easy_video', meta: { difficulty: 'easy', modality: 'video', theme: 'soccer' } },
        { id: 'std_reading', meta: { difficulty: 'std', modality: 'reading' } },
      ],
      selectedVariantId: 'std_reading',
      blocks: [{ id: 'b1', type: 'video' }, { id: 'b2', type: 'text' }],
    },
  },
  {
    id: 'P2',
    type: 'page',
    position: { x: 500, y: 250 },
    data: {
      id: 'P2',
      code: 'P2',
      title: 'Diagnostic Quiz',
      track: 'core',
      isActive: false,
      isVisited: false,
      blocks: [{ id: 'b1', type: 'multiple_choice' }, { id: 'b2', type: 'question' }],
    },
  },
  {
    id: 'P3',
    type: 'page',
    position: { x: 500, y: 350 },
    data: {
      id: 'P3',
      code: 'P3',
      title: 'Concept Deep Dive',
      track: 'core',
      isActive: false,
      isVisited: false,
      variants: [
        { id: 'visual', meta: { difficulty: 'easy', modality: 'video' } },
        { id: 'text', meta: { difficulty: 'std', modality: 'reading' } },
        { id: 'interactive', meta: { difficulty: 'hard', modality: 'interactive' } },
      ],
      selectedVariantId: 'visual',
    },
  },
  
  // Project Track - Branch
  {
    id: 'P4',
    type: 'page',
    position: { x: 200, y: 450 },
    data: {
      id: 'P4',
      code: 'P4',
      title: 'Project Brief',
      track: 'project',
      isActive: false,
      isVisited: false,
      blocks: [{ id: 'b1', type: 'text' }],
    },
  },
  {
    id: 'P5',
    type: 'page',
    position: { x: 200, y: 550 },
    data: {
      id: 'P5',
      code: 'P5',
      title: 'Research Phase',
      track: 'project',
      isActive: false,
      isVisited: false,
      blocks: [{ id: 'b1', type: 'text' }, { id: 'b2', type: 'file_upload' }],
    },
  },
  {
    id: 'P6',
    type: 'page',
    position: { x: 200, y: 650 },
    data: {
      id: 'P6',
      code: 'P6',
      title: 'Project Work',
      track: 'project',
      isActive: false,
      isVisited: false,
      blocks: [{ id: 'b1', type: 'file_upload' }],
    },
  },
  {
    id: 'P7',
    type: 'page',
    position: { x: 200, y: 750 },
    data: {
      id: 'P7',
      code: 'P7',
      title: 'Peer Review',
      track: 'project',
      isActive: false,
      isVisited: false,
      blocks: [{ id: 'b1', type: 'text' }],
    },
  },
  
  // Enrichment Track - Advanced
  {
    id: 'P8',
    type: 'page',
    position: { x: 800, y: 450 },
    data: {
      id: 'P8',
      code: 'P8',
      title: 'Advanced Concepts',
      track: 'enrichment',
      isActive: false,
      isVisited: false,
      variants: [
        { id: 'guided', meta: { difficulty: 'std', modality: 'video' } },
        { id: 'challenge', meta: { difficulty: 'hard', modality: 'simulation' } },
      ],
      selectedVariantId: 'guided',
    },
  },
  {
    id: 'P9',
    type: 'page',
    position: { x: 800, y: 550 },
    data: {
      id: 'P9',
      code: 'P9',
      title: 'Challenge Problems',
      track: 'enrichment',
      isActive: false,
      isVisited: false,
      blocks: [{ id: 'b1', type: 'question' }, { id: 'b2', type: 'question' }],
    },
  },
  {
    id: 'P10',
    type: 'page',
    position: { x: 800, y: 650 },
    data: {
      id: 'P10',
      code: 'P10',
      title: 'Extension Activity',
      track: 'enrichment',
      isActive: false,
      isVisited: false,
    },
  },
  
  // Remedial Track - Support
  {
    id: 'P11',
    type: 'page',
    position: { x: 100, y: 350 },
    data: {
      id: 'P11',
      code: 'P11',
      title: 'Remedial Support',
      track: 'remedial',
      isActive: false,
      isVisited: false,
      variants: [
        { id: 'video_help', meta: { difficulty: 'easy', modality: 'video' } },
        { id: 'step_by_step', meta: { difficulty: 'easy', modality: 'interactive' } },
      ],
      selectedVariantId: 'video_help',
    },
  },
  {
    id: 'P12',
    type: 'page',
    position: { x: 100, y: 450 },
    data: {
      id: 'P12',
      code: 'P12',
      title: 'Practice Basics',
      track: 'remedial',
      isActive: false,
      isVisited: false,
      blocks: [{ id: 'b1', type: 'question' }],
    },
  },
  
  // Assessment Path
  {
    id: 'P13',
    type: 'page',
    position: { x: 500, y: 850 },
    data: {
      id: 'P13',
      code: 'P13',
      title: 'Mid Assessment',
      track: 'core',
      isActive: false,
      isVisited: false,
      blocks: [{ id: 'b1', type: 'question' }, { id: 'b2', type: 'question' }],
    },
  },
  {
    id: 'P14',
    type: 'page',
    position: { x: 500, y: 950 },
    data: {
      id: 'P14',
      code: 'P14',
      title: 'Review Session',
      track: 'core',
      isActive: false,
      isVisited: false,
      variants: [
        { id: 'quick_review', meta: { difficulty: 'std', modality: 'reading' } },
        { id: 'deep_review', meta: { difficulty: 'std', modality: 'video' } },
      ],
      selectedVariantId: 'quick_review',
    },
  },
  {
    id: 'P15',
    type: 'page',
    position: { x: 500, y: 1050 },
    data: {
      id: 'P15',
      code: 'P15',
      title: 'Final Exam',
      track: 'core',
      isActive: false,
      isVisited: false,
      blocks: [
        { id: 'b1', type: 'question' },
        { id: 'b2', type: 'question' },
        { id: 'b3', type: 'question' },
      ],
    },
  },
]);

// Displayed edges (filtered based on layout mode)
const visibleEdges = computed(() => {
  if (layoutMode.value === 'linear' || layoutMode.value === 'sequential') {
    return []; // No edges in linear or sequential mode
  }
  return edges.value;
});

// All edges definition (connections with conditional rules) - Rich path network
const edges = ref([
  // Main path
  { id: 'e1-2', source: 'P1', target: 'P2', type: 'conditional', animated: true, data: { condition: 'all', conditionMet: true } },
  { id: 'e2-3', source: 'P2', target: 'P3', type: 'conditional', data: { condition: 'accuracy >= 0.5', conditionMet: true } },
  
  // Remedial branch (low performance)
  { id: 'e2-11', source: 'P2', target: 'P11', type: 'conditional', data: { condition: 'accuracy < 0.5', conditionMet: false } },
  { id: 'e11-12', source: 'P11', target: 'P12', type: 'conditional', data: { condition: 'completed', conditionMet: false } },
  { id: 'e12-3', source: 'P12', target: 'P3', type: 'conditional', data: { condition: 'remediation done', conditionMet: false } },
  
  // Track branching from P3
  { id: 'e3-4', source: 'P3', target: 'P4', type: 'conditional', data: { condition: 'track: project', conditionMet: false } },
  { id: 'e3-8', source: 'P3', target: 'P8', type: 'conditional', data: { condition: 'track: enrichment', conditionMet: false } },
  { id: 'e3-13', source: 'P3', target: 'P13', type: 'conditional', data: { condition: 'track: core', conditionMet: true } },
  
  // Project track path
  { id: 'e4-5', source: 'P4', target: 'P5', type: 'conditional', data: { condition: 'completed', conditionMet: false } },
  { id: 'e5-6', source: 'P5', target: 'P6', type: 'conditional', data: { condition: 'completed', conditionMet: false } },
  { id: 'e6-7', source: 'P6', target: 'P7', type: 'conditional', data: { condition: 'completed', conditionMet: false } },
  { id: 'e7-13', source: 'P7', target: 'P13', type: 'conditional', data: { condition: 'project complete', conditionMet: false } },
  
  // Enrichment track path
  { id: 'e8-9', source: 'P8', target: 'P9', type: 'conditional', data: { condition: 'engagement > 0.7', conditionMet: false } },
  { id: 'e9-10', source: 'P9', target: 'P10', type: 'conditional', data: { condition: 'completed', conditionMet: false } },
  { id: 'e10-13', source: 'P10', target: 'P13', type: 'conditional', data: { condition: 'enrichment complete', conditionMet: false } },
  
  // Skip to assessment (high performers)
  { id: 'e8-13', source: 'P8', target: 'P13', type: 'conditional', data: { condition: 'engagement <= 0.7', conditionMet: false } },
  
  // Assessment path
  { id: 'e13-14', source: 'P13', target: 'P14', type: 'conditional', data: { condition: 'completed', conditionMet: false } },
  { id: 'e14-15', source: 'P14', target: 'P15', type: 'conditional', data: { condition: 'ready for final', conditionMet: false } },
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
  // Only select page nodes, not track groups
  if (node.type === 'page') {
    selectedNode.value = node;
  }
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

// Watch for context changes to update branch conditions
watch(() => studentContext.value, () => {
  updateEdgeConditions();
  if (layoutMode.value === 'linear') {
    applyAutoLayout('linear'); // Re-apply to update branch info
  }
}, { deep: true });

// Handle initial layout and fit when nodes are ready
onNodesInitialized(() => {
  if (!hasInitialFit.value) {
    hasInitialFit.value = true;
    
    // Apply layout now that VueFlow is ready
    applyAutoLayout(layoutMode.value);
    updateNodeStates();
    updateEdgeConditions();
    
    // Fit view after layout is applied
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 800 });
    }, 150);
  }
});

onMounted(async () => {
  // Wait for Vue to finish rendering
  await nextTick();
  
  // Fallback in case onNodesInitialized doesn't fire
  setTimeout(() => {
    if (!hasInitialFit.value) {
      hasInitialFit.value = true;
      applyAutoLayout(layoutMode.value);
      updateNodeStates();
      updateEdgeConditions();
      
      setTimeout(() => {
        fitView({ padding: 0.2, duration: 800 });
      }, 150);
    }
  }, 1000);
});
</script>

<style scoped>
.flow-simulator {
  @apply bg-gray-50;
  height: calc(100vh - 105px); /* Account for header height */
  overflow: hidden; /* Prevent scrolling */
}

.flow-simulator > div {
  height: 100%;
  overflow: hidden; /* Prevent scrolling */
}

.sidebar-left {
  @apply w-80 bg-white border-r border-gray-200 overflow-y-auto;
}

.sidebar-right {
  @apply w-96 bg-white border-l border-gray-200 overflow-y-auto p-4;
}

.flow-canvas {
  @apply flex-1 relative overflow-hidden;
}

.vue-flow-container {
  @apply w-full h-full;
  height: 100%;
}

.flow-panel {
  @apply pointer-events-auto;
}

.custom-controls-panel {
  @apply pointer-events-auto;
}

:deep(.vue-flow__controls) {
  @apply flex flex-col gap-2;
}

:deep(.vue-flow__controls-button) {
  @apply w-8 h-8 flex items-center justify-center;
}

:deep(.vue-flow__node-trackGroup) {
  z-index: -1 !important;
  pointer-events: none;
}

:deep(.vue-flow__node-page) {
  z-index: 10 !important;
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

.stat-item {
  @apply text-center p-2 bg-white rounded border border-gray-200;
}
</style>

