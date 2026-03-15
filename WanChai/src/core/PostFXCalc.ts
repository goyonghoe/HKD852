/**
 * PostFXCalc — Pure TS calculations for PostFX parameters.
 * No Phaser imports. Determines glow/tint settings based on enemy state.
 */

export interface GlowParams {
  color: number;
  distance: number;
  quality: number;
  outerStrength: number;
  innerStrength: number;
}

export interface StatusTint {
  color: number;
  alpha: number;
}

/**
 * Calculate glow parameters for boss enemies.
 * Phase 2 bosses get stronger glow.
 */
export function getBossGlowParams(
  isPhase2: boolean,
  postfxConfig: {
    bossGlowColor: number;
    bossGlowDistance: number;
    bossGlowQuality: number;
    bossGlowOuterStrength: number;
    bossGlowInnerStrength: number;
    bossPhase2GlowColor: number;
    bossPhase2GlowDistance: number;
    bossPhase2GlowOuterStrength: number;
    bossPhase2GlowInnerStrength: number;
  },
): GlowParams {
  if (isPhase2) {
    return {
      color: postfxConfig.bossPhase2GlowColor,
      distance: postfxConfig.bossPhase2GlowDistance,
      quality: postfxConfig.bossGlowQuality,
      outerStrength: postfxConfig.bossPhase2GlowOuterStrength,
      innerStrength: postfxConfig.bossPhase2GlowInnerStrength,
    };
  }
  return {
    color: postfxConfig.bossGlowColor,
    distance: postfxConfig.bossGlowDistance,
    quality: postfxConfig.bossGlowQuality,
    outerStrength: postfxConfig.bossGlowOuterStrength,
    innerStrength: postfxConfig.bossGlowInnerStrength,
  };
}

/**
 * Calculate glow parameters for elite enemies.
 */
export function getEliteGlowParams(postfxConfig: {
  eliteGlowColor: number;
  eliteGlowDistance: number;
  eliteGlowQuality: number;
  eliteGlowOuterStrength: number;
  eliteGlowInnerStrength: number;
}): GlowParams {
  return {
    color: postfxConfig.eliteGlowColor,
    distance: postfxConfig.eliteGlowDistance,
    quality: postfxConfig.eliteGlowQuality,
    outerStrength: postfxConfig.eliteGlowOuterStrength,
    innerStrength: postfxConfig.eliteGlowInnerStrength,
  };
}

/**
 * Get status effect tint for visual feedback.
 */
export function getStatusTint(
  statusType: 'freeze' | 'poison' | 'burn',
  postfxConfig: {
    freezeTintColor: number;
    poisonTintColor: number;
    burnTintColor: number;
  },
): StatusTint {
  const map: Record<string, { color: number; alpha: number }> = {
    freeze: { color: postfxConfig.freezeTintColor, alpha: 0.5 },
    poison: { color: postfxConfig.poisonTintColor, alpha: 0.4 },
    burn: { color: postfxConfig.burnTintColor, alpha: 0.6 },
  };
  return map[statusType] ?? { color: 0, alpha: 0 };
}
