<template>
  <div class="chatbot-simulator-v2" :class="{ 'bubble-mode': chatMode === 'bubble' }">
    <!-- Backdrop overlay - shown when chat is open in bubble mode -->
    <div
      v-if="isChatOpen && chatMode === 'bubble'"
      class="chat-backdrop"
      @click="isChatOpen = false"
    />

    <div class="chatbot-simulator-v2__container">
      <!-- Configuration Panel -->
      <div class="chatbot-simulator-v2__config-panel">
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-cog text-blue-500"></i>
              Configuration
            </div>
          </template>
          <template #content>
            <div class="space-y-4">
              <!-- API URL -->
              <div>
                <label class="block text-sm font-medium mb-2">API URL</label>
                <input
                  v-model="apiUrl"
                  type="text"
                  placeholder="https://botgen-dev-105584895737.me-west1.run.app"
                  class="w-full p-2 border rounded"
                />
                <p class="text-xs text-gray-500 mt-1">
                  Current: {{ apiUrl || 'Not set' }}
                </p>
              </div>

              <!-- Bot Selection -->
              <div>
                <label class="block text-sm font-medium mb-2">Bot Selection</label>
                <select
                  v-model="selectedBotType"
                  class="w-full p-2 border rounded mb-2"
                >
                  <option value="">Select a bot...</option>
                  <option
                    v-for="bot in PREDEFINED_BOTS"
                    :key="bot.id"
                    :value="bot.id"
                  >
                    {{ bot.icon }} {{ bot.name }}
                  </option>
                  <option value="custom">Custom Bot ID...</option>
                </select>
                
                <!-- Custom Bot ID Input (shown when custom is selected) -->
                <input
                  v-if="selectedBotType === 'custom'"
                  v-model="customBotId"
                  type="text"
                  placeholder="Enter Custom Bot ID"
                  class="w-full p-2 border rounded mt-2"
                />
                
                <!-- Bot Description (shown when predefined bot is selected) -->
                <div
                  v-if="selectedBotType && selectedBotType !== 'custom' && selectedBot"
                  class="mt-2 p-2 rounded text-xs"
                  :style="{ backgroundColor: selectedBot.color + '20', border: `1px solid ${selectedBot.color}40` }"
                >
                  <div class="font-medium" :style="{ color: selectedBot.color }">
                    {{ selectedBot.description }}
                  </div>
                </div>
              </div>

              <!-- Course Context -->
              <div>
                <label class="block text-sm font-medium mb-2">Course Context (Optional)</label>
                <div class="space-y-2">
                  <input
                    v-model="courseId"
                    type="text"
                    placeholder="Course ID"
                    class="w-full p-2 border rounded text-sm"
                  />
                  <input
                    v-model="lessonId"
                    type="text"
                    placeholder="Lesson ID"
                    class="w-full p-2 border rounded text-sm"
                  />
                  <input
                    v-model="pageId"
                    type="text"
                    placeholder="Page ID"
                    class="w-full p-2 border rounded text-sm"
                  />
                </div>
              </div>

              <!-- Chat Mode -->
              <div>
                <label class="block text-sm font-medium mb-2">Chat Mode</label>
                <select
                  v-model="chatMode"
                  class="w-full p-2 border rounded"
                >
                  <option value="bubble">Bubble (Floating)</option>
                  <option value="embedded">Embedded</option>
                </select>
              </div>

              <!-- JWT Token -->
              <div>
                <label class="block text-sm font-medium mb-2">JWT Token</label>
                <textarea
                  v-model="jwtToken"
                  type="text"
                  placeholder="Enter JWT token"
                  class="w-full p-2 border rounded font-mono text-xs"
                  rows="3"
                />
                <p class="text-xs text-gray-500 mt-1">
                  Token stored in localStorage for this session
                </p>
              </div>

              <!-- Info Section -->
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div class="flex items-start gap-2">
                  <i class="pi pi-info-circle text-blue-600 mt-0.5"></i>
                  <div class="text-xs text-blue-900">
                    <strong>Note:</strong> Make sure to set VITE_API_URL in .env file for production use.
                    JWT token will be stored in localStorage.
                  </div>
                </div>
              </div>
            </div>
          </template>
        </Card>

        <!-- Stats or Info -->
        <Card class="mt-4">
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-info-circle text-green-500"></i>
              Status
            </div>
          </template>
          <template #content>
            <div class="space-y-2 text-sm">
              <div>
                <strong>API URL:</strong> 
                <span :class="apiUrl ? 'text-green-600' : 'text-red-600'">
                  {{ apiUrl ? 'Set' : 'Not set' }}
                </span>
              </div>
              <div>
                <strong>Bot ID:</strong> 
                <span :class="botId ? 'text-green-600' : 'text-red-600'">
                  {{ botId ? 'Set' : 'Not set' }}
                </span>
              </div>
              <div>
                <strong>JWT Token:</strong> 
                <span :class="jwtToken ? 'text-green-600' : 'text-orange-600'">
                  {{ jwtToken ? 'Set' : 'Not set (will use empty)' }}
                </span>
              </div>
              <div>
                <strong>Chat Mode:</strong> 
                <span class="text-blue-600 capitalize">{{ chatMode }}</span>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Main Content Area -->
      <div class="chatbot-simulator-v2__content">
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-comments text-purple-500"></i>
              Chatbot Demo
            </div>
          </template>
          <template #content>
            <div class="p-8 text-center text-gray-600">
              <h2 class="text-2xl font-bold mb-4 text-gray-800">Main Content Area</h2>
              <p class="mb-2">This is your main application content.</p>
              <p class="mb-4">
                <span v-if="chatMode === 'bubble'">
                  The chatbot appears as a floating bubble button. Click it to open!
                </span>
                <span v-else>
                  The chatbot is embedded inline below.
                </span>
              </p>
              
              <!-- Embedded Chat Mode -->
              <div v-if="chatMode === 'embedded' && botId && apiUrl" class="mt-8">
                <div class="border-t pt-8">
                  <h3 class="text-lg font-semibold mb-4">Embedded Chat</h3>
                  <ChatbotEmbedded
                    :bot-id="botId"
                    :api-url="apiUrl"
                    :course-id="courseId || undefined"
                    :lesson-id="lessonId || undefined"
                    :page-id="pageId || undefined"
                    height="600px"
                  />
                  <!-- Debug info -->
                  <div class="mt-4 text-xs text-gray-500">
                    <p>Bot ID: {{ botId }}</p>
                    <p>API URL: {{ apiUrl }}</p>
                    <p>Mode: {{ chatMode }}</p>
                  </div>
                </div>
              </div>

              <!-- Instructions for Bubble Mode -->
              <div v-else-if="chatMode === 'bubble'" class="mt-8">
                <div class="bg-gray-50 rounded-lg p-4 text-left">
                  <h3 class="font-semibold mb-2">How to use:</h3>
                  <ol class="list-decimal list-inside space-y-1 text-sm">
                    <li>Set the API URL (from .env or manually)</li>
                    <li>Enter a Bot ID</li>
                    <li>Optionally set course/lesson/page context</li>
                    <li>Optionally set JWT token (stored in localStorage)</li>
                    <li>Look for the floating chat bubble button</li>
                  </ol>
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>

    <!-- Bubble Mode Chat (Floating) -->
    <ChatbotBubble
      v-if="chatMode === 'bubble'"
      :bot-id="botId"
      :api-url="apiUrl"
      :course-id="courseId || undefined"
      :lesson-id="lessonId || undefined"
      :page-id="pageId || undefined"
      position="bottom-right"
      size="large"
      v-model="isChatOpen"
      @open="isChatOpen = true"
      @close="isChatOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import Card from 'primevue/card';
