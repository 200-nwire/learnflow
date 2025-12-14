/**
 * @package @amit/player-variants
 * Sticky choice utilities
 */

import type { SessionSnapshot, SlotId, VariantId, StickyRecord } from '@amit/player-session';

/**
 * Check if a sticky is still valid by TTL and scope
 * (scope end is managed by caller)
 */
export function stickyValid(s: StickyRecord | undefined, now = Date.now()): boolean {
  if (!s) return false;
  if (s.ttlMs && s.at + s.ttlMs < now) return false;
  return true;
}

/**
 * Set a sticky choice in the session
 */
export function setSticky(
  ctx: SessionSnapshot,
  slotId: SlotId,
  variantId: VariantId,
  reason: StickyRecord['reason'] = 'first_pick',
  strength: StickyRecord['strength'] = 'weak',
  scope: StickyRecord['scope'] = 'lesson'
): void {
  ctx.sticky[slotId] = {
    variantId,
    at: Date.now(),
    scope,
    strength,
    reason,
  };
}

