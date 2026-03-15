// ── Neon Survivors: Analytics Calculator ──
// Pure TypeScript — NO Phaser imports.
// In-run analytics tracking and post-run statistics generation.

// ════════════════════════════════════════════════════════════════
// § TYPES
// ════════════════════════════════════════════════════════════════

export interface RunAnalytics {
  damageDealt: number;
  damageTaken: number;
  healingDone: number;
  killsByWeapon: Record<string, number>;
  killsByEnemy: Record<string, number>;
  damageTakenByEnemy: Record<string, number>;
  upgradesTaken: string[];
  peakDps: number;
  longestCombo: number;
  distanceTraveled: number;
  pickupsCollected: number;
  dodges: number;
  criticalHits: number;
  totalShots: number;
  totalKills: number;
}

export interface RunReport {
  grade: string;
  mvpWeapon: string;
  dangerousEnemy: string;
  efficiency: number;
  accuracyEstimate: number;
  playstyle: string;
  highlights: string[];
}

// ════════════════════════════════════════════════════════════════
// § CREATE
// ════════════════════════════════════════════════════════════════

export function createAnalytics(): RunAnalytics {
  return {
    damageDealt: 0,
    damageTaken: 0,
    healingDone: 0,
    killsByWeapon: {},
    killsByEnemy: {},
    damageTakenByEnemy: {},
    upgradesTaken: [],
    peakDps: 0,
    longestCombo: 0,
    distanceTraveled: 0,
    pickupsCollected: 0,
    dodges: 0,
    criticalHits: 0,
    totalShots: 0,
    totalKills: 0,
  };
}

// ════════════════════════════════════════════════════════════════
// § RECORD FUNCTIONS
// ════════════════════════════════════════════════════════════════

export function recordDamageDealt(
  analytics: RunAnalytics,
  amount: number,
  _weaponId: string,
  isCrit: boolean,
): RunAnalytics {
  return {
    ...analytics,
    damageDealt: analytics.damageDealt + amount,
    criticalHits: analytics.criticalHits + (isCrit ? 1 : 0),
  };
}

export function recordDamageTaken(
  analytics: RunAnalytics,
  amount: number,
  enemyId: string,
): RunAnalytics {
  const byEnemy = { ...analytics.damageTakenByEnemy };
  byEnemy[enemyId] = (byEnemy[enemyId] ?? 0) + amount;
  return {
    ...analytics,
    damageTaken: analytics.damageTaken + amount,
    damageTakenByEnemy: byEnemy,
  };
}

export function recordKill(
  analytics: RunAnalytics,
  weaponId: string,
  enemyId: string,
): RunAnalytics {
  const byWeapon = { ...analytics.killsByWeapon };
  byWeapon[weaponId] = (byWeapon[weaponId] ?? 0) + 1;
  const byEnemy = { ...analytics.killsByEnemy };
  byEnemy[enemyId] = (byEnemy[enemyId] ?? 0) + 1;
  return {
    ...analytics,
    killsByWeapon: byWeapon,
    killsByEnemy: byEnemy,
    totalKills: analytics.totalKills + 1,
  };
}

export function recordUpgrade(
  analytics: RunAnalytics,
  upgradeId: string,
): RunAnalytics {
  return {
    ...analytics,
    upgradesTaken: [...analytics.upgradesTaken, upgradeId],
  };
}

export function recordMovement(
  analytics: RunAnalytics,
  dx: number,
  dy: number,
): RunAnalytics {
  const dist = Math.sqrt(dx * dx + dy * dy);
  return {
    ...analytics,
    distanceTraveled: analytics.distanceTraveled + dist,
  };
}

export function recordShot(analytics: RunAnalytics): RunAnalytics {
  return {
    ...analytics,
    totalShots: analytics.totalShots + 1,
  };
}

export function updatePeakDps(
  analytics: RunAnalytics,
  currentDps: number,
): RunAnalytics {
  if (currentDps <= analytics.peakDps) return analytics;
  return {
    ...analytics,
    peakDps: currentDps,
  };
}

// ════════════════════════════════════════════════════════════════
// § ANALYSIS
// ════════════════════════════════════════════════════════════════

/** Find key with highest value in a Record<string, number>. Returns "" if empty. */
function maxKey(rec: Record<string, number>): string {
  let best = "";
  let bestVal = -Infinity;
  for (const [k, v] of Object.entries(rec)) {
    if (v > bestVal) {
      best = k;
      bestVal = v;
    }
  }
  return best;
}

/**
 * Classify playstyle based on damage dealt/taken ratio and kill patterns.
 */
