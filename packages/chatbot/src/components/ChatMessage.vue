<template>
  <div
    class="chat-message"
    :class="{
      'chat-message--user': message.role === 'user',
      'chat-message--assistant': message.role === 'assistant',
      'chat-message--rtl': rtl,
      'chat-message--full-width': fullWidth
    }"
    :dir="rtl ? 'rtl' : 'ltr'"
  >
    <!-- User message (bubble style) -->
    <div
      v-if="message.role === 'user'"
      class="chat-message__bubble chat-message__bubble--user"
    >
        <MarkdownRender
          v-if="message.content && supportsMarkdown"
          :key="`md-${message.id}`"
          :content="message.content"
          :components="customComponents"
          :options="{ breaks: true, gfm: true }"
        />
        <div
          v-else-if="message.content"
          :key="`plain-${message.id}`"
          class="chat-message__plain-text"
          v-text="message.content"
        />
    </div>
    
    <!-- Assistant message (full width like ChatGPT) -->
    <div
      v-else-if="message.role === 'assistant'"
      class="chat-message__assistant"
    >
      <div class="chat-message__assistant-content">
        <!-- Show content if available (streaming or not) -->
        <MarkdownRender
          v-if="message.content && supportsMarkdown"
          :key="`md-content-${message.id}-${message.content.length}`"
          :content="message.content"
          :components="customComponents"
          :options="{ breaks: true, gfm: true }"
        />
        <div
          v-else-if="message.content"
          :key="`plain-content-${message.id}-${message.content.length}`"
          class="chat-message__plain-text"
          v-text="message.content"
        />
        <!-- Show typing indicator when streaming (always show at end of content) -->
        <div v-if="message.streaming" class="chat-message__typing">
          <span class="chat-message__typing-dot"></span>
          <span class="chat-message__typing-dot"></span>
          <span class="chat-message__typing-dot"></span>
        </div>
        <!-- Suggestions (rendered as link boxes after message) -->
        <div 
          v-if="message.suggestions && Array.isArray(message.suggestions) && message.suggestions.length > 0 && !message.streaming" 
          class="chat-message__suggestions"
        >
          <button
            v-for="(suggestion, index) in message.suggestions"
            :key="`suggestion-${message.id}-${index}`"
            class="chat-message__suggestion"
            @click="handleSuggestionClick(suggestion)"
            type="button"
          >
            {{ suggestion.label }}
          </button>
        </div>
      </div>
      <span
        v-if="timeAgo"
        class="chat-message__time-ago"
      >
        {{ timeAgo }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import MarkdownRender from 'vue-renderer-markdown';
import type { ChatMessage, Suggestion } from '../types.js';

interface Props {
  message: ChatMessage;
  customComponents?: Record<string, any>;
  rtl?: boolean;
  fullWidth?: boolean; // Full-width assistant messages (like ChatGPT)
  supportsMarkdown?: boolean; // Whether to use markdown renderer
}

const props = withDefaults(defineProps<Props>(), {
  customComponents: () => ({}),
  rtl: false,
  fullWidth: true,
  supportsMarkdown: true,
});

const emit = defineEmits<{
  suggestionClick: [suggestion: Suggestion];
}>();

function handleSuggestionClick(suggestion: Suggestion): void {
  emit('suggestionClick', suggestion);
}

// Debug: Watch for suggestions changes
watch(() => props.message.suggestions, (suggestions) => {
  console.log('[ChatMessage] Suggestions changed:', {
    messageId: props.message.id,
    hasSuggestions: !!(suggestions && suggestions.length > 0),
    count: suggestions?.length || 0,
    isStreaming: props.message.streaming,
    suggestions,
  });
}, { immediate: true, deep: true });

const timeAgo = computed(() => {
  if (!props.message.timestamp) {
    return '';
  }
  
  const date = props.message.timestamp instanceof Date 
    ? props.message.timestamp 
    : new Date(props.message.timestamp);
  
  if (isNaN(date.getTime())) {
    return '';
  }
  
  // Simple time ago calculation without date-fns
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  // Only show time ago if more than 1 minute
  if (diffMins <= 1) {
    return '';
  }
  
  if (diffMins < 60) {
    return `${diffMins} minutes ago`;
  }
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  }
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
});
</script>

