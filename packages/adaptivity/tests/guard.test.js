/**
 * Comprehensive tests for guard evaluation
 */
import { describe, it, expect } from 'vitest';
import { createJsGuardEvaluator } from '../src/guard.js';
import { createCelGuardEvaluator, validateCelExpression, CEL_TEMPLATES } from '../src/cel-guard.js';
import { createSnapshot } from '../src/session.js';
describe('Guard System', () => {
    let session;
    let activation;
    beforeEach(() => {
        session = createSnapshot({
            ids: { userId: 'u1', courseId: 'c1', lessonId: 'L1', pageId: 'P1' },
            metrics: { accEWMA: 0.75, latencyEWMA: 2000, idleSec: 0, streak: 3, fatigue: 0.2, attempts: 5 },
        });
        const variant = {
            id: 'test_variant',
            meta: { difficulty: 'std' },
        };
        activation = {
            ctx: session,
            slotId: 'test_slot',
            variant,
        };
    });
    describe('JS Guard Evaluator', () => {
        it('should return true for undefined guard', () => {
            const evaluator = createJsGuardEvaluator();
            const fn = evaluator(undefined);
            expect(fn(activation)).toBe(true);
        });
        it('should return true for null guard', () => {
            const evaluator = createJsGuardEvaluator();
            const fn = evaluator(null);
            expect(fn(activation)).toBe(true);
        });
        it('should return true for empty string guard', () => {
            const evaluator = createJsGuardEvaluator();
            const fn = evaluator('');
            expect(fn(activation)).toBe(true);
        });
        it('should evaluate simple true expression', () => {
            const evaluator = createJsGuardEvaluator();
            const fn = evaluator('true');
            expect(fn(activation)).toBe(true);
        });
        it('should evaluate simple false expression', () => {
            const evaluator = createJsGuardEvaluator();
            const fn = evaluator('false');
            expect(fn(activation)).toBe(false);
        });
        it('should accept function guard directly', () => {
            const evaluator = createJsGuardEvaluator();
            const guardFn = () => true;
            const fn = evaluator(guardFn);
            expect(fn(activation)).toBe(true);
        });
        it('should evaluate accuracy-based guard', () => {
            const evaluator = createJsGuardEvaluator();
            // Test low accuracy
            const lowAccGuard = evaluator('ctx.metrics.accEWMA < 0.7');
            expect(lowAccGuard(activation)).toBe(false); // Session has 0.75
            session.metrics.accEWMA = 0.5;
            expect(lowAccGuard(activation)).toBe(true);
        });
        it('should evaluate streak-based guard', () => {
            const evaluator = createJsGuardEvaluator();
            const streakGuard = evaluator('ctx.metrics.streak >= 3');
            expect(streakGuard(activation)).toBe(true); // Session has streak 3
            session.metrics.streak = 2;
            expect(streakGuard(activation)).toBe(false);
        });
        it('should evaluate device-based guard', () => {
            const evaluator = createJsGuardEvaluator();
            const mobileGuard = evaluator('ctx.env.device === "mobile"');
            expect(mobileGuard(activation)).toBe(false); // Default is desktop
            session.env.device = 'mobile';
            expect(mobileGuard(activation)).toBe(true);
        });
        it('should evaluate language-based guard', () => {
            const evaluator = createJsGuardEvaluator();
            const hebrewGuard = evaluator('ctx.user.lang === "he"');
            expect(hebrewGuard(activation)).toBe(true); // Default is he
            session.user.lang = 'en';
            expect(hebrewGuard(activation)).toBe(false);
        });
        it('should evaluate complex AND expressions', () => {
            const evaluator = createJsGuardEvaluator();
            const complexGuard = evaluator('ctx.metrics.accEWMA > 0.7 && ctx.metrics.streak >= 3');
            expect(complexGuard(activation)).toBe(true);
            session.metrics.streak = 1;
            expect(complexGuard(activation)).toBe(false);
        });
        it('should evaluate complex OR expressions', () => {
            const evaluator = createJsGuardEvaluator();
            const complexGuard = evaluator('ctx.metrics.accEWMA < 0.5 || ctx.metrics.attempts > 10');
            expect(complexGuard(activation)).toBe(false);
            session.metrics.attempts = 15;
            expect(complexGuard(activation)).toBe(true);
        });
        it('should cache compiled guards', () => {
            const evaluator = createJsGuardEvaluator();
            const guard = 'ctx.metrics.accEWMA > 0.5';
            const fn1 = evaluator(guard);
            const fn2 = evaluator(guard);
            // Should return same function instance (cached)
            expect(fn1).toBe(fn2);
        });
        it('should handle malformed expressions gracefully', () => {
            const evaluator = createJsGuardEvaluator();
            const badGuard = evaluator('this is not valid javascript!');
            expect(() => badGuard(activation)).not.toThrow();
            expect(badGuard(activation)).toBe(false);
        });
        it('should handle undefined context properties', () => {
            const evaluator = createJsGuardEvaluator();
            const guard = evaluator('ctx.nonExistent.property === "value"');
            expect(() => guard(activation)).not.toThrow();
            expect(guard(activation)).toBe(false);
        });
        it('should access variant properties', () => {
            const evaluator = createJsGuardEvaluator();
            const guard = evaluator('variant.meta.difficulty === "std"');
            expect(guard(activation)).toBe(true);
        });
        it('should access slot ID', () => {
            const evaluator = createJsGuardEvaluator();
            const guard = evaluator('slotId === "test_slot"');
            expect(guard(activation)).toBe(true);
        });
        it('should evaluate nested property access', () => {
            session.user.preferences = {
                theme: { value: 'soccer', source: 'student' },
            };
            const evaluator = createJsGuardEvaluator();
            const guard = evaluator('ctx.user.preferences.theme.value === "soccer"');
            expect(guard(activation)).toBe(true);
        });
        it('should handle comparison operators', () => {
            const evaluator = createJsGuardEvaluator();
            expect(evaluator('ctx.metrics.accEWMA > 0.5')(activation)).toBe(true);
            expect(evaluator('ctx.metrics.accEWMA < 1.0')(activation)).toBe(true);
            expect(evaluator('ctx.metrics.accEWMA >= 0.75')(activation)).toBe(true);
            expect(evaluator('ctx.metrics.accEWMA <= 0.75')(activation)).toBe(true);
            expect(evaluator('ctx.metrics.attempts === 5')(activation)).toBe(true);
            expect(evaluator('ctx.metrics.attempts !== 10')(activation)).toBe(true);
        });
    });
    describe('CEL Guard Evaluator', () => {
        it('should work like JS evaluator', () => {
            const evaluator = createCelGuardEvaluator();
            const guard = evaluator('ctx.metrics.accEWMA < 0.8');
            expect(guard(activation)).toBe(true);
        });
        it('should handle complex expressions', () => {
            const evaluator = createCelGuardEvaluator();
            const guard = evaluator('ctx.metrics.accEWMA > 0.7 && ctx.env.device === "desktop"');
            expect(guard(activation)).toBe(true);
        });
    });
    describe('CEL Templates', () => {
        it('should have lowAccuracy template', () => {
            expect(CEL_TEMPLATES.lowAccuracy).toBe('ctx.metrics.accEWMA < 0.7');
        });
        it('should have highAccuracy template', () => {
            expect(CEL_TEMPLATES.highAccuracy).toBe('ctx.metrics.accEWMA >= 0.8');
        });
        it('should have struggling template', () => {
            expect(CEL_TEMPLATES.struggling).toBe('ctx.metrics.attempts > 2 && ctx.metrics.streak == 0');
        });
        it('should have onStreak template', () => {
            expect(CEL_TEMPLATES.onStreak).toBe('ctx.metrics.streak >= 3');
        });
        it('should have preferredTheme function template', () => {
            const guard = CEL_TEMPLATES.preferredTheme('soccer');
            expect(guard).toBe('ctx.user.preferences.theme.value == \'soccer\'');
        });
        it('should have preferredModality function template', () => {
            const guard = CEL_TEMPLATES.preferredModality('video');
            expect(guard).toBe('ctx.user.preferences.modalityBias.value == \'video\'');
        });
        it('should have device templates', () => {
            expect(CEL_TEMPLATES.mobileOnly).toBe('ctx.env.device == \'mobile\'');
            expect(CEL_TEMPLATES.desktopOnly).toBe('ctx.env.device == \'desktop\'');
        });
        it('should have language templates', () => {
            expect(CEL_TEMPLATES.hebrew).toBe('ctx.user.lang == \'he\'');
            expect(CEL_TEMPLATES.english).toBe('ctx.user.lang == \'en\'');
        });
        it('should have accessibility templates', () => {
            expect(CEL_TEMPLATES.needsCaptions).toBe('ctx.user.a11y.captions == true');
            expect(CEL_TEMPLATES.needsTranscript).toBe('ctx.user.a11y.transcript == true');
        });
        it('should have complex combination templates', () => {
            expect(CEL_TEMPLATES.strugglingMobileUser).toBe('ctx.metrics.accEWMA < 0.6 && ctx.env.device == \'mobile\'');
            expect(CEL_TEMPLATES.advancedDesktopUser).toBe('ctx.metrics.accEWMA > 0.9 && ctx.env.device == \'desktop\' && ctx.metrics.streak >= 5');
        });
    });
    describe('Guard Validation', () => {
        it('should validate correct expression', () => {
            const result = validateCelExpression('ctx.metrics.accEWMA < 0.7');
            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
        });
        it('should invalidate malformed expression', () => {
            const result = validateCelExpression('this is not valid!!!');
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
        });
        it('should validate complex expressions', () => {
            const result = validateCelExpression('ctx.metrics.accEWMA > 0.5 && ctx.env.device === "mobile"');
            expect(result.valid).toBe(true);
        });
    });
    describe('Real-World Guard Scenarios', () => {
        it('should detect struggling mobile learner', () => {
            session.metrics.accEWMA = 0.55;
            session.env.device = 'mobile';
            const evaluator = createJsGuardEvaluator();
            const guard = evaluator(CEL_TEMPLATES.strugglingMobileUser);
            expect(guard(activation)).toBe(true);
        });
        it('should detect advanced desktop user', () => {
            session.metrics.accEWMA = 0.95;
            session.metrics.streak = 7;
            session.env.device = 'desktop';
            const evaluator = createJsGuardEvaluator();
            const guard = evaluator(CEL_TEMPLATES.advancedDesktopUser);
            expect(guard(activation)).toBe(true);
        });
        it('should handle accessibility requirements', () => {
            session.user.a11y = {
                captions: true,
                transcript: false,
            };
            const evaluator = createJsGuardEvaluator();
            const captionsGuard = evaluator(CEL_TEMPLATES.needsCaptions);
            const transcriptGuard = evaluator(CEL_TEMPLATES.needsTranscript);
            expect(captionsGuard(activation)).toBe(true);
            expect(transcriptGuard(activation)).toBe(false);
        });
        it('should combine multiple conditions', () => {
            session.metrics.accEWMA = 0.6;
            session.metrics.attempts = 8;
            session.metrics.streak = 0;
            session.env.device = 'mobile';
            const evaluator = createJsGuardEvaluator();
            const complexGuard = evaluator('(ctx.metrics.accEWMA < 0.7 || ctx.metrics.attempts > 5) && ctx.metrics.streak === 0 && ctx.env.device === "mobile"');
            expect(complexGuard(activation)).toBe(true);
        });
    });
});
