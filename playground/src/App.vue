<template>
  <div class="app-container">
    <!-- Top Bar with Navigation -->
    <div class="top-bar sticky top-0 z-50">
      <div class="flex items-center justify-between">
        <!-- Left: Logo & Title -->
        <div class="flex items-center gap-3">
          <i class="pi pi-graduation-cap text-3xl text-blue-600"></i>
          <div>
            <h1 class="text-2xl font-bold text-gray-800">Personalized Learning Simulator</h1>
            <p class="text-sm text-gray-600">Real-time adaptive content selection engine</p>
          </div>
        </div>

        <!-- Center: Navigation Tabs -->
        <div class="flex items-center gap-2">
          <Button 
            label="Session Simulator"
            icon="pi pi-sliders-h"
            :severity="$route.name === 'session' ? 'info' : 'secondary'"
            :text="$route.name !== 'session'"
            @click="$router.push('/')"
            class="nav-button"
          />
          <Button 
            label="Flow Simulator"
            icon="pi pi-sitemap"
            :severity="$route.name === 'flow' ? 'info' : 'secondary'"
            :text="$route.name !== 'flow'"
            @click="$router.push('/flow')"
            class="nav-button"
          />
        </div>

        <!-- Right: Actions -->
        <div class="flex items-center gap-2">
          <Button 
            icon="pi pi-cog" 
            label="Settings"
            @click="settingsVisible = true"
            outlined
            v-tooltip.left="'Configure session parameters'"
          />
        </div>
      </div>
    </div>

    <!-- Router View -->
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>

    <!-- Settings Drawer -->
    <SettingsDrawer 
      v-model:visible="settingsVisible"
      :session="session"
      @update:session="updateSession"
    />

    <!-- Toast for notifications -->
    <Toast />
  </div>
</template>

<script setup lang="ts">
import { ref, provide } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import Toast from 'primevue/toast';
import SettingsDrawer from './components/SettingsDrawer.vue';
import { createSnapshot, type SessionSnapshot } from '@amit/adaptivity';

const router = useRouter();
const route = useRoute();
const toast = useToast();

const settingsVisible = ref(false);
const session = ref<SessionSnapshot>(createSnapshot({
  ids: { 
    userId: 'student_001', 
    courseId: 'math_101', 
    lessonId: 'fractions', 
    pageId: 'page_1',
    attemptId: `attempt_${Date.now()}`,
  },
  user: { 
    lang: 'en',
    preferences: { 
      theme: { value: 'soccer', source: 'student' } 
    },
  },
  metrics: {
    accEWMA: 0.75,
    latencyEWMA: 2000,
    idleSec: 0,
    streak: 2,
    fatigue: 0.1,
    attempts: 5,
  },
}));

const updateSession = (newSession: SessionSnapshot) => {
  session.value = newSession;
  toast.add({
    severity: 'success',
    summary: 'Session Updated',
    detail: 'Settings applied successfully',
    life: 2000,
  });
};

// Provide settings visibility to child components
provide('settingsVisible', settingsVisible);
provide('session', session);
</script>

<style scoped>
.app-container {
  @apply min-h-screen bg-gray-100;
}

.top-bar {
  @apply bg-white shadow-md p-6 mb-6;
}

.nav-button {
  @apply transition-all;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
