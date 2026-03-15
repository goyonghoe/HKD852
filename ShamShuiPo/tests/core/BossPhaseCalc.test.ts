// ── Tests: BossPhaseCalc ──

import { describe, it, expect } from "vitest";
import {
  getBossPhase,
  getPhaseTransitionHp,
  shouldBossEnrage,
  getBossSpawnTime,
} from "../../src/core/BossPhaseCalc";

// ════════════════════════════════════════════════════════════════
// § getBossPhase — mini_boss (2 phases)
// ════════════════════════════════════════════════════════════════

describe("getBossPhase — mini_boss", () => {
  it("phase 1 at full HP", () => {
    const info = getBossPhase("mini_boss", 800, 800);
    expect(info.phase).toBe(1);
    expect(info.totalPhases).toBe(2);
    expect(info.isEnraged).toBe(false);
    expect(info.speedMultiplier).toBe(1.0);
    expect(info.damageMultiplier).toBe(1.0);
    expect(info.attackPattern).toBe("summon_adds");
    expect(info.phaseLabel).toBe("Phase 1/2");
  });

  it("phase 1 at 60% HP (still above 50%)", () => {
    const info = getBossPhase("mini_boss", 480, 800);
    expect(info.phase).toBe(1);
    expect(info.isEnraged).toBe(false);
  });

  it("phase 2 at 40% HP (below 50% threshold)", () => {
    const info = getBossPhase("mini_boss", 320, 800);
    expect(info.phase).toBe(2);
    expect(info.totalPhases).toBe(2);
    expect(info.isEnraged).toBe(true);
    expect(info.speedMultiplier).toBe(1.2);
    expect(info.damageMultiplier).toBe(1.3);
    expect(info.attackPattern).toBe("charge_dash");
    expect(info.phaseLabel).toBe("Phase 2/2");
  });

  it("phase 2 at exactly 50% HP (boundary — still phase 1)", () => {
    // hpRatio = 0.5, threshold for phase 1 is > 0.5, so 0.5 is NOT > 0.5
    const info = getBossPhase("mini_boss", 400, 800);
    expect(info.phase).toBe(2);
    expect(info.isEnraged).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════
// § getBossPhase — chapter_boss (3 phases)
// ════════════════════════════════════════════════════════════════

describe("getBossPhase — chapter_boss", () => {
  it("phase 1 at full HP", () => {
    const info = getBossPhase("chapter_boss", 2500, 2500);
    expect(info.phase).toBe(1);
    expect(info.isEnraged).toBe(false);
    expect(info.attackPattern).toBe("melee_swipe");
    expect(info.phaseLabel).toBe("Phase 1/3");
  });

  it("phase 2 at 50% HP", () => {
    const info = getBossPhase("chapter_boss", 1250, 2500);
    expect(info.phase).toBe(2);
    expect(info.isEnraged).toBe(false);
    expect(info.speedMultiplier).toBe(1.2);
    expect(info.damageMultiplier).toBe(1.3);
    expect(info.attackPattern).toBe("missile_barrage");
    expect(info.phaseLabel).toBe("Phase 2/3");
  });

  it("phase 3 at 20% HP (enraged)", () => {
    const info = getBossPhase("chapter_boss", 500, 2500);
    expect(info.phase).toBe(3);
    expect(info.isEnraged).toBe(true);
    expect(info.speedMultiplier).toBe(1.5);
    expect(info.damageMultiplier).toBe(1.8);
    expect(info.attackPattern).toBe("enraged_combo");
    expect(info.phaseLabel).toBe("Phase 3/3");
  });
});

// ════════════════════════════════════════════════════════════════
// § getBossPhase — final_boss (3 phases)
// ════════════════════════════════════════════════════════════════

describe("getBossPhase — final_boss", () => {
  it("phase 1 at 80% HP", () => {
    const info = getBossPhase("final_boss", 4000, 5000);
    expect(info.phase).toBe(1);
    expect(info.attackPattern).toBe("sweeping_laser");
  });

  it("phase 2 at 50% HP", () => {
    const info = getBossPhase("final_boss", 2500, 5000);
    expect(info.phase).toBe(2);
    expect(info.attackPattern).toBe("bullet_ring");
  });

  it("phase 3 at 10% HP (enraged)", () => {
    const info = getBossPhase("final_boss", 500, 5000);
    expect(info.phase).toBe(3);
    expect(info.isEnraged).toBe(true);
    expect(info.attackPattern).toBe("arena_shrink");
  });
});

// ════════════════════════════════════════════════════════════════
// § shouldBossEnrage
// ════════════════════════════════════════════════════════════════

describe("shouldBossEnrage", () => {
  it("returns false when mini_boss is in phase 1", () => {
    expect(shouldBossEnrage("mini_boss", 600, 800)).toBe(false);
  });

  it("returns true when mini_boss is in last phase", () => {
    expect(shouldBossEnrage("mini_boss", 300, 800)).toBe(true);
  });

  it("returns false when chapter_boss is at 50% HP", () => {
    expect(shouldBossEnrage("chapter_boss", 1250, 2500)).toBe(false);
  });

  it("returns true when chapter_boss is at 10% HP", () => {
    expect(shouldBossEnrage("chapter_boss", 250, 2500)).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════
// § getPhaseTransitionHp
// ════════════════════════════════════════════════════════════════

describe("getPhaseTransitionHp", () => {
  it("mini_boss (2 phases) → [0.5]", () => {
    expect(getPhaseTransitionHp("mini_boss")).toEqual([0.5]);
  });

  it("chapter_boss (3 phases) → [0.67, 0.33]", () => {
    expect(getPhaseTransitionHp("chapter_boss")).toEqual([0.67, 0.33]);
  });

  it("final_boss (3 phases) → [0.67, 0.33]", () => {
    expect(getPhaseTransitionHp("final_boss")).toEqual([0.67, 0.33]);
  });

  it("unknown boss → []", () => {
    expect(getPhaseTransitionHp("unknown_boss")).toEqual([]);
  });
});

// ════════════════════════════════════════════════════════════════
// § Speed & damage multipliers increase per phase
// ════════════════════════════════════════════════════════════════

describe("multipliers increase per phase", () => {
  it("chapter_boss speed: 1.0 → 1.2 → 1.5", () => {
    const p1 = getBossPhase("chapter_boss", 2500, 2500);
    const p2 = getBossPhase("chapter_boss", 1250, 2500);
    const p3 = getBossPhase("chapter_boss", 500, 2500);
    expect(p1.speedMultiplier).toBe(1.0);
    expect(p2.speedMultiplier).toBe(1.2);
    expect(p3.speedMultiplier).toBe(1.5);
  });

  it("chapter_boss damage: 1.0 → 1.3 → 1.8", () => {
    const p1 = getBossPhase("chapter_boss", 2500, 2500);
    const p2 = getBossPhase("chapter_boss", 1250, 2500);
    const p3 = getBossPhase("chapter_boss", 500, 2500);
    expect(p1.damageMultiplier).toBe(1.0);
    expect(p2.damageMultiplier).toBe(1.3);
    expect(p3.damageMultiplier).toBe(1.8);
  });
});

// ════════════════════════════════════════════════════════════════
// § Unknown boss defaults
// ════════════════════════════════════════════════════════════════

describe("unknown boss", () => {
  it("returns sensible defaults for unknown bossId", () => {
    const info = getBossPhase("nonexistent", 100, 100);
    expect(info.phase).toBe(1);
    expect(info.totalPhases).toBe(1);
    expect(info.isEnraged).toBe(true); // 1 phase = always last phase
    expect(info.attackPattern).toBe("basic_attack");
    expect(info.phaseLabel).toBe("Phase 1/1");
  });
});

// ════════════════════════════════════════════════════════════════
// § Edge case: 0 HP = last phase
// ════════════════════════════════════════════════════════════════

describe("edge case: 0 HP", () => {
  it("mini_boss at 0 HP → last phase", () => {
    const info = getBossPhase("mini_boss", 0, 800);
    expect(info.phase).toBe(2);
    expect(info.isEnraged).toBe(true);
  });

  it("chapter_boss at 0 HP → last phase", () => {
    const info = getBossPhase("chapter_boss", 0, 2500);
    expect(info.phase).toBe(3);
    expect(info.isEnraged).toBe(true);
  });

  it("final_boss at 0 HP → last phase", () => {
    const info = getBossPhase("final_boss", 0, 5000);
    expect(info.phase).toBe(3);
    expect(info.isEnraged).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════
// § getBossSpawnTime
// ════════════════════════════════════════════════════════════════

describe("getBossSpawnTime", () => {
  it("mini_boss → 300 (5:00)", () => {
    expect(getBossSpawnTime("mini_boss")).toBe(300);
  });

  it("chapter_boss → 480 (8:00)", () => {
    expect(getBossSpawnTime("chapter_boss")).toBe(480);
  });

  it("final_boss → 540 (9:00)", () => {
    expect(getBossSpawnTime("final_boss")).toBe(540);
  });

  it("unknown boss → null", () => {
    expect(getBossSpawnTime("unknown_boss")).toBeNull();
  });
});

// ════════════════════════════════════════════════════════════════
// § Phase labels are correct
// ════════════════════════════════════════════════════════════════

describe("phase labels", () => {
  it("mini_boss labels: Phase 1/2, Phase 2/2", () => {
    expect(getBossPhase("mini_boss", 800, 800).phaseLabel).toBe("Phase 1/2");
    expect(getBossPhase("mini_boss", 100, 800).phaseLabel).toBe("Phase 2/2");
  });

  it("final_boss labels: Phase 1/3, Phase 2/3, Phase 3/3", () => {
    expect(getBossPhase("final_boss", 5000, 5000).phaseLabel).toBe("Phase 1/3");
    expect(getBossPhase("final_boss", 2500, 5000).phaseLabel).toBe("Phase 2/3");
    expect(getBossPhase("final_boss", 500, 5000).phaseLabel).toBe("Phase 3/3");
  });
});
