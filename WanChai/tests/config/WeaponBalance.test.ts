/**
 * WeaponBalance.test.ts
 * DPS balance validation for all weapons in WEAPON_DEFS.
 *
 * DPS Formula (base-level, no upgrades):
 *   Standard: DPS = baseDamage * projectileCount / cooldownMs * 1000
 *   DoT (napalm): treated separately — baseDamage is per-tick, assessed via raw fire rate
 *
 * These tests serve as automated balance gates and living documentation.
 * Failures indicate potential balance issues that need design review.
 */
import { describe, it, expect } from 'vitest';
import { WEAPON_DEFS } from '../../src/config/weapons';
import type { WeaponDef } from '../../src/types/weapon';

// ─── DPS Helper ──────────────────────────────────────────────────────────────

/** Weapons whose projectileType indicates DoT / area-over-time semantics */
const DOT_WEAPON_IDS = new Set(['napalm']);

/**
 * Calculate effective DPS for a weapon at base level.
 * For standard weapons: baseDamage * projectileCount / cooldownMs * 1000
 * For DoT weapons (napalm): baseDamage / cooldownMs * 1000 (single hit, no multiplier)
 */
function calcDPS(w: WeaponDef): number {
  if (DOT_WEAPON_IDS.has(w.id)) {
    // Napalm fires one projectile that deals baseDamage as impact/DoT trigger.
    // We count only the direct application rate, not tick damage.
    return (w.baseDamage / w.cooldownMs) * 1000;
  }
  return ((w.baseDamage * w.projectileCount) / w.cooldownMs) * 1000;
}

// ─── Pre-compute ──────────────────────────────────────────────────────────────

const allWeapons = Object.values(WEAPON_DEFS);
const t1Weapons = allWeapons.filter((w) => !w.tier || w.tier === 1);
const t2Weapons = allWeapons.filter((w) => w.tier === 2);

interface DPSEntry {
  id: string;
  name: string;
  tier: number;
  dps: number;
  baseDamage: number;
  projectileCount: number;
  cooldownMs: number;
}

function buildDPSTable(weapons: WeaponDef[]): DPSEntry[] {
  return weapons
    .map((w) => ({
      id: w.id,
      name: w.name,
      tier: w.tier ?? 1,
      dps: calcDPS(w),
      baseDamage: w.baseDamage,
      projectileCount: w.projectileCount,
      cooldownMs: w.cooldownMs,
    }))
    .sort((a, b) => b.dps - a.dps);
}

// ─── Test Suites ─────────────────────────────────────────────────────────────

describe('WeaponBalance — Weapon Has Required Fields', () => {
  it('every weapon has a positive baseDamage', () => {
    for (const w of allWeapons) {
      expect(w.baseDamage, `${w.id} baseDamage`).toBeGreaterThan(0);
    }
  });

  it('every weapon has a positive cooldownMs', () => {
    for (const w of allWeapons) {
      expect(w.cooldownMs, `${w.id} cooldownMs`).toBeGreaterThan(0);
    }
  });

  it('every weapon has projectileCount >= 1', () => {
    for (const w of allWeapons) {
      expect(w.projectileCount, `${w.id} projectileCount`).toBeGreaterThanOrEqual(1);
    }
  });

  it('all required numeric fields are finite (no NaN / Infinity)', () => {
    for (const w of allWeapons) {
      expect(Number.isFinite(w.baseDamage), `${w.id} baseDamage finite`).toBe(true);
      expect(Number.isFinite(w.cooldownMs), `${w.id} cooldownMs finite`).toBe(true);
      expect(Number.isFinite(w.projectileCount), `${w.id} projectileCount finite`).toBe(true);
    }
  });
});

describe('WeaponBalance — DPS Minimum Floor (>= 5)', () => {
  /**
   * No weapon should have effective DPS below 5.
   * Below this threshold the weapon is essentially non-functional in combat.
   * DoT weapons (napalm) are checked against direct application rate only.
   */
  it('all T1 weapons have DPS >= 5', () => {
    for (const w of t1Weapons) {
      const dps = calcDPS(w);
      expect(dps, `${w.id} DPS (${dps.toFixed(1)}) below floor`).toBeGreaterThanOrEqual(5);
    }
  });

  it('all T2 weapons have DPS >= 5', () => {
    for (const w of t2Weapons) {
      const dps = calcDPS(w);
      expect(dps, `${w.id} DPS (${dps.toFixed(1)}) below floor`).toBeGreaterThanOrEqual(5);
    }
  });
});

