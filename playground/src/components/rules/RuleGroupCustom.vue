<template>
  <div 
    class="rule-group-custom"
    :style="{ 
      '--group-color': color,
      '--indent': `${depth * 24}px`,
    }"
  >
    <!-- Group Header -->
    <div class="group-header">
      <Button
        :label="operator.toUpperCase()"
        @click="toggleOperator"
        :severity="operator === 'all' ? 'info' : 'warn'"
        size="small"
        class="operator-btn"
        v-tooltip.right="`Switch to ${operator === 'all' ? 'ANY (OR)' : 'ALL (AND)'}`"
      />
      
      <Chip :label="`${children.length} items`" class="ml-2" />

      <div class="flex-1"></div>

      <div class="group-actions">
        <Button
          icon="pi pi-plus"
          label="Condition"
          @click="addCondition"
          size="small"
          outlined
          severity="secondary"
        />
        <Button
          v-if="canAddGroup"
          icon="pi pi-plus"
          label="Group"
          @click="addGroup"
          size="small"
          outlined
          severity="secondary"
        />
        <Button
          v-if="depth > 0"
          icon="pi pi-trash"
          @click="removeGroup"
          size="small"
          outlined
          severity="danger"
        />
      </div>
    </div>

    <!-- Children -->
    <div class="group-children">
      <TransitionGroup name="list">
        <template v-for="(child, index) in children" :key="child.id">
          <!-- Nested Group -->
          <RuleGroupCustom
            v-if="isGroup(child)"
            :group="child"
            :config="config"
            :depth="depth + 1"
            :color="getChildColor()"
            @update="handleChildUpdate(index, $event)"
            @remove="removeChild(index)"
          />

          <!-- Condition -->
          <RuleConditionCustom
            v-else
            :condition="child"
            :config="config"
            :depth="depth + 1"
            @update="handleConditionUpdate(index, $event)"
            @remove="removeChild(index)"
          />
        </template>
      </TransitionGroup>

      <!-- Empty State -->
      <div v-if="children.length === 0" class="empty-state">
        <i class="pi pi-inbox text-4xl text-gray-300"></i>
        <p class="text-sm text-gray-500 mt-2">No conditions in this group</p>
        <Button
          label="Add Condition"
          icon="pi pi-plus"
          @click="addCondition"
          size="small"
          class="mt-3"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Button from 'primevue/button';
import Chip from 'primevue/chip';
import RuleConditionCustom from './RuleConditionCustom.vue';
import type { RuleGroup, RuleCondition, RuleBuilderConfig } from '@amit/rules-builder';

interface Props {
  group: RuleGroup;
  config: RuleBuilderConfig;
  depth: number;
  color: string;
}

interface Emits {
  (e: 'update', group: RuleGroup): void;
  (e: 'remove'): void;
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
  const colors = props.config.colors || ['#9333ea', '#7c3aed', '#6366f1', '#3b82f6', '#06b6d4'];
  return colors[(props.depth + 1) % colors.length];
};

const generateId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const toggleOperator = () => {
  const updatedGroup = { ...props.group };
  
  if (updatedGroup.all) {
    updatedGroup.any = updatedGroup.all;
    delete updatedGroup.all;
  } else if (updatedGroup.any) {
    updatedGroup.all = updatedGroup.any;
    delete updatedGroup.any;
  }
  
  emit('update', updatedGroup);
};

const addCondition = () => {
  const newCondition: RuleCondition = {
    id: generateId(),
    fact: props.config.facts[0]?.name || '',
    operator: 'equal',
    value: '',
  };

  const updatedGroup = { ...props.group };
  const childrenArray = [...children.value, newCondition];
  
  if (operator.value === 'all') {
    updatedGroup.all = childrenArray;
  } else {
    updatedGroup.any = childrenArray;
  }
  
  emit('update', updatedGroup);
};

const addGroup = () => {
  const newGroup: RuleGroup = {
    id: generateId(),
    [operator.value]: [],
  };

  const updatedGroup = { ...props.group };
  const childrenArray = [...children.value, newGroup];
  
  if (operator.value === 'all') {
    updatedGroup.all = childrenArray;
  } else {
    updatedGroup.any = childrenArray;
  }
  
  emit('update', updatedGroup);
};

const removeChild = (index: number) => {
  const updatedGroup = { ...props.group };
  const childrenArray = [...children.value];
  childrenArray.splice(index, 1);
  
  if (operator.value === 'all') {
    updatedGroup.all = childrenArray;
  } else {
    updatedGroup.any = childrenArray;
  }
  
  emit('update', updatedGroup);
};

const handleChildUpdate = (index: number, updatedChild: RuleGroup) => {
  const updatedGroup = { ...props.group };
  const childrenArray = [...children.value];
  childrenArray[index] = updatedChild;
  
  if (operator.value === 'all') {
    updatedGroup.all = childrenArray;
  } else {
    updatedGroup.any = childrenArray;
  }
  
  emit('update', updatedGroup);
};

const handleConditionUpdate = (index: number, updates: Partial<RuleCondition>) => {
  const updatedGroup = { ...props.group };
  const childrenArray = [...children.value];
  childrenArray[index] = { ...childrenArray[index], ...updates };
  
  if (operator.value === 'all') {
    updatedGroup.all = childrenArray;
  } else {
    updatedGroup.any = childrenArray;
  }
  
  emit('update', updatedGroup);
};

const removeGroup = () => {
  emit('remove');
};
</script>

<style scoped>
.rule-group-custom {
  border-left: 4px solid var(--group-color);
  margin-left: var(--indent);
  margin-bottom: 1rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.2s;
}

.rule-group-custom:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.group-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: linear-gradient(to right, #fafafa, white);
  border-bottom: 1px solid #e5e7eb;
}

.operator-btn {
  font-weight: 700;
  min-width: 60px;
}

.group-actions {
  display: flex;
  gap: 0.5rem;
}

.group-children {
  padding: 1rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem 2rem;
  text-align: center;
  border: 2px dashed #d1d5db;
  border-radius: 0.5rem;
  background: #fafafa;
}

/* List transition */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>

