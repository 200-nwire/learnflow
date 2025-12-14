# Chatbot Components Usage Guide

## Overview

Two reusable components have been created to simplify chatbot integration:

1. **`ChatbotBubble.vue`** - Floating bubble chat widget
2. **`ChatbotEmbedded.vue`** - Embedded inline chat interface

---

## ChatbotBubble Component

### Basic Usage

```vue
<template>
  <ChatbotBubble
    bot-id="ab20803f-812c-4a35-9afd-2ea734f6f953"
  />
</template>

<script setup>
import ChatbotBubble from '@/components/ChatbotBubble.vue';
</script>
```

### With All Props

```vue
<template>
  <ChatbotBubble
    :bot-id="botId"
    :api-url="apiUrl"
    :course-id="courseId"
    :lesson-id="lessonId"
    :page-id="pageId"
    position="bottom-right"
    size="large"
    :chat-width="360"
    :chat-height="650"
    v-model="isChatOpen"
    @open="handleChatOpen"
    @close="handleChatClose"
  />
</template>

<script setup>
import { ref } from 'vue';
import ChatbotBubble from '@/components/ChatbotBubble.vue';

const botId = ref('ab20803f-812c-4a35-9afd-2ea734f6f953');
const apiUrl = ref('https://botgen-dev-105584895737.me-west1.run.app');
const courseId = ref('course-123');
const lessonId = ref('lesson-456');
const pageId = ref('page-789');
const isChatOpen = ref(false);

const handleChatOpen = () => {
  console.log('Chat opened');
};

const handleChatClose = () => {
  console.log('Chat closed');
};
</script>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `botId` | `string` | **required** | Bot ID to use for the chat |
| `apiUrl` | `string` | `env.VITE_API_URL` or default | API base URL |
| `courseId` | `string` | `undefined` | Course ID for LMS context |
| `lessonId` | `string` | `undefined` | Lesson ID for LMS context |
| `pageId` | `string` | `undefined` | Page ID for LMS context |
| `position` | `'bottom-left' \| 'bottom-right'` | `'bottom-right'` | Bubble position on screen |
| `size` | `'small' \| 'medium' \| 'large'` | `'large'` | Bubble size |
| `chatWidth` | `number` | `360` | Chat window width in pixels |
| `chatHeight` | `number` | `650` | Chat window height in pixels |
| `getAuth` | `() => { jwt: string }` | `undefined` | Custom auth function (uses plugin default if not provided) |
| `modelValue` | `boolean` | `false` | Initial open state (v-model) |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:modelValue` | `boolean` | Emitted when chat open state changes (v-model) |
| `open` | - | Emitted when chat is opened |
| `close` | - | Emitted when chat is closed |

### Features

- ✅ Automatic backdrop overlay when open
- ✅ Proper z-index layering
- ✅ Handles bot switching automatically (via key prop)
- ✅ Uses plugin defaults for API URL and auth if not provided
- ✅ Responsive positioning
- ✅ Clean state management

---

## ChatbotEmbedded Component

### Basic Usage

```vue
<template>
  <ChatbotEmbedded
    bot-id="ab20803f-812c-4a35-9afd-2ea734f6f953"
  />
</template>

<script setup>
import ChatbotEmbedded from '@/components/ChatbotEmbedded.vue';
</script>
```

### With All Props

