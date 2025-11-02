/**
 * Comprehensive tests for sticky behavior
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { stickyValid, setSticky } from '../src/sticky.js';
import { createSnapshot } from '../src/session.js';
import { selectVariant } from '../src/index.js';
describe('Sticky System', () => {
    let session;
    let policy;
    beforeEach(() => {
        session = createSnapshot({
            ids: { userId: 'u1', courseId: 'c1', lessonId: 'L1', pageId: 'P1' },
        });
        policy = { version: 'v1.0' };
    });
    describe('stickyValid', () => {
        it('should return false for undefined sticky', () => {
            expect(stickyValid(undefined)).toBe(false);
        });
        it('should return true for valid sticky without TTL', () => {
            const sticky = {
                variantId: 'v1',
                at: Date.now(),
                scope: 'lesson',
                strength: 'weak',
                reason: 'first_pick',
            };
            expect(stickyValid(sticky)).toBe(true);
        });
        it('should return true for sticky with valid TTL', () => {
            const sticky = {
                variantId: 'v1',
                at: Date.now(),
                ttlMs: 10000, // 10 seconds
                scope: 'lesson',
                strength: 'weak',
                reason: 'first_pick',
            };
            expect(stickyValid(sticky)).toBe(true);
        });
        it('should return false for expired sticky', () => {
            const sticky = {
                variantId: 'v1',
                at: Date.now() - 20000, // 20 seconds ago
                ttlMs: 10000, // 10 second TTL
                scope: 'lesson',
                strength: 'weak',
                reason: 'first_pick',
            };
            expect(stickyValid(sticky)).toBe(false);
        });
        it('should use provided now timestamp', () => {
            const sticky = {
                variantId: 'v1',
                at: 1000,
                ttlMs: 5000,
                scope: 'lesson',
                strength: 'weak',
                reason: 'first_pick',
            };
            expect(stickyValid(sticky, 4000)).toBe(true); // Within TTL
            expect(stickyValid(sticky, 7000)).toBe(false); // After TTL
        });
    });
    describe('setSticky', () => {
        it('should set sticky with default parameters', () => {
            setSticky(session, 'slot1', 'v1', 'first_pick');
            expect(session.sticky['slot1']).toBeDefined();
            expect(session.sticky['slot1'].variantId).toBe('v1');
            expect(session.sticky['slot1'].reason).toBe('first_pick');
            expect(session.sticky['slot1'].strength).toBe('weak');
            expect(session.sticky['slot1'].scope).toBe('lesson');
        });
        it('should set sticky with custom strength', () => {
            setSticky(session, 'slot1', 'v1', 'teacher_choice', 'strong');
            expect(session.sticky['slot1'].strength).toBe('strong');
        });
        it('should set sticky with custom scope', () => {
            setSticky(session, 'slot1', 'v1', 'student_preference', 'weak', 'course');
            expect(session.sticky['slot1'].scope).toBe('course');
        });
        it('should set timestamp', () => {
            const before = Date.now();
            setSticky(session, 'slot1', 'v1', 'first_pick');
            const after = Date.now();
            const timestamp = session.sticky['slot1'].at;
            expect(timestamp).toBeGreaterThanOrEqual(before);
            expect(timestamp).toBeLessThanOrEqual(after);
        });
        it('should override existing sticky', () => {
            setSticky(session, 'slot1', 'v1', 'first_pick');
            setSticky(session, 'slot1', 'v2', 'student_preference');
            expect(session.sticky['slot1'].variantId).toBe('v2');
            expect(session.sticky['slot1'].reason).toBe('student_preference');
        });
    });
    describe('Sticky Integration', () => {
        it('should retain sticky choice across multiple selections', () => {
            const slot = {
                id: 'test_slot',
                variants: [
                    { id: 'v1', meta: {}, sticky: { scope: 'lesson', strength: 'strong' } },
                    { id: 'v2', meta: {} },
                ],
            };
            // First selection
            const result1 = selectVariant(slot, session, policy);
            const firstChoice = result1.variantId;
            // Verify sticky was set
            expect(session.sticky[slot.id]).toBeDefined();
            expect(session.sticky[slot.id].variantId).toBe(firstChoice);
            // Second selection should use sticky
            const result2 = selectVariant(slot, session, policy);
            expect(result2.variantId).toBe(firstChoice);
            expect(result2.why.stickyUsed).toBe(true);
        });
        it('should respect session scope sticky', () => {
            const slot = {
                id: 'session_sticky_slot',
                variants: [
                    { id: 'v1', meta: {}, sticky: { scope: 'session', strength: 'strong' } },
                ],
            };
            selectVariant(slot, session, policy);
            expect(session.sticky[slot.id].scope).toBe('session');
        });
        it('should respect lesson scope sticky', () => {
            const slot = {
                id: 'lesson_sticky_slot',
                variants: [
                    { id: 'v1', meta: {}, sticky: { scope: 'lesson', strength: 'strong' } },
                ],
            };
            selectVariant(slot, session, policy);
            expect(session.sticky[slot.id].scope).toBe('lesson');
        });
        it('should respect course scope sticky', () => {
            const slot = {
                id: 'course_sticky_slot',
                variants: [
                    { id: 'v1', meta: {}, sticky: { scope: 'course', strength: 'strong' } },
                ],
            };
            selectVariant(slot, session, policy);
            expect(session.sticky[slot.id].scope).toBe('course');
        });
        it('should handle weak sticky strength', () => {
            const slot = {
                id: 'weak_sticky_slot',
                variants: [
                    { id: 'v1', meta: {}, sticky: { strength: 'weak' } },
                ],
            };
            selectVariant(slot, session, policy);
            expect(session.sticky[slot.id].strength).toBe('weak');
        });
        it('should track different sticky reasons', () => {
            // First pick
            setSticky(session, 'slot1', 'v1', 'first_pick');
            expect(session.sticky['slot1'].reason).toBe('first_pick');
            // Teacher choice
            setSticky(session, 'slot2', 'v2', 'teacher_choice', 'strong');
            expect(session.sticky['slot2'].reason).toBe('teacher_choice');
            // Student preference
            setSticky(session, 'slot3', 'v3', 'student_preference');
            expect(session.sticky['slot3'].reason).toBe('student_preference');
            // Copilot
            setSticky(session, 'slot4', 'v4', 'copilot');
            expect(session.sticky['slot4'].reason).toBe('copilot');
            // AB bucket
            setSticky(session, 'slot5', 'v5', 'ab_bucket');
            expect(session.sticky['slot5'].reason).toBe('ab_bucket');
            // Remediation path
            setSticky(session, 'slot6', 'v6', 'remediation_path');
            expect(session.sticky['slot6'].reason).toBe('remediation_path');
        });
        it('should maintain sticky across page changes', () => {
            const slot = {
                id: 'cross_page_slot',
                variants: [
                    { id: 'v1', meta: {}, sticky: { scope: 'lesson' } },
                ],
            };
            // Select on page 1
            session.ids.pageId = 'page_1';
            const result1 = selectVariant(slot, session, policy);
            // Change to page 2
            session.ids.pageId = 'page_2';
            const result2 = selectVariant(slot, session, policy);
            // Should be same variant
            expect(result2.variantId).toBe(result1.variantId);
            expect(result2.why.stickyUsed).toBe(true);
        });
    });
    describe('Sticky Edge Cases', () => {
        it('should handle empty sticky object', () => {
            expect(session.sticky).toEqual({});
        });
        it('should not break with invalid sticky data', () => {
            // Manually corrupt sticky data
            session.sticky['slot1'] = null;
            const slot = {
                id: 'slot1',
                variants: [{ id: 'v1', meta: {} }],
            };
            expect(() => selectVariant(slot, session, policy)).not.toThrow();
        });
        it('should handle multiple slots with different sticky settings', () => {
            const slot1 = {
                id: 'slot1',
                variants: [{ id: 'v1', meta: {}, sticky: { scope: 'session' } }],
            };
            const slot2 = {
                id: 'slot2',
                variants: [{ id: 'v2', meta: {}, sticky: { scope: 'lesson' } }],
            };
            const slot3 = {
                id: 'slot3',
                variants: [{ id: 'v3', meta: {}, sticky: { scope: 'course' } }],
            };
            selectVariant(slot1, session, policy);
            selectVariant(slot2, session, policy);
            selectVariant(slot3, session, policy);
            expect(Object.keys(session.sticky)).toHaveLength(3);
            expect(session.sticky['slot1'].scope).toBe('session');
            expect(session.sticky['slot2'].scope).toBe('lesson');
            expect(session.sticky['slot3'].scope).toBe('course');
        });
    });
});
