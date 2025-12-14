import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { router } from './router';
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import Tooltip from 'primevue/tooltip';
// Telemetry is now handled by @amit/player-signals internally
import { AmitChatPlugin } from '@amit-org-il/chat-vue';
// Chatbot styles are imported in ChatbotSimulatorV2.vue for scoping
import 'primevue/resources/themes/lara-light-blue/theme.css';
import 'primeicons/primeicons.css';
import './style.css';

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.use(PrimeVue);
app.use(ToastService);
app.use(router);
app.directive('tooltip', Tooltip);

// Initialize Amit Chat Plugin
const getAuthToken = () => {
  // Get JWT from localStorage (can be set by ChatbotSimulatorV2 component)
  const token = localStorage.getItem('chatbot_jwt_token') || '';
  return { jwt: token };
};

app.use(AmitChatPlugin, {
  baseUrl: import.meta.env.VITE_API_URL || 'https://botgen-dev-105584895737.me-west1.run.app',
  clientType: 'lms',
  getAuth: getAuthToken,
});

// Telemetry/xAPI is now handled by @amit/player-signals worker internally

app.mount('#app');
