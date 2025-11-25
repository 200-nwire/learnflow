<!-- InsightsDemo.vue - Analytics and insights dashboard -->
<template>
  <div class="insights-demo">
    <!-- Header -->
    <div class="insights-header">
      <h2>Analytics & Insights</h2>
      <div class="header-actions">
        <select v-model="timeRange" class="time-range-select">
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
          <option value="all">All Time</option>
        </select>
        <button @click="refreshData" class="btn-secondary">
          <ArrowPathIcon class="icon" /> Refresh
        </button>
      </div>
    </div>
    
    <!-- Summary Cards -->
    <div class="summary-cards">
      <div class="summary-card">
        <div class="card-icon" style="background: #dbeafe">
          <UsersIcon style="color: #3b82f6" />
        </div>
        <div class="card-content">
          <div class="card-value">{{ analytics.flowProgress.nodes_visited }}</div>
          <div class="card-label">Total Interactions</div>
        </div>
      </div>
      
      <div class="summary-card">
        <div class="card-icon" style="background: #d1fae5">
          <CheckCircleIcon style="color: #10b981" />
        </div>
        <div class="card-content">
          <div class="card-value">{{ (analytics.flowProgress.avg_success_rate * 100).toFixed(1) }}%</div>
          <div class="card-label">Success Rate</div>
        </div>
      </div>
      
      <div class="summary-card">
        <div class="card-icon" style="background: #fef3c7">
          <ClockIcon style="color: #f59e0b" />
        </div>
        <div class="card-content">
          <div class="card-value">{{ formatTime(analytics.flowProgress.total_time) }}</div>
          <div class="card-label">Total Learning Time</div>
        </div>
      </div>
      
      <div class="summary-card">
        <div class="card-icon" style="background: #e0e7ff">
          <SparklesIcon style="color: #8b5cf6" />
        </div>
        <div class="card-content">
          <div class="card-value">{{ demoStore.variants.length }}</div>
          <div class="card-label">Active Variants</div>
        </div>
      </div>
    </div>
    
    <!-- Main Content Area -->
    <div class="insights-content">
      <!-- Variant Performance Table -->
      <div class="insight-section">
        <h3>Variant Performance</h3>
        
        <div class="table-container">
          <table class="performance-table">
            <thead>
              <tr>
                <th>Variant</th>
                <th>Slot</th>
                <th>Type</th>
                <th>Impressions</th>
                <th>Completions</th>
                <th>Success Rate</th>
                <th>Avg Time</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="variant in sortedVariants"
                :key="variant.variant_id"
                class="table-row"
                @click="selectVariant(variant)"
              >
                <td class="variant-title">
                  <div class="title-cell">
                    <component :is="getContentIcon(variant)" class="content-icon" />
                    <span>{{ variant.title }}</span>
                  </div>
                </td>
                <td>{{ getSlotName(variant.slot_id) }}</td>
                <td>
                  <span class="type-badge">{{ variant.content_type }}</span>
                </td>
                <td>{{ variant.impressions }}</td>
                <td>{{ variant.completions }}</td>
                <td>
                  <div class="rate-cell">
                    <div
                      class="rate-bar"
                      :style="{
                        width: `${variant.success_rate * 100}%`,
                        background: getRateColor(variant.success_rate)
                      }"
                    ></div>
                    <span>{{ (variant.success_rate * 100).toFixed(1) }}%</span>
                  </div>
                </td>
                <td>{{ variant.avg_time }}s</td>
                <td>
                  <div class="score-indicator" :class="getScoreClass(variant.success_rate)">
                    {{ getScoreLabel(variant.success_rate) }}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Variant Comparison Chart -->
      <div class="insight-section">
        <h3>Variant Comparison</h3>
        
        <div class="chart-container">
          <div class="chart-bars">
            <div
              v-for="variant in analytics.variantPerformance.slice(0, 6)"
              :key="variant.variant_id"
              class="chart-bar-group"
            >
              <div class="bar-label">{{ variant.title }}</div>
              <div class="bars">
                <div class="bar-row">
                  <span class="metric-label">Success Rate</span>
                  <div class="bar-track">
                    <div
                      class="bar-fill success"
                      :style="{ width: `${variant.success_rate * 100}%` }"
                    ></div>
                  </div>
                  <span class="metric-value">{{ (variant.success_rate * 100).toFixed(0) }}%</span>
                </div>
                <div class="bar-row">
                  <span class="metric-label">Completion</span>
                  <div class="bar-track">
                    <div
                      class="bar-fill completion"
                      :style="{ width: `${variant.completion_rate * 100}%` }"
                    ></div>
                  </div>
                  <span class="metric-value">{{ (variant.completion_rate * 100).toFixed(0) }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Student Progress & Mastery -->
      <div class="insight-section">
        <h3>Student Profile & Mastery</h3>
        
        <div class="student-details">
          <div class="student-header">
            <div class="avatar-large">
              {{ analytics.studentProfile.name.charAt(0) }}
            </div>
            <div class="student-info">
              <h4>{{ analytics.studentProfile.name }}</h4>
              <p>ID: {{ analytics.studentProfile.id }}</p>
            </div>
          </div>
          
          <div class="mastery-breakdown">
            <h4>Subject Mastery</h4>
            <div
              v-for="(level, subject) in analytics.studentProfile.mastery"
              :key="subject"
              class="mastery-row"
            >
              <span class="subject-name">{{ capitalizeFirst(subject) }}</span>
              <div class="mastery-bar">
                <div
                  class="mastery-fill"
                  :style="{
                    width: `${level * 100}%`,
                    background: getMasteryColor(level)
                  }"
                ></div>
              </div>
              <span class="mastery-percent">{{ (level * 100).toFixed(0) }}%</span>
            </div>
          </div>
          
          <div class="learning-preferences">
            <h4>Learning Style Preferences</h4>
            <div class="preferences-tags">
              <span
                v-for="style in analytics.studentProfile.learning_style"
                :key="style"
                class="preference-tag"
              >
                {{ style }}
              </span>
            </div>
          </div>
          
          <div class="recent-performance">
            <h4>Recent Performance</h4>
            <div class="performance-metric">
              <span>Last 5 interactions:</span>
              <span class="value">{{ (analytics.studentProfile.recent_performance * 100).toFixed(0) }}%</span>
            </div>
            <div class="performance-metric">
              <span>Session duration:</span>
              <span class="value">{{ analytics.studentProfile.session_duration }} min</span>
            </div>
            <div class="performance-metric">
              <span>Items completed today:</span>
              <span class="value">{{ analytics.studentProfile.items_completed_today }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Selection Records -->
      <div class="insight-section">
        <h3>Selection History</h3>
        
        <div class="selection-timeline">
          <div
            v-for="(record, index) in demoStore.selectionRecords.slice().reverse()"
            :key="record.id"
            class="selection-record"
          >
            <div class="record-time">
              {{ formatDate(record.selected_at) }}
            </div>
            <div class="record-content">
              <div class="record-header">
                <span class="slot-name">{{ getSlotName(record.slot_id) }}</span>
                <span class="variant-name">→ {{ getVariantTitle(record.variant_id) }}</span>
              </div>
              <div class="record-outcome">
                <span :class="['outcome-badge', record.success ? 'success' : 'failure']">
                  {{ record.success ? '✓ Success' : '✗ Failed' }}
                </span>
                <span class="score">Score: {{ (record.score * 100).toFixed(0) }}%</span>
                <span class="time">Time: {{ record.time_spent }}s</span>
              </div>
            </div>
          </div>
          
          <div v-if="demoStore.selectionRecords.length === 0" class="empty-state">
            <p>No interactions yet. Try the Player view!</p>
          </div>
        </div>
      </div>
      
      <!-- Recommendations -->
      <div class="insight-section recommendations">
        <h3>AI Recommendations</h3>
        
        <div class="recommendation-cards">
          <div class="recommendation-card">
            <SparklesIcon class="rec-icon" />
            <h4>Improve Variant Mix</h4>
            <p>
              The interactive variant has 92% success rate vs 78% for text.
              Consider making interactive the default for visual learners.
            </p>
            <button class="btn-link">Apply →</button>
          </div>
          
          <div class="recommendation-card">
            <ChartBarIcon class="rec-icon" />
            <h4>Optimize Flow</h4>
            <p>
              Students rarely take the advanced path (8%).
              Consider adjusting the decision rule threshold from 0.7 to 0.65.
            </p>
            <button class="btn-link">Adjust →</button>
          </div>
          
          <div class="recommendation-card">
            <LightBulbIcon class="rec-icon" />
            <h4>Add Scaffolding</h4>
            <p>
              35% of students spend >5 minutes on practice exercises.
              Add hint system or easier variant for strugglers.
            </p>
            <button class="btn-link">Create →</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useDemoStore } from '@/stores/demoStore';
