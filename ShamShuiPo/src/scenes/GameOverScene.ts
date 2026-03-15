// ── Neon Survivors: Game Over Scene ──

import Phaser from "phaser";
import { SCENE_KEYS } from "../types/game";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/balance";
import { COLORS, COLOR_STR } from "../config/colors";
import type { GameOverData } from "./GameScene";
import { calculateFinalScore } from "../core/ScoreCalc";

const BG_KEY = "bg_layer1";

export class GameOverScene extends Phaser.Scene {
  private result: GameOverData = {
    score: 0,
    victory: false,
    elapsed: 0,
    level: 1,
    coinsEarned: 0,
    kills: 0,
    bossesKilled: 0,
    maxCombo: 0,
  };

  constructor() {
    super({ key: SCENE_KEYS.GAME_OVER });
  }

  init(passedData: Record<string, unknown>): void {
    this.result = {
      score: (passedData?.score as number) ?? 0,
      victory: (passedData?.victory as boolean) ?? false,
      elapsed: (passedData?.elapsed as number) ?? 0,
      level: (passedData?.level as number) ?? 1,
      coinsEarned: (passedData?.coinsEarned as number) ?? 0,
      kills: (passedData?.kills as number) ?? 0,
      bossesKilled: (passedData?.bossesKilled as number) ?? 0,
      maxCombo: (passedData?.maxCombo as number) ?? 0,
    };
  }

  create(): void {
    this.createBackground();
    this.createResultPanel();
    this.createRestartButton();
  }

  private createBackground(): void {
    if (this.textures.exists(BG_KEY)) {
      const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, BG_KEY);
      const scaleX = GAME_WIDTH / bg.width;
      const scaleY = GAME_HEIGHT / bg.height;
      bg.setScale(Math.max(scaleX, scaleY));
    }

