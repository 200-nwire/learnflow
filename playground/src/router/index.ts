import { createRouter, createWebHistory } from 'vue-router';
import SessionSimulator from '../views/SessionSimulator.vue';
import FlowSimulator from '../views/FlowSimulator.vue';

const routes = [
  {
    path: '/',
    name: 'session',
    component: SessionSimulator,
    meta: { title: 'Session Simulator' }
  },
  {
    path: '/flow',
    name: 'flow',
    component: FlowSimulator,
    meta: { title: 'Flow Simulator' }
  }
];

export const router = createRouter({
  history: createWebHistory(),
  routes
});

