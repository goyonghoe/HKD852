import { describe, it, expect } from 'vitest';
import {
  MILESTONES,
  MILESTONE_MAP,
  checkMilestones,
  getMilestoneProgress,
  getMilestoneProgressInfo,
  sumMilestonePrestige,
  collectCosmeticUnlocks,
  getMilestonesByCategory,
  getNextMilestone,
  type MilestoneCheckInput,
} from '../../src/core/MilestoneCalc';
import { BALANCE } from '../../src/config/balance';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeInput(overrides: Partial<MilestoneCheckInput> = {}): MilestoneCheckInput {
  return {
    runsCompleted: 0,
    totalKills: 0,
    highestStageReached: 0,
    claimedMilestoneIds: new Set(),
    ...overrides,
  };
}

// ── MILESTONE definitions ─────────────────────────────────────────────────────

describe('MILESTONES definitions', () => {
  it('contains all run milestones from balance config', () => {
    const runIds = MILESTONES.filter((m) => m.category === 'runs').map((m) => m.id);
    const expectedIds = BALANCE.MILESTONE.runs.map((r) => r.id);
    for (const id of expectedIds) {
      expect(runIds).toContain(id);
    }
  });

  it('contains all kill milestones from balance config', () => {
    const killIds = MILESTONES.filter((m) => m.category === 'kills').map((m) => m.id);
    const expectedIds = BALANCE.MILESTONE.kills.map((r) => r.id);
    for (const id of expectedIds) {
      expect(killIds).toContain(id);
    }
  });

  it('contains all stage milestones from balance config', () => {
    const stageIds = MILESTONES.filter((m) => m.category === 'stages').map((m) => m.id);
    const expectedIds = BALANCE.MILESTONE.stages.map((r) => r.id);
    for (const id of expectedIds) {
      expect(stageIds).toContain(id);
    }
  });

  it('total milestone count = runs + kills + stages entries', () => {
    const total = BALANCE.MILESTONE.runs.length + BALANCE.MILESTONE.kills.length + BALANCE.MILESTONE.stages.length;
    expect(MILESTONES.length).toBe(total);
  });

  it('all milestones have required fields', () => {
    for (const m of MILESTONES) {
      expect(m.id).toBeTruthy();
      expect(['runs', 'kills', 'stages']).toContain(m.category);
      expect(m.target).toBeGreaterThan(0);
      expect(m.prestigePoints).toBeGreaterThan(0);
    }
  });

  it('MILESTONE_MAP contains all milestones by ID', () => {
    for (const m of MILESTONES) {
      expect(MILESTONE_MAP[m.id]).toBe(m);
    }
  });

  it('prestigePoints scale with target for runs', () => {
    const runMilestones = MILESTONES.filter((m) => m.category === 'runs').sort((a, b) => a.target - b.target);
    for (let i = 1; i < runMilestones.length; i++) {
      expect(runMilestones[i].prestigePoints).toBeGreaterThan(runMilestones[i - 1].prestigePoints);
    }
  });
});

// ── getMilestoneProgress ──────────────────────────────────────────────────────

describe('getMilestoneProgress', () => {
  it('returns runsCompleted for "runs" category', () => {
    const input = makeInput({ runsCompleted: 42 });
    expect(getMilestoneProgress(input, 'runs')).toBe(42);
  });

  it('returns totalKills for "kills" category', () => {
    const input = makeInput({ totalKills: 9999 });
    expect(getMilestoneProgress(input, 'kills')).toBe(9999);
  });

  it('returns highestStageReached for "stages" category', () => {
    const input = makeInput({ highestStageReached: 12 });
    expect(getMilestoneProgress(input, 'stages')).toBe(12);
  });
});

// ── checkMilestones — run milestones ─────────────────────────────────────────

