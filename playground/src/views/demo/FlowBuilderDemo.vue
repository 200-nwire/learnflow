<!-- FlowBuilderDemo.vue - Visual flow builder with slots/variants -->
<template>
  <div class="flow-builder-demo">
    <!-- Toolbar -->
    <div class="builder-toolbar">
      <div class="toolbar-left">
        <h2>{{ currentFlow?.title || 'Flow Builder' }}</h2>
        <span v-if="currentFlow" class="status-badge" :class="currentFlow.status">
          {{ currentFlow.status }}
        </span>
      </div>
      
      <div class="toolbar-right">
        <button @click="autoLayout" class="btn-secondary">
          <SparklesIcon class="icon" /> Auto Layout
        </button>
        <button @click="saveFlow" class="btn-primary">
          <DocumentCheckIcon class="icon" /> Save Flow
        </button>
        <button @click="publishFlow" class="btn-primary">
          <PaperAirplaneIcon class="icon" /> Publish
        </button>
      </div>
    </div>
    
    <!-- Main Canvas Area -->
    <div class="builder-content">
      <!-- Nodes Palette -->
      <div class="nodes-palette">
        <h3>Add Nodes</h3>
        
        <div class="palette-section">
          <h4>Flow Control</h4>
          <div
            v-for="nodeType in flowControlNodes"
            :key="nodeType.type"
            class="palette-node"
            draggable="true"
            @dragstart="handleDragStart($event, nodeType)"
          >
            <component :is="nodeType.icon" class="node-icon" />
            <span>{{ nodeType.label }}</span>
          </div>
        </div>
        
        <div class="palette-section">
          <h4>Content</h4>
          <div
            v-for="nodeType in contentNodes"
            :key="nodeType.type"
            class="palette-node"
            draggable="true"
            @dragstart="handleDragStart($event, nodeType)"
          >
            <component :is="nodeType.icon" class="node-icon" />
            <span>{{ nodeType.label }}</span>
          </div>
        </div>
      </div>
      
      <!-- Flow Canvas -->
      <div
        class="flow-canvas"
        @drop="handleDrop"
        @dragover.prevent
        ref="canvas"
      >
        <svg class="canvas-svg" :width="canvasWidth" :height="canvasHeight">
          <!-- Grid -->
          <defs>
            <pattern
              id="grid"
              width="20"
              height="20"
              patternUnits="userSpaceUnits"
            >
              <path
                d="M 20 0 L 0 0 0 20"
                fill="none"
                stroke="#e5e7eb"
                stroke-width="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          <!-- Edges -->
          <g v-for="edge in currentFlow?.edges" :key="edge.id">
            <path
              :d="getEdgePath(edge)"
              stroke="#9ca3af"
              stroke-width="2"
              fill="none"
              :marker-end="'url(#arrowhead)'"
              class="edge"
              @click="selectEdge(edge)"
            />
            <text
              v-if="edge.label"
              :x="getEdgeLabelPosition(edge).x"
              :y="getEdgeLabelPosition(edge).y"
              text-anchor="middle"
              class="edge-label"
            >
              {{ edge.label }}
            </text>
          </g>
          
          <!-- Arrow marker -->
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3, 0 6"
                fill="#9ca3af"
              />
            </marker>
          </defs>
        </svg>
        
        <!-- Nodes -->
        <div
          v-for="node in currentFlow?.nodes"
          :key="node.id"
          class="flow-node"
          :class="[`node-${node.type}`, { selected: selectedNode?.id === node.id }]"
          :style="{
            left: `${node.position.x}px`,
            top: `${node.position.y}px`
          }"
          @mousedown="startDrag($event, node)"
          @click="selectNode(node)"
        >
          <div class="node-header">
            <component :is="getNodeIcon(node.type)" class="node-icon" />
            <span class="node-label">{{ node.label }}</span>
          </div>
          
          <!-- Handles -->
          <div class="node-handle input"></div>
          <div class="node-handle output"></div>
        </div>
      </div>
      
      <!-- Properties Panel -->
      <div class="properties-panel">
        <div v-if="selectedNode">
          <h3>Node Properties</h3>
          
          <div class="form-group">
            <label>Label</label>
            <input
              v-model="selectedNode.label"
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label>Type</label>
            <div class="form-value">{{ selectedNode.type }}</div>
          </div>
          
          <!-- Slot-specific properties -->
          <div v-if="selectedNode.type === 'slot'" class="slot-properties">
            <div class="form-group">
              <label>Slot</label>
              <select
                v-model="selectedNode.data.slot_id"
                class="form-select"
              >
                <option
                  v-for="slot in demoStore.slots"
                  :key="slot.id"
                  :value="slot.id"
                >
                  {{ slot.name }}
                </option>
              </select>
            </div>
            
            <!-- Show variants for selected slot -->
            <div
              v-if="selectedNode.data.slot_id"
              class="variants-list"
            >
              <h4>Variants ({{ getSlotVariants(selectedNode.data.slot_id).length }})</h4>
              <div
                v-for="variant in getSlotVariants(selectedNode.data.slot_id)"
                :key="variant.id"
                class="variant-card"
              >
                <div class="variant-header">
                  <span class="variant-title">{{ variant.title }}</span>
                  <span class="variant-type">{{ variant.content_type }}</span>
                </div>
                <div class="variant-stats">
                  <div class="stat">
                    <span class="label">Success:</span>
                    <span class="value">{{ (variant.success_rate * 100).toFixed(0) }}%</span>
                  </div>
                  <div class="stat">
                    <span class="label">Used:</span>
                    <span class="value">{{ variant.impressions }}×</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Decision node properties -->
          <div v-if="selectedNode.type === 'decision'" class="decision-properties">
            <div class="form-group">
              <label>Rule</label>
              <select
                v-model="selectedNode.data.rule_id"
                class="form-select"
              >
                <option
                  v-for="rule in demoStore.rules"
                  :key="rule.id"
                  :value="rule.id"
                >
                  {{ rule.name }}
                </option>
              </select>
            </div>
            
            <div class="form-group">
              <label>Condition</label>
              <div class="condition-display">
                {{ selectedNode.data.condition }}
              </div>
            </div>
          </div>
          
          <button @click="deleteNode" class="btn-danger">
            <TrashIcon class="icon" /> Delete Node
          </button>
        </div>
        
        <div v-else class="no-selection">
          <p>Select a node to edit properties</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useDemoStore } from '@/stores/demoStore';
