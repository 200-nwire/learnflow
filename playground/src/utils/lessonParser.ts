/**
 * Utility to parse lesson structure from play.json format into adaptivity Slot format
 */

import type { Slot, Variant, VariantMeta } from '@amit/player-variants';

export interface LessonBlock {
  id: string;
  name: string;
  slotId?: string;
  position: number;
  page: string;
  section: string;
  play: string;
  type: 'content' | 'question';
  settings?: {
    optional?: boolean;
    type?: string;
    submissionStyle?: string;
    annotations?: {
      level?: string[];
      theme?: string[];
      difficulty?: string[];
      modality?: string[];
      cognitiveLoad?: string[];
      [key: string]: any;
    };
    [key: string]: any;
  };
  content?: any;
  completion?: any;
  [key: string]: any;
}

export interface LessonPage {
  id: string;
  title: string;
  position: number;
  section: string;
  elements?: string[];
  [key: string]: any;
}

export interface LessonData {
  lesson: {
    id: string;
    title: string;
    [key: string]: any;
  };
  pages: LessonPage[];
  blocks: LessonBlock[];
  exercises?: any[];
  rules?: any[];
}

/**
 * Convert annotations to VariantMeta
 */
function annotationsToMeta(
  annotations?: LessonBlock['settings']['annotations'], 
  blockName?: string,
  content?: any
): VariantMeta {
  const meta: VariantMeta = {};

  if (annotations) {
    // Level annotation maps to difficulty
    if (annotations.level && annotations.level.length > 0) {
      const level = annotations.level[0].toLowerCase();
      if (level === 'easy' || level === 'hard') {
        meta.difficulty = level as 'easy' | 'hard';
      } else {
        meta.difficulty = 'std';
      }
    }

    // Theme annotation
    if (annotations.theme && annotations.theme.length > 0) {
      meta.theme = annotations.theme[0];
    }

    // Difficulty annotation (alternative to level)
    if (annotations.difficulty && annotations.difficulty.length > 0) {
      const diff = annotations.difficulty[0].toLowerCase();
      if (['easy', 'std', 'hard'].includes(diff)) {
        meta.difficulty = diff as 'easy' | 'std' | 'hard';
      }
    }

    // Modality annotation
    if (annotations.modality && annotations.modality.length > 0) {
      const mod = annotations.modality[0].toLowerCase();
      if (['video', 'quiz', 'reading', 'interactive', 'simulation', 'discussion'].includes(mod)) {
        meta.modality = mod as VariantMeta['modality'];
      }
    }

    // Cognitive load annotation
    if (annotations.cognitiveLoad && annotations.cognitiveLoad.length > 0) {
      const load = annotations.cognitiveLoad[0].toLowerCase();
      if (['low', 'med', 'high'].includes(load)) {
        meta.cognitiveLoad = load as 'low' | 'med' | 'high';
      }
    }
  }

  // Infer difficulty from title/content if annotations missing
  if (!meta.difficulty) {
    // Extract text from HTML if needed (strip tags)
    const extractText = (html: string) => {
      if (!html) return '';
      return html.replace(/<[^>]*>/g, '').toLowerCase();
    };
    
    const titleText = extractText(content?.title || '');
    const nameText = blockName?.toLowerCase() || '';
    const combined = `${titleText} ${nameText}`;
    
    if (combined.includes('easy') || combined.includes('simple')) {
      meta.difficulty = 'easy';
    } else if (combined.includes('hard') || combined.includes('difficult') || combined.includes('advanced')) {
      meta.difficulty = 'hard';
    } else if (combined.includes('medium') || combined.includes('med')) {
      meta.difficulty = 'std';
    } else {
      meta.difficulty = 'std'; // Default
    }
  }

  // Infer modality from block name if not specified
  if (!meta.modality && blockName) {
    const name = blockName.toLowerCase();
    if (name.includes('video') || name.includes('youtube')) {
      meta.modality = 'video';
    } else if (name.includes('quiz') || name.includes('question') || name.includes('fill_blanks')) {
      meta.modality = 'quiz';
    } else if (name.includes('reading') || name.includes('rich_text') || name.includes('text')) {
      meta.modality = 'reading';
    } else if (name.includes('interactive') || name.includes('simulation')) {
      meta.modality = 'interactive';
    } else if (name.includes('image')) {
      meta.modality = 'reading'; // Images are typically reading/viewing content
    }
  }

  return meta;
}

/**
 * Generate guard expression based on annotations and block type
 */
