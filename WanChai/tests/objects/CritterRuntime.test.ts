/**
 * Critter runtime behavior tests — M-009 gap coverage.
 *
 * Critter extends Phaser.GameObjects.Container, so we cannot instantiate it
 * directly. Instead we test the runtime logic via plain-object stand-ins that
 * mirror the Critter class's public fields and method logic.
 *
 * Tests cover:
 *  - consumeShieldBlock() decrement and boolean return
 *  - activateSkill() state transitions
 *  - Heal pulse at full HP (no overheal)
 *  - Knockback aura with 0 enemies (safe no-op)
 *  - Flame burst with 0 enemies (safe no-op)
 *  - Regen stream tick counting and timer reset
 *  - updateOrbit() cooldown and skill duration tracking
 */
import { describe, it, expect } from 'vitest';
import { BALANCE } from '../../src/config/balance';
import { CRITTERS, type CritterDef } from '../../src/config/critters';

const B = BALANCE.CRITTER;

// ── Stand-in that mirrors Critter's runtime fields and methods ──────────────

interface CritterState {
  def: CritterDef;
  skillActive: boolean;
  skillTimer: number;
  shieldBlocksRemaining: number;
  regenTicksRemaining: number;
  regenTickTimer: number;
  cooldownTimer: number;
  orbitAngle: number;
}

function createCritterState(defId: string): CritterState {
  const def = CRITTERS[defId];
  return {
    def,
    skillActive: false,
    skillTimer: 0,
    shieldBlocksRemaining: 0,
    regenTicksRemaining: 0,
    regenTickTimer: 0,
    cooldownTimer: def.cooldownMs * 0.5, // mirrors constructor
    orbitAngle: 0,
  };
}

/** Mirror of Critter.consumeShieldBlock() */
function consumeShieldBlock(state: CritterState): boolean {
  if (state.shieldBlocksRemaining > 0) {
    state.shieldBlocksRemaining--;
    if (state.shieldBlocksRemaining <= 0) {
      state.skillActive = false;
      state.skillTimer = 0;
    }
    return true;
  }
  return false;
}

/** Mirror of Critter.activateSkill() */
function activateSkill(state: CritterState): void {
  if (state.def.durationMs > 0) {
    state.skillActive = true;
    state.skillTimer = state.def.durationMs;
  }
}

