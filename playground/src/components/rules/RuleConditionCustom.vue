<template>
  <div class="rule-condition-custom">
    <div class="condition-content">
      <!-- Fact Selector -->
      <div class="condition-field">
        <label class="field-label">Fact</label>
        <Dropdown
          :modelValue="condition.fact"
          @update:modelValue="handleFactChange"
          :options="config.facts"
          optionLabel="label"
          optionValue="name"
          placeholder="Select fact..."
          class="w-full"
        >
          <template #option="slotProps">
            <div class="flex items-center gap-2">
              <i class="pi pi-database text-xs"></i>
              <div>
                <div class="font-medium">{{ slotProps.option.label }}</div>
                <div v-if="slotProps.option.description" class="text-xs text-gray-500">
                  {{ slotProps.option.description }}
                </div>
              </div>
            </div>
          </template>
        </Dropdown>
      </div>

      <!-- Operator Selector -->
      <div class="condition-field">
        <label class="field-label">Operator</label>
        <Dropdown
          :modelValue="condition.operator"
          @update:modelValue="handleOperatorChange"
          :options="availableOperators"
          optionLabel="label"
          optionValue="name"
          placeholder="Select operator..."
          :disabled="!selectedFact"
          class="w-full"
        />
      </div>

      <!-- Value Input -->
      <div class="condition-field flex-1">
        <label class="field-label">Value</label>
        
        <!-- String with options (dropdown) -->
        <Dropdown
          v-if="selectedFact?.type === 'string' && selectedFact.options"
          :modelValue="condition.value"
          @update:modelValue="handleValueChange"
          :options="selectedFact.options"
          optionLabel="label"
          optionValue="value"
          placeholder="Select value..."
          class="w-full"
        />
        
        <!-- Boolean (toggle switch) -->
        <div v-else-if="selectedFact?.type === 'boolean'" class="flex items-center gap-2 h-10">
          <InputSwitch
            :modelValue="condition.value"
            @update:modelValue="handleValueChange"
          />
          <span class="text-sm font-medium" :class="condition.value ? 'text-green-600' : 'text-gray-500'">
            {{ condition.value ? 'True' : 'False' }}
          </span>
        </div>
        
        <!-- Number with specific ranges based on fact -->
        <div v-else-if="selectedFact?.type === 'number'" class="space-y-1">
          <!-- Accuracy/Engagement: 0-1 with slider + input -->
          <div v-if="['accuracy', 'engagement'].includes(selectedFact.name)" class="space-y-1">
            <div class="flex items-center gap-2">
              <Slider
                :modelValue="sliderValue"
                @update:modelValue="handleValueChange"
                :min="0"
                :max="1"
                :step="0.01"
                class="flex-1 custom-slider"
              />
              <InputNumber
                :modelValue="sliderValue"
                @update:modelValue="handleValueChange"
                :min="0"
                :max="1"
                :step="0.01"
                :minFractionDigits="2"
                :maxFractionDigits="2"
                class="w-20"
                size="small"
              />
            </div>
            <div class="text-xs text-gray-500 text-center">
              {{ (sliderValue * 100).toFixed(0) }}%
            </div>
          </div>
          
          <!-- Time spent: seconds with suffix -->
          <div v-else-if="selectedFact.name === 'timeSpent'" class="flex items-center gap-1">
            <InputNumber
              :modelValue="condition.value"
              @update:modelValue="handleValueChange"
              :min="0"
              :max="7200"
              :step="30"
              placeholder="Seconds..."
              class="flex-1"
              showButtons
            />
            <span class="text-xs text-gray-500 whitespace-nowrap">seconds</span>
          </div>
          
          <!-- Streak/Attempts: integer with buttons -->
          <InputNumber
            v-else-if="['streak', 'attempts'].includes(selectedFact.name)"
            :modelValue="condition.value"
            @update:modelValue="handleValueChange"
            :min="0"
            :max="100"
            placeholder="Enter number..."
            class="w-full"
            showButtons
            buttonLayout="horizontal"
          />
          
          <!-- Default number input -->
          <InputNumber
            v-else
            :modelValue="condition.value"
            @update:modelValue="handleValueChange"
            :minFractionDigits="0"
            :maxFractionDigits="2"
            placeholder="Enter number..."
            class="w-full"
          />
        </div>
        
        <!-- Array -->
        <Chips
          v-else-if="selectedFact?.type === 'array'"
          :modelValue="Array.isArray(condition.value) ? condition.value : []"
          @update:modelValue="handleValueChange"
          separator=","
          placeholder="Enter values, press Enter"
          class="w-full"
        />
        
        <!-- Default: String -->
        <InputText
          v-else
          :modelValue="condition.value"
          @update:modelValue="handleValueChange"
          placeholder="Enter value..."
          :disabled="!selectedFact"
          class="w-full"
        />
      </div>

      <!-- Remove Button -->
      <div class="flex items-end">
        <Button
          icon="pi pi-trash"
          @click="emit('remove')"
          severity="danger"
          outlined
          size="small"
          v-tooltip.left="'Remove condition'"
          class="remove-btn"
        />
      </div>
    </div>

    <!-- Condition Preview -->
    <div v-if="conditionPreview" class="condition-preview">
      <i class="pi pi-info-circle text-blue-500"></i>
      <span class="text-xs text-gray-600">{{ conditionPreview }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import InputSwitch from 'primevue/inputswitch';
import Slider from 'primevue/slider';
import Checkbox from 'primevue/checkbox';
import Chips from 'primevue/chips';
import Chip from 'primevue/chip';
import { getOperatorsForType, defaultOperators } from '@amit/rules-builder';
import type { RuleCondition, RuleBuilderConfig, FactDefinition } from '@amit/rules-builder';

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
  
  const operators = props.config.operators || defaultOperators;
  return getOperatorsForType(selectedFact.value.type, operators);
});

