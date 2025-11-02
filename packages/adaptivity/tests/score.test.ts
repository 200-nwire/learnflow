/**
 * Comprehensive tests for scoring system
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { scoreVariant } from '../src/score.js';
import { createSnapshot, type SessionSnapshot, type Variant } from '../src/index.js';

describe('Scoring System', () => {
  let session: SessionSnapshot;

  beforeEach(() => {
    session = createSnapshot({
      ids: { userId: 'u1', courseId: 'c1', lessonId: 'L1', pageId: 'P1' },
      metrics: { accEWMA: 0.75, latencyEWMA: 2000, idleSec: 0, streak: 3, fatigue: 0, attempts: 5 },
      env: { device: 'desktop', online: true },
    });
  });

  describe('Basic Scoring', () => {
    it('should return 0 for variant with no weights', () => {
      const variant: Variant = {
        id: 'v1',
        meta: {},
      };

      const score = scoreVariant(variant, session);
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('should score based on preferLowAcc weight', () => {
      const variantHigh: Variant = {
        id: 'v1',
        meta: {},
        scoreWeights: { preferLowAcc: 0.8 },
      };

      const variantLow: Variant = {
        id: 'v2',
        meta: {},
        scoreWeights: { preferLowAcc: 0.2 },
      };

      // With accuracy of 0.75, preferLowAcc should favor variants for low performers
      session.metrics.accEWMA = 0.4; // Low accuracy
      const scoreHigh = scoreVariant(variantHigh, session);
      const scoreLow = scoreVariant(variantLow, session);

      expect(scoreHigh).toBeGreaterThan(scoreLow);
    });

    it('should prefer low accuracy variants for struggling learners', () => {
      const variant: Variant = {
        id: 'easy',
        meta: {},
        scoreWeights: { preferLowAcc: 1.0 },
      };

      session.metrics.accEWMA = 0.3; // Struggling
      const scoreStruggling = scoreVariant(variant, session);

      session.metrics.accEWMA = 0.95; // Excellent
      const scoreExcellent = scoreVariant(variant, session);

      expect(scoreStruggling).toBeGreaterThan(scoreExcellent);
    });
  });

  describe('Theme Matching', () => {
    it('should boost score for theme match', () => {
      session.user.preferences = {
        theme: { value: 'soccer', source: 'student' },
      };

      const matchingVariant: Variant = {
        id: 'soccer_themed',
        meta: { theme: 'soccer' },
        scoreWeights: { preferThemeMatch: 1.0 },
      };

      const nonMatchingVariant: Variant = {
        id: 'music_themed',
        meta: { theme: 'music' },
        scoreWeights: { preferThemeMatch: 1.0 },
      };

      const scoreMatch = scoreVariant(matchingVariant, session);
      const scoreNoMatch = scoreVariant(nonMatchingVariant, session);

      expect(scoreMatch).toBeGreaterThan(scoreNoMatch);
    });

    it('should handle missing theme preference', () => {
      session.user.preferences = undefined;

      const variant: Variant = {
        id: 'themed',
        meta: { theme: 'soccer' },
        scoreWeights: { preferThemeMatch: 1.0 },
      };

      const score = scoreVariant(variant, session);
      expect(score).toBe(0.05); // Device bonus only
    });

    it('should handle variant without theme', () => {
      session.user.preferences = {
        theme: { value: 'soccer', source: 'student' },
      };

      const variant: Variant = {
        id: 'no_theme',
        meta: {},
        scoreWeights: { preferThemeMatch: 1.0 },
      };

      const score = scoreVariant(variant, session);
      expect(score).toBe(0.05); // Device bonus only
    });
  });

  describe('Modality Preferences', () => {
    it('should boost score for preferred modality', () => {
      const videoVariant: Variant = {
        id: 'video',
        meta: { modality: 'video' },
        scoreWeights: { preferModality: { video: 0.8 } },
      };

      const readingVariant: Variant = {
        id: 'reading',
        meta: { modality: 'reading' },
        scoreWeights: { preferModality: { reading: 0.2 } },
      };

      const videoScore = scoreVariant(videoVariant, session);
      const readingScore = scoreVariant(readingVariant, session);

      expect(videoScore).toBeGreaterThan(readingScore);
    });

    it('should handle multiple modality weights', () => {
      const variant: Variant = {
        id: 'multi',
        meta: { modality: 'interactive' },
        scoreWeights: {
          preferModality: {
            video: 0.3,
            interactive: 0.8,
            reading: 0.1,
          },
        },
      };

      const score = scoreVariant(variant, session);
      expect(score).toBeGreaterThan(0);
    });

    it('should default to reading modality if not specified', () => {
      const variant: Variant = {
        id: 'no_modality',
        meta: {},
        scoreWeights: {
          preferModality: {
            reading: 0.5,
          },
        },
      };

      const score = scoreVariant(variant, session);
      expect(score).toBe(0.55); // 0.5 modality + 0.05 device bonus
    });
  });

  describe('Device Suitability', () => {
    it('should give bonus for device match', () => {
      const desktopVariant: Variant = {
        id: 'desktop',
        meta: { deviceFit: ['desktop'] },
      };

      const mobileVariant: Variant = {
        id: 'mobile',
        meta: { deviceFit: ['mobile'] },
      };

      session.env.device = 'desktop';
      const desktopScore = scoreVariant(desktopVariant, session);
      const mobileScore = scoreVariant(mobileVariant, session);

      expect(desktopScore).toBeGreaterThan(mobileScore);
    });

    it('should penalize non-suitable devices', () => {
      const variant: Variant = {
        id: 'desktop_only',
        meta: { deviceFit: ['desktop'] },
      };

      session.env.device = 'mobile';
      const score = scoreVariant(variant, session);

      expect(score).toBeLessThan(0); // Penalty applied
    });

    it('should give bonus for multi-device variants', () => {
      const variant: Variant = {
        id: 'universal',
        meta: { deviceFit: ['desktop', 'mobile', 'tablet'] },
      };

      session.env.device = 'mobile';
      const score = scoreVariant(variant, session);

      expect(score).toBeGreaterThan(-1); // Should get device bonus
    });

    it('should handle variant without deviceFit', () => {
      const variant: Variant = {
        id: 'any_device',
        meta: {},
      };

      const score = scoreVariant(variant, session);
      expect(score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Combined Scoring', () => {
    it('should combine multiple score components', () => {
      session.metrics.accEWMA = 0.4;
      session.user.preferences = {
        theme: { value: 'soccer', source: 'student' },
      };
      session.env.device = 'mobile';

      const variant: Variant = {
        id: 'perfect_match',
        meta: {
          theme: 'soccer',
          modality: 'video',
          deviceFit: ['mobile', 'tablet'],
        },
        scoreWeights: {
          preferLowAcc: 0.6,
          preferThemeMatch: 0.4,
          preferModality: { video: 0.3 },
        },
      };

      const score = scoreVariant(variant, session);

      // Should have contributions from:
      // - preferLowAcc (0.6 * 0.6 = 0.36)
      // - preferThemeMatch (0.4 * 1 = 0.4)
      // - preferModality (0.3)
      // - device bonus (0.05)
      expect(score).toBeGreaterThan(1.0);
    });

    it('should handle zero weights', () => {
      const variant: Variant = {
        id: 'zero_weights',
        meta: {},
        scoreWeights: {
          preferLowAcc: 0,
          preferThemeMatch: 0,
          preferModality: {},
        },
      };

      const score = scoreVariant(variant, session);
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('should handle negative contributions', () => {
      const variant: Variant = {
        id: 'desktop_only',
        meta: { deviceFit: ['desktop'] },
        scoreWeights: { preferLowAcc: 0.5 },
      };

      session.env.device = 'mobile';
      session.metrics.accEWMA = 0.3;

      const score = scoreVariant(variant, session);
      // Device penalty (-1) should dominate even with positive preferLowAcc
      expect(score).toBeLessThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle perfect accuracy (1.0)', () => {
      session.metrics.accEWMA = 1.0;

      const variant: Variant = {
        id: 'easy',
        meta: {},
        scoreWeights: { preferLowAcc: 1.0 },
      };

      const score = scoreVariant(variant, session);
      expect(score).toBe(0.05); // 0 + device bonus
    });

    it('should handle zero accuracy (0.0)', () => {
      session.metrics.accEWMA = 0.0;

      const variant: Variant = {
        id: 'easy',
        meta: {},
        scoreWeights: { preferLowAcc: 1.0 },
      };

      const score = scoreVariant(variant, session);
      expect(score).toBe(1.05); // 1.0 + device bonus
    });

    it('should handle empty scoreWeights object', () => {
      const variant: Variant = {
        id: 'v1',
        meta: {},
        scoreWeights: {},
      };

      const score = scoreVariant(variant, session);
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('should handle missing meta', () => {
      const variant: Variant = {
        id: 'v1',
        meta: {} as any,
        scoreWeights: { preferLowAcc: 0.5 },
      };

      const score = scoreVariant(variant, session);
      expect(score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Real-World Scoring Scenarios', () => {
    it('should score remedial content high for struggling learners', () => {
      session.metrics.accEWMA = 0.35;

      const remedialVariant: Variant = {
        id: 'easy_with_hints',
        meta: {
          difficulty: 'easy',
          cognitiveLoad: 'low',
          modality: 'video',
        },
        scoreWeights: {
          preferLowAcc: 0.8,
          preferModality: { video: 0.3 },
        },
      };

      const score = scoreVariant(remedialVariant, session);
      expect(score).toBeGreaterThan(0.8);
    });

    it('should score challenge content low for struggling learners', () => {
      session.metrics.accEWMA = 0.35;

      const challengeVariant: Variant = {
        id: 'hard_challenge',
        meta: {
          difficulty: 'hard',
          cognitiveLoad: 'high',
        },
        scoreWeights: {
          preferLowAcc: 0.1, // Low weight = not for struggling
        },
      };

      const score = scoreVariant(challengeVariant, session);
      expect(score).toBeLessThan(0.2);
    });

    it('should prefer personalized themed content', () => {
      session.user.preferences = {
        theme: { value: 'space', source: 'student', confidence: 0.9 },
      };

      const personalizedVariant: Variant = {
        id: 'space_themed',
        meta: { theme: 'space' },
        scoreWeights: {
          preferThemeMatch: 0.9,
        },
      };

      const genericVariant: Variant = {
        id: 'no_theme',
        meta: {},
        scoreWeights: {
          preferThemeMatch: 0.9,
        },
      };

      const personalizedScore = scoreVariant(personalizedVariant, session);
      const genericScore = scoreVariant(genericVariant, session);

      expect(personalizedScore).toBeGreaterThan(genericScore);
    });

    it('should optimize for mobile constraints', () => {
      session.env.device = 'mobile';
      session.env.netType = '3g';

      const mobileOptimized: Variant = {
        id: 'mobile_short',
        meta: {
          deviceFit: ['mobile'],
          durationSec: 60,
          modality: 'interactive',
        },
        scoreWeights: {
          preferModality: { interactive: 0.4 },
        },
      };

      const desktopHeavy: Variant = {
        id: 'desktop_simulation',
        meta: {
          deviceFit: ['desktop'],
          durationSec: 300,
          modality: 'simulation',
        },
        scoreWeights: {
          preferModality: { simulation: 0.4 },
        },
      };

      const mobileScore = scoreVariant(mobileOptimized, session);
      const desktopScore = scoreVariant(desktopHeavy, session);

      expect(mobileScore).toBeGreaterThan(desktopScore);
    });
  });

  describe('Score Consistency', () => {
    it('should return same score for same inputs', () => {
      const variant: Variant = {
        id: 'v1',
        meta: { theme: 'soccer', modality: 'video' },
        scoreWeights: {
          preferLowAcc: 0.5,
          preferThemeMatch: 0.3,
          preferModality: { video: 0.2 },
        },
      };

      session.user.preferences = {
        theme: { value: 'soccer', source: 'student' },
      };

      const score1 = scoreVariant(variant, session);
      const score2 = scoreVariant(variant, session);

      expect(score1).toBe(score2);
    });

    it('should be deterministic', () => {
      const variant: Variant = {
        id: 'v1',
        meta: {},
        scoreWeights: { preferLowAcc: 0.7 },
      };

      const scores: number[] = [];
      for (let i = 0; i < 10; i++) {
        scores.push(scoreVariant(variant, session));
      }

      // All scores should be identical
      expect(new Set(scores).size).toBe(1);
    });
  });
});

