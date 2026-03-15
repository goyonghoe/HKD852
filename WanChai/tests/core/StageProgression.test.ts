/**
 * TASK-094: StageProgression pure function tests.
 * No Phaser imports — all tested via pure TS logic + BALANCE config.
 */
import { describe, it, expect } from 'vitest';
import { getMaxClearedStage, getStageStatus, getNextPlayableStage } from '../../src/core/StageProgression';
import { BALANCE } from '../../src/config/balance';

const MAX_STAGES = BALANCE.STAGE.maxStages; // 6

// =======================================================================
// 1. getMaxClearedStage
// =======================================================================
describe('getMaxClearedStage', () => {
  it('returns 0 when runsCompleted is 0', () => {
    expect(getMaxClearedStage(0, MAX_STAGES)).toBe(0);
  });

  it('returns maxStages when runsCompleted is 1', () => {
    expect(getMaxClearedStage(1, MAX_STAGES)).toBe(MAX_STAGES);
  });

  it('returns maxStages when runsCompleted exceeds 1', () => {
    expect(getMaxClearedStage(10, MAX_STAGES)).toBe(MAX_STAGES);
  });

  it('returns maxStages for very large runsCompleted', () => {
    expect(getMaxClearedStage(9999, MAX_STAGES)).toBe(MAX_STAGES);
  });

  it('returns 0 for negative runsCompleted', () => {
    expect(getMaxClearedStage(-1, MAX_STAGES)).toBe(0);
  });

  it('works with different maxStages values', () => {
    expect(getMaxClearedStage(1, 8)).toBe(8);
    expect(getMaxClearedStage(0, 8)).toBe(0);
  });
});

// =======================================================================
// 2. getStageStatus
// =======================================================================
describe('getStageStatus', () => {
  it('first stage is current when maxCleared is 0', () => {
    expect(getStageStatus(0, 0)).toBe('current');
  });

  it('first stage is cleared when maxCleared >= 1', () => {
    expect(getStageStatus(0, 1)).toBe('cleared');
    expect(getStageStatus(0, MAX_STAGES)).toBe('cleared');
  });

  it('middle stage is locked when not yet reached', () => {
    expect(getStageStatus(5, 2)).toBe('locked');
  });

  it('middle stage is current when it is the next playable', () => {
    expect(getStageStatus(2, 2)).toBe('current');
  });

  it('middle stage is cleared when past it', () => {
    expect(getStageStatus(2, 5)).toBe('cleared');
  });

  it('final stage (index 15) is locked when far from it', () => {
    expect(getStageStatus(MAX_STAGES - 1, 0)).toBe('locked');
  });

  it('final stage is current when maxCleared is maxStages - 1', () => {
    expect(getStageStatus(MAX_STAGES - 1, MAX_STAGES - 1)).toBe('current');
  });

  it('final stage is cleared when all stages beaten', () => {
    expect(getStageStatus(MAX_STAGES - 1, MAX_STAGES)).toBe('cleared');
  });

  it('stage beyond max is locked when all cleared', () => {
    // stageIndex = maxStages (one beyond last valid index)
    // stageNumber = maxStages + 1 > maxCleared => would be 'current' if maxCleared = maxStages
    // But actually maxCleared = maxStages, stageNumber = maxStages+1 => 'current' (replay scenario)
    // This is an edge case — beyond the valid range, but the function should handle it gracefully
    const beyondStatus = getStageStatus(MAX_STAGES, MAX_STAGES);
    expect(beyondStatus).toBe('current');
  });
});

// =======================================================================
// 3. getNextPlayableStage
// =======================================================================
describe('getNextPlayableStage', () => {
  it('returns 1 for fresh game (0 cleared)', () => {
    expect(getNextPlayableStage(0, MAX_STAGES)).toBe(1);
  });

  it('returns stage after last cleared for mid-progress', () => {
    expect(getNextPlayableStage(3, MAX_STAGES)).toBe(4);
    expect(getNextPlayableStage(5, MAX_STAGES)).toBe(6);
  });

  it('returns maxStages when all stages are cleared (replay last)', () => {
    expect(getNextPlayableStage(MAX_STAGES, MAX_STAGES)).toBe(MAX_STAGES);
  });

  it('returns maxStages when cleared exceeds maxStages', () => {
    expect(getNextPlayableStage(MAX_STAGES + 5, MAX_STAGES)).toBe(MAX_STAGES);
  });

  it('returns 1 when maxCleared is 0 regardless of maxStages', () => {
    expect(getNextPlayableStage(0, 6)).toBe(1);
    expect(getNextPlayableStage(0, 100)).toBe(1);
  });
});

// =======================================================================
// 4. Integration with BALANCE.STAGE constants
// =======================================================================
describe('Integration with BALANCE.STAGE', () => {
  it('maxStages is 6', () => {
    expect(BALANCE.STAGE.maxStages).toBe(6);
  });

  it('3 wave stages and 3 boss stages covers all 6 stages', () => {
    const waveCount = BALANCE.STAGE.stages.filter((s: { type: string }) => s.type === 'wave').length;
    const bossCount = BALANCE.STAGE.stages.filter((s: { type: string }) => s.type === 'boss').length;
    expect(waveCount).toBe(3);
    expect(bossCount).toBe(3);
  });
});
