// ── Neon Survivors: Screen Flash Calculations ──
// Pure TypeScript — NO Phaser imports.

// ════════════════════════════════════════════════════════════════
// § TYPES
// ════════════════════════════════════════════════════════════════

export interface FlashConfig {
  /** Flash color (hex number, e.g. 0xff0000) */
  color: number;
  /** Peak alpha (0-1) */
  alpha: number;
  /** Duration in ms */
  duration: number;
  /** Whether to shake camera */
  shake: boolean;
  /** Shake intensity (0-1) */
  shakeIntensity: number;
}

export type FlashEvent =
  | "player_hit"
  | "level_up"
  | "boss_spawn"
  | "boss_kill"
  | "critical_hp";

// ════════════════════════════════════════════════════════════════
// § FLASH CONFIGS
// ════════════════════════════════════════════════════════════════

const FLASH_CONFIGS: Record<FlashEvent, FlashConfig> = {
  player_hit: {
    color: 0xff0000,
    alpha: 0.2,
    duration: 200,
    shake: true,
    shakeIntensity: 0.01,
  },
  level_up: {
    color: 0xffffff,
    alpha: 0.3,
    duration: 150,
    shake: false,
    shakeIntensity: 0,
  },
  boss_spawn: {
    color: 0xff00ff,
    alpha: 0.25,
    duration: 400,
    shake: true,
    shakeIntensity: 0.02,
  },
  boss_kill: {
    color: 0xffd700,
    alpha: 0.35,
    duration: 500,
    shake: true,
    shakeIntensity: 0.015,
  },
  critical_hp: {
    color: 0xff0000,
    alpha: 0.15,
    duration: 300,
    shake: false,
    shakeIntensity: 0,
  },
};

// ════════════════════════════════════════════════════════════════
// § FLASH CONFIG LOOKUP
// ════════════════════════════════════════════════════════════════

/**
 * Returns the appropriate flash config for different game events.
 */
export function getFlashForEvent(event: FlashEvent): FlashConfig {
  return { ...FLASH_CONFIGS[event] };
}

// ════════════════════════════════════════════════════════════════
// § CRITICAL HP CHECK
// ════════════════════════════════════════════════════════════════

const DEFAULT_CRITICAL_THRESHOLD = 0.3;

/**
 * Check if player HP is critically low (below threshold ratio).
 * Used for persistent screen-edge vignette effect.
 */
export function isCriticalHp(
  hp: number,
  maxHp: number,
  threshold: number = DEFAULT_CRITICAL_THRESHOLD,
): boolean {
  if (maxHp <= 0) return true;
  return hp / maxHp < threshold;
}

// ════════════════════════════════════════════════════════════════
// § VIGNETTE ALPHA
// ════════════════════════════════════════════════════════════════

const DEFAULT_MAX_ALPHA = 0.4;

/**
 * Get vignette alpha based on HP ratio. Lower HP = more intense vignette.
 * Returns 0 when HP is above threshold, scales from 0 to maxAlpha below.
 */
export function getVignetteAlpha(
  hp: number,
  maxHp: number,
  maxAlpha: number = DEFAULT_MAX_ALPHA,
): number {
  if (maxHp <= 0) return maxAlpha;
  const ratio = Math.max(0, hp) / maxHp;
  if (ratio >= DEFAULT_CRITICAL_THRESHOLD) return 0;
  // Scale linearly: at threshold → 0, at 0 HP → maxAlpha
  return maxAlpha * (1 - ratio / DEFAULT_CRITICAL_THRESHOLD);
}
