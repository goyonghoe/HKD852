import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/constants";

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameOverScene" });
  }

  create(data: { victory: boolean; time: number }): void {
    const victory = data.victory;
    const timeMs = data.time;

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0a1a, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Decorative border
    const border = this.add.graphics();
    const borderColor = victory ? 0x00ff88 : 0xff4444;
    border.lineStyle(3, borderColor, 0.6);
    border.strokeRect(30, 200, GAME_WIDTH - 60, 500);

    // Title
    const title = victory ? "ECOSYSTEM STABILIZED" : "ECOSYSTEM COLLAPSED";
    const titleColor = victory ? "#00ff88" : "#ff4444";
    this.add
      .text(GAME_WIDTH / 2, 320, title, {
        fontSize: "28px",
        fontFamily: "monospace",
        color: titleColor,
        fontStyle: "bold",
        align: "center",
      })
      .setOrigin(0.5);

    // Subtitle
    const subtitle = victory
      ? "Your zone survived the full 5 minutes."
      : "Your ecosystem could not sustain itself.";
    this.add
      .text(GAME_WIDTH / 2, 380, subtitle, {
        fontSize: "14px",
        fontFamily: "monospace",
        color: "#aaaacc",
        align: "center",
        wordWrap: { width: GAME_WIDTH - 100 },
      })
      .setOrigin(0.5);

    // Time survived
    const mins = Math.floor(timeMs / 60000);
    const secs = Math.floor((timeMs % 60000) / 1000);
    this.add
      .text(
        GAME_WIDTH / 2,
        440,
        `Time: ${mins}:${secs.toString().padStart(2, "0")}`,
        {
          fontSize: "18px",
          fontFamily: "monospace",
          color: "#ffffff",
        },
      )
      .setOrigin(0.5);

    // Retry button
    const btnW = 200;
    const btnH = 50;
    const btnX = GAME_WIDTH / 2;
    const btnY = 560;

    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x222266, 0.9);
    btnBg.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
    btnBg.lineStyle(2, 0x4488ff, 0.8);
    btnBg.strokeRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);

    this.add
      .text(btnX, btnY, "PLAY AGAIN", {
        fontSize: "18px",
        fontFamily: "monospace",
        color: "#4488ff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const zone = this.add
      .zone(btnX, btnY, btnW, btnH)
      .setInteractive({ useHandCursor: true });
    zone.on("pointerdown", () => {
      this.scene.start("GameScene");
    });

    // Neon Warden title at bottom
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 60, "NEON WARDEN", {
        fontSize: "12px",
        fontFamily: "monospace",
        color: "#444466",
      })
      .setOrigin(0.5);
  }
}