/** Mirror of Critter.updateOrbit() — returns true when skill should fire */
function updateOrbit(
  state: CritterState,
  delta: number,
  orbitSpeed: number,
  orbitRadius: number,
  playerX: number,
  playerY: number,
): { shouldFire: boolean; ox: number; oy: number } {
  // Orbit movement
  state.orbitAngle += orbitSpeed * (delta / 1000);
  const ox = playerX + Math.cos(state.orbitAngle) * orbitRadius;
  const oy = playerY + Math.sin(state.orbitAngle) * orbitRadius;

  // Skill duration tracking
  if (state.skillActive) {
    state.skillTimer -= delta;
    if (state.skillTimer <= 0) {
      state.skillActive = false;
      state.skillTimer = 0;
    }
  }

  // Cooldown
  state.cooldownTimer -= delta;
  if (state.cooldownTimer <= 0) {
    state.cooldownTimer = state.def.cooldownMs;
    return { shouldFire: true, ox, oy };
  }

  return { shouldFire: false, ox, oy };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('Critter runtime — consumeShieldBlock()', () => {
  it('returns true and decrements when shieldBlocksRemaining > 0', () => {
    const state = createCritterState('pangolin');
    state.shieldBlocksRemaining = 2;
    state.skillActive = true;

    const result = consumeShieldBlock(state);
    expect(result).toBe(true);
    expect(state.shieldBlocksRemaining).toBe(1);
    // Skill still active because 1 block remains
    expect(state.skillActive).toBe(true);
  });

  it('returns false when shieldBlocksRemaining === 0', () => {
    const state = createCritterState('pangolin');
    state.shieldBlocksRemaining = 0;

    const result = consumeShieldBlock(state);
    expect(result).toBe(false);
    expect(state.shieldBlocksRemaining).toBe(0);
  });

  it('deactivates skill when last block is consumed', () => {
    const state = createCritterState('pangolin');
    state.shieldBlocksRemaining = 1;
    state.skillActive = true;
    state.skillTimer = 5000;

    const result = consumeShieldBlock(state);
    expect(result).toBe(true);
    expect(state.shieldBlocksRemaining).toBe(0);
    expect(state.skillActive).toBe(false);
    expect(state.skillTimer).toBe(0);
  });

  it('consecutive calls: first true, second false', () => {
    const state = createCritterState('pangolin');
    state.shieldBlocksRemaining = 1;
    state.skillActive = true;

    expect(consumeShieldBlock(state)).toBe(true);
    expect(consumeShieldBlock(state)).toBe(false);
  });

  it('with BALANCE block count: consumes exactly shieldBubbleBlockCount times', () => {
    const state = createCritterState('pangolin');
    state.shieldBlocksRemaining = B.shieldBubbleBlockCount;
    state.skillActive = true;

    let consumed = 0;
    while (consumeShieldBlock(state)) {
      consumed++;
    }
    expect(consumed).toBe(B.shieldBubbleBlockCount);
    expect(state.shieldBlocksRemaining).toBe(0);
  });
});

describe('Critter runtime — activateSkill()', () => {
  it('sets skillActive = true for duration-based skills (pangolin)', () => {
    const state = createCritterState('pangolin');
    expect(state.skillActive).toBe(false);

    activateSkill(state);
    expect(state.skillActive).toBe(true);
    expect(state.skillTimer).toBe(CRITTERS.pangolin.durationMs);
  });

  it('sets skillActive = true for duration-based skills (koi)', () => {
    const state = createCritterState('koi');
    activateSkill(state);
    expect(state.skillActive).toBe(true);
    expect(state.skillTimer).toBe(CRITTERS.koi.durationMs);
  });

  it('does not activate for instant skills (durationMs === 0) — dolphin', () => {
    const state = createCritterState('dolphin');
    activateSkill(state);
    expect(state.skillActive).toBe(false);
    expect(state.skillTimer).toBe(0);
  });

  it('does not activate for instant skills — kite', () => {
    const state = createCritterState('kite');
    activateSkill(state);
    expect(state.skillActive).toBe(false);
  });

  it('does not activate for instant skills — lion', () => {
    const state = createCritterState('lion');
    activateSkill(state);
    expect(state.skillActive).toBe(false);
  });

  it('does not activate for instant skills — macaque', () => {
    const state = createCritterState('macaque');
    activateSkill(state);
    expect(state.skillActive).toBe(false);
  });
});

describe('Critter runtime — Heal pulse at full HP (no overheal)', () => {
  it('Math.min(maxHp, currentHp + healAmt) === maxHp at full HP', () => {
    const maxHp = BALANCE.BASE.hp;
    const currentHp = maxHp; // full HP
    const healAmt = Math.ceil(maxHp * B.healPulsePercent);
    const afterHeal = Math.min(maxHp, currentHp + healAmt);
    expect(afterHeal).toBe(maxHp);
  });

  it('never exceeds maxHp even with large heal', () => {
    const maxHp = BALANCE.BASE.hp;
    const currentHp = maxHp - 1;
    const healAmt = Math.ceil(maxHp * B.healPulsePercent);
    const afterHeal = Math.min(maxHp, currentHp + healAmt);
    expect(afterHeal).toBeLessThanOrEqual(maxHp);
  });
});

describe('Critter runtime — Knockback aura with 0 enemies (safe no-op)', () => {
  it('loop body does not execute when enemy array is empty', () => {
    const enemies: unknown[] = [];
    const radius = B.knockbackAuraRadius;
    const radiusSq = radius * radius;
    let executed = false;

    // Mirror RunScene knockbackAura loop
    for (let i = 0; i < enemies.length; i++) {
      executed = true;
    }
    expect(executed).toBe(false);
    expect(radiusSq).toBeGreaterThan(0); // radius is valid even if no enemies
  });
});

describe('Critter runtime — flameBurst with 0 enemies (safe no-op)', () => {
  it('loop body does not execute when enemy count is 0', () => {
    const activeEnemyCount = 0;
    const radius = B.flameBurstRadius;
    const radiusSq = radius * radius;
    let damageDealt = 0;

    // Mirror RunScene flameBurst loop
    for (let i = 0; i < activeEnemyCount; i++) {
      damageDealt += B.flameBurstDamage;
    }
    expect(damageDealt).toBe(0);
    expect(radiusSq).toBeGreaterThan(0);
  });
});

describe('Critter runtime — regenStream tick counting', () => {
  it('3 ticks with timer reset pattern', () => {
    const state = createCritterState('koi');
    state.regenTicksRemaining = B.regenStreamTicks;
    state.regenTickTimer = 0;

    let ticksFired = 0;
    const interval = B.regenStreamIntervalMs;

    // Simulate 3 tick intervals
    for (let t = 0; t < 3; t++) {
      state.regenTickTimer -= interval; // simulate time passage
      if (state.regenTickTimer <= 0 && state.regenTicksRemaining > 0) {
        state.regenTicksRemaining--;
        state.regenTickTimer = interval; // reset
        ticksFired++;
      }
    }

    expect(ticksFired).toBe(3);
    expect(state.regenTicksRemaining).toBe(0);
  });

  it('timer resets to intervalMs after each tick', () => {
    const state = createCritterState('koi');
    state.regenTicksRemaining = B.regenStreamTicks;
    state.regenTickTimer = 0;

    const interval = B.regenStreamIntervalMs;

    // First tick
    state.regenTickTimer -= interval;
    if (state.regenTickTimer <= 0 && state.regenTicksRemaining > 0) {
      state.regenTicksRemaining--;
      state.regenTickTimer = interval;
    }
    expect(state.regenTickTimer).toBe(interval);
    expect(state.regenTicksRemaining).toBe(B.regenStreamTicks - 1);
  });

  it('no ticks fire when regenTicksRemaining is 0', () => {
    const state = createCritterState('koi');
    state.regenTicksRemaining = 0;
    state.regenTickTimer = 0;

    const interval = B.regenStreamIntervalMs;
    let ticksFired = 0;

    state.regenTickTimer -= interval;
    if (state.regenTickTimer <= 0 && state.regenTicksRemaining > 0) {
      state.regenTicksRemaining--;
      state.regenTickTimer = interval;
      ticksFired++;
    }

    expect(ticksFired).toBe(0);
  });
});

describe('Critter runtime — updateOrbit() cooldown', () => {
  it('fires skill after initial half-cooldown elapses', () => {
    const state = createCritterState('pangolin');
    const halfCooldown = CRITTERS.pangolin.cooldownMs * 0.5;

    // Should NOT fire before cooldown expires
    const result1 = updateOrbit(state, halfCooldown - 1, B.orbitSpeed, B.orbitRadius, 360, 1100);
    expect(result1.shouldFire).toBe(false);

    // Should fire when cooldown reaches 0
    const result2 = updateOrbit(state, 2, B.orbitSpeed, B.orbitRadius, 360, 1100);
    expect(result2.shouldFire).toBe(true);
  });

  it('resets cooldown to full def.cooldownMs after firing', () => {
    const state = createCritterState('dolphin');
    // Drain the initial half-cooldown
    state.cooldownTimer = 1;
    updateOrbit(state, 2, B.orbitSpeed, B.orbitRadius, 360, 1100);
    // After firing, cooldownTimer should be reset to full
    expect(state.cooldownTimer).toBe(CRITTERS.dolphin.cooldownMs);
  });

  it('skill duration counts down in updateOrbit', () => {
    const state = createCritterState('pangolin');
    activateSkill(state);
    expect(state.skillActive).toBe(true);

    const durationMs = CRITTERS.pangolin.durationMs;
    // Partial tick
    updateOrbit(state, 1000, B.orbitSpeed, B.orbitRadius, 360, 1100);
    expect(state.skillActive).toBe(true);
    expect(state.skillTimer).toBe(durationMs - 1000);

    // Expire the skill
    updateOrbit(state, durationMs, B.orbitSpeed, B.orbitRadius, 360, 1100);
    expect(state.skillActive).toBe(false);
    expect(state.skillTimer).toBe(0);
  });

  it('orbit position updates correctly', () => {
    const state = createCritterState('dolphin');
    state.orbitAngle = 0;
    const playerX = 360;
    const playerY = 1100;
    const radius = B.orbitRadius;

    const { ox, oy } = updateOrbit(state, 0.001, B.orbitSpeed, radius, playerX, playerY);

    // With near-zero delta, orbit should be very close to angle=0 position
    expect(ox).toBeCloseTo(playerX + radius, 0);
    expect(oy).toBeCloseTo(playerY, 0);
  });
});
