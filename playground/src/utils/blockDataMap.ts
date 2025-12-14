/**
 * Map variant IDs to their original block data for content display
 */

import type { LessonBlock } from './lessonParser';

export type BlockDataMap = Record<string, LessonBlock>;

/**
 * Create a map of variant IDs to their original block data
 */
export function createBlockDataMap(blocks: LessonBlock[]): BlockDataMap {
  const map: BlockDataMap = {};
  
  blocks.forEach(block => {
    // Store blocks by their ID (variant blocks have slotId, slots don't)
    if (block.id) {
      map[block.id] = block;
    }
  });
  
  return map;
}

/**
 * Get block data for a variant ID
 */
export function getBlockData(map: BlockDataMap, variantId: string): LessonBlock | undefined {
  return map[variantId];
}


