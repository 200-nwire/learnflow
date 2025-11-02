/**
 * Tests for signal system
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { 
  SignalFactory, 
  SignalBuffer,
  createSnapshot,
  selectVariant,
  type SessionSnapshot,
  type Slot,
  type Policy,
} from '../src/index.js';

describe('Signal System', () => {
  let factory: SignalFactory;
  let buffer: SignalBuffer;
  let session: SessionSnapshot;

  beforeEach(() => {
    factory = new SignalFactory();
    buffer = new SignalBuffer(10);
    session = createSnapshot({
      ids: { userId: 'u1', courseId: 'c1', lessonId: 'L1', pageId: 'P1', attemptId: 'a1' },
    });
  });

  describe('SignalFactory', () => {
    it('should create variant selected signal', () => {
      const slot: Slot = {
        id: 'test_slot',
        variants: [{ id: 'v1', meta: {} }],
      };
      const policy: Policy = { version: 'v1.0' };
      const result = selectVariant(slot, session, policy);
      
      const signal = factory.createVariantSelectedSignal(session, result, [
        { variantId: 'v1', score: 0.5, guardPassed: true },
      ]);

      expect(signal.type).toBe('variant_selected');
      expect(signal.sessionIds.userId).toBe('u1');
      expect(signal.payload.variantId).toBe('v1');
      expect(signal.synced).toBe(false);
      expect(signal.syncAttempts).toBe(0);
      expect(signal.id).toMatch(/^sig_/);
    });

    it('should create answer submitted signal', () => {
      const signal = factory.createAnswerSubmittedSignal(
        session,
        'quiz_slot',
        'easy_quiz',
        'q1',
        true,
        2500,
        1,
        { choice: 'A' }
      );

      expect(signal.type).toBe('answer_submitted');
      expect(signal.payload.correct).toBe(true);
      expect(signal.payload.timeTakenMs).toBe(2500);
      expect(signal.payload.attempts).toBe(1);
      expect(signal.payload.answer).toEqual({ choice: 'A' });
    });

    it('should create page navigated signal', () => {
      const signal = factory.createPageNavigatedSignal(
        session,
        'page_1',
        'page_2',
        'next',
        15000
      );

      expect(signal.type).toBe('page_navigated');
      expect(signal.payload.fromPageId).toBe('page_1');
      expect(signal.payload.toPageId).toBe('page_2');
      expect(signal.payload.direction).toBe('next');
      expect(signal.payload.timeOnPageMs).toBe(15000);
    });

    it('should create generic signal', () => {
      const signal = factory.createGenericSignal(
        'user_interaction',
        session,
        { action: 'click', target: 'button_1' }
      );

      expect(signal.type).toBe('user_interaction');
      expect(signal.payload).toEqual({ action: 'click', target: 'button_1' });
    });

    it('should generate unique signal IDs', () => {
      const signal1 = factory.createGenericSignal('user_interaction', session, {});
      const signal2 = factory.createGenericSignal('user_interaction', session, {});

      expect(signal1.id).not.toBe(signal2.id);
    });
  });

  describe('SignalBuffer', () => {
    it('should store signals', () => {
      const signal = factory.createGenericSignal('user_interaction', session, {});
      buffer.push(signal);

      expect(buffer.getAll()).toHaveLength(1);
      expect(buffer.getAll()[0]).toEqual(signal);
    });

    it('should respect max size', () => {
      const smallBuffer = new SignalBuffer(3);
      
      for (let i = 0; i < 5; i++) {
        const signal = factory.createGenericSignal('user_interaction', session, { index: i });
        smallBuffer.push(signal);
      }

      expect(smallBuffer.getAll()).toHaveLength(3);
    });

    it('should get unsynced signals', () => {
      const signal1 = factory.createGenericSignal('user_interaction', session, {});
      const signal2 = factory.createGenericSignal('user_interaction', session, {});
      signal2.synced = true;

      buffer.push(signal1);
      buffer.push(signal2);

      const unsynced = buffer.getUnsynced();
      expect(unsynced).toHaveLength(1);
      expect(unsynced[0].id).toBe(signal1.id);
    });

    it('should mark signal as synced', () => {
      const signal = factory.createGenericSignal('user_interaction', session, {});
      buffer.push(signal);

      buffer.markSynced(signal.id);

      expect(buffer.getAll()[0].synced).toBe(true);
      expect(buffer.getUnsynced()).toHaveLength(0);
    });

    it('should increment sync attempts', () => {
      const signal = factory.createGenericSignal('user_interaction', session, {});
      buffer.push(signal);

      buffer.incrementSyncAttempt(signal.id);
      buffer.incrementSyncAttempt(signal.id);

      expect(buffer.getAll()[0].syncAttempts).toBe(2);
    });

    it('should clear all signals', () => {
      buffer.push(factory.createGenericSignal('user_interaction', session, {}));
      buffer.push(factory.createGenericSignal('user_interaction', session, {}));

      buffer.clear();

      expect(buffer.getAll()).toHaveLength(0);
    });

    it('should provide summary statistics', () => {
      const signal1 = factory.createGenericSignal('user_interaction', session, {});
      const signal2 = factory.createAnswerSubmittedSignal(session, 's1', 'v1', 'q1', true, 1000, 1, {});
      signal2.synced = true;
      const signal3 = factory.createPageNavigatedSignal(session, 'p1', 'p2', 'next', 5000);

      buffer.push(signal1);
      buffer.push(signal2);
      buffer.push(signal3);

      const summary = buffer.getSummary();

      expect(summary.total).toBe(3);
      expect(summary.synced).toBe(1);
      expect(summary.unsynced).toBe(2);
      expect(summary.byType['user_interaction']).toBe(1);
      expect(summary.byType['answer_submitted']).toBe(1);
      expect(summary.byType['page_navigated']).toBe(1);
    });
  });

  describe('Signal Integration', () => {
    it('should create complete workflow signals', () => {
      // Session start
      const startSignal = factory.createGenericSignal('session_started', session, {
        timestamp: Date.now(),
      });
      buffer.push(startSignal);

      // Variant selection
      const slot: Slot = {
        id: 'intro_slot',
        variants: [{ id: 'v1', meta: {} }],
      };
      const policy: Policy = { version: 'v1.0' };
      const result = selectVariant(slot, session, policy);
      
      const selectionSignal = factory.createVariantSelectedSignal(session, result, [
        { variantId: 'v1', score: 0.5, guardPassed: true },
      ]);
      buffer.push(selectionSignal);

      // Answer submission
      const answerSignal = factory.createAnswerSubmittedSignal(
        session,
        'intro_slot',
        'v1',
        'q1',
        true,
        3000,
        1,
        { answer: 'correct' }
      );
      buffer.push(answerSignal);

      // Page navigation
      const navSignal = factory.createPageNavigatedSignal(
        session,
        'page_1',
        'page_2',
        'next',
        10000
      );
      buffer.push(navSignal);

      const all = buffer.getAll();
      expect(all).toHaveLength(4);
      expect(all[0].type).toBe('session_started');
      expect(all[1].type).toBe('variant_selected');
      expect(all[2].type).toBe('answer_submitted');
      expect(all[3].type).toBe('page_navigated');
    });
  });
});

