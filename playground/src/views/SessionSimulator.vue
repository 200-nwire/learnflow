<template>
  <div class="session-simulator">
    <!-- Main Content -->
    <div class="main-content">
      <div class="content-grid">
        <!-- Left Column: Page Navigation -->
        <div class="left-column">
          <!-- Info Bubble Button -->
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-semibold text-gray-800">Adaptive Content Simulator</h2>
            <Button
              icon="pi pi-question-circle"
              @click="showHelpDialog = true"
              rounded
              outlined
              severity="info"
              v-tooltip.left="'How this works'"
              class="help-button"
            />
          </div>

          <!-- Page Navigation -->
          <PageNavigation 
            :pages="pages" 
            @page-change="handlePageChange"
          >
            <!-- Block Variants for Current Page -->
            <div class="space-y-6">
              <BlockVariant
                v-for="slot in currentPageSlots"
                :key="slot.id"
                :slot="slot"
                :selection-result="selections[slot.id]"
                :session="session"
                @reselect="() => selectVariantForSlot(slot)"
              />
            </div>
          </PageNavigation>
        </div>

        <!-- Right Column: Overview, Monitoring & Controls -->
        <div class="right-column">
          <!-- Session Overview -->
          <Card>
            <template #title>
              <div class="flex items-center gap-2">
                <i class="pi pi-chart-bar text-green-500"></i>
                Session Overview
              </div>
            </template>
            <template #content>
              <div class="grid grid-cols-2 gap-4">
                <div class="stat">
                  <div class="text-2xl font-bold text-blue-600">{{ (session.metrics.accEWMA * 100).toFixed(0) }}%</div>
                  <div class="text-xs text-gray-600">Accuracy</div>
                </div>
                <div class="stat">
                  <div class="text-2xl font-bold text-green-600">{{ session.metrics.streak }}</div>
                  <div class="text-xs text-gray-600">Streak</div>
                </div>
                <div class="stat">
                  <div class="text-2xl font-bold text-purple-600">{{ session.metrics.attempts }}</div>
                  <div class="text-xs text-gray-600">Attempts</div>
                </div>
                <div class="stat">
                  <div class="text-2xl font-bold text-orange-600">{{ Object.keys(selections).length }}</div>
                  <div class="text-xs text-gray-600">Selections</div>
                </div>
              </div>
            </template>
          </Card>

          <!-- Telemetry Monitor -->
          <TelemetryMonitor 
            :stats="telemetryStats"
          />

          <!-- LRS Configuration -->
          <LRSConfig />

          <!-- Event Dispatcher -->
          <EventDispatcher @event="handleEvent" />

          <!-- Quick Actions -->
          <Card>
            <template #title>
              <div class="flex items-center gap-2">
                <i class="pi pi-bolt text-yellow-500"></i>
                Quick Actions
              </div>
            </template>
            <template #content>
              <div class="space-y-2">
                <Button 
                  label="Reset Session" 
                  icon="pi pi-refresh"
                  @click="resetSession"
                  severity="secondary"
                  outlined
                  class="w-full"
                />
                <Button 
                  label="Clear Sticky Choices" 
                  icon="pi pi-unlock"
                  @click="clearSticky"
                  severity="warn"
                  outlined
                  class="w-full"
                />
                <Button 
                  label="Export Session Data" 
                  icon="pi pi-download"
                  @click="exportSessionData"
                  outlined
                  class="w-full"
                />
              </div>
            </template>
          </Card>
        </div>
      </div>
    </div>

    <!-- Settings Drawer -->
    <SettingsDrawer 
      v-model:visible="settingsVisible"
      :session="session"
      @update:session="updateSession"
    />

    <!-- Help Dialog -->
    <Dialog
      v-model:visible="showHelpDialog"
      header="Adaptive Content Simulator"
      :modal="true"
      :dismissableMask="true"
      :style="{ width: '600px' }"
      class="help-dialog"
    >
      <div class="space-y-4 text-sm">
        <div>
          <h4 class="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <i class="pi pi-eye text-blue-600"></i>
            What You're Seeing
          </h4>
          <p class="text-gray-700 leading-relaxed">
            This simulator demonstrates a <strong>personalized learning engine</strong> that adapts content 
            in real-time based on student performance and context. Each "block" on a page can have multiple 
            <strong>variants</strong> (easy, standard, hard), and the engine automatically selects the best 
            variant for each learner.
          </p>
        </div>

        <Divider />

        <div>
          <h4 class="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <i class="pi pi-cog text-blue-600"></i>
            How to Use
          </h4>
          <ul class="space-y-2 text-gray-700">
            <li class="flex items-start gap-2">
              <i class="pi pi-angle-right text-blue-500 mt-0.5"></i>
              <span><strong>Navigate pages</strong> using the Previous/Next buttons or page selector</span>
            </li>
            <li class="flex items-start gap-2">
              <i class="pi pi-angle-right text-blue-500 mt-0.5"></i>
              <span><strong>Trigger events</strong> (answer submissions, time spent) to update session metrics</span>
            </li>
            <li class="flex items-start gap-2">
              <i class="pi pi-angle-right text-blue-500 mt-0.5"></i>
              <span><strong>Watch variants change</strong> as accuracy and engagement shift</span>
            </li>
            <li class="flex items-start gap-2">
              <i class="pi pi-angle-right text-blue-500 mt-0.5"></i>
              <span><strong>Test sticky behavior</strong> by revisiting pages to see consistent choices</span>
            </li>
          </ul>
        </div>

        <Divider />

        <div>
          <h4 class="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <i class="pi pi-star text-blue-600"></i>
            Why This Matters
          </h4>
          <p class="text-gray-700 leading-relaxed">
            Traditional e-learning shows the same content to everyone. This engine enables 
            <strong>truly personalized learning paths</strong> where content difficulty, modality, and 
            presentation adapt to each student's unique needs, performance, and preferences — creating 
            more effective and engaging learning experiences.
          </p>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Dialog from 'primevue/dialog';
