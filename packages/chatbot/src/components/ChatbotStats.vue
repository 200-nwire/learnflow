<template>
  <div class="chatbot-stats">
    <div class="chatbot-stats__header">
      <h3 class="chatbot-stats__title">Statistics</h3>
      <button @click="$emit('reset')" class="chatbot-stats__reset">Reset</button>
    </div>
    <div class="chatbot-stats__grid">
      <div class="chatbot-stats__item">
        <span class="chatbot-stats__label">Messages Sent</span>
        <span class="chatbot-stats__value">{{ stats.messagesSent }}</span>
      </div>
      <div class="chatbot-stats__item">
        <span class="chatbot-stats__label">Messages Received</span>
        <span class="chatbot-stats__value">{{ stats.messagesReceived }}</span>
      </div>
      <div class="chatbot-stats__item">
        <span class="chatbot-stats__label">Tokens Sent</span>
        <span class="chatbot-stats__value">{{ formatNumber(stats?.tokensSent ?? 0) }}</span>
      </div>
      <div class="chatbot-stats__item">
        <span class="chatbot-stats__label">Tokens Received</span>
        <span class="chatbot-stats__value">{{ formatNumber(stats?.tokensReceived ?? 0) }}</span>
      </div>
      <div class="chatbot-stats__item">
        <span class="chatbot-stats__label">Avg Response Time</span>
        <span class="chatbot-stats__value">{{ formatTime(stats?.avgResponseTime ?? 0) }}</span>
      </div>
      <div class="chatbot-stats__item">
        <span class="chatbot-stats__label">Last Response Time</span>
        <span class="chatbot-stats__value">{{ formatTime(stats?.lastResponseTime ?? 0) }}</span>
      </div>
      <div class="chatbot-stats__item">
        <span class="chatbot-stats__label">Errors</span>
        <span class="chatbot-stats__value chatbot-stats__value--error">{{ stats.errors }}</span>
      </div>
      <div class="chatbot-stats__item">
        <span class="chatbot-stats__label">Streaming</span>
        <span class="chatbot-stats__value" :class="{ 'chatbot-stats__value--active': stats.isStreaming }">
          {{ stats.isStreaming ? 'Yes' : 'No' }}
        </span>
      </div>
      <div v-if="stats?.isStreaming" class="chatbot-stats__item chatbot-stats__item--full">
        <span class="chatbot-stats__label">Stream Position</span>
        <span class="chatbot-stats__value">{{ formatNumber(stats?.streamPosition ?? 0) }} chars</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChatbotStats } from '../types.js';

interface Props {
  stats: ChatbotStats;
}

defineProps<Props>();

defineEmits<{
  reset: [];
}>();

function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) {
    return '0';
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return num.toString();
}

function formatTime(ms: number | undefined | null): string {
  if (ms === undefined || ms === null || isNaN(ms) || ms === 0) {
    return 'N/A';
  }
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}
</script>

<style scoped>
.chatbot-stats {
  background-color: rgba(249, 250, 251, 1);
  border: 1px solid rgba(229, 231, 235, 1);
  border-radius: 0.5rem;
  padding: 1rem;
}

.chatbot-stats__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.chatbot-stats__title {
  font-size: 1rem;
  font-weight: 600;
  color: rgba(17, 24, 39, 1);
  margin: 0;
}

.chatbot-stats__reset {
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  background-color: rgba(243, 244, 246, 1);
  border: 1px solid rgba(209, 213, 219, 1);
  border-radius: 0.25rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.chatbot-stats__reset:hover {
  background-color: rgba(229, 231, 235, 1);
}

.chatbot-stats__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.75rem;
}

.chatbot-stats__item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.chatbot-stats__item--full {
  grid-column: 1 / -1;
}

.chatbot-stats__label {
  font-size: 0.75rem;
  color: rgba(107, 114, 128, 1);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.chatbot-stats__value {
  font-size: 1.25rem;
  font-weight: 600;
  color: rgba(17, 24, 39, 1);
}

.chatbot-stats__value--error {
  color: rgba(220, 38, 38, 1);
}

.chatbot-stats__value--active {
  color: rgba(59, 130, 246, 1);
}
</style>