import {
  UsersIcon,
  CheckCircleIcon,
  ClockIcon,
  SparklesIcon,
  ArrowPathIcon,
  ChartBarIcon,
  LightBulbIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  CubeTransparentIcon
} from '@heroicons/vue/24/outline';

const demoStore = useDemoStore();

const timeRange = ref('30d');
const analytics = computed(() => demoStore.getAnalytics());

const sortedVariants = computed(() => {
  return [...analytics.value.variantPerformance]
    .sort((a, b) => b.success_rate - a.success_rate);
});

function getSlotName(slotId: string): string {
  return demoStore.slots.find(s => s.id === slotId)?.name || slotId;
}

function getVariantTitle(variantId: string): string {
  return demoStore.variants.find(v => v.id === variantId)?.title || variantId;
}

function getContentIcon(variant: any) {
  switch (variant.content_type) {
    case 'text': return DocumentTextIcon;
    case 'video': return VideoCameraIcon;
    case 'interactive': return CubeTransparentIcon;
    default: return DocumentTextIcon;
  }
}

function getRateColor(rate: number): string {
  if (rate >= 0.8) return '#10b981';
  if (rate >= 0.6) return '#f59e0b';
  return '#ef4444';
}

function getScoreClass(rate: number): string {
  if (rate >= 0.8) return 'excellent';
  if (rate >= 0.6) return 'good';
  return 'needs-improvement';
}

