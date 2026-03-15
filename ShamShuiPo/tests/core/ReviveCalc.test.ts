import { describe, it, expect } from "vitest";
import {
  createReviveState,
  canRevive,
  revive,
  updateRevive,
  getReviveHP,
  isInvincible,
  getLivesRemaining,
  addLife,
  setMaxLives,
  getStats,
  resetLives,
} from "../../src/core/ReviveCalc";

describe("ReviveCalc", () => {
  // ── createReviveState ──

  describe("createReviveState", () => {
    it("creates state with default config", () => {
      const s = createReviveState();
      expect(s.config.maxLives).toBe(1);
      expect(s.config.reviveHP).toBe(0.5);
      expect(s.config.invincibilityDuration).toBe(3000);
      expect(s.config.reviveCooldown).toBe(0);
    });

    it("sets livesRemaining to maxLives", () => {
      const s = createReviveState();
      expect(s.livesRemaining).toBe(1);
    });

    it("initializes counters to zero", () => {
      const s = createReviveState();
      expect(s.totalRevives).toBe(0);
      expect(s.lastReviveTime).toBe(0);
      expect(s.isInvincible).toBe(false);
      expect(s.invincibilityElapsed).toBe(0);
    });

    it("accepts partial config overrides", () => {
      const s = createReviveState({ maxLives: 3 });
      expect(s.config.maxLives).toBe(3);
      expect(s.config.reviveHP).toBe(0.5);
      expect(s.livesRemaining).toBe(3);
    });

    it("accepts full config override", () => {
      const s = createReviveState({
        maxLives: 5,
        reviveHP: 0.3,
        invincibilityDuration: 2000,
        reviveCooldown: 500,
      });
      expect(s.config.maxLives).toBe(5);
      expect(s.config.reviveHP).toBe(0.3);
      expect(s.config.invincibilityDuration).toBe(2000);
      expect(s.config.reviveCooldown).toBe(500);
      expect(s.livesRemaining).toBe(5);
    });

    it("handles maxLives=0", () => {
      const s = createReviveState({ maxLives: 0 });
      expect(s.livesRemaining).toBe(0);
    });

    it("handles reviveHP=1 (full HP)", () => {
      const s = createReviveState({ reviveHP: 1.0 });
      expect(s.config.reviveHP).toBe(1.0);
    });

    it("handles reviveHP=0", () => {
      const s = createReviveState({ reviveHP: 0 });
      expect(s.config.reviveHP).toBe(0);
    });
  });

  // ── canRevive ──

  describe("canRevive", () => {
    it("returns true when lives remain", () => {
      const s = createReviveState({ maxLives: 2 });
      expect(canRevive(s)).toBe(true);
    });

    it("returns false when no lives remain", () => {
      const s = createReviveState({ maxLives: 1 });
      const r = revive(s, 1000);
      expect(canRevive(r)).toBe(false);
    });

    it("returns false for maxLives=0", () => {
      const s = createReviveState({ maxLives: 0 });
      expect(canRevive(s)).toBe(false);
    });

    it("returns true with multiple lives after one revive", () => {
      const s = createReviveState({ maxLives: 3 });
      const r = revive(s, 1000);
      expect(canRevive(r)).toBe(true);
    });
  });

  // ── revive ──

  describe("revive", () => {
    it("consumes one life", () => {
      const s = createReviveState({ maxLives: 3 });
      const r = revive(s, 1000);
      expect(r.livesRemaining).toBe(2);
    });

    it("increments totalRevives", () => {
      const s = createReviveState({ maxLives: 3 });
      const r = revive(s, 1000);
      expect(r.totalRevives).toBe(1);
    });

    it("records lastReviveTime", () => {
      const s = createReviveState({ maxLives: 2 });
      const r = revive(s, 5000);
      expect(r.lastReviveTime).toBe(5000);
    });

    it("starts invincibility", () => {
      const s = createReviveState({ maxLives: 2 });
      const r = revive(s, 1000);
      expect(r.isInvincible).toBe(true);
      expect(r.invincibilityElapsed).toBe(0);
    });

    it("returns same state when no lives", () => {
      const s = createReviveState({ maxLives: 0 });
      const r = revive(s, 1000);
      expect(r).toBe(s);
    });

    it("returns same state when all lives consumed", () => {
      const s = createReviveState({ maxLives: 1 });
      const r1 = revive(s, 1000);
      const r2 = revive(r1, 2000);
      expect(r2).toBe(r1);
    });

    it("does not mutate original state", () => {
      const s = createReviveState({ maxLives: 2 });
      revive(s, 1000);
      expect(s.livesRemaining).toBe(2);
      expect(s.totalRevives).toBe(0);
    });

    it("allows multiple sequential revives", () => {
      const s = createReviveState({ maxLives: 3 });
      const r1 = revive(s, 1000);
      const r2 = revive(r1, 2000);
      const r3 = revive(r2, 3000);
      expect(r3.livesRemaining).toBe(0);
      expect(r3.totalRevives).toBe(3);
    });

    it("respects cooldown — blocks revive too soon", () => {
      const s = createReviveState({ maxLives: 3, reviveCooldown: 5000 });
      const r1 = revive(s, 1000);
      const r2 = revive(r1, 3000); // only 2000ms later, cooldown=5000
      expect(r2).toBe(r1); // blocked
    });

    it("respects cooldown — allows revive after cooldown", () => {
      const s = createReviveState({ maxLives: 3, reviveCooldown: 5000 });
      const r1 = revive(s, 1000);
      const r2 = revive(r1, 7000); // 6000ms later >= 5000
      expect(r2.livesRemaining).toBe(1);
      expect(r2.totalRevives).toBe(2);
    });

    it("cooldown=0 allows immediate revives", () => {
      const s = createReviveState({ maxLives: 3, reviveCooldown: 0 });
      const r1 = revive(s, 1000);
      const r2 = revive(r1, 1001);
      expect(r2.livesRemaining).toBe(1);
    });

    it("first revive always works regardless of cooldown", () => {
      const s = createReviveState({ maxLives: 2, reviveCooldown: 10000 });
      const r = revive(s, 100);
      expect(r.livesRemaining).toBe(1);
    });

    it("revive at exact cooldown boundary", () => {
      const s = createReviveState({ maxLives: 3, reviveCooldown: 5000 });
      const r1 = revive(s, 1000);
      const r2 = revive(r1, 6000); // exactly 5000ms later
      expect(r2.livesRemaining).toBe(1);
    });

    it("revive resets invincibilityElapsed", () => {
      const s = createReviveState({ maxLives: 3 });
      const r1 = revive(s, 1000);
      const u = updateRevive(r1, 1500); // partially through invincibility
      const r2 = revive(u, 5000);
      expect(r2.invincibilityElapsed).toBe(0);
      expect(r2.isInvincible).toBe(true);
    });
  });

  // ── updateRevive ──

  describe("updateRevive", () => {
    it("returns same state when not invincible", () => {
      const s = createReviveState();
      const u = updateRevive(s, 100);
      expect(u).toBe(s);
    });

    it("advances invincibility elapsed", () => {
      const s = createReviveState({ maxLives: 1, invincibilityDuration: 3000 });
      const r = revive(s, 1000);
      const u = updateRevive(r, 1000);
      expect(u.invincibilityElapsed).toBe(1000);
      expect(u.isInvincible).toBe(true);
    });

    it("ends invincibility when elapsed >= duration", () => {
      const s = createReviveState({ maxLives: 1, invincibilityDuration: 3000 });
      const r = revive(s, 1000);
      const u = updateRevive(r, 3000);
      expect(u.isInvincible).toBe(false);
    });

    it("ends invincibility when elapsed exceeds duration", () => {
      const s = createReviveState({ maxLives: 1, invincibilityDuration: 3000 });
      const r = revive(s, 1000);
      const u = updateRevive(r, 5000);
      expect(u.isInvincible).toBe(false);
      expect(u.invincibilityElapsed).toBe(3000);
    });

    it("incremental updates accumulate", () => {
      const s = createReviveState({ maxLives: 1, invincibilityDuration: 3000 });
      const r = revive(s, 1000);
      const u1 = updateRevive(r, 1000);
      const u2 = updateRevive(u1, 1000);
      expect(u2.invincibilityElapsed).toBe(2000);
      expect(u2.isInvincible).toBe(true);
    });

    it("incremental updates eventually end invincibility", () => {
      const s = createReviveState({ maxLives: 1, invincibilityDuration: 3000 });
      const r = revive(s, 1000);
      const u1 = updateRevive(r, 1000);
      const u2 = updateRevive(u1, 1000);
      const u3 = updateRevive(u2, 1000);
      expect(u3.isInvincible).toBe(false);
    });

    it("does not mutate original state", () => {
      const s = createReviveState({ maxLives: 1, invincibilityDuration: 3000 });
      const r = revive(s, 1000);
      updateRevive(r, 1000);
      expect(r.invincibilityElapsed).toBe(0);
    });

    it("handles zero delta", () => {
      const s = createReviveState({ maxLives: 1, invincibilityDuration: 3000 });
      const r = revive(s, 1000);
      const u = updateRevive(r, 0);
      expect(u.invincibilityElapsed).toBe(0);
      expect(u.isInvincible).toBe(true);
    });

    it("handles invincibilityDuration=0", () => {
      const s = createReviveState({ maxLives: 1, invincibilityDuration: 0 });
      const r = revive(s, 1000);
      const u = updateRevive(r, 0);
      expect(u.isInvincible).toBe(false);
    });
  });

  // ── getReviveHP ──

  describe("getReviveHP", () => {
    it("returns percentage of maxHP", () => {
      const s = createReviveState({ reviveHP: 0.5 });
      expect(getReviveHP(s, 100)).toBe(50);
    });

    it("returns full HP when reviveHP=1", () => {
      const s = createReviveState({ reviveHP: 1.0 });
      expect(getReviveHP(s, 200)).toBe(200);
    });

    it("returns 0 when reviveHP=0", () => {
      const s = createReviveState({ reviveHP: 0 });
      expect(getReviveHP(s, 100)).toBe(0);
    });

    it("handles fractional results", () => {
      const s = createReviveState({ reviveHP: 0.3 });
      expect(getReviveHP(s, 100)).toBeCloseTo(30);
    });

    it("handles large maxHP", () => {
      const s = createReviveState({ reviveHP: 0.5 });
      expect(getReviveHP(s, 10000)).toBe(5000);
    });

    it("handles maxHP=0", () => {
      const s = createReviveState({ reviveHP: 0.5 });
      expect(getReviveHP(s, 0)).toBe(0);
    });
  });

  // ── isInvincible ──

  describe("isInvincible", () => {
    it("returns false initially", () => {
      const s = createReviveState();
      expect(isInvincible(s)).toBe(false);
    });

    it("returns true after revive", () => {
      const s = createReviveState({ maxLives: 1 });
      const r = revive(s, 1000);
      expect(isInvincible(r)).toBe(true);
    });

    it("returns false after invincibility expires", () => {
      const s = createReviveState({ maxLives: 1, invincibilityDuration: 1000 });
      const r = revive(s, 1000);
      const u = updateRevive(r, 1000);
      expect(isInvincible(u)).toBe(false);
    });

    it("returns true during invincibility", () => {
      const s = createReviveState({ maxLives: 1, invincibilityDuration: 3000 });
      const r = revive(s, 1000);
      const u = updateRevive(r, 1500);
      expect(isInvincible(u)).toBe(true);
    });
  });

  // ── getLivesRemaining ──

  describe("getLivesRemaining", () => {
    it("returns initial lives", () => {
      const s = createReviveState({ maxLives: 3 });
      expect(getLivesRemaining(s)).toBe(3);
    });

    it("decrements after revive", () => {
      const s = createReviveState({ maxLives: 3 });
      const r = revive(s, 1000);
      expect(getLivesRemaining(r)).toBe(2);
    });

    it("returns 0 when all consumed", () => {
      const s = createReviveState({ maxLives: 1 });
      const r = revive(s, 1000);
      expect(getLivesRemaining(r)).toBe(0);
    });
  });

  // ── addLife ──

  describe("addLife", () => {
    it("adds one life by default", () => {
      const s = createReviveState({ maxLives: 3 });
      const r = revive(s, 1000);
      const a = addLife(r);
      expect(a.livesRemaining).toBe(3);
    });

    it("adds specified count", () => {
      const s = createReviveState({ maxLives: 5 });
      const r1 = revive(s, 1000);
      const r2 = revive(r1, 2000);
      const a = addLife(r2, 2);
      expect(a.livesRemaining).toBe(5);
    });

    it("caps at maxLives", () => {
      const s = createReviveState({ maxLives: 3 });
      const a = addLife(s, 5);
      expect(a.livesRemaining).toBe(3);
    });

    it("does not mutate original", () => {
      const s = createReviveState({ maxLives: 3 });
      const r = revive(s, 1000);
      addLife(r);
      expect(r.livesRemaining).toBe(2);
    });

    it("adding 0 keeps same count", () => {
      const s = createReviveState({ maxLives: 3 });
      const a = addLife(s, 0);
      expect(a.livesRemaining).toBe(3);
    });

    it("works when at zero lives", () => {
      const s = createReviveState({ maxLives: 1 });
      const r = revive(s, 1000);
      const a = addLife(r);
      expect(a.livesRemaining).toBe(1);
    });

    it("caps correctly when adding large number", () => {
      const s = createReviveState({ maxLives: 2 });
      const r = revive(s, 1000);
      const a = addLife(r, 100);
      expect(a.livesRemaining).toBe(2);
    });
  });

  // ── setMaxLives ──

  describe("setMaxLives", () => {
    it("increases maxLives", () => {
      const s = createReviveState({ maxLives: 1 });
      const u = setMaxLives(s, 5);
      expect(u.config.maxLives).toBe(5);
    });

    it("keeps livesRemaining when increasing max", () => {
      const s = createReviveState({ maxLives: 2 });
      const u = setMaxLives(s, 5);
      expect(u.livesRemaining).toBe(2);
    });

    it("clamps livesRemaining when decreasing max", () => {
      const s = createReviveState({ maxLives: 5 });
      const u = setMaxLives(s, 2);
      expect(u.livesRemaining).toBe(2);
    });

    it("sets maxLives to 0", () => {
      const s = createReviveState({ maxLives: 3 });
      const u = setMaxLives(s, 0);
      expect(u.config.maxLives).toBe(0);
      expect(u.livesRemaining).toBe(0);
    });

    it("does not mutate original", () => {
      const s = createReviveState({ maxLives: 3 });
      setMaxLives(s, 1);
      expect(s.config.maxLives).toBe(3);
      expect(s.livesRemaining).toBe(3);
    });

    it("clamps correctly when lives already partially used", () => {
      const s = createReviveState({ maxLives: 5 });
      const r = revive(s, 1000); // 4 remaining
      const u = setMaxLives(r, 3);
      expect(u.livesRemaining).toBe(3);
    });

    it("keeps lives when new max equals current remaining", () => {
      const s = createReviveState({ maxLives: 5 });
      const r = revive(s, 1000); // 4 remaining
      const u = setMaxLives(r, 4);
      expect(u.livesRemaining).toBe(4);
    });
  });

  // ── getStats ──

  describe("getStats", () => {
    it("returns initial stats", () => {
      const s = createReviveState({ maxLives: 3 });
      const stats = getStats(s);
      expect(stats.livesRemaining).toBe(3);
      expect(stats.totalRevives).toBe(0);
      expect(stats.maxLives).toBe(3);
    });

    it("reflects revives in stats", () => {
      const s = createReviveState({ maxLives: 3 });
      const r1 = revive(s, 1000);
      const r2 = revive(r1, 2000);
      const stats = getStats(r2);
      expect(stats.livesRemaining).toBe(1);
      expect(stats.totalRevives).toBe(2);
      expect(stats.maxLives).toBe(3);
    });

    it("returns correct maxLives after setMaxLives", () => {
      const s = createReviveState({ maxLives: 1 });
      const u = setMaxLives(s, 10);
      expect(getStats(u).maxLives).toBe(10);
    });
  });

  // ── resetLives ──

  describe("resetLives", () => {
    it("restores lives to maxLives", () => {
      const s = createReviveState({ maxLives: 3 });
      const r = revive(s, 1000);
      const reset = resetLives(r);
      expect(reset.livesRemaining).toBe(3);
    });

    it("clears invincibility", () => {
      const s = createReviveState({ maxLives: 2 });
      const r = revive(s, 1000);
      expect(r.isInvincible).toBe(true);
      const reset = resetLives(r);
      expect(reset.isInvincible).toBe(false);
      expect(reset.invincibilityElapsed).toBe(0);
    });

    it("preserves totalRevives", () => {
      const s = createReviveState({ maxLives: 3 });
      const r1 = revive(s, 1000);
      const r2 = revive(r1, 2000);
      const reset = resetLives(r2);
      expect(reset.totalRevives).toBe(2);
    });

    it("preserves lastReviveTime", () => {
      const s = createReviveState({ maxLives: 2 });
      const r = revive(s, 5000);
      const reset = resetLives(r);
      expect(reset.lastReviveTime).toBe(5000);
    });

    it("does not mutate original", () => {
      const s = createReviveState({ maxLives: 2 });
      const r = revive(s, 1000);
      resetLives(r);
      expect(r.livesRemaining).toBe(1);
      expect(r.isInvincible).toBe(true);
    });

    it("works on fresh state (no-op effectively)", () => {
      const s = createReviveState({ maxLives: 3 });
      const reset = resetLives(s);
      expect(reset.livesRemaining).toBe(3);
      expect(reset.isInvincible).toBe(false);
    });

    it("preserves config", () => {
      const s = createReviveState({
        maxLives: 5,
        reviveHP: 0.3,
        invincibilityDuration: 2000,
        reviveCooldown: 1000,
      });
      const r = revive(s, 1000);
      const reset = resetLives(r);
      expect(reset.config.maxLives).toBe(5);
      expect(reset.config.reviveHP).toBe(0.3);
      expect(reset.config.invincibilityDuration).toBe(2000);
      expect(reset.config.reviveCooldown).toBe(1000);
    });
  });

  // ── Integration / Edge Cases ──

  describe("integration", () => {
    it("full lifecycle: create → revive → update → expire", () => {
      const s = createReviveState({ maxLives: 1, invincibilityDuration: 2000 });
      expect(canRevive(s)).toBe(true);

      const r = revive(s, 1000);
      expect(getLivesRemaining(r)).toBe(0);
      expect(isInvincible(r)).toBe(true);

      const u1 = updateRevive(r, 1000);
      expect(isInvincible(u1)).toBe(true);

      const u2 = updateRevive(u1, 1000);
      expect(isInvincible(u2)).toBe(false);
      expect(canRevive(u2)).toBe(false);
    });

    it("addLife after all consumed allows another revive", () => {
      const s = createReviveState({ maxLives: 1 });
      const r = revive(s, 1000);
      expect(canRevive(r)).toBe(false);

      const a = addLife(r);
      expect(canRevive(a)).toBe(true);

      const r2 = revive(a, 2000);
      expect(r2.totalRevives).toBe(2);
      expect(r2.livesRemaining).toBe(0);
    });

    it("resetLives then revive again", () => {
      const s = createReviveState({ maxLives: 2 });
      const r1 = revive(s, 1000);
      const r2 = revive(r1, 2000);
      expect(canRevive(r2)).toBe(false);

      const reset = resetLives(r2);
      expect(canRevive(reset)).toBe(true);
      expect(getLivesRemaining(reset)).toBe(2);

      const r3 = revive(reset, 3000);
      expect(r3.totalRevives).toBe(3);
    });

    it("setMaxLives + addLife combo", () => {
      const s = createReviveState({ maxLives: 1 });
      const r = revive(s, 1000);
      const expanded = setMaxLives(r, 5);
      const refilled = addLife(expanded, 4);
      expect(refilled.livesRemaining).toBe(4);
      expect(refilled.config.maxLives).toBe(5);
    });

    it("getReviveHP uses config from current state", () => {
      const s = createReviveState({ reviveHP: 0.25 });
      expect(getReviveHP(s, 400)).toBe(100);
    });

    it("multiple systems maintain independence", () => {
      const s1 = createReviveState({ maxLives: 1 });
      const s2 = createReviveState({ maxLives: 5 });
      const r1 = revive(s1, 1000);
      expect(getLivesRemaining(r1)).toBe(0);
      expect(getLivesRemaining(s2)).toBe(5);
    });
  });
});
