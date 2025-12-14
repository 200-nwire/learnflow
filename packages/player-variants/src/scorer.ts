/**
 * @package @amit/player-variants
 * Default variant scoring function
 */

import type { Variant } from './types.js';
import type { SessionSnapshot } from '@amit/player-session';

/**
 * Default scoring function - can be overridden
 */
export function scoreVariant(v: Variant, ctx: SessionSnapshot): number {
  const w = v.scoreWeights ?? {};
  const acc = ctx.metrics.accEWMA ?? 0;
  
  // Base score
  let score = 0.5;

  // Difficulty-based scoring
  const difficulty = v.meta.difficulty;
  if (difficulty === 'easy') {
    // Prefer easy variants when accuracy is low
    const preferLowAcc = (w.preferLowAcc ?? 0.4) * (1 - acc);
    score += preferLowAcc;
    
    // Bonus for struggling learners
    if (acc < 0.6) {
      score += 0.3;
    }
  } else if (difficulty === 'hard') {
    // Prefer hard variants when accuracy is high and streak is good
    if (acc >= 0.85 && ctx.metrics.streak >= 3) {
      score += 0.3;
    } else if (acc < 0.7) {
      score -= 0.4; // Penalize hard variants for struggling learners
    }
  } else {
    // Standard difficulty - good middle ground
    if (acc >= 0.5 && acc <= 0.9) {
      score += 0.2;
    }
  }

  // Theme matching
  const themePref = ctx.user.preferences?.theme?.value;
  const themeMatch = themePref && v.meta.theme === themePref ? 1 : 0;
  const preferTheme = (w.preferThemeMatch ?? 0.4) * themeMatch;
  score += preferTheme;

  // Modality preference
  const mod = v.meta.modality ?? 'reading';
  const preferMod = (w.preferModality && w.preferModality[mod]) || 0;
  score += preferMod;

  // Device suitability bonus/penalty
  const device = ctx.env.device;
  const deviceOk = v.meta.deviceFit ? v.meta.deviceFit.includes(device) : 1;
  const deviceBonus = deviceOk ? 0.1 : -0.5; // Strong penalty if not suitable
  score += deviceBonus;

  // Cognitive load consideration
  const cognitiveLoad = v.meta.cognitiveLoad;
  if (cognitiveLoad === 'low' && ctx.metrics.fatigue > 0.5) {
    score += 0.2; // Prefer low cognitive load when fatigued
  }

  return score;
}

