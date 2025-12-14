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

/* ============================================
   MARKDOWN STYLES - Polished & Theme-Aligned
   ============================================ */

/* Headings - Better hierarchy and spacing */
.chat-message__bubble :deep(h1),
.chat-message__bubble :deep(h2),
.chat-message__bubble :deep(h3),
.chat-message__bubble :deep(h4),
.chat-message__bubble :deep(h5),
.chat-message__bubble :deep(h6) {
  margin-top: 0.75em;
  margin-bottom: 0.5em;
  font-weight: 700;
  line-height: 1.3;
  color: inherit;
}

.chat-message__bubble :deep(h1) {
  font-size: 1.5em;
  margin-top: 0.5em;
}

.chat-message__bubble :deep(h2) {
  font-size: 1.3em;
}

.chat-message__bubble :deep(h3) {
  font-size: 1.15em;
}

.chat-message__bubble :deep(h4),
.chat-message__bubble :deep(h5),
.chat-message__bubble :deep(h6) {
  font-size: 1.05em;
}

/* Full-width assistant headings */
.chat-message__assistant-content :deep(h1),
.chat-message__assistant-content :deep(h2),
.chat-message__assistant-content :deep(h3),
.chat-message__assistant-content :deep(h4),
.chat-message__assistant-content :deep(h5),
.chat-message__assistant-content :deep(h6) {
  margin-top: 1.25em;
  margin-bottom: 0.75em;
  font-weight: 700;
  line-height: 1.3;
  color: rgba(17, 24, 39, 1);
}

.chat-message__assistant-content :deep(h1) {
  font-size: 1.75em;
  border-bottom: 2px solid rgba(229, 231, 235, 1);
  padding-bottom: 0.5em;
}

.chat-message__assistant-content :deep(h2) {
  font-size: 1.5em;
  border-bottom: 1px solid rgba(229, 231, 235, 1);
  padding-bottom: 0.375em;
}

.chat-message__assistant-content :deep(h3) {
  font-size: 1.25em;
}

/* Paragraphs - Better spacing */
.chat-message__bubble :deep(p) {
  margin: 0.625em 0;
  line-height: 1.7;
}

.chat-message__assistant-content :deep(p) {
  margin: 0.875em 0;
  line-height: 1.75;
  color: rgba(55, 65, 81, 1);
}

/* Lists - RTL/LTR aware with proper indentation */
.chat-message__bubble :deep(ul),
.chat-message__bubble :deep(ol) {
  margin: 0.625em 0;
  padding-inline-start: 1.75em; /* RTL/LTR aware */
  padding-inline-end: 0;
}

.chat-message__bubble--assistant :deep(ul),
.chat-message__bubble--assistant :deep(ol) {
  color: white;
}

.chat-message__assistant-content :deep(ul),
.chat-message__assistant-content :deep(ol) {
  margin: 0.875em 0;
  padding-inline-start: 2em; /* RTL/LTR aware */
  padding-inline-end: 0;
}

/* List items - Better spacing and nested support */
.chat-message__bubble :deep(li) {
  margin: 0.375em 0;
  line-height: 1.6;
  padding-inline-start: 0.25em;
}

.chat-message__bubble :deep(li > p) {
  margin: 0.25em 0;
}

.chat-message__bubble :deep(li > ul),
.chat-message__bubble :deep(li > ol) {
  margin: 0.375em 0;
  padding-inline-start: 1.5em;
}

.chat-message__assistant-content :deep(li) {
  margin: 0.5em 0;
  line-height: 1.7;
  padding-inline-start: 0.375em;
}

.chat-message__assistant-content :deep(li > p) {
  margin: 0.375em 0;
}

.chat-message__assistant-content :deep(li > ul),
.chat-message__assistant-content :deep(li > ol) {
  margin: 0.5em 0;
  padding-inline-start: 1.75em;
}

/* Unordered list markers - Better styling */
.chat-message__bubble :deep(ul) {
  list-style-type: disc;
}

