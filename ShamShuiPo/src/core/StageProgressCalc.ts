/**
 * StageProgressCalc — pure display calculator for run stage progression.
 * No Phaser imports. Deterministic from elapsed time alone.
 */

export interface StageProgress {
  /** Overall run progress 0.0 to 1.0 */
  progress: number;
  /** Current stage number (1-10) */
  stage: number;
  /** Seconds elapsed in current stage (0-60) */
  stageElapsed: number;
  /** Seconds remaining in current stage */
  stageRemaining: number;
  /** Total time remaining in run */
  totalRemaining: number;
  /** Whether we're in the final 2 minutes (increased urgency) */
  isUrgent: boolean;
  /** Next upcoming boss stage number, or null if past all bosses */
  nextBossStage: number | null;
  /** Stage label for display */
  stageLabel: string;
}

const DEFAULT_BOSS_STAGES = [5, 10];
const STAGES_TOTAL = 10;

function getStageLabel(stage: number): string {
  if (stage <= 3) return "EARLY";
  if (stage <= 6) return "MID";
  if (stage <= 8) return "LATE";
  if (stage === 9) return "DANGER";
  return "FINAL";
}

export function calculateStageProgress(
  elapsed: number,
  runDuration: number = 600,
  bossStages: number[] = DEFAULT_BOSS_STAGES,
): StageProgress {
  const clamped = Math.max(0, Math.min(elapsed, runDuration));
  const stageDuration = runDuration / STAGES_TOTAL; // 60s per stage at default 600

  const progress = Math.min(clamped / runDuration, 1);
  const totalRemaining = Math.max(runDuration - clamped, 0);

  // Stage is 1-indexed; at exactly 600s we stay at stage 10
  const stageZero = Math.floor(clamped / stageDuration); // 0-based
  const stage = Math.min(stageZero + 1, STAGES_TOTAL);

  const stageStart = (stage - 1) * stageDuration;
  const stageElapsed = Math.min(clamped - stageStart, stageDuration);
  const stageRemaining = Math.max(stageDuration - stageElapsed, 0);

  const isUrgent = totalRemaining <= 120 && totalRemaining < runDuration;

  // Find next boss stage >= current stage that hasn't been passed
  const sorted = [...bossStages].sort((a, b) => a - b);
  let nextBossStage: number | null = null;
  for (const bs of sorted) {
    if (bs > stage || (bs === stage && stageElapsed < stageDuration)) {
      // Boss stage is upcoming if we haven't completed it
      // At the boss stage itself, boss is "current" not "next" once stage is done
      if (bs > stage) {
        nextBossStage = bs;
        break;
      }
    }
  }

  return {
    progress,
    stage,
    stageElapsed,
    stageRemaining,
    totalRemaining,
    isUrgent,
    nextBossStage,
    stageLabel: getStageLabel(stage),
  };
}