<style scoped>
.chat-message {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  margin-bottom: 0;
  gap: 1.25rem;
  width: 100%;
}

.chat-message[dir="rtl"] {
  direction: rtl;
}

.chat-message--user {
  flex-direction: row-reverse;
  margin-bottom: 1rem;
  justify-content: flex-end;
}

.chat-message--rtl.chat-message--user {
  flex-direction: row;
  justify-content: flex-start;
}

.chat-message--rtl.chat-message--assistant {
  flex-direction: row-reverse;
}

.chat-message--full-width .chat-message--assistant {
  width: 100%;
}

.chat-message__bubble {
  position: relative;
  padding: 0.375rem 0.75rem; /* Even less vertical padding */
  font-size: 0.9375rem; /* 15px - cleaner font size */
  line-height: 1.6;
  max-width: 80%;
  word-wrap: break-word;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  direction: inherit; /* Inherit direction from parent */
  unicode-bidi: embed; /* Proper Unicode bidirectional text support */
}

.chat-message__bubble--user {
  background-color: #bae6fd; /* sky-blue-200 */
  margin-left: 0; /* Align to left edge in LTR */
  margin-right: 0;
  border-radius: 0 0.5rem 0.5rem 0.5rem; /* No rounding on left in LTR: top-left=0, top-right, bottom-right, bottom-left */
  color: rgba(17, 24, 39, 1);
  max-width: 80%;
}

.chat-message--rtl .chat-message__bubble--user {
  margin-left: 0;
  margin-right: 0; /* Align to right edge in RTL */
  border-radius: 0.5rem 0 0.5rem 0.5rem; /* No rounding on right in RTL: top-left, top-right=0, bottom-right, bottom-left */
}

/* Full-width assistant messages (like ChatGPT) */
.chat-message__assistant {
  width: 100%;
  padding: 1rem 0;
  border-bottom: 1px solid rgba(229, 231, 235, 0.5);
  display: flex;
  direction: inherit; /* Inherit direction from parent */
  unicode-bidi: embed; /* Proper Unicode bidirectional text support */
  flex-direction: column;
}

.chat-message__assistant-content {
  width: 100%;
  max-width: 100%;
  color: rgba(17, 24, 39, 1);
  line-height: 1.6;
  font-size: 0.9375rem; /* 15px - cleaner font size */
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  direction: inherit; /* Inherit direction from parent */
  unicode-bidi: embed; /* Proper Unicode bidirectional text support */
}

/* Ensure proper text rendering for Hebrew and other languages */
.chat-message__assistant-content :deep(*) {
  font-family: inherit;
  direction: inherit;
  unicode-bidi: inherit;
}

.chat-message__bubble--assistant {
  background-color: #3b82f6; /* primary */
  margin-right: 1.25rem;
  border-radius: 0.5rem 0.5rem 0.5rem 0; /* rounded-r-lg rounded-tl-lg */
  color: white;
  max-width: 80%;
}

.chat-message--rtl .chat-message__bubble--assistant {
  margin-right: 0;
  margin-left: 1.25rem;
}

/* Markdown styles for bubbles */
.chat-message__bubble :deep(h1),
.chat-message__bubble :deep(h2),
.chat-message__bubble :deep(h3),
.chat-message__bubble :deep(h4),
.chat-message__bubble :deep(h5),
.chat-message__bubble :deep(h6) {
  margin-top: 0.5em;
  margin-bottom: 0.5em;
  font-weight: 600;
}

/* Markdown styles for full-width assistant */
.chat-message__assistant-content :deep(h1),
.chat-message__assistant-content :deep(h2),
.chat-message__assistant-content :deep(h3),
.chat-message__assistant-content :deep(h4),
.chat-message__assistant-content :deep(h5),
.chat-message__assistant-content :deep(h6) {
  margin-top: 1em;
  margin-bottom: 0.5em;
  font-weight: 600;
}

