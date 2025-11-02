import type { Meta, StoryObj } from '@storybook/vue3';
import { ref } from 'vue';
import { createSnapshot, selectVariant, updateAccuracyEWMA, type Slot, type Policy, type SessionSnapshot } from '@amit/adaptivity';

const meta = {
  title: 'Adaptivity Engine/Adaptive Selection',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Demonstrates the adaptive variant selection engine in action. The engine selects the most appropriate content variant based on learner context, performance metrics, and preferences.',
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Basic selection scenario showing how the engine chooses between variants
 */
export const BasicSelection: Story = {
  render: () => ({
    setup() {
      const session = ref<SessionSnapshot>(createSnapshot({
        ids: { userId: 'student_1', courseId: 'course_1', lessonId: 'lesson_1', pageId: 'page_1' },
        user: { lang: 'en', preferences: { theme: { value: 'soccer', source: 'student' } } },
        metrics: { accEWMA: 0.75, latencyEWMA: 2000, idleSec: 0, streak: 2, fatigue: 0, attempts: 5 },
      }));

      const slot: Slot = {
        id: 'intro_slot',
        variants: [
          {
            id: 'easy_variant',
            meta: { difficulty: 'easy', theme: 'soccer', modality: 'video' },
            guard: 'ctx.metrics.accEWMA < 0.7',
            scoreWeights: { preferLowAcc: 0.6, preferThemeMatch: 0.3 },
          },
          {
            id: 'standard_variant',
            meta: { difficulty: 'std', theme: 'music', modality: 'reading' },
            guard: 'ctx.metrics.accEWMA >= 0.5',
            scoreWeights: { preferThemeMatch: 0.2 },
          },
          {
            id: 'hard_variant',
            meta: { difficulty: 'hard', theme: 'space', modality: 'interactive' },
            guard: 'ctx.metrics.accEWMA >= 0.85 && ctx.metrics.streak >= 3',
          },
        ],
        fallbackVariantId: 'standard_variant',
      };

      const policy: Policy = { version: 'v1.0' };
      const result = ref(selectVariant(slot, session.value, policy, { trace: true }));

      return { session, result };
    },
    template: `
      <div style="font-family: system-ui; padding: 24px; background: #f5f5f5; border-radius: 8px;">
        <h3 style="margin-top: 0;">Adaptive Selection Engine</h3>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
          <div style="background: white; padding: 16px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h4 style="margin-top: 0; color: #2563eb;">Session Context</h4>
            <div style="font-size: 14px;">
              <div><strong>Accuracy:</strong> {{ (session.metrics.accEWMA * 100).toFixed(0) }}%</div>
              <div><strong>Streak:</strong> {{ session.metrics.streak }}</div>
              <div><strong>Attempts:</strong> {{ session.metrics.attempts }}</div>
              <div><strong>Theme Preference:</strong> {{ session.user.preferences?.theme?.value }}</div>
            </div>
          </div>
          
          <div style="background: white; padding: 16px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h4 style="margin-top: 0; color: #16a34a;">Selected Variant</h4>
            <div style="font-size: 18px; font-weight: bold; color: #16a34a; margin-bottom: 8px;">
              {{ result.variantId }}
            </div>
            <div style="font-size: 14px; color: #666;">
              Policy: {{ result.why.policyVersion }}
            </div>
          </div>
        </div>

        <div style="background: white; padding: 16px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h4 style="margin-top: 0;">Selection Explanation</h4>
          <div v-if="result.why.stickyUsed" style="padding: 12px; background: #fef3c7; border-left: 4px solid #f59e0b; margin-bottom: 12px;">
            ✓ Sticky choice retained for consistency
          </div>
          <div v-if="result.why.overridesUsed" style="padding: 12px; background: #fee2e2; border-left: 4px solid #dc2626; margin-bottom: 12px;">
            ⚠ Override applied by teacher/system
          </div>
          
          <div style="margin-top: 12px;">
            <strong>Guard Results:</strong>
            <div v-for="(passed, variantId) in result.why.guards" :key="variantId" 
                 style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px;">
              <span>{{ variantId }}</span>
              <span :style="{ color: passed ? '#16a34a' : '#dc2626' }">
                {{ passed ? '✓ Pass' : '✗ Fail' }}
              </span>
            </div>
          </div>

          <div style="margin-top: 12px;">
            <strong>Variant Scores:</strong>
            <div v-for="(score, variantId) in result.why.score" :key="variantId" 
                 style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0; font-size: 14px;">
              <span>{{ variantId }}</span>
              <div style="display: flex; align-items: center; gap: 8px;">
                <div style="width: 100px; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden;">
                  <div :style="{ width: Math.max(0, score * 100) + '%', height: '100%', background: '#2563eb' }"></div>
                </div>
                <span style="font-weight: bold;">{{ score.toFixed(3) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
  }),
};

/**
 * Struggling learner scenario - shows adaptation to low performance
 */
export const StrugglingLearner: Story = {
  render: () => ({
    setup() {
      const session = ref<SessionSnapshot>(createSnapshot({
        ids: { userId: 'student_2', courseId: 'course_1', lessonId: 'lesson_1', pageId: 'page_1' },
        user: { lang: 'en' },
        metrics: { accEWMA: 0.45, latencyEWMA: 3500, idleSec: 0, streak: 0, fatigue: 0.3, attempts: 8 },
      }));

      const slot: Slot = {
        id: 'practice_slot',
        variants: [
          {
            id: 'easy_with_hints',
            meta: { difficulty: 'easy', modality: 'quiz', cognitiveLoad: 'low' },
            guard: 'ctx.metrics.attempts > 5 && ctx.metrics.streak === 0',
            scoreWeights: { preferLowAcc: 0.9 },
          },
          {
            id: 'standard_practice',
            meta: { difficulty: 'std', modality: 'quiz', cognitiveLoad: 'med' },
            guard: 'ctx.metrics.accEWMA >= 0.5',
          },
        ],
        fallbackVariantId: 'easy_with_hints',
      };

      const policy: Policy = { version: 'v1.0' };
      const result = ref(selectVariant(slot, session.value, policy, { trace: true }));

      return { session, result };
    },
    template: `
      <div style="font-family: system-ui; padding: 24px; background: #fef2f2; border: 2px solid #dc2626; border-radius: 8px;">
        <h3 style="margin-top: 0; color: #dc2626;">🆘 Struggling Learner Detected</h3>
        
        <div style="background: white; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
          <h4 style="margin-top: 0;">Performance Indicators</h4>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; font-size: 14px;">
            <div>
              <div style="color: #666;">Accuracy</div>
              <div style="font-size: 24px; font-weight: bold; color: #dc2626;">{{ (session.metrics.accEWMA * 100).toFixed(0) }}%</div>
            </div>
            <div>
              <div style="color: #666;">Attempts</div>
              <div style="font-size: 24px; font-weight: bold;">{{ session.metrics.attempts }}</div>
            </div>
            <div>
              <div style="color: #666;">Streak</div>
              <div style="font-size: 24px; font-weight: bold; color: #dc2626;">{{ session.metrics.streak }}</div>
            </div>
          </div>
        </div>

        <div style="background: #dcfce7; padding: 16px; border-radius: 8px; border-left: 4px solid #16a34a;">
          <h4 style="margin: 0 0 8px 0; color: #16a34a;">✓ Adaptive Response</h4>
          <p style="margin: 0; font-size: 14px;">
            Engine selected <strong>{{ result.variantId }}</strong> with easier difficulty and additional hints to support struggling learner.
          </p>
        </div>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates how the engine adapts to a struggling learner by selecting easier variants with additional support.',
      },
    },
  },
};