import Divider from 'primevue/divider';
import { 
  createSnapshot, 
  selectVariant, 
  updateAccuracyEWMA,
  setPreferenceTheme,
  type SessionSnapshot,
  type Slot,
  type Policy,
  type SelectionResult,
} from '@amit/adaptivity';
import { recordSignal, onSignal, useTelemetryStats, updateTelemetrySession } from '@amit/telemetry/vue';
import { useSessionWorker } from '../composables/useSessionWorker';
import SettingsDrawer from '../components/SettingsDrawer.vue';
import EventDispatcher from '../components/EventDispatcher.vue';
import BlockVariant from '../components/BlockVariant.vue';
import PageNavigation from '../components/PageNavigation.vue';
import TelemetryMonitor from '../components/TelemetryMonitor.vue';
import LRSConfig from '../components/LRSConfig.vue';
import type { Page } from '../components/PageNavigation.vue';

const toast = useToast();
const settingsVisible = inject('settingsVisible', ref(false));

// Session worker (simplified - only session management)
const { updateSession: updateWorkerSession, getSession: getWorkerSession } = useSessionWorker();

// Session state
const session = ref<SessionSnapshot>(createSnapshot({
  ids: { 
    userId: 'student_001', 
    courseId: 'math_101', 
    lessonId: 'fractions', 
    pageId: 'page_1',
    attemptId: `attempt_${Date.now()}`,
  },
  user: { 
    lang: 'en',
    preferences: { 
      theme: { value: 'soccer', source: 'student' } 
    },
  },
  metrics: {
    accEWMA: 0.75,
    latencyEWMA: 2000,
    idleSec: 0,
    streak: 2,
    fatigue: 0.1,
    attempts: 5,
  },
}));

const selections = ref<Record<string, SelectionResult>>({});
const telemetryStats = useTelemetryStats();
const showHelpDialog = ref(false);

