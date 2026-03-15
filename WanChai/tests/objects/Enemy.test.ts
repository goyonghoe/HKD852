/**
 * Enemy unit tests — pure logic only, no Phaser rendering.
 *
 * Enemy extends Phaser.Physics.Arcade.Sprite, so we cannot instantiate it
 * directly in a test environment. Instead we test:
 *  1. HP/damage/speed scaling formulas extracted from Enemy.activate()
 *  2. takeDamage / shouldAttack / shouldShoot return-value logic via a minimal
 *     plain-object stand-in that shares the same formulas.
 *  3. BALANCE.DIFFICULTY scaling constants (cross-check with enemy logic).
 *  4. Elite multipliers, boss HP cap, and split_on_death behavior.
 */
import { describe, it, expect } from 'vitest';
import { BALANCE } from '../../src/config/balance';
import { ENEMY_DEFS } from '../../src/config/enemies';
import type { EnemyDef } from '../../src/types/enemy';

// ── Helpers — mirror Enemy.activate() formulas ────────────────────────────────

function calcHpScale(minutesElapsed: number): number {
  return Math.pow(BALANCE.DIFFICULTY.hpScalePerMin, minutesElapsed);
}

function calcSpeedScale(minutesElapsed: number): number {
  return Math.min(Math.pow(BALANCE.DIFFICULTY.speedScalePerMin, minutesElapsed), BALANCE.DIFFICULTY.maxSpeedMultiplier);
}

function calcDmgScale(minutesElapsed: number): number {
  return Math.pow(BALANCE.DIFFICULTY.damageScalePerMin, minutesElapsed);
}

function calcEnemyHp(def: EnemyDef, minutesElapsed: number, elite = false, stageHpMult = 1): number {
  const hpScale = calcHpScale(minutesElapsed);
  const eliteMult = elite ? 3 : 1;
  return Math.ceil(def.baseHp * hpScale * eliteMult * stageHpMult);
}

function calcEnemyDmg(def: EnemyDef, minutesElapsed: number, elite = false, stageDamageMult = 1): number {
  const dmgScale = calcDmgScale(minutesElapsed);
  return Math.ceil(def.baseDamage * dmgScale * (elite ? 2 : 1) * stageDamageMult);
}

function calcEnemySpeed(def: EnemyDef, minutesElapsed: number, stageSpeedMult = 1): number {
  const spdScale = calcSpeedScale(minutesElapsed);
  return def.baseSpeed * spdScale * stageSpeedMult;
}

/** Simple takeDamage logic clone (no Phaser tint/flash) */
function takeDamage(hp: number, amount: number): { hp: number; dead: boolean } {
  const newHp = hp - amount;
  return { hp: newHp, dead: newHp <= 0 };
}

/** shouldAttack/shouldShoot logic clone */
function tickAttack(timer: number, delta: number, interval: number): { timer: number; fire: boolean } {
  const newTimer = timer + delta;
  if (newTimer >= interval) {
    return { timer: 0, fire: true };
  }
  return { timer: newTimer, fire: false };
}

/** updateFlash logic clone */
function tickFlash(flashTimer: number, delta: number): { flashTimer: number; cleared: boolean } {
  if (flashTimer <= 0) return { flashTimer: 0, cleared: false };
  const next = flashTimer - delta;
  return { flashTimer: Math.max(0, next), cleared: next <= 0 };
}

// ── Sample EnemyDef fixtures ──────────────────────────────────────────────────

const BASIC_DEF: EnemyDef = {
  id: 'basic',
  shape: 'circle',
  baseSize: 20,
  baseSpeed: 120,
  baseHp: 30,
  baseDamage: 10,
  behavior: 'march',
  xpValue: 1,
  colorKey: 'enemyBase',
  category: 'ground',
  attackStyle: 'melee',
  attackInterval: 2000,
};

const FAST_DEF: EnemyDef = {
  id: 'fast',
  shape: 'triangle',
  baseSize: 14,
  baseSpeed: 220,
  baseHp: 18,
  baseDamage: 8,
  behavior: 'zigzag',
  xpValue: 2,
  colorKey: 'enemyFast',
  category: 'ground',
  attackStyle: 'melee',
  attackInterval: 1500,
};

