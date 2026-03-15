// ── BossPhaseCalc: Boss phase transitions & behavior patterns ──
// Pure TypeScript — NO Phaser imports. Testable without game engine.

import { BOSSES, type BossDef } from "../config/balance";

// ════════════════════════════════════════════════════════════════
// § TYPES
// ════════════════════════════════════════════════════════════════

export interface BossPhaseInfo {
  phase: number;
  totalPhases: number;
  hpThreshold: number;
  isEnraged: boolean;
  speedMultiplier: number;
  damageMultiplier: number;
  attackPattern: string;
  phaseLabel: string;
}

// ════════════════════════════════════════════════════════════════
// § ATTACK PATTERN TABLES
// ════════════════════════════════════════════════════════════════

const ATTACK_PATTERNS: Record<string, string[]> = {
  charge_dash: ["summon_adds", "charge_dash"],
  missile_barrage: ["melee_swipe", "missile_barrage", "enraged_combo"],
  laser_grid: ["sweeping_laser", "bullet_ring", "arena_shrink"],
};

// ════════════════════════════════════════════════════════════════
// § PHASE MULTIPLIERS
// ════════════════════════════════════════════════════════════════

const SPEED_MULTIPLIERS = [1.0, 1.2, 1.5];
const DAMAGE_MULTIPLIERS = [1.0, 1.3, 1.8];

// ════════════════════════════════════════════════════════════════
// § BOSS SPAWN TIMES (seconds)
// ════════════════════════════════════════════════════════════════

const BOSS_SPAWN_TIMES: Record<string, number> = {
  mini_boss: 300, // 5:00
  chapter_boss: 480, // 8:00
  final_boss: 540, // 9:00
};

// ════════════════════════════════════════════════════════════════
// § FUNCTIONS
// ════════════════════════════════════════════════════════════════

/**
 * Determine which phase a boss is in based on current HP ratio.
 *
 * Phase thresholds divide HP evenly:
 *   2 phases → phase 1 at 100-50%, phase 2 at 50-0%
 *   3 phases → phase 1 at 100-67%, phase 2 at 67-33%, phase 3 at 33-0%
 */
export function getBossPhase(
  bossId: string,
  currentHp: number,
  maxHp: number,
): BossPhaseInfo {
  const boss: BossDef | undefined = BOSSES[bossId];
  const totalPhases = boss?.phases ?? 1;
  const specialAttack = boss?.specialAttack ?? "unknown";

  // HP ratio clamped to [0, 1]
  const hpRatio = maxHp > 0 ? Math.max(0, Math.min(1, currentHp / maxHp)) : 0;

  // Determine phase: divide HP bar into equal segments
  // phase 1 when ratio > (totalPhases-1)/totalPhases, etc.
  let phase = totalPhases; // default to last phase
  for (let i = 1; i <= totalPhases; i++) {
    const threshold = (totalPhases - i) / totalPhases;
    if (hpRatio > threshold) {
      phase = i;
      break;
    }
  }

  // HP threshold is the lower bound of the current phase (ratio 0-1)
  const hpThreshold = (totalPhases - phase) / totalPhases;

  const isEnraged = phase === totalPhases;

  // Multiplier index: phase 1 → 0, phase 2 → 1, phase 3+ → 2
  const multIndex = Math.min(phase - 1, SPEED_MULTIPLIERS.length - 1);
  const speedMultiplier = SPEED_MULTIPLIERS[multIndex];
  const damageMultiplier = DAMAGE_MULTIPLIERS[multIndex];

  // Attack pattern based on specialAttack + phase
  const patterns = ATTACK_PATTERNS[specialAttack];
  const attackPattern = patterns
    ? patterns[Math.min(phase - 1, patterns.length - 1)]
    : "basic_attack";

  const phaseLabel = `Phase ${phase}/${totalPhases}`;

  return {
    phase,
    totalPhases,
    hpThreshold,
    isEnraged,
    speedMultiplier,
    damageMultiplier,
    attackPattern,
    phaseLabel,
  };
}

/**
 * Returns HP thresholds (as ratio 0-1) where phase transitions occur.
 * e.g., 3 phases → [0.67, 0.33] (rounded to 2 decimals)
 */
export function getPhaseTransitionHp(bossId: string): number[] {
  const boss: BossDef | undefined = BOSSES[bossId];
  const totalPhases = boss?.phases ?? 1;

  if (totalPhases <= 1) return [];

  const thresholds: number[] = [];
  for (let i = 1; i < totalPhases; i++) {
    thresholds.push(Math.round(((totalPhases - i) / totalPhases) * 100) / 100);
  }
  return thresholds;
}

/**
 * Returns true when boss enters its last phase (enraged).
 */
export function shouldBossEnrage(
  bossId: string,
  currentHp: number,
  maxHp: number,
): boolean {
  return getBossPhase(bossId, currentHp, maxHp).isEnraged;
}

/**
 * Returns the spawn time in seconds for a known boss, or null for unknown.
 */
export function getBossSpawnTime(bossId: string): number | null {
  return BOSS_SPAWN_TIMES[bossId] ?? null;
}
