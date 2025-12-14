/**
 * @package @amit/player-session
 * Session types - event-sourced read model
 */

export type SkillId = string;
export type SlotId = string;
export type VariantId = string;

export type StickyRecord = {
  variantId: VariantId;
  at: number; // ms
  scope: 'session' | 'lesson' | 'course';
  ttlMs?: number;
  strength?: 'weak' | 'strong';
  reason?: 'first_pick' | 'teacher_choice' | 'student_preference' | 'copilot' | 'ab_bucket' | 'remediation_path';
};

export type Overrides = {
  forceVariant?: Record<SlotId, VariantId>;
  forceDifficulty?: 'easy' | 'std' | 'hard';
  forceTheme?: string;
  disableHints?: boolean;
  soft?: {
    preferredTheme?: string;
    preferredTone?: 'funny' | 'serious';
  };
  source?: 'teacher' | 'policy' | 'copilot' | 'student';
  expiresAt?: number;
};

/** Session snapshot used for selection/guards (edge-first). */
export type SessionSnapshot = {
  ids: {
    userId: string;
    courseId: string;
    trackId?: string;
    lessonId: string;
    pageId: string;
    attemptId?: string;
    enrollmentId?: string;
  };
  user: {
    name?: string;
    givenName?: string;
    familyName?: string;
    gender?: 'male' | 'female' | 'other';
    lang: 'he' | 'en';
    a11y?: {
      captions: boolean;
      transcript: boolean;
      dyslexicFont?: boolean;
      fontScale?: number;
      highContrast?: boolean;
    };
    preferences?: {
      theme?: { value: string; source: 'student' | 'system'; confidence?: number };
      tone?: { value: 'funny' | 'serious'; source: 'student' | 'system' };
      modalityBias?: { value: 'video' | 'reading' | 'interactive'; source: 'system'; confidence?: number };
    };
  };
  env: {
    device: 'mobile' | 'desktop' | 'tablet';
    online: boolean;
    netType?: 'slow-2g' | '2g' | '3g' | '4g' | 'wifi';
    timezone?: string;
  };
  metrics: {
    accEWMA: number;
    latencyEWMA: number;
    idleSec: number;
    streak: number;
    fatigue: number;
    affect?: {
      frustration?: number;
      confidence?: number;
      engagement?: number;
    };
    attempts: number;
  };
  perSkill: Record<SkillId, {
    accEWMA: number;
    attempts: number;
    lastTs: number;
    difficultyGap?: number;
  }>;
  sticky: Record<SlotId, StickyRecord>;
  overrides?: Overrides;
  seenVariants: Record<SlotId, VariantId[]>;
  policy: {
    version: string;
    caps?: { hintPerSession?: number };
    hash?: string;
  };
  trace?: Array<{ type: string; ts: number; data?: Record<string, any> }>;
};

/**
 * Session record - event in the event stream
 * Can be a signal or a custom record
 */
export type SessionRecord = {
  type: string;
  ts: number;
  payload: Record<string, any>;
  meta?: Record<string, any>;
};

