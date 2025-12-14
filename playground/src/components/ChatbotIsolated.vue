<template>
  <div class="chatbot-isolated-wrapper">
    <slot />
  </div>
</template>

<script setup lang="ts">
// CSS isolation wrapper for chatbot components
// Prevents style conflicts with PrimeVue, Tailwind, etc.
// Chatbot styles are loaded globally, but this wrapper prevents
// parent styles from interfering with the chatbot
</script>

<style scoped>
/* Isolated wrapper using CSS containment */
.chatbot-isolated-wrapper {
  /* CSS Containment - completely isolate this container */
  contain: layout style paint;
  
  /* Create new stacking context */
  isolation: isolate;
  
  /* Reset inherited styles */
  all: initial;
  
  /* Restore essential properties */
  display: block;
  position: relative;
  width: 100%;
  height: 100%;
  
  /* High z-index for bubble mode */
  z-index: 1000;
  
  /* Reset font/color to defaults */
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 16px;
  line-height: 1.5;
  color: #000;
  background: transparent;
}
</style>

<style>
/* Global styles scoped to chatbot wrapper only */
/* These prevent parent styles (PrimeVue, Tailwind) from affecting the chatbot */

.chatbot-isolated-wrapper :deep(*) {
  /* Reset box-sizing */
  box-sizing: border-box;
}

/* Reset PrimeVue component styles inside chatbot */
.chatbot-isolated-wrapper :deep(.p-component),
.chatbot-isolated-wrapper :deep(.p-button),
.chatbot-isolated-wrapper :deep(.p-inputtext),
.chatbot-isolated-wrapper :deep(.p-dialog),
.chatbot-isolated-wrapper :deep(.p-toast),
.chatbot-isolated-wrapper :deep(.p-card) {
  all: revert !important;
  box-sizing: border-box;
}

/* The CSS containment and isolation should prevent most style conflicts */
/* Chatbot's own classes will work normally within the wrapper */
</style>
