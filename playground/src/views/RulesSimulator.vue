<template>
  <div class="rules-simulator">
    <!-- Main Content -->
    <div class="main-content">
      <div class="content-grid">
        <!-- Left Column: Rule Builder -->
        <div class="left-column">
          <!-- Header with Help -->
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-semibold text-gray-800">Adaptive Rules Builder</h2>
            <Button
              icon="pi pi-question-circle"
              @click="showHelpDialog = true"
              rounded
              outlined
              severity="info"
              v-tooltip.left="'How rules work'"
              class="help-button"
            />
          </div>

          <!-- Rule Builder Card -->
          <Card class="builder-card">
            <template #title>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <i class="pi pi-code text-purple-600"></i>
                  <span>Rule Conditions</span>
                </div>
                <div class="flex items-center gap-2">
                  <Tag :value="`${conditionCount} conditions`" severity="info" />
                  <Button
                    icon="pi pi-refresh"
                    @click="resetRule"
                    size="small"
                    outlined
                    severity="secondary"
                    v-tooltip.left="'Reset rule'"
                  />
                </div>
              </div>
            </template>
            <template #content>
              <RuleBuilderCustom
                :group="currentRule.conditions"
                :config="builderConfig"
                :depth="0"
                @update="handleRuleUpdate"
              />
            </template>
          </Card>

          <!-- Event Configuration -->
          <Card>
            <template #title>
              <div class="flex items-center gap-2">
                <i class="pi pi-bolt text-yellow-600"></i>
                Event Outcome
              </div>
            </template>
            <template #content>
              <div class="space-y-3">
                <div>
                  <label class="block text-sm font-semibold mb-2">Event Type</label>
                  <Dropdown
                    v-model="currentRule.event.type"
                    :options="builderConfig.events"
                    optionLabel="label"
                    optionValue="type"
                    placeholder="Select event..."
                    class="w-full"
                  />
                </div>

                <div v-if="selectedEvent && selectedEvent.params">
                  <label class="block text-sm font-semibold mb-2">Event Parameters</label>
                  <div class="space-y-2">
                    <div v-for="param in selectedEvent.params" :key="param.name">
                      <label class="block text-xs mb-1">{{ param.label }}</label>
                      <InputText
                        v-if="param.type === 'string'"
                        v-model="currentRule.event.params[param.name]"
                        :placeholder="`Enter ${param.label.toLowerCase()}...`"
                        class="w-full"
                      />
                      <InputNumber
                        v-else-if="param.type === 'number'"
                        v-model="currentRule.event.params[param.name]"
                        class="w-full"
                      />
                      <Checkbox
                        v-else-if="param.type === 'boolean'"
                        v-model="currentRule.event.params[param.name]"
                        :binary="true"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </Card>

          <!-- JSON Output -->
          <Card>
            <template #title>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <i class="pi pi-file-export text-blue-600"></i>
                  <span>Rule Definition (JSON)</span>
                </div>
                <Button
                  icon="pi pi-copy"
                  @click="copyJSON"
                  size="small"
                  outlined
                  v-tooltip.left="'Copy to clipboard'"
                />
              </div>
            </template>
            <template #content>
              <Accordion :activeIndex="0">
                <AccordionTab header="Formatted JSON">
                  <pre class="json-output">{{ formattedJSON }}</pre>
                </AccordionTab>
                <AccordionTab header="Compact JSON">
                  <pre class="json-output compact">{{ compactJSON }}</pre>
                </AccordionTab>
              </Accordion>
            </template>
          </Card>
        </div>

        <!-- Right Column: Simulator & Stats -->
        <div class="right-column">
          <!-- Rule Simulator -->
          <Card class="simulator-card">
            <template #title>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <i class="pi pi-play-circle text-green-600"></i>
                  <span>Rule Simulator</span>
                </div>
                <Tag
                  :value="simulationResult?.success ? 'TRIGGERED' : 'NO MATCH'"
                  :severity="simulationResult?.success ? 'success' : 'secondary'"
                />
              </div>
            </template>
            <template #content>
              <div class="space-y-4">
                <!-- Facts Editor -->
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <label class="text-sm font-semibold">Student Facts</label>
                    <Button
                      label="Run Rule"
                      icon="pi pi-play"
                      @click="runSimulation"
                      :loading="isSimulating"
                      severity="success"
                      size="small"
                    />
                  </div>
                  
                  <div class="facts-editor">
                    <div v-for="fact in builderConfig.facts" :key="fact.name" class="fact-row">
                      <label class="fact-label">
                        <i class="pi pi-database text-xs text-gray-400"></i>
                        {{ fact.label }}
                      </label>
                      
                      <!-- String input -->
                      <InputText
                        v-if="fact.type === 'string' && !fact.options"
                        v-model="studentFacts[fact.name]"
                        :placeholder="`Enter ${fact.label.toLowerCase()}...`"
                        size="small"
                        class="flex-1"
                      />
                      
                      <!-- Number input -->
                      <InputNumber
                        v-else-if="fact.type === 'number'"
                        v-model="studentFacts[fact.name]"
                        :min="0"
                        :max="1"
                        :step="0.1"
                        :minFractionDigits="2"
                        size="small"
                        class="flex-1"
                      />
                      
                      <!-- Boolean input -->
                      <Checkbox
                        v-else-if="fact.type === 'boolean'"
                        v-model="studentFacts[fact.name]"
                        :binary="true"
                      />
                      
                      <!-- Select with options -->
                      <Dropdown
                        v-else-if="fact.options"
                        v-model="studentFacts[fact.name]"
                        :options="fact.options"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Select..."
                        size="small"
                        class="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <Divider />

                <!-- Simulation Results -->
                <div v-if="simulationResult">
                  <h4 class="text-sm font-semibold mb-2">Simulation Results</h4>
                  
                  <div class="result-box" :class="{ 'success': simulationResult.success }">
                    <div class="flex items-center gap-2 mb-2">
                      <i 
                        :class="simulationResult.success ? 'pi pi-check-circle text-green-600' : 'pi pi-times-circle text-gray-400'"
                        class="text-lg"
                      ></i>
                      <span class="font-semibold">
                        {{ simulationResult.success ? 'Rule Triggered' : 'Rule Did Not Match' }}
                      </span>
                    </div>

                    <div v-if="simulationResult.success && simulationResult.events.length > 0" class="space-y-2">
                      <div v-for="(event, idx) in simulationResult.events" :key="idx" class="event-card">
                        <div class="flex items-center justify-between">
                          <div class="flex items-center gap-2">
                            <i class="pi pi-bolt text-yellow-600"></i>
                            <span class="font-medium">{{ event.type }}</span>
                          </div>
                          <Tag value="Event" severity="success" size="small" />
                        </div>
                        <div v-if="event.params" class="mt-2 text-sm text-gray-600">
                          <div v-for="(value, key) in event.params" :key="key" class="param-row">
                            <span class="param-key">{{ key }}:</span>
                            <span class="param-value">{{ value }}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div v-if="simulationResult.error" class="error-message">
                      <i class="pi pi-exclamation-triangle"></i>
                      {{ simulationResult.error }}
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </Card>

          <!-- Use Cases -->
          <Card>
            <template #title>
              <div class="flex items-center gap-2">
                <i class="pi pi-lightbulb text-yellow-600"></i>
                Example Scenarios
              </div>
            </template>
            <template #content>
              <div class="space-y-2">
                <Button
                  v-for="scenario in exampleScenarios"
                  :key="scenario.name"
                  :label="scenario.name"
                  @click="loadScenario(scenario)"
                  outlined
                  size="small"
                  class="w-full text-left"
                >
                  <template #icon>
                    <i :class="scenario.icon" class="mr-2"></i>
                  </template>
                </Button>
              </div>
            </template>
          </Card>
        </div>
      </div>
    </div>

    <!-- Help Dialog -->
    <Dialog
      v-model:visible="showHelpDialog"
      header="Adaptive Rules Builder"
      :modal="true"
      :dismissableMask="true"
      :style="{ width: '700px' }"
    >
      <div class="space-y-4 text-sm">
        <div>
          <h4 class="font-semibold text-purple-900 mb-2 flex items-center gap-2">
            <i class="pi pi-eye text-purple-600"></i>
            What Is This?
          </h4>
          <p class="text-gray-700 leading-relaxed">
            The Rules Builder lets you create <strong>adaptive learning rules</strong> using a visual interface. 
            Rules define when certain events should trigger based on student performance, behavior, and context. 
            This powers personalized interventions, content recommendations, and dynamic feedback.
          </p>
        </div>

        <Divider />

        <div>
          <h4 class="font-semibold text-purple-900 mb-2 flex items-center gap-2">
            <i class="pi pi-cog text-purple-600"></i>
            How to Build Rules
          </h4>
          <ul class="space-y-2 text-gray-700">
            <li class="flex items-start gap-2">
              <i class="pi pi-angle-right text-purple-500 mt-0.5"></i>
              <span><strong>Add Conditions:</strong> Click "+ Condition" to add fact-based checks</span>
            </li>
            <li class="flex items-start gap-2">
              <i class="pi pi-angle-right text-purple-500 mt-0.5"></i>
              <span><strong>Nest Logic:</strong> Click "+ Group" to create AND/OR logic groups</span>
            </li>
            <li class="flex items-start gap-2">
              <i class="pi pi-angle-right text-purple-500 mt-0.5"></i>
              <span><strong>Toggle Operators:</strong> Click "ALL" or "ANY" to switch between AND/OR</span>
            </li>
            <li class="flex items-start gap-2">
              <i class="pi pi-angle-right text-purple-500 mt-0.5"></i>
              <span><strong>Set Facts:</strong> Choose student attributes (accuracy, engagement, etc.)</span>
            </li>
            <li class="flex items-start gap-2">
              <i class="pi pi-angle-right text-purple-500 mt-0.5"></i>
              <span><strong>Define Events:</strong> Select what happens when the rule matches</span>
            </li>
          </ul>
        </div>

        <Divider />

        <div>
          <h4 class="font-semibold text-purple-900 mb-2 flex items-center gap-2">
            <i class="pi pi-play-circle text-purple-600"></i>
            Testing Rules
          </h4>
          <p class="text-gray-700 leading-relaxed mb-2">
            Use the <strong>Rule Simulator</strong> on the right to test your rules:
          </p>
          <ul class="space-y-1.5 text-gray-700">
            <li class="flex items-start gap-2">
              <i class="pi pi-angle-right text-purple-500 mt-0.5"></i>
              <span>Edit student facts (accuracy, streak, engagement, etc.)</span>
            </li>
            <li class="flex items-start gap-2">
              <i class="pi pi-angle-right text-purple-500 mt-0.5"></i>
              <span>Click "Run Rule" to evaluate conditions</span>
            </li>
            <li class="flex items-start gap-2">
              <i class="pi pi-angle-right text-purple-500 mt-0.5"></i>
              <span>See which events trigger and why</span>
            </li>
          </ul>
        </div>

        <Divider />

        <div>
          <h4 class="font-semibold text-purple-900 mb-2 flex items-center gap-2">
            <i class="pi pi-star text-purple-600"></i>
            Why Rules Matter
          </h4>
          <p class="text-gray-700 leading-relaxed">
            Rules enable <strong>intelligent adaptive behavior</strong> in learning systems. Instead of 
            hard-coded logic, you can define flexible, data-driven conditions that respond to each 
            student's unique journey. This creates truly personalized interventions — showing hints 
            when struggling, offering challenges when excelling, or suggesting breaks when fatigued.
          </p>
        </div>

        <Divider />

        <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div class="flex items-start gap-2">
            <i class="pi pi-info-circle text-blue-600 mt-0.5"></i>
            <div class="text-xs text-blue-900">
              <strong>Pro Tip:</strong> Load the example scenarios to see common adaptive learning patterns 
              like remediation triggers, engagement boosters, and mastery rewards.
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Dialog from 'primevue/dialog';
import Divider from 'primevue/divider';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Checkbox from 'primevue/checkbox';
import Tag from 'primevue/tag';
import Accordion from 'primevue/accordion';
import AccordionTab from 'primevue/accordiontab';
import RuleBuilderCustom from '../components/rules/RuleBuilderCustom.vue';
import { useRuleEngine, defaultOperators } from '@amit/rules-builder';
import type { Rule, RuleBuilderConfig } from '@amit/rules-builder';