/**
 * High performer scenario - shows adaptation to excellent performance
 */
export const HighPerformer: Story = {
  render: () => ({
    setup() {
      const session = ref<SessionSnapshot>(createSnapshot({
        ids: { userId: 'student_3', courseId: 'course_1', lessonId: 'lesson_1', pageId: 'page_1' },
        user: { lang: 'en' },
        metrics: { accEWMA: 0.95, latencyEWMA: 1200, idleSec: 0, streak: 7, fatigue: 0, attempts: 12 },
      }));

      const slot: Slot = {
        id: 'challenge_slot',
        variants: [
          {
            id: 'easy_review',
            meta: { difficulty: 'easy', modality: 'reading' },
            guard: 'ctx.metrics.accEWMA < 0.7',
          },
          {
            id: 'standard_lesson',
            meta: { difficulty: 'std', modality: 'video' },
            guard: 'ctx.metrics.accEWMA >= 0.6 && ctx.metrics.accEWMA < 0.9',
          },
          {
            id: 'advanced_challenge',
            meta: { difficulty: 'hard', modality: 'simulation', cognitiveLoad: 'high' },
            guard: 'ctx.metrics.accEWMA >= 0.9 && ctx.metrics.streak >= 5',
            scoreWeights: { preferModality: { simulation: 0.5 } },
          },
        ],
        fallbackVariantId: 'standard_lesson',
      };

      const policy: Policy = { version: 'v1.0' };
      const result = ref(selectVariant(slot, session.value, policy, { trace: true }));

      return { session, result };
    },
    template: `
      <div style="font-family: system-ui; padding: 24px; background: #f0fdf4; border: 2px solid #16a34a; border-radius: 8px;">
        <h3 style="margin-top: 0; color: #16a34a;">🌟 High Performer Detected</h3>
        
        <div style="background: white; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
          <h4 style="margin-top: 0;">Excellent Performance</h4>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; font-size: 14px;">
            <div>
              <div style="color: #666;">Accuracy</div>
              <div style="font-size: 24px; font-weight: bold; color: #16a34a;">{{ (session.metrics.accEWMA * 100).toFixed(0) }}%</div>
            </div>
            <div>
              <div style="color: #666;">Streak</div>
              <div style="font-size: 24px; font-weight: bold; color: #16a34a;">{{ session.metrics.streak }}</div>
            </div>
            <div>
              <div style="color: #666;">Speed</div>
              <div style="font-size: 24px; font-weight: bold; color: #16a34a;">Fast</div>
            </div>
          </div>
        </div>

        <div style="background: #dbeafe; padding: 16px; border-radius: 8px; border-left: 4px solid #2563eb;">
          <h4 style="margin: 0 0 8px 0; color: #2563eb;">🚀 Challenge Mode Activated</h4>
          <p style="margin: 0; font-size: 14px;">
            Engine selected <strong>{{ result.variantId }}</strong> with higher difficulty to keep the learner engaged and challenged.
          </p>
        </div>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates how the engine challenges high-performing learners with more difficult content.',
      },
    },
  },
};

/**
 * Theme preference scenario - shows personalization based on preferences
 */
export const ThemePersonalization: Story = {
  render: () => ({
    setup() {
      const session = ref<SessionSnapshot>(createSnapshot({
        ids: { userId: 'student_4', courseId: 'course_1', lessonId: 'lesson_1', pageId: 'page_1' },
        user: { 
          lang: 'en',
          preferences: { 
            theme: { value: 'soccer', source: 'student', confidence: 0.9 } 
          } 
        },
        metrics: { accEWMA: 0.75, latencyEWMA: 2000, idleSec: 0, streak: 3, fatigue: 0, attempts: 6 },
      }));

      const slot: Slot = {
        id: 'themed_content',
        variants: [
          {
            id: 'soccer_theme',
            meta: { difficulty: 'std', theme: 'soccer', modality: 'interactive' },
            scoreWeights: { preferThemeMatch: 0.8 },
          },
          {
            id: 'music_theme',
            meta: { difficulty: 'std', theme: 'music', modality: 'interactive' },
            scoreWeights: { preferThemeMatch: 0.8 },
          },
          {
            id: 'space_theme',
            meta: { difficulty: 'std', theme: 'space', modality: 'interactive' },
            scoreWeights: { preferThemeMatch: 0.8 },
          },
        ],
        fallbackVariantId: 'soccer_theme',
      };

      const policy: Policy = { version: 'v1.0' };
      const result = ref(selectVariant(slot, session.value, policy, { trace: true }));

      return { session, result };
    },
    template: `
      <div style="font-family: system-ui; padding: 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px;">
        <h3 style="margin-top: 0;">🎨 Theme Personalization</h3>
        
        <div style="background: rgba(255,255,255,0.1); padding: 16px; border-radius: 8px; margin-bottom: 16px; backdrop-filter: blur(10px);">
          <h4 style="margin-top: 0;">Student Preferences</h4>
          <div style="font-size: 18px; font-weight: bold;">
            Favorite Theme: {{ session.user.preferences?.theme?.value || 'None' }}
          </div>
          <div style="font-size: 14px; opacity: 0.9; margin-top: 4px;">
            Confidence: {{ ((session.user.preferences?.theme?.confidence || 0) * 100).toFixed(0) }}%
          </div>
        </div>

        <div style="background: rgba(255,255,255,0.95); color: #1f2937; padding: 16px; border-radius: 8px;">
          <h4 style="margin-top: 0;">Selected Content</h4>
          <div style="font-size: 24px; font-weight: bold; color: #667eea; margin-bottom: 8px;">
            {{ result.variantId }}
          </div>
          <p style="margin: 0; font-size: 14px;">
            Content personalized to match student's preferred theme for increased engagement.
          </p>
        </div>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Shows how the engine personalizes content based on student theme preferences.',
      },
    },
  },
};

