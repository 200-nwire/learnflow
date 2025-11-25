<!-- DemoView.vue - Main demo hub with navigation -->
<template>
  <div class="demo-view">
    <header class="demo-header">
      <div class="demo-logo">
        <img src="https://amit.lemida.org/logo/logo_mini.svg" alt="Amit" />
        <h1>Amit Platform Demo</h1>
      </div>
      
      <nav class="demo-nav">
        <button
          v-for="view in views"
          :key="view.id"
          @click="currentView = view.id"
          :class="['nav-button', { active: currentView === view.id }]"
        >
          <component :is="view.icon" class="icon" />
          {{ view.label }}
        </button>
      </nav>
      
      <div class="demo-persona">
        <select v-model="currentPersona" class="persona-select">
          <option value="teacher">👨‍🏫 Teacher</option>
          <option value="student">👨‍🎓 Student</option>
          <option value="admin">👨‍💼 Admin</option>
        </select>
        
        <div class="demo-menu">
          <select @change="navigateTo" class="menu-select">
            <option value="">More Demos...</option>
            <option value="/variants">Variants Editor</option>
            <option value="/session">Session Simulator</option>
            <option value="/flow">Flow Simulator</option>
            <option value="/rules">Rules Builder</option>
          </select>
        </div>
      </div>
    </header>
    
    <main class="demo-content">
      <Transition name="fade" mode="out-in">
        <component
          :is="currentViewComponent"
          :persona="currentPersona"
          @switch-view="handleSwitchView"
        />
      </Transition>
    </main>
    
    <footer class="demo-footer">
      <div class="demo-stats">
        <div class="stat">
          <span class="label">Flows Created:</span>
          <span class="value">{{ demoStats.flowsCreated }}</span>
        </div>
        <div class="stat">
          <span class="label">Variants Active:</span>
          <span class="value">{{ demoStats.variantsActive }}</span>
        </div>
        <div class="stat">
          <span class="label">Students Engaged:</span>
          <span class="value">{{ demoStats.studentsEngaged }}</span>
        </div>
        <div class="stat">
          <span class="label">Avg Success Rate:</span>
          <span class="value">{{ (demoStats.avgSuccessRate * 100).toFixed(1) }}%</span>
        </div>
      </div>
      
      <div class="demo-actions">
        <button @click="resetDemo" class="btn-secondary">
          <ArrowPathIcon /> Reset Demo
        </button>
        <button @click="exportDemo" class="btn-primary">
          <ArrowDownTrayIcon /> Export Data
        </button>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import FlowBuilderDemo from './demo/FlowBuilderDemo.vue';
import ContentPlayerDemo from './demo/ContentPlayerDemo.vue';
import InsightsDemo from './demo/InsightsDemo.vue';
import { useDemoStore } from '@/stores/demoStore';
import {
  Squares2X2Icon,
  PlayIcon,
  ChartBarIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon
} from '@heroicons/vue/24/outline';

const router = useRouter();
const demoStore = useDemoStore();

const currentView = ref<'builder' | 'player' | 'insights'>('builder');
const currentPersona = ref<'teacher' | 'student' | 'admin'>('teacher');

const views = [
  { id: 'builder', label: 'Builder', icon: Squares2X2Icon },
  { id: 'player', label: 'Player', icon: PlayIcon },
  { id: 'insights', label: 'Insights', icon: ChartBarIcon }
];

const currentViewComponent = computed(() => {
  switch (currentView.value) {
    case 'builder':
      return FlowBuilderDemo;
    case 'player':
      return ContentPlayerDemo;
    case 'insights':
      return InsightsDemo;
    default:
      return FlowBuilderDemo;
  }
});

const demoStats = computed(() => demoStore.stats);

onMounted(() => {
  demoStore.initialize();
});

function resetDemo() {
  if (confirm('Reset all demo data?')) {
    demoStore.reset();
  }
}

function handleSwitchView(view: string) {
  currentView.value = view as any;
}

function navigateTo(event: Event) {
  const path = (event.target as HTMLSelectElement).value;
  if (path) {
    router.push(path);
    // Reset select
    (event.target as HTMLSelectElement).value = '';
  }
}

function exportDemo() {
  const data = demoStore.exportData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `amit-demo-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
</script>

<style scoped>
.demo-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f9fafb;
}

.demo-header {
  display: flex;
  align-items: center;
  padding: 1rem 2rem;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  gap: 2rem;
}

.demo-logo {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.demo-logo img {
  width: 40px;
  height: 40px;
}

.demo-logo h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.demo-nav {
  flex: 1;
  display: flex;
  gap: 0.5rem;
}

.nav-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 1rem;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-button:hover {
  background: #f3f4f6;
  color: #111827;
}

.nav-button.active {
  background: #3b82f6;
  color: white;
}

.nav-button .icon {
  width: 20px;
  height: 20px;
}

.demo-persona {
  display: flex;
  gap: 1rem;
}

.persona-select,
.menu-select {
  padding: 0.75rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  cursor: pointer;
}

.menu-select {
  min-width: 180px;
}

.demo-content {
  flex: 1;
  overflow: hidden;
}

.demo-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background: white;
  border-top: 1px solid #e5e7eb;
}

.demo-stats {
  display: flex;
  gap: 2rem;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat .label {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat .value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
}

.demo-actions {
  display: flex;
  gap: 1rem;
}

.btn-secondary,
.btn-primary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