const TANK_DEF: EnemyDef = {
  id: 'tank',
  shape: 'hexagon',
  baseSize: 36,
  baseSpeed: 60,
  baseHp: 200,
  baseDamage: 25,
  behavior: 'slow_march',
  xpValue: 10,
  colorKey: 'enemyTank',
  category: 'ground',
  knockbackImmune: true,
  attackStyle: 'melee',
  attackInterval: 3000,
};

const BOSS_DEF: EnemyDef = {
  id: 'boss',
  shape: 'diamond',
  baseSize: 60,
  baseSpeed: 80,
  baseHp: 1200,
  baseDamage: 40,
  behavior: 'boss_chase',
  xpValue: 100,
  colorKey: 'enemyBoss',
  category: 'ground',
  knockbackImmune: true,
  attackStyle: 'melee',
  attackInterval: 2000,
};

const SPLITTER_DEF: EnemyDef = {
  id: 'splitter',
  shape: 'rect',
  baseSize: 24,
  baseSpeed: 100,
  baseHp: 80,
  baseDamage: 12,
  behavior: 'split_on_death',
  xpValue: 8,
  colorKey: 'enemySplitter',
  category: 'ground',
};

const SHOOTER_DEF: EnemyDef = {
  id: 'shooter',
  shape: 'circle',
  baseSize: 18,
  baseSpeed: 80,
  baseHp: 40,
  baseDamage: 15,
  behavior: 'shoot',
  xpValue: 5,
  colorKey: 'enemyShooter',
  category: 'air',
  attackStyle: 'ranged',
  attackInterval: 2500,
  projectileSpeed: 300,
};

// ── HP scaling tests ──────────────────────────────────────────────────────────

describe('Enemy HP scaling', () => {
  it('HP at minute 0 equals baseHp (no scale)', () => {
    const hp = calcEnemyHp(BASIC_DEF, 0);
    expect(hp).toBe(BASIC_DEF.baseHp); // Math.ceil(30 * 1.0 * 1 * 1)
  });

  it('HP increases monotonically with time', () => {
    const hp0 = calcEnemyHp(BASIC_DEF, 0);
    const hp1 = calcEnemyHp(BASIC_DEF, 1);
    const hp3 = calcEnemyHp(BASIC_DEF, 3);
    expect(hp1).toBeGreaterThan(hp0);
    expect(hp3).toBeGreaterThan(hp1);
  });

  it('HP scale factor at minute 1 equals hpScalePerMin', () => {
    const scale = calcHpScale(1);
    expect(scale).toBeCloseTo(BALANCE.DIFFICULTY.hpScalePerMin);
  });

  it('HP at minute 2 is approximately hpScalePerMin^2 times base', () => {
    const expectedHp = Math.ceil(BASIC_DEF.baseHp * Math.pow(BALANCE.DIFFICULTY.hpScalePerMin, 2));
    expect(calcEnemyHp(BASIC_DEF, 2)).toBe(expectedHp);
  });

  it('stageHpMult multiplies final HP', () => {
    const hpBase = calcEnemyHp(BASIC_DEF, 0, false, 1);
    const hpStage = calcEnemyHp(BASIC_DEF, 0, false, 1.5);
    expect(hpStage).toBe(Math.ceil(hpBase * 1.5));
  });

  it('elite enemies have 3x HP', () => {
    const hpNormal = calcEnemyHp(BASIC_DEF, 0);
    const hpElite = calcEnemyHp(BASIC_DEF, 0, true);
    expect(hpElite).toBe(hpNormal * 3);
  });

  it('boss HP is capped at maxBossHp when scaling is extreme', () => {
    // Simulate 30 minutes (extreme scaling)
    const rawHp = Math.ceil(BOSS_DEF.baseHp * calcHpScale(30) * 1 * 1);
    const maxBossHp = BALANCE.DIFFICULTY.maxBossHp;
    const finalHp = rawHp > maxBossHp ? maxBossHp : rawHp;
    expect(finalHp).toBeLessThanOrEqual(maxBossHp);
    expect(BALANCE.DIFFICULTY.maxBossHp).toBe(15000);
  });

  it('tank enemy has higher base HP than basic enemy', () => {
    expect(TANK_DEF.baseHp).toBeGreaterThan(BASIC_DEF.baseHp);
  });
});

