<template>
  <div class="custom-rule-builder">
    <RuleGroupCustom
      :group="group"
      :config="config"
      :depth="depth"
      :color="getColorForDepth(depth)"
      @update="emit('update', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import RuleGroupCustom from './RuleGroupCustom.vue';
import type { RuleGroup, RuleBuilderConfig } from '@amit/rules-builder';

interface Props {
  group: RuleGroup;
  config: RuleBuilderConfig;
  depth: number;
}

interface Emits {
  (e: 'update', group: RuleGroup): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const getColorForDepth = (depth: number): string => {
  const colors = props.config.colors || [
    '#9333ea', '#7c3aed', '#6366f1', '#3b82f6', '#06b6d4'
  ];
  return colors[depth % colors.length];
};
</script>

<style scoped>
.custom-rule-builder {
  min-height: 200px;
}
</style>

