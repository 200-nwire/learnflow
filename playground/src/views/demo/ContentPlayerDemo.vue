<!-- ContentPlayerDemo.vue - Student content player -->
<template>
  <div class="content-player-demo">
    <!-- Student Header -->
    <div class="player-header">
      <div class="student-info">
        <div class="avatar">
          {{ studentProfile.name.charAt(0) }}
        </div>
        <div class="info">
          <h3>{{ studentProfile.name }}</h3>
          <p>Algebra Mastery: {{ (studentProfile.mastery.algebra * 100).toFixed(0) }}%</p>
        </div>
      </div>
      
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
      </div>
      
      <div class="lesson-title">
        <h2>{{ currentFlow?.title }}</h2>
        <span class="step">Step {{ currentStepIndex + 1 }} of {{ flowSteps.length }}</span>
      </div>
    </div>
    
    <!-- Content Area -->
    <div class="player-content">
      <div v-if="currentStep" class="content-container">
        <!-- Current Content -->
        <div class="content-card">
          <div class="content-header">
            <h3>{{ currentSlot?.name }}</h3>
            <span class="content-badge">{{ currentVariant?.content_type }}</span>
          </div>
          
          <div class="content-body">
            <!-- Text Content -->
            <div v-if="currentVariant?.content_type === 'text'" class="text-content">
              <div v-html="renderMarkdown(currentVariant.content.body)"></div>
            </div>
            
            <!-- Video Content -->
            <div v-else-if="currentVariant?.content_type === 'video'" class="video-content">
              <div class="video-placeholder">
                <PlayCircleIcon class="play-icon" />
                <p>{{ currentVariant.title }}</p>
                <span>Duration: {{ Math.floor(currentVariant.content.duration / 60) }} minutes</span>
              </div>
            </div>
            
            <!-- Interactive Content -->
            <div v-else-if="currentVariant?.content_type === 'interactive'" class="interactive-content">
              <div v-if="currentVariant.content.type === 'exercise'" class="exercise-content">
                <div
                  v-for="(problem, index) in currentVariant.content.problems"
                  :key="index"
                  class="problem"
                >
                  <h4>Problem {{ index + 1 }}</h4>
                  <p class="question">{{ problem.question }}</p>
                  <input
                    v-model="answers[index]"
                    type="text"
                    class="answer-input"
                    placeholder="Your answer"
                    @keyup.enter="checkAnswer(index, problem.answer)"
                  />
                  <div v-if="answerResults[index] !== undefined" class="answer-feedback">
                    <div v-if="answerResults[index]" class="feedback-correct">
                      <CheckCircleIcon class="icon" />
                      Correct! Great job!
                    </div>
                    <div v-else class="feedback-incorrect">
                      <XCircleIcon class="icon" />
                      Not quite. Hint: {{ problem.hint }}
                    </div>
                  </div>
                </div>
              </div>
              
              <div v-else-if="currentVariant.content.type === 'quiz'" class="quiz-content">
                <div
                  v-for="(question, index) in currentVariant.content.questions"
                  :key="index"
                  class="quiz-question"
                >
                  <h4>Question {{ index + 1 }}</h4>
                  <p class="question">{{ question.question }}</p>
                  <div class="options">
                    <label
                      v-for="(option, optIndex) in question.options"
                      :key="optIndex"
                      class="option"
                    >
                      <input
                        type="radio"
                        :name="`question-${index}`"
                        :value="optIndex"
                        v-model="quizAnswers[index]"
                      />
                      <span>{{ option }}</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div v-else class="interactive-placeholder">
                <SparklesIcon class="sparkle-icon" />
                <p>{{ currentVariant.title }}</p>
                <p class="component-name">{{ currentVariant.content.component }}</p>
              </div>
            </div>
          </div>
          
          <!-- Content Actions -->
          <div class="content-actions">
            <button v-if="!contentCompleted" @click="completeContent" class="btn-primary">
              {{ getActionButtonText() }}
            </button>
            <button v-else @click="nextStep" class="btn-primary">
              Continue →
            </button>
            
            <div class="content-metadata">
              <span>Estimated time: {{ currentVariant?.avg_time }}s</span>
              <span>Difficulty: {{ currentVariant?.difficulty_level }}/10</span>
            </div>
          </div>
        </div>
        
        <!-- Sidebar: Learning Path Visualization -->
        <div class="learning-path">
          <h4>Your Learning Path</h4>
          
          <div class="path-steps">
            <div
              v-for="(step, index) in flowSteps"
              :key="step.id"
              class="path-step"
              :class="{
                current: index === currentStepIndex,
                completed: index < currentStepIndex,
                locked: index > currentStepIndex
              }"
            >
              <div class="step-icon">
                <component
                  :is="getStepIcon(step.type)"
                  class="icon"
                />
              </div>
              <div class="step-info">
                <span class="step-label">{{ step.label }}</span>
                <span v-if="index < currentStepIndex" class="step-status">✓ Complete</span>
                <span v-else-if="index === currentStepIndex" class="step-status">In Progress</span>
              </div>
            </div>
          </div>
          
          <!-- Mastery Indicator -->
          <div class="mastery-indicator">
            <h5>Current Mastery</h5>
            <div class="mastery-bar">
              <div
                class="mastery-fill"
                :style="{ width: `${studentProfile.mastery.algebra * 100}%` }"
              ></div>
            </div>
            <span>{{ (studentProfile.mastery.algebra * 100).toFixed(0) }}% Algebra</span>
          </div>
        </div>
      </div>
      
      <!-- Completion Screen -->
      <div v-else-if="flowCompleted" class="completion-screen">
        <div class="completion-card">
          <CheckCircleIcon class="completion-icon" />
          <h2>Lesson Complete!</h2>
          <p>Great work! You've completed the lesson.</p>
          
          <div class="completion-stats">
            <div class="stat">
              <span class="value">{{ completedSteps }}</span>
              <span class="label">Steps Completed</span>
            </div>
            <div class="stat">
              <span class="value">{{ totalTimeSpent }}s</span>
              <span class="label">Time Spent</span>
            </div>
            <div class="stat">
              <span class="value">{{ (averageScore * 100).toFixed(0) }}%</span>
              <span class="label">Average Score</span>
            </div>
          </div>
          
          <div class="mastery-gain">
            <h3>Mastery Gained</h3>
            <div class="mastery-change">
              <span>{{ (masteryBefore * 100).toFixed(0) }}%</span>
              <ArrowRightIcon class="arrow" />
              <span class="new-mastery">{{ (studentProfile.mastery.algebra * 100).toFixed(0) }}%</span>
            </div>
            <div class="gain-amount">+{{ ((studentProfile.mastery.algebra - masteryBefore) * 100).toFixed(1) }}%</div>
          </div>
          
          <button @click="restart" class="btn-primary">
            <ArrowPathIcon class="icon" /> Try Again
          </button>
          <button @click="viewInsights" class="btn-secondary">
            <ChartBarIcon class="icon" /> View Insights
          </button>
        </div>
      </div>
    </div>
    
    <!-- Timer & Session Info -->
    <div class="session-info">
      <div class="timer">
        <ClockIcon class="icon" />
        Session: {{ sessionTime }}
      </div>
      <div class="items-completed">
        Items today: {{ studentProfile.items_completed_today }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { marked } from 'marked';
import { useDemoStore } from '@/stores/demoStore';
import type { Variant, Slot } from '@/stores/demoStore';
import {
  PlayCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  SparklesIcon,
  ClockIcon,
  ChartBarIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  BookOpenIcon,
  PuzzlePieceIcon,
  QuestionMarkCircleIcon,
  LightBulbIcon
} from '@heroicons/vue/24/outline';

const emit = defineEmits(['switch-view']);
const demoStore = useDemoStore();

const currentFlow = computed(() => demoStore.flows[0]);
const studentProfile = computed(() => demoStore.studentProfile);

const currentStepIndex = ref(0);
const currentVariant = ref<Variant | null>(null);
const currentSlot = ref<Slot | null>(null);
const contentCompleted = ref(false);
const flowCompleted = ref(false);
const sessionStartTime = ref(Date.now());
const sessionTime = ref('0:00');
const answers = ref<Record<number, string>>({});
const answerResults = ref<Record<number, boolean>>({});
const quizAnswers = ref<Record<number, number>>({});
const completedSteps = ref(0);
const totalTimeSpent = ref(0);
const averageScore = ref(0);
const masteryBefore = ref(0);

const flowSteps = computed(() => {
  if (!currentFlow.value) return [];
  return currentFlow.value.nodes.filter(n => n.type !== 'start' && n.type !== 'end');
});

const currentStep = computed(() => {
  return flowSteps.value[currentStepIndex.value];
});

const progress = computed(() => {
  if (flowSteps.value.length === 0) return 0;
  return (currentStepIndex.value / flowSteps.value.length) * 100;
});

let sessionTimer: number;

onMounted(() => {
  masteryBefore.value = studentProfile.value.mastery.algebra;
  loadCurrentStep();
  
  // Start session timer
  sessionTimer = window.setInterval(() => {
    const elapsed = Math.floor((Date.now() - sessionStartTime.value) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    sessionTime.value = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, 1000);
});

onUnmounted(() => {
  if (sessionTimer) {
    clearInterval(sessionTimer);
  }
});

function loadCurrentStep() {
  if (!currentStep.value) {
    flowCompleted.value = true;
    return;
  }
  
  contentCompleted.value = false;
  answers.value = {};
  answerResults.value = {};
  quizAnswers.value = {};
  
  // If it's a slot, select a variant
  if (currentStep.value.type === 'slot' && currentStep.value.data.slot_id) {
    try {
      currentSlot.value = demoStore.slots.find(s => s.id === currentStep.value.data.slot_id) || null;
      currentVariant.value = demoStore.selectVariant(currentStep.value.data.slot_id);
    } catch (error) {
      console.error('Failed to select variant:', error);
    }
  }
}

function getActionButtonText(): string {
  if (!currentVariant.value) return 'Continue';
  
  switch (currentVariant.value.content_type) {
    case 'text':
      return 'I Understand';
    case 'video':
      return 'Watched Video';
    case 'interactive':
      if (currentVariant.value.content.type === 'exercise') {
        return 'Check Answers';
      }
      if (currentVariant.value.content.type === 'quiz') {
        return 'Submit Quiz';
      }
      return 'Complete';
    default:
      return 'Continue';
  }
}

function completeContent() {
  if (!currentVariant.value || !currentSlot.value) return;
  
  let success = true;
  let score = 1.0;
  const startTime = Date.now();
  
  // Evaluate based on content type
  if (currentVariant.value.content_type === 'interactive') {
    if (currentVariant.value.content.type === 'exercise') {
      // Check exercise answers
      const problems = currentVariant.value.content.problems;
      let correct = 0;
      
      problems.forEach((problem: any, index: number) => {
        const isCorrect = answers.value[index]?.toString() === problem.answer.toString();
        answerResults.value[index] = isCorrect;
        if (isCorrect) correct++;
      });
      
      success = correct > 0;
      score = correct / problems.length;
      
      if (score < 1.0) {
        // Don't move on yet if not all correct
        return;
      }
    } else if (currentVariant.value.content.type === 'quiz') {
      // Check quiz answers
      const questions = currentVariant.value.content.questions;
      let correct = 0;
      
      questions.forEach((question: any, index: number) => {
        if (quizAnswers.value[index] === question.correct) {
          correct++;
        }
      });
      
      success = correct > 0;
      score = correct / questions.length;
    }
  }
  
  // Simulate time spent
  const timeSpent = Math.floor(Math.random() * 60) + currentVariant.value.avg_time;
  
  // Record outcome
  demoStore.recordOutcome(
    currentSlot.value.id,
    currentVariant.value.id,
    success,
    timeSpent,
    score
  );
  
  totalTimeSpent.value += timeSpent;
  averageScore.value = (averageScore.value * completedSteps.value + score) / (completedSteps.value + 1);
  completedSteps.value++;
  
  contentCompleted.value = true;
}

function checkAnswer(index: number, correctAnswer: string) {
  const userAnswer = answers.value[index];
  answerResults.value[index] = userAnswer?.toString() === correctAnswer.toString();
}

function nextStep() {
  currentStepIndex.value++;
  if (currentStepIndex.value >= flowSteps.value.length) {
    flowCompleted.value = true;
  } else {
    loadCurrentStep();
  }
}

function restart() {
  currentStepIndex.value = 0;
  flowCompleted.value = false;
  completedSteps.value = 0;
  totalTimeSpent.value = 0;
  averageScore.value = 0;
  masteryBefore.value = studentProfile.value.mastery.algebra;
  sessionStartTime.value = Date.now();
  loadCurrentStep();
}

function viewInsights() {
  emit('switch-view', 'insights');
}

function getStepIcon(type: string) {
  switch (type) {
    case 'lesson': return BookOpenIcon;
    case 'slot': return PuzzlePieceIcon;
    case 'assessment': return QuestionMarkCircleIcon;
    default: return PuzzlePieceIcon;
  }
}

function renderMarkdown(markdown: string): string {
  return marked(markdown);
}
</script>

<style scoped>
.content-player-demo {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f9fafb;
}

.player-header {
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 1.5rem 2rem;
  background: white;
  border-bottom: 1px solid #e5e7eb;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #3b82f6;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 600;
}

.info h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.info p {
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  transition: width 0.3s;
}

.lesson-title h2 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.step {
  font-size: 0.875rem;
  color: #6b7280;
}

.player-content {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
}

.content-container {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.content-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 2rem;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.content-header h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.content-badge {
  padding: 0.25rem 0.75rem;
  background: #e0e7ff;
  color: #3730a3;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.content-body {
  min-height: 300px;
  margin-bottom: 2rem;
}

.text-content {
  font-size: 1rem;
  line-height: 1.75;
}

.text-content :deep(h1) {
  font-size: 1.5rem;
  margin-top: 2rem;
  margin-bottom: 1rem;
}

.text-content :deep(code) {
  background: #f3f4f6;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-family: 'Monaco', monospace;
}

.video-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  background: #f3f4f6;
  border-radius: 8px;
}

.play-icon {
  width: 80px;
  height: 80px;
  color: #3b82f6;
  margin-bottom: 1rem;
}

.problem {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 8px;
}

.problem h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
}

.question {
  font-size: 1.125rem;
  margin: 0 0 1rem 0;
}

.answer-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
}

.answer-feedback {
  margin-top: 1rem;
}

.feedback-correct,
.feedback-incorrect {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 6px;
}

.feedback-correct {
  background: #d1fae5;
  color: #065f46;
}

.feedback-incorrect {
  background: #fee2e2;
  color: #991b1b;
}

.feedback-correct .icon,
.feedback-incorrect .icon {
  width: 20px;
  height: 20px;
}

.quiz-question {
  margin-bottom: 2rem;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
}

.option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.option:hover {
  background: #f3f4f6;
  border-color: #3b82f6;
}

.interactive-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  background: #fef3c7;
  border: 2px dashed #fbbf24;
  border-radius: 8px;
}

