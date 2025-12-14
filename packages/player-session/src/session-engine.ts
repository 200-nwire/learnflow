/**
 * @package @amit/player-session
 * Session engine - applies signals/records to build snapshot
 */

import type { SessionSnapshot, SessionRecord } from './types.js';

/**
 * Create initial snapshot
 */
export function createSnapshot(init: Partial<SessionSnapshot>): SessionSnapshot {
  return {
    ids: {
      userId: '',
      courseId: '',
      lessonId: '',
      pageId: '',
      ...init.ids,
    },
    user: {
      lang: 'he',
      a11y: { captions: true, transcript: false },
      preferences: {},
      ...(init.user ?? {}),
    },
    env: {
      device: 'desktop',
      online: true,
      ...(init.env ?? {}),
    },
    metrics: {
      accEWMA: 1,
      latencyEWMA: 1000,
      idleSec: 0,
      streak: 0,
      fatigue: 0,
      attempts: 0,
      ...(init.metrics ?? {}),
    },
    perSkill: init.perSkill ?? {},
    sticky: init.sticky ?? {},
    overrides: init.overrides,
    seenVariants: init.seenVariants ?? {},
    policy: init.policy ?? { version: 'dev' },
    trace: init.trace ?? [],
  };
}

/**
 * Apply a signal to session (from @amit/player-signals)
 */
export function applySignal(session: SessionSnapshot, signal: any): void {
  // Update IDs from signal meta
  if (signal.meta) {
    if (signal.meta.userId) session.ids.userId = signal.meta.userId;
    if (signal.meta.courseId) session.ids.courseId = signal.meta.courseId;
    if (signal.meta.lessonId) session.ids.lessonId = signal.meta.lessonId;
    if (signal.meta.pageId) session.ids.pageId = signal.meta.pageId;
    if (signal.meta.attemptId) session.ids.attemptId = signal.meta.attemptId;
    if (signal.meta.lang) session.user.lang = signal.meta.lang;
    if (signal.meta.device) session.env.device = signal.meta.device;
    if (signal.meta.online !== undefined) session.env.online = signal.meta.online;
  }

  // Handle different signal types
  switch (signal.type) {
    case 'started':
      if (signal.payload.attemptId) {
        session.ids = { ...session.ids, attemptId: signal.payload.attemptId };
      }
      break;

    case 'experienced':
      if (signal.payload.pageId) {
        session.ids = { ...session.ids, pageId: signal.payload.pageId };
      }
      break;

    case 'answered':
      // Update accuracy EWMA
      if (signal.payload.correct !== undefined) {
        updateAccuracyEWMA(session, signal.payload.correct);
      }
      // Update latency EWMA
      if (signal.payload.latencyMs) {
        updateLatencyEWMA(session, signal.payload.latencyMs);
      }
      // Track attempts
      if (signal.payload.attempts) {
        session.metrics.attempts = Math.max(session.metrics.attempts, signal.payload.attempts);
      }
      break;

    case 'selected':
      // Track seen variants
      const slotId = signal.payload.slotId;
      const variantId = signal.payload.variantId;
      if (slotId && variantId) {
        if (!session.seenVariants[slotId]) {
          session.seenVariants[slotId] = [];
        }
        if (!session.seenVariants[slotId].includes(variantId)) {
          session.seenVariants[slotId].push(variantId);
        }
      }
      break;

    case 'completed':
      // Session completed - could update final metrics
      break;
  }
}

/**
 * Apply a session record (generic event)
 */
export function applyRecord(session: SessionSnapshot, record: SessionRecord): void {
  // Generic record application - can be extended for custom events
  // For now, just add to trace
  if (!session.trace) {
    session.trace = [];
  }
  session.trace.push({
    type: record.type,
    ts: record.ts,
    data: record.payload,
  });
}

/**
 * Update accuracy EWMA
 */
function updateAccuracyEWMA(session: SessionSnapshot, correct: boolean, alpha = 0.8): void {
  const x = correct ? 1 : 0;
  session.metrics.accEWMA = alpha * session.metrics.accEWMA + (1 - alpha) * x;
  session.metrics.streak = correct ? session.metrics.streak + 1 : 0;
  session.metrics.attempts += 1;
}

/**
 * Update latency EWMA
 */
function updateLatencyEWMA(session: SessionSnapshot, latencyMs: number, alpha = 0.8, clip = { min: 300, max: 8000 }): void {
  const x = Math.max(clip.min, Math.min(clip.max, latencyMs));
  session.metrics.latencyEWMA = alpha * session.metrics.latencyEWMA + (1 - alpha) * x;
}

