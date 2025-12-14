/**
 * @package @amit/player-variants
 * Guard evaluation utilities
 */

import type { SessionSnapshot } from '@amit/player-session';
import type { Variant } from './types.js';

export type GuardFn = (ctx: SessionSnapshot, slotId: string, variant: Variant) => boolean;

export type GuardActivation = {
  ctx: SessionSnapshot;
  slotId: string;
  variant: Variant;
};

/**
 * Create a guard evaluator with caching
 * Guards can be string expressions (CEL-like) or functions
 */
export function createGuardEvaluator() {
  const cache = new Map<string, GuardFn>();
  
  return (guard?: string | GuardFn): GuardFn => {
    if (!guard) return () => true;
    if (typeof guard === 'function') return guard;
    if (cache.has(guard)) return cache.get(guard)!;
    
    const compiled: GuardFn = (ctx, slotId, variant) => {
      try {
        // For now, use simple JS evaluation
        // In production, replace with actual CEL compilation
        const fn = new Function(
          'ctx',
          'slotId',
          'variant',
          `return (${guard});`
        ) as (ctx: SessionSnapshot, slotId: string, variant: Variant) => boolean;
        return !!fn(ctx, slotId, variant);
      } catch (e) {
        console.error(`Guard evaluation failed: ${e}`, { guard, ctx, slotId, variant });
        return false;
      }
    };
    
    cache.set(guard, compiled);
    return compiled;
  };
}

/**
 * Parse and validate a guard expression without executing it
 * Useful for authoring tools and validation
 */
export function validateGuardExpression(expression: string): { valid: boolean; error?: string } {
  try {
    // Basic syntax validation
    new Function('ctx', 'slotId', 'variant', `return (${expression});`);
    return { valid: true };
  } catch (e) {
    return { valid: false, error: String(e) };
  }
}