describe('WeaponBalance — No Extreme Outliers (T1 DPS <= 100)', () => {
  /**
   * No T1 weapon should have DPS > 100.
   * T1 weapons are the base tier; values above 100 suggest a config typo.
   * (T2 evolved weapons are intentionally stronger and checked separately.)
   */
  it('no T1 weapon has DPS > 100', () => {
    for (const w of t1Weapons) {
      const dps = calcDPS(w);
      expect(dps, `${w.id} DPS (${dps.toFixed(1)}) exceeds T1 ceiling`).toBeLessThanOrEqual(100);
    }
  });
});

describe('WeaponBalance — T1 DPS Spread (<= 3x ratio)', () => {
  /**
   * The highest T1 DPS should not exceed 3x the lowest T1 DPS.
   * A larger spread means some T1 weapons are dominant choices, invalidating variety.
   *
   * NOTE: DoT weapons (napalm) are included. If napalm's direct-fire DPS is very low,
   * this test will fail — the fix is either to raise baseDamage or reduce cooldownMs.
   */
  it('max T1 DPS / min T1 DPS <= 3.0', () => {
    const dpsList = t1Weapons.map((w) => ({ id: w.id, dps: calcDPS(w) }));
    const sorted = [...dpsList].sort((a, b) => a.dps - b.dps);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const ratio = max.dps / min.dps;

    // Provide a clear failure message showing current spread
    const table = sorted.map((e) => `  ${e.id}: ${e.dps.toFixed(1)}`).join('\n');
    expect(
      ratio,
      `T1 DPS spread ratio ${ratio.toFixed(2)}x (max=${max.id} ${max.dps.toFixed(1)}, min=${min.id} ${min.dps.toFixed(1)})\nAll T1 DPS:\n${table}`,
    ).toBeLessThanOrEqual(3.0);
  });
});

describe('WeaponBalance — T2 > T1 Primary Parent DPS', () => {
  /**
   * Each T2 weapon must have higher DPS than its T1 primary parent.
   * Evolution should always be an upgrade in raw output.
   */
  it('each T2 weapon outperforms its T1 primary parent in DPS', () => {
    for (const w of t2Weapons) {
      const parentId = w.recipe!.primary;
      const parent = WEAPON_DEFS[parentId];
      expect(parent, `${w.id} recipe primary '${parentId}' not found`).toBeDefined();

      const t2DPS = calcDPS(w);
      const t1DPS = calcDPS(parent);
      expect(
        t2DPS,
        `${w.id} DPS (${t2DPS.toFixed(1)}) should be > parent ${parentId} DPS (${t1DPS.toFixed(1)})`,
      ).toBeGreaterThan(t1DPS);
    }
  });
});

describe('WeaponBalance — T2 Evolution Ratio (1.2x – 20x of T1 parent)', () => {
  /**
   * T2 DPS should be between 1.2x and 20x of the T1 primary parent.
   * - Below 1.2x: evolution is barely noticeable (weak reward)
   * - Above 20x: evolution is game-breakingly strong (likely a typo)
   *
   * The upper bound is 20x to accommodate multi-hit chain/spread weapons
   * (e.g. tesla_arc: 5 chain hits at fast cooldown vs laser_beam single beam).
   * Catches truly extreme outliers like the original Plasma Gatling at 50x.
   */
  it('each T2/T1 parent DPS ratio is between 1.2x and 20x', () => {
    for (const w of t2Weapons) {
      const parentId = w.recipe!.primary;
      const parent = WEAPON_DEFS[parentId];
      const t2DPS = calcDPS(w);
      const t1DPS = calcDPS(parent);
      const ratio = t2DPS / t1DPS;

      expect(
        ratio,
        `${w.id} (${t2DPS.toFixed(1)} DPS) / ${parentId} (${t1DPS.toFixed(1)} DPS) ratio = ${ratio.toFixed(2)}x — should be 1.2x–20x`,
      ).toBeGreaterThanOrEqual(1.2);

      expect(
        ratio,
        `${w.id} (${t2DPS.toFixed(1)} DPS) / ${parentId} (${t1DPS.toFixed(1)} DPS) ratio = ${ratio.toFixed(2)}x — should be 1.2x–20x`,
      ).toBeLessThanOrEqual(20);
    }
  });
});