    // Stronger darken overlay for game-over mood
    const overlayAlpha = this.result.victory ? 0.55 : 0.72;
    this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      overlayAlpha,
    );
  }

  private createResultPanel(): void {
    const cx = GAME_WIDTH / 2;
    const panelY = GAME_HEIGHT * 0.38;

    // Panel background (taller to include coins section)
    this.add
      .rectangle(cx, panelY, 580, 490, COLORS.BG_PANEL, 0.92)
      .setStrokeStyle(
        3,
        this.result.victory ? COLORS.NEON_GREEN : COLORS.NEON_PINK,
        1,
      );

    // Result title
    const titleText = this.result.victory ? "VICTORY!" : "GAME OVER";
    const titleColor = this.result.victory
      ? COLOR_STR.NEON_GREEN
      : COLOR_STR.NEON_PINK;

    const title = this.add
      .text(cx, panelY - 110, titleText, {
        fontFamily: "monospace",
        fontSize: "72px",
        color: titleColor,
        stroke: "#000000",
        strokeThickness: 8,
        shadow: {
          offsetX: 0,
          offsetY: 0,
          color: titleColor,
          blur: 24,
          fill: true,
        },
      })
      .setOrigin(0.5)
      .setAlpha(0);

    // Animate title entrance
    this.tweens.add({
      targets: title,
      alpha: 1,
      y: panelY - 120,
      duration: 600,
      ease: "Back.easeOut",
      delay: 200,
    });

    // Score label
    this.add
      .text(cx, panelY - 30, "FINAL SCORE", {
        fontFamily: "monospace",
        fontSize: "24px",
        color: COLOR_STR.TEXT_GRAY,
      })
      .setOrigin(0.5);

    // Score value
    const scoreText = this.add
      .text(cx, panelY + 30, `${this.result.score}`, {
        fontFamily: "monospace",
        fontSize: "72px",
        color: COLOR_STR.COIN_GOLD,
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({
      targets: scoreText,
      alpha: 1,
      duration: 500,
      delay: 600,
    });

    // Grade badge (S/A/B/C/D/F) via ScoreCalc
    const breakdown = calculateFinalScore(
      this.result.kills,
      this.result.bossesKilled,
      this.result.elapsed,
      this.result.level,
      this.result.coinsEarned,
      this.result.maxCombo,
    );

    const gradeColorMap: Record<string, string> = {
      S: COLOR_STR.NEON_YELLOW,
      A: COLOR_STR.NEON_GREEN,
      B: COLOR_STR.NEON_CYAN,
      C: COLOR_STR.TEXT_WHITE,
      D: COLOR_STR.TEXT_GRAY,
      F: COLOR_STR.NEON_PINK,
    };
    const gradeColor = gradeColorMap[breakdown.grade] ?? COLOR_STR.TEXT_WHITE;

    const gradeText = this.add
      .text(cx + 180, panelY + 30, breakdown.grade, {
        fontFamily: "monospace",
        fontSize: "64px",
        color: gradeColor,
        stroke: "#000000",
        strokeThickness: 6,
        shadow: {
          offsetX: 0,
          offsetY: 0,
          color: gradeColor,
          blur: 18,
          fill: true,
        },
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({
      targets: gradeText,
      alpha: 1,
      scale: { from: 2, to: 1 },
      duration: 400,
      ease: "Back.easeOut",
      delay: 900,
    });

    // Time survived
    const totalSec = Math.floor(this.result.elapsed);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    // Stat grid: Time | Level | Kills
    const statY = panelY + 100;
    const statStyle = {
      fontFamily: "monospace",
      fontSize: "14px",
      color: COLOR_STR.TEXT_DIM,
    };
    const statValueStyle = {
      fontFamily: "monospace",
      fontSize: "24px",
      color: COLOR_STR.TEXT_WHITE,
    };

    // Time
    this.add.text(cx - 160, statY, "TIME", statStyle).setOrigin(0.5);
    this.add
      .text(
        cx - 160,
        statY + 28,
        `${min}:${String(sec).padStart(2, "0")}`,
        statValueStyle,
      )
      .setOrigin(0.5);

    // Level
    this.add.text(cx, statY, "LEVEL", statStyle).setOrigin(0.5);
    this.add
      .text(cx, statY + 28, `${this.result.level}`, statValueStyle)
      .setOrigin(0.5);

    // Kills
    this.add.text(cx + 160, statY, "KILLS", statStyle).setOrigin(0.5);
    this.add
      .text(cx + 160, statY + 28, `${this.result.kills}`, {
        ...statValueStyle,
        color: COLOR_STR.NEON_GREEN,
      })
      .setOrigin(0.5);

    // Decorative separator
    this.add
      .text(cx, panelY + 170, "━━━━━━━━━━━━━━━━━━━━━━", {
        fontFamily: "monospace",
        fontSize: "20px",
        color: this.result.victory ? COLOR_STR.NEON_GREEN : COLOR_STR.NEON_PINK,
      })
      .setOrigin(0.5)
      .setAlpha(0.5);

    // Coins earned
    this.add
      .text(cx, panelY + 205, "COINS EARNED", {
        fontFamily: "monospace",
        fontSize: "22px",
        color: COLOR_STR.TEXT_GRAY,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, panelY + 245, `+${this.result.coinsEarned} ◆`, {
        fontFamily: "monospace",
        fontSize: "38px",
        color: COLOR_STR.COIN_GOLD,
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5);
  }

  private createRestartButton(): void {
    const cx = GAME_WIDTH / 2;
    const btnY = GAME_HEIGHT * 0.88;

    // Button background (large touch target: 400x90)
    const btnBg = this.add
      .rectangle(cx, btnY, 480, 90, COLORS.BG_DARK, 1)
      .setStrokeStyle(3, COLORS.NEON_CYAN, 1)
      .setInteractive({ useHandCursor: true });

    // Button text
    const btnText = this.add
      .text(cx, btnY, "CONTINUE →", {
        fontFamily: "monospace",
        fontSize: "34px",
        color: COLOR_STR.NEON_CYAN,
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    // Pulse animation
    this.tweens.add({
      targets: btnText,
      alpha: { from: 1, to: 0.35 },
      duration: 850,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
      delay: 800,
    });

    // Hover effect
    btnBg.on("pointerover", () => {
      btnBg.setStrokeStyle(3, COLORS.NEON_GREEN, 1);
      btnBg.setFillStyle(COLORS.NEON_CYAN, 0.1);
    });
    btnBg.on("pointerout", () => {
      btnBg.setStrokeStyle(3, COLORS.NEON_CYAN, 1);
      btnBg.setFillStyle(COLORS.BG_DARK, 1);
    });
    btnBg.on("pointerdown", () => this.goToMeta());

    // Also allow tap anywhere
    this.input.once("pointerdown", () => this.goToMeta());

    // Credits footer
    this.add
      .text(cx, GAME_HEIGHT - 30, "HKD852 Studio · Neon Survivors v0.1", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: COLOR_STR.TEXT_GRAY,
      })
      .setOrigin(0.5);
  }

  private goToMeta(): void {
    this.tweens.killAll();
    this.scene.start(SCENE_KEYS.META, {
      score: this.result.score,
      elapsed: this.result.elapsed,
      coinsEarned: this.result.coinsEarned,
    });
  }
}
