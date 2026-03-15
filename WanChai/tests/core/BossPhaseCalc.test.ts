import { describe, it, expect } from 'vitest';
import {
  createBossPhaseState,
  shouldTransitionToPhase2,
  transitionToPhase2,
  shouldTransitionToPhase3,
  transitionToPhase3,
  tickInvulnerability,
  isInvulnerable,
  getPhase2Stats,
  getPhase3Stats,
} from '../../src/core/BossPhaseCalc';

describe('createBossPhaseState', () => {
  it('returns Phase 1 with no transition', () => {
    const state = createBossPhaseState();
    expect(state.phase).toBe(1);
    expect(state.hasTransitioned).toBe(false);
    expect(state.hasTransitionedP3).toBe(false);
    expect(state.invulnerabilityMs).toBe(0);
  });
});

describe('shouldTransitionToPhase2', () => {
  it('returns true when HP drops to threshold', () => {
    expect(shouldTransitionToPhase2(500, 1000, 0.5, false)).toBe(true);
  });

  it('returns true when HP drops below threshold', () => {
    expect(shouldTransitionToPhase2(400, 1000, 0.5, false)).toBe(true);
  });

  it('returns false when HP is above threshold', () => {
    expect(shouldTransitionToPhase2(600, 1000, 0.5, false)).toBe(false);
  });

  it('returns false when already transitioned', () => {
    expect(shouldTransitionToPhase2(400, 1000, 0.5, true)).toBe(false);
  });

  it('returns false for zero maxHp', () => {
    expect(shouldTransitionToPhase2(0, 0, 0.5, false)).toBe(false);
  });

  it('triggers exactly at threshold ratio', () => {
    // 50/100 = 0.5, threshold = 0.5 → should transition (<=)
    expect(shouldTransitionToPhase2(50, 100, 0.5, false)).toBe(true);
  });

  it('does not trigger just above threshold', () => {
    // 51/100 = 0.51, threshold = 0.5 → should not transition
    expect(shouldTransitionToPhase2(51, 100, 0.5, false)).toBe(false);
  });
});

describe('transitionToPhase2', () => {
  it('creates Phase 2 state with invulnerability', () => {
    const state = transitionToPhase2(1500);
    expect(state.phase).toBe(2);
    expect(state.hasTransitioned).toBe(true);
    expect(state.hasTransitionedP3).toBe(false);
    expect(state.invulnerabilityMs).toBe(1500);
  });
});

describe('shouldTransitionToPhase3', () => {
  it('returns true when HP drops to threshold', () => {
    expect(shouldTransitionToPhase3(330, 1000, 0.33, false)).toBe(true);
  });

  it('returns false when HP is above threshold', () => {
    expect(shouldTransitionToPhase3(400, 1000, 0.33, false)).toBe(false);
  });

  it('returns false when already transitioned', () => {
    expect(shouldTransitionToPhase3(200, 1000, 0.33, true)).toBe(false);
  });

  it('returns false for zero maxHp', () => {
    expect(shouldTransitionToPhase3(0, 0, 0.33, false)).toBe(false);
  });
});

describe('transitionToPhase3', () => {
  it('creates Phase 3 state preserving P2 transition', () => {
    const p2State = transitionToPhase2(0);
    const state = transitionToPhase3(p2State, 1500);
    expect(state.phase).toBe(3);
    expect(state.hasTransitioned).toBe(true); // P2 was done
    expect(state.hasTransitionedP3).toBe(true);
    expect(state.invulnerabilityMs).toBe(1500);
  });
});

describe('tickInvulnerability', () => {
  it('decreases timer by delta', () => {
    const state = transitionToPhase2(1500);
    const ticked = tickInvulnerability(state, 500);
    expect(ticked.invulnerabilityMs).toBe(1000);
    expect(ticked.phase).toBe(2);
    expect(ticked.hasTransitioned).toBe(true);
  });

  it('clamps to zero when timer expires', () => {
    const state = transitionToPhase2(1500);
    const ticked = tickInvulnerability(state, 2000);
    expect(ticked.invulnerabilityMs).toBe(0);
  });

  it('returns same state when already zero', () => {
    const state = { phase: 2 as const, hasTransitioned: true, hasTransitionedP3: false, invulnerabilityMs: 0 };
    const ticked = tickInvulnerability(state, 100);
    expect(ticked).toBe(state); // same reference, no mutation
  });

  it('handles exact expiry', () => {
    const state = transitionToPhase2(500);
    const ticked = tickInvulnerability(state, 500);
    expect(ticked.invulnerabilityMs).toBe(0);
  });

  it('works for Phase 3 invulnerability', () => {
    const p2State = transitionToPhase2(0);
    const state = transitionToPhase3(p2State, 1000);
    expect(isInvulnerable(state)).toBe(true);
    const ticked = tickInvulnerability(state, 1000);
    expect(isInvulnerable(ticked)).toBe(false);
  });
});