import type { FlowNode, FlowEdge } from '@/stores/demoStore';
import {
  PlayIcon,
  StopIcon,
  SparklesIcon,
  BookOpenIcon,
  PuzzlePieceIcon,
  QuestionMarkCircleIcon,
  ArrowPathIcon,
  DocumentCheckIcon,
  PaperAirplaneIcon,
  TrashIcon
} from '@heroicons/vue/24/outline';

const demoStore = useDemoStore();

const currentFlow = computed(() => demoStore.flows[0]);
const selectedNode = ref<FlowNode | null>(null);
const selectedEdge = ref<FlowEdge | null>(null);
const canvas = ref<HTMLElement>();

const canvasWidth = 2000;
const canvasHeight = 1000;

const flowControlNodes = [
  { type: 'start', label: 'Start', icon: PlayIcon },
  { type: 'decision', label: 'Decision', icon: ArrowPathIcon },
  { type: 'end', label: 'End', icon: StopIcon }
];

const contentNodes = [
  { type: 'lesson', label: 'Lesson', icon: BookOpenIcon },
  { type: 'slot', label: 'Slot', icon: PuzzlePieceIcon },
  { type: 'assessment', label: 'Assessment', icon: QuestionMarkCircleIcon }
];

let draggedNode: FlowNode | null = null;
let dragOffset = { x: 0, y: 0 };

function handleDragStart(event: DragEvent, nodeType: any) {
  event.dataTransfer!.effectAllowed = 'move';
  event.dataTransfer!.setData('nodeType', JSON.stringify(nodeType));
}