.chat-message__assistant-content :deep(ul),
.chat-message__assistant-content :deep(ol) {
  margin: 0.75em 0;
  padding-left: 1.5em;
}

.chat-message__assistant-content :deep(li) {
  margin: 0.5em 0;
}

.chat-message__assistant-content :deep(p) {
  margin: 0.75em 0;
}

.chat-message__assistant-content :deep(strong),
.chat-message__assistant-content :deep(b) {
  font-weight: 600;
}

.chat-message__assistant-content :deep(em),
.chat-message__assistant-content :deep(i) {
  font-style: italic;
}

.chat-message__assistant-content :deep(a) {
  color: rgba(59, 130, 246, 1);
  text-decoration: underline;
}

.chat-message__assistant-content :deep(code) {
  background-color: rgba(243, 244, 246, 1);
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-family: monospace;
  font-size: 0.875em;
}

.chat-message__assistant-content :deep(pre) {
  background-color: rgba(243, 244, 246, 1);
  padding: 0.75rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 0.75em 0;
}

.chat-message__assistant-content :deep(pre code) {
  background-color: transparent;
  padding: 0;
}

.chat-message__bubble :deep(ul),
.chat-message__bubble :deep(ol) {
  margin: 0.5em 0;
  padding-left: 1.5em;
}

.chat-message__bubble--assistant :deep(ul),
.chat-message__bubble--assistant :deep(ol) {
  color: white;
}

.chat-message__bubble :deep(li) {
  margin: 0.25em 0;
}

.chat-message__bubble :deep(p) {
  margin: 0.5em 0;
}

.chat-message__bubble :deep(strong),
.chat-message__bubble :deep(b) {
  font-weight: 600;
}

.chat-message__bubble :deep(em),
.chat-message__bubble :deep(i) {
  font-style: italic;
}

.chat-message__bubble :deep(a) {
  color: inherit;
  text-decoration: underline;
  opacity: 0.9;
}

.chat-message__bubble--assistant :deep(a) {
  color: rgba(255, 255, 255, 0.9);
}

.chat-message__bubble :deep(code) {
  background-color: rgba(0, 0, 0, 0.1);
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-family: monospace;
  font-size: 0.875em;
}

.chat-message__bubble--assistant :deep(code) {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
}

.chat-message__bubble :deep(pre) {
  background-color: rgba(0, 0, 0, 0.1);
  padding: 0.75rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 0.5em 0;
}

.chat-message__bubble--assistant :deep(pre) {
  background-color: rgba(255, 255, 255, 0.2);
}

.chat-message__bubble :deep(pre code) {
  background-color: transparent;
  padding: 0;
}

/* Plain text rendering (when markdown is disabled) */
.chat-message__plain-text {
  white-space: pre-wrap;
  word-wrap: break-word;
  direction: inherit;
  unicode-bidi: embed;
}

/* Typing indicator */
.chat-message__typing {
  display: inline-flex;
  gap: 0.25rem;
  align-items: center;
}

.chat-message__typing-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background-color: currentColor;
  animation: typing 1.4s ease-in-out infinite;
}

.chat-message__typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.chat-message__typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.7;
  }
  30% {
    transform: translateY(-0.5rem);
    opacity: 1;
  }
}

.chat-message__time-ago {
  font-size: 0.75rem;
  color: rgba(107, 114, 128, 1);
  white-space: nowrap;
  margin-top: 0.5rem;
  display: block;
}

/* Suggestions styling */
.chat-message__suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(229, 231, 235, 0.5);
}

.chat-message__suggestion {
  padding: 0.5rem 1rem;
  background-color: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 0.5rem;
  color: rgba(59, 130, 246, 1);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  direction: inherit;
  unicode-bidi: embed;
}

.chat-message__suggestion:hover {
  background-color: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.5);
  transform: translateY(-1px);
}

.chat-message__suggestion:active {
  transform: translateY(0);
}
</style>