function generateGuard(annotations: LessonBlock['settings']['annotations'], block: LessonBlock): string | undefined {
  const guards: string[] = [];
  
  // Extract text from HTML if needed
  const extractText = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').toLowerCase();
  };
  
  const titleText = extractText(block.content?.title || '');
  const nameText = block.name?.toLowerCase() || '';
  const combined = `${titleText} ${nameText}`;

  // Level-based guards
  if (annotations?.level && annotations.level.length > 0) {
    const level = annotations.level[0]?.toLowerCase();
    if (level === 'easy') {
      guards.push('ctx.metrics.accEWMA < 0.7');
    } else if (level === 'medium' || level === 'med') {
      guards.push('ctx.metrics.accEWMA >= 0.5 && ctx.metrics.accEWMA < 0.9');
    } else if (level === 'hard') {
      guards.push('ctx.metrics.accEWMA >= 0.85 && ctx.metrics.streak >= 3');
    }
  }

  // Difficulty-based guards
  if (annotations?.difficulty && annotations.difficulty.length > 0) {
    const diff = annotations.difficulty[0]?.toLowerCase();
    if (diff === 'easy') {
      guards.push('ctx.metrics.accEWMA < 0.7');
    } else if (diff === 'hard') {
      guards.push('ctx.metrics.accEWMA >= 0.85');
    }
  }

  // Infer from title/content if annotations missing
  if (guards.length === 0) {
    if (combined.includes('easy') || combined.includes('simple')) {
      guards.push('ctx.metrics.accEWMA < 0.7');
    } else if (combined.includes('hard') || combined.includes('difficult') || combined.includes('advanced')) {
      guards.push('ctx.metrics.accEWMA >= 0.85 && ctx.metrics.streak >= 3');
    } else if (combined.includes('medium') || combined.includes('med')) {
      guards.push('ctx.metrics.accEWMA >= 0.5 && ctx.metrics.accEWMA < 0.9');
    }
  }

  // Return combined guard or undefined (allow all if no guard)
  if (guards.length > 0) {
    return guards.join(' || ');
  }

  return undefined; // Allow all variants if no guard specified
}

/**
 * Generate score weights based on annotations
 */
function generateScoreWeights(annotations: LessonBlock['settings']['annotations'], meta: VariantMeta): Variant['scoreWeights'] {
  const weights: Variant['scoreWeights'] = {};

  // Prefer low accuracy variants for easy difficulty
  if (meta.difficulty === 'easy') {
    weights.preferLowAcc = 0.6;
  }

  // Prefer theme match if theme is specified
  if (meta.theme) {
    weights.preferThemeMatch = 0.4;
  }

  // Prefer modality if specified
  if (meta.modality) {
    weights.preferModality = { [meta.modality]: 0.3 };
  }

  return Object.keys(weights).length > 0 ? weights : undefined;
}

/**
 * Parse lesson data into Slot structures grouped by page
 */
export function parseLessonToSlots(data: LessonData): Record<string, Slot[]> {
  const slotsByPage: Record<string, Slot[]> = {};

  // Find all slot blocks (blocks with name === "slot")
  const slotBlocks = data.blocks.filter(b => b.name === 'slot' && b.type === 'content');

  // Group blocks by page
  const blocksByPage: Record<string, LessonBlock[]> = {};
  data.blocks.forEach(block => {
    if (!blocksByPage[block.page]) {
      blocksByPage[block.page] = [];
    }
    blocksByPage[block.page].push(block);
  });

  // Process each slot
  slotBlocks.forEach(slotBlock => {
    const pageId = slotBlock.page;
    
    // Find all variants for this slot (blocks with slotId matching slot block id)
    const variants = data.blocks.filter(
      b => b.slotId === slotBlock.id && b.type !== 'content' // Exclude slot blocks themselves
    );

    if (variants.length === 0) {
      return; // Skip empty slots
    }

    // Convert variants to adaptivity format
    const adaptivityVariants: Variant[] = variants.map(variant => {
      const meta = annotationsToMeta(variant.settings?.annotations, variant.name, variant.content);
      const guard = generateGuard(variant.settings?.annotations, variant);
      const scoreWeights = generateScoreWeights(variant.settings?.annotations, meta);

      // Determine sticky behavior - prefer theme variants to be sticky
      const sticky = meta.theme ? { scope: 'lesson' as const, strength: 'strong' as const } : undefined;

      return {
        id: variant.id,
        meta,
        guard,
        scoreWeights,
        sticky,
      };
    });

    // Determine fallback (first variant, or easiest if available)
    const fallbackVariant = adaptivityVariants.find(v => v.meta.difficulty === 'easy') 
      || adaptivityVariants.find(v => v.meta.difficulty === 'std')
      || adaptivityVariants[0];

    const slot: Slot = {
      id: slotBlock.id,
      variants: adaptivityVariants,
      fallbackVariantId: fallbackVariant?.id,
    };

    // Group by page
    if (!slotsByPage[pageId]) {
      slotsByPage[pageId] = [];
    }
    slotsByPage[pageId].push(slot);
  });

  return slotsByPage;
}

/**
 * Get pages from lesson data
 */
export function parseLessonPages(data: LessonData): Array<{ id: string; title: string; description?: string }> {
  return data.pages
    .sort((a, b) => a.position - b.position)
    .map(page => ({
      id: page.id,
      title: page.title || `Page ${page.position}`,
      description: undefined,
    }));
}

/**
 * Get lesson info
 */
export function parseLessonInfo(data: LessonData): { id: string; title: string; courseId: string } {
  return {
    id: data.lesson.id,
    title: data.lesson.title,
    courseId: data.lesson.course || '',
  };
}