.chat-message__bubble :deep(ul ul) {
  list-style-type: circle;
}

.chat-message__bubble :deep(ul ul ul) {
  list-style-type: square;
}

.chat-message__assistant-content :deep(ul) {
  list-style-type: disc;
}

.chat-message__assistant-content :deep(ul ul) {
  list-style-type: circle;
}

.chat-message__assistant-content :deep(ul ul ul) {
  list-style-type: square;
}

/* Ordered list markers */
.chat-message__bubble :deep(ol) {
  list-style-type: decimal;
}

.chat-message__bubble :deep(ol ol) {
  list-style-type: lower-alpha;
}

.chat-message__bubble :deep(ol ol ol) {
  list-style-type: lower-roman;
}

.chat-message__assistant-content :deep(ol) {
  list-style-type: decimal;
}

.chat-message__assistant-content :deep(ol ol) {
  list-style-type: lower-alpha;
}

.chat-message__assistant-content :deep(ol ol ol) {
  list-style-type: lower-roman;
}

/* Text formatting */
.chat-message__bubble :deep(strong),
.chat-message__bubble :deep(b) {
  font-weight: 700;
  color: inherit;
}

.chat-message__assistant-content :deep(strong),
.chat-message__assistant-content :deep(b) {
  font-weight: 700;
  color: rgba(17, 24, 39, 1);
}

.chat-message__bubble :deep(em),
.chat-message__bubble :deep(i) {
  font-style: italic;
}

.chat-message__assistant-content :deep(em),
.chat-message__assistant-content :deep(i) {
  font-style: italic;
  color: rgba(55, 65, 81, 1);
}

/* Links - Theme-aligned blue */
.chat-message__bubble :deep(a) {
  color: rgba(59, 130, 246, 1);
  text-decoration: none;
  border-bottom: 1px solid rgba(59, 130, 246, 0.3);
  transition: all 0.2s ease;
}

.chat-message__bubble :deep(a:hover) {
  color: rgba(37, 99, 235, 1);
  border-bottom-color: rgba(37, 99, 235, 0.6);
}

.chat-message__bubble--assistant :deep(a) {
  color: rgba(147, 197, 253, 1);
  border-bottom-color: rgba(147, 197, 253, 0.5);
}

.chat-message__bubble--assistant :deep(a:hover) {
  color: rgba(191, 219, 254, 1);
  border-bottom-color: rgba(191, 219, 254, 0.7);
}

.chat-message__assistant-content :deep(a) {
  color: rgba(59, 130, 246, 1);
  text-decoration: none;
  border-bottom: 1px solid rgba(59, 130, 246, 0.3);
  transition: all 0.2s ease;
  font-weight: 500;
}

.chat-message__assistant-content :deep(a:hover) {
  color: rgba(37, 99, 235, 1);
  border-bottom-color: rgba(37, 99, 235, 0.6);
}

/* Inline code - Better styling */
.chat-message__bubble :deep(code) {
  background-color: rgba(0, 0, 0, 0.08);
  padding: 0.1875rem 0.375rem;
  border-radius: 0.25rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
  font-size: 0.875em;
  font-weight: 500;
  color: inherit;
}

.chat-message__bubble--assistant :deep(code) {
  background-color: rgba(255, 255, 255, 0.25);
  color: rgba(255, 255, 255, 0.95);
}

.chat-message__assistant-content :deep(code) {
  background-color: rgba(243, 244, 246, 1);
  padding: 0.1875rem 0.375rem;
  border-radius: 0.25rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
  font-size: 0.875em;
  font-weight: 500;
  color: rgba(220, 38, 127, 1); /* Pink for code text */
  border: 1px solid rgba(229, 231, 235, 1);
}

/* Code blocks - Polished styling */
.chat-message__bubble :deep(pre) {
  background-color: rgba(0, 0, 0, 0.08);
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 0.75em 0;
  border: 1px solid rgba(0, 0, 0, 0.1);
  line-height: 1.6;
}