import { AvatarChat } from '@amit-org-il/chat-vue';
import ChatbotBubble from '../components/ChatbotBubble.vue';
import ChatbotEmbedded from '../components/ChatbotEmbedded.vue';
// Import chatbot styles with scoping
import '@amit-org-il/chat-vue/style.css';

// ============================================================================
// Configuration State
// ============================================================================

// API URL from env or manual input
const apiUrl = ref(import.meta.env.VITE_API_URL || 'https://botgen-dev-105584895737.me-west1.run.app');

// Predefined Bots
const PREDEFINED_BOTS = [
  {
    id: 'ab20803f-812c-4a35-9afd-2ea734f6f953',
    name: 'Gemini Live Avatar',
    description: 'Live voice mode with Gemini AI and avatar',
    icon: '🎭',
    color: '#8B5CF6', // Purple
  },
  {
    id: 'f886be30-15c0-4a61-9005-f4c1688e76f3',
    name: 'Azure Avatar',
    description: 'Azure TTS with avatar and lipsync',
    icon: '🗣️',
    color: '#0078D4', // Azure Blue
  },
  {
    id: '48178aa3-deac-48de-b568-e1a2ef74839e',
    name: 'Video Bot',
    description: 'Video responses',
    icon: '🎬',
    color: '#EF4444', // Red
  },
  {
    id: 'a8c39d93-078d-42e6-ad96-f5215c0b81af',
    name: 'Text Bot',
    description: 'Text-only chat without avatar',
    icon: '💬',
    color: '#10B981', // Green
  },
] as const;

// Bot configuration
// Default to Gemini Live Avatar
const selectedBotType = ref<string>('ab20803f-812c-4a35-9afd-2ea734f6f953');
const customBotId = ref('');
const courseId = ref('');
const lessonId = ref('');
const pageId = ref('');

