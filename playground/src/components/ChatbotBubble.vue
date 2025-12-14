<template>
  <template v-if="botId && apiUrl">
    <!-- Darkened overlay when chat is open -->
    <div
      v-if="isOpen"
      class="chatbot-bubble-overlay"
      @click="handleClose"
    />
    
    <!-- Floating chat bubble -->
    <ChatBubble
      :key="`bubble-${botId}`"
      :bot-id="botId"
      :position="position"
      :size="size"
      :chat-width="chatWidth"
      :chat-height="chatHeight"
      v-model:is-open="isOpen"
    >
      <AvatarChat
        :base-url="apiUrl"
        client-type="lms"
        :bot-id="botId"
        :course-id="courseId"
        :lesson-id="lessonId"
        :page-id="pageId"
        :stt-lang="sttLang"
        :get-auth="getAuth"
        mode="bubble"
        :style="{ height: '100%' }"
        @open="handleOpen"
        @close="handleClose"
      />
    </ChatBubble>
  </template>
</template>

<script setup lang="ts">
import { ref, watch, computed, inject, toValue } from 'vue';
import { useRoute } from 'vue-router';
import { AvatarChat, ChatBubble } from '@amit-org-il/chat-vue';
import '@amit-org-il/chat-vue/style.css';
import { currentPageInjectionKey, type BotConnectOptions } from './chatbot-constants';

// Get route for params access
const route = useRoute();

// Helper to get route params
const useRouteParams = (key: string) => {
  return computed(() => route?.params?.[key] as string | undefined);
};

export interface ChatbotBubbleProps {
  /** Bot ID to use for the chat */
  botId: string;
  /** API base URL (optional, uses plugin default if not provided) */
  apiUrl?: string;
  /** Course ID for context (optional, will try to get from route params if not provided) */
  courseId?: string;
  /** Lesson ID for context (optional, will try to get from route params if not provided) */
  lessonId?: string;
  /** Page ID for context (optional, will try to get from injected currentPage if not provided) */
  pageId?: string;
  /** Speech-to-text language (STT language) for voice recognition */
  sttLang?: string;
  /** Current assistant object with recognition_lang property (alternative to sttLang) */
  currentAssistant?: { recognition_lang?: string } | null;
  /** Bubble position on screen */
  position?: 'bottom-left' | 'bottom-right';
  /** Bubble size */
  size?: 'small' | 'medium' | 'large';
  /** Chat window width in pixels */
  chatWidth?: number;
  /** Chat window height in pixels */
  chatHeight?: number;
  /** Custom auth function (optional, uses plugin default if not provided) */
  getAuth?: () => { jwt: string } | Promise<{ jwt: string }>;
  /** Initial open state */
  modelValue?: boolean;
  /** Whether to auto-detect course/lesson/page from route/injection (default: true) */
  autoDetectMeta?: boolean;
}

export interface ChatbotBubbleEmits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'open'): void;
  (e: 'close'): void;
}

const props = withDefaults(defineProps<ChatbotBubbleProps>(), {
  position: 'bottom-right',
  size: 'large',
  chatWidth: 360,
  chatHeight: 650,
  modelValue: false,
  autoDetectMeta: true,
});

const emit = defineEmits<ChatbotBubbleEmits>();

// Internal open state
const isOpen = ref(props.modelValue);

// Watch external modelValue changes
watch(() => props.modelValue, (newValue) => {
  isOpen.value = newValue;
});

// Watch internal isOpen changes and emit
watch(isOpen, (newValue) => {
  emit('update:modelValue', newValue);
});

// Try to inject currentPage if available
const injectedCurrentPage = inject<any>(currentPageInjectionKey, null);

// Auto-detect meta from route params and injection if enabled
const routeCourseId = useRouteParams('course');
const routeLessonId = useRouteParams('lesson');

// Computed meta values with fallback priority: props > route params > injection
const courseId = computed(() => {
  if (props.courseId) return props.courseId;
  if (props.autoDetectMeta && routeCourseId.value) return routeCourseId.value;
  return undefined;
});

const lessonId = computed(() => {
  if (props.lessonId) return props.lessonId;
  if (props.autoDetectMeta && routeLessonId.value) return routeLessonId.value;
  return undefined;
});

const pageId = computed(() => {
  if (props.pageId) return props.pageId;
  if (props.autoDetectMeta) {
    const currentPage = toValue(injectedCurrentPage);
    if (currentPage?.id) return currentPage.id;
  }
  return undefined;
});

// STT language with fallback: props.sttLang > currentAssistant.recognition_lang
const sttLang = computed(() => {
  if (props.sttLang) return props.sttLang;
  const assistant = toValue(props.currentAssistant);
  if (assistant?.recognition_lang) return assistant.recognition_lang;
  return undefined;
});

// Computed bot connection options (set on first init along with JWT)
const botConnectionOptions = computed<BotConnectOptions>(() => ({
  courseId: courseId.value,
  lessonId: lessonId.value,
  pageId: pageId.value,
  sttLang: sttLang.value,
}));

// Get API URL from props or use default from plugin
const apiUrl = computed(() => {
  return props.apiUrl || import.meta.env.VITE_API_URL || 'https://botgen-dev-105584895737.me-west1.run.app';
});

// Get auth function from props or use default
const getAuth = computed(() => {
  if (props.getAuth) {
    return props.getAuth;
  }
  
  // Default: get JWT from localStorage
  return () => {
    const token = localStorage.getItem('chatbot_jwt_token') || '';
    return { jwt: token };
  };
});

const handleOpen = () => {
  isOpen.value = true;
  emit('open');
};

const handleClose = () => {
  isOpen.value = false;
  emit('close');
};
</script>

<style scoped>
.chatbot-bubble-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 9997; /* Just below the bubble */
  cursor: pointer;
  backdrop-filter: blur(2px);
}
</style>