export function getPlaystyle(analytics: RunAnalytics): string {
  const { damageDealt, damageTaken, criticalHits, totalShots, dodges } =
    analytics;

  // Avoid division by zero
  const efficiency = damageTaken > 0 ? damageDealt / damageTaken : 0;
  const critRate = totalShots > 0 ? criticalHits / totalShots : 0;

  // Defensive: many dodges, no damage taken
  if (damageTaken === 0 && dodges > analytics.totalKills * 0.5) {
    return "Defensive";
  }

  // No combat data → Balanced
  if (damageDealt === 0 && damageTaken === 0) {
    return "Balanced";
  }

  // Glass Cannon: high damage output but also takes a lot of damage
  if (efficiency >= 2 && efficiency < 8 && damageTaken > 0 && critRate > 0.15) {
    return "Glass Cannon";
  }

  // Tank: low efficiency (takes lots of damage) but survives
  if (efficiency < 2 && damageTaken > 0) {
    return "Tank";
  }

  // Aggressive: very high efficiency or took no damage while dealing lots
  if (efficiency >= 8 || (damageTaken === 0 && damageDealt > 0)) {
    return "Aggressive";
  }

  return "Balanced";
}

/**
 * Generate notable achievements / highlights from the run.
 */
export function getHighlights(
  analytics: RunAnalytics,
  elapsed: number,
): string[] {
  const highlights: string[] = [];

  if (analytics.damageTaken === 0 && analytics.totalKills > 0) {
    highlights.push("No damage taken!");
  }

  if (analytics.totalKills >= 500) {
    highlights.push(`${analytics.totalKills} kills — Mass Extinction!`);
  } else if (analytics.totalKills >= 200) {
    highlights.push(`${analytics.totalKills} kills — Slaughter Master!`);
  } else if (analytics.totalKills >= 100) {
    highlights.push(`${analytics.totalKills} kills — Century Club!`);
  }

  if (analytics.peakDps >= 500) {
    highlights.push(`Peak DPS: ${analytics.peakDps.toFixed(0)} — DPS Monster!`);
  }

  if (analytics.criticalHits >= 50) {
    highlights.push(
      `${analytics.criticalHits} critical hits — Precision Strike!`,
    );
  }

  const kps = elapsed > 0 ? analytics.totalKills / elapsed : 0;
  if (kps >= 2) {
    highlights.push(`${kps.toFixed(1)} kills/sec — Speed Demon!`);
  }

  if (analytics.dodges >= 20) {
    highlights.push(`${analytics.dodges} close calls — Untouchable!`);
  }

  if (analytics.distanceTraveled >= 10000) {
    highlights.push("Marathon runner — 10k+ distance!");
  }

  if (analytics.upgradesTaken.length >= 10) {
    highlights.push(
      `${analytics.upgradesTaken.length} upgrades collected — Maxed Out!`,
    );
  }

  return highlights;
}

/**
 * Calculate a letter grade based on score and elapsed time.
 */
function calculateGrade(
  score: number,
  elapsed: number,
  analytics: RunAnalytics,
): string {
  // Base score per second of survival
  const scoreRate = elapsed > 0 ? score / elapsed : 0;
  const efficiency =
    analytics.damageTaken > 0
      ? analytics.damageDealt / analytics.damageTaken
      : analytics.damageDealt > 0
        ? 100
        : 0;

  // Combined metric: score rate + efficiency bonus
  const metric = scoreRate + efficiency * 0.5;

  if (metric >= 50) return "S";
  if (metric >= 30) return "A";
  if (metric >= 15) return "B";
  if (metric >= 5) return "C";
  return "D";
}

/**
 * Generate comprehensive post-run report.
 */
export function generateReport(
  analytics: RunAnalytics,
  score: number,
  elapsed: number,
): RunReport {
  const mvpWeapon = maxKey(analytics.killsByWeapon);
  const dangerousEnemy = maxKey(analytics.damageTakenByEnemy);

  const efficiency =
    analytics.damageTaken > 0
      ? Math.round((analytics.damageDealt / analytics.damageTaken) * 100) / 100
      : analytics.damageDealt > 0
        ? Infinity
        : 0;

  const accuracyEstimate =
    analytics.totalShots > 0
      ? Math.round((analytics.totalKills / analytics.totalShots) * 10000) /
        10000
      : 0;

  return {
    grade: calculateGrade(score, elapsed, analytics),
    mvpWeapon,
    dangerousEnemy,
    efficiency,
    accuracyEstimate,
    playstyle: getPlaystyle(analytics),
    highlights: getHighlights(analytics, elapsed),
  };
}
