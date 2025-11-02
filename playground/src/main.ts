import { createApp } from 'vue';
import App from './App.vue';
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import 'primevue/resources/themes/lara-light-blue/theme.css';
import 'primeicons/primeicons.css';
import './style.css';

const app = createApp(App);
app.use(PrimeVue);
app.use(ToastService);
app.mount('#app');
