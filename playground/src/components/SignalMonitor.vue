<template>
  <Card class="shadow-lg">
    <template #title>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <i class="pi pi-database text-purple-500"></i>
          Signal Monitor
        </div>
        <div class="flex items-center gap-2">
          <Tag 
            :value="`${stats?.outbox?.unsynced || 0} unsynced`" 
            :severity="(stats?.outbox?.unsynced || 0) > 0 ? 'warning' : 'success'"
          />
          <Button 
            icon="pi pi-sync" 
            @click="syncNow"
            :loading="syncing"
            rounded
            text
            size="small"
            v-tooltip.top="'Sync now'"
          />
        </div>
      </div>
    </template>

    <template #content>
      <div class="space-y-4">
        <!-- Sync Status -->
        <div v-if="lastSyncResult" class="sync-status">
          <div class="flex items-center justify-between p-3 rounded-lg"
               :class="lastSyncResult.synced > 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'">
            <div class="flex items-center gap-2">
              <i :class="lastSyncResult.synced > 0 ? 'pi pi-check-circle text-green-500' : 'pi pi-times-circle text-red-500'"></i>
              <span class="text-sm font-medium">
                Last sync: {{ lastSyncResult.synced }} synced, {{ lastSyncResult.failed }} failed
              </span>
            </div>
            <span class="text-xs text-gray-500">{{ formatTime(lastSyncTime) }}</span>
          </div>
        </div>

        <!-- Stats Overview -->
        <div class="grid grid-cols-3 gap-3">
          <div class="stat-card">
            <div class="text-2xl font-bold text-blue-600">{{ stats?.outbox?.total || 0 }}</div>
            <div class="text-xs text-gray-600">Total Signals</div>
          </div>
          <div class="stat-card">
            <div class="text-2xl font-bold text-green-600">{{ stats?.outbox?.synced || 0 }}</div>
            <div class="text-xs text-gray-600">Synced</div>
          </div>
          <div class="stat-card">
            <div class="text-2xl font-bold text-orange-600">{{ stats?.outbox?.unsynced || 0 }}</div>
            <div class="text-xs text-gray-600">Pending</div>
          </div>
        </div>

        <!-- Signal Types Breakdown -->
        <div v-if="stats?.outbox?.byType">
          <h4 class="text-sm font-semibold mb-2 text-gray-700">Signals by Type</h4>
          <div class="space-y-2">
            <div 
              v-for="(count, type) in stats.outbox.byType" 
              :key="type"
              class="flex items-center justify-between p-2 bg-gray-50 rounded"
            >
              <div class="flex items-center gap-2">
                <i :class="getSignalTypeIcon(type)" class="text-gray-600"></i>
                <span class="text-sm">{{ formatSignalType(type) }}</span>
              </div>
              <Tag :value="String(count)" />
            </div>
          </div>
        </div>

        <!-- Session Info -->
        <div v-if="stats?.session" class="session-info">
          <h4 class="text-sm font-semibold mb-2 text-gray-700">Current Session</h4>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">User:</span>
              <span class="font-mono">{{ stats.session.userId }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Lesson:</span>
              <span class="font-mono">{{ stats.session.lessonId }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Page:</span>
              <span class="font-mono">{{ stats.session.pageId }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Accuracy:</span>
              <span class="font-semibold">{{ (stats.session.accuracy * 100).toFixed(0) }}%</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Attempts:</span>
              <span class="font-semibold">{{ stats.session.attempts }}</span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-2">
          <Button 
            label="View in IndexedDB" 
            icon="pi pi-external-link"
            @click="openDevTools"
            text
            size="small"
            class="flex-1"
          />
          <Button 
            label="Clear Synced" 
            icon="pi pi-trash"
            @click="clearSynced"
            severity="secondary"
            text
            size="small"
            class="flex-1"
          />
        </div>
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Tag from 'primevue/tag';

interface Props {
  stats: any;
  autoRefresh?: boolean;
  refreshIntervalMs?: number;
}

interface Emits {
  (e: 'sync'): void;
  (e: 'refresh'): void;
  (e: 'clear-synced'): void;
}

const props = withDefaults(defineProps<Props>(), {
  autoRefresh: true,
  refreshIntervalMs: 2000,
});

const emit = defineEmits<Emits>();

const syncing = ref(false);
const lastSyncResult = ref<{ synced: number; failed: number } | null>(null);
const lastSyncTime = ref(0);
let refreshInterval: number | null = null;

const syncNow = async () => {
  syncing.value = true;
  try {
    emit('sync');
    // Wait a bit for sync to complete
    await new Promise(resolve => setTimeout(resolve, 500));
    emit('refresh');
    lastSyncTime.value = Date.now();
  } finally {
    syncing.value = false;
  }
};

const clearSynced = () => {
  emit('clear-synced');
  setTimeout(() => emit('refresh'), 100);
};

const openDevTools = () => {
  alert('Open Chrome DevTools > Application > IndexedDB > adaptivity-signals to inspect the database');
};

const getSignalTypeIcon = (type: string) => {
  const icons: Record<string, string> = {
    variant_selected: 'pi pi-check-square',
    variant_shown: 'pi pi-eye',
    answer_submitted: 'pi pi-send',
    page_navigated: 'pi pi-arrow-right',
    user_interaction: 'pi pi-hand-pointer',
    preference_changed: 'pi pi-sliders-h',
    session_started: 'pi pi-play',
    session_ended: 'pi pi-stop',
    error_occurred: 'pi pi-exclamation-circle',
  };
  return icons[type] || 'pi pi-circle';
};

const formatSignalType = (type: string) => {
  return type.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

const formatTime = (timestamp: number) => {
  if (!timestamp) return 'Never';
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
};

onMounted(() => {
  if (props.autoRefresh) {
    refreshInterval = window.setInterval(() => {
      emit('refresh');
    }, props.refreshIntervalMs);
  }
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});

defineExpose({ syncNow });
</script>

<style scoped>
.stat-card {
  @apply p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 text-center;
}

.session-info {
  @apply p-3 bg-blue-50 rounded-lg border border-blue-200;
}

.sync-status {
  @apply animate-fade-in;
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}
</style>

