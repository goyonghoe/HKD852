import Phaser from "phaser";
import { EcosystemState } from "../core/EcosystemSim";
import { GAME_WIDTH } from "../config/constants";

export class HUD {
  private scene: Phaser.Scene;
  private bg: Phaser.GameObjects.Graphics;
  private ehBarBg: Phaser.GameObjects.Graphics;
  private ehBarFill: Phaser.GameObjects.Graphics;
  private ehLabel: Phaser.GameObjects.Text;
  private energyText: Phaser.GameObjects.Text;
  private popText: Phaser.GameObjects.Text;
  private timerText: Phaser.GameObjects.Text;
  private waveText: Phaser.GameObjects.Text;
  private zcpText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // Background bar
    this.bg = scene.add.graphics();
    this.bg.fillStyle(0x0a0a1a, 0.9);
    this.bg.fillRect(0, 0, GAME_WIDTH, 80);
    this.bg.lineStyle(1, 0x333366, 0.5);
    this.bg.lineBetween(0, 80, GAME_WIDTH, 80);
    this.bg.setDepth(100);

    // EH label
    this.ehLabel = scene.add
      .text(10, 8, "EH", {
        fontSize: "12px",
        fontFamily: "monospace",
        color: "#00ff88",
      })
      .setDepth(101);

    // EH bar background
    this.ehBarBg = scene.add.graphics().setDepth(101);
    this.ehBarBg.fillStyle(0x222244, 1);
    this.ehBarBg.fillRect(30, 8, 200, 16);

    // EH bar fill
    this.ehBarFill = scene.add.graphics().setDepth(102);

    // Energy
    this.energyText = scene.add
      .text(10, 32, "Energy: 0", {
        fontSize: "13px",
        fontFamily: "monospace",
        color: "#ffcc00",
      })
      .setDepth(101);

    // Population
    this.popText = scene.add
      .text(10, 52, "Pop: 0/8", {
        fontSize: "13px",
        fontFamily: "monospace",
        color: "#88ccff",
      })
      .setDepth(101);

    // Timer
    this.timerText = scene.add
      .text(GAME_WIDTH - 10, 8, "5:00", {
        fontSize: "22px",
        fontFamily: "monospace",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(1, 0)
      .setDepth(101);

    // Wave info
    this.waveText = scene.add
      .text(GAME_WIDTH - 10, 36, "Wave --", {
        fontSize: "12px",
        fontFamily: "monospace",
        color: "#aa66ff",
      })
      .setOrigin(1, 0)
      .setDepth(101);

    // ZCP
    this.zcpText = scene.add
      .text(GAME_WIDTH - 10, 54, "ZCP: 0", {
        fontSize: "12px",
        fontFamily: "monospace",
        color: "#ff6666",
      })
      .setOrigin(1, 0)
      .setDepth(101);
  }

  public update(state: EcosystemState, zcp: number, elapsedMs: number): void {
    // EH bar
    const ehRatio = Math.max(0, Math.min(1, state.ecosystemHealth));
    this.ehBarFill.clear();
    const color =
      ehRatio > 0.5 ? 0x00ff88 : ehRatio > 0.2 ? 0xffcc00 : 0xff4444;
    this.ehBarFill.fillStyle(color, 0.9);
    this.ehBarFill.fillRect(30, 8, 200 * ehRatio, 16);

    // Energy
    this.energyText.setText(`Energy: ${Math.floor(state.energyPool)}`);

    // Population
    this.popText.setText(`Pop: ${state.totalPop}/${state.capacity}`);

    // Timer (countdown from 5 minutes)
    const remainingMs = Math.max(0, 300000 - elapsedMs);
    const mins = Math.floor(remainingMs / 60000);
    const secs = Math.floor((remainingMs % 60000) / 1000);
    this.timerText.setText(`${mins}:${secs.toString().padStart(2, "0")}`);

    // Color timer red when < 60s
    this.timerText.setColor(remainingMs < 60000 ? "#ff4444" : "#ffffff");

    // Wave
    const waveNum = Math.floor(elapsedMs / 60000);
    this.waveText.setText(waveNum > 0 ? `Wave ${waveNum}` : "Wave --");

    // ZCP
    this.zcpText.setText(`ZCP: ${Math.floor(zcp)}`);
  }
}
