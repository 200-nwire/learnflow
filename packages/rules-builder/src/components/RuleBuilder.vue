<template>
  <div class="rule-builder">
    <div class="builder-header">
      <slot name="header">
        <h3 class="text-lg font-semibold">Rule Builder</h3>
      </slot>
    </div>

    <div class="builder-content">
      <RuleGroupNode
        :group="rule.conditions"
        :config="config"
        :depth="0"
        :color="getColorForDepth(0)"
        @add-condition="addCondition"
        @add-group="addGroup"
        @remove="removeNode"
        @toggle-operator="toggleGroupOperator"
        @update-condition="updateCondition"
      />
    </div>

    <div class="builder-footer">
      <slot name="footer" :rule="rule" :toJSON="toJSON">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-600">
            {{ nodes.length - 1 }} condition(s)
          </div>
          <button
            @click="$emit('export', toJSON())"
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Export
          </button>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRuleBuilder } from '../composables/useRuleBuilder';
import RuleGroupNode from './RuleGroupNode.vue';
import type { RuleBuilderConfig, Rule } from '../types';

interface Props {
  config: RuleBuilderConfig;
  modelValue?: Rule;
}

interface Emits {
  (e: 'update:modelValue', value: Rule): void;
  (e: 'export', value: Rule): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const {
  rule,
  selectedNodeId,
  nodes,
  addCondition,
  addGroup,
  removeNode,
  updateCondition,
  toggleGroupOperator,
  toJSON,
  fromJSON,
} = useRuleBuilder(props.config);

// Initialize from modelValue if provided
if (props.modelValue) {
  fromJSON(props.modelValue);
}

// Get color for depth level
const getColorForDepth = (depth: number): string => {
  const colors = props.config.colors || [
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#f59e0b', // amber
    '#10b981', // green
  ];
  return colors[depth % colors.length];
};

// Emit updates
const emitUpdate = () => {
  emit('update:modelValue', toJSON());
};

// Watch for changes and emit
const unwatchRule = () => {
  // In a real implementation, we'd use watch here
  // For now, callers should manually call emitUpdate
};

defineExpose({
  rule,
  toJSON,
  fromJSON,
  emitUpdate,
});
</script>

<style scoped>
.rule-builder {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.builder-header {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.builder-content {
  padding: 1rem;
  flex: 1;
  overflow-y: auto;
}

.builder-footer {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
}
</style>

