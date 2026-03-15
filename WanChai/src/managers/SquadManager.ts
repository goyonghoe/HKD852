import Phaser from 'phaser';
import { BALANCE } from '../config/balance';
import { Player } from '../objects/Player';
import { WeaponSystem, type WeaponSystemDeps } from '../systems/WeaponSystem';
import type { WeaponInstance } from '../types/weapon';

/**
 * Manages a 3-member defense squad.
 * All members share the same weapon loadout and upgrades.
 * Each fires independently from their own position with independent cooldowns.
 *
 * Usage:
 *   const squad = new SquadManager(scene);
 *   const leader = squad.create(characterId, depsFactory);
 *   // In update loop:
 *   squad.updateWeapons(delta, weapons, enemies, projectilePool, targetPoint);
 *   squad.aimAt(targetX, targetY);
 *   // After upgrade:
 *   squad.syncUpgrades();
 */
export class SquadManager {
  private scene: Phaser.Scene;
  private members: Player[] = [];
  private weaponSystems: WeaponSystem[] = [];
  /** Per-member weapon instance clones (independent cooldowns). Index 0 = leader (uses shared). */
  private memberWeapons: WeaponInstance[][] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Create the full squad. Returns the leader (index 0).
   * @param leaderId Character ID for the leader (front position)
   * @param depsFactory Factory to create WeaponSystemDeps for each member
   */
  create(leaderId: string, depsFactory: (member: Player, index: number) => WeaponSystemDeps): Player {
    const positions = BALANCE.SQUAD.positions;
    const memberIds = BALANCE.SQUAD.memberIds;
    const memberScale = BALANCE.SQUAD.memberScale;
    const bobOffset = BALANCE.SQUAD.idleBobOffsetMs;

    this.members = [];
    this.weaponSystems = [];
    this.memberWeapons = [];

    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      const isLeader = i === 0;
      const characterId = isLeader ? leaderId : memberIds[i];

      const player = new Player(this.scene, pos.x, characterId, {
        posX: pos.x,
        posY: pos.y,
        role: isLeader ? 'leader' : 'member',
        scale: isLeader ? 1 : memberScale,
        idleBobDelayMs: i * bobOffset,
      });

      // Apply squad damage multiplier
      player.damageMultiplier *= BALANCE.SQUAD.damageMultiplier;

      this.members.push(player);
      this.memberWeapons.push([]); // Will be populated in updateWeapons

      // Each member gets its own WeaponSystem instance
      const deps = depsFactory(player, i);
      const ws = new WeaponSystem(this.scene, deps);
      this.weaponSystems.push(ws);
    }

    return this.members[0];
  }

  /** Get the leader (main player, index 0). */
  getLeader(): Player {
    return this.members[0];
  }

  /** Get all squad members (including leader). */
  getAllMembers(): Player[] {
    return this.members;
  }

  /** Get support members only (index 1+). */
  getSupportMembers(): Player[] {
    return this.members.slice(1);
  }

  /** Get the WeaponSystem for the leader (index 0). */
  getLeaderWeaponSystem(): WeaponSystem {
    return this.weaponSystems[0];
  }

  /**
   * Fire weapons from all squad members.
   * Leader uses the shared weapons array directly.
   * Support members use cloned weapon instances with independent cooldowns.
   */
  updateWeapons(
    delta: number,
    weapons: WeaponInstance[],
    enemies: Phaser.GameObjects.Group,
    projectilePool: Phaser.GameObjects.Group,
    targetPoint?: { x: number; y: number } | null,
  ): void {
    // Leader fires with the shared weapons (index 0)
    this.weaponSystems[0].update(delta, this.members[0], weapons, enemies, projectilePool, targetPoint);

    // Support members fire with cloned weapon instances
    for (let i = 1; i < this.members.length; i++) {
      // Sync weapon list: add/remove entries to match leader's weapons
      this.syncMemberWeaponList(i, weapons);

      this.weaponSystems[i].update(delta, this.members[i], this.memberWeapons[i], enemies, projectilePool, targetPoint);
    }
  }

  /**
   * Sync member weapon list to match leader's weapons.
   * Preserves existing cooldown timers for weapons that haven't changed.
   */
  private syncMemberWeaponList(memberIndex: number, leaderWeapons: WeaponInstance[]): void {
    const memberWeps = this.memberWeapons[memberIndex];

    // Remove weapons that leader no longer has
    for (let j = memberWeps.length - 1; j >= 0; j--) {
      if (!leaderWeapons.find((w) => w.defId === memberWeps[j].defId)) {
        memberWeps.splice(j, 1);
      }
    }

    // Add/update weapons to match leader
    for (const lw of leaderWeapons) {
      const existing = memberWeps.find((w) => w.defId === lw.defId);
      if (existing) {
        // Sync level (but keep independent cooldown)
        existing.level = lw.level;
        existing.rarity = lw.rarity;
      } else {
        // New weapon — clone with fresh cooldown
        memberWeps.push({
          defId: lw.defId,
          level: lw.level,
          cooldownRemaining: 0,
          rarity: lw.rarity,
        });
      }
    }
  }

  /**
   * Sync combat stats from leader to all support members.
   * Call after any upgrade that changes leader stats.
   */
  syncUpgrades(): void {
    if (this.members.length < 2) return;
    const leader = this.members[0];
    for (let i = 1; i < this.members.length; i++) {
      const member = this.members[i];
      member.critChance = leader.critChance;
      member.critDamage = leader.critDamage;
      member.attackSpeedMultiplier = leader.attackSpeedMultiplier;
      member.damageMultiplier = leader.damageMultiplier;
    }
  }

  /** Make all members aim at a target. */
  aimAt(targetX: number, targetY: number): void {
    for (const member of this.members) {
      member.aimAt(targetX, targetY);
    }
  }

  /** Reset aim for all members. */
  aimUp(): void {
    for (const member of this.members) {
      member.aimUp();
    }
  }

  /** Clear weapon system caches (call on scene restart). */
  clearCache(): void {
    for (const ws of this.weaponSystems) {
      ws.clearCache();
    }
  }

  /** Get the number of squad members. */
  get size(): number {
    return this.members.length;
  }
}