describe('WeaponBalance — No Extreme T2 Outliers (DPS <= 500)', () => {
  /**
   * No T2 weapon should have DPS > 500.
   * Catches configuration typos such as Plasma Gatling at 625 DPS
   * (baseDamage=25, projectileCount=3, cooldownMs=120 → 625 DPS).
   */
  it('no T2 weapon has DPS > 500', () => {
    for (const w of t2Weapons) {
      const dps = calcDPS(w);
      expect(
        dps,
        `${w.id} DPS (${dps.toFixed(1)}) exceeds T2 ceiling of 500 — check baseDamage/projectileCount/cooldownMs`,
      ).toBeLessThanOrEqual(500);
    }
  });
});

describe('WeaponBalance — DPS Balance Table Snapshot (documentation)', () => {
  /**
   * This test always passes — it generates a sorted DPS reference table.
   * Run `npm test -- --reporter=verbose` to see the table in output.
   * Useful for designers reviewing weapon balance at a glance.
   */
  it('DPS table: all weapons sorted by DPS (descending)', () => {
    const table = buildDPSTable(allWeapons);

    // Log table so it's visible in verbose test output
    const header =
      'WEAPON DPS BALANCE TABLE\n' +
      '─────────────────────────────────────────────────────────────────────\n' +
      'Rank │ Tier │ ID                 │ DPS      │ Dmg │ Count │ CD(ms)\n' +
      '─────────────────────────────────────────────────────────────────────';

    const rows = table
      .map(
        (e, i) =>
          `${String(i + 1).padStart(4)} │  T${e.tier}  │ ${e.id.padEnd(18)} │ ${e.dps.toFixed(1).padStart(8)} │ ${String(e.baseDamage).padStart(3)} │   ${String(e.projectileCount).padStart(3)} │ ${String(e.cooldownMs).padStart(6)}`,
      )
      .join('\n');

    const footer = '─────────────────────────────────────────────────────────────────────';

    // Use console.info so it's always visible (not swallowed by vitest)
    console.info('\n' + header + '\n' + rows + '\n' + footer);

    // Sanity: table contains all weapons
    expect(table.length).toBe(allWeapons.length);

    // Sanity: table is sorted descending
    for (let i = 0; i < table.length - 1; i++) {
      expect(table[i].dps).toBeGreaterThanOrEqual(table[i + 1].dps);
    }
  });

  it('DPS table: T1 weapons only', () => {
    const table = buildDPSTable(t1Weapons);
    console.info(
      '\nT1 WEAPON DPS TABLE\n' +
        table.map((e, i) => `  ${i + 1}. ${e.id.padEnd(20)} ${e.dps.toFixed(1).padStart(8)} DPS`).join('\n'),
    );
    expect(table.length).toBe(t1Weapons.length);
  });

  it('DPS table: T2 weapons only with T1 parent comparison', () => {
    const rows = t2Weapons.map((w) => {
      const parentId = w.recipe!.primary;
      const parent = WEAPON_DEFS[parentId];
      const t2DPS = calcDPS(w);
      const t1DPS = calcDPS(parent);
      const ratio = t2DPS / t1DPS;
      return `  ${w.id.padEnd(22)} T2: ${t2DPS.toFixed(1).padStart(8)} DPS  ← ${parentId.padEnd(16)} T1: ${t1DPS.toFixed(1).padStart(6)} DPS  ratio: ${ratio.toFixed(2)}x`;
    });
    console.info('\nT2 vs T1 PARENT DPS COMPARISON\n' + rows.join('\n'));
    expect(rows.length).toBe(t2Weapons.length);
  });
});
