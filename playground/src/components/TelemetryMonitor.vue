<template>
  <Card>
    <template #title>
      <div class="flex items-center gap-2">
        <i class="pi pi-chart-line text-purple-500"></i>
        Telemetry Monitor
      </div>
    </template>
    <template #content>
      <div v-if="stats" class="space-y-4">
        <!-- Collector Stats -->
        <div v-if="stats.collector" class="p-3 bg-purple-50 rounded">
          <div class="text-sm font-medium mb-2 text-purple-800">Signal Collector</div>
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div>
              <div class="text-purple-600 font-bold">{{ stats.collector.total }}</div>
              <div class="text-gray-600">Total Signals</div>
            </div>
            <div>
              <div class="text-blue-600 font-bold">{{ stats.collector.subscriptions }}</div>
              <div class="text-gray-600">Subscriptions</div>
            </div>
          </div>
          
          <!-- By Type -->
          <div v-if="stats.collector.byType" class="mt-3 pt-3 border-t border-purple-200">
            <div class="text-xs font-medium text-purple-700 mb-1">By Type</div>
            <div class="flex flex-wrap gap-1">
              <Tag
                v-for="(count, type) in stats.collector.byType"
                :key="type"
                :value="`${type}: ${count}`"
                severity="info"
                class="text-xs"
              />
            </div>
          </div>
        </div>

        <!-- Queue Stats -->
        <div v-if="stats.queue" class="p-3 bg-blue-50 rounded">
          <div class="text-sm font-medium mb-2 text-blue-800">Signal Queue</div>
          <div class="grid grid-cols-3 gap-2 text-sm">
            <div>
              <div class="text-blue-600 font-bold">{{ stats.queue.queued }}</div>
              <div class="text-gray-600">Queued</div>
            </div>
            <div>
              <div class="text-green-600 font-bold">{{ stats.queue.batchSize }}</div>
              <div class="text-gray-600">Batch Size</div>
            </div>
            <div>
              <div class="text-orange-600 font-bold">{{ stats.queue.maxSize }}</div>
              <div class="text-gray-600">Max Size</div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-2">
          <Button
            label="Flush Queue"
            icon="pi pi-sync"
            size="small"
            @click="flushQueueNow"
            outlined
          />
        </div>
      </div>
      <div v-else class="text-gray-500 text-sm">
        Loading telemetry stats...
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { flushQueue } from '@amit/telemetry/vue';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import { useToast } from 'primevue/usetoast';

interface Props {
  stats: any;
}

const props = defineProps<Props>();
const toast = useToast();

const flushQueueNow = async () => {
  try {
    await flushQueue();
    toast.add({
      severity: 'success',
      summary: 'Queue Flushed',
      detail: 'Signal queue has been flushed',
      life: 2000,
    });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Flush Error',
      detail: error instanceof Error ? error.message : 'Failed to flush queue',
      life: 3000,
    });
  }
};
</script>

