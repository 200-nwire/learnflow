import type { Policy, SessionSnapshot, Slot, SelectionResult, Variant } from "./types.js";
import { createJsGuardEvaluator } from "./guard.js";
import { scoreVariant } from "./score.js";
import { stickyValid, setSticky } from "./sticky.js";

/** Fast label checks before running guard expressions. */
function fastLabelEligible(v: Variant, ctx: SessionSnapshot): boolean {
  const meta = v.meta || {};
  if (meta.language && meta.language !== ctx.user.lang) return false;
  if (meta.deviceFit && !meta.deviceFit.includes(ctx.env.device)) return false;
  if (meta.track && ctx.ids.trackId && meta.track !== ctx.ids.trackId) return false;
  return true;
}

export type SelectorOptions = {
  /** Provide a guard evaluator; by default use a JS-expression evaluator. */
  guardFactory?: ReturnType<typeof createJsGuardEvaluator>;
  /** When true, record per-variant guard & score in trace. */
  trace?: boolean;
};

/** Main selection function: constraints → overrides → sticky → labels → guards → score. */
export function selectVariant(slot: Slot, ctx: SessionSnapshot, policy: Policy, opts: SelectorOptions = {}): SelectionResult {
  const guardFactory = opts.guardFactory ?? createJsGuardEvaluator();
  const whyGuards: Record<string, boolean> = {};
  const whyScore: Record<string, number> = {};

  // 0) Hard policy constraints, if provided
  if (policy.allows && !policy.allows(slot, ctx)) {
    const fallback = slot.fallbackVariantId ?? slot.variants[0]?.id;
    if (!fallback) throw new Error(`No variants in slot ${slot.id}`);
    setSticky(ctx, slot.id, fallback, "first_pick", "weak");
    return {
      slotId: slot.id,
      variantId: fallback,
      why: { policyVersion: policy.version, guards: whyGuards, score: whyScore }
    };
  }

  // 1) Teacher/system overrides (hard force)
  const forced = ctx.overrides?.forceVariant?.[slot.id];
  if (forced) {
    setSticky(ctx, slot.id, forced, "teacher_choice", "strong");
    return {
      slotId: slot.id,
      variantId: forced,
      why: { policyVersion: policy.version, guards: whyGuards, score: whyScore, overridesUsed: true }
    };
  }

  // 2) Sticky valid?
  const s = ctx.sticky[slot.id];
  if (stickyValid(s)) {
    return {
      slotId: slot.id,
      variantId: s.variantId,
      why: { policyVersion: policy.version, guards: whyGuards, score: whyScore, stickyUsed: true }
    };
  }

  // 3) Quick label filter
  const eligible = slot.variants.filter(v => fastLabelEligible(v, ctx));

  // 4) Guard evaluation
  const guarded = eligible.filter(v => {
    const fn = guardFactory(v.guard);
    const pass = fn({ ctx, slotId: slot.id, variant: v });
    if (opts.trace) whyGuards[v.id] = !!pass;
    return pass;
  });

  // 5) Scoring
  const ranked = guarded
    .map(v => {
      const s = scoreVariant(v, ctx);
      if (opts.trace) whyScore[v.id] = s;
      return { v, s };
    })
    .sort((a,b)=> b.s - a.s);

  const chosen = ranked[0]?.v ?? slot.variants.find(v => v.id === slot.fallbackVariantId) ?? slot.variants[0];
  if (!chosen) throw new Error(`No eligible variant for slot ${slot.id}`);
  setSticky(ctx, slot.id, chosen.id, "first_pick", chosen.sticky?.strength ?? "weak", chosen.sticky?.scope ?? "lesson");

  return {
    slotId: slot.id,
    variantId: chosen.id,
    why: { policyVersion: policy.version, guards: whyGuards, score: whyScore }
  };
}