const toast = useToast();
const showHelpDialog = ref(false);
const simulationCount = ref(0);
const isSimulating = ref(false);

// E-learning specific configuration
const builderConfig: RuleBuilderConfig = {
  operators: defaultOperators,
  facts: [
    {
      name: 'accuracy',
      label: 'Accuracy',
      type: 'number',
      description: 'Student answer accuracy (0.0 - 1.0)',
    },
    {
      name: 'engagement',
      label: 'Engagement Score',
      type: 'number',
      description: 'Engagement level (0.0 - 1.0)',
    },
    {
      name: 'streak',
      label: 'Correct Streak',
      type: 'number',
      description: 'Consecutive correct answers',
    },
    {
      name: 'attempts',
      label: 'Attempt Count',
      type: 'number',
      description: 'Number of attempts on current question',
    },
    {
      name: 'timeSpent',
      label: 'Time Spent (seconds)',
      type: 'number',
      description: 'Time spent on current page',
    },
    {
      name: 'difficulty',
      label: 'Current Difficulty',
      type: 'string',
      options: [
        { label: 'Easy', value: 'easy' },
        { label: 'Standard', value: 'std' },
        { label: 'Hard', value: 'hard' },
      ],
    },
    {
      name: 'track',
      label: 'Learning Track',
      type: 'string',
      options: [
        { label: 'Core', value: 'core' },
        { label: 'Remedial', value: 'remedial' },
        { label: 'Enrichment', value: 'enrichment' },
      ],
    },
    {
      name: 'struggling',
      label: 'Is Struggling',
      type: 'boolean',
      description: 'Whether student is showing signs of struggle',
    },
    {
      name: 'mastered',
      label: 'Has Mastered',
      type: 'boolean',
      description: 'Whether student has achieved mastery',
    },
  ],
  events: [
    {
      type: 'show_hint',
      label: 'Show Hint',
      params: [
        { name: 'level', label: 'Hint Level', type: 'number', default: 1 },
        { name: 'message', label: 'Hint Message', type: 'string', default: 'Try again!' },
      ],
    },
    {
      type: 'show_remediation',
      label: 'Show Remediation Content',
      params: [
        { name: 'topic', label: 'Topic', type: 'string', default: 'basics' },
      ],
    },
    {
      type: 'show_challenge',
      label: 'Show Challenge Problem',
      params: [
        { name: 'difficulty', label: 'Difficulty', type: 'string', default: 'hard' },
      ],
    },
    {
      type: 'adjust_difficulty',
      label: 'Adjust Difficulty Level',
      params: [
        { name: 'direction', label: 'Direction', type: 'string', default: 'up' },
      ],
    },
    {
      type: 'suggest_break',
      label: 'Suggest Break',
      params: [
        { name: 'duration', label: 'Duration (minutes)', type: 'number', default: 5 },
      ],
    },
    {
      type: 'award_badge',
      label: 'Award Badge',
      params: [
        { name: 'badge', label: 'Badge Name', type: 'string', default: 'streak_master' },
      ],
    },
    {
      type: 'switch_modality',
      label: 'Switch Learning Modality',
      params: [
        { name: 'modality', label: 'Modality', type: 'string', default: 'video' },
      ],
    },
  ],
  maxDepth: 4,
  colors: ['#9333ea', '#7c3aed', '#6366f1', '#3b82f6', '#06b6d4'],
};

