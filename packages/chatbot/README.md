# @amit/chatbot

Production-ready chatbot package for Vue 3 with streaming support, markdown rendering, and comprehensive debugging tools.

## Features

- ⚡ **Streaming Support**: Real-time streaming responses with progressive rendering
- 📝 **Markdown Rendering**: Powered by `vue-renderer-markdown` with custom component support
- 🎨 **Composable Architecture**: Fully composable with TypeScript support
- 🔧 **Configurable**: Easy configuration for endpoints, tokens, and metadata
- 📊 **Statistics & Debugging**: Built-in stats tracking and debug information
- 🧩 **Component-Based**: Modular components for easy integration
- 🚀 **Production Ready**: Robust error handling, timeouts, and retry logic

## Installation

```bash
pnpm add @amit/chatbot vue-renderer-markdown
```

**Note:** For KaTeX math rendering support, also install and import:

```bash
pnpm add katex
```

Then import the KaTeX CSS in your app entry (e.g., `main.ts`):

```typescript
import 'katex/dist/katex.min.css';
```

The `vue-renderer-markdown` package doesn't require any CSS imports - it works out of the box.

## Quick Start

```vue
<template>
  <ChatContainer
    :messages="messages"
    :is-loading="isLoading"
    :is-streaming="isStreaming"
    :error="error"
    @submit="handleSubmit"
  />
</template>

<script setup lang="ts">
import { useChatbot, ChatContainer } from '@amit/chatbot/vue';

const {
  messages,
  isLoading,
  isStreaming,
  error,
  streamMessage,
} = useChatbot({
  endpoint: 'https://api.example.com/chat',
  token: 'your-token',
  streaming: true,
});

async function handleSubmit(message: string) {
  await streamMessage(message);
}
</script>
```

## API

### `useChatbot(config)`

Main composable for chatbot functionality.

**Configuration:**
```typescript
interface ChatbotConfig {
  endpoint: string;        // API endpoint URL
  token?: string;          // Authentication token
  headers?: Record<string, string>;
  meta?: Record<string, any>;
  timeout?: number;       // Request timeout in ms (default: 30000)
  streaming?: boolean;     // Enable streaming (default: true)
}
```

**Returns:**
- `messages`: Array of chat messages
- `isLoading`: Loading state
- `isStreaming`: Streaming state
- `error`: Error message or null
- `stats`: Statistics object
- `state`: Computed state object
- `updateConfig()`: Update configuration
- `sendMessage()`: Send message (non-streaming)
- `streamMessage()`: Send message with streaming
- `testConnection()`: Test API connection
- `clearMessages()`: Clear all messages
- `resetStats()`: Reset statistics

### Components

#### `ChatContainer`

Main chat container component.

**Props:**
- `messages`: Array of chat messages
- `isLoading`: Loading state
- `isStreaming`: Streaming state
- `error`: Error message
- `customComponents`: Custom markdown components

**Events:**
- `submit`: Emitted when user submits a message

#### `ChatMessage`

Individual chat message component.

**Props:**
- `message`: Chat message object
- `customComponents`: Custom markdown components

#### `ChatInput`

Chat input component.

**Props:**
- `modelValue`: Input value
- `disabled`: Disabled state
- `loading`: Loading state
- `placeholder`: Placeholder text

**Events:**
- `update:modelValue`: Value update
- `submit`: Message submit

#### `ChatbotStats`

Statistics display component.

**Props:**
- `stats`: Statistics object

**Events:**
- `reset`: Reset statistics

## Custom Markdown Components

You can provide custom components for markdown rendering:

```vue
<script setup>
import { ref } from 'vue';

const customComponents = {
  // Custom code block component
  CodeBlock: {
    props: ['language', 'code'],
    template: '<pre><code :class="`language-${language}`">{{ code }}</code></pre>'
  },
  // Custom link component
  a: {
    props: ['href', 'children'],
    template: '<a :href="href" target="_blank" rel="noopener">{{ children }}</a>'
  }
};
</script>

<template>
  <ChatContainer :custom-components="customComponents" />
</template>
```

## Statistics

The package tracks comprehensive statistics:

- Messages sent/received
- Tokens sent/received (estimated)
- Average response time
- Last response time
- Error count
- Streaming status and position

## License

MIT

