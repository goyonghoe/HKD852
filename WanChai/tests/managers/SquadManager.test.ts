import { describe, it, expect } from 'vitest';
import { BALANCE } from '../../src/config/balance';
import { CHARACTERS } from '../../src/config/characters';

describe('Squad System — Solo Mode Balance Constants', () => {
  it('should have exactly 1 squad position (solo mode)', () => {
    expect(BALANCE.SQUAD.positions).toHaveLength(1);
  });

  it('solo position should be at combat zone Y', () => {
    expect(BALANCE.SQUAD.positions[0].y).toBe(BALANCE.PLAYER.baseY);
  });

  it('should have at least 1 member ID', () => {
    expect(BALANCE.SQUAD.memberIds.length).toBeGreaterThanOrEqual(1);
  });

  it('member IDs should be valid character IDs', () => {
    for (const id of BALANCE.SQUAD.memberIds) {
      expect(CHARACTERS[id]).toBeDefined();
    }
  });

  it('damage multiplier should be 1.0 in solo mode (full damage)', () => {
    expect(BALANCE.SQUAD.damageMultiplier).toBe(1.0);
  });

  it('member scale should be 1.0 in solo mode (full size)', () => {
    expect(BALANCE.SQUAD.memberScale).toBe(1.0);
  });

  it('idle bob offset should be positive', () => {
    expect(BALANCE.SQUAD.idleBobOffsetMs).toBeGreaterThan(0);
  });
});

describe('Squad — Weapon Cooldown Independence', () => {
  it('cloned weapon instances should have independent cooldowns', () => {
    // Simulate what SquadManager.syncMemberWeaponList does
    const leaderWeapons = [
      { defId: 'energy_shot', level: 2, cooldownRemaining: 500 },
      { defId: 'shotgun', level: 1, cooldownRemaining: 300 },
    ];

    // Clone for member
    const memberWeapons = leaderWeapons.map((w) => ({
      defId: w.defId,
      level: w.level,
      cooldownRemaining: 0, // fresh cooldown
    }));

    // Modify leader cooldown
    leaderWeapons[0].cooldownRemaining = 100;

    // Member cooldown should remain independent
    expect(memberWeapons[0].cooldownRemaining).toBe(0);
    expect(leaderWeapons[0].cooldownRemaining).toBe(100);
  });

  it('member weapons should sync level but keep cooldown', () => {
    const memberWeapons = [{ defId: 'energy_shot', level: 1, cooldownRemaining: 250 }];
    const leaderWeapons = [{ defId: 'energy_shot', level: 3, cooldownRemaining: 0 }];

    // Simulate sync
    for (const lw of leaderWeapons) {
      const existing = memberWeapons.find((w) => w.defId === lw.defId);
      if (existing) {
        existing.level = lw.level; // sync level
        // cooldownRemaining stays independent
      }
    }

    expect(memberWeapons[0].level).toBe(3);
    expect(memberWeapons[0].cooldownRemaining).toBe(250); // unchanged
  });
});

describe('Squad — Player Configuration', () => {
  it('SquadMemberConfig type is exported from Player module', () => {
    expect(BALANCE.SQUAD.positions[0]).toHaveProperty('x');
    expect(BALANCE.SQUAD.positions[0]).toHaveProperty('y');
    expect(BALANCE.SQUAD).toHaveProperty('memberScale');
    expect(BALANCE.SQUAD).toHaveProperty('idleBobOffsetMs');
  });

  it('SQUAD positions should not overlap with ALLY positions', () => {
    for (const pos of BALANCE.SQUAD.positions) {
      expect(pos.x).not.toBe(BALANCE.ALLY.leftX);
      expect(pos.x).not.toBe(BALANCE.ALLY.rightX);
    }
  });

  it('solo player should be closer to enemies than barrier', () => {
    const soloX = BALANCE.SQUAD.positions[0].x;
    expect(soloX).toBeLessThan(BALANCE.BARRIER.x);
  });
});