// Current rule being built
const currentRule = reactive<Rule>({
  conditions: {
    id: 'root',
    all: [],
  },
  event: {
    type: 'show_hint',
    params: {},
  },
});

// Student facts for simulation
const studentFacts = reactive<Record<string, any>>({
  accuracy: 0.75,
  engagement: 0.8,
  streak: 3,
  attempts: 1,
  timeSpent: 45,
  difficulty: 'std',
  track: 'core',
  struggling: false,
  mastered: false,
});

const { runRule, lastResult: simulationResult, isRunning } = useRuleEngine();

const selectedEvent = computed(() => {
  return builderConfig.events.find(e => e.type === currentRule.event.type);
});

// Count conditions recursively
const countConditions = (group: any): number => {
  let count = 0;
  const children = group.all || group.any || [];
  
  children.forEach((child: any) => {
    if (child.all || child.any) {
      count += countConditions(child);
    } else {
      count += 1;
    }
  });
  
  return count;
};

const conditionCount = computed(() => countConditions(currentRule.conditions));

const countGroups = (group: any): number => {
  let count = 1; // Count current group
  const children = group.all || group.any || [];
  
  children.forEach((child: any) => {
    if (child.all || child.any) {
      count += countGroups(child);
    }
  });
  
  return count;
};

const groupCount = computed(() => countGroups(currentRule.conditions));

