import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { router } from './router';
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import Tooltip from 'primevue/tooltip';
import { initTelemetry } from '@amit/telemetry/vue';
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

// Initialize telemetry
initTelemetry({
  workerPath: new URL('./workers/telemetry-worker.js', import.meta.url),
  queueConfig: {
    batchSize: 50,
    flushInterval: 5000,
    maxQueueSize: 1000,
  },
}).then(() => {
  console.log('Telemetry initialized');
}).catch(err => {
  console.error('Failed to initialize telemetry:', err);
});

app.mount('#app');
