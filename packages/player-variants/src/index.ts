/**
 * @package @amit/player-variants
 * Variants selection and scoring
 */

import type { PlayContent, Slot, Variant, SlotId } from './types.js';
import type { SessionSnapshot } from '@amit/player-session';
import { selectVariant } from './selector.js';
import { scoreVariant as defaultScoreVariant } from './scorer.js';

export type VariantsOptions = {
  getLesson: () => PlayContent;
  getSession: () => SessionSnapshot;
  scoreVariant: (variant: Variant, session: SessionSnapshot) => number;
};

/**
 * useVariants - select variants for pages using scoring
 */
export function useVariants(opts: VariantsOptions) {
  /**
   * Select variants for a page
   */
  function selectForPage(pageId: string, options?: { trace?: boolean }) {
    const lesson = opts.getLesson();
    const session = opts.getSession();
    
    // Find page
    const page = lesson.pages.find(p => p.id === pageId);
    if (!page) {
      return { selections: [] };
    }

    // Select variant for each slot
    const selections = page.slots.map(slot => {
      const result = selectVariant(slot, session, {
        scoreVariant: opts.scoreVariant,
        trace: options?.trace,
      });
      
      return {
        slotId: result.slotId,
        variantId: result.variantId,
        score: result.score,
        trace: result.trace,
      };
    });

    return { selections };
  }

  return {
    selectForPage,
  };
}

// Re-export types and default scorer
export type { PlayContent, Slot, Variant, SlotId, VariantId } from './types.js';
export { scoreVariant } from './scorer.js';

// Re-export utilities
export { stickyValid, setSticky } from './sticky.js';
export { createGuardEvaluator, validateGuardExpression } from './guard.js';
export { CEL_TEMPLATES } from './guard-templates.js';