const calculateMaxDepth = (group: any, currentDepth = 0): number => {
  let max = currentDepth;
  const children = group.all || group.any || [];
  
  children.forEach((child: any) => {
    if (child.all || child.any) {
      const childDepth = calculateMaxDepth(child, currentDepth + 1);
      max = Math.max(max, childDepth);
    }
  });
  
  return max;
};

const maxDepth = computed(() => calculateMaxDepth(currentRule.conditions));

const formattedJSON = computed(() => JSON.stringify(currentRule, null, 2));
const compactJSON = computed(() => JSON.stringify(currentRule));

const handleRuleUpdate = (updatedConditions: any) => {
  currentRule.conditions = updatedConditions;
};

const runSimulation = async () => {
  isSimulating.value = true;
  simulationCount.value++;
  
  await runRule(currentRule, studentFacts);
  
  isSimulating.value = false;
  
  toast.add({
    severity: simulationResult.value?.success ? 'success' : 'info',
    summary: simulationResult.value?.success ? 'Rule Matched!' : 'No Match',
    detail: simulationResult.value?.success 
      ? `Event: ${simulationResult.value.events[0]?.type}` 
      : 'Conditions not satisfied',
    life: 3000,
  });
};

const copyJSON = () => {
  navigator.clipboard.writeText(formattedJSON.value);
  toast.add({
    severity: 'success',
    summary: 'Copied!',
    detail: 'Rule JSON copied to clipboard',
    life: 2000,
  });
};

