import Phaser from "phaser";
import { Creature } from "../objects/Creature";
import { CreatureDef, CREATURE_DEFS } from "../config/creatures";
import { GAME_WIDTH } from "../config/constants";

export interface EcosystemState {
  energyPool: number;
  ecosystemHealth: number;
  totalPop: number;
  capacity: number;
  tickCount: number;
  lowEHTicks: number;
}

const ZONE_BOUNDS = new Phaser.Geom.Rectangle(10, 90, GAME_WIDTH - 20, 750);

export class EcosystemSim {
  public creatures: Creature[] = [];
  public state: EcosystemState;
  private scene: Phaser.Scene;
  private tickTimer: number = 0;
  private readonly TICK_INTERVAL = 3000; // 3 seconds
  private readonly CAPACITY_SCHEDULE = [
    { tick: 0, cap: 8 },
    { tick: 20, cap: 10 },
    { tick: 40, cap: 13 },
    { tick: 60, cap: 16 },
    { tick: 80, cap: 20 },
  ];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.state = {
      energyPool: 10,
      ecosystemHealth: 0.5,
      totalPop: 0,
      capacity: 8,
      tickCount: 0,
      lowEHTicks: 0,
    };
  }

  public getZoneBounds(): Phaser.Geom.Rectangle {
    return ZONE_BOUNDS;
  }

  public init(): void {
    // Start with 2 Neon Moss and 1 Glowfly
    this.spawnCreature(CREATURE_DEFS[0]); // P01
    this.spawnCreature(CREATURE_DEFS[0]); // P01
    this.spawnCreature(CREATURE_DEFS[7]); // S01
    this.updateState();
  }

  public spawnCreature(def: CreatureDef): Creature | null {
    if (this.state.totalPop + def.pop > this.state.capacity) return null;

    const x = Phaser.Math.Between(ZONE_BOUNDS.x + 30, ZONE_BOUNDS.right - 30);
    const y = Phaser.Math.Between(ZONE_BOUNDS.y + 30, ZONE_BOUNDS.bottom - 30);
    const creature = new Creature(this.scene, x, y, def);
    this.creatures.push(creature);
    this.updateState();
    return creature;
  }

  public update(
    delta: number,
    threatPositions: { x: number; y: number }[],
  ): void {
    this.tickTimer += delta;

    // Update creature movement
    for (const c of this.creatures) {
      if (!c.active) continue;
      c.updateMovement(delta, ZONE_BOUNDS, threatPositions);
    }

    // Process ecosystem tick
    if (this.tickTimer >= this.TICK_INTERVAL) {
      this.tickTimer -= this.TICK_INTERVAL;
      this.processTick();
    }
  }

  private processTick(): void {
    this.state.tickCount++;

    // Update capacity
    for (const entry of this.CAPACITY_SCHEDULE) {
      if (this.state.tickCount >= entry.tick) {
        this.state.capacity = entry.cap;
      }
    }

    const active = this.creatures.filter((c) => c.active);

    // 1. Producers generate energy
    let produced = 0;
    for (const c of active) {
      if (c.def.role === "Producer") {
        const or = c.getEffectiveOR();
        produced += or;
        // Archive: store excess
        if (c.def.id === "P03") {
          const excess = Math.max(0, or - c.def.fr);
          c.storedEnergy = Math.min(c.storedEnergy + excess, 15);
        }
      }
    }
    this.state.energyPool += produced;

    // 2. All creatures consume FR
    let totalDemand = 0;
    for (const c of active) {
      totalDemand += c.def.fr;
    }

    if (this.state.energyPool >= totalDemand) {
      this.state.energyPool -= totalDemand;
    } else {
      // 3. Starvation: kill weakest (lowest effective RES)
      this.state.energyPool = 0;
      const sorted = [...active].sort(
        (a, b) => a.getEffectiveRES() - b.getEffectiveRES(),
      );
      // Kill 1 creature per starvation event
      if (sorted.length > 0) {
        sorted[0].kill();
      }
    }

    // Archive creatures release stored energy if pool is low
    for (const c of active) {
      if (
        c.def.id === "P03" &&
        c.active &&
        c.storedEnergy > 0 &&
        this.state.energyPool < 5
      ) {
        const release = Math.min(c.storedEnergy, 5);
        this.state.energyPool += release;
        c.storedEnergy -= release;
      }
    }

    // 4. Predators with no prey and no energy become Feral
    const hasPrey = active.some((c) => c.def.role === "Producer");
    for (const c of active) {
      if (c.def.role === "Predator") {
        c.setFeral(!hasPrey && this.state.energyPool <= 0);
      }
    }

    // 5. Symbionts without bond target become Dormant
    for (const c of active) {
      if (c.def.role === "Symbiont") {
        const hasNonSymbiont = active.some(
          (o) => o !== c && o.def.role !== "Symbiont",
        );
        c.setDormant(!hasNonSymbiont);
      }
    }

    // 6. Reproduction
    for (const c of active) {
      if (!c.active || c.def.rr === 0) continue;
      c.ticksSinceRepro++;
      if (c.ticksSinceRepro >= c.def.rr) {
        c.ticksSinceRepro = 0;
        if (this.state.totalPop + c.def.pop <= this.state.capacity) {
          this.spawnCreature(c.def);
        }
      }
    }

    // Cap energy pool
    this.state.energyPool = Math.min(this.state.energyPool, 100);

    this.updateState();
  }

  public updateState(): void {
    const active = this.creatures.filter((c) => c.active);
    this.state.totalPop = active.reduce((sum, c) => sum + c.def.pop, 0);
    this.state.ecosystemHealth = this.calculateEH(active);

    if (this.state.ecosystemHealth < 0.1) {
      this.state.lowEHTicks++;
    } else {
      this.state.lowEHTicks = 0;
    }
  }

  private calculateEH(active: Creature[]): number {
    if (active.length === 0) return 0;

    const total = active.length;
    const roles = new Set(active.map((c) => c.def.role));
    const diversityScore = 1 + 0.2 * (roles.size - 1);

    const producerPct =
      active.filter((c) => c.def.role === "Producer").length / total;
    const predatorPct =
      active.filter((c) => c.def.role === "Predator").length / total;
    const otherPct = 1 - producerPct - predatorPct;

    const chainBalance = Math.max(
      0,
      1 -
        Math.abs(producerPct - 0.4) * 2 -
        Math.abs(predatorPct - 0.25) * 2 -
        Math.abs(otherPct - 0.35) * 2,
    );

    const popRatio = Math.min(this.state.totalPop / this.state.capacity, 1.0);

    return diversityScore * chainBalance * popRatio;
  }

  public getZoneCombatPower(): number {
    const active = this.creatures.filter((c) => c.active);
    let totalCP = 0;
    for (const c of active) {
      totalCP += c.getEffectiveCP();
    }
    return totalCP * (0.5 + this.state.ecosystemHealth);
  }

  public getVenomousMultiplier(): number {
    const active = this.creatures.filter((c) => c.active);
    const hasViper = active.some((c) => c.def.id === "D03");
    return hasViper ? 2 : 1;
  }

  public removeDeadCreatures(): void {
    this.creatures = this.creatures.filter((c) => {
      if (!c.active) {
        c.destroy();
        return false;
      }
      return true;
    });
  }

  public killRandomCreature(): void {
    const active = this.creatures.filter((c) => c.active);
    if (active.length > 0) {
      const victim = active[Phaser.Math.Between(0, active.length - 1)];
      victim.kill();
    }
  }

  public isDefeated(): boolean {
    const active = this.creatures.filter((c) => c.active);
    return active.length === 0 || this.state.lowEHTicks >= 10;
  }

  public isVictory(): boolean {
    return this.state.tickCount >= 100; // 100 ticks * 3s = 300s = 5 minutes
  }
}
