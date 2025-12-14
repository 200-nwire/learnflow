/**
 * @package @amit/player-variants
 * Variant selector - applies guards, scoring, sticky logic
 */

import type { Slot, Variant } from './types.js';
import type { SessionSnapshot } from '@amit/player-session';
import { stickyValid, setSticky } from './sticky.js';
import { createGuardEvaluator } from './guard.js';

type SelectorOptions = {
  scoreVariant: (variant: Variant, session: SessionSnapshot) => number;
  trace?: boolean;
};

type SelectionResult = {
  slotId: string;
  variantId: string;
  score?: number;
  trace?: any;
};

/**
 * Select variant for a slot
 */
export function selectVariant(
  slot: Slot,
  session: SessionSnapshot,
  opts: SelectorOptions
): SelectionResult {
  const trace: any = {};
  const guardFactory = createGuardEvaluator();

  // 1) Check overrides
  const forced = session.overrides?.forceVariant?.[slot.id];
  if (forced) {
    if (opts.trace) trace.reason = 'override';
    return {
      slotId: slot.id,
      variantId: forced,
      trace,
    };
  }

  // 2) Check sticky
  const sticky = session.sticky[slot.id];
  if (sticky && stickyValid(sticky)) {
    // Verify sticky variant still exists and passes guards
    const stickyVariant = slot.variants.find(v => v.id === sticky.variantId);
    if (stickyVariant) {
      const guardFn = guardFactory(stickyVariant.guard);
      if (guardFn(session, slot.id, stickyVariant)) {
        if (opts.trace) trace.reason = 'sticky';
        return {
          slotId: slot.id,
          variantId: sticky.variantId,
          trace,
        };
      }
    }
  }

  // 3) Filter by quick labels
  const eligible = slot.variants.filter(v => fastLabelEligible(v, session));

  // 4) Apply guards
  const guarded = eligible.filter(v => {
    const guardFn = guardFactory(v.guard);
    const passes = guardFn(session, slot.id, v);
    if (opts.trace) {
      if (!trace.guards) trace.guards = {};
      trace.guards[v.id] = passes;
    }
    return passes;
  });

  if (guarded.length === 0) {
    // Fallback
    const fallback = slot.fallbackVariantId ?? slot.variants[0]?.id;
    if (!fallback) throw new Error(`No variants in slot ${slot.id}`);
    if (opts.trace) trace.reason = 'fallback';
    return {
      slotId: slot.id,
      variantId: fallback,
      trace,
    };
  }

  // 5) Score and rank
  const ranked = guarded
    .map(v => {
      const score = opts.scoreVariant(v, session);
      if (opts.trace) {
        if (!trace.scores) trace.scores = {};
        trace.scores[v.id] = score;
      }
      return { v, score };
    })
    .sort((a, b) => b.score - a.score);

  const chosen = ranked[0]?.v;
  if (!chosen) throw new Error(`No eligible variant for slot ${slot.id}`);

  // Set sticky for chosen variant
  setSticky(
    session,
    slot.id,
    chosen.id,
    'first_pick',
    chosen.sticky?.strength ?? 'weak',
    chosen.sticky?.scope ?? 'lesson'
  );

  return {
    slotId: slot.id,
    variantId: chosen.id,
    score: ranked[0].score,
    trace,
  };
}

/**
 * Fast label filtering
 */
function fastLabelEligible(variant: Variant, session: SessionSnapshot): boolean {
  const meta = variant.meta || {};
  if (meta.language && meta.language !== session.user.lang) return false;
  if (meta.deviceFit && !meta.deviceFit.includes(session.env.device)) return false;
  if (meta.track && session.ids.trackId && meta.track !== session.ids.trackId) return false;
  return true;
}