function handleDrop(event: DragEvent) {
  const nodeTypeData = event.dataTransfer!.getData('nodeType');
  if (!nodeTypeData) return;
  
  const nodeType = JSON.parse(nodeTypeData);
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  const newNode: FlowNode = {
    id: `node_${Date.now()}`,
    type: nodeType.type,
    position: { x, y },
    label: nodeType.label,
    data: {}
  };
  
  if (currentFlow.value) {
    currentFlow.value.nodes.push(newNode);
  }
}

function startDrag(event: MouseEvent, node: FlowNode) {
  event.stopPropagation();
  draggedNode = node;
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  dragOffset.x = event.clientX - rect.left;
  dragOffset.y = event.clientY - rect.top;
  
  document.addEventListener('mousemove', handleDragMove);
  document.addEventListener('mouseup', handleDragEnd);
}

function handleDragMove(event: MouseEvent) {
  if (!draggedNode || !canvas.value) return;
  
  const rect = canvas.value.getBoundingClientRect();
  draggedNode.position.x = event.clientX - rect.left - dragOffset.x;
  draggedNode.position.y = event.clientY - rect.top - dragOffset.y;
}

function handleDragEnd() {
  draggedNode = null;
  document.removeEventListener('mousemove', handleDragMove);
  document.removeEventListener('mouseup', handleDragEnd);
}

function selectNode(node: FlowNode) {
  selectedNode.value = node;
  selectedEdge.value = null;
}

function selectEdge(edge: FlowEdge) {
  selectedEdge.value = edge;
  selectedNode.value = null;
}

function deleteNode() {
  if (!selectedNode.value || !currentFlow.value) return;
  
  const index = currentFlow.value.nodes.findIndex(n => n.id === selectedNode.value!.id);
  if (index !== -1) {
    currentFlow.value.nodes.splice(index, 1);
    
    // Remove connected edges
    currentFlow.value.edges = currentFlow.value.edges.filter(
      e => e.source !== selectedNode.value!.id && e.target !== selectedNode.value!.id
    );
    
    selectedNode.value = null;
  }
}

function getNodeIcon(type: string) {
  switch (type) {
    case 'start': return PlayIcon;
    case 'end': return StopIcon;
    case 'decision': return ArrowPathIcon;
    case 'lesson': return BookOpenIcon;
    case 'slot': return PuzzlePieceIcon;
    case 'assessment': return QuestionMarkCircleIcon;
    default: return QuestionMarkCircleIcon;
  }
}

