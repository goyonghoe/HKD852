import Phaser from "phaser";
import { CreatureDef, ROLE_COLORS, ROLE_LETTERS } from "../config/creatures";

export class Creature extends Phaser.GameObjects.Container {
  public def: CreatureDef;
  public currentRes: number;
  public ticksSinceRepro: number = 0;
  public bondTarget: Creature | null = null;
  public isFeral: boolean = false;
  public isDormant: boolean = false;
  public storedEnergy: number = 0; // For Archive trait

  private circle: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;
  private glowCircle: Phaser.GameObjects.Graphics;
  private moveTimer: number = 0;
  private moveDir: Phaser.Math.Vector2;
  private readonly radius: number;

  constructor(scene: Phaser.Scene, x: number, y: number, def: CreatureDef) {
    super(scene, x, y);
    this.def = def;
    this.currentRes = def.res;
    this.radius = 12 + def.pop * 4;
    this.moveDir = new Phaser.Math.Vector2(
      Phaser.Math.Between(-50, 50),
      Phaser.Math.Between(-50, 50),
    );

    // Glow effect
    this.glowCircle = scene.add.graphics();
    this.add(this.glowCircle);

    // Main circle
    this.circle = scene.add.graphics();
    this.add(this.circle);

    // Role letter
    this.label = scene.add
      .text(0, 0, ROLE_LETTERS[def.role], {
        fontSize: `${Math.max(12, this.radius)}px`,
        fontFamily: "monospace",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.add(this.label);

    this.drawVisuals();
    scene.add.existing(this);
  }

  private drawVisuals(): void {
    const color = ROLE_COLORS[this.def.role];

    this.glowCircle.clear();
    this.glowCircle.fillStyle(color, 0.15);
    this.glowCircle.fillCircle(0, 0, this.radius + 6);

    this.circle.clear();
    this.circle.fillStyle(color, 0.8);
    this.circle.fillCircle(0, 0, this.radius);
    this.circle.lineStyle(2, color, 1);
    this.circle.strokeCircle(0, 0, this.radius);

    if (this.isFeral) {
      this.circle.lineStyle(2, 0xff0000, 1);
      this.circle.strokeCircle(0, 0, this.radius + 3);
    }
    if (this.isDormant) {
      this.setAlpha(0.5);
    } else {
      this.setAlpha(1);
    }
  }

  public getEffectiveCP(): number {
    let cp = this.def.cp;
    if (this.def.id === "D01") {
      // Pack Hunter: +2 CP per other Predator (max +6)
      const scene = this.scene as Phaser.Scene & {
        ecosystemSim?: { creatures: Creature[] };
      };
      if (scene.ecosystemSim) {
        const otherPredators = scene.ecosystemSim.creatures.filter(
          (c) => c !== this && c.def.role === "Predator" && c.active,
        ).length;
        cp += Math.min(otherPredators * 2, 6);
      }
    }
    if (this.def.id === "D03") {
      // Venomous: 2x damage handled in ThreatSystem
    }
    return cp;
  }

  public getEffectiveOR(): number {
    let or = this.def.or;
    if (this.def.id === "P02") {
      // Networked: +1 OR per adjacent Producer (within 100px)
      const scene = this.scene as Phaser.Scene & {
        ecosystemSim?: { creatures: Creature[] };
      };
      if (scene.ecosystemSim) {
        const adjacentProducers = scene.ecosystemSim.creatures.filter(
          (c) =>
            c !== this &&
            c.def.role === "Producer" &&
            c.active &&
            Phaser.Math.Distance.Between(this.x, this.y, c.x, c.y) < 100,
        ).length;
        or += adjacentProducers;
      }
    }
    if (this.def.id === "P04") {
      // Superposition: randomly double or halve
      or = Math.random() < 0.5 ? or * 2 : Math.floor(or / 2);
    }
    // Pollinate bonus from bonded Glowfly Swarm
    const scene = this.scene as Phaser.Scene & {
      ecosystemSim?: { creatures: Creature[] };
    };
    if (this.def.role === "Producer" && scene.ecosystemSim) {
      const bondedGlowfly = scene.ecosystemSim.creatures.find(
        (c) => c.def.id === "S01" && c.active && c.bondTarget === this,
      );
      if (bondedGlowfly) {
        or = Math.floor(or * 1.5);
      }
    }
    return or;
  }

  public getEffectiveRES(): number {
    let res = this.currentRes;
    // Armor Coat bonus
    const scene = this.scene as Phaser.Scene & {
      ecosystemSim?: { creatures: Creature[] };
    };
    if (scene.ecosystemSim) {
      const bondedLichen = scene.ecosystemSim.creatures.find(
        (c) => c.def.id === "S02" && c.active && c.bondTarget === this,
      );
      if (bondedLichen) {
        res += 5;
      }
    }
    return res;
  }

  public updateMovement(
    delta: number,
    bounds: Phaser.Geom.Rectangle,
    threats: { x: number; y: number }[],
  ): void {
    this.moveTimer += delta;

    if (this.def.role === "Predator" && threats.length > 0 && !this.isFeral) {
      // Move toward nearest threat
      let nearest = threats[0];
      let minDist = Phaser.Math.Distance.Between(
        this.x,
        this.y,
        nearest.x,
        nearest.y,
      );
      for (const t of threats) {
        const d = Phaser.Math.Distance.Between(this.x, this.y, t.x, t.y);
        if (d < minDist) {
          minDist = d;
          nearest = t;
        }
      }
      const angle = Phaser.Math.Angle.Between(
        this.x,
        this.y,
        nearest.x,
        nearest.y,
      );
      this.moveDir.set(Math.cos(angle) * 60, Math.sin(angle) * 60);
    } else if (this.def.role === "Symbiont" && !this.isDormant) {
      // Move toward bond target or find one
      const scene = this.scene as Phaser.Scene & {
        ecosystemSim?: { creatures: Creature[] };
      };
      if (scene.ecosystemSim) {
        if (!this.bondTarget || !this.bondTarget.active) {
          // Find nearest non-symbiont
          const candidates = scene.ecosystemSim.creatures.filter(
            (c) => c !== this && c.def.role !== "Symbiont" && c.active,
          );
          if (candidates.length > 0) {
            let nearest = candidates[0];
            let minDist = Phaser.Math.Distance.Between(
              this.x,
              this.y,
              nearest.x,
              nearest.y,
            );
            for (const c of candidates) {
              const d = Phaser.Math.Distance.Between(this.x, this.y, c.x, c.y);
              if (d < minDist) {
                minDist = d;
                nearest = c;
              }
            }
            this.bondTarget = nearest;
          }
        }
        if (this.bondTarget && this.bondTarget.active) {
          const dist = Phaser.Math.Distance.Between(
            this.x,
            this.y,
            this.bondTarget.x,
            this.bondTarget.y,
          );
          if (dist > 30) {
            const angle = Phaser.Math.Angle.Between(
              this.x,
              this.y,
              this.bondTarget.x,
              this.bondTarget.y,
            );
            this.moveDir.set(Math.cos(angle) * 40, Math.sin(angle) * 40);
          } else {
            this.moveDir.set(0, 0);
          }
        }
      }
    } else {
      // Random wandering
      if (this.moveTimer > 2000) {
        this.moveTimer = 0;
        this.moveDir.set(
          Phaser.Math.Between(-40, 40),
          Phaser.Math.Between(-40, 40),
        );
      }
    }

    const speed = delta / 1000;
    this.x += this.moveDir.x * speed;
    this.y += this.moveDir.y * speed;

    // Bounce off bounds
    if (this.x < bounds.x + this.radius) {
      this.x = bounds.x + this.radius;
      this.moveDir.x *= -1;
    }
    if (this.x > bounds.right - this.radius) {
      this.x = bounds.right - this.radius;
      this.moveDir.x *= -1;
    }
    if (this.y < bounds.y + this.radius) {
      this.y = bounds.y + this.radius;
      this.moveDir.y *= -1;
    }
    if (this.y > bounds.bottom - this.radius) {
      this.y = bounds.bottom - this.radius;
      this.moveDir.y *= -1;
    }
  }

  public flash(color: number): void {
    this.circle.clear();
    this.circle.fillStyle(color, 1);
    this.circle.fillCircle(0, 0, this.radius);
    this.scene.time.delayedCall(200, () => {
      if (this.active) this.drawVisuals();
    });
  }

  public setFeral(val: boolean): void {
    this.isFeral = val;
    this.drawVisuals();
  }

  public setDormant(val: boolean): void {
    this.isDormant = val;
    this.drawVisuals();
  }

  public kill(): void {
    this.flash(0xffffff);
    this.scene.time.delayedCall(200, () => {
      this.setActive(false);
      this.setVisible(false);
    });
  }
}
