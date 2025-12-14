/**
 * @package @amit/player-variants
 * CEL guard templates for quick authoring
 * Pre-built guard expressions for common scenarios
 */

/**
 * Common CEL guard templates for quick authoring
 * These can be used directly or as examples for custom guards
 */
export const CEL_TEMPLATES = {
  // Performance-based
  lowAccuracy: "ctx.metrics.accEWMA < 0.7",
  highAccuracy: "ctx.metrics.accEWMA >= 0.8",
  struggling: "ctx.metrics.attempts > 2 && ctx.metrics.streak == 0",
  onStreak: "ctx.metrics.streak >= 3",
  
  // Preference-based
  preferredTheme: (theme: string) => `ctx.user.preferences?.theme?.value == '${theme}'`,
  preferredModality: (modality: string) => `ctx.user.preferences?.modalityBias?.value == '${modality}'`,
  
  // Device-based
  mobileOnly: "ctx.env.device == 'mobile'",
  desktopOnly: "ctx.env.device == 'desktop'",
  tabletOnly: "ctx.env.device == 'tablet'",
  
  // Language-based
  hebrew: "ctx.user.lang == 'he'",
  english: "ctx.user.lang == 'en'",
  
  // Accessibility
  needsCaptions: "ctx.user.a11y?.captions == true",
  needsTranscript: "ctx.user.a11y?.transcript == true",
  needsDyslexicFont: "ctx.user.a11y?.dyslexicFont == true",
  
  // Complex combinations
  strugglingMobileUser: "ctx.metrics.accEWMA < 0.6 && ctx.env.device == 'mobile'",
  advancedDesktopUser: "ctx.metrics.accEWMA > 0.9 && ctx.env.device == 'desktop' && ctx.metrics.streak >= 5",
  lowAccuracyOffline: "ctx.metrics.accEWMA < 0.7 && ctx.env.online == false",
  highFatigue: "ctx.metrics.fatigue > 0.5",
};