```vue
<template>
  <div class="chat-container">
    <h2>Course Content</h2>
    <p>Some content here...</p>
    
    <ChatbotEmbedded
      :bot-id="botId"
      :api-url="apiUrl"
      :course-id="courseId"
      :lesson-id="lessonId"
      :page-id="pageId"
      height="600px"
      :get-auth="customAuth"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import ChatbotEmbedded from '@/components/ChatbotEmbedded.vue';

const botId = ref('ab20803f-812c-4a35-9afd-2ea734f6f953');
const apiUrl = ref('https://botgen-dev-105584895737.me-west1.run.app');
const courseId = ref('course-123');
const lessonId = ref('lesson-456');
const pageId = ref('page-789');

const customAuth = () => {
  // Custom auth logic
  return { jwt: 'your-token-here' };
};
</script>

<style scoped>
.chat-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}
</style>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `botId` | `string` | **required** | Bot ID to use for the chat |
| `apiUrl` | `string` | `env.VITE_API_URL` or default | API base URL |
| `courseId` | `string` | `undefined` | Course ID for LMS context |
| `lessonId` | `string` | `undefined` | Lesson ID for LMS context |
| `pageId` | `string` | `undefined` | Page ID for LMS context |
| `height` | `string` | `'600px'` | Container height |
| `getAuth` | `() => { jwt: string }` | `undefined` | Custom auth function (uses plugin default if not provided) |

### Features

- ✅ Proper avatar visibility and sizing
- ✅ Handles bot switching automatically (via key prop)
- ✅ Uses plugin defaults for API URL and auth if not provided
- ✅ Isolated styles to prevent conflicts
- ✅ Responsive container

---

## Examples

### Example 1: Simple Bubble Chat

```vue
<template>
  <div>
    <h1>My Page</h1>
    <p>Content here...</p>
    
    <!-- Floating bubble - just add this! -->
    <ChatbotBubble bot-id="ab20803f-812c-4a35-9afd-2ea734f6f953" />
  </div>
</template>

<script setup>
import ChatbotBubble from '@/components/ChatbotBubble.vue';
</script>
```

### Example 2: Embedded Chat in Course Page

```vue
<template>
  <div class="course-page">
    <div class="content">
      <h1>{{ lesson.title }}</h1>
      <div v-html="lesson.content"></div>
    </div>
    
    <div class="sidebar">
      <ChatbotEmbedded
        :bot-id="currentBotId"
        :course-id="courseId"
        :lesson-id="lessonId"
        :page-id="pageId"
        height="700px"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import ChatbotEmbedded from '@/components/ChatbotEmbedded.vue';

const props = defineProps({
  courseId: String,
  lessonId: String,
  pageId: String,
  currentBotId: String,
});
</script>
```

### Example 3: Controlled Bubble State

```vue
<template>
  <div>
    <button @click="openChat">Open Chat</button>
    <button @click="closeChat">Close Chat</button>
    
    <ChatbotBubble
      bot-id="ab20803f-812c-4a35-9afd-2ea734f6f953"
      v-model="isOpen"
      @open="onOpen"
      @close="onClose"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import ChatbotBubble from '@/components/ChatbotBubble.vue';

const isOpen = ref(false);

const openChat = () => {
  isOpen.value = true;
};

const closeChat = () => {
  isOpen.value = false;
};

const onOpen = () => {
  console.log('User opened chat');
};

const onClose = () => {
  console.log('User closed chat');
};
</script>
```

### Example 4: Custom Positioning

```vue
<template>
  <!-- Bottom left instead of bottom right -->
  <ChatbotBubble
    bot-id="ab20803f-812c-4a35-9afd-2ea734f6f953"
    position="bottom-left"
    size="medium"
    :chat-width="400"
    :chat-height="700"
  />
</template>

<script setup>
import ChatbotBubble from '@/components/ChatbotBubble.vue';
</script>
```

**Note**: Only `bottom-left` and `bottom-right` positions are supported by the ChatBubble component.

---

## Integration Checklist

- [x] ✅ Global plugin configured in `main.ts`
- [x] ✅ Vite config handles TalkingHead module
- [x] ✅ HTML preload for TalkingHead
- [x] ✅ Environment variables set (optional)
- [x] ✅ Components handle all edge cases
- [x] ✅ Proper TypeScript types
- [x] ✅ Auto bot switching on prop change

---

## Notes

1. **Bot Switching**: Both components automatically handle bot changes via the `:key` prop - just change the `bot-id` prop and the component will remount.

2. **Authentication**: If you don't provide `getAuth`, the component will:
   - Use the plugin's default `getAuth` from `main.ts`
   - Or fallback to reading from `localStorage.getItem('chatbot_jwt_token')`

3. **API URL**: If you don't provide `apiUrl`, the component will:
   - Use `import.meta.env.VITE_API_URL` if set
   - Or fallback to the default dev URL

4. **Styling**: Both components handle style isolation automatically - no need to worry about CSS conflicts.

5. **No Setup Required**: Just import and use - all the complex setup (ChatBubble wrapper, overlay, state management) is handled internally.