// Slider value - ensure it's always a valid number
const sliderValue = computed(() => {
  const val = Number(props.condition.value);
  // If invalid, show 0.5 but don't auto-update (let user drag)
  if (isNaN(val) || props.condition.value === null || props.condition.value === undefined || props.condition.value === '') {
    return 0.5;
  }
  // Allow 0 as a valid value (user might want exactly 0)
  return val;
});

// Fix slider value on mount if needed
onMounted(() => {
  if (selectedFact.value && ['accuracy', 'engagement'].includes(selectedFact.value.name)) {
    const val = Number(props.condition.value);
    if (isNaN(val) || props.condition.value === null || props.condition.value === undefined || props.condition.value === '') {
      handleValueChange(0.5);
    }
  }
});

const conditionPreview = computed(() => {
  if (!selectedFact.value || !props.condition.operator) return '';
  
  const operatorLabel = availableOperators.value.find(op => op.name === props.condition.operator)?.label || props.condition.operator;
  const valueDisplay = Array.isArray(props.condition.value) 
    ? `[${props.condition.value.join(', ')}]`
    : props.condition.value;
  
  return `IF ${selectedFact.value.label} ${operatorLabel} ${valueDisplay}`;
});

const handleFactChange = (factName: string) => {
  const fact = props.config.facts.find(f => f.name === factName);
  
  // Set appropriate default value and operator based on fact type
  let defaultValue: any = '';
  let defaultOperator: any = 'equal';
  
  if (fact) {
    // Get available operators for this fact type
    const operators = props.config.operators || defaultOperators;
    const factOperators = getOperatorsForType(fact.type, operators);
    
    // Choose best default operator
    if (fact.type === 'number') {
      defaultOperator = factOperators.find(op => op.name === 'greaterThan')?.name || 'equal';
    } else if (fact.type === 'boolean') {
      defaultOperator = 'equal';
    } else if (fact.type === 'array') {
      defaultOperator = factOperators.find(op => op.name === 'contains')?.name || 'in';
    } else {
      defaultOperator = 'equal';
    }
    
    // Set appropriate default value
    switch (fact.type) {
      case 'number':
        if (['accuracy', 'engagement'].includes(fact.name)) {
          defaultValue = 0.5; // Default to 50%
        } else if (fact.name === 'timeSpent') {
          defaultValue = 60; // Default to 1 minute
        } else if (['streak', 'attempts'].includes(fact.name)) {
          defaultValue = 3; // Default count
        } else {
          defaultValue = 0;
        }
        break;
      case 'boolean':
        defaultValue = false;
        break;
      case 'array':
        defaultValue = [];
        break;
      case 'string':
        if (fact.options && fact.options.length > 0) {
          defaultValue = fact.options[0].value; // First option
        } else {
          defaultValue = '';
        }
        break;
      default:
        defaultValue = '';
    }
  }
  
  emit('update', {
    fact: factName,
    operator: defaultOperator,
    value: defaultValue,
  });
};

const handleOperatorChange = (operator: string) => {
  emit('update', { operator: operator as any });
};

const handleValueChange = (value: any) => {
  emit('update', { value });
};
</script>

<style scoped>
.rule-condition-custom {
  margin-bottom: 0.75rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
  transition: all 0.2s;
}

.rule-condition-custom:hover {
  border-color: #9333ea;
  box-shadow: 0 2px 8px rgba(147, 51, 234, 0.1);
}

.condition-content {
  display: grid;
  grid-template-columns: 1.5fr 1.5fr 2fr auto;
  gap: 0.75rem;
  align-items: end;
  padding: 1rem;
}

.condition-field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.field-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.remove-btn {
  height: 40px;
}

.condition-preview {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #eff6ff;
  border-top: 1px solid #dbeafe;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
}

@media (max-width: 1280px) {
  .condition-content {
    grid-template-columns: 1fr;
  }
  
  .remove-btn {
    margin-top: 0.5rem;
  }
}

/* Custom slider styling - blue handle */
.custom-slider :deep(.p-slider-handle) {
  background: #3b82f6 !important;
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 0.2rem rgba(59, 130, 246, 0.25) !important;
}

.custom-slider :deep(.p-slider-handle:hover) {
  background: #2563eb !important;
  border-color: #2563eb !important;
}

.custom-slider :deep(.p-slider-range) {
  background: #3b82f6 !important;
}
</style>