describe('isInvulnerable', () => {
  it('returns true when timer is positive', () => {
    const state = transitionToPhase2(1000);
    expect(isInvulnerable(state)).toBe(true);
  });

  it('returns false when timer is zero', () => {
    const state = { phase: 2 as const, hasTransitioned: true, hasTransitionedP3: false, invulnerabilityMs: 0 };
    expect(isInvulnerable(state)).toBe(false);
  });

  it('returns false for initial state', () => {
    expect(isInvulnerable(createBossPhaseState())).toBe(false);
  });
});

describe('getPhase2Stats', () => {
  const speedMap = { boss_chase: 1.8, boss_circle: 1.4, boss_burst: 1.3 };
  const damageMap = { boss_chase: 1.5, boss_circle: 1.3, boss_burst: 1.3 };

  it('returns 1x multipliers for Phase 1', () => {
    const stats = getPhase2Stats(1, 'boss_chase', speedMap, damageMap);
    expect(stats.speedMult).toBe(1);
    expect(stats.damageMult).toBe(1);
  });

  it('returns correct multipliers for boss_chase Phase 2', () => {
    const stats = getPhase2Stats(2, 'boss_chase', speedMap, damageMap);
    expect(stats.speedMult).toBe(1.8);
    expect(stats.damageMult).toBe(1.5);
  });

  it('returns correct multipliers for boss_circle Phase 2', () => {
    const stats = getPhase2Stats(2, 'boss_circle', speedMap, damageMap);
    expect(stats.speedMult).toBe(1.4);
    expect(stats.damageMult).toBe(1.3);
  });

  it('returns correct multipliers for boss_burst Phase 2', () => {
    const stats = getPhase2Stats(2, 'boss_burst', speedMap, damageMap);
    expect(stats.speedMult).toBe(1.3);
    expect(stats.damageMult).toBe(1.3);
  });

  it('returns 1x for unknown behavior in Phase 2', () => {
    const stats = getPhase2Stats(2, 'unknown_boss', speedMap, damageMap);
    expect(stats.speedMult).toBe(1);
    expect(stats.damageMult).toBe(1);
  });

  it('returns multipliers for Phase 3 (same as Phase 2)', () => {
    const stats = getPhase2Stats(3, 'boss_burst', speedMap, damageMap);
    expect(stats.speedMult).toBe(1.3);
    expect(stats.damageMult).toBe(1.3);
  });
});

describe('getPhase3Stats', () => {
  const speedMap = { boss_burst: 1.3 };
  const damageMap = { boss_burst: 1.3 };

  it('returns 1x for Phase 1', () => {
    const stats = getPhase3Stats(1, 'boss_burst', speedMap, damageMap);
    expect(stats.speedMult).toBe(1);
    expect(stats.damageMult).toBe(1);
  });

  it('returns 1x for Phase 2', () => {
    const stats = getPhase3Stats(2, 'boss_burst', speedMap, damageMap);
    expect(stats.speedMult).toBe(1);
    expect(stats.damageMult).toBe(1);
  });

  it('returns multipliers for Phase 3', () => {
    const stats = getPhase3Stats(3, 'boss_burst', speedMap, damageMap);
    expect(stats.speedMult).toBe(1.3);
    expect(stats.damageMult).toBe(1.3);
  });
});

describe('integration: full 3-phase transition flow (Boss Aero)', () => {
  it('P1 → P2 → P3 with invulnerability and stats', () => {
    // Start in Phase 1
    let state = createBossPhaseState();
    expect(state.phase).toBe(1);

    // Boss at 70% HP — no transition (Aero threshold = 0.66)
    expect(shouldTransitionToPhase2(700, 1000, 0.66, state.hasTransitioned)).toBe(false);

    // Boss drops to 65% HP — P2 transition triggers
    expect(shouldTransitionToPhase2(650, 1000, 0.66, state.hasTransitioned)).toBe(true);

    // Execute P2 transition
    state = transitionToPhase2(1500);
    expect(state.phase).toBe(2);
    expect(isInvulnerable(state)).toBe(true);
    expect(state.hasTransitionedP3).toBe(false);

    // Tick through invulnerability
    state = tickInvulnerability(state, 1500);
    expect(isInvulnerable(state)).toBe(false);

    // P2 stats
    const p2Stats = getPhase2Stats(state.phase, 'boss_burst', { boss_burst: 1.3 }, { boss_burst: 1.3 });
    expect(p2Stats.speedMult).toBe(1.3);

    // Boss at 40% — no P3 yet (threshold = 0.33)
    expect(shouldTransitionToPhase3(400, 1000, 0.33, state.hasTransitionedP3)).toBe(false);

    // Boss drops to 32% — P3 triggers
    expect(shouldTransitionToPhase3(320, 1000, 0.33, state.hasTransitionedP3)).toBe(true);

    // Execute P3 transition
    state = transitionToPhase3(state, 1500);
    expect(state.phase).toBe(3);
    expect(state.hasTransitionedP3).toBe(true);
    expect(isInvulnerable(state)).toBe(true);

    // Cannot transition to P3 again
    expect(shouldTransitionToPhase3(100, 1000, 0.33, state.hasTransitionedP3)).toBe(false);

    // Tick through P3 invulnerability
    state = tickInvulnerability(state, 2000);
    expect(isInvulnerable(state)).toBe(false);
    expect(state.phase).toBe(3);
  });
});
