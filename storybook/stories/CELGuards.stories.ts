import type { Meta, StoryObj } from '@storybook/vue3';
import { ref } from 'vue';
import { createSnapshot, selectVariant, CEL_TEMPLATES, validateCelExpression, type Slot, type Policy } from '@amit/adaptivity';

const meta = {
  title: 'Adaptivity Engine/CEL Guards',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'CEL (Common Expression Language) guards provide safe, powerful conditions for variant eligibility. Guards determine which variants are available for selection based on the learner context.',
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * CEL guard templates showcase
 */
export const GuardTemplates: Story = {
  render: () => ({
    setup() {
      const templates = Object.entries(CEL_TEMPLATES);
      return { templates };
    },
    template: `
      <div style="font-family: system-ui; padding: 24px;">
        <h2>CEL Guard Templates</h2>
        <p style="color: #666; margin-bottom: 24px;">
          Pre-built guard expressions for common scenarios
        </p>

        <div style="display: grid; gap: 16px;">
          <div v-for="[name, template] in templates" :key="name"
               style="background: white; padding: 16px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-left: 4px solid #2563eb;">
            <div style="font-weight: bold; color: #2563eb; margin-bottom: 8px;">
              {{ name }}
            </div>
            <div style="font-family: monospace; font-size: 13px; background: #f3f4f6; padding: 8px; border-radius: 4px; overflow-x: auto;">
              {{ typeof template === 'function' ? template('example') : template }}
            </div>
          </div>
        </div>
      </div>
    `,
  }),
};

/**
 * Low accuracy guard scenario
 */
export const LowAccuracyGuard: Story = {
  render: () => ({
    setup() {
      const session = ref(createSnapshot({
        ids: { userId: 'u1', courseId: 'c1', lessonId: 'L1', pageId: 'P1' },
        metrics: { accEWMA: 0.55, latencyEWMA: 2000, idleSec: 0, streak: 0, fatigue: 0, attempts: 6 },
      }));

      const slot: Slot = {
        id: 'guarded_content',
        variants: [
          {
            id: 'remedial_content',
            meta: { difficulty: 'easy' },
            guard: CEL_TEMPLATES.lowAccuracy,
          },
          {
            id: 'standard_content',
            meta: { difficulty: 'std' },
            guard: 'ctx.metrics.accEWMA >= 0.7 && ctx.metrics.accEWMA < 0.9',
          },
          {
            id: 'advanced_content',
            meta: { difficulty: 'hard' },
            guard: CEL_TEMPLATES.highAccuracy,
          },
        ],
        fallbackVariantId: 'standard_content',
      };

      const policy: Policy = { version: 'v1.0' };
      const result = ref(selectVariant(slot, session.value, policy, { trace: true }));

      return { session, result, lowAccGuard: CEL_TEMPLATES.lowAccuracy };
    },
    template: `
      <div style="font-family: system-ui; padding: 24px; background: #f5f5f5; border-radius: 8px;">
        <h3 style="margin-top: 0;">Low Accuracy Guard</h3>
        
        <div style="background: white; padding: 16px; border-radius: 8px; margin-bottom: 16px; border: 2px solid #dc2626;">
          <h4 style="margin-top: 0; color: #dc2626;">Student Performance</h4>
          <div style="font-size: 32px; font-weight: bold; color: #dc2626; margin-bottom: 8px;">
            {{ (session.metrics.accEWMA * 100).toFixed(0) }}%
          </div>
          <div style="font-size: 14px; color: #666;">Accuracy EWMA</div>
        </div>

        <div style="background: white; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
          <h4 style="margin-top: 0;">Guard Expression</h4>
          <div style="font-family: monospace; background: #f3f4f6; padding: 12px; border-radius: 4px; font-size: 13px;">
            {{ lowAccGuard }}
          </div>
          <div style="margin-top: 12px; padding: 12px; background: #dcfce7; border-left: 4px solid #16a34a; border-radius: 4px;">
            <strong style="color: #16a34a;">✓ Guard Passed</strong>
            <div style="font-size: 14px; color: #666; margin-top: 4px;">
              Remedial content unlocked due to low accuracy
            </div>
          </div>
        </div>

        <div style="background: white; padding: 16px; border-radius: 8px;">
          <h4 style="margin-top: 0;">Selected Variant</h4>
          <div style="font-size: 20px; font-weight: bold; color: #2563eb;">
            {{ result.variantId }}
          </div>
          <div style="margin-top: 8px; font-size: 14px; color: #666;">
            Appropriate support material for struggling learner
          </div>
        </div>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Guards based on accuracy thresholds unlock appropriate difficulty levels.',
      },
    },
  },
};

/**
 * Streak-based guard
 */
export const StreakGuard: Story = {
  render: () => ({
    setup() {
      const session = ref(createSnapshot({
        ids: { userId: 'u1', courseId: 'c1', lessonId: 'L1', pageId: 'P1' },
        metrics: { accEWMA: 0.88, latencyEWMA: 1500, idleSec: 0, streak: 5, fatigue: 0, attempts: 8 },
      }));

      const slot: Slot = {
        id: 'bonus_content',
        variants: [
          {
            id: 'bonus_challenge',
            meta: { difficulty: 'hard', modality: 'interactive' },
            guard: CEL_TEMPLATES.onStreak,
          },
          {
            id: 'regular_content',
            meta: { difficulty: 'std', modality: 'reading' },
            guard: 'true',
          },
        ],
        fallbackVariantId: 'regular_content',
      };

      const policy: Policy = { version: 'v1.0' };
      const result = ref(selectVariant(slot, session.value, policy, { trace: true }));

      return { session, result };
    },
    template: `
      <div style="font-family: system-ui; padding: 24px; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); border-radius: 8px;">
        <h3 style="margin-top: 0; color: white;">🔥 Streak-Based Content Unlock</h3>
        
        <div style="background: rgba(255,255,255,0.95); padding: 16px; border-radius: 8px; margin-bottom: 16px;">
          <div style="text-align: center;">
            <div style="font-size: 64px; font-weight: bold; color: #f59e0b;">
              {{ session.metrics.streak }}
            </div>
            <div style="font-size: 18px; color: #666;">Correct Answers in a Row!</div>
          </div>
        </div>

        <div style="background: rgba(255,255,255,0.95); padding: 16px; border-radius: 8px; margin-bottom: 16px;">
          <h4 style="margin-top: 0;">Guard Condition</h4>
          <div style="font-family: monospace; background: #f3f4f6; padding: 12px; border-radius: 4px; font-size: 13px;">
            ctx.metrics.streak >= 3
          </div>
        </div>

        <div style="background: rgba(22, 163, 74, 0.15); padding: 16px; border-radius: 8px; border: 2px solid #16a34a;">
          <h4 style="margin: 0 0 8px 0; color: #16a34a;">🎉 Bonus Content Unlocked!</h4>
          <div style="font-size: 20px; font-weight: bold; color: #16a34a;">
            {{ result.variantId }}
          </div>
          <div style="margin-top: 8px; font-size: 14px;">
            Special challenge content available due to excellent streak performance
          </div>
        </div>
      </div>
    `,
  }),
};

/**
 * Complex guard combination
 */
export const ComplexGuard: Story = {
  render: () => ({
    setup() {
      const session = ref(createSnapshot({
        ids: { userId: 'u1', courseId: 'c1', lessonId: 'L1', pageId: 'P1' },
        user: { lang: 'en' },
        env: { device: 'desktop', online: true },
        metrics: { accEWMA: 0.92, latencyEWMA: 1200, idleSec: 0, streak: 6, fatigue: 0, attempts: 10 },
      }));

      const complexGuard = CEL_TEMPLATES.advancedDesktopUser;

      const slot: Slot = {
        id: 'premium_content',
        variants: [
          {
            id: 'premium_simulation',
            meta: { difficulty: 'hard', modality: 'simulation', cognitiveLoad: 'high' },
            guard: complexGuard,
          },
          {
            id: 'standard_lesson',
            meta: { difficulty: 'std', modality: 'video' },
            guard: 'true',
          },
        ],
        fallbackVariantId: 'standard_lesson',
      };

      const policy: Policy = { version: 'v1.0' };
      const result = ref(selectVariant(slot, session.value, policy, { trace: true }));
      const validation = validateCelExpression(complexGuard);

      return { session, result, complexGuard, validation };
    },
    template: `
      <div style="font-family: system-ui; padding: 24px; background: #f5f5f5; border-radius: 8px;">
        <h3 style="margin-top: 0;">Complex Guard Expression</h3>
        
        <div style="background: white; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
          <h4 style="margin-top: 0;">Multi-Condition Guard</h4>
          <div style="font-family: monospace; background: #1f2937; color: #10b981; padding: 16px; border-radius: 4px; font-size: 13px; overflow-x: auto; white-space: pre;">{{ complexGuard }}</div>
          
          <div style="margin-top: 12px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
            <div style="padding: 12px; background: #f3f4f6; border-radius: 4px; text-align: center;">
              <div style="font-size: 20px; font-weight: bold; color: #16a34a;">{{ (session.metrics.accEWMA * 100).toFixed(0) }}%</div>
              <div style="font-size: 12px; color: #666;">Accuracy > 90%</div>
            </div>
            <div style="padding: 12px; background: #f3f4f6; border-radius: 4px; text-align: center;">
              <div style="font-size: 20px; font-weight: bold; color: #16a34a;">{{ session.env.device }}</div>
              <div style="font-size: 12px; color: #666;">Device = Desktop</div>
            </div>
            <div style="padding: 12px; background: #f3f4f6; border-radius: 4px; text-align: center;">
              <div style="font-size: 20px; font-weight: bold; color: #16a34a;">{{ session.metrics.streak }}</div>
              <div style="font-size: 12px; color: #666;">Streak >= 5</div>
            </div>
          </div>
        </div>

        <div style="background: white; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
          <h4 style="margin-top: 0;">Expression Validation</h4>
          <div v-if="validation.valid" style="padding: 12px; background: #dcfce7; border-left: 4px solid #16a34a; border-radius: 4px;">
            <strong style="color: #16a34a;">✓ Valid Expression</strong>
            <div style="font-size: 14px; color: #666; margin-top: 4px;">
              Guard compiles successfully
            </div>
          </div>
          <div v-else style="padding: 12px; background: #fee2e2; border-left: 4px solid #dc2626; border-radius: 4px;">
            <strong style="color: #dc2626;">✗ Invalid Expression</strong>
            <div style="font-size: 14px; color: #666; margin-top: 4px;">
              {{ validation.error }}
            </div>
          </div>
        </div>

        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 16px; border-radius: 8px; color: white;">
          <h4 style="margin-top: 0;">🚀 Premium Content Unlocked</h4>
          <div style="font-size: 24px; font-weight: bold; margin-bottom: 8px;">
            {{ result.variantId }}
          </div>
          <div style="font-size: 14px; opacity: 0.9;">
            Advanced simulation available for high-performing desktop users
          </div>
        </div>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Complex guards can combine multiple conditions for sophisticated content gating.',
      },
    },
  },
};

