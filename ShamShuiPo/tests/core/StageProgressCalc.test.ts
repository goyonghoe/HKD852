import { describe, it, expect } from "vitest";
import { calculateStageProgress } from "../../src/core/StageProgressCalc";

describe("calculateStageProgress", () => {
  it("elapsed 0 → stage 1, progress 0, EARLY", () => {
    const r = calculateStageProgress(0, 600);
    expect(r.stage).toBe(1);
    expect(r.progress).toBe(0);
    expect(r.stageLabel).toBe("EARLY");
    expect(r.stageElapsed).toBe(0);
    expect(r.stageRemaining).toBe(60);
    expect(r.totalRemaining).toBe(600);
    expect(r.isUrgent).toBe(false);
  });

  it("elapsed 30 → stage 1, stageElapsed 30, stageRemaining 30", () => {
    const r = calculateStageProgress(30, 600);
    expect(r.stage).toBe(1);
    expect(r.stageElapsed).toBe(30);
    expect(r.stageRemaining).toBe(30);
  });

  it("elapsed 60 → stage 2, progress ~0.1", () => {
    const r = calculateStageProgress(60, 600);
    expect(r.stage).toBe(2);
    expect(r.progress).toBeCloseTo(0.1);
    expect(r.stageLabel).toBe("EARLY");
  });

  it("elapsed 480 → stage 9, isUrgent true, DANGER", () => {
    const r = calculateStageProgress(480, 600);
    expect(r.stage).toBe(9);
    expect(r.isUrgent).toBe(true);
    expect(r.stageLabel).toBe("DANGER");
    expect(r.totalRemaining).toBe(120);
  });

  it("elapsed 540 → stage 10, FINAL", () => {
    const r = calculateStageProgress(540, 600);
    expect(r.stage).toBe(10);
    expect(r.stageLabel).toBe("FINAL");
    expect(r.isUrgent).toBe(true);
  });

  it("elapsed >= 600 → progress capped at 1.0", () => {
    const r = calculateStageProgress(650, 600);
    expect(r.progress).toBe(1);
    expect(r.stage).toBe(10);
    expect(r.totalRemaining).toBe(0);
  });

  it("nextBossStage at stage 1 → 5", () => {
    const r = calculateStageProgress(0, 600);
    expect(r.nextBossStage).toBe(5);
  });

  it("nextBossStage at stage 6 → 10", () => {
    const r = calculateStageProgress(300, 600); // stage 6
    expect(r.stage).toBe(6);
    expect(r.nextBossStage).toBe(10);
  });

  it("nextBossStage at stage 10 → null", () => {
    const r = calculateStageProgress(540, 600);
    expect(r.stage).toBe(10);
    expect(r.nextBossStage).toBe(null);
  });

  it("custom bossStages param works", () => {
    const r = calculateStageProgress(0, 600, [3, 7]);
    expect(r.nextBossStage).toBe(3);

    const r2 = calculateStageProgress(180, 600, [3, 7]); // stage 4
    expect(r2.nextBossStage).toBe(7);
  });

  it("stage labels transition correctly", () => {
    expect(calculateStageProgress(0, 600).stageLabel).toBe("EARLY"); // 1
    expect(calculateStageProgress(120, 600).stageLabel).toBe("EARLY"); // 3
    expect(calculateStageProgress(180, 600).stageLabel).toBe("MID"); // 4
    expect(calculateStageProgress(300, 600).stageLabel).toBe("MID"); // 6
    expect(calculateStageProgress(360, 600).stageLabel).toBe("LATE"); // 7
    expect(calculateStageProgress(420, 600).stageLabel).toBe("LATE"); // 8
    expect(calculateStageProgress(480, 600).stageLabel).toBe("DANGER"); // 9
    expect(calculateStageProgress(540, 600).stageLabel).toBe("FINAL"); // 10
  });
});
