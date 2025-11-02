/**
 * Minimal pluggable guard "CEL-like" evaluation.
 * In production, replace `createJsGuardEvaluator` with a CEL adapter that compiles CEL to JS functions.
 */
import type { GuardFn, GuardActivation } from "./types.js";

/**
 * Create a tiny guard evaluator that treats guard strings as JS boolean expressions.
 * The expression can reference `ctx`, `slotId`, and `variant`.
 * SECURITY: This uses `new Function` for developer-side policies. Do not feed untrusted content.
 */
export function createJsGuardEvaluator() {
  const cache = new Map<string, GuardFn>();
  return (guard?: string | GuardFn): GuardFn => {
    if (!guard) return () => true;
    if (typeof guard === "function") return guard;
    if (cache.has(guard)) return cache.get(guard)!;
    const fn = new Function("ctx","slotId","variant",`return ( ${guard} );`) as (ctx:any, slotId:string, variant:any)=>boolean;
    const compiled: GuardFn = (a: GuardActivation) => {
      try { return !!fn(a.ctx, a.slotId, a.variant); } catch { return false; }
    };
    cache.set(guard, compiled);
    return compiled;
  };
}