.sparkle-icon {
  width: 60px;
  height: 60px;
  color: #f59e0b;
  margin-bottom: 1rem;
}

.component-name {
  font-family: 'Monaco', monospace;
  color: #92400e;
}

.content-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.content-metadata {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: #6b7280;
}

.learning-path {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

.learning-path h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
}

.path-steps {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 2rem;
}

.path-step {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 8px;
  transition: all 0.2s;
}

.path-step.current {
  background: #eff6ff;
  border: 2px solid #3b82f6;
}

.path-step.completed {
  opacity: 0.6;
}

.path-step.locked {
  opacity: 0.4;
}

.step-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border-radius: 6px;
}

.step-icon .icon {
  width: 18px;
  height: 18px;
}

.step-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.step-label {
  font-weight: 500;
  font-size: 0.875rem;
}

.step-status {
  font-size: 0.75rem;
  color: #6b7280;
}

.mastery-indicator {
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
}

.mastery-indicator h5 {
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  font-weight: 600;
}

.mastery-bar {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.mastery-fill {
  height: 100%;
  background: #10b981;
  transition: width 0.3s;
}

.completion-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 500px;
}

.completion-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 3rem;
  text-align: center;
  max-width: 600px;
}

.completion-icon {
  width: 80px;
  height: 80px;
  color: #10b981;
  margin: 0 auto 1.5rem;
}

