<template>
  <div class="rule-condition">
    <div class="condition-content">
      <!-- Fact Selector -->
      <select
        :value="condition.fact"
        @change="handleFactChange($event)"
        class="condition-select fact-select"
      >
        <option value="">Select fact...</option>
        <option 
          v-for="fact in config.facts" 
          :key="fact.name"
          :value="fact.name"
        >
          {{ fact.label }}
        </option>
      </select>

      <!-- Operator Selector -->
      <select
        :value="condition.operator"
        @change="handleOperatorChange($event)"
        class="condition-select operator-select"
        :disabled="!selectedFact"
      >
        <option value="">Select operator...</option>
        <option 
          v-for="op in availableOperators" 
          :key="op.name"
          :value="op.name"
        >
          {{ op.label }}
        </option>
      </select>

      <!-- Value Input -->
      <component
        :is="valueInputComponent"
        :value="condition.value"
        :fact="selectedFact"
        @update="handleValueChange"
        class="condition-value"
      />

      <!-- Remove Button -->
      <button
        @click="emit('remove')"
        class="remove-btn"
        title="Remove condition"
      >
        <i class="pi pi-times"></i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, h } from 'vue';
import { getOperatorsForType } from '../operators';
import type { RuleCondition, RuleBuilderConfig, FactDefinition } from '../types';

interface Props {
  condition: RuleCondition;
  config: RuleBuilderConfig;
  depth: number;
}

interface Emits {
  (e: 'update', updates: Partial<RuleCondition>): void;
  (e: 'remove'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const selectedFact = computed<FactDefinition | undefined>(() => {
  return props.config.facts.find(f => f.name === props.condition.fact);
});

const availableOperators = computed(() => {
  if (!selectedFact.value) return [];
  const operators = props.config.operators || [];
  return getOperatorsForType(selectedFact.value.type, operators);
});

const valueInputComponent = computed(() => {
  if (!selectedFact.value) {
    return h('input', {
      type: 'text',
      disabled: true,
      placeholder: 'Select fact first...',
      class: 'w-full px-3 py-2 border border-gray-300 rounded',
    });
  }

  // If fact has predefined options, use select
  if (selectedFact.value.options) {
    return h('select', {
      value: props.condition.value,
      onChange: (e: Event) => handleValueChange((e.target as HTMLSelectElement).value),
      class: 'w-full px-3 py-2 border border-gray-300 rounded bg-white',
    }, [
      h('option', { value: '' }, 'Select value...'),
      ...selectedFact.value.options.map(opt => 
        h('option', { value: opt.value }, opt.label)
      ),
    ]);
  }

  // Render input based on type
  switch (selectedFact.value.type) {
    case 'boolean':
      return h('select', {
        value: props.condition.value,
        onChange: (e: Event) => handleValueChange((e.target as HTMLSelectElement).value === 'true'),
        class: 'w-full px-3 py-2 border border-gray-300 rounded bg-white',
      }, [
        h('option', { value: '' }, 'Select...'),
        h('option', { value: 'true' }, 'True'),
        h('option', { value: 'false' }, 'False'),
      ]);

    case 'number':
      return h('input', {
        type: 'number',
        value: props.condition.value,
        onInput: (e: Event) => handleValueChange(parseFloat((e.target as HTMLInputElement).value)),
        placeholder: 'Enter number...',
        class: 'w-full px-3 py-2 border border-gray-300 rounded',
      });

    case 'array':
      return h('input', {
        type: 'text',
        value: Array.isArray(props.condition.value) ? props.condition.value.join(', ') : props.condition.value,
        onInput: (e: Event) => {
          const val = (e.target as HTMLInputElement).value;
          handleValueChange(val.split(',').map(v => v.trim()));
        },
        placeholder: 'Enter values, separated by commas...',
        class: 'w-full px-3 py-2 border border-gray-300 rounded',
      });

    default:
      return h('input', {
        type: 'text',
        value: props.condition.value,
        onInput: (e: Event) => handleValueChange((e.target as HTMLInputElement).value),
        placeholder: 'Enter value...',
        class: 'w-full px-3 py-2 border border-gray-300 rounded',
      });
  }
});

const handleFactChange = (event: Event) => {
  const fact = (event.target as HTMLSelectElement).value;
  emit('update', { 
    fact,
    operator: 'equal',
    value: '',
  });
};

const handleOperatorChange = (event: Event) => {
  const operator = (event.target as HTMLSelectElement).value as any;
  emit('update', { operator });
};

const handleValueChange = (value: any) => {
  emit('update', { value });
};
</script>

<style scoped>
.rule-condition {
  margin-bottom: 0.5rem;
}

.condition-content {
  display: grid;
  grid-template-columns: 1fr 1fr 1.5fr auto;
  gap: 0.5rem;
  align-items: center;
  padding: 0.75rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.condition-content:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.condition-select {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background: white;
  font-size: 0.875rem;
}

.condition-select:focus {
  outline: none;
  border-color: #3b82f6;
  ring: 2px;
  ring-color: #93c5fd;
}

.condition-value {
  flex: 1;
}

.remove-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #fca5a5;
  border-radius: 0.375rem;
  background: white;
  color: #dc2626;
  cursor: pointer;
  transition: all 0.2s;
}

.remove-btn:hover {
  background: #fee2e2;
}
</style>

