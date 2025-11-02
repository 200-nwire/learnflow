import type { SessionSnapshot, Variant } from "./types.js";

/** Default scoring function; override or extend as needed. */
export function scoreVariant(v: Variant, ctx: SessionSnapshot): number {
  const w = v.scoreWeights ?? {};
  const acc = ctx.metrics.accEWMA ?? 0;
  const preferLowAcc = (w.preferLowAcc ?? 0) * (1 - acc);

  const themePref = ctx.user.preferences?.theme?.value;
  const themeMatch = themePref && v.meta.theme === themePref ? 1 : 0;
  const preferTheme = (w.preferThemeMatch ?? 0) * themeMatch;

  const mod = v.meta.modality ?? "reading";
  const preferMod = (w.preferModality && w.preferModality[mod]) || 0;

  // Small bonus for device suitability
  const device = ctx.env.device;
  const deviceOk = v.meta.deviceFit ? v.meta.deviceFit.includes(device) : 1;
  const deviceBonus = deviceOk ? 0.05 : -1; // penalize if not suitable

  return preferLowAcc + preferTheme + preferMod + deviceBonus;
}