// Policy
const policy: Policy = { version: 'v1.0.0' };

// Pages definition
const pages: Page[] = [
  { id: 'page_1', title: 'Introduction to Fractions', description: 'Learn the basics' },
  { id: 'page_2', title: 'Practice Problems', description: 'Apply what you learned' },
  { id: 'page_3', title: 'Advanced Concepts', description: 'Challenge yourself' },
  { id: 'page_4', title: 'Review & Assessment', description: 'Test your knowledge' },
];

// Slots definition with rich variants
const allSlots: Record<string, Slot[]> = {
  page_1: [
    {
      id: 'intro_video',
      variants: [
        {
          id: 'easy_video_soccer',
          meta: { 
            difficulty: 'easy', 
            modality: 'video', 
            theme: 'soccer',
            language: 'en',
            durationSec: 120,
            deviceFit: ['desktop', 'mobile', 'tablet'],
            cognitiveLoad: 'low',
          },
          guard: 'ctx.metrics.accEWMA < 0.7',
          scoreWeights: { preferLowAcc: 0.6, preferThemeMatch: 0.3 },
          sticky: { scope: 'lesson', strength: 'strong' },
        },
        {
          id: 'std_reading_music',
          meta: { 
            difficulty: 'std', 
            modality: 'reading', 
            theme: 'music',
            language: 'en',
            durationSec: 180,
            deviceFit: ['desktop', 'tablet'],
            cognitiveLoad: 'med',
          },
          guard: 'ctx.metrics.accEWMA >= 0.5 && ctx.metrics.accEWMA < 0.9',
          scoreWeights: { preferThemeMatch: 0.4, preferModality: { reading: 0.3 } },
        },
        {
          id: 'hard_interactive_space',
          meta: { 
            difficulty: 'hard', 
            modality: 'interactive', 
            theme: 'space',
            language: 'en',
            durationSec: 240,
            deviceFit: ['desktop'],
            cognitiveLoad: 'high',
          },
          guard: 'ctx.metrics.accEWMA >= 0.85 && ctx.metrics.streak >= 3',
          scoreWeights: { preferModality: { interactive: 0.5 } },
        },
      ],
      fallbackVariantId: 'std_reading_music',
    },
  ],
  page_2: [
    {
      id: 'practice_quiz',
      variants: [
        {
          id: 'easy_quiz_hints',
          meta: { 
            difficulty: 'easy', 
            modality: 'quiz',
            theme: 'soccer',
            deviceFit: ['desktop', 'mobile', 'tablet'],
          },
          guard: 'ctx.metrics.attempts > 2 && ctx.metrics.streak === 0',
          scoreWeights: { preferLowAcc: 0.8 },
        },
        {
          id: 'std_quiz',
          meta: { 
            difficulty: 'std', 
            modality: 'quiz',
            deviceFit: ['desktop', 'mobile', 'tablet'],
          },
          guard: 'true',
          scoreWeights: {},
        },
        {
          id: 'hard_quiz_challenge',
          meta: { 
            difficulty: 'hard', 
            modality: 'quiz',
            deviceFit: ['desktop', 'tablet'],
          },
          guard: 'ctx.metrics.accEWMA > 0.9 && ctx.metrics.streak >= 5',
          scoreWeights: {},
        },
      ],
      fallbackVariantId: 'std_quiz',
    },
  ],
  page_3: [
    {
      id: 'advanced_lesson',
      variants: [
        {
          id: 'video_tutorial',
          meta: { difficulty: 'std', modality: 'video', deviceFit: ['desktop', 'mobile', 'tablet'] },
          guard: 'ctx.user.preferences?.modalityBias?.value === "video" || ctx.metrics.accEWMA < 0.8',
        },
        {
          id: 'simulation',
          meta: { difficulty: 'hard', modality: 'simulation', deviceFit: ['desktop'] },
          guard: 'ctx.env.device === "desktop" && ctx.metrics.accEWMA >= 0.8',
        },
      ],
      fallbackVariantId: 'video_tutorial',
    },
  ],
  page_4: [
    {
      id: 'final_assessment',
      variants: [
        {
          id: 'standard_test',
          meta: { difficulty: 'std', modality: 'quiz', deviceFit: ['desktop', 'mobile', 'tablet'] },
          guard: 'true',
        },
      ],
      fallbackVariantId: 'standard_test',
    },
  ],
};