/**
 * Guard failure scenario
 */
export const GuardFailure: Story = {
  render: () => ({
    setup() {
      const session = ref(createSnapshot({
        ids: { userId: 'u1', courseId: 'c1', lessonId: 'L1', pageId: 'P1' },
        user: { lang: 'en' },
        env: { device: 'mobile', online: true },
        metrics: { accEWMA: 0.65, latencyEWMA: 2500, idleSec: 0, streak: 1, fatigue: 0.2, attempts: 4 },
      }));

      const slot: Slot = {
        id: 'gated_content',
        variants: [
          {
            id: 'desktop_only_sim',
            meta: { difficulty: 'hard', modality: 'simulation' },
            guard: 'ctx.env.device === "desktop" && ctx.metrics.accEWMA >= 0.9',
          },
          {
            id: 'mobile_friendly',
            meta: { difficulty: 'std', modality: 'interactive' },
            guard: 'true',
          },
        ],
        fallbackVariantId: 'mobile_friendly',
      };

      const policy: Policy = { version: 'v1.0' };
      const result = ref(selectVariant(slot, session.value, policy, { trace: true }));

      return { session, result };
    },
    template: `
      <div style="font-family: system-ui; padding: 24px; background: #f5f5f5; border-radius: 8px;">
        <h3 style="margin-top: 0;">Guard Failure & Fallback</h3>
        
        <div style="background: white; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
          <h4 style="margin-top: 0;">Current Context</h4>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; font-size: 14px;">
            <div>
              <div style="color: #666;">Device</div>
              <div style="font-size: 20px; font-weight: bold;">{{ session.env.device }}</div>
            </div>
            <div>
              <div style="color: #666;">Accuracy</div>
              <div style="font-size: 20px; font-weight: bold;">{{ (session.metrics.accEWMA * 100).toFixed(0) }}%</div>
            </div>
          </div>
        </div>

        <div style="background: white; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
          <h4 style="margin-top: 0;">Guard Results</h4>
          <div v-for="(passed, variantId) in result.why.guards" :key="variantId"
               style="padding: 12px; margin-bottom: 8px; border-radius: 4px;"
               :style="{ background: passed ? '#dcfce7' : '#fee2e2', borderLeft: `4px solid ${passed ? '#16a34a' : '#dc2626'}` }">
            <div style="display: flex; justify-between; align-items: center;">
              <span style="font-weight: bold;">{{ variantId }}</span>
              <span :style="{ color: passed ? '#16a34a' : '#dc2626' }">
                {{ passed ? '✓ Pass' : '✗ Fail' }}
              </span>
            </div>
          </div>
        </div>

        <div style="background: #fef3c7; padding: 16px; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <h4 style="margin: 0 0 8px 0; color: #f59e0b;">⚠️ Fallback Activated</h4>
          <p style="margin: 0; font-size: 14px;">
            Desktop-only simulation guard failed. Selected fallback variant: <strong>{{ result.variantId }}</strong>
          </p>
        </div>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'When guards fail, the system gracefully falls back to appropriate alternatives.',
      },
    },
  },
};

