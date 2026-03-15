import Phaser from "phaser";
import { Threat } from "../objects/Threat";
import { EcosystemSim } from "./EcosystemSim";
import { GAME_WIDTH } from "../config/constants";

export class ThreatSystem {
  public threats: Threat[] = [];
  private scene: Phaser.Scene;
  private waveTimer: number = 0;
  private combatTimer: number = 0;
  private waveNum: number = 0;
  private readonly WAVE_INTERVAL = 60000; // 60 seconds
  private readonly COMBAT_TICK = 2000; // damage every 2 seconds
  private readonly ZONE_BOTTOM = 840; // where threats reach the zone

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public update(delta: number, ecosystem: EcosystemSim): void {
    this.waveTimer += delta;
    this.combatTimer += delta;

    // Spawn wave
    if (this.waveTimer >= this.WAVE_INTERVAL) {
      this.waveTimer = 0;
      this.spawnWave();
    }

    // Move threats
    for (const t of this.threats) {
      if (!t.active) continue;
      t.updateMovement(delta);

      // Threat reached zone - kill creatures
      if (t.y >= this.ZONE_BOTTOM) {
        ecosystem.killRandomCreature();
        t.takeDamage(t.hp); // destroy the threat
      }
    }

    // Zone combat: ZCP damages threats
    if (this.combatTimer >= this.COMBAT_TICK) {
      this.combatTimer = 0;
      const activeThreats = this.threats.filter((t) => t.active);
      if (activeThreats.length > 0) {
        const zcp = ecosystem.getZoneCombatPower();
        const venomMult = ecosystem.getVenomousMultiplier();
        const damagePerThreat = Math.floor(
          (zcp * venomMult) / activeThreats.length,
        );
        for (const t of activeThreats) {
          t.takeDamage(damagePerThreat);
        }
      }
    }

    this.removeDeadThreats();
  }

  private spawnWave(): void {
    this.waveNum++;
    const count = Math.min(1 + Math.floor(this.waveNum / 2), 4);
    for (let i = 0; i < count; i++) {
      const x = Phaser.Math.Between(60, GAME_WIDTH - 60);
      const y = -30 - i * 40;
      const threat = new Threat(this.scene, x, y, this.waveNum);
      this.threats.push(threat);
    }
  }

  private removeDeadThreats(): void {
    this.threats = this.threats.filter((t) => {
      if (!t.active) {
        t.destroy();
        return false;
      }
      return true;
    });
  }

  public getActivePositions(): { x: number; y: number }[] {
    return this.threats
      .filter((t) => t.active)
      .map((t) => ({ x: t.x, y: t.y }));
  }
}
