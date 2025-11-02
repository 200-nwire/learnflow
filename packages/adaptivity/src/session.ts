import type { SessionSnapshot } from "./types.js";

/** Initialize an empty snapshot for a lesson/page. */
export function createSnapshot(init: Partial<SessionSnapshot>): SessionSnapshot {
  return {
    ids: {
      userId: "",
      courseId: "",
      lessonId: "",
      pageId: "",
      ...init.ids
    },
    user: {
      lang: "he",
      a11y: { captions: true, transcript: false },
      preferences: {},
      ...(init.user ?? {})
    },
    env: { device: "desktop", online: true, ...(init.env ?? {}) },
    metrics: { accEWMA: 1, latencyEWMA: 1000, idleSec: 0, streak: 0, fatigue: 0, attempts: 0, ...(init.metrics ?? {}) },
    perSkill: init.perSkill ?? {},
    sticky: init.sticky ?? {},
    overrides: init.overrides,
    seenVariants: init.seenVariants ?? {},
    policy: init.policy ?? { version: "dev" },
    trace: init.trace ?? []
  };
}

/** Update helpers for EWMA etc. */
export function updateAccuracyEWMA(ctx: SessionSnapshot, correct: boolean, alpha = 0.8) {
  const x = correct ? 1 : 0;
  ctx.metrics.accEWMA = alpha * ctx.metrics.accEWMA + (1 - alpha) * x;
  ctx.metrics.streak = correct ? ctx.metrics.streak + 1 : 0;
  ctx.metrics.attempts += 1;
}

export function updateLatencyEWMA(ctx: SessionSnapshot, latencyMs: number, alpha = 0.8, clip = {min: 300, max: 8000}) {
  const x = Math.max(clip.min, Math.min(clip.max, latencyMs));
  ctx.metrics.latencyEWMA = alpha * ctx.metrics.latencyEWMA + (1 - alpha) * x;
}

export function bumpIdle(ctx: SessionSnapshot, deltaSec: number) {
  ctx.metrics.idleSec = Math.max(0, ctx.metrics.idleSec + deltaSec);
}

export function setPreferenceTheme(ctx: SessionSnapshot, theme: string, source: "student"|"system"="student") {
  ctx.user.preferences = ctx.user.preferences ?? {};
  ctx.user.preferences.theme = { value: theme, source };
}