const resetRule = () => {
  currentRule.conditions = {
    id: 'root',
    all: [],
  };
  currentRule.event = {
    type: 'show_hint',
    params: {},
  };
};

// Example scenarios
const exampleScenarios = [
  {
    name: 'Struggling Student - Show Hint',
    icon: 'pi pi-question-circle',
    rule: {
      conditions: {
        id: 'root',
        all: [
          { id: 'c1', fact: 'accuracy', operator: 'lessThan', value: 0.5 },
          { id: 'c2', fact: 'attempts', operator: 'greaterThan', value: 2 },
        ],
      },
      event: { type: 'show_hint', params: { level: 2, message: 'Let me help you with that!' } },
    },
    facts: { accuracy: 0.4, attempts: 3, engagement: 0.6 },
  },
  {
    name: 'High Performer - Show Challenge',
    icon: 'pi pi-star',
    rule: {
      conditions: {
        id: 'root',
        all: [
          { id: 'c1', fact: 'accuracy', operator: 'greaterThan', value: 0.9 },
          { id: 'c2', fact: 'streak', operator: 'greaterThanInclusive', value: 5 },
        ],
      },
      event: { type: 'show_challenge', params: { difficulty: 'hard' } },
    },
    facts: { accuracy: 0.95, streak: 7, mastered: true },
  },
  {
    name: 'Fatigue Detection - Suggest Break',
    icon: 'pi pi-clock',
    rule: {
      conditions: {
        id: 'root',
        any: [
          { id: 'c1', fact: 'timeSpent', operator: 'greaterThan', value: 3600 },
          {
            id: 'g1',
            all: [
              { id: 'c2', fact: 'engagement', operator: 'lessThan', value: 0.3 },
              { id: 'c3', fact: 'timeSpent', operator: 'greaterThan', value: 1800 },
            ],
          },
        ],
      },
      event: { type: 'suggest_break', params: { duration: 10 } },
    },
    facts: { timeSpent: 2000, engagement: 0.25 },
  },
  {
    name: 'Mastery Achievement - Award Badge',
    icon: 'pi pi-trophy',
    rule: {
      conditions: {
        id: 'root',
        all: [
          { id: 'c1', fact: 'accuracy', operator: 'greaterThanInclusive', value: 0.9 },
          { id: 'c2', fact: 'streak', operator: 'greaterThanInclusive', value: 10 },
          { id: 'c3', fact: 'mastered', operator: 'equal', value: true },
        ],
      },
      event: { type: 'award_badge', params: { badge: 'perfect_streak' } },
    },
    facts: { accuracy: 0.95, streak: 12, mastered: true },
  },
];