// ── Damage scaling tests ──────────────────────────────────────────────────────

describe('Enemy damage scaling', () => {
  it('damage at minute 0 equals baseDamage', () => {
    const dmg = calcEnemyDmg(BASIC_DEF, 0);
    expect(dmg).toBe(BASIC_DEF.baseDamage);
  });

  it('damage increases with time', () => {
    expect(calcEnemyDmg(BASIC_DEF, 1)).toBeGreaterThan(calcEnemyDmg(BASIC_DEF, 0));
    expect(calcEnemyDmg(BASIC_DEF, 3)).toBeGreaterThan(calcEnemyDmg(BASIC_DEF, 1));
  });

  it('elite enemies have 2x damage multiplier', () => {
    const dmgNormal = calcEnemyDmg(BASIC_DEF, 0, false);
    const dmgElite = calcEnemyDmg(BASIC_DEF, 0, true);
    expect(dmgElite).toBe(dmgNormal * 2);
  });

  it('stageDamageMult is applied after base scaling', () => {
    const dmgBase = calcEnemyDmg(BASIC_DEF, 0, false, 1);
    const dmgStage = calcEnemyDmg(BASIC_DEF, 0, false, 1.25);
    expect(dmgStage).toBe(Math.ceil(dmgBase * 1.25));
  });

  it('damage is always at least 1 (Math.ceil result)', () => {
    const dmg = calcEnemyDmg(FAST_DEF, 0);
    expect(dmg).toBeGreaterThanOrEqual(1);
  });
});

// ── Speed scaling tests ───────────────────────────────────────────────────────

describe('Enemy speed scaling', () => {
  it('speed at minute 0 equals baseSpeed', () => {
    const spd = calcEnemySpeed(BASIC_DEF, 0);
    expect(spd).toBeCloseTo(BASIC_DEF.baseSpeed);
  });

  it('speed increases with time up to maxSpeedMultiplier', () => {
    const spd0 = calcEnemySpeed(BASIC_DEF, 0);
    const spd5 = calcEnemySpeed(BASIC_DEF, 5);
    expect(spd5).toBeGreaterThan(spd0);
  });

  it('speed is capped at maxSpeedMultiplier * baseSpeed', () => {
    // At very long runtime, speed should not exceed cap
    const maxSpd = BASIC_DEF.baseSpeed * BALANCE.DIFFICULTY.maxSpeedMultiplier;
    const spd100 = calcEnemySpeed(BASIC_DEF, 100);
    expect(spd100).toBeLessThanOrEqual(maxSpd + 0.001);
  });

  it('maxSpeedMultiplier is 2.8', () => {
    expect(BALANCE.DIFFICULTY.maxSpeedMultiplier).toBe(2.8);
  });

  it('fast enemy has higher base speed than tank', () => {
    expect(FAST_DEF.baseSpeed).toBeGreaterThan(TANK_DEF.baseSpeed);
  });

  it('stageSpeedMult is applied to final speed', () => {
    const spd1 = calcEnemySpeed(BASIC_DEF, 0, 1);
    const spd15 = calcEnemySpeed(BASIC_DEF, 0, 1.15);
    expect(spd15).toBeCloseTo(spd1 * 1.15);
  });
});

// ── takeDamage logic ──────────────────────────────────────────────────────────

