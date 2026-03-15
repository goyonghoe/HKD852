// ── Tests: AnalyticsCalc ──

import { describe, it, expect } from "vitest";
import {
  createAnalytics,
  recordDamageDealt,
  recordDamageTaken,
  recordKill,
  recordUpgrade,
  recordMovement,
  recordShot,
  updatePeakDps,
  generateReport,
  getPlaystyle,
  getHighlights,
  type RunAnalytics,
} from "../../src/core/AnalyticsCalc";

// ════════════════════════════════════════════════════════════════
// § createAnalytics
// ════════════════════════════════════════════════════════════════

describe("createAnalytics", () => {
  it("returns zeroed state", () => {
    const a = createAnalytics();
    expect(a.damageDealt).toBe(0);
    expect(a.damageTaken).toBe(0);
    expect(a.healingDone).toBe(0);
    expect(a.totalKills).toBe(0);
    expect(a.totalShots).toBe(0);
    expect(a.criticalHits).toBe(0);
    expect(a.peakDps).toBe(0);
    expect(a.distanceTraveled).toBe(0);
    expect(a.upgradesTaken).toEqual([]);
    expect(a.killsByWeapon).toEqual({});
    expect(a.killsByEnemy).toEqual({});
  });
});

// ════════════════════════════════════════════════════════════════
// § recordDamageDealt
// ════════════════════════════════════════════════════════════════

describe("recordDamageDealt", () => {
  it("accumulates damage dealt", () => {
    let a = createAnalytics();
    a = recordDamageDealt(a, 100, "pistol", false);
    a = recordDamageDealt(a, 50, "pistol", false);
    expect(a.damageDealt).toBe(150);
  });

  it("counts critical hits", () => {
    let a = createAnalytics();
    a = recordDamageDealt(a, 100, "pistol", true);
    a = recordDamageDealt(a, 50, "pistol", false);
    a = recordDamageDealt(a, 75, "shotgun", true);
    expect(a.criticalHits).toBe(2);
  });

  it("does not mutate original", () => {
    const a = createAnalytics();
    const b = recordDamageDealt(a, 100, "pistol", false);
    expect(a.damageDealt).toBe(0);
    expect(b.damageDealt).toBe(100);
  });
});

// ════════════════════════════════════════════════════════════════
// § recordDamageTaken
// ════════════════════════════════════════════════════════════════

describe("recordDamageTaken", () => {
  it("accumulates damage taken", () => {
    let a = createAnalytics();
    a = recordDamageTaken(a, 20, "zombie");
    a = recordDamageTaken(a, 30, "zombie");
    expect(a.damageTaken).toBe(50);
  });

  it("tracks damage by enemy type", () => {
    let a = createAnalytics();
    a = recordDamageTaken(a, 20, "zombie");
    a = recordDamageTaken(a, 50, "boss");
    a = recordDamageTaken(a, 10, "zombie");
    expect(a.damageTakenByEnemy["zombie"]).toBe(30);
    expect(a.damageTakenByEnemy["boss"]).toBe(50);
  });

  it("does not mutate original", () => {
    const a = createAnalytics();
    const b = recordDamageTaken(a, 20, "zombie");
    expect(a.damageTaken).toBe(0);
    expect(b.damageTaken).toBe(20);
  });
});

// ════════════════════════════════════════════════════════════════
// § recordKill
// ════════════════════════════════════════════════════════════════

describe("recordKill", () => {
  it("tracks kills by weapon and enemy", () => {
    let a = createAnalytics();
    a = recordKill(a, "pistol", "zombie");
    a = recordKill(a, "pistol", "zombie");
    a = recordKill(a, "shotgun", "drone");
    expect(a.killsByWeapon["pistol"]).toBe(2);
    expect(a.killsByWeapon["shotgun"]).toBe(1);
    expect(a.killsByEnemy["zombie"]).toBe(2);
    expect(a.killsByEnemy["drone"]).toBe(1);
  });

  it("increments totalKills", () => {
    let a = createAnalytics();
    a = recordKill(a, "pistol", "zombie");
    a = recordKill(a, "pistol", "zombie");
    expect(a.totalKills).toBe(2);
  });

  it("does not mutate original", () => {
    const a = createAnalytics();
    const b = recordKill(a, "pistol", "zombie");
    expect(a.totalKills).toBe(0);
    expect(b.totalKills).toBe(1);
  });
});

// ════════════════════════════════════════════════════════════════
// § recordUpgrade
// ════════════════════════════════════════════════════════════════