const currentPageSlots = computed(() => {
  return allSlots[session.value.ids.pageId] || [];
});

const initializeSelections = () => {
  currentPageSlots.value.forEach(slot => {
    if (!selections.value[slot.id]) {
      selectVariantForSlot(slot);
    }
  });
};

const selectVariantForSlot = (slot: Slot) => {
  const result = selectVariant(slot, session.value, policy, { trace: true });
  selections.value[slot.id] = result;
  
  const alternatives = slot.variants.map(v => ({
    variantId: v.id,
    score: result.why.score[v.id] || 0,
    guardPassed: result.why.guards[v.id] ?? true,
  }));
  
  // Record signal using telemetry package
  recordSignal("variant_selected", {
    slotId: result.slotId,
    variantId: result.variantId,
    reason: result.why.overridesUsed ? "override" : result.why.stickyUsed ? "sticky" : "adaptive",
    selectionResult: result,
    alternatives,
  }, {
    source: "adaptivity",
    priority: "normal",
    metadata: {
      userId: session.value.ids.userId,
      courseId: session.value.ids.courseId,
      lessonId: session.value.ids.lessonId,
      pageId: session.value.ids.pageId,
    },
    tags: ["variant_selection", "adaptivity"],
  });
  
  toast.add({
    severity: 'info',
    summary: 'Variant Selected',
    detail: `${result.variantId} chosen for ${slot.id}`,
    life: 3000,
  });
};

const handleEvent = ({ type, payload }: { type: string; payload: any }) => {
  if (type === 'answer_submitted') {
    updateAccuracyEWMA(session.value, payload.correct);
    
    // Record signal using telemetry
    recordSignal("answer_submitted", {
      slotId: 'practice_quiz',
      variantId: selections.value['practice_quiz']?.variantId || 'unknown',
      questionId: payload.questionId || 'q1',
      correct: payload.correct,
      timeTakenMs: payload.timeTakenMs,
      attempts: payload.attempts,
      answer: payload.answer,
    }, {
      source: "adaptivity",
      priority: "high",
      metadata: {
        userId: session.value.ids.userId,
        courseId: session.value.ids.courseId,
        lessonId: session.value.ids.lessonId,
        pageId: session.value.ids.pageId,
      },
      tags: ["assessment", "answer"],
    });
    
    updateWorkerSession(session.value);
  updateTelemetrySession(session.value);
    initializeSelections();
  } else if (type === 'preference_changed') {
    if (payload.preference === 'theme') {
      setPreferenceTheme(session.value, payload.value);
      
      recordSignal("preference_changed", {
        preference: payload.preference,
        value: payload.value,
      }, {
        source: "user_interaction",
        priority: "normal",
        metadata: {
          userId: session.value.ids.userId,
        },
        tags: ["preference", "user_setting"],
      });
      
      updateWorkerSession(session.value);
  updateTelemetrySession(session.value);
      clearSticky();
      initializeSelections();
    }
  } else if (type === 'user_interaction') {
    if (payload.action === 'increment_fatigue') {
      session.value.metrics.fatigue = Math.min(1, session.value.metrics.fatigue + payload.amount);
      updateWorkerSession(session.value);
  updateTelemetrySession(session.value);
    }
    
    recordSignal("user_interaction", payload, {
      source: "user_interaction",
      priority: "normal",
      metadata: {
        userId: session.value.ids.userId,
      },
    });
  } else {
    // Generic signal
    recordSignal(type, payload, {
      source: "adaptivity",
      priority: "normal",
      metadata: {
        userId: session.value.ids.userId,
        courseId: session.value.ids.courseId,
        lessonId: session.value.ids.lessonId,
        pageId: session.value.ids.pageId,
      },
    });
  }
};

