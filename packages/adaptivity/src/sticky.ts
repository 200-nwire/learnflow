import type { SessionSnapshot, SlotId, VariantId, StickyRecord } from "./types.js";

/** Check if a sticky is still valid by TTL and scope (scope end is managed by caller). */
export function stickyValid(s: StickyRecord | undefined, now = Date.now()): boolean {
  if (!s) return false;
  if (s.ttlMs && s.at + s.ttlMs < now) return false;
  return true;
}

export function setSticky(ctx: SessionSnapshot, slotId: SlotId, variantId: VariantId, reason: StickyRecord["reason"], strength: StickyRecord["strength"] = "weak", scope: StickyRecord["scope"] = "lesson") {
  ctx.sticky[slotId] = { variantId, at: Date.now(), scope, strength, reason };
}