/**
 * Device adaptation scenario
 */
export const DeviceAdaptation: Story = {
  render: () => ({
    setup() {
      const session = ref<SessionSnapshot>(createSnapshot({
        ids: { userId: 'student_5', courseId: 'course_1', lessonId: 'lesson_1', pageId: 'page_1' },
        user: { lang: 'en' },
        env: { device: 'mobile', online: true, netType: '4g' },
        metrics: { accEWMA: 0.75, latencyEWMA: 2000, idleSec: 0, streak: 2, fatigue: 0, attempts: 5 },
      }));

      const slot: Slot = {
        id: 'device_aware',
        variants: [
          {
            id: 'mobile_optimized',
            meta: { 
              difficulty: 'std', 
              modality: 'interactive',
              deviceFit: ['mobile'],
              durationSec: 60,
            },
            guard: 'ctx.env.device === "mobile"',
          },
          {
            id: 'desktop_full',
            meta: { 
              difficulty: 'std', 
              modality: 'simulation',
              deviceFit: ['desktop'],
              durationSec: 180,
            },
            guard: 'ctx.env.device === "desktop"',
          },
          {
            id: 'universal',
            meta: { 
              difficulty: 'std', 
              modality: 'reading',
              deviceFit: ['mobile', 'desktop', 'tablet'],
            },
          },
        ],
        fallbackVariantId: 'universal',
      };

      const policy: Policy = { version: 'v1.0' };
      const result = ref(selectVariant(slot, session.value, policy, { trace: true }));

      return { session, result };
    },
    template: `
      <div style="font-family: system-ui; padding: 24px; background: #fef3c7; border-radius: 8px;">
        <h3 style="margin-top: 0;">📱 Device-Aware Adaptation</h3>
        
        <div style="background: white; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
          <h4 style="margin-top: 0;">Device Context</h4>
          <div style="display: flex; gap: 24px; font-size: 14px;">
            <div>
              <div style="color: #666;">Device</div>
              <div style="font-size: 20px; font-weight: bold;">{{ session.env.device }}</div>
            </div>
            <div>
              <div style="color: #666;">Network</div>
              <div style="font-size: 20px; font-weight: bold;">{{ session.env.netType }}</div>
            </div>
            <div>
              <div style="color: #666;">Status</div>
              <div style="font-size: 20px; font-weight: bold;">{{ session.env.online ? 'Online' : 'Offline' }}</div>
            </div>
          </div>
        </div>

        <div style="background: #dcfce7; padding: 16px; border-radius: 8px; border-left: 4px solid #16a34a;">
          <h4 style="margin: 0 0 8px 0; color: #16a34a;">📱 Mobile-Optimized</h4>
          <p style="margin: 0; font-size: 14px;">
            Engine selected <strong>{{ result.variantId }}</strong> optimized for mobile device with shorter duration and touch-friendly interactions.
          </p>
        </div>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates device-aware content selection for optimal experience across different devices.',
      },
    },
  },
};

