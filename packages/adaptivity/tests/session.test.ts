/**
 * Comprehensive tests for session management
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  createSnapshot,
  updateAccuracyEWMA,
  updateLatencyEWMA,
  bumpIdle,
  setPreferenceTheme,
  type SessionSnapshot,
} from '../src/index.js';

describe('Session Management', () => {
  let session: SessionSnapshot;

  beforeEach(() => {
    session = createSnapshot({
      ids: { userId: 'u1', courseId: 'c1', lessonId: 'L1', pageId: 'P1' },
    });
  });

  describe('createSnapshot', () => {
    it('should create snapshot with default values', () => {
      const snapshot = createSnapshot({});
      
      expect(snapshot.ids.userId).toBe('');
      expect(snapshot.ids.courseId).toBe('');
      expect(snapshot.ids.lessonId).toBe('');
      expect(snapshot.ids.pageId).toBe('');
      expect(snapshot.user.lang).toBe('he');
      expect(snapshot.env.device).toBe('desktop');
      expect(snapshot.env.online).toBe(true);
      expect(snapshot.metrics.accEWMA).toBe(1);
      expect(snapshot.metrics.latencyEWMA).toBe(1000);
      expect(snapshot.metrics.idleSec).toBe(0);
      expect(snapshot.metrics.streak).toBe(0);
      expect(snapshot.metrics.fatigue).toBe(0);
      expect(snapshot.metrics.attempts).toBe(0);
    });

    it('should merge provided values', () => {
      const snapshot = createSnapshot({
        ids: { userId: 'test_user', courseId: 'test_course', lessonId: 'L1', pageId: 'P1' },
        user: { lang: 'en' },
        metrics: { accEWMA: 0.5, streak: 5, attempts: 10, latencyEWMA: 2000, idleSec: 0, fatigue: 0 },
      });
      
      expect(snapshot.ids.userId).toBe('test_user');
      expect(snapshot.ids.courseId).toBe('test_course');
      expect(snapshot.user.lang).toBe('en');
      expect(snapshot.metrics.accEWMA).toBe(0.5);
      expect(snapshot.metrics.streak).toBe(5);
      expect(snapshot.metrics.attempts).toBe(10);
    });

    it('should initialize empty collections', () => {
      const snapshot = createSnapshot({});
      
      expect(snapshot.perSkill).toEqual({});
      expect(snapshot.sticky).toEqual({});
      expect(snapshot.seenVariants).toEqual({});
      expect(snapshot.trace).toEqual([]);
    });

    it('should preserve provided collections', () => {
      const perSkill = { skill1: { accEWMA: 0.8, attempts: 5, lastTs: Date.now() } };
      const sticky = { slot1: { variantId: 'v1', at: Date.now(), scope: 'lesson' as const, strength: 'weak' as const, reason: 'first_pick' as const } };
      
      const snapshot = createSnapshot({
        perSkill,
        sticky,
      });
      
      expect(snapshot.perSkill).toEqual(perSkill);
      expect(snapshot.sticky).toEqual(sticky);
    });

    it('should set accessibility defaults', () => {
      const snapshot = createSnapshot({});
      
      expect(snapshot.user.a11y?.captions).toBe(true);
      expect(snapshot.user.a11y?.transcript).toBe(false);
    });
  });

  describe('updateAccuracyEWMA', () => {
    beforeEach(() => {
      session.metrics.accEWMA = 0.75;
      session.metrics.streak = 2;
      session.metrics.attempts = 5;
    });

    it('should increase accuracy on correct answer', () => {
      const before = session.metrics.accEWMA;
      updateAccuracyEWMA(session, true);
      expect(session.metrics.accEWMA).toBeGreaterThan(before);
    });

    it('should decrease accuracy on wrong answer', () => {
      const before = session.metrics.accEWMA;
      updateAccuracyEWMA(session, false);
      expect(session.metrics.accEWMA).toBeLessThan(before);
    });

    it('should increment streak on correct answer', () => {
      updateAccuracyEWMA(session, true);
      expect(session.metrics.streak).toBe(3);
      
      updateAccuracyEWMA(session, true);
      expect(session.metrics.streak).toBe(4);
    });

    it('should reset streak on wrong answer', () => {
      session.metrics.streak = 5;
      updateAccuracyEWMA(session, false);
      expect(session.metrics.streak).toBe(0);
    });

    it('should increment attempts on every update', () => {
      const before = session.metrics.attempts;
      
      updateAccuracyEWMA(session, true);
      expect(session.metrics.attempts).toBe(before + 1);
      
      updateAccuracyEWMA(session, false);
      expect(session.metrics.attempts).toBe(before + 2);
    });

    it('should use custom alpha parameter', () => {
      session.metrics.accEWMA = 0.5;
      
      // High alpha (0.9) = slower change
      updateAccuracyEWMA(session, true, 0.9);
      const withHighAlpha = session.metrics.accEWMA;
      
      session.metrics.accEWMA = 0.5;
      
      // Low alpha (0.5) = faster change
      updateAccuracyEWMA(session, true, 0.5);
      const withLowAlpha = session.metrics.accEWMA;
      
      expect(withLowAlpha).toBeGreaterThan(withHighAlpha);
    });

    it('should handle edge case: perfect accuracy', () => {
      session.metrics.accEWMA = 1.0;
      updateAccuracyEWMA(session, true);
      expect(session.metrics.accEWMA).toBeLessThanOrEqual(1.0);
    });

    it('should handle edge case: zero accuracy', () => {
      session.metrics.accEWMA = 0.0;
      updateAccuracyEWMA(session, false);
      expect(session.metrics.accEWMA).toBeGreaterThanOrEqual(0.0);
    });

    it('should converge toward 1 with repeated correct answers', () => {
      session.metrics.accEWMA = 0.5;
      
      for (let i = 0; i < 10; i++) {
        updateAccuracyEWMA(session, true);
      }
      
      expect(session.metrics.accEWMA).toBeGreaterThan(0.9);
    });

    it('should converge toward 0 with repeated wrong answers', () => {
      session.metrics.accEWMA = 0.5;
      
      for (let i = 0; i < 10; i++) {
        updateAccuracyEWMA(session, false);
      }
      
      expect(session.metrics.accEWMA).toBeLessThan(0.1);
    });
  });

  describe('updateLatencyEWMA', () => {
    beforeEach(() => {
      session.metrics.latencyEWMA = 2000;
    });

    it('should update latency toward new value', () => {
      updateLatencyEWMA(session, 3000);
      expect(session.metrics.latencyEWMA).toBeGreaterThan(2000);
      expect(session.metrics.latencyEWMA).toBeLessThan(3000);
    });

    it('should clip values to min', () => {
      updateLatencyEWMA(session, 100); // Below default min of 300
      expect(session.metrics.latencyEWMA).toBeLessThan(2000);
      // Should move toward 300, not 100
    });

    it('should clip values to max', () => {
      updateLatencyEWMA(session, 10000); // Above default max of 8000
      expect(session.metrics.latencyEWMA).toBeGreaterThan(2000);
      // Should move toward 8000, not 10000
    });

    it('should use custom alpha', () => {
      updateLatencyEWMA(session, 4000, 0.9);
      const withHighAlpha = session.metrics.latencyEWMA;
      
      session.metrics.latencyEWMA = 2000;
      updateLatencyEWMA(session, 4000, 0.5);
      const withLowAlpha = session.metrics.latencyEWMA;
      
      expect(withLowAlpha).toBeGreaterThan(withHighAlpha);
    });

    it('should use custom clip values', () => {
      updateLatencyEWMA(session, 500, 0.2, { min: 400, max: 600 }); // Lower alpha for faster change
      expect(session.metrics.latencyEWMA).toBeLessThan(2000); // Moving toward 500
      expect(session.metrics.latencyEWMA).toBeGreaterThan(500); // But not all the way
    });
  });

  describe('bumpIdle', () => {
    it('should increase idle time', () => {
      session.metrics.idleSec = 10;
      bumpIdle(session, 5);
      expect(session.metrics.idleSec).toBe(15);
    });

    it('should not go below zero', () => {
      session.metrics.idleSec = 5;
      bumpIdle(session, -10);
      expect(session.metrics.idleSec).toBe(0);
    });

    it('should handle zero delta', () => {
      session.metrics.idleSec = 10;
      bumpIdle(session, 0);
      expect(session.metrics.idleSec).toBe(10);
    });

    it('should handle large values', () => {
      session.metrics.idleSec = 0;
      bumpIdle(session, 3600); // 1 hour
      expect(session.metrics.idleSec).toBe(3600);
    });
  });

  describe('setPreferenceTheme', () => {
    it('should set theme preference with default source', () => {
      setPreferenceTheme(session, 'soccer');
      
      expect(session.user.preferences?.theme?.value).toBe('soccer');
      expect(session.user.preferences?.theme?.source).toBe('student');
    });

    it('should set theme preference with custom source', () => {
      setPreferenceTheme(session, 'music', 'system');
      
      expect(session.user.preferences?.theme?.value).toBe('music');
      expect(session.user.preferences?.theme?.source).toBe('system');
    });

    it('should create preferences object if missing', () => {
      session.user.preferences = undefined;
      setPreferenceTheme(session, 'space');
      
      expect(session.user.preferences).toBeDefined();
      expect(session.user.preferences?.theme?.value).toBe('space');
    });

    it('should override existing theme', () => {
      setPreferenceTheme(session, 'soccer');
      setPreferenceTheme(session, 'music');
      
      expect(session.user.preferences?.theme?.value).toBe('music');
    });

    it('should preserve other preferences', () => {
      session.user.preferences = {
        modalityBias: { value: 'video', source: 'system', confidence: 0.8 },
      };
      
      setPreferenceTheme(session, 'soccer');
      
      expect(session.user.preferences.modalityBias).toBeDefined();
      expect(session.user.preferences.theme?.value).toBe('soccer');
    });
  });

  describe('Real-World Session Scenarios', () => {
    it('should track full learning session', () => {
      // Start fresh
      const learner = createSnapshot({
        ids: { userId: 'student1', courseId: 'math', lessonId: 'fractions', pageId: 'intro' },
      });

      // Answer correctly
      updateAccuracyEWMA(learner, true);
      expect(learner.metrics.streak).toBe(1);
      expect(learner.metrics.attempts).toBe(1);

      // Answer correctly again
      updateAccuracyEWMA(learner, true);
      expect(learner.metrics.streak).toBe(2);
      expect(learner.metrics.attempts).toBe(2);

      // Answer wrong
      updateAccuracyEWMA(learner, false);
      expect(learner.metrics.streak).toBe(0);
      expect(learner.metrics.attempts).toBe(3);

      // Track idle time
      bumpIdle(learner, 30);
      expect(learner.metrics.idleSec).toBe(30);

      // Set preference
      setPreferenceTheme(learner, 'soccer', 'student');
      expect(learner.user.preferences?.theme?.value).toBe('soccer');
    });

    it('should simulate struggling learner', () => {
      const learner = createSnapshot({
        ids: { userId: 'struggling', courseId: 'math', lessonId: 'algebra', pageId: 'p1' },
        metrics: { accEWMA: 0.9, streak: 0, attempts: 0, latencyEWMA: 1000, idleSec: 0, fatigue: 0 },
      });

      // Series of wrong answers
      for (let i = 0; i < 5; i++) {
        updateAccuracyEWMA(learner, false);
      }

      expect(learner.metrics.accEWMA).toBeLessThan(0.5);
      expect(learner.metrics.streak).toBe(0);
      expect(learner.metrics.attempts).toBe(5);
    });

    it('should simulate high performer', () => {
      const learner = createSnapshot({
        ids: { userId: 'excellent', courseId: 'math', lessonId: 'calculus', pageId: 'p1' },
        metrics: { accEWMA: 0.7, streak: 0, attempts: 0, latencyEWMA: 2000, idleSec: 0, fatigue: 0 },
      });

      // Series of correct answers
      for (let i = 0; i < 10; i++) {
        updateAccuracyEWMA(learner, true);
      }

      expect(learner.metrics.accEWMA).toBeGreaterThan(0.95);
      expect(learner.metrics.streak).toBe(10);
      expect(learner.metrics.attempts).toBe(10);
    });
  });
});