describe("recordUpgrade", () => {
  it("appends upgrade id", () => {
    let a = createAnalytics();
    a = recordUpgrade(a, "dmg_up");
    a = recordUpgrade(a, "speed_up");
    expect(a.upgradesTaken).toEqual(["dmg_up", "speed_up"]);
  });

  it("allows duplicate upgrades", () => {
    let a = createAnalytics();
    a = recordUpgrade(a, "dmg_up");
    a = recordUpgrade(a, "dmg_up");
    expect(a.upgradesTaken).toEqual(["dmg_up", "dmg_up"]);
  });

  it("does not mutate original array", () => {
    const a = createAnalytics();
    const b = recordUpgrade(a, "dmg_up");
    expect(a.upgradesTaken.length).toBe(0);
    expect(b.upgradesTaken.length).toBe(1);
  });
});

// ════════════════════════════════════════════════════════════════
// § recordMovement
// ════════════════════════════════════════════════════════════════

describe("recordMovement", () => {
  it("calculates euclidean distance", () => {
    let a = createAnalytics();
    a = recordMovement(a, 3, 4); // sqrt(9+16) = 5
    expect(a.distanceTraveled).toBeCloseTo(5);
  });

  it("accumulates distance over multiple moves", () => {
    let a = createAnalytics();
    a = recordMovement(a, 3, 4); // 5
    a = recordMovement(a, 0, 10); // 10
    expect(a.distanceTraveled).toBeCloseTo(15);
  });

  it("handles zero movement", () => {
    let a = createAnalytics();
    a = recordMovement(a, 0, 0);
    expect(a.distanceTraveled).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § recordShot
// ════════════════════════════════════════════════════════════════

describe("recordShot", () => {
  it("increments total shots", () => {
    let a = createAnalytics();
    a = recordShot(a);
    a = recordShot(a);
    a = recordShot(a);
    expect(a.totalShots).toBe(3);
  });
});

// ════════════════════════════════════════════════════════════════
// § updatePeakDps
// ════════════════════════════════════════════════════════════════

describe("updatePeakDps", () => {
  it("updates when current exceeds peak", () => {
    let a = createAnalytics();
    a = updatePeakDps(a, 100);
    expect(a.peakDps).toBe(100);
    a = updatePeakDps(a, 200);
    expect(a.peakDps).toBe(200);
  });

  it("does not decrease peak", () => {
    let a = createAnalytics();
    a = updatePeakDps(a, 200);
    a = updatePeakDps(a, 50);
    expect(a.peakDps).toBe(200);
  });

  it("returns same reference when not updated", () => {
    let a = createAnalytics();
    a = updatePeakDps(a, 100);
    const b = updatePeakDps(a, 50);
    expect(b).toBe(a);
  });
});

// ════════════════════════════════════════════════════════════════
// § getPlaystyle
// ════════════════════════════════════════════════════════════════

describe("getPlaystyle", () => {
  it("returns Aggressive for very high efficiency", () => {
    let a = createAnalytics();
    a = { ...a, damageDealt: 10000, damageTaken: 100, totalKills: 200 };
    expect(getPlaystyle(a)).toBe("Aggressive");
  });

  it("returns Tank for low efficiency", () => {
    let a = createAnalytics();
    a = { ...a, damageDealt: 500, damageTaken: 400, totalKills: 50 };
    expect(getPlaystyle(a)).toBe("Tank");
  });

  it("returns Glass Cannon for high crit rate + moderate efficiency", () => {
    let a = createAnalytics();
    a = {
      ...a,
      damageDealt: 5000,
      damageTaken: 1000,
      criticalHits: 20,
      totalShots: 100,
      totalKills: 80,
    };
    expect(getPlaystyle(a)).toBe("Glass Cannon");
  });

  it("returns Defensive for zero damage taken with dodges", () => {
    let a = createAnalytics();
    a = {
      ...a,
      damageDealt: 1000,
      damageTaken: 0,
      dodges: 30,
      totalKills: 50,
    };
    expect(getPlaystyle(a)).toBe("Defensive");
  });

  it("returns Balanced as default", () => {
    let a = createAnalytics();
    a = {
      ...a,
      damageDealt: 0,
      damageTaken: 0,
      totalKills: 0,
    };
    expect(getPlaystyle(a)).toBe("Balanced");
  });
});

// ════════════════════════════════════════════════════════════════
// § getHighlights
// ════════════════════════════════════════════════════════════════

describe("getHighlights", () => {
  it("includes no-damage highlight when damageTaken is 0 with kills", () => {
    let a = createAnalytics();
    a = { ...a, damageTaken: 0, totalKills: 10 };
    const h = getHighlights(a, 60);
    expect(h).toContain("No damage taken!");
  });

  it("includes century club for 100+ kills", () => {
    let a = createAnalytics();
    a = { ...a, totalKills: 150 };
    const h = getHighlights(a, 60);
    expect(h.some((s) => s.includes("Century Club"))).toBe(true);
  });

  it("includes slaughter master for 200+ kills", () => {
    let a = createAnalytics();
    a = { ...a, totalKills: 250 };
    const h = getHighlights(a, 60);
    expect(h.some((s) => s.includes("Slaughter Master"))).toBe(true);
  });

  it("includes mass extinction for 500+ kills", () => {
    let a = createAnalytics();
    a = { ...a, totalKills: 600 };
    const h = getHighlights(a, 60);
    expect(h.some((s) => s.includes("Mass Extinction"))).toBe(true);
  });

  it("includes peak DPS highlight for high DPS", () => {
    let a = createAnalytics();
    a = { ...a, peakDps: 800 };
    const h = getHighlights(a, 60);
    expect(h.some((s) => s.includes("DPS Monster"))).toBe(true);
  });

  it("returns empty array for boring run", () => {
    const a = createAnalytics();
    const h = getHighlights(a, 60);
    expect(h).toEqual([]);
  });

  it("includes upgrade highlight for 10+ upgrades", () => {
    let a = createAnalytics();
    a = {
      ...a,
      upgradesTaken: Array.from({ length: 12 }, (_, i) => `upg_${i}`),
    };
    const h = getHighlights(a, 60);
    expect(h.some((s) => s.includes("Maxed Out"))).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════
// § generateReport
// ════════════════════════════════════════════════════════════════

describe("generateReport", () => {
  it("returns a complete report structure", () => {
    let a = createAnalytics();
    a = recordKill(a, "pistol", "zombie");
    a = recordKill(a, "pistol", "zombie");
    a = recordKill(a, "shotgun", "drone");
    a = recordDamageDealt(a, 1000, "pistol", false);
    a = recordDamageTaken(a, 100, "zombie");
    a = recordShot(a);
    a = recordShot(a);
    a = recordShot(a);
    const report = generateReport(a, 5000, 120);

    expect(report.mvpWeapon).toBe("pistol");
    expect(report.dangerousEnemy).toBe("zombie");
    expect(report.efficiency).toBe(10);
    expect(report.accuracyEstimate).toBe(1);
    expect(typeof report.grade).toBe("string");
    expect(typeof report.playstyle).toBe("string");
    expect(Array.isArray(report.highlights)).toBe(true);
  });

  it("handles zero damage taken → Infinity efficiency", () => {
    let a = createAnalytics();
    a = recordDamageDealt(a, 500, "pistol", false);
    const report = generateReport(a, 1000, 60);
    expect(report.efficiency).toBe(Infinity);
  });

  it("handles zero shots → 0 accuracy", () => {
    const a = createAnalytics();
    const report = generateReport(a, 0, 60);
    expect(report.accuracyEstimate).toBe(0);
  });

  it("MVP is weapon with most kills", () => {
    let a = createAnalytics();
    a = recordKill(a, "pistol", "zombie");
    a = recordKill(a, "shotgun", "zombie");
    a = recordKill(a, "shotgun", "zombie");
    a = recordKill(a, "shotgun", "drone");
    const report = generateReport(a, 1000, 60);
    expect(report.mvpWeapon).toBe("shotgun");
  });

  it("dangerousEnemy is enemy with most damage dealt to player", () => {
    let a = createAnalytics();
    a = recordDamageTaken(a, 10, "zombie");
    a = recordDamageTaken(a, 50, "boss");
    a = recordDamageTaken(a, 20, "drone");
    const report = generateReport(a, 1000, 60);
    expect(report.dangerousEnemy).toBe("boss");
  });

  it("assigns S grade for outstanding performance", () => {
    let a = createAnalytics();
    a = recordDamageDealt(a, 50000, "pistol", false);
    a = recordDamageTaken(a, 100, "zombie");
    // score 10000 in 60s = 166.7 rate, efficiency 500 → metric ~416
    const report = generateReport(a, 10000, 60);
    expect(report.grade).toBe("S");
  });

  it("assigns D grade for poor performance", () => {
    const a = createAnalytics();
    const report = generateReport(a, 10, 120);
    expect(report.grade).toBe("D");
  });
});
