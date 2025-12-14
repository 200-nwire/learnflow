<template>
  <div v-if="botId && apiUrl" class="chatbot-embedded-container">
      <AvatarChat
        :key="`embedded-${botId}`"
        :base-url="apiUrl"
        client-type="lms"
        :bot-id="botId"
        :course-id="courseId"
        :lesson-id="lessonId"
        :page-id="pageId"
        :stt-lang="sttLang"
        :get-auth="getAuth"
        mode="embedded"
        :style="{ height: height || '600px', width: '100%' }"
      />
  </div>
</template>

<script setup lang="ts">
import { computed, inject, toValue } from 'vue';
import { useRoute } from 'vue-router';
import { AvatarChat } from '@amit-org-il/chat-vue';
import '@amit-org-il/chat-vue/style.css';
import { currentPageInjectionKey, type BotConnectOptions } from './chatbot-constants';

// Get route for params access
const route = useRoute();

// Helper to get route params
const useRouteParams = (key: string) => {
  return computed(() => route?.params?.[key] as string | undefined);
};

export interface ChatbotEmbeddedProps {
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
  /** Container height (default: 600px) */
  height?: string;
  /** Custom auth function (optional, uses plugin default if not provided) */
  getAuth?: () => { jwt: string } | Promise<{ jwt: string }>;
  /** Whether to auto-detect course/lesson/page from route/injection (default: true) */
  autoDetectMeta?: boolean;
}

const props = withDefaults(defineProps<ChatbotEmbeddedProps>(), {
  autoDetectMeta: true,
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
</script>

<style scoped>
.chatbot-embedded-container {
  width: 100%;
  height: 100%;
  position: relative;
  isolation: isolate;
}

/* Ensure chatbot elements are visible */
.chatbot-embedded-container :deep(.avatar-chat),
.chatbot-embedded-container :deep(.chat-container),
.chatbot-embedded-container :deep(.chat-wrapper),
.chatbot-embedded-container :deep(canvas),
.chatbot-embedded-container :deep(video),
.chatbot-embedded-container :deep(.talking-head),
.chatbot-embedded-container :deep(.avatar-container) {
  width: 100% !important;
  height: 100% !important;
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
  position: relative !important;
}

/* Ensure the avatar canvas/video has proper sizing */
.chatbot-embedded-container :deep(canvas),
.chatbot-embedded-container :deep(video) {
  object-fit: contain !important;
  background: #000 !important;
}
</style>