function getScoreLabel(rate: number): string {
  if (rate >= 0.8) return 'Excellent';
  if (rate >= 0.6) return 'Good';
  return 'Needs Work';
}

function getMasteryColor(level: number): string {
  if (level >= 0.8) return '#10b981';
  if (level >= 0.6) return '#3b82f6';
  if (level >= 0.4) return '#f59e0b';
  return '#ef4444';
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function refreshData() {
  // In real app, this would fetch fresh data from API
  alert('Data refreshed! (Demo mode)');
}

function selectVariant(variant: any) {
  console.log('Selected variant:', variant);
}
</script>

<style scoped>
.insights-demo {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f9fafb;
  overflow-y: auto;
}

.insights-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  background: white;
  border-bottom: 1px solid #e5e7eb;
}

.insights-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.time-range-select {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  padding: 2rem;
}

.summary-card {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

.card-icon svg {
  width: 24px;
  height: 24px;
}

.card-content {
  flex: 1;
}

.card-value {
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  line-height: 1;
  margin-bottom: 0.5rem;
}

.card-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.insights-content {
  padding: 0 2rem 2rem 2rem;
}

.insight-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.insight-section h3 {
  margin: 0 0 1.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.table-container {
  overflow-x: auto;
}

.performance-table {
  width: 100%;
  border-collapse: collapse;
}

.performance-table thead {
  background: #f9fafb;
}

.performance-table th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
}

.performance-table td {
  padding: 1rem;
  border-bottom: 1px solid #f3f4f6;
}

.table-row {
  cursor: pointer;
  transition: background 0.2s;
}

.table-row:hover {
  background: #f9fafb;
}

.title-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.content-icon {
  width: 20px;
  height: 20px;
  color: #3b82f6;
}

.type-badge {
  padding: 0.25rem 0.625rem;
  background: #e0e7ff;
  color: #3730a3;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.rate-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.rate-bar {
  height: 8px;
  border-radius: 4px;
  min-width: 60px;
  transition: width 0.3s;
}

.score-indicator {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.score-indicator.excellent {
  background: #d1fae5;
  color: #065f46;
}

.score-indicator.good {
  background: #dbeafe;
  color: #1e40af;
}

.score-indicator.needs-improvement {
  background: #fee2e2;
  color: #991b1b;
}

.chart-container {
  padding: 1rem 0;
}

.chart-bars {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.chart-bar-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.bar-label {
  font-weight: 600;
  font-size: 0.875rem;
  color: #374151;
}

.bars {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.bar-row {
  display: grid;
  grid-template-columns: 120px 1fr 60px;
  gap: 1rem;
  align-items: center;
}

.metric-label {
  font-size: 0.75rem;
  color: #6b7280;
}

.bar-track {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}

.bar-fill.success {
  background: #10b981;
}

.bar-fill.completion {
  background: #3b82f6;
}

.metric-value {
  font-size: 0.875rem;
  font-weight: 600;
  text-align: right;
}

.student-details {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.student-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.avatar-large {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #3b82f6;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 600;
}

.student-info h4 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.student-info p {
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.mastery-breakdown h4,
.learning-preferences h4,
.recent-performance h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
}

.mastery-row {
  display: grid;
  grid-template-columns: 100px 1fr 60px;
  gap: 1rem;
  align-items: center;
  margin-bottom: 0.75rem;
}

.subject-name {
  font-size: 0.875rem;
  font-weight: 500;
}

.mastery-bar {
  height: 12px;
  background: #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}

.mastery-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.3s;
}

.mastery-percent {
  font-size: 0.875rem;
  font-weight: 600;
  text-align: right;
}

.preferences-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.preference-tag {
  padding: 0.5rem 1rem;
  background: #eff6ff;
  color: #1e40af;
  border-radius: 16px;
  font-size: 0.875rem;
  font-weight: 500;
}

.performance-metric {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.875rem;
}

.performance-metric:last-child {
  border-bottom: none;
}

.performance-metric .value {
  font-weight: 600;
  color: #111827;
}

.selection-timeline {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.selection-record {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 3px solid #3b82f6;
}

.record-time {
  font-size: 0.75rem;
  color: #6b7280;
  min-width: 80px;
}

.record-content {
  flex: 1;
}

.record-header {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.slot-name {
  font-weight: 600;
}

.variant-name {
  color: #6b7280;
}

.record-outcome {
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
}

.outcome-badge {
  padding: 0.25rem 0.625rem;
  border-radius: 12px;
  font-weight: 600;
}

.outcome-badge.success {
  background: #d1fae5;
  color: #065f46;
}

.outcome-badge.failure {
  background: #fee2e2;
  color: #991b1b;
}

.empty-state {
  padding: 3rem;
  text-align: center;
  color: #6b7280;
}

.recommendations {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.recommendations h3 {
  color: white;
}

.recommendation-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.recommendation-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 1.5rem;
}

.rec-icon {
  width: 32px;
  height: 32px;
  margin-bottom: 1rem;
}

.recommendation-card h4 {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: white;
}

.recommendation-card p {
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.5;
}

.btn-link {
  background: none;
  border: none;
  color: white;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.875rem;
  padding: 0;
}

.btn-link:hover {
  text-decoration: underline;
}

.btn-secondary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.icon {
  width: 16px;
  height: 16px;
}
</style>





