import { createRouter, createWebHistory } from 'vue-router';
import VariantsEditor from '../views/VariantsEditor.vue';
import SessionSimulator from '../views/SessionSimulator.vue';
import FlowSimulator from '../views/FlowSimulator.vue';
import RulesSimulator from '../views/RulesSimulator.vue';
import DemoView from '../views/DemoView.vue';
import ChatbotSimulator from '../views/ChatbotSimulator.vue';
import ChatbotSimulatorV2 from '../views/ChatbotSimulatorV2.vue';
import SemanticLayoutView from '../views/SemanticLayoutView.vue';

const routes = [
  {
    path: '/',
    name: 'demo',
    component: DemoView,
    meta: { title: 'Amit Platform Demo - E2E Showcase' }
  },
  {
    path: '/variants',
    name: 'variants',
    component: VariantsEditor,
    meta: { title: 'Variants Editor' }
  },
  {
    path: '/variants-editor',
    redirect: '/variants'
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
  },
  {
    path: '/chatbot',
    name: 'chatbot',
    component: ChatbotSimulator,
    meta: { title: 'Chatbot Simulator' }
  },
  {
    path: '/chatbot-v2',
    name: 'chatbot-v2',
    component: ChatbotSimulatorV2,
    meta: { title: 'Chatbot Simulator V2' }
  },
  {
    path: '/semantic-layout',
    name: 'semantic-layout',
    component: SemanticLayoutView,
    meta: { title: 'Semantic Layout' }
  }
];

export const router = createRouter({
  history: createWebHistory(),
  routes
});