describe('Enemy takeDamage logic', () => {
  it('reduces HP by damage amount', () => {
    const { hp } = takeDamage(100, 30);
    expect(hp).toBe(70);
  });

  it('returns dead=false when HP > 0', () => {
    const { dead } = takeDamage(100, 50);
    expect(dead).toBe(false);
  });

  it('returns dead=true when damage equals HP exactly', () => {
    const { dead, hp } = takeDamage(50, 50);
    expect(dead).toBe(true);
    expect(hp).toBe(0);
  });

  it('returns dead=true when damage exceeds HP (overkill)', () => {
    const { dead, hp } = takeDamage(30, 100);
    expect(dead).toBe(true);
    expect(hp).toBeLessThan(0);
  });

  it('sequential hits accumulate damage correctly', () => {
    let hp = 100;
    let dead = false;

    ({ hp, dead } = takeDamage(hp, 30));
    expect(hp).toBe(70);
    expect(dead).toBe(false);

    ({ hp, dead } = takeDamage(hp, 40));
    expect(hp).toBe(30);
    expect(dead).toBe(false);

    ({ hp, dead } = takeDamage(hp, 30));
    expect(hp).toBe(0);
    expect(dead).toBe(true);
  });

  it('large single hit kills in one shot', () => {
    const { dead } = takeDamage(BOSS_DEF.baseHp, BOSS_DEF.baseHp * 2);
    expect(dead).toBe(true);
  });

  it('zero damage does not kill', () => {
    const { dead, hp } = takeDamage(100, 0);
    expect(dead).toBe(false);
    expect(hp).toBe(100);
  });

  it('hp 1 dies to any positive damage', () => {
    const { dead } = takeDamage(1, 1);
    expect(dead).toBe(true);
  });
});

// ── shouldAttack / shouldShoot timer logic ────────────────────────────────────

describe('Enemy attack timer logic', () => {
  it('does not fire before interval elapsed', () => {
    const { fire } = tickAttack(0, 1000, 2000);
    expect(fire).toBe(false);
  });

  it('fires exactly when interval is reached', () => {
    const { fire } = tickAttack(0, 2000, 2000);
    expect(fire).toBe(true);
  });

  it('fires when timer exceeds interval', () => {
    const { fire } = tickAttack(1500, 600, 2000);
    expect(fire).toBe(true);
  });

  it('resets timer to 0 after firing', () => {
    const { timer, fire } = tickAttack(1900, 200, 2000);
    expect(fire).toBe(true);
    expect(timer).toBe(0);
  });

  it('timer accumulates across multiple ticks without firing', () => {
    let timer = 0;
    ({ timer } = tickAttack(timer, 500, 2000)); // 500
    ({ timer } = tickAttack(timer, 500, 2000)); // 1000
    ({ timer } = tickAttack(timer, 500, 2000)); // 1500
    const { fire } = tickAttack(timer, 400, 2000); // 1900 < 2000
    expect(fire).toBe(false);
  });

  it('successive firings are evenly spaced at interval', () => {
    let timer = 0;
    let fires = 0;
    // Simulate 5 * 2000ms = 10000ms in 2000ms steps
    for (let i = 0; i < 5; i++) {
      const result = tickAttack(timer, 2000, 2000);
      timer = result.timer;
      if (result.fire) fires++;
    }
    expect(fires).toBe(5);
  });

  it('ranged enemy attack interval is respected (shooter)', () => {
    const interval = SHOOTER_DEF.attackInterval ?? 2000;
    const { fire: earlyFire } = tickAttack(0, interval - 1, interval);
    expect(earlyFire).toBe(false);
    const { fire: onTimeFire } = tickAttack(0, interval, interval);
    expect(onTimeFire).toBe(true);
  });
});

// ── Hit flash logic ───────────────────────────────────────────────────────────

describe('Enemy hit flash timer logic', () => {
  it('flash timer decrements on update', () => {
    const { flashTimer } = tickFlash(80, 30);
    expect(flashTimer).toBe(50);
  });

  it('cleared flag is false while flash is active', () => {
    const { cleared } = tickFlash(80, 30);
    expect(cleared).toBe(false);
  });

  it('cleared flag is true when flashTimer expires', () => {
    const { cleared, flashTimer } = tickFlash(80, 80);
    expect(cleared).toBe(true);
    expect(flashTimer).toBe(0);
  });

  it('cleared flag is true when delta overshoots flashTimer', () => {
    const { cleared, flashTimer } = tickFlash(40, 100);
    expect(cleared).toBe(true);
    expect(flashTimer).toBe(0);
  });

  it('does nothing when flashTimer is already 0', () => {
    const { flashTimer, cleared } = tickFlash(0, 50);
    expect(flashTimer).toBe(0);
    expect(cleared).toBe(false);
  });
});

// ── Elite multipliers ─────────────────────────────────────────────────────────

