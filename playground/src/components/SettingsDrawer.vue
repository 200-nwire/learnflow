<template>
  <Sidebar v-model:visible="isVisible" position="right" class="w-full md:w-[500px]">
    <template #header>
      <div class="flex items-center gap-2">
        <i class="pi pi-cog"></i>
        <span class="font-semibold text-xl">Session Settings</span>
      </div>
    </template>

    <div class="space-y-6">
      <!-- User Info -->
      <div class="card">
        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <i class="pi pi-user text-blue-500"></i>
          User Information
        </h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">User ID</label>
            <InputText v-model="localSession.ids.userId" class="w-full" />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2">Language</label>
            <Dropdown 
              v-model="localSession.user.lang" 
              :options="[{label: 'Hebrew', value: 'he'}, {label: 'English', value: 'en'}]"
              optionLabel="label"
              optionValue="value"
              class="w-full" 
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Preferred Theme</label>
            <InputText 
              v-model="preferredTheme" 
              placeholder="e.g., soccer, music, space"
              class="w-full" 
            />
          </div>
        </div>
      </div>

      <!-- Performance Metrics -->
      <div class="card">
        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <i class="pi pi-chart-line text-green-500"></i>
          Performance Metrics
        </h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">
              Accuracy (EWMA): {{ (localSession.metrics.accEWMA * 100).toFixed(0) }}%
            </label>
            <Slider 
              v-model="accuracyPercent" 
              :min="0" 
              :max="100" 
              class="w-full"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">
              Attempts: {{ localSession.metrics.attempts }}
            </label>
            <InputNumber 
              v-model="localSession.metrics.attempts" 
              :min="0" 
              :max="100"
              showButtons
              class="w-full" 
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">
              Streak: {{ localSession.metrics.streak }}
            </label>
            <InputNumber 
              v-model="localSession.metrics.streak" 
              :min="0" 
              :max="20"
              showButtons
              class="w-full" 
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">
              Fatigue: {{ (localSession.metrics.fatigue * 100).toFixed(0) }}%
            </label>
            <Slider 
              v-model="fatiguePercent" 
              :min="0" 
              :max="100" 
              class="w-full"
            />
          </div>
        </div>
      </div>

      <!-- Device & Environment -->
      <div class="card">
        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <i class="pi pi-desktop text-purple-500"></i>
          Device & Environment
        </h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">Device</label>
            <Dropdown 
              v-model="localSession.env.device" 
              :options="[
                {label: 'Desktop', value: 'desktop'},
                {label: 'Mobile', value: 'mobile'},
                {label: 'Tablet', value: 'tablet'}
              ]"
              optionLabel="label"
              optionValue="value"
              class="w-full" 
            />
          </div>

          <div class="flex items-center gap-2">
            <Checkbox v-model="localSession.env.online" inputId="online" binary />
            <label for="online">Online</label>
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Network Type</label>
            <Dropdown 
              v-model="localSession.env.netType" 
              :options="[
                {label: 'WiFi', value: 'wifi'},
                {label: '4G', value: '4g'},
                {label: '3G', value: '3g'},
                {label: '2G', value: '2g'}
              ]"
              optionLabel="label"
              optionValue="value"
              class="w-full" 
            />
          </div>
        </div>
      </div>

      <!-- Accessibility -->
      <div class="card">
        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <i class="pi pi-eye text-orange-500"></i>
          Accessibility
        </h3>
        
        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <Checkbox v-model="localSession.user.a11y.captions" inputId="captions" binary />
            <label for="captions">Captions</label>
          </div>
          
          <div class="flex items-center gap-2">
            <Checkbox v-model="localSession.user.a11y.transcript" inputId="transcript" binary />
            <label for="transcript">Transcript</label>
          </div>
          
          <div class="flex items-center gap-2">
            <Checkbox v-model="localSession.user.a11y.dyslexicFont" inputId="dyslexicFont" binary />
            <label for="dyslexicFont">Dyslexic Font</label>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex gap-2">
        <Button 
          label="Apply Changes" 
          icon="pi pi-check" 
          @click="applyChanges"
          class="flex-1"
        />
        <Button 
          label="Reset" 
          icon="pi pi-refresh" 
          severity="secondary"
          @click="resetToDefaults"
          outlined
        />
      </div>
    </div>
  </Sidebar>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import Sidebar from 'primevue/sidebar';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Dropdown from 'primevue/dropdown';
import Slider from 'primevue/slider';
import Checkbox from 'primevue/checkbox';
import Button from 'primevue/button';
import type { SessionSnapshot } from '@amit/adaptivity';

interface Props {
  visible: boolean;
  session: SessionSnapshot;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'update:session', value: SessionSnapshot): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const isVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
});

const localSession = ref<SessionSnapshot>(JSON.parse(JSON.stringify(props.session)));

// Computed helpers for percentage sliders
const accuracyPercent = computed({
  get: () => localSession.value.metrics.accEWMA * 100,
  set: (val) => { localSession.value.metrics.accEWMA = val / 100; }
});

const fatiguePercent = computed({
  get: () => localSession.value.metrics.fatigue * 100,
  set: (val) => { localSession.value.metrics.fatigue = val / 100; }
});

const preferredTheme = computed({
  get: () => localSession.value.user.preferences?.theme?.value || '',
  set: (val) => {
    if (!localSession.value.user.preferences) {
      localSession.value.user.preferences = {};
    }
    localSession.value.user.preferences.theme = { value: val, source: 'student' };
  }
});

watch(() => props.session, (newSession) => {
  localSession.value = JSON.parse(JSON.stringify(newSession));
}, { deep: true });

const applyChanges = () => {
  emit('update:session', localSession.value);
  isVisible.value = false;
};

const resetToDefaults = () => {
  localSession.value = JSON.parse(JSON.stringify(props.session));
};
</script>

<style scoped>
.card {
  @apply p-4 bg-gray-50 rounded-lg border border-gray-200;
}

:deep(.p-sidebar-content) {
  @apply h-full overflow-y-auto;
}
</style>

