<template>
  <Card class="shadow-lg">
    <template #title>
      <div class="flex items-center gap-2">
        <i class="pi pi-bolt text-yellow-500"></i>
        Event Dispatcher
      </div>
    </template>
    
    <template #content>
      <div class="space-y-4">
        <!-- Quick Actions -->
        <div>
          <h4 class="text-sm font-semibold mb-3 text-gray-700">Quick Actions</h4>
          <div class="grid grid-cols-2 gap-2">
            <Button 
              label="Correct Answer" 
              icon="pi pi-check-circle"
              @click="dispatchCorrectAnswer"
              severity="success"
              size="small"
            />
            <Button 
              label="Wrong Answer" 
              icon="pi pi-times-circle"
              @click="dispatchWrongAnswer"
              severity="danger"
              size="small"
            />
            <Button 
              label="Theme Switch" 
              icon="pi pi-palette"
              @click="dispatchThemeSwitch"
              severity="info"
              size="small"
            />
            <Button 
              label="Add Fatigue" 
              icon="pi pi-moon"
              @click="dispatchFatigue"
              severity="warning"
              size="small"
            />
          </div>
        </div>

        <Divider />

        <!-- Custom Event -->
        <div>
          <h4 class="text-sm font-semibold mb-3 text-gray-700">Custom Event</h4>
          
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium mb-2">Event Type</label>
              <Dropdown 
                v-model="customEvent.type" 
                :options="eventTypes"
                optionLabel="label"
                optionValue="value"
                class="w-full" 
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">Payload (JSON)</label>
              <Textarea 
                v-model="customEvent.payload" 
                rows="3"
                class="w-full font-mono text-sm"
                placeholder='{"key": "value"}'
              />
            </div>

            <Button 
              label="Dispatch Custom Event" 
              icon="pi pi-send"
              @click="dispatchCustomEvent"
              class="w-full"
            />
          </div>
        </div>

        <Divider />

        <!-- Event History -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-sm font-semibold text-gray-700">Recent Events</h4>
            <Button 
              label="Clear" 
              icon="pi pi-trash"
              @click="clearHistory"
              text
              size="small"
            />
          </div>
          
          <div class="space-y-2 max-h-60 overflow-y-auto">
            <div 
              v-for="event in eventHistory" 
              :key="event.id"
              class="p-3 bg-gray-50 rounded border border-gray-200 text-xs"
            >
              <div class="flex items-start justify-between mb-1">
                <span class="font-semibold text-gray-700">{{ event.type }}</span>
                <span class="text-gray-500">{{ formatTime(event.timestamp) }}</span>
              </div>
              <pre class="text-gray-600 whitespace-pre-wrap">{{ JSON.stringify(event.payload, null, 2) }}</pre>
            </div>
            
            <div v-if="eventHistory.length === 0" class="text-center text-gray-500 py-4">
              No events dispatched yet
            </div>
          </div>
        </div>
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import Textarea from 'primevue/textarea';
import Divider from 'primevue/divider';
import type { SignalType } from '@amit/adaptivity';

interface DispatchedEvent {
  id: string;
  type: SignalType;
  payload: any;
  timestamp: number;
}

interface Emits {
  (e: 'event', event: { type: SignalType; payload: any }): void;
}

const emit = defineEmits<Emits>();

const eventTypes = [
  { label: 'Answer Submitted', value: 'answer_submitted' },
  { label: 'Variant Shown', value: 'variant_shown' },
  { label: 'User Interaction', value: 'user_interaction' },
  { label: 'Preference Changed', value: 'preference_changed' },
  { label: 'Page Navigated', value: 'page_navigated' },
];

const customEvent = ref({
  type: 'user_interaction' as SignalType,
  payload: '{}',
});

const eventHistory = ref<DispatchedEvent[]>([]);

const addToHistory = (type: SignalType, payload: any) => {
  eventHistory.value.unshift({
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    payload,
    timestamp: Date.now(),
  });
  
  // Keep only last 10 events
  if (eventHistory.value.length > 10) {
    eventHistory.value = eventHistory.value.slice(0, 10);
  }
};

const dispatchCorrectAnswer = () => {
  const payload = {
    correct: true,
    timeTakenMs: Math.floor(Math.random() * 5000) + 2000,
    attempts: 1,
  };
  emit('event', { type: 'answer_submitted', payload });
  addToHistory('answer_submitted', payload);
};

const dispatchWrongAnswer = () => {
  const payload = {
    correct: false,
    timeTakenMs: Math.floor(Math.random() * 3000) + 1000,
    attempts: 2,
  };
  emit('event', { type: 'answer_submitted', payload });
  addToHistory('answer_submitted', payload);
};

const dispatchThemeSwitch = () => {
  const themes = ['soccer', 'music', 'space', 'nature'];
  const theme = themes[Math.floor(Math.random() * themes.length)];
  const payload = {
    preference: 'theme',
    value: theme,
  };
  emit('event', { type: 'preference_changed', payload });
  addToHistory('preference_changed', payload);
};

const dispatchFatigue = () => {
  const payload = {
    action: 'increment_fatigue',
    amount: 0.1,
  };
  emit('event', { type: 'user_interaction', payload });
  addToHistory('user_interaction', payload);
};

const dispatchCustomEvent = () => {
  try {
    const payload = JSON.parse(customEvent.value.payload);
    emit('event', { type: customEvent.value.type, payload });
    addToHistory(customEvent.value.type, payload);
  } catch (error) {
    console.error('Invalid JSON payload:', error);
  }
};

const clearHistory = () => {
  eventHistory.value = [];
};

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString();
};
</script>

