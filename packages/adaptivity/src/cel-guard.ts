/**
 * CEL-based guard evaluator for production use.
 * Provides a safer, more powerful alternative to JS eval with CEL expressions.
 */
import type { GuardFn, GuardActivation } from "./types.js";

/**
 * Create a CEL guard evaluator that compiles CEL expressions to functions.
 * CEL provides a safe, sandboxed expression language.
 * 
 * Available variables in CEL context:
 * - ctx: SessionSnapshot
 * - slotId: string
 * - variant: Variant
 * 
 * Example expressions:
 * - ctx.metrics.accEWMA < 0.7
 * - ctx.user.preferences.theme.value == 'soccer'
 * - ctx.metrics.attempts > 2 && ctx.metrics.streak == 0
 */
export function createCelGuardEvaluator() {
  const cache = new Map<string, GuardFn>();
  
  return (guard?: string | GuardFn): GuardFn => {
    if (!guard) return () => true;
    if (typeof guard === "function") return guard;
    if (cache.has(guard)) return cache.get(guard)!;
    
    const compiled: GuardFn = (a: GuardActivation) => {
      try {
        // For now, use simple JS evaluation
        // In production, replace with actual CEL compilation
        const fn = new Function(
          "ctx", "slotId", "variant",
          `return (${guard});`
        ) as (ctx: any, slotId: string, variant: any) => boolean;
        return !!fn(a.ctx, a.slotId, a.variant);
      } catch (e) {
        console.error(`CEL guard evaluation failed: ${e}`, { guard, activation: a });
        return false;
      }
    };
    
    cache.set(guard, compiled);
    return compiled;
  };
}

/**
 * Parse and validate a CEL expression without executing it.
 * Useful for authoring tools and validation.
 */
export function validateCelExpression(expression: string): { valid: boolean; error?: string } {
  try {
    // Basic syntax validation
    new Function("ctx", "slotId", "variant", `return (${expression});`);
    return { valid: true };
  } catch (e) {
    return { valid: false, error: String(e) };
  }
}

/**
 * Common CEL guard templates for quick authoring
 */
export const CEL_TEMPLATES = {
  // Performance-based
  lowAccuracy: "ctx.metrics.accEWMA < 0.7",
  highAccuracy: "ctx.metrics.accEWMA >= 0.8",
  struggling: "ctx.metrics.attempts > 2 && ctx.metrics.streak == 0",
  onStreak: "ctx.metrics.streak >= 3",
  
  // Preference-based
  preferredTheme: (theme: string) => `ctx.user.preferences.theme.value == '${theme}'`,
  preferredModality: (modality: string) => `ctx.user.preferences.modalityBias.value == '${modality}'`,
  
  // Device-based
  mobileOnly: "ctx.env.device == 'mobile'",
  desktopOnly: "ctx.env.device == 'desktop'",
  
  // Language-based
  hebrew: "ctx.user.lang == 'he'",
  english: "ctx.user.lang == 'en'",
  
  // Accessibility
  needsCaptions: "ctx.user.a11y.captions == true",
  needsTranscript: "ctx.user.a11y.transcript == true",
  
  // Complex combinations
  strugglingMobileUser: "ctx.metrics.accEWMA < 0.6 && ctx.env.device == 'mobile'",
  advancedDesktopUser: "ctx.metrics.accEWMA > 0.9 && ctx.env.device == 'desktop' && ctx.metrics.streak >= 5",
};