.completion-card h2 {
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  font-weight: 700;
}

.completion-card > p {
  margin: 0 0 2rem 0;
  color: #6b7280;
}

.completion-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  margin-bottom: 2rem;
  padding: 2rem;
  background: #f9fafb;
  border-radius: 8px;
}

.completion-stats .stat {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.completion-stats .value {
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
}

.completion-stats .label {
  font-size: 0.875rem;
  color: #6b7280;
}

.mastery-gain {
  margin: 2rem 0;
  padding: 1.5rem;
  background: #d1fae5;
  border-radius: 8px;
}

.mastery-gain h3 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
}

.mastery-change {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.arrow {
  width: 24px;
  height: 24px;
  color: #10b981;
}

.new-mastery {
  color: #059669;
}

.gain-amount {
  font-size: 1.125rem;
  color: #059669;
  font-weight: 700;
}

.session-info {
  display: flex;
  justify-content: space-between;
  padding: 1rem 2rem;
  background: white;
  border-top: 1px solid #e5e7eb;
  font-size: 0.875rem;
  color: #6b7280;
}

.timer,
.items-completed {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.timer .icon {
  width: 16px;
  height: 16px;
}

.btn-primary,
.btn-secondary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  margin-top: 1rem;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.icon {
  width: 18px;
  height: 18px;
}
</style>