const loadScenario = (scenario: any) => {
  currentRule.conditions = scenario.rule.conditions;
  currentRule.event = scenario.rule.event;
  Object.assign(studentFacts, scenario.facts);
  
  toast.add({
    severity: 'info',
    summary: 'Scenario Loaded',
    detail: scenario.name,
    life: 2000,
  });
};
</script>

<style scoped>
.rules-simulator {
  height: calc(100vh - 105px);
  overflow: hidden;
}

.main-content {
  height: 100%;
  overflow: hidden;
  padding: 1.5rem;
  max-width: 1600px;
  margin: 0 auto;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  height: 100%;
  overflow: hidden;
}

@media (min-width: 1280px) {
  .content-grid {
    grid-template-columns: 1.5fr 1fr;
  }
}

.left-column,
.right-column {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 0.5rem;
  height: 100%;
}

.builder-card {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.builder-card :deep(.p-card-content) {
  flex: 1;
  overflow-y: auto;
}

.simulator-card :deep(.p-card-content) {
  max-height: 600px;
  overflow-y: auto;
}

.facts-editor {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.fact-row {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 0.75rem;
  align-items: center;
}

.fact-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.result-box {
  padding: 1rem;
  border-radius: 0.5rem;
  border: 2px solid #e5e7eb;
  background: #f9fafb;
}

.result-box.success {
  border-color: #86efac;
  background: #f0fdf4;
}

.event-card {
  padding: 0.75rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
}

.param-row {
  display: flex;
  gap: 0.5rem;
  padding: 0.25rem 0;
}

.param-key {
  font-weight: 600;
  color: #6b7280;
}

.param-value {
  color: #374151;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #dc2626;
  font-size: 0.875rem;
}

.json-output {
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 0.75rem;
  padding: 1rem;
  background: #1f2937;
  color: #10b981;
  border-radius: 0.5rem;
  overflow-x: auto;
  line-height: 1.6;
}

.json-output.compact {
  white-space: nowrap;
}

.stat-item {
  text-align: center;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.help-button {
  width: 40px;
  height: 40px;
  animation: pulse-subtle 3s ease-in-out infinite;
}

.help-button:hover {
  animation: none;
}

@keyframes pulse-subtle {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(147, 51, 234, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(147, 51, 234, 0);
  }
}
</style>

