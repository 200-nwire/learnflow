/**
 * Integration tests - real-world end-to-end scenarios
 */
import { describe, it, expect } from 'vitest';
import { createSnapshot, selectVariant, updateAccuracyEWMA, setPreferenceTheme, SignalFactory, SignalBuffer, CEL_TEMPLATES, } from '../src/index.js';
describe('Integration Tests - End-to-End Scenarios', () => {
    const policy = { version: 'v1.0.0' };
    const signalFactory = new SignalFactory();
    describe('Complete Learning Journey', () => {
        it('should adapt through a full lesson with performance tracking', () => {
            // Initialize learner
            const session = createSnapshot({
                ids: {
                    userId: 'student_123',
                    courseId: 'math_101',
                    lessonId: 'fractions',
                    pageId: 'intro',
                    attemptId: 'attempt_001',
                },
                user: { lang: 'en' },
                metrics: { accEWMA: 0.5, streak: 0, attempts: 0, latencyEWMA: 2000, idleSec: 0, fatigue: 0 },
            });
            const signalBuffer = new SignalBuffer(100);
            // Page 1: Introduction - Should get easy content due to low accuracy
            const introSlot = {
                id: 'intro_lesson',
                variants: [
                    {
                        id: 'easy_intro',
                        meta: { difficulty: 'easy', modality: 'video' },
                        guard: CEL_TEMPLATES.lowAccuracy,
                        scoreWeights: { preferLowAcc: 0.8 },
                    },
                    {
                        id: 'std_intro',
                        meta: { difficulty: 'std', modality: 'reading' },
                        guard: 'true',
                    },
                ],
            };
            const intro = selectVariant(introSlot, session, policy, { trace: true });
            expect(intro.variantId).toBe('easy_intro');
            const introSignal = signalFactory.createVariantSelectedSignal(session, intro, introSlot.variants.map(v => ({
                variantId: v.id,
                score: intro.why.score[v.id] || 0,
                guardPassed: intro.why.guards[v.id] ?? true,
            })));
            signalBuffer.push(introSignal);
            // Student performs well on intro
            updateAccuracyEWMA(session, true);
            updateAccuracyEWMA(session, true);
            updateAccuracyEWMA(session, true);
            expect(session.metrics.streak).toBe(3);
            expect(session.metrics.accEWMA).toBeGreaterThan(0.6);
            // Page 2: Practice - Should get standard difficulty now
            session.ids.pageId = 'practice';
            const practiceSlot = {
                id: 'practice_problems',
                variants: [
                    {
                        id: 'easy_practice',
                        meta: { difficulty: 'easy' },
                        guard: CEL_TEMPLATES.lowAccuracy,
                    },
                    {
                        id: 'std_practice',
                        meta: { difficulty: 'std' },
                        guard: 'ctx.metrics.accEWMA >= 0.6 && ctx.metrics.accEWMA < 0.9',
                    },
                    {
                        id: 'hard_practice',
                        meta: { difficulty: 'hard' },
                        guard: CEL_TEMPLATES.highAccuracy,
                    },
                ],
            };
            const practice = selectVariant(practiceSlot, session, policy);
            expect(practice.variantId).toBe('std_practice');
            // More correct answers - building streak
            updateAccuracyEWMA(session, true);
            updateAccuracyEWMA(session, true);
            updateAccuracyEWMA(session, true);
            expect(session.metrics.streak).toBe(6);
            // Page 3: Challenge - Should unlock hard content
            session.ids.pageId = 'challenge';
            const challengeSlot = {
                id: 'challenge_content',
                variants: [
                    {
                        id: 'bonus_challenge',
                        meta: { difficulty: 'hard', modality: 'simulation' },
                        guard: CEL_TEMPLATES.onStreak,
                    },
                    {
                        id: 'regular_content',
                        meta: { difficulty: 'std' },
                        guard: 'true',
                    },
                ],
            };
            const challenge = selectVariant(challengeSlot, session, policy);
            expect(challenge.variantId).toBe('bonus_challenge');
            // Verify signals were logged
            expect(signalBuffer.getAll().length).toBeGreaterThan(0);
            const summary = signalBuffer.getSummary();
            expect(summary.total).toBeGreaterThanOrEqual(1);
        });
    });
    describe('Theme Personalization Journey', () => {
        it('should adapt content theme based on student preference', () => {
            const session = createSnapshot({
                ids: { userId: 'student_456', courseId: 'math', lessonId: 'geometry', pageId: 'p1' },
                metrics: { accEWMA: 0.75, streak: 2, attempts: 5, latencyEWMA: 2000, idleSec: 0, fatigue: 0 },
            });
            // Initial content - no preference set
            const slot = {
                id: 'themed_lesson',
                variants: [
                    {
                        id: 'soccer_theme',
                        meta: { theme: 'soccer', modality: 'video' },
                        scoreWeights: { preferThemeMatch: 0.8 },
                        sticky: { scope: 'lesson', strength: 'strong' },
                    },
                    {
                        id: 'music_theme',
                        meta: { theme: 'music', modality: 'video' },
                        scoreWeights: { preferThemeMatch: 0.8 },
                    },
                    {
                        id: 'space_theme',
                        meta: { theme: 'space', modality: 'video' },
                        scoreWeights: { preferThemeMatch: 0.8 },
                    },
                ],
            };
            const initial = selectVariant(slot, session, policy);
            const firstChoice = initial.variantId;
            // Student indicates preference for soccer
            setPreferenceTheme(session, 'soccer', 'student');
            // Clear sticky to allow re-evaluation
            session.sticky = {};
            // New selection should prefer soccer theme
            const afterPref = selectVariant(slot, session, policy, { trace: true });
            expect(afterPref.variantId).toBe('soccer_theme');
            // Subsequent selections should maintain theme (sticky)
            session.ids.pageId = 'p2';
            const nextPage = selectVariant(slot, session, policy);
            expect(nextPage.variantId).toBe('soccer_theme');
            expect(nextPage.why.stickyUsed).toBe(true);
        });
    });
    describe('Device-Aware Adaptation', () => {
        it('should adapt content for mobile learner', () => {
            const session = createSnapshot({
                ids: { userId: 'mobile_student', courseId: 'science', lessonId: 'physics', pageId: 'p1' },
                user: { lang: 'en' },
                env: { device: 'mobile', online: true, netType: '4g' },
                metrics: { accEWMA: 0.7, streak: 1, attempts: 3, latencyEWMA: 2000, idleSec: 0, fatigue: 0 },
            });
            const slot = {
                id: 'experiment',
                variants: [
                    {
                        id: 'mobile_friendly',
                        meta: {
                            deviceFit: ['mobile', 'tablet'],
                            durationSec: 90,
                            modality: 'interactive',
                        },
                        guard: 'ctx.env.device === "mobile"',
                    },
                    {
                        id: 'desktop_simulation',
                        meta: {
                            deviceFit: ['desktop'],
                            durationSec: 300,
                            modality: 'simulation',
                        },
                        guard: 'ctx.env.device === "desktop"',
                    },
                    {
                        id: 'universal',
                        meta: {
                            deviceFit: ['mobile', 'desktop', 'tablet'],
                            modality: 'reading',
                        },
                        guard: 'true',
                    },
                ],
            };
            const result = selectVariant(slot, session, policy, { trace: true });
            expect(result.variantId).toBe('mobile_friendly');
            expect(result.why.guards['mobile_friendly']).toBe(true);
            expect(result.why.guards['desktop_simulation']).toBe(false);
        });
    });
    describe('Accessibility-Driven Selection', () => {
        it('should provide accessible content for learners with a11y needs', () => {
            const session = createSnapshot({
                ids: { userId: 'a11y_student', courseId: 'history', lessonId: 'wwii', pageId: 'p1' },
                user: {
                    lang: 'en',
                    a11y: {
                        captions: true,
                        transcript: true,
                        dyslexicFont: true,
                        highContrast: true,
                    },
                },
                metrics: { accEWMA: 0.8, streak: 2, attempts: 4, latencyEWMA: 2000, idleSec: 0, fatigue: 0 },
            });
            const slot = {
                id: 'documentary',
                variants: [
                    {
                        id: 'accessible_video',
                        meta: {
                            modality: 'video',
                            accessibility: {
                                captions: true,
                                transcript: true,
                            },
                        },
                        guard: CEL_TEMPLATES.needsCaptions,
                    },
                    {
                        id: 'standard_video',
                        meta: {
                            modality: 'video',
                        },
                        guard: 'true',
                    },
                ],
            };
            const result = selectVariant(slot, session, policy);
            expect(result.variantId).toBe('accessible_video');
        });
    });
    describe('Multi-Page Sticky Behavior', () => {
        it('should maintain variant choices across lesson pages', () => {
            const session = createSnapshot({
                ids: { userId: 'student_789', courseId: 'english', lessonId: 'grammar', pageId: 'page_1' },
                metrics: { accEWMA: 0.75, streak: 1, attempts: 2, latencyEWMA: 2000, idleSec: 0, fatigue: 0 },
            });
            const slot = {
                id: 'lesson_style',
                variants: [
                    {
                        id: 'concise_style',
                        meta: { modality: 'reading' },
                        sticky: { scope: 'lesson', strength: 'strong' },
                    },
                    {
                        id: 'detailed_style',
                        meta: { modality: 'reading' },
                    },
                ],
            };
            // Page 1: Make initial selection
            const page1 = selectVariant(slot, session, policy);
            const chosenStyle = page1.variantId;
            // Page 2: Should maintain choice
            session.ids.pageId = 'page_2';
            const page2 = selectVariant(slot, session, policy);
            expect(page2.variantId).toBe(chosenStyle);
            expect(page2.why.stickyUsed).toBe(true);
            // Page 3: Should still maintain choice
            session.ids.pageId = 'page_3';
            const page3 = selectVariant(slot, session, policy);
            expect(page3.variantId).toBe(chosenStyle);
            // Page 4: Still consistent
            session.ids.pageId = 'page_4';
            const page4 = selectVariant(slot, session, policy);
            expect(page4.variantId).toBe(chosenStyle);
        });
    });
    describe('Teacher Override Scenario', () => {
        it('should respect teacher forced variant', () => {
            const session = createSnapshot({
                ids: { userId: 'student_override', courseId: 'math', lessonId: 'algebra', pageId: 'p1' },
                metrics: { accEWMA: 0.9, streak: 5, attempts: 10, latencyEWMA: 1500, idleSec: 0, fatigue: 0 },
                overrides: {
                    forceVariant: {
                        'remedial_slot': 'easy_with_support',
                    },
                    source: 'teacher',
                },
            });
            const slot = {
                id: 'remedial_slot',
                variants: [
                    {
                        id: 'easy_with_support',
                        meta: { difficulty: 'easy' },
                    },
                    {
                        id: 'standard_content',
                        meta: { difficulty: 'std' },
                    },
                    {
                        id: 'advanced_challenge',
                        meta: { difficulty: 'hard' },
                    },
                ],
            };
            const result = selectVariant(slot, session, policy);
            // Should use teacher's forced variant despite high performance
            expect(result.variantId).toBe('easy_with_support');
            expect(result.why.overridesUsed).toBe(true);
        });
    });
    describe('Complete Signal Workflow', () => {
        it('should track full learning session with signals', () => {
            const session = createSnapshot({
                ids: {
                    userId: 'tracked_student',
                    courseId: 'biology',
                    lessonId: 'cells',
                    pageId: 'intro',
                    attemptId: 'attempt_123',
                },
            });
            const buffer = new SignalBuffer(50);
            const factory = new SignalFactory();
            // Session start signal
            const startSignal = factory.createGenericSignal('session_started', session, {
                timestamp: Date.now(),
            });
            buffer.push(startSignal);
            // Variant selection
            const slot = {
                id: 'cell_structure',
                variants: [{ id: 'visual_tour', meta: { modality: 'video' } }],
            };
            const selection = selectVariant(slot, session, policy);
            const selectionSignal = factory.createVariantSelectedSignal(session, selection, [{ variantId: 'visual_tour', score: 1.0, guardPassed: true }]);
            buffer.push(selectionSignal);
            // Answer submission
            const answerSignal = factory.createAnswerSubmittedSignal(session, 'cell_structure', 'visual_tour', 'q1', true, 2500, 1, { answer: 'mitochondria' });
            buffer.push(answerSignal);
            // Page navigation
            const navSignal = factory.createPageNavigatedSignal(session, 'intro', 'details', 'next', 15000);
            buffer.push(navSignal);
            // Verify all signals collected
            const all = buffer.getAll();
            expect(all).toHaveLength(4);
            const unsynced = buffer.getUnsynced();
            expect(unsynced).toHaveLength(4);
            // Simulate sync
            for (const signal of all) {
                buffer.markSynced(signal.id);
            }
            expect(buffer.getUnsynced()).toHaveLength(0);
            const summary = buffer.getSummary();
            expect(summary.total).toBe(4);
            expect(summary.synced).toBe(4);
            expect(summary.byType['session_started']).toBe(1);
            expect(summary.byType['variant_selected']).toBe(1);
            expect(summary.byType['answer_submitted']).toBe(1);
            expect(summary.byType['page_navigated']).toBe(1);
        });
    });
    describe('Performance Deterioration Recovery', () => {
        it('should adapt when student performance drops', () => {
            const session = createSnapshot({
                ids: { userId: 'struggling_later', courseId: 'math', lessonId: 'calculus', pageId: 'p1' },
                metrics: { accEWMA: 0.85, streak: 4, attempts: 8, latencyEWMA: 1500, idleSec: 0, fatigue: 0 },
            });
            const slot = {
                id: 'derivative_practice',
                variants: [
                    {
                        id: 'remedial_with_hints',
                        meta: { difficulty: 'easy', cognitiveLoad: 'low' },
                        guard: CEL_TEMPLATES.lowAccuracy,
                        scoreWeights: { preferLowAcc: 0.9 },
                    },
                    {
                        id: 'standard_problems',
                        meta: { difficulty: 'std' },
                        guard: 'ctx.metrics.accEWMA >= 0.6 && ctx.metrics.accEWMA < 0.9',
                    },
                    {
                        id: 'challenge_problems',
                        meta: { difficulty: 'hard' },
                        guard: CEL_TEMPLATES.highAccuracy,
                    },
                ],
            };
            // Initially doing well - gets hard content
            const initial = selectVariant(slot, session, policy);
            expect(initial.variantId).toBe('challenge_problems');
            // Performance drops (series of failures)
            for (let i = 0; i < 8; i++) {
                updateAccuracyEWMA(session, false);
            }
            expect(session.metrics.accEWMA).toBeLessThan(0.5);
            expect(session.metrics.streak).toBe(0);
            // Clear sticky to allow re-evaluation
            session.sticky = {};
            // Should now get remedial content
            const afterDrop = selectVariant(slot, session, policy, { trace: true });
            expect(afterDrop.variantId).toBe('remedial_with_hints');
        });
    });
});