// Computed: Get selected bot details
const selectedBot = computed(() => {
  if (!selectedBotType.value || selectedBotType.value === 'custom') {
    return null;
  }
  return PREDEFINED_BOTS.find(bot => bot.id === selectedBotType.value);
});

// Computed: Get the actual botId to use (predefined or custom)
const botId = computed(() => {
  if (selectedBotType.value === 'custom') {
    return customBotId.value;
  }
  return selectedBotType.value || '';
});

// Chat mode - Default to embedded
const chatMode = ref<'bubble' | 'embedded'>('embedded');

// JWT Token (stored in localStorage)
const jwtToken = ref('');
const JWT_STORAGE_KEY = 'chatbot_jwt_token';

// Chat open state (for backdrop)
const isChatOpen = ref(false);

// ============================================================================
// Auth Function
// ============================================================================

function getAuth() {
  const token = jwtToken.value || localStorage.getItem(JWT_STORAGE_KEY) || '';
  return { jwt: token };
}

// ============================================================================
// Watch JWT token changes and save to localStorage
// ============================================================================

watch(jwtToken, (newToken) => {
  if (newToken) {
    localStorage.setItem(JWT_STORAGE_KEY, newToken);
  } else {
    localStorage.removeItem(JWT_STORAGE_KEY);
  }
}, { immediate: true });

// Watch for custom botId changes to check if it matches a predefined bot
watch(customBotId, (newBotId) => {
  if (selectedBotType.value === 'custom' && newBotId) {
    // Check if custom bot ID matches a predefined bot
    const matchingBot = PREDEFINED_BOTS.find(bot => bot.id === newBotId);
    if (matchingBot) {
      // Auto-select the matching predefined bot
      selectedBotType.value = matchingBot.id;
      customBotId.value = '';
    }
  }
});

// ============================================================================
// Load JWT from localStorage on mount
// ============================================================================

onMounted(() => {
  const savedToken = localStorage.getItem(JWT_STORAGE_KEY);
  if (savedToken) {
    jwtToken.value = savedToken;
  }
});
</script>

<style scoped>
.chatbot-simulator-v2 {
  position: relative;
  height: calc(100vh - 105px);
  padding: 1.5rem;
}

/* Allow overflow when bubble mode is active so floating bubble is visible */
.chatbot-simulator-v2.bubble-mode {
  overflow: visible;
}

.chatbot-simulator-v2__container {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 1.5rem;
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  position: relative;
}

/* When bubble mode, allow overflow so bubble can float */
.chatbot-simulator-v2.bubble-mode .chatbot-simulator-v2__container {
  overflow: visible;
}

.chatbot-simulator-v2__config-panel {
  overflow-y: auto;
  height: 100%;
  padding-right: 0.5rem;
}

.chatbot-simulator-v2__content {
  overflow-y: auto;
  height: 100%;
  padding-right: 0.5rem;
}


@media (max-width: 1024px) {
  .chatbot-simulator-v2__container {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }
  
  .chatbot-simulator-v2__config-panel {
    max-height: 400px;
  }
}
</style>

<!-- Scoped chatbot styles to prevent conflicts -->
<style>
/* Scope chatbot styles to .chatbot-scope containers only */
.chatbot-scope {
  /* Create isolation context */
  isolation: isolate;
  position: relative;
}

/* ChatBubble component handles its own positioning */

/* Embedded chat container styling */
.chatbot-embedded-container {
  width: 100%;
  min-height: 700px;
}

.chatbot-embedded-wrapper {
  width: 100%;
  height: 600px;
  min-height: 600px;
  position: relative;
  display: flex;
  flex-direction: column;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

/* Ensure avatar and chat interface are visible */
.chatbot-embedded-wrapper :deep(.avatar-chat),
.chatbot-embedded-wrapper :deep(.chat-container),
.chatbot-embedded-wrapper :deep(.chat-wrapper),
.chatbot-embedded-wrapper :deep(canvas),
.chatbot-embedded-wrapper :deep(video),
.chatbot-embedded-wrapper :deep(.talking-head),
.chatbot-embedded-wrapper :deep(.avatar-container) {
  width: 100% !important;
  height: 100% !important;
  min-height: 400px !important;
  max-width: 100% !important;
  max-height: 100% !important;
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
  position: relative !important;
}

/* Ensure the avatar canvas/video has proper sizing */
.chatbot-embedded-wrapper :deep(canvas),
.chatbot-embedded-wrapper :deep(video) {
  object-fit: contain !important;
  background: #000 !important;
}

/* Prevent parent styles from affecting chatbot */
.chatbot-scope :deep(*) {
  box-sizing: border-box;
}

/* Reset any PrimeVue/Tailwind interference within chatbot scope */
.chatbot-scope :deep(.p-component),
.chatbot-scope :deep(.p-button) {
  /* Let chatbot styles take precedence */
  all: revert;
}

</style>

