/**
 * @package @amit/player-variants
 * Variant and slot types
 */

export type SlotId = string;
export type VariantId = string;

export type VariantMeta = {
  difficulty?: 'easy' | 'std' | 'hard';
  modality?: 'video' | 'quiz' | 'reading' | 'interactive' | 'simulation' | 'discussion';
  language?: 'he' | 'en';
  durationSec?: number;
  theme?: string;
  cognitiveLoad?: 'low' | 'med' | 'high';
  deviceFit?: Array<'mobile' | 'desktop' | 'tablet'>;
  accessibility?: { captions?: boolean; transcript?: boolean; dyslexicFont?: boolean };
  skills?: string[];
  knowledgeTag?: string;
  prerequisites?: string[];
  track?: string;
};

export type Variant = {
  id: VariantId;
  meta: VariantMeta;
  guard?: string | ((ctx: any) => boolean);
  scoreWeights?: {
    preferLowAcc?: number;
    preferThemeMatch?: number;
    preferModality?: Record<string, number>;
  };
  sticky?: {
    scope?: 'session' | 'lesson' | 'course';
    strength?: 'weak' | 'strong';
  };
};

export type Slot = {
  id: SlotId;
  variants: Variant[];
  fallbackVariantId?: VariantId;
};

/**
 * PlayContent - lesson structure with pages and slots
 */
export type PlayContent = {
  pages: Array<{
    id: string;
    slots: Slot[];
  }>;
};

