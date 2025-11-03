<template>
  <div 
    class="rule-group"
    :style="{ 
      borderLeftColor: color,
      paddingLeft: `${depth * 20 + 16}px`,
    }"
  >
    <!-- Group Header -->
    <div class="group-header">
      <button
        @click="emit('toggle-operator', group.id)"
        class="operator-toggle"
        :style="{ backgroundColor: color }"
      >
        {{ operator.toUpperCase() }}
      </button>
      
      <div class="flex-1"></div>

      <div class="group-actions">
        <button
          @click="emit('add-condition', group.id)"
          class="action-btn"
          title="Add Condition"
        >
          <i class="pi pi-plus"></i>
          Condition
        </button>
        <button
          v-if="canAddGroup"
          @click="emit('add-group', group.id, operator)"
          class="action-btn"
          title="Add Group"
        >
          <i class="pi pi-plus"></i>
          Group
        </button>
        <button
          v-if="depth > 0"
          @click="emit('remove', group.id)"
          class="action-btn danger"
          title="Remove Group"
        >
          <i class="pi pi-trash"></i>
        </button>
      </div>
    </div>

    <!-- Children -->
    <div class="group-children">
      <template v-for="(child, index) in children" :key="child.id">
        <!-- Nested Group -->
        <RuleGroupNode
          v-if="isGroup(child)"
          :group="child"
          :config="config"
          :depth="depth + 1"
          :color="getChildColor()"
          @add-condition="emit('add-condition', $event)"
          @add-group="emit('add-group', $event)"
          @remove="emit('remove', $event)"
          @toggle-operator="emit('toggle-operator', $event)"
          @update-condition="emit('update-condition', $event)"
        />

        <!-- Condition -->
        <RuleConditionNode
          v-else
          :condition="child"
          :config="config"
          :depth="depth + 1"
          @update="(updates) => emit('update-condition', child.id, updates)"
          @remove="emit('remove', child.id)"
        />
      </template>

      <!-- Empty State -->
      <div v-if="children.length === 0" class="empty-group">
        <i class="pi pi-inbox text-gray-400"></i>
        <p class="text-sm text-gray-500">No conditions yet</p>
        <button
          @click="emit('add-condition', group.id)"
          class="text-blue-600 text-sm hover:underline"
        >
          Add your first condition
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import RuleConditionNode from './RuleConditionNode.vue';
import type { RuleGroup, RuleCondition, RuleBuilderConfig } from '../types';

interface Props {
  group: RuleGroup;
  config: RuleBuilderConfig;
  depth: number;
  color: string;
}

interface Emits {
  (e: 'add-condition', groupId: string): void;
  (e: 'add-group', groupId: string, operator?: 'all' | 'any'): void;
  (e: 'remove', nodeId: string): void;
  (e: 'toggle-operator', groupId: string): void;
  (e: 'update-condition', conditionId: string, updates: Partial<RuleCondition>): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const operator = computed(() => props.group.all ? 'all' : 'any');
const children = computed(() => props.group.all || props.group.any || []);

const isGroup = (node: any): node is RuleGroup => {
  return 'all' in node || 'any' in node;
};

const canAddGroup = computed(() => {
  const maxDepth = props.config.maxDepth || 5;
  return props.depth < maxDepth - 1;
});

const getChildColor = () => {
  const colors = props.config.colors || [
    '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'
  ];
  return colors[(props.depth + 1) % colors.length];
};
</script>

<style scoped>
.rule-group {
  border-left: 4px solid;
  margin-bottom: 0.75rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.group-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.operator-toggle {
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
  color: white;
  font-weight: 600;
  font-size: 0.75rem;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s;
}

.operator-toggle:hover {
  opacity: 0.8;
}

.group-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f3f4f6;
}

.action-btn.danger {
  color: #dc2626;
  border-color: #fca5a5;
}

.action-btn.danger:hover {
  background: #fee2e2;
}

.group-children {
  padding: 1rem;
}

.empty-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem;
  text-align: center;
  border: 2px dashed #d1d5db;
  border-radius: 0.5rem;
}
</style>

