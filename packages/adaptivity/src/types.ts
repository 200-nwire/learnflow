/**
 * @package @amit/adaptivity
 * Core type contracts for the adaptivity engine.
 */

export type SkillId = string;
export type SlotId = string;
export type VariantId = string;

/** Sticky choice retained for stability. */
export type StickyRecord = {
  variantId: VariantId;
  at: number; // ms
  scope: "session" | "lesson" | "course";
  ttlMs?: number;
  strength?: "weak" | "strong";
  reason?: "first_pick" | "teacher_choice" | "student_preference" | "copilot" | "ab_bucket" | "remediation_path";
};

/** Live/temporary authoritative constraints. Apply before sticky. */
export type Overrides = {
  forceVariant?: Record<SlotId, VariantId>;
  forceDifficulty?: "easy" | "std" | "hard";
  forceTheme?: string;
  disableHints?: boolean;
  soft?: {
    preferredTheme?: string;
    preferredTone?: "funny" | "serious";
  };
  source?: "teacher" | "policy" | "copilot" | "student";
  expiresAt?: number;
};

/** Variant metadata for quick filtering and scoring. */
export type VariantMeta = {
  difficulty?: "easy" | "std" | "hard";
  modality?: "video" | "quiz" | "reading" | "interactive" | "simulation" | "discussion";
  language?: "he" | "en";
  durationSec?: number;
  theme?: string;
  cognitiveLoad?: "low" | "med" | "high";
  deviceFit?: Array<"mobile" | "desktop" | "tablet">;
  accessibility?: { captions?: boolean; transcript?: boolean; dyslexicFont?: boolean };
  skills?: string[];
  knowledgeTag?: string;
  prerequisites?: string[];
  track?: string;
};

/** Variant definition. `guard` can be a CEL-like expression string or a compiled function. */
export type Variant = {
  id: VariantId;
  meta: VariantMeta;
  guard?: string | GuardFn;
  scoreWeights?: {
    preferLowAcc?: number;
    preferThemeMatch?: number;
    preferModality?: Record<string, number>;
  };
  sticky?: { scope?: "session" | "lesson" | "course"; strength?: "weak" | "strong" };
};

/** A slot groups mutually exclusive variants. */
export type Slot = {
  id: SlotId;
  variants: Variant[];
  fallbackVariantId?: VariantId;
};

/** Policy published from backend (guards/constraints/caps/weights version). */
export type Policy = {
  version: string;
  caps?: { hintPerSession?: number };
  hash?: string;
  allows?: (slot: Slot, ctx: SessionSnapshot) => boolean;
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
    gender?: "male" | "female" | "other";
    lang: "he" | "en";
    a11y?: {
      captions: boolean;
      transcript: boolean;
      dyslexicFont?: boolean;
      fontScale?: number;
      highContrast?: boolean;
    };
    preferences?: {
      theme?: { value: string; source: "student" | "system"; confidence?: number };
      tone?: { value: "funny" | "serious"; source: "student" | "system" };
      modalityBias?: { value: "video" | "reading" | "interactive"; source: "system"; confidence?: number };
    };
  };
  env: {
    device: "mobile" | "desktop" | "tablet";
    online: boolean;
    netType?: "slow-2g" | "2g" | "3g" | "4g" | "wifi";
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

/** Activation shape for guard evaluation. */
export type GuardActivation = { ctx: SessionSnapshot; slotId: SlotId; variant: Variant };

/** Guard function type (compiled predicate). */
export type GuardFn = (activation: GuardActivation) => boolean;

/** Selection result with trace. */
export type SelectionResult = {
  slotId: SlotId;
  variantId: VariantId;
  why: {
    policyVersion: string;
    guards: Record<VariantId, boolean>;
    score: Record<VariantId, number>;
    stickyUsed?: boolean;
    overridesUsed?: boolean;
  };
};
