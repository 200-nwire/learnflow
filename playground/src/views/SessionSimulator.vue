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
                :session="sessionSnapshot"
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
                  <div class="text-2xl font-bold text-blue-600">{{ (sessionSnapshot.metrics.accEWMA * 100).toFixed(0) }}%</div>
                  <div class="text-xs text-gray-600">Accuracy</div>
                </div>
                <div class="stat">
                  <div class="text-2xl font-bold text-green-600">{{ sessionSnapshot.metrics.streak }}</div>
                  <div class="text-xs text-gray-600">Streak</div>
                </div>
                <div class="stat">
                  <div class="text-2xl font-bold text-purple-600">{{ sessionSnapshot.metrics.attempts }}</div>
                  <div class="text-xs text-gray-600">Attempts</div>
                </div>
                <div class="stat">
                  <div class="text-2xl font-bold text-orange-600">{{ Object.keys(selections).length }}</div>
                  <div class="text-xs text-gray-600">Selections</div>
                </div>
              </div>
            </template>
          </Card>

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
                  label="Clear Sticky" 
                  icon="pi pi-eraser"
                  @click="clearSticky"
                  severity="warning"
                  outlined
                  class="w-full"
                />
                <Button 
                  label="Export Session" 
                  icon="pi pi-download"
                  @click="exportSessionData"
                  severity="info"
                  outlined
                  class="w-full"
                />
              </div>
            </template>
          </Card>
        </div>
      </div>
    </div>

    <!-- Help Dialog -->
    <Dialog 
      v-model:visible="showHelpDialog" 
      modal 
      header="How the Adaptive Engine Works"
      :style="{ width: '600px' }"
      class="help-dialog"
    >
      <div class="space-y-4">
        <div>
          <h4 class="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <i class="pi pi-info-circle text-blue-600"></i>
            Overview
          </h4>
          <p class="text-gray-700 leading-relaxed">
            This simulator demonstrates real-time adaptive content selection. The engine evaluates 
            multiple content variants for each slot based on learner context, performance metrics, 
            and preferences.
          </p>
        </div>

        <Divider />

        <div>
          <h4 class="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <i class="pi pi-cog text-blue-600"></i>
            Selection Process
          </h4>
          <ul class="list-disc list-inside space-y-1 text-gray-700">
            <li><strong>Overrides:</strong> Teacher/system forced choices (highest priority)</li>
            <li><strong>Sticky:</strong> Previously selected variants retained for consistency</li>
            <li><strong>Guards:</strong> CEL expressions filter eligible variants</li>
            <li><strong>Scoring:</strong> Weighted scoring based on difficulty, theme, modality</li>
            <li><strong>Selection:</strong> Highest-scoring variant that passes guards</li>
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
import { ref, computed, onMounted, inject, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Dialog from 'primevue/dialog';
import Divider from 'primevue/divider';
import { useSignals, type SignalMeta } from '@amit/player-signals';
import { useSession, type SessionSnapshot } from '@amit/player-session';
import { useVariants, scoreVariant, type Slot, type PlayContent } from '@amit/player-variants';
import SettingsDrawer from '../components/SettingsDrawer.vue';
import EventDispatcher from '../components/EventDispatcher.vue';
import BlockVariant from '../components/BlockVariant.vue';
import PageNavigation from '../components/PageNavigation.vue';
import type { Page } from '../components/PageNavigation.vue';
import { parseLessonToSlots, parseLessonPages, parseLessonInfo, type LessonData } from '../utils/lessonParser';
import { createBlockDataMap, type BlockDataMap } from '../utils/blockDataMap';
import lessonDataJson from '../../data/play.json';

const toast = useToast();
const settingsVisible = inject('settingsVisible', ref(false));

// Load lesson data
const lesson = (lessonDataJson as any).data as LessonData;
const lessonInfo = parseLessonInfo(lesson);
const pages = parseLessonPages(lesson);
const allSlots = parseLessonToSlots(lesson);
const blockDataMap = createBlockDataMap(lesson.blocks);

// Convert lesson to PlayContent format
const playContent: PlayContent = {
  pages: pages.map(page => ({
    id: page.id,
    slots: allSlots[page.id] || [],
  })),
};

// Initialize signals
const signals = useSignals({
  config: {
    outbox: { enabled: true },
    xapi: {
      enabled: false, // Disable for demo
    },
  },
});

// Initialize session
const session = useSession({
  snapshot: {
    ids: {
      userId: 'student_001',
      courseId: lessonInfo.courseId,
      lessonId: lessonInfo.id,
      pageId: pages[0]?.id || '',
      attemptId: `attempt_${Date.now()}`,
    },
    user: {
      lang: 'en',
      preferences: {
        theme: { value: 'cars', source: 'student' },
      },
    },
    env: {
      device: 'desktop',
      online: navigator.onLine,
    },
    metrics: {
      accEWMA: 0.75,
      latencyEWMA: 2000,
      idleSec: 0,
      streak: 2,
      fatigue: 0.1,
      attempts: 5,
    },
    perSkill: {},
    sticky: {},
    seenVariants: {},
    policy: {
      version: 'v1.0.0',
    },
  },
  policyVersion: 'v1.0.0',
});

// Bind session as subscriber to signals
signals.onAny((signal) => {
  session.apply(signal);
});

// Initialize variants selector
const variants = useVariants({
  getLesson: () => playContent,
  getSession: () => sessionSnapshot.value,
  scoreVariant: scoreVariant,
});

const selections = ref<Record<string, { slotId: string; variantId: string; score?: number; trace?: any }>>({});
const showHelpDialog = ref(false);

// Computed for easy template access
const sessionSnapshot = computed(() => session.session.value);

const currentPageSlots = computed(() => {
  return allSlots[sessionSnapshot.value.ids.pageId] || [];
});

// Meta builder
function meta(): SignalMeta {
  const snap = sessionSnapshot.value;
  return {
    userId: snap.ids.userId,
    courseId: snap.ids.courseId,
    lessonId: snap.ids.lessonId,
    attemptId: snap.ids.attemptId,
    pageId: snap.ids.pageId,
    lang: snap.user.lang,
    device: snap.env.device,
    online: snap.env.online,
  };
}

// Initialize selections for current page
const initializeSelections = () => {
  const pageId = sessionSnapshot.value.ids.pageId;
  
  // Record experienced signal
  signals.experienced({ pageId }, meta());

  // Select variants for this page
  const { selections: pageSelections } = variants.selectForPage(pageId, { trace: true });
  
  // Store selections
  pageSelections.forEach((sel) => {
    selections.value[sel.slotId] = sel;
    
    // Record selected signal
    signals.selected(
      {
        pageId,
        slotId: sel.slotId,
        variantId: sel.variantId,
        score: sel.score,
        trace: sel.trace,
      },
      meta()
    );
  });
};

const selectVariantForSlot = (slot: Slot) => {
  const pageId = sessionSnapshot.value.ids.pageId;
  const { selections: pageSelections } = variants.selectForPage(pageId, { trace: true });
  const selection = pageSelections.find(s => s.slotId === slot.id);
  
  if (selection) {
    selections.value[slot.id] = selection;
    
    signals.selected(
      {
        pageId,
        slotId: selection.slotId,
        variantId: selection.variantId,
        score: selection.score,
        trace: selection.trace,
      },
      meta()
    );
    
    toast.add({
      severity: 'info',
      summary: 'Variant Selected',
      detail: `${selection.variantId} chosen for ${slot.id}`,
      life: 3000,
    });
  }
};

const handleEvent = ({ type, payload }: { type: string; payload: any }) => {
  if (type === 'answer_submitted') {
    // Record answered signal
    signals.answered(
      {
        pageId: sessionSnapshot.value.ids.pageId,
        blockId: payload.blockId || 'unknown',
        questionId: payload.questionId || 'q1',
        correct: payload.correct,
        latencyMs: payload.timeTakenMs,
        attempts: payload.attempts,
        score: payload.score,
      },
      meta()
    );
    
    initializeSelections();
  } else if (type === 'preference_changed') {
    if (payload.preference === 'theme') {
      // Create a record to update preference
      // The session will be updated when the signal is applied
      // For now, we'll manually update since we don't have a preference_changed signal type
      const current = sessionSnapshot.value;
      session.initFrom({
        snapshot: {
          ...current,
          user: {
            ...current.user,
            preferences: {
              ...current.user.preferences,
              theme: {
                value: payload.value,
                source: 'student',
              },
            },
          },
          sticky: {}, // Clear sticky when theme changes
        },
      });
      
      selections.value = {};
      initializeSelections();
    }
  }
};

const handlePageChange = ({ from, to, direction, timeOnPageMs }: any) => {
  // Record experienced signal - this will update the session via apply()
  signals.experienced(
    {
      pageId: to.id,
      fromPageId: from.id,
    },
    meta()
  );
  
  // Re-select variants for new page
  initializeSelections();
  
  toast.add({
    severity: 'info',
    summary: 'Page Changed',
    detail: `Navigated to ${to.title}`,
    life: 2000,
  });
};

const updateSession = (newSession: SessionSnapshot) => {
  session.initFrom({ snapshot: newSession });
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
  session.initFrom({
    snapshot: {
      ids: {
        userId: 'student_001',
        courseId: lessonInfo.courseId,
        lessonId: lessonInfo.id,
        pageId: pages[0]?.id || '',
        attemptId: `attempt_${Date.now()}`,
      },
      user: {
        lang: 'en',
        preferences: {
          theme: { value: 'cars', source: 'student' },
        },
      },
      env: {
        device: 'desktop',
        online: navigator.onLine,
      },
      metrics: {
        accEWMA: 0.75,
        latencyEWMA: 2000,
        idleSec: 0,
        streak: 0,
        fatigue: 0,
        attempts: 0,
      },
      perSkill: {},
      sticky: {},
      seenVariants: {},
      policy: {
        version: 'v1.0.0',
      },
    },
  });
  
  selections.value = {};
  initializeSelections();
  
  toast.add({
    severity: 'info',
    summary: 'Session Reset',
    detail: 'All settings restored to defaults',
    life: 2000,
  });
};

const clearSticky = () => {
  const current = sessionSnapshot.value;
  session.initFrom({
    snapshot: {
      ...current,
      sticky: {},
    },
  });
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
    session: sessionSnapshot.value,
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

onMounted(() => {
  // Record started signal
  signals.started(
    {
      attemptId: sessionSnapshot.value.ids.attemptId || `attempt_${Date.now()}`,
      mode: 'standalone',
    },
    meta()
  );
  
  initializeSelections();
});

defineExpose({ session: sessionSnapshot, settingsVisible });
</script>

<style scoped>
.session-simulator {
  height: calc(100vh - 105px);
  overflow: hidden;
}

.main-content {
  @apply container mx-auto px-6 py-6;
  height: 100%;
  overflow: hidden;
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
