<template>
  <div class="block-variant-container">
    <!-- Slot Header -->
    <div class="slot-header">
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-2">
          <Tag :value="`Slot: ${slot.id}`" severity="info" />
          <Tag v-if="isSticky" value="Sticky" severity="success" icon="pi pi-lock" />
        </div>
        <Button 
          icon="pi pi-refresh" 
          @click="reselect"
          text
          rounded
          size="small"
          v-tooltip.top="'Re-evaluate selection'"
        />
      </div>
    </div>

    <!-- Selected Variant -->
    <div class="selected-variant" :class="`difficulty-${selectedVariant?.meta.difficulty || 'std'}`">
      <div class="variant-header">
        <div class="flex items-center gap-2">
          <i :class="getModalityIcon(selectedVariant?.meta.modality)"></i>
          <span class="font-semibold">{{ selectedVariant?.id || 'No selection' }}</span>
          <Tag 
            :value="selectedVariant?.meta.difficulty || 'std'" 
            :severity="getDifficultySeverity(selectedVariant?.meta.difficulty)"
          />
        </div>
        <div class="text-sm text-gray-500">
          Score: {{ selectionResult?.why.score[selectedVariant?.id || '']?.toFixed(3) || 'N/A' }}
        </div>
      </div>

      <div class="variant-content">
        <div class="content-preview">
          <i :class="getModalityIcon(selectedVariant?.meta.modality)" class="text-4xl opacity-20"></i>
          <p class="text-sm text-gray-600">
            {{ getContentDescription(selectedVariant) }}
          </p>
        </div>

        <!-- Variant Meta -->
        <div class="meta-tags">
          <Tag v-if="selectedVariant?.meta.theme" :value="selectedVariant.meta.theme" icon="pi pi-palette" />
          <Tag v-if="selectedVariant?.meta.language" :value="selectedVariant.meta.language" icon="pi pi-flag" />
          <Tag v-if="selectedVariant?.meta.durationSec" :value="`${selectedVariant.meta.durationSec}s`" icon="pi pi-clock" />
          <Tag v-if="selectedVariant?.meta.cognitiveLoad" :value="`Load: ${selectedVariant.meta.cognitiveLoad}`" />
        </div>
      </div>
    </div>

    <!-- Selection Explanation -->
    <div class="selection-explanation">
      <Accordion :activeIndex="0">
        <AccordionTab>
          <template #header>
            <div class="flex items-center gap-2">
              <i class="pi pi-info-circle"></i>
              <span>Why this variant?</span>
            </div>
          </template>
          
          <div class="space-y-3">
            <div v-if="selectionResult?.why.overridesUsed" class="explanation-item">
              <Tag value="Override Applied" severity="warning" icon="pi pi-shield" />
              <p class="text-sm text-gray-600 mt-2">
                Teacher or system override forced this variant selection.
              </p>
            </div>

            <div v-else-if="selectionResult?.why.stickyUsed" class="explanation-item">
              <Tag value="Sticky Choice" severity="success" icon="pi pi-lock" />
              <p class="text-sm text-gray-600 mt-2">
                Previous choice retained for consistency across the {{ stickyScope }}.
              </p>
            </div>

            <div v-else class="explanation-item">
              <Tag value="Adaptive Selection" severity="info" icon="pi pi-chart-line" />
              <p class="text-sm text-gray-600 mt-2">
                Selected based on learner context, performance metrics, and preferences.
              </p>
            </div>

            <!-- Guard Results -->
            <div v-if="Object.keys(selectionResult?.why.guards || {}).length > 0">
              <h5 class="text-sm font-semibold mb-2">Guard Evaluation</h5>
              <div class="space-y-1">
                <div 
                  v-for="(passed, variantId) in selectionResult?.why.guards" 
                  :key="variantId"
                  class="flex items-center justify-between text-xs"
                >
                  <span>{{ variantId }}</span>
                  <Tag 
                    :value="passed ? 'Pass' : 'Fail'" 
                    :severity="passed ? 'success' : 'danger'"
                    size="small"
                  />
                </div>
              </div>
            </div>

            <!-- Scores -->
            <div v-if="Object.keys(selectionResult?.why.score || {}).length > 0">
              <h5 class="text-sm font-semibold mb-2">Variant Scores</h5>
              <div class="space-y-1">
                <div 
                  v-for="(score, variantId) in sortedScores" 
                  :key="variantId"
                  class="flex items-center justify-between text-xs"
                >
                  <span class="font-mono">{{ variantId }}</span>
                  <div class="flex items-center gap-2">
                    <div class="score-bar" :style="{ width: `${Math.max(0, score * 50)}px` }"></div>
                    <span class="font-semibold">{{ score.toFixed(3) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AccordionTab>
      </Accordion>
    </div>

    <!-- All Variants (collapsed) -->
    <div class="all-variants">
      <Accordion>
        <AccordionTab>
          <template #header>
            <div class="flex items-center gap-2">
              <i class="pi pi-th-large"></i>
              <span>All Variants ({{ slot.variants.length }})</span>
            </div>
          </template>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div 
              v-for="variant in slot.variants" 
              :key="variant.id"
              class="variant-card"
              :class="{ 'selected': variant.id === selectedVariant?.id }"
            >
              <div class="flex items-start justify-between mb-2">
                <div class="flex items-center gap-2">
                  <i :class="getModalityIcon(variant.meta.modality)" class="text-sm"></i>
                  <span class="font-medium text-sm">{{ variant.id }}</span>
                </div>
                <Tag 
                  :value="variant.meta.difficulty || 'std'" 
                  :severity="getDifficultySeverity(variant.meta.difficulty)"
                  size="small"
                />
              </div>
              <div class="flex gap-1 flex-wrap">
                <Tag v-if="variant.meta.theme" :value="variant.meta.theme" size="small" />
                <Tag v-if="variant.meta.language" :value="variant.meta.language" size="small" />
                <Tag v-if="variant.guard" value="Guarded" severity="warning" size="small" />
              </div>
            </div>
          </div>
        </AccordionTab>
      </Accordion>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import Accordion from 'primevue/accordion';
import AccordionTab from 'primevue/accordiontab';
import type { Slot, Variant, SelectionResult, SessionSnapshot } from '@amit/adaptivity';

interface Props {
  slot: Slot;
  selectionResult: SelectionResult | null;
  session: SessionSnapshot;
}

interface Emits {
  (e: 'reselect'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const selectedVariant = computed(() => {
  if (!props.selectionResult) return null;
  return props.slot.variants.find(v => v.id === props.selectionResult?.variantId);
});

const isSticky = computed(() => {
  return props.selectionResult?.why.stickyUsed || false;
});

const stickyScope = computed(() => {
  const sticky = props.session.sticky[props.slot.id];
  return sticky?.scope || 'session';
});

const sortedScores = computed(() => {
  if (!props.selectionResult?.why.score) return {};
  const entries = Object.entries(props.selectionResult.why.score);
  entries.sort((a, b) => b[1] - a[1]);
  return Object.fromEntries(entries);
});

const getModalityIcon = (modality?: string) => {
  const icons = {
    video: 'pi pi-video',
    quiz: 'pi pi-question-circle',
    reading: 'pi pi-book',
    interactive: 'pi pi-desktop',
    simulation: 'pi pi-chart-bar',
    discussion: 'pi pi-comments',
  };
  return icons[modality as keyof typeof icons] || 'pi pi-circle';
};

const getDifficultySeverity = (difficulty?: string) => {
  const severities = {
    easy: 'success',
    std: 'info',
    hard: 'danger',
  };
  return severities[difficulty as keyof typeof severities] || 'info';
};

const getContentDescription = (variant: Variant | null) => {
  if (!variant) return 'No variant selected';
  
  const parts = [];
  if (variant.meta.difficulty) parts.push(`${variant.meta.difficulty} difficulty`);
  if (variant.meta.modality) parts.push(variant.meta.modality);
  if (variant.meta.theme) parts.push(`${variant.meta.theme} themed`);
  
  return parts.join(' • ') || 'Content block';
};

const reselect = () => {
  emit('reselect');
};
</script>

<style scoped>
.block-variant-container {
  @apply space-y-4;
}

.slot-header {
  @apply pb-2 border-b border-gray-200;
}

.selected-variant {
  @apply p-4 rounded-lg border-2 shadow-sm;
  transition: all 0.3s ease;
}

.selected-variant.difficulty-easy {
  @apply border-green-300 bg-green-50;
}

.selected-variant.difficulty-std {
  @apply border-blue-300 bg-blue-50;
}

.selected-variant.difficulty-hard {
  @apply border-red-300 bg-red-50;
}

.variant-header {
  @apply flex items-center justify-between mb-3 pb-2 border-b;
}

.content-preview {
  @apply relative p-6 bg-white rounded-lg border border-gray-200 mb-3 text-center;
}

.meta-tags {
  @apply flex gap-2 flex-wrap;
}

.selection-explanation {
  @apply bg-gray-50 rounded-lg;
}

.explanation-item {
  @apply p-3 bg-white rounded border border-gray-200;
}

.score-bar {
  @apply h-2 bg-blue-500 rounded;
  transition: width 0.3s ease;
}

.all-variants {
  @apply bg-gray-50 rounded-lg;
}

.variant-card {
  @apply p-3 bg-white rounded border border-gray-200 transition-all;
}

.variant-card.selected {
  @apply border-blue-500 bg-blue-50 ring-2 ring-blue-200;
}

.variant-card:hover {
  @apply shadow-md;
}
</style>