describe('checkMilestones — run milestones', () => {
  it('runs_010 earned at 10 runs', () => {
    const input = makeInput({ runsCompleted: 10 });
    const earned = checkMilestones(input);
    expect(earned.map((e) => e.milestone.id)).toContain('runs_010');
  });

  it('runs_010 NOT earned at 9 runs', () => {
    const input = makeInput({ runsCompleted: 9 });
    const earned = checkMilestones(input);
    expect(earned.map((e) => e.milestone.id)).not.toContain('runs_010');
  });

  it('runs_025 earned at exactly 25 runs', () => {
    const input = makeInput({ runsCompleted: 25 });
    const earned = checkMilestones(input);
    expect(earned.map((e) => e.milestone.id)).toContain('runs_025');
  });

  it('runs_500 earned at 500 runs', () => {
    const input = makeInput({ runsCompleted: 500 });
    const earned = checkMilestones(input);
    const ids = earned.map((e) => e.milestone.id);
    expect(ids).toContain('runs_500');
    // All lower milestones are also earned
    expect(ids).toContain('runs_010');
    expect(ids).toContain('runs_025');
    expect(ids).toContain('runs_050');
    expect(ids).toContain('runs_100');
    expect(ids).toContain('runs_250');
  });

  it('already claimed milestones are not returned', () => {
    const claimed = new Set(['runs_010', 'runs_025']);
    const input = makeInput({ runsCompleted: 50, claimedMilestoneIds: claimed });
    const earned = checkMilestones(input);
    const ids = earned.map((e) => e.milestone.id);
    expect(ids).not.toContain('runs_010');
    expect(ids).not.toContain('runs_025');
    expect(ids).toContain('runs_050');
  });
});

// ── checkMilestones — kill milestones ────────────────────────────────────────

describe('checkMilestones — kill milestones', () => {
  it('kills_1k earned at 1000 kills', () => {
    const input = makeInput({ totalKills: 1000 });
    const earned = checkMilestones(input);
    expect(earned.map((e) => e.milestone.id)).toContain('kills_1k');
  });

  it('kills_1k NOT earned at 999 kills', () => {
    const input = makeInput({ totalKills: 999 });
    const earned = checkMilestones(input);
    expect(earned.map((e) => e.milestone.id)).not.toContain('kills_1k');
  });

  it('kills_100k earned at 100000 kills — all lower also earned', () => {
    const input = makeInput({ totalKills: 100000 });
    const earned = checkMilestones(input);
    const ids = earned.map((e) => e.milestone.id);
    expect(ids).toContain('kills_1k');
    expect(ids).toContain('kills_5k');
    expect(ids).toContain('kills_10k');
    expect(ids).toContain('kills_50k');
    expect(ids).toContain('kills_100k');
  });

  it('kills_5k has a cosmeticUnlock', () => {
    const milestone = MILESTONE_MAP['kills_5k'];
    expect(milestone.cosmeticUnlock).toBeDefined();
    expect(typeof milestone.cosmeticUnlock).toBe('string');
  });
});

// ── checkMilestones — stage milestones ───────────────────────────────────────

describe('checkMilestones — stage milestones', () => {
  it('stage_04 earned at highestStage 4', () => {
    const input = makeInput({ highestStageReached: 4 });
    const earned = checkMilestones(input);
    expect(earned.map((e) => e.milestone.id)).toContain('stage_04');
  });

  it('stage_04 NOT earned at highestStage 3', () => {
    const input = makeInput({ highestStageReached: 3 });
    const earned = checkMilestones(input);
    expect(earned.map((e) => e.milestone.id)).not.toContain('stage_04');
  });

  it('stage_16 earned at highestStage 16 — all stage milestones earned', () => {
    const input = makeInput({ highestStageReached: 16 });
    const earned = checkMilestones(input);
    const ids = earned.map((e) => e.milestone.id);
    expect(ids).toContain('stage_04');
    expect(ids).toContain('stage_08');
    expect(ids).toContain('stage_12');
    expect(ids).toContain('stage_16');
  });

  it('stage_16 has cosmeticUnlock', () => {
    const milestone = MILESTONE_MAP['stage_16'];
    expect(milestone.cosmeticUnlock).toBeDefined();
  });
});

