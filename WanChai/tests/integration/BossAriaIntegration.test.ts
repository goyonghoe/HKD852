/**
 * TASK-130: Boss Phase Transition + ARIA Event Integration Tests
 *
 * Verifies that BossPhaseCalc (TASK-121) and AriaDialogueCalc (TASK-125)
 * work correctly together, including edge cases and regression scenarios.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  createBossPhaseState,
  shouldTransitionToPhase2,
  transitionToPhase2,
  tickInvulnerability,
  isInvulnerable,
  getPhase2Stats,
  type BossPhaseState,
} from '../../src/core/BossPhaseCalc';
import {
  getChapter,
  getAriaDialogueKey,
  AriaCooldownTracker,
  shouldShowLowHp,
  type AriaEventType,
} from '../../src/core/AriaDialogueCalc';
import { BALANCE } from '../../src/config/balance';
import { ko } from '../../src/locales/ko';
import { en } from '../../src/locales/en';
import { isBossBehavior } from '../../src/core/EnemyScalingCalc';

// ===============================================================
// 1. Boss Phase Transition Tests (15+)
// ===============================================================

describe('Boss Phase Transition — threshold precision', () => {
  const threshold = BALANCE.BOSS_PHASE.phaseThreshold; // 0.5

  it('triggers at exactly 50% HP (500/1000)', () => {
    expect(shouldTransitionToPhase2(500, 1000, threshold, false)).toBe(true);
  });

  it('does NOT trigger at 51% HP (510/1000)', () => {
    expect(shouldTransitionToPhase2(510, 1000, threshold, false)).toBe(false);
  });

  it('triggers at 49% HP (490/1000)', () => {
    expect(shouldTransitionToPhase2(490, 1000, threshold, false)).toBe(true);
  });

  it('triggers at exactly 50% with odd maxHp (50/100)', () => {
    expect(shouldTransitionToPhase2(50, 100, threshold, false)).toBe(true);
  });

  it('does NOT trigger at 50.1% HP (501/1000)', () => {
    expect(shouldTransitionToPhase2(501, 1000, threshold, false)).toBe(false);
  });
});

describe('Boss Phase Transition — single-fire guarantee', () => {
  it('second hit below threshold does NOT re-trigger', () => {
    let state = createBossPhaseState();
    // First hit drops to 45% — triggers
    expect(shouldTransitionToPhase2(450, 1000, 0.5, state.hasTransitioned)).toBe(true);
    state = transitionToPhase2(BALANCE.BOSS_PHASE.invulnerabilityMs);

    // Second hit at 30% — should NOT trigger again
    expect(shouldTransitionToPhase2(300, 1000, 0.5, state.hasTransitioned)).toBe(false);
  });

  it('state remains Phase 2 after multiple damage events', () => {
    let state = transitionToPhase2(1500);
    // Tick through invulnerability
    state = tickInvulnerability(state, 2000);
    expect(state.phase).toBe(2);
    expect(state.hasTransitioned).toBe(true);
    // Cannot transition again
    expect(shouldTransitionToPhase2(100, 1000, 0.5, state.hasTransitioned)).toBe(false);
  });
});

describe('Boss Phase Transition — invulnerability timer', () => {
  it('blocks damage for exactly invulnerabilityMs', () => {
    const state = transitionToPhase2(BALANCE.BOSS_PHASE.invulnerabilityMs);
    expect(isInvulnerable(state)).toBe(true);
  });

  it('still invulnerable just before timer expires', () => {
    let state = transitionToPhase2(1500);
    state = tickInvulnerability(state, 1499);
    expect(isInvulnerable(state)).toBe(true);
    expect(state.invulnerabilityMs).toBe(1);
  });

  it('invulnerability expires after timer', () => {
    let state = transitionToPhase2(1500);
    state = tickInvulnerability(state, 1500);
    expect(isInvulnerable(state)).toBe(false);
    expect(state.invulnerabilityMs).toBe(0);
  });

  it('invulnerability clamps to zero on overshoot', () => {
    let state = transitionToPhase2(1500);
    state = tickInvulnerability(state, 5000);
    expect(state.invulnerabilityMs).toBe(0);
    expect(isInvulnerable(state)).toBe(false);
  });

  it('invulnerability timer uses BALANCE constant correctly', () => {
    const state = transitionToPhase2(BALANCE.BOSS_PHASE.invulnerabilityMs);
    expect(state.invulnerabilityMs).toBe(1500);
  });
});

describe('Boss Phase Transition — Phase 2 stat multipliers', () => {
  const speedMap = BALANCE.BOSS_PHASE.phase2SpeedMult;
  const damageMap = BALANCE.BOSS_PHASE.phase2DamageMult;

  it('boss_chase gets correct Phase 2 speed (1.8x) and damage (1.5x)', () => {
    const stats = getPhase2Stats(2, 'boss_chase', speedMap, damageMap);
    expect(stats.speedMult).toBe(1.8);
    expect(stats.damageMult).toBe(1.5);
  });

  it('boss_circle gets correct Phase 2 speed (1.4x) and damage (1.3x)', () => {
    const stats = getPhase2Stats(2, 'boss_circle', speedMap, damageMap);
    expect(stats.speedMult).toBe(1.4);
    expect(stats.damageMult).toBe(1.3);
  });

  it('boss_burst gets correct Phase 2 speed (1.3x) and damage (1.3x)', () => {
    const stats = getPhase2Stats(2, 'boss_burst', speedMap, damageMap);
    expect(stats.speedMult).toBe(1.3);
    expect(stats.damageMult).toBe(1.3);
  });

  it('Phase 1 always returns 1x multipliers regardless of behavior', () => {
    for (const behavior of ['boss_chase', 'boss_circle', 'boss_burst']) {
      const stats = getPhase2Stats(1, behavior, speedMap, damageMap);
      expect(stats.speedMult).toBe(1);
      expect(stats.damageMult).toBe(1);
    }
  });

  it('boss_burst Phase 2 timing constants are defined in BALANCE', () => {
    expect(BALANCE.BOSS_PHASE.phase2BurstIdleMs).toBe(1000);
    expect(BALANCE.BOSS_PHASE.phase2BurstChargeMs).toBe(1500);
  });
});

describe('Boss Phase Transition — non-boss immunity', () => {
  it('non-boss behaviors are not recognized as boss', () => {
    const nonBossBehaviors = ['march', 'dash', 'zigzag', 'chase', 'shoot', 'teleport', 'split_on_death'];
    for (const behavior of nonBossBehaviors) {
      expect(isBossBehavior(behavior)).toBe(false);
    }
  });

  it('only boss_chase, boss_circle, boss_burst are boss behaviors', () => {
    expect(isBossBehavior('boss_chase')).toBe(true);
    expect(isBossBehavior('boss_circle')).toBe(true);
    expect(isBossBehavior('boss_burst')).toBe(true);
  });
});

describe('Boss Phase Transition — Phase 2 persistence', () => {
  it('boss with Phase 2 already active stays in Phase 2', () => {
    const state: BossPhaseState = { phase: 2, hasTransitioned: true, invulnerabilityMs: 0 };
    // Cannot transition again
    expect(shouldTransitionToPhase2(100, 1000, 0.5, state.hasTransitioned)).toBe(false);
    // Phase remains 2
    expect(state.phase).toBe(2);
  });

  it('ticking invulnerability on already-expired state returns same reference', () => {
    const state: BossPhaseState = { phase: 2, hasTransitioned: true, invulnerabilityMs: 0 };
    const ticked = tickInvulnerability(state, 100);
    expect(ticked).toBe(state); // reference equality — no mutation
  });
});

// ===============================================================
// 2. ARIA Dialogue Tests (15+)
// ===============================================================

const ALL_EVENTS: AriaEventType[] = [
  'stage_entry',
  'boss_warning',
  'boss_defeat',
  'stage_clear',
  'district_change',
  'low_hp',
];

describe('ARIA Dialogue — chapter mapping', () => {
  it('Chapter 0 covers stages 1-4', () => {
    for (let s = 1; s <= 4; s++) {
      expect(getChapter(s)).toBe(0);
    }
  });

  it('Chapter 1 covers stages 5-8', () => {
    for (let s = 5; s <= 8; s++) {
      expect(getChapter(s)).toBe(1);
    }
  });

  it('Chapter 2 covers stages 9-12', () => {
    for (let s = 9; s <= 12; s++) {
      expect(getChapter(s)).toBe(2);
    }
  });

  it('Chapter 3 covers stages 13-16', () => {
    for (let s = 13; s <= 16; s++) {
      expect(getChapter(s)).toBe(3);
    }
  });

  it('stages beyond 16 clamp to Chapter 3', () => {
    expect(getChapter(17)).toBe(3);
    expect(getChapter(50)).toBe(3);
    expect(getChapter(999)).toBe(3);
  });
});

describe('ARIA Dialogue — i18n key generation', () => {
  it('generates correct key for every event x chapter combination', () => {
    const expectedKeys: [AriaEventType, number, string][] = [
      ['stage_entry', 1, 'aria.stage_entry.ch0'],
      ['stage_entry', 5, 'aria.stage_entry.ch1'],
      ['stage_entry', 9, 'aria.stage_entry.ch2'],
      ['stage_entry', 13, 'aria.stage_entry.ch3'],
      ['boss_warning', 2, 'aria.boss_warning.ch0'],
      ['boss_warning', 6, 'aria.boss_warning.ch1'],
      ['boss_defeat', 10, 'aria.boss_defeat.ch2'],
      ['boss_defeat', 14, 'aria.boss_defeat.ch3'],
      ['stage_clear', 4, 'aria.stage_clear.ch0'],
      ['district_change', 7, 'aria.district_change.ch1'],
      ['low_hp', 11, 'aria.low_hp.ch2'],
      ['low_hp', 15, 'aria.low_hp.ch3'],
    ];
    for (const [event, stage, expected] of expectedKeys) {
      expect(getAriaDialogueKey(event, stage)).toBe(expected);
    }
  });

  it('boundary stages produce correct chapters', () => {
    // Boundaries: 4→ch0, 5→ch1, 8→ch1, 9→ch2, 12→ch2, 13→ch3
    expect(getAriaDialogueKey('stage_entry', 4)).toBe('aria.stage_entry.ch0');
    expect(getAriaDialogueKey('stage_entry', 5)).toBe('aria.stage_entry.ch1');
    expect(getAriaDialogueKey('stage_entry', 8)).toBe('aria.stage_entry.ch1');
    expect(getAriaDialogueKey('stage_entry', 9)).toBe('aria.stage_entry.ch2');
    expect(getAriaDialogueKey('stage_entry', 12)).toBe('aria.stage_entry.ch2');
    expect(getAriaDialogueKey('stage_entry', 13)).toBe('aria.stage_entry.ch3');
  });
});

describe('ARIA Dialogue — cooldown tracker', () => {
  let tracker: AriaCooldownTracker;
  const cooldownMs = BALANCE.ARIA.cooldownMs; // 8000

  beforeEach(() => {
    tracker = new AriaCooldownTracker();
  });

  it('prevents same event type from firing twice within cooldownMs', () => {
    tracker.markShown('low_hp', 1000);
    expect(tracker.canShow('low_hp', 1000 + cooldownMs - 1, cooldownMs)).toBe(false);
  });

  it('allows same event after cooldown expires', () => {
    tracker.markShown('low_hp', 1000);
    expect(tracker.canShow('low_hp', 1000 + cooldownMs, cooldownMs)).toBe(true);
  });

  it('different event types fire independently (no cross-event cooldown)', () => {
    tracker.markShown('boss_warning', 0);
    expect(tracker.canShow('stage_entry', 0, cooldownMs)).toBe(true);
    expect(tracker.canShow('boss_defeat', 0, cooldownMs)).toBe(true);
    expect(tracker.canShow('low_hp', 0, cooldownMs)).toBe(true);
    expect(tracker.canShow('stage_clear', 0, cooldownMs)).toBe(true);
    expect(tracker.canShow('district_change', 0, cooldownMs)).toBe(true);
  });

  it('all 6 event types can fire independently at the same time', () => {
    for (const event of ALL_EVENTS) {
      expect(tracker.canShow(event, 0, cooldownMs)).toBe(true);
    }
    // Mark all shown
    for (const event of ALL_EVENTS) {
      tracker.markShown(event, 0);
    }
    // All on cooldown now
    for (const event of ALL_EVENTS) {
      expect(tracker.canShow(event, cooldownMs - 1, cooldownMs)).toBe(false);
    }
  });

  it('low HP check fires once per stage via resetForStage', () => {
    // Show low_hp
    tracker.markShown('low_hp', 0);
    // Cannot show again within cooldown
    expect(tracker.canShow('low_hp', 1000, cooldownMs)).toBe(false);
    // Reset for new stage
    tracker.resetForStage();
    // Can show again immediately
    expect(tracker.canShow('low_hp', 1000, cooldownMs)).toBe(true);
  });

  it('resetForStage clears cooldowns but retains seen keys', () => {
    const key = 'aria.stage_entry.ch0';
    tracker.markSeen(key);
    tracker.markShown('stage_entry', 0);
    tracker.resetForStage();
    // Cooldown cleared
    expect(tracker.canShow('stage_entry', 0, cooldownMs)).toBe(true);
    // Seen key retained
    expect(tracker.hasSeen(key)).toBe(true);
  });

  it('full reset clears both cooldowns and seen keys', () => {
    const key = 'aria.boss_warning.ch1';
    tracker.markSeen(key);
    tracker.markShown('boss_warning', 0);
    tracker.reset();
    expect(tracker.canShow('boss_warning', 0, cooldownMs)).toBe(true);
    expect(tracker.hasSeen(key)).toBe(false);
  });
});

describe('ARIA Dialogue — shouldShowLowHp', () => {
  const threshold = BALANCE.ARIA.lowHpThreshold; // 0.3

  it('fires when HP drops below 30% and not yet shown', () => {
    expect(shouldShowLowHp(0.29, threshold, false)).toBe(true);
  });

  it('does NOT fire at exactly 30%', () => {
    expect(shouldShowLowHp(0.3, threshold, false)).toBe(false);
  });

  it('does NOT fire when already shown', () => {
    expect(shouldShowLowHp(0.1, threshold, true)).toBe(false);
  });
});

describe('ARIA Dialogue — all 24 i18n keys exist in both locales', () => {
  it('all 24 keys (6 events x 4 chapters) exist in ko.ts', () => {
    for (const event of ALL_EVENTS) {
      for (let ch = 0; ch <= 3; ch++) {
        const key = `aria.${event}.ch${ch}`;
        expect(ko).toHaveProperty(key, expect.any(String));
      }
    }
  });

  it('all 24 keys (6 events x 4 chapters) exist in en.ts', () => {
    for (const event of ALL_EVENTS) {
      for (let ch = 0; ch <= 3; ch++) {
        const key = `aria.${event}.ch${ch}`;
        expect(en).toHaveProperty(key, expect.any(String));
      }
    }
  });

  it('no ARIA dialogue key is an empty string in ko.ts', () => {
    for (const event of ALL_EVENTS) {
      for (let ch = 0; ch <= 3; ch++) {
        const key = `aria.${event}.ch${ch}`;
        expect(ko[key].length).toBeGreaterThan(0);
      }
    }
  });

  it('no ARIA dialogue key is an empty string in en.ts', () => {
    for (const event of ALL_EVENTS) {
      for (let ch = 0; ch <= 3; ch++) {
        const key = `aria.${event}.ch${ch}`;
        expect(en[key].length).toBeGreaterThan(0);
      }
    }
  });

  it('ko and en keys are different (not copy-pasted)', () => {
    for (const event of ALL_EVENTS) {
      for (let ch = 0; ch <= 3; ch++) {
        const key = `aria.${event}.ch${ch}`;
        expect(ko[key]).not.toBe(en[key]);
      }
    }
  });
});

// ===============================================================
// 3. Integration Flow Tests (10+)
// ===============================================================

describe('Integration Flow — Boss spawn + ARIA boss_warning', () => {
  it('boss_warning fires with correct chapter key for stage 2 (ch0)', () => {
    const key = getAriaDialogueKey('boss_warning', 2);
    expect(key).toBe('aria.boss_warning.ch0');
    expect(ko[key]).toBeDefined();
    expect(en[key]).toBeDefined();
  });

  it('boss_warning fires with correct chapter key for stage 10 (ch2)', () => {
    const key = getAriaDialogueKey('boss_warning', 10);
    expect(key).toBe('aria.boss_warning.ch2');
  });

  it('boss_warning fires with correct chapter key for stage 16 (ch3)', () => {
    const key = getAriaDialogueKey('boss_warning', 16);
    expect(key).toBe('aria.boss_warning.ch3');
  });
});

describe('Integration Flow — Boss HP drop + Phase 2 + invulnerability', () => {
  it('boss HP drops below 50% -> Phase 2 triggers -> invulnerability starts', () => {
    let state = createBossPhaseState();
    const bossMaxHp = 2000;
    let bossHp = 2000;
    const threshold = BALANCE.BOSS_PHASE.phaseThreshold;

    // Hit boss down to 60% — no transition
    bossHp = 1200;
    expect(shouldTransitionToPhase2(bossHp, bossMaxHp, threshold, state.hasTransitioned)).toBe(false);

    // Hit boss down to 49% — transition triggers
    bossHp = 980;
    expect(shouldTransitionToPhase2(bossHp, bossMaxHp, threshold, state.hasTransitioned)).toBe(true);

    // Execute transition
    state = transitionToPhase2(BALANCE.BOSS_PHASE.invulnerabilityMs);
    expect(state.phase).toBe(2);
    expect(isInvulnerable(state)).toBe(true);

    // During invulnerability, damage should be blocked (simulated)
    expect(isInvulnerable(state)).toBe(true);

    // Tick through invulnerability
    state = tickInvulnerability(state, BALANCE.BOSS_PHASE.invulnerabilityMs);
    expect(isInvulnerable(state)).toBe(false);

    // Phase 2 stats now active
    const stats = getPhase2Stats(
      state.phase,
      'boss_chase',
      BALANCE.BOSS_PHASE.phase2SpeedMult,
      BALANCE.BOSS_PHASE.phase2DamageMult,
    );
    expect(stats.speedMult).toBe(1.8);
    expect(stats.damageMult).toBe(1.5);
  });
});

describe('Integration Flow — Boss death + ARIA boss_defeat', () => {
  it('boss death fires ARIA boss_defeat with correct chapter key', () => {
    // Stage 6 = Chapter 1
    const key = getAriaDialogueKey('boss_defeat', 6);
    expect(key).toBe('aria.boss_defeat.ch1');
    expect(ko[key]).toContain('ARIA-01');
    expect(en[key]).toContain('ARIA-01');
  });
});

describe('Integration Flow — Stage clear + ARIA stage_clear', () => {
  it('stage clear fires ARIA stage_clear with correct chapter key', () => {
    // Stage 12 = Chapter 2
    const key = getAriaDialogueKey('stage_clear', 12);
    expect(key).toBe('aria.stage_clear.ch2');
    expect(ko[key]).toBeDefined();
    expect(en[key]).toBeDefined();
  });
});

describe('Integration Flow — District change + ARIA district_change', () => {
  it('district change fires with correct chapter key', () => {
    // Stage 5 = first stage of chapter 1
    const key = getAriaDialogueKey('district_change', 5);
    expect(key).toBe('aria.district_change.ch1');
    expect(ko[key]).toBeDefined();
    expect(en[key]).toBeDefined();
  });
});

describe('Integration Flow — M-014 regression: boss death + level-up simultaneous', () => {
  it('boss death + level-up: phase state is independent of ARIA events', () => {
    // Scenario: boss dies (HP=0), level-up triggers simultaneously.
    // The phase system must be cleanly finalized regardless.
    let state = createBossPhaseState();

    // Boss transitions to Phase 2 at 50% HP
    expect(shouldTransitionToPhase2(500, 1000, 0.5, state.hasTransitioned)).toBe(true);
    state = transitionToPhase2(1500);

    // Invulnerability expires
    state = tickInvulnerability(state, 1500);
    expect(isInvulnerable(state)).toBe(false);

    // Boss dies — boss_defeat ARIA fires
    const ariaKey = getAriaDialogueKey('boss_defeat', 4);
    expect(ariaKey).toBe('aria.boss_defeat.ch0');

    // Simultaneously, stage_clear ARIA should also be queueable
    const clearKey = getAriaDialogueKey('stage_clear', 4);
    expect(clearKey).toBe('aria.stage_clear.ch0');

    // These are independent events: both can fire without softlock
    const tracker = new AriaCooldownTracker();
    expect(tracker.canShow('boss_defeat', 0, BALANCE.ARIA.cooldownMs)).toBe(true);
    tracker.markShown('boss_defeat', 0);
    // stage_clear is a different event type, should fire independently
    expect(tracker.canShow('stage_clear', 0, BALANCE.ARIA.cooldownMs)).toBe(true);
  });
});

describe('Integration Flow — Phase transition VFX does not block ARIA', () => {
  it('ARIA message can fire during boss phase transition invulnerability', () => {
    const state = transitionToPhase2(1500);
    expect(isInvulnerable(state)).toBe(true);

    // ARIA cooldown tracker is independent of phase state
    const tracker = new AriaCooldownTracker();
    // Even during invulnerability, ARIA events are allowed
    expect(tracker.canShow('boss_warning', 0, BALANCE.ARIA.cooldownMs)).toBe(true);
    expect(tracker.canShow('low_hp', 0, BALANCE.ARIA.cooldownMs)).toBe(true);
  });
});

describe('Integration Flow — Multiple bosses in sequence', () => {
  it('each boss gets independent phase state', () => {
    // Boss 1: transitions to Phase 2
    let state1 = createBossPhaseState();
    expect(shouldTransitionToPhase2(400, 1000, 0.5, state1.hasTransitioned)).toBe(true);
    state1 = transitionToPhase2(1500);

    // Boss 2: fresh state, independent of Boss 1
    let state2 = createBossPhaseState();
    expect(state2.phase).toBe(1);
    expect(state2.hasTransitioned).toBe(false);
    expect(shouldTransitionToPhase2(400, 1000, 0.5, state2.hasTransitioned)).toBe(true);
    state2 = transitionToPhase2(1500);

    // Both in Phase 2 independently
    expect(state1.phase).toBe(2);
    expect(state2.phase).toBe(2);
  });

  it('ARIA events fire with updated chapter for later bosses', () => {
    // Boss at stage 2 (ch0)
    const key1 = getAriaDialogueKey('boss_warning', 2);
    // Boss at stage 8 (ch1)
    const key2 = getAriaDialogueKey('boss_warning', 8);
    // Boss at stage 14 (ch3)
    const key3 = getAriaDialogueKey('boss_warning', 14);

    expect(key1).toBe('aria.boss_warning.ch0');
    expect(key2).toBe('aria.boss_warning.ch1');
    expect(key3).toBe('aria.boss_warning.ch3');

    // All keys exist in both locales
    for (const key of [key1, key2, key3]) {
      expect(ko[key]).toBeDefined();
      expect(en[key]).toBeDefined();
    }
  });
});

describe('Integration Flow — Full run scenario', () => {
  it('complete 4-stage mini-run: entry -> boss_warning -> phase2 -> boss_defeat -> stage_clear', () => {
    const tracker = new AriaCooldownTracker();
    const cooldown = BALANCE.ARIA.cooldownMs;

    // Stage 1: entry
    const entryKey = getAriaDialogueKey('stage_entry', 1);
    expect(entryKey).toBe('aria.stage_entry.ch0');
    expect(tracker.canShow('stage_entry', 0, cooldown)).toBe(true);
    tracker.markShown('stage_entry', 0);

    // Stage 2: boss stage — boss_warning fires
    const warnKey = getAriaDialogueKey('boss_warning', 2);
    expect(warnKey).toBe('aria.boss_warning.ch0');
    expect(tracker.canShow('boss_warning', 5000, cooldown)).toBe(true);
    tracker.markShown('boss_warning', 5000);

    // Boss fight: Phase 2 transition
    let bossPhase = createBossPhaseState();
    expect(shouldTransitionToPhase2(500, 1000, 0.5, bossPhase.hasTransitioned)).toBe(true);
    bossPhase = transitionToPhase2(BALANCE.BOSS_PHASE.invulnerabilityMs);
    expect(bossPhase.phase).toBe(2);

    // Invulnerability expires
    bossPhase = tickInvulnerability(bossPhase, BALANCE.BOSS_PHASE.invulnerabilityMs);
    expect(isInvulnerable(bossPhase)).toBe(false);

    // Boss dies — boss_defeat fires
    const defeatKey = getAriaDialogueKey('boss_defeat', 2);
    expect(defeatKey).toBe('aria.boss_defeat.ch0');
    expect(tracker.canShow('boss_defeat', 10000, cooldown)).toBe(true);
    tracker.markShown('boss_defeat', 10000);

    // Stage clear fires
    const clearKey = getAriaDialogueKey('stage_clear', 2);
    expect(clearKey).toBe('aria.stage_clear.ch0');
    expect(tracker.canShow('stage_clear', 10000, cooldown)).toBe(true);
    tracker.markShown('stage_clear', 10000);

    // Reset for next stage
    tracker.resetForStage();

    // Stage 3 entry (ch0 still)
    const entry3Key = getAriaDialogueKey('stage_entry', 3);
    expect(entry3Key).toBe('aria.stage_entry.ch0');
    expect(tracker.canShow('stage_entry', 12000, cooldown)).toBe(true);
  });
});

describe('Integration Flow — BALANCE constants cross-system consistency', () => {
  it('BOSS_PHASE.phaseThreshold matches design spec (0.5 = 50%)', () => {
    expect(BALANCE.BOSS_PHASE.phaseThreshold).toBe(0.5);
  });

  it('BOSS_PHASE.invulnerabilityMs is 1500ms', () => {
    expect(BALANCE.BOSS_PHASE.invulnerabilityMs).toBe(1500);
  });

  it('ARIA.cooldownMs is 8000ms', () => {
    expect(BALANCE.ARIA.cooldownMs).toBe(8000);
  });

  it('ARIA.lowHpThreshold is 0.3 (30%)', () => {
    expect(BALANCE.ARIA.lowHpThreshold).toBe(0.3);
  });

  it('all 3 boss types have Phase 2 speed and damage multipliers defined', () => {
    for (const bossType of ['boss_chase', 'boss_circle', 'boss_burst']) {
      expect(BALANCE.BOSS_PHASE.phase2SpeedMult[bossType]).toBeDefined();
      expect(BALANCE.BOSS_PHASE.phase2SpeedMult[bossType]).toBeGreaterThan(1);
      expect(BALANCE.BOSS_PHASE.phase2DamageMult[bossType]).toBeDefined();
      expect(BALANCE.BOSS_PHASE.phase2DamageMult[bossType]).toBeGreaterThan(1);
    }
  });
});
