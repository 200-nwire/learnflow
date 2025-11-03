import { createRouter, createWebHistory } from 'vue-router';
import VariantsEditor from '../views/VariantsEditor.vue';
import SessionSimulator from '../views/SessionSimulator.vue';
import FlowSimulator from '../views/FlowSimulator.vue';
import RulesSimulator from '../views/RulesSimulator.vue';

const routes = [
  {
    path: '/',
    name: 'variants',
    component: VariantsEditor,
    meta: { title: 'Variants Editor' }
  },
  {
    path: '/session',
    name: 'session',
    component: SessionSimulator,
    meta: { title: 'Session Simulator' }
  },
  {
    path: '/flow',
    name: 'flow',
    component: FlowSimulator,
    meta: { title: 'Flow Simulator' }
  },
  {
    path: '/rules',
    name: 'rules',
    component: RulesSimulator,
    meta: { title: 'Rules Builder' }
  }
];

export const router = createRouter({
  history: createWebHistory(),
  routes
});