const handlePageChange = ({ from, to, direction, timeOnPageMs }: any) => {
  session.value.ids.pageId = to.id;
  
  // Record signal using telemetry
  recordSignal("page_navigated", {
    fromPageId: from.id,
    toPageId: to.id,
    direction,
    timeOnPageMs,
  }, {
    source: "adaptivity",
    priority: "normal",
    metadata: {
      userId: session.value.ids.userId,
      courseId: session.value.ids.courseId,
      lessonId: session.value.ids.lessonId,
      pageId: to.id,
    },
    tags: ["navigation", "page_change"],
  });
  
  updateWorkerSession(session.value);
  updateTelemetrySession(session.value);
  initializeSelections();
  
  toast.add({
    severity: 'info',
    summary: 'Page Changed',
    detail: `Navigated to ${to.title}`,
    life: 2000,
  });
};

const updateSession = (newSession: SessionSnapshot) => {
  session.value = newSession;
  updateWorkerSession(newSession);
  selections.value = {};
  initializeSelections();
  
  toast.add({
    severity: 'success',
    summary: 'Session Updated',
    detail: 'Settings applied successfully',
    life: 2000,
  });
};

const resetSession = () => {
  session.value = createSnapshot({
    ids: { 
      userId: 'student_001', 
      courseId: 'math_101', 
      lessonId: 'fractions', 
      pageId: 'page_1',
      attemptId: `attempt_${Date.now()}`,
    },
    user: { lang: 'en' },
    metrics: { accEWMA: 0.75, latencyEWMA: 2000, idleSec: 0, streak: 0, fatigue: 0, attempts: 0 },
  });
  
  selections.value = {};
  initializeSelections();
  updateWorkerSession(session.value);
  updateTelemetrySession(session.value);
  
  toast.add({
    severity: 'info',
    summary: 'Session Reset',
    detail: 'All settings restored to defaults',
    life: 2000,
  });
};

const clearSticky = () => {
  session.value.sticky = {};
  selections.value = {};
  initializeSelections();
  
  toast.add({
    severity: 'warn',
    summary: 'Sticky Cleared',
    detail: 'All sticky choices removed',
    life: 2000,
  });
};

const exportSessionData = () => {
  const data = {
    session: session.value,
    selections: selections.value,
    timestamp: new Date().toISOString(),
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `session-${Date.now()}.json`;
  a.click();
  
  toast.add({
    severity: 'success',
    summary: 'Export Complete',
    detail: 'Session data downloaded',
    life: 2000,
  });
};

// Telemetry stats are reactive via useTelemetryStats()

onMounted(async () => {
  await updateWorkerSession(session.value);
  // Update telemetry worker session for xAPI statement generation
  await updateTelemetrySession(session.value);
  initializeSelections();
  
  // Subscribe to telemetry signals for debugging
  onSignal((signal) => {
    console.log('[Telemetry]', signal.type, signal.payload);
  });
});

defineExpose({ session, settingsVisible });
</script>

<style scoped>
.session-simulator {
  height: calc(100vh - 105px); /* Account for header */
  overflow: hidden; /* No main scroll */
}

.main-content {
  @apply container mx-auto px-6 py-6;
  height: 100%;
  overflow: hidden; /* No main content scroll */
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
    grid-template-columns: 2fr 1fr;
  }
}

.left-column {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 0.5rem;
  height: 100%;
}

.right-column {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 0.5rem;
  height: 100%;
}

.stat {
  @apply text-center p-3 bg-gray-50 rounded-lg border border-gray-200;
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
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(59, 130, 246, 0);
  }
}

:deep(.help-dialog .p-dialog-content) {
  padding: 1.5rem;
}
</style>