// ── getMilestoneProgressInfo ──────────────────────────────────────────────────

describe('getMilestoneProgressInfo', () => {
  it('returns correct current and target for runs_010', () => {
    const input = makeInput({ runsCompleted: 7 });
    const info = getMilestoneProgressInfo(input, 'runs_010');
    expect(info.current).toBe(7);
    expect(info.target).toBe(10);
    expect(info.percent).toBeCloseTo(0.7);
    expect(info.claimed).toBe(false);
  });

  it('clamps current to target when exceeded', () => {
    const input = makeInput({ runsCompleted: 99 });
    const info = getMilestoneProgressInfo(input, 'runs_010');
    expect(info.current).toBe(10); // clamped
    expect(info.percent).toBe(1);
  });

  it('marks claimed correctly', () => {
    const input = makeInput({
      runsCompleted: 10,
      claimedMilestoneIds: new Set(['runs_010']),
    });
    const info = getMilestoneProgressInfo(input, 'runs_010');
    expect(info.claimed).toBe(true);
  });

  it('returns zeros for unknown milestoneId', () => {
    const input = makeInput();
    const info = getMilestoneProgressInfo(input, 'nonexistent');
    expect(info.current).toBe(0);
    expect(info.target).toBe(0);
    expect(info.percent).toBe(0);
  });
});

// ── sumMilestonePrestige ──────────────────────────────────────────────────────

describe('sumMilestonePrestige', () => {
  it('returns 0 for empty array', () => {
    expect(sumMilestonePrestige([])).toBe(0);
  });

  it('sums prestige points correctly', () => {
    const input = makeInput({ runsCompleted: 50, totalKills: 5000 });
    const earned = checkMilestones(input);
    const total = sumMilestonePrestige(earned);
    expect(total).toBeGreaterThan(0);

    // Manual calculation for runs up to 50: 50 + 100 + 200 = 350
    // Kills up to 5000: 50 + 150 = 200
    const expected = 350 + 200;
    expect(total).toBe(expected);
  });
});

// ── collectCosmeticUnlocks ────────────────────────────────────────────────────

describe('collectCosmeticUnlocks', () => {
  it('returns empty array when no cosmetics', () => {
    const input = makeInput({ totalKills: 1000 }); // kills_1k has no cosmeticUnlock
    const earned = checkMilestones(input);
    // kills_1k has no cosmeticUnlock, so nothing from kills alone
    const cosmeticEarned = earned.filter((e) => e.cosmeticUnlock);
    const unlocks = collectCosmeticUnlocks(cosmeticEarned);
    expect(unlocks).toHaveLength(0);
  });

  it('returns cosmetic unlock strings when present', () => {
    const input = makeInput({ runsCompleted: 10 }); // runs_010 has frame_bronze
    const earned = checkMilestones(input);
    const unlocks = collectCosmeticUnlocks(earned);
    expect(unlocks).toContain('frame_bronze');
  });

  it('collects multiple cosmetics when multiple milestones earned', () => {
    const input = makeInput({ runsCompleted: 500 });
    const earned = checkMilestones(input);
    const unlocks = collectCosmeticUnlocks(earned);
    expect(unlocks).toContain('frame_bronze');
    expect(unlocks).toContain('frame_silver');
    expect(unlocks).toContain('frame_gold');
    expect(unlocks.length).toBeGreaterThanOrEqual(3);
  });
});

// ── getMilestonesByCategory ───────────────────────────────────────────────────

