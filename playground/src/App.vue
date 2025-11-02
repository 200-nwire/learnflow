<template>
  <div class="app-container">
    <!-- Top Bar -->
    <div class="top-bar sticky top-0 z-10">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <i class="pi pi-graduation-cap text-3xl text-blue-600"></i>
          <div>
            <h1 class="text-2xl font-bold text-gray-800">Personalized Learning Simulator</h1>
            <p class="text-sm text-gray-600">Real-time adaptive content selection engine</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <Button 
            icon="pi pi-cog" 
            label="Settings"
            @click="settingsVisible = true"
            outlined
          />
          <Button 
            :icon="workerReady ? 'pi pi-check-circle' : 'pi pi-spin pi-spinner'" 
            :label="workerReady ? 'Worker Ready' : 'Initializing...'"
            :severity="workerReady ? 'success' : 'secondary'"
            text
          />
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <!-- Left Column: Page Navigation & Content -->
        <div class="xl:col-span-2 space-y-6">
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
                @reselect="() => selectVariant(slot)"
              />
            </div>
          </PageNavigation>

          <!-- Session Overview -->
          <Card>
            <template #title>
              <div class="flex items-center gap-2">
                <i class="pi pi-chart-bar text-green-500"></i>
                Session Overview
              </div>
            </template>
            <template #content>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
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
        </div>

        <!-- Right Column: Controls & Monitoring -->
        <div class="space-y-6">
          <!-- Event Dispatcher -->
          <EventDispatcher @event="handleEvent" />

          <!-- Signal Monitor -->
          <SignalMonitor 
            :stats="workerStats"
            @sync="syncSignals"
            @refresh="refreshWorkerStats"
            @clear-synced="clearOldSignals"
          />

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
                  severity="warning"
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

    <!-- Toast for notifications -->
    <Toast />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Toast from 'primevue/toast';
import { 
  createSnapshot, 
  selectVariant, 
  updateAccuracyEWMA,
  setPreferenceTheme,
  SignalFactory,
  type SessionSnapshot,
  type Slot,
  type Policy,
  type SelectionResult,
  type SignalType,
} from '@amit/adaptivity';
import SettingsDrawer from './components/SettingsDrawer.vue';
import EventDispatcher from './components/EventDispatcher.vue';
import BlockVariant from './components/BlockVariant.vue';
import PageNavigation from './components/PageNavigation.vue';
import SignalMonitor from './components/SignalMonitor.vue';
import type { Page } from './components/PageNavigation.vue';

const toast = useToast();

// Mock worker functionality for demo (worker is optional)
const workerReady = ref(true);
const updateWorkerSession = async (session: any) => {
  console.log('Session updated:', session);
};
const logSignal = async (signal: any) => {
  console.log('Signal logged:', signal);
};
const workerSyncSignals = async () => {
  return { synced: 0, failed: 0 };
};
const getStats = async () => {
  return { 
    session: null,
    outbox: { total: 0, synced: 0, unsynced: 0, byType: {} }
  };
};

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

const settingsVisible = ref(false);
const selections = ref<Record<string, SelectionResult>>({});
const workerStats = ref<any>(null);
const signalFactory = new SignalFactory();

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
          guard: 'ctx.user.preferences.modalityBias.value === "video" || ctx.metrics.accEWMA < 0.8',
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

// Initialize selections for current page
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
  
  // Log signal
  const alternatives = slot.variants.map(v => ({
    variantId: v.id,
    score: result.why.score[v.id] || 0,
    guardPassed: result.why.guards[v.id] ?? true,
  }));
  
  const signal = signalFactory.createVariantSelectedSignal(
    session.value,
    result,
    alternatives
  );
  
  logSignal(signal);
  
  toast.add({
    severity: 'info',
    summary: 'Variant Selected',
    detail: `${result.variantId} chosen for ${slot.id}`,
    life: 3000,
  });
};

const handleEvent = ({ type, payload }: { type: SignalType; payload: any }) => {
  if (type === 'answer_submitted') {
    updateAccuracyEWMA(session.value, payload.correct);
    
    const signal = signalFactory.createAnswerSubmittedSignal(
      session.value,
      'practice_quiz',
      selections.value['practice_quiz']?.variantId || 'unknown',
      'q1',
      payload.correct,
      payload.timeTakenMs,
      payload.attempts,
      payload.answer
    );
    
    logSignal(signal);
    updateWorkerSession(session.value);
    
    // Re-evaluate selections based on new performance
    initializeSelections();
  } else if (type === 'preference_changed') {
    if (payload.preference === 'theme') {
      setPreferenceTheme(session.value, payload.value);
      updateWorkerSession(session.value);
      
      // Clear sticky to allow theme change
      clearSticky();
      initializeSelections();
    }
  } else if (type === 'user_interaction') {
    if (payload.action === 'increment_fatigue') {
      session.value.metrics.fatigue = Math.min(1, session.value.metrics.fatigue + payload.amount);
      updateWorkerSession(session.value);
    }
  }
  
  // Log generic signal
  const signal = signalFactory.createGenericSignal(type, session.value, payload);
  logSignal(signal);
};

const handlePageChange = ({ from, to, direction, timeOnPageMs }: any) => {
  session.value.ids.pageId = to.id;
  
  const signal = signalFactory.createPageNavigatedSignal(
    session.value,
    from.id,
    to.id,
    direction,
    timeOnPageMs
  );
  
  logSignal(signal);
  updateWorkerSession(session.value);
  
  // Initialize selections for new page
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
  
  // Re-evaluate all selections
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
    severity: 'warning',
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

const refreshWorkerStats = async () => {
  workerStats.value = await getStats();
};

const clearOldSignals = async () => {
  // Clear signals older than 1 hour
  // await clearOldData(3600000);
  await refreshWorkerStats();
};

onMounted(async () => {
  await updateWorkerSession(session.value);
  initializeSelections();
  await refreshWorkerStats();
  
  // Refresh stats periodically
  setInterval(refreshWorkerStats, 2000);
});
</script>

<style scoped>
.app-container {
  @apply min-h-screen bg-gray-100;
}

.top-bar {
  @apply bg-white shadow-md p-6 mb-6;
}

.main-content {
  @apply container mx-auto px-6 pb-6;
}

.stat {
  @apply text-center p-3 bg-gray-50 rounded-lg border border-gray-200;
}
</style>