.chat-message__bubble--assistant :deep(pre) {
  background-color: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.2);
}

.chat-message__assistant-content :deep(pre) {
  background-color: rgba(17, 24, 39, 1);
  padding: 1.125rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 1em 0;
  border: 1px solid rgba(229, 231, 235, 1);
  line-height: 1.6;
}

.chat-message__bubble :deep(pre code),
.chat-message__assistant-content :deep(pre code) {
  background-color: transparent;
  padding: 0;
  border: none;
  color: inherit;
  font-size: 0.875em;
  display: block;
  white-space: pre;
}

.chat-message__assistant-content :deep(pre code) {
  color: rgba(229, 231, 241, 1);
}

/* Blockquotes - Styled with left border */
.chat-message__bubble :deep(blockquote) {
  margin: 0.75em 0;
  padding: 0.625em 1em;
  padding-inline-start: 1em;
  border-inline-start: 4px solid rgba(59, 130, 246, 0.5);
  background-color: rgba(0, 0, 0, 0.03);
  border-radius: 0 0.25rem 0.25rem 0;
  font-style: italic;
  color: inherit;
}

.chat-message__bubble--assistant :deep(blockquote) {
  border-inline-start-color: rgba(255, 255, 255, 0.4);
  background-color: rgba(255, 255, 255, 0.1);
}

.chat-message__assistant-content :deep(blockquote) {
  margin: 1em 0;
  padding: 0.875em 1.25em;
  padding-inline-start: 1.25em;
  border-inline-start: 4px solid rgba(59, 130, 246, 0.6);
  background-color: rgba(239, 246, 255, 1);
  border-radius: 0 0.375rem 0.375rem 0;
  font-style: italic;
  color: rgba(55, 65, 81, 1);
}

.chat-message__bubble :deep(blockquote p),
.chat-message__assistant-content :deep(blockquote p) {
  margin: 0.5em 0;
}

.chat-message__bubble :deep(blockquote p:first-child),
.chat-message__assistant-content :deep(blockquote p:first-child) {
  margin-top: 0;
}

.chat-message__bubble :deep(blockquote p:last-child),
.chat-message__assistant-content :deep(blockquote p:last-child) {
  margin-bottom: 0;
}

/* Horizontal rules */
.chat-message__bubble :deep(hr),
.chat-message__assistant-content :deep(hr) {
  margin: 1.5em 0;
  border: none;
  border-top: 2px solid rgba(229, 231, 235, 1);
  background: none;
}

.chat-message__bubble--assistant :deep(hr) {
  border-top-color: rgba(255, 255, 255, 0.3);
}

/* Tables - Polished styling */
.chat-message__bubble :deep(table),
.chat-message__assistant-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
  font-size: 0.9375em;
}

.chat-message__bubble :deep(th),
.chat-message__bubble :deep(td),
.chat-message__assistant-content :deep(th),
.chat-message__assistant-content :deep(td) {
  padding: 0.625em 0.875em;
  text-align: start;
  border: 1px solid rgba(229, 231, 235, 1);
}

.chat-message__bubble--assistant :deep(th),
.chat-message__bubble--assistant :deep(td) {
  border-color: rgba(255, 255, 255, 0.2);
}

.chat-message__bubble :deep(th),
.chat-message__assistant-content :deep(th) {
  background-color: rgba(243, 244, 246, 1);
  font-weight: 700;
  color: rgba(17, 24, 39, 1);
}

.chat-message__bubble--assistant :deep(th) {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
}

.chat-message__assistant-content :deep(tr:nth-child(even)) {
  background-color: rgba(249, 250, 251, 1);
}

.chat-message__bubble--assistant :deep(tr:nth-child(even)) {
  background-color: rgba(255, 255, 255, 0.05);
}

/* Images */
.chat-message__bubble :deep(img),
.chat-message__assistant-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  margin: 1em 0;
}

.chat-message__assistant-content :deep(img) {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
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

