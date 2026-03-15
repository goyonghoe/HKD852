import Phaser from "phaser";
import { EcosystemSim } from "../core/EcosystemSim";
import { GateManager } from "../core/GateManager";
import { ThreatSystem } from "../core/ThreatSystem";
import { HUD } from "../ui/HUD";
import { GateUI } from "../ui/GateUI";
import { GAME_WIDTH } from "../config/constants";

export class GameScene extends Phaser.Scene {
  public ecosystemSim!: EcosystemSim;
  private gateManager!: GateManager;
  private threatSystem!: ThreatSystem;
  private hud!: HUD;
  private gateUI!: GateUI;
  private elapsedMs: number = 0;
  private gridGraphics!: Phaser.GameObjects.Graphics;
  private cleanupTimer: number = 0;

  constructor() {
    super({ key: "GameScene" });
  }

  create(): void {
    this.elapsedMs = 0;

    // Draw zone grid background
    this.gridGraphics = this.add.graphics().setDepth(0);
    this.drawGrid();

    // Initialize systems
    this.ecosystemSim = new EcosystemSim(this);
    this.gateManager = new GateManager();
    this.threatSystem = new ThreatSystem(this);

    // Initialize UI
    this.hud = new HUD(this);
    this.gateUI = new GateUI(
      this,
      (index) => this.handleAdmit(index),
      (index) => this.handleReject(index),
    );

    // Start ecosystem with initial creatures
    this.ecosystemSim.init();
  }

  private drawGrid(): void {
    this.gridGraphics.clear();
    // Zone area subtle grid
    this.gridGraphics.lineStyle(1, 0x222244, 0.3);
    for (let x = 10; x <= GAME_WIDTH - 10; x += 40) {
      this.gridGraphics.lineBetween(x, 90, x, 840);
    }
    for (let y = 90; y <= 840; y += 40) {
      this.gridGraphics.lineBetween(10, y, GAME_WIDTH - 10, y);
    }
  }

  update(_time: number, delta: number): void {
    this.elapsedMs += delta;

    // Update ecosystem simulation
    const threatPositions = this.threatSystem.getActivePositions();
    this.ecosystemSim.update(delta, threatPositions);

    // Update gate
    this.gateManager.update(delta);

    // Update threats
    this.threatSystem.update(delta, this.ecosystemSim);

    // Cleanup dead creatures periodically
    this.cleanupTimer += delta;
    if (this.cleanupTimer > 1000) {
      this.cleanupTimer = 0;
      this.ecosystemSim.removeDeadCreatures();
    }

    // Update UI
    this.hud.update(
      this.ecosystemSim.state,
      this.ecosystemSim.getZoneCombatPower(),
      this.elapsedMs,
    );
    this.gateUI.update(this.gateManager);

    // Check win/lose
    if (this.ecosystemSim.isVictory()) {
      this.scene.start("GameOverScene", {
        victory: true,
        time: this.elapsedMs,
      });
    } else if (this.ecosystemSim.isDefeated()) {
      this.scene.start("GameOverScene", {
        victory: false,
        time: this.elapsedMs,
      });
    }
  }

  private handleAdmit(index: number): void {
    this.gateManager.admit(index);
    // Immediately spawn if admitted
    const arrival = this.gateManager.currentArrivals[index];
    if (arrival && arrival.admitted) {
      this.ecosystemSim.spawnCreature(arrival.def);
    }
  }

  private handleReject(index: number): void {
    this.gateManager.reject(index);
  }
}