describe('getMilestonesByCategory', () => {
  it('returns only runs milestones sorted by target', () => {
    const runMs = getMilestonesByCategory('runs');
    expect(runMs.length).toBe(BALANCE.MILESTONE.runs.length);
    for (const m of runMs) expect(m.category).toBe('runs');
    for (let i = 1; i < runMs.length; i++) {
      expect(runMs[i].target).toBeGreaterThan(runMs[i - 1].target);
    }
  });

  it('returns only kills milestones sorted by target', () => {
    const killMs = getMilestonesByCategory('kills');
    expect(killMs.length).toBe(BALANCE.MILESTONE.kills.length);
    for (const m of killMs) expect(m.category).toBe('kills');
    for (let i = 1; i < killMs.length; i++) {
      expect(killMs[i].target).toBeGreaterThan(killMs[i - 1].target);
    }
  });

  it('returns only stages milestones sorted by target', () => {
    const stageMs = getMilestonesByCategory('stages');
    expect(stageMs.length).toBe(BALANCE.MILESTONE.stages.length);
    for (const m of stageMs) expect(m.category).toBe('stages');
    for (let i = 1; i < stageMs.length; i++) {
      expect(stageMs[i].target).toBeGreaterThan(stageMs[i - 1].target);
    }
  });
});

// ── getNextMilestone ──────────────────────────────────────────────────────────

describe('getNextMilestone', () => {
  it('returns the lowest unclaimed run milestone when at 0 runs', () => {
    const input = makeInput({ runsCompleted: 0 });
    const next = getNextMilestone(input, 'runs');
    expect(next?.id).toBe('runs_010');
  });

  it('returns runs_025 when runs_010 already claimed and at 10 runs', () => {
    const input = makeInput({
      runsCompleted: 10,
      claimedMilestoneIds: new Set(['runs_010']),
    });
    const next = getNextMilestone(input, 'runs');
    expect(next?.id).toBe('runs_025');
  });

  it('returns undefined when all milestones in category are claimed', () => {
    const allStageIds = new Set(BALANCE.MILESTONE.stages.map((s) => s.id));
    const input = makeInput({
      highestStageReached: 16,
      claimedMilestoneIds: allStageIds,
    });
    const next = getNextMilestone(input, 'stages');
    expect(next).toBeUndefined();
  });

  it('returns next unclaimed above current progress', () => {
    // At 30 runs with runs_010 and runs_025 claimed → next is runs_050
    const input = makeInput({
      runsCompleted: 30,
      claimedMilestoneIds: new Set(['runs_010', 'runs_025']),
    });
    const next = getNextMilestone(input, 'runs');
    expect(next?.id).toBe('runs_050');
  });
});

// ── Cross-category milestones ─────────────────────────────────────────────────

describe('checkMilestones — mixed categories', () => {
  it('can earn milestones from multiple categories simultaneously', () => {
    const input = makeInput({
      runsCompleted: 50,
      totalKills: 10000,
      highestStageReached: 8,
    });
    const earned = checkMilestones(input);
    const ids = earned.map((e) => e.milestone.id);

    // Runs: 010, 025, 050
    expect(ids).toContain('runs_010');
    expect(ids).toContain('runs_025');
    expect(ids).toContain('runs_050');

    // Kills: 1k, 5k, 10k
    expect(ids).toContain('kills_1k');
    expect(ids).toContain('kills_5k');
    expect(ids).toContain('kills_10k');

    // Stages: 04, 08
    expect(ids).toContain('stage_04');
    expect(ids).toContain('stage_08');
    expect(ids).not.toContain('stage_12');
  });

  it('zero progress earns no milestones', () => {
    const input = makeInput();
    const earned = checkMilestones(input);
    expect(earned).toHaveLength(0);
  });

  it('all claimed = no new milestones returned', () => {
    const allIds = new Set(MILESTONES.map((m) => m.id));
    const input = makeInput({
      runsCompleted: 9999,
      totalKills: 9999999,
      highestStageReached: 16,
      claimedMilestoneIds: allIds,
    });
    const earned = checkMilestones(input);
    expect(earned).toHaveLength(0);
  });
});