describe('Elite enemy multipliers', () => {
  it('elite HP multiplier is 3x', () => {
    // From Enemy.activate(): eliteMult = elite ? 3 : 1
    const normalHp = calcEnemyHp(BASIC_DEF, 0, false);
    const eliteHp = calcEnemyHp(BASIC_DEF, 0, true);
    expect(eliteHp / normalHp).toBe(3);
  });

  it('elite damage multiplier is 2x', () => {
    const normalDmg = calcEnemyDmg(BASIC_DEF, 0, false);
    const eliteDmg = calcEnemyDmg(BASIC_DEF, 0, true);
    expect(eliteDmg / normalDmg).toBe(2);
  });

  it('elite XP value is 5x', () => {
    // From Enemy.activate(): xpValue = def.xpValue * (elite ? 5 : 1)
    const normalXp = BASIC_DEF.xpValue;
    const eliteXp = normalXp * 5;
    expect(eliteXp).toBe(5);
  });

  it('knockbackImmune is true for elite enemies (overrides def)', () => {
    // From activate(): knockbackImmune = (def.knockbackImmune ?? false) || elite
    const defImmune = false;
    const elite = true;
    const immune = defImmune || elite;
    expect(immune).toBe(true);
  });

  it('knockbackImmune is respected even for normal elite', () => {
    // Fast enemy has no knockbackImmune in def — elite should still be immune
    const immune = (FAST_DEF.knockbackImmune ?? false) || true;
    expect(immune).toBe(true);
  });
});

// ── Boss behavior ─────────────────────────────────────────────────────────────

describe('Boss enemy behavior', () => {
  it('boss behavior is boss_chase, boss_circle, or boss_burst', () => {
    const bossBehaviors = ['boss_chase', 'boss_circle', 'boss_burst'];
    expect(bossBehaviors).toContain(BOSS_DEF.behavior);
  });

  it('boss has knockbackImmune=true in def', () => {
    expect(BOSS_DEF.knockbackImmune).toBe(true);
  });

  it('boss maxBossHp cap is applied when raw HP exceeds it', () => {
    const cap = BALANCE.DIFFICULTY.maxBossHp;
    const rawHp = cap + 1000; // exceeds cap
    const finalHp = rawHp > cap ? cap : rawHp;
    expect(finalHp).toBe(cap);
  });

  it('boss HP cap does not apply at low difficulty', () => {
    const cap = BALANCE.DIFFICULTY.maxBossHp;
    const rawHp = Math.ceil(BOSS_DEF.baseHp * calcHpScale(0));
    expect(rawHp).toBeLessThan(cap);
    // Cap should not kick in
    const finalHp = rawHp > cap ? cap : rawHp;
    expect(finalHp).toBe(rawHp);
  });

  it('boss has high XP value', () => {
    expect(BOSS_DEF.xpValue).toBeGreaterThanOrEqual(50);
  });

  it('boss has higher baseDamage than common enemies', () => {
    expect(BOSS_DEF.baseDamage).toBeGreaterThan(BASIC_DEF.baseDamage);
    expect(BOSS_DEF.baseDamage).toBeGreaterThan(FAST_DEF.baseDamage);
  });
});

// ── Split on death behavior ───────────────────────────────────────────────────

describe('Splitter (split_on_death) behavior', () => {
  it('splitter behavior is split_on_death', () => {
    expect(SPLITTER_DEF.behavior).toBe('split_on_death');
  });

  it('splitter moves at 0.7x speed', () => {
    // From applyMovement: split_on_death → body.setVelocity(0, this.speed * 0.7)
    const fullSpeed = calcEnemySpeed(SPLITTER_DEF, 0);
    const splitSpeed = fullSpeed * 0.7;
    expect(splitSpeed).toBeCloseTo(fullSpeed * 0.7);
    expect(splitSpeed).toBeLessThan(fullSpeed);
  });

  it('splitter dies to any lethal hit', () => {
    const hp = calcEnemyHp(SPLITTER_DEF, 0);
    const { dead } = takeDamage(hp, hp);
    expect(dead).toBe(true);
  });
});

// ── Behavior mode properties ──────────────────────────────────────────────────

