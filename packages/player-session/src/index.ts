/**
 * @package @amit/player-session
 * Reactive event-sourced read model - no hydrate/getSnapshot required
 */

import { ref, readonly, type Ref } from 'vue';
import type { SessionSnapshot, SessionRecord } from './types.js';
import { createSnapshot, applySignal, applyRecord } from './session-engine.js';

export type SessionOptions = {
  snapshot?: SessionSnapshot;
  records?: SessionRecord[];
  policyVersion?: string;
};

/**
 * useSession - reactive session state from event sourcing
 */
export function useSession(opts?: SessionOptions) {
  // Initialize session from snapshot or create empty
  const session = ref<SessionSnapshot>(
    opts?.snapshot ?? createSnapshot({
      ids: {
        userId: '',
        courseId: '',
        lessonId: '',
        pageId: '',
      },
      user: {
        lang: 'he',
        a11y: { captions: true, transcript: false },
        preferences: {},
      },
      env: { device: 'desktop', online: true },
      metrics: {
        accEWMA: 1,
        latencyEWMA: 1000,
        idleSec: 0,
        streak: 0,
        fatigue: 0,
        attempts: 0,
      },
      perSkill: {},
      sticky: {},
      seenVariants: {},
      policy: {
        version: opts?.policyVersion ?? 'dev',
      },
    })
  );

  /**
   * Apply signal(s) or record(s) to update session
   */
  function apply(input: any | any[]): void {
    const inputs = Array.isArray(input) ? input : [input];
    
    for (const item of inputs) {
      // Check if it's a signal (has type and meta)
      if (item.type && item.meta) {
        applySignal(session.value, item);
      } else if (item.type && item.ts) {
        // It's a SessionRecord
        applyRecord(session.value, item);
      }
    }
  }

  /**
   * Initialize from snapshot and/or records
   */
  function initFrom(input: { snapshot?: SessionSnapshot; records?: SessionRecord[] }): void {
    if (input.snapshot) {
      session.value = { ...input.snapshot };
    }
    
    if (input.records) {
      apply(input.records);
    }
  }

  // Apply initial records if provided
  if (opts?.records) {
    apply(opts.records);
  }

  return {
    session: readonly(session) as Readonly<Ref<SessionSnapshot>>,
    apply,
    initFrom,
  };
}

// Re-export types
export type { SessionSnapshot, SessionRecord, SlotId, VariantId, StickyRecord, Overrides } from './types.js';