function getEdgePath(edge: FlowEdge): string {
  if (!currentFlow.value) return '';
  
  const sourceNode = currentFlow.value.nodes.find(n => n.id === edge.source);
  const targetNode = currentFlow.value.nodes.find(n => n.id === edge.target);
  
  if (!sourceNode || !targetNode) return '';
  
  const x1 = sourceNode.position.x + 100;
  const y1 = sourceNode.position.y + 40;
  const x2 = targetNode.position.x;
  const y2 = targetNode.position.y + 40;
  
  const midX = (x1 + x2) / 2;
  
  return `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
}

function getEdgeLabelPosition(edge: FlowEdge): { x: number; y: number } {
  if (!currentFlow.value) return { x: 0, y: 0 };
  
  const sourceNode = currentFlow.value.nodes.find(n => n.id === edge.source);
  const targetNode = currentFlow.value.nodes.find(n => n.id === edge.target);
  
  if (!sourceNode || !targetNode) return { x: 0, y: 0 };
  
  return {
    x: (sourceNode.position.x + targetNode.position.x + 100) / 2,
    y: (sourceNode.position.y + targetNode.position.y + 80) / 2 - 10
  };
}

function getSlotVariants(slotId: string) {
  return demoStore.variants.filter(v => v.slot_id === slotId);
}

function autoLayout() {
  // Simple auto-layout algorithm
  if (!currentFlow.value) return;
  
  const nodesPerRow = 4;
  const horizontalSpacing = 250;
  const verticalSpacing = 150;
  
  currentFlow.value.nodes.forEach((node, index) => {
    const row = Math.floor(index / nodesPerRow);
    const col = index % nodesPerRow;
    
    node.position.x = 50 + col * horizontalSpacing;
    node.position.y = 50 + row * verticalSpacing;
  });
}

function saveFlow() {
  alert('Flow saved! (Demo mode - changes are in memory only)');
}

function publishFlow() {
  if (currentFlow.value) {
    currentFlow.value.status = 'published';
    alert('Flow published successfully!');
  }
}
</script>

<style scoped>
.flow-builder-demo {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f9fafb;
}

.builder-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: white;
  border-bottom: 1px solid #e5e7eb;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.toolbar-left h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.draft {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.published {
  background: #d1fae5;
  color: #065f46;
}

.toolbar-right {
  display: flex;
  gap: 0.5rem;
}

.builder-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.nodes-palette {
  width: 240px;
  background: white;
  border-right: 1px solid #e5e7eb;
  padding: 1rem;
  overflow-y: auto;
}

.nodes-palette h3 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
}

.palette-section {
  margin-bottom: 1.5rem;
}

.palette-section h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.palette-node {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: move;
  transition: all 0.2s;
}

.palette-node:hover {
  background: #f3f4f6;
  border-color: #3b82f6;
}

.palette-node .node-icon {
  width: 20px;
  height: 20px;
  color: #3b82f6;
}

.flow-canvas {
  flex: 1;
  position: relative;
  overflow: auto;
}

.canvas-svg {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

.canvas-svg .edge {
  pointer-events: stroke;
  cursor: pointer;
  transition: stroke 0.2s;
}

.canvas-svg .edge:hover {
  stroke: #3b82f6;
  stroke-width: 3;
}

.edge-label {
  font-size: 12px;
  fill: #6b7280;
  pointer-events: none;
}

.flow-node {
  position: absolute;
  width: 200px;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: move;
  transition: all 0.2s;
}

.flow-node:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

.flow-node.selected {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.flow-node.node-start {
  border-color: #10b981;
}

.flow-node.node-end {
  border-color: #ef4444;
}

.flow-node.node-decision {
  border-color: #f59e0b;
}

.flow-node.node-slot {
  border-color: #8b5cf6;
}

.node-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
}

.node-header .node-icon {
  width: 20px;
  height: 20px;
}

.node-label {
  font-weight: 500;
}

.node-handle {
  position: absolute;
  width: 12px;
  height: 12px;
  background: #3b82f6;
  border: 2px solid white;
  border-radius: 50%;
  top: 50%;
  transform: translateY(-50%);
}

.node-handle.input {
  left: -6px;
}

.node-handle.output {
  right: -6px;
}

.properties-panel {
  width: 320px;
  background: white;
  border-left: 1px solid #e5e7eb;
  padding: 1.5rem;
  overflow-y: auto;
}

.properties-panel h3 {
  margin: 0 0 1rem 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.form-input,
.form-select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
}

.form-value {
  padding: 0.5rem;
  background: #f9fafb;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #6b7280;
}

.condition-display {
  padding: 0.75rem;
  background: #fef3c7;
  border: 1px solid #fbbf24;
  border-radius: 6px;
  font-size: 0.875rem;
  font-family: 'Monaco', monospace;
  color: #92400e;
}

.variants-list {
  margin-top: 1rem;
}

.variants-list h4 {
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
}

.variant-card {
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.variant-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.variant-title {
  font-weight: 500;
  font-size: 0.875rem;
}

.variant-type {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
}

.variant-stats {
  display: flex;
  gap: 1rem;
}

.variant-stats .stat {
  display: flex;
  gap: 0.25rem;
  font-size: 0.75rem;
}

.variant-stats .label {
  color: #6b7280;
}

.variant-stats .value {
  font-weight: 600;
  color: #111827;
}

.no-selection {
  padding: 2rem;
  text-align: center;
  color: #6b7280;
}

.btn-secondary,
.btn-primary,
.btn-danger {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-danger {
  width: 100%;
  justify-content: center;
  margin-top: 1.5rem;
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

.icon {
  width: 16px;
  height: 16px;
}
</style>