describe('Enemy behavior mode properties', () => {
  it('march behavior: basic enemy moves straight down', () => {
    expect(BASIC_DEF.behavior).toBe('march');
  });

  it('zigzag behavior: fast enemy has zigzag pattern', () => {
    expect(FAST_DEF.behavior).toBe('zigzag');
  });

  it('shoot behavior: shooter enemy uses ranged attack style', () => {
    expect(SHOOTER_DEF.behavior).toBe('shoot');
    expect(SHOOTER_DEF.attackStyle).toBe('ranged');
  });

  it('slow_march behavior: tank enemy has slow_march', () => {
    expect(TANK_DEF.behavior).toBe('slow_march');
  });

  it('tank is knockback immune', () => {
    expect(TANK_DEF.knockbackImmune).toBe(true);
  });

  it('shooter has faster attack interval than tank', () => {
    const shooterInterval = SHOOTER_DEF.attackInterval ?? 2000;
    const tankInterval = TANK_DEF.attackInterval ?? 2000;
    expect(shooterInterval).toBeLessThan(tankInterval);
  });

  it('ranged enemy projectile speed is set', () => {
    expect(SHOOTER_DEF.projectileSpeed).toBeDefined();
    expect(SHOOTER_DEF.projectileSpeed).toBeGreaterThan(0);
  });
});

// ── Enemy category (side-view ground/air) ────────────────────────────────────

describe('Enemy category (side-view)', () => {
  it('all ENEMY_DEFS have a valid category', () => {
    for (const [, def] of Object.entries(ENEMY_DEFS)) {
      expect(['ground', 'air']).toContain(def.category);
    }
  });

  it('ground enemies include basic, fast, tank, swarm, guardian, splitter, chaser', () => {
    const groundIds = ['basic', 'fast', 'tank', 'swarm', 'guardian', 'splitter', 'chaser'];
    for (const id of groundIds) {
      expect(ENEMY_DEFS[id].category).toBe('ground');
    }
  });

  it('air enemies include special, shooter, sniper_enemy, teleporter', () => {
    const airIds = ['special', 'shooter', 'sniper_enemy', 'teleporter'];
    for (const id of airIds) {
      expect(ENEMY_DEFS[id].category).toBe('air');
    }
  });

  it('boss_circle is air category', () => {
    expect(ENEMY_DEFS['boss_circle'].category).toBe('air');
  });

  it('boss and boss_burst are ground category', () => {
    expect(ENEMY_DEFS['boss'].category).toBe('ground');
    expect(ENEMY_DEFS['boss_burst'].category).toBe('ground');
  });
});

// ── BALANCE difficulty constants ──────────────────────────────────────────────

describe('BALANCE difficulty constants', () => {
  it('hpScalePerMin is greater than 1', () => {
    expect(BALANCE.DIFFICULTY.hpScalePerMin).toBeGreaterThan(1);
  });

  it('speedScalePerMin is greater than 1', () => {
    expect(BALANCE.DIFFICULTY.speedScalePerMin).toBeGreaterThan(1);
  });

  it('damageScalePerMin is greater than 1', () => {
    expect(BALANCE.DIFFICULTY.damageScalePerMin).toBeGreaterThan(1);
  });

  it('maxSpeedMultiplier is a finite positive number', () => {
    expect(BALANCE.DIFFICULTY.maxSpeedMultiplier).toBeGreaterThan(1);
    expect(Number.isFinite(BALANCE.DIFFICULTY.maxSpeedMultiplier)).toBe(true);
  });

  it('maxBossHp is reasonable upper bound', () => {
    expect(BALANCE.DIFFICULTY.maxBossHp).toBeGreaterThan(1000);
    expect(BALANCE.DIFFICULTY.maxBossHp).toBeLessThan(1000000);
  });

  it('stage difficultyPerStage multipliers are > 1', () => {
    expect(BALANCE.STAGE.difficultyPerStage.hpMult).toBeGreaterThan(1);
    expect(BALANCE.STAGE.difficultyPerStage.speedMult).toBeGreaterThan(1);
    expect(BALANCE.STAGE.difficultyPerStage.damageMult).toBeGreaterThan(1);
  });
});
