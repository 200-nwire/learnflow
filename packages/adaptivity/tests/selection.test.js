/**
 * Comprehensive tests for adaptive variant selection
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createSnapshot, selectVariant, updateAccuracyEWMA, setPreferenceTheme, CEL_TEMPLATES } from '../src/index.js';
describe('Adaptive Variant Selection', () => {
    let session;
    let policy;
    beforeEach(() => {
        session = createSnapshot({
            ids: { userId: 'test_user', courseId: 'test_course', lessonId: 'lesson_1', pageId: 'page_1' },
            user: { lang: 'en' },
            metrics: { accEWMA: 0.75, latencyEWMA: 2000, idleSec: 0, streak: 2, fatigue: 0, attempts: 5 },
        });
        policy = { version: 'v1.0.0' };
    });
    describe('Basic Selection', () => {
        it('should select variant based on guards', () => {
            const slot = {
                id: 'test_slot',
                variants: [
                    {
                        id: 'easy_variant',
                        meta: { difficulty: 'easy' },
                        guard: 'ctx.metrics.accEWMA < 0.7',
                    },
                    {
                        id: 'standard_variant',
                        meta: { difficulty: 'std' },
                        guard: 'ctx.metrics.accEWMA >= 0.7 && ctx.metrics.accEWMA < 0.9',
                    },
                    {
                        id: 'hard_variant',
                        meta: { difficulty: 'hard' },
                        guard: 'ctx.metrics.accEWMA >= 0.9',
                    },
                ],
                fallbackVariantId: 'standard_variant',
            };
            const result = selectVariant(slot, session, policy, { trace: true });
            expect(result.variantId).toBe('standard_variant');
            expect(result.why.policyVersion).toBe('v1.0.0');
            expect(result.why.guards['standard_variant']).toBe(true);
        });
        it('should use fallback when no guards pass', () => {
            const slot = {
                id: 'test_slot',
                variants: [
                    {
                        id: 'impossible_variant',
                        meta: { difficulty: 'hard' },
                        guard: 'ctx.metrics.accEWMA > 1.0', // Impossible condition
                    },
                ],
                fallbackVariantId: 'impossible_variant',
            };
            const result = selectVariant(slot, session, policy);
            expect(result.variantId).toBe('impossible_variant');
        });
        it('should include trace information when requested', () => {
            const slot = {
                id: 'test_slot',
                variants: [
                    { id: 'v1', meta: { difficulty: 'easy' }, scoreWeights: { preferLowAcc: 0.5 } },
                    { id: 'v2', meta: { difficulty: 'std' }, scoreWeights: { preferLowAcc: 0.3 } },
                ],
            };
            const result = selectVariant(slot, session, policy, { trace: true });
            expect(result.why.guards).toBeDefined();
            expect(result.why.score).toBeDefined();
            expect(Object.keys(result.why.score)).toHaveLength(2);
        });
    });
    describe('Scoring System', () => {
        it('should prefer variants with higher scores', () => {
            const slot = {
                id: 'test_slot',
                variants: [
                    {
                        id: 'low_score',
                        meta: { difficulty: 'easy' },
                        scoreWeights: { preferLowAcc: 0.1 },
                    },
                    {
                        id: 'high_score',
                        meta: { difficulty: 'std' },
                        scoreWeights: { preferLowAcc: 0.9 },
                    },
                ],
            };
            // Set low accuracy to trigger preferLowAcc scoring
            session.metrics.accEWMA = 0.4;
            const result = selectVariant(slot, session, policy, { trace: true });
            expect(result.variantId).toBe('high_score');
            expect(result.why.score['high_score']).toBeGreaterThan(result.why.score['low_score']);
        });
        it('should match theme preferences', () => {
            setPreferenceTheme(session, 'soccer', 'student');
            const slot = {
                id: 'test_slot',
                variants: [
                    {
                        id: 'soccer_theme',
                        meta: { theme: 'soccer' },
                        scoreWeights: { preferThemeMatch: 1.0 },
                    },
                    {
                        id: 'music_theme',
                        meta: { theme: 'music' },
                        scoreWeights: { preferThemeMatch: 1.0 },
                    },
                ],
            };
            const result = selectVariant(slot, session, policy, { trace: true });
            expect(result.variantId).toBe('soccer_theme');
        });
        it('should consider modality preferences', () => {
            const slot = {
                id: 'test_slot',
                variants: [
                    {
                        id: 'video_variant',
                        meta: { modality: 'video' },
                        scoreWeights: { preferModality: { video: 0.8 } },
                    },
                    {
                        id: 'reading_variant',
                        meta: { modality: 'reading' },
                        scoreWeights: { preferModality: { reading: 0.2 } },
                    },
                ],
            };
            const result = selectVariant(slot, session, policy, { trace: true });
            expect(result.why.score['video_variant']).toBeGreaterThan(result.why.score['reading_variant']);
        });
    });
    describe('Device Filtering', () => {
        it('should filter variants by device compatibility', () => {
            session.env.device = 'mobile';
            const slot = {
                id: 'test_slot',
                variants: [
                    {
                        id: 'mobile_variant',
                        meta: { deviceFit: ['mobile'] },
                    },
                    {
                        id: 'desktop_only',
                        meta: { deviceFit: ['desktop'] },
                    },
                ],
                fallbackVariantId: 'mobile_variant',
            };
            const result = selectVariant(slot, session, policy, { trace: true });
            expect(result.variantId).toBe('mobile_variant');
        });
        it('should allow multi-device variants', () => {
            const slot = {
                id: 'test_slot',
                variants: [
                    {
                        id: 'universal',
                        meta: { deviceFit: ['mobile', 'desktop', 'tablet'] },
                    },
                ],
            };
            const result = selectVariant(slot, session, policy);
            expect(result.variantId).toBe('universal');
        });
    });
    describe('Language Filtering', () => {
        it('should filter by language', () => {
            session.user.lang = 'he';
            const slot = {
                id: 'test_slot',
                variants: [
                    { id: 'hebrew_content', meta: { language: 'he' } },
                    { id: 'english_content', meta: { language: 'en' } },
                ],
                fallbackVariantId: 'hebrew_content',
            };
            const result = selectVariant(slot, session, policy);
            expect(result.variantId).toBe('hebrew_content');
        });
    });
    describe('Sticky Behavior', () => {
        it('should retain sticky choice on subsequent selections', () => {
            const slot = {
                id: 'sticky_slot',
                variants: [
                    { id: 'v1', meta: {}, sticky: { scope: 'lesson', strength: 'strong' } },
                    { id: 'v2', meta: {} },
                ],
            };
            // First selection
            const result1 = selectVariant(slot, session, policy);
            const firstChoice = result1.variantId;
            // Change session context drastically
            session.metrics.accEWMA = 0.1;
            session.metrics.attempts = 20;
            // Second selection should stick
            const result2 = selectVariant(slot, session, policy);
            expect(result2.variantId).toBe(firstChoice);
            expect(result2.why.stickyUsed).toBe(true);
        });
        it('should respect sticky scope', () => {
            const slot = {
                id: 'test_slot',
                variants: [
                    {
                        id: 'session_sticky',
                        meta: {},
                        sticky: { scope: 'session', strength: 'strong' }
                    },
                ],
            };
            const result = selectVariant(slot, session, policy);
            expect(session.sticky[slot.id].scope).toBe('session');
        });
    });
    describe('Overrides', () => {
        it('should respect force variant override', () => {
            session.overrides = {
                forceVariant: {
                    'test_slot': 'forced_variant',
                },
            };
            const slot = {
                id: 'test_slot',
                variants: [
                    { id: 'normal_variant', meta: {} },
                    { id: 'forced_variant', meta: {} },
                ],
            };
            const result = selectVariant(slot, session, policy);
            expect(result.variantId).toBe('forced_variant');
            expect(result.why.overridesUsed).toBe(true);
        });
    });
    describe('CEL Guards', () => {
        it('should use low accuracy template', () => {
            session.metrics.accEWMA = 0.5;
            const slot = {
                id: 'test_slot',
                variants: [
                    { id: 'easy', meta: {}, guard: CEL_TEMPLATES.lowAccuracy },
                    { id: 'hard', meta: {}, guard: CEL_TEMPLATES.highAccuracy },
                ],
                fallbackVariantId: 'easy',
            };
            const result = selectVariant(slot, session, policy, { trace: true });
            expect(result.variantId).toBe('easy');
            expect(result.why.guards['easy']).toBe(true);
        });
        it('should use streak template', () => {
            session.metrics.streak = 5;
            const slot = {
                id: 'test_slot',
                variants: [
                    { id: 'bonus', meta: {}, guard: CEL_TEMPLATES.onStreak },
                    { id: 'regular', meta: {}, guard: 'true' },
                ],
            };
            const result = selectVariant(slot, session, policy, { trace: true });
            expect(result.variantId).toBe('bonus');
        });
        it('should use struggling learner template', () => {
            session.metrics.accEWMA = 0.55;
            session.env.device = 'mobile';
            const slot = {
                id: 'test_slot',
                variants: [
                    { id: 'mobile_help', meta: {}, guard: CEL_TEMPLATES.strugglingMobileUser },
                    { id: 'standard', meta: {}, guard: 'true' },
                ],
            };
            const result = selectVariant(slot, session, policy, { trace: true });
            expect(result.variantId).toBe('mobile_help');
        });
    });
    describe('Session Updates', () => {
        it('should update accuracy EWMA correctly', () => {
            const initialAcc = session.metrics.accEWMA;
            updateAccuracyEWMA(session, true);
            expect(session.metrics.accEWMA).toBeGreaterThan(initialAcc);
            const afterCorrect = session.metrics.accEWMA;
            updateAccuracyEWMA(session, false);
            expect(session.metrics.accEWMA).toBeLessThan(afterCorrect);
        });
        it('should update streak on correct answers', () => {
            const initialStreak = session.metrics.streak;
            updateAccuracyEWMA(session, true);
            expect(session.metrics.streak).toBe(initialStreak + 1);
        });
        it('should reset streak on wrong answers', () => {
            session.metrics.streak = 5;
            updateAccuracyEWMA(session, false);
            expect(session.metrics.streak).toBe(0);
        });
        it('should increment attempts', () => {
            const initialAttempts = session.metrics.attempts;
            updateAccuracyEWMA(session, true);
            expect(session.metrics.attempts).toBe(initialAttempts + 1);
        });
    });
    describe('Edge Cases', () => {
        it('should handle empty variants array gracefully', () => {
            const slot = {
                id: 'empty_slot',
                variants: [],
            };
            expect(() => selectVariant(slot, session, policy)).toThrow();
        });
        it('should handle malformed guard expressions', () => {
            const slot = {
                id: 'test_slot',
                variants: [
                    { id: 'v1', meta: {}, guard: 'invalid javascript code here!' },
                    { id: 'v2', meta: {}, guard: 'true' },
                ],
            };
            // Should not throw, fallback to next variant
            const result = selectVariant(slot, session, policy, { trace: true });
            expect(result.why.guards['v1']).toBe(false);
            expect(result.variantId).toBe('v2');
        });
        it('should handle missing meta properties', () => {
            const slot = {
                id: 'test_slot',
                variants: [
                    { id: 'v1', meta: {} },
                ],
            };
            const result = selectVariant(slot, session, policy);
            expect(result.variantId).toBe('v1');
        });
    });
    describe('Complex Scenarios', () => {
        it('should handle multi-criteria selection', () => {
            session.metrics.accEWMA = 0.6;
            session.env.device = 'mobile';
            setPreferenceTheme(session, 'soccer', 'student');
            const slot = {
                id: 'complex_slot',
                variants: [
                    {
                        id: 'perfect_match',
                        meta: {
                            difficulty: 'easy',
                            theme: 'soccer',
                            deviceFit: ['mobile'],
                            modality: 'interactive'
                        },
                        guard: 'ctx.metrics.accEWMA < 0.7 && ctx.env.device === "mobile"',
                        scoreWeights: {
                            preferLowAcc: 0.5,
                            preferThemeMatch: 0.4,
                            preferModality: { interactive: 0.3 }
                        },
                    },
                    {
                        id: 'partial_match',
                        meta: { difficulty: 'std', theme: 'music' },
                        scoreWeights: { preferThemeMatch: 0.2 },
                    },
                ],
            };
            const result = selectVariant(slot, session, policy, { trace: true });
            expect(result.variantId).toBe('perfect_match');
            expect(result.why.score['perfect_match']).toBeGreaterThan(result.why.score['partial_match']);
        });
    });
});
