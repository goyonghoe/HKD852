// ── Neon Survivors: Meta Progression Scene ──
// Shown after game over — players spend coins on permanent upgrades.

import Phaser from "phaser";
import { SCENE_KEYS } from "../types/game";
import { GAME_WIDTH, GAME_HEIGHT, META_UPGRADES } from "../config/balance";
import { COLORS, COLOR_STR } from "../config/colors";
import {
  loadSave,
  saveMeta,
  addRunReward,
  canAffordUpgrade,
  purchaseUpgrade,
  getMetaUpgradeCost,
  type MetaSave,
} from "../core/MetaCalc";
import { getDifficultyLabel } from "../core/DifficultyScalingCalc";

const BG_KEY = "bg_layer1";
const UPGRADE_IDS = ["meta_hp", "meta_damage", "meta_speed", "meta_magnet"];

export interface MetaSceneData {
  score: number;
  elapsed: number;
  coinsEarned: number;
}

export class MetaScene extends Phaser.Scene {
  private save!: MetaSave;
  private coinsEarned = 0;
  private score = 0;
  private elapsed = 0;

  // UI references updated on buy
  private coinText!: Phaser.GameObjects.Text;
  private upgradeRows: UpgradeRowRefs[] = [];

  constructor() {
    super({ key: SCENE_KEYS.META });
  }

  init(data: Record<string, unknown>): void {
    this.score = (data?.score as number) ?? 0;
    this.elapsed = (data?.elapsed as number) ?? 0;
    this.coinsEarned = (data?.coinsEarned as number) ?? 0;

    // Load existing save and record the run
    const existing = loadSave();
    this.save = addRunReward(
      existing,
      this.score,
      this.elapsed,
      this.coinsEarned,
    );
    saveMeta(this.save);
  }

  create(): void {
    this.createBackground();
    this.createHeader();
    this.createResultSummary();
    this.createUpgradeList();
    this.createPlayAgainButton();
  }

  // ── Background ──────────────────────────────────────────────

  private createBackground(): void {
    if (this.textures.exists(BG_KEY)) {
      const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, BG_KEY);
      const scaleX = GAME_WIDTH / bg.width;
      const scaleY = GAME_HEIGHT / bg.height;
      bg.setScale(Math.max(scaleX, scaleY));
    }

    this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.78,
    );
  }

  // ── Header banner ────────────────────────────────────────────

  private createHeader(): void {
    const cx = GAME_WIDTH / 2;

    this.add
      .text(cx, 70, "RESULTS", {
        fontFamily: "monospace",
        fontSize: "64px",
        color: COLOR_STR.NEON_CYAN,
        stroke: "#000000",
        strokeThickness: 6,
        shadow: {
          offsetX: 0,
          offsetY: 0,
          color: COLOR_STR.NEON_CYAN,
          blur: 20,
          fill: true,
        },
      })
      .setOrigin(0.5);

    // Separator
    this.add
      .text(cx, 120, "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: COLOR_STR.NEON_CYAN,
      })
      .setOrigin(0.5)
      .setAlpha(0.4);
  }

  // ── Run summary panel ─────────────────────────────────────────

  private createResultSummary(): void {
    const cx = GAME_WIDTH / 2;
    const panelY = 230;
    const panelH = 175;

    // Panel BG
    this.add
      .rectangle(cx, panelY, 640, panelH, COLORS.BG_PANEL, 0.9)
      .setStrokeStyle(2, COLORS.NEON_CYAN, 0.6);

    // Score
    this.add
      .text(cx - 160, panelY - 50, "SCORE", {
        fontFamily: "monospace",
        fontSize: "20px",
        color: COLOR_STR.TEXT_GRAY,
      })
      .setOrigin(0.5);

    this.add
      .text(cx - 160, panelY - 10, `${this.score}`, {
        fontFamily: "monospace",
        fontSize: "46px",
        color: COLOR_STR.COIN_GOLD,
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    // Time survived
    const min = Math.floor(this.elapsed / 60);
    const sec = Math.floor(this.elapsed % 60);
    const timeStr = `${min}:${String(sec).padStart(2, "0")}`;

    this.add
      .text(cx + 60, panelY - 50, "SURVIVED", {
        fontFamily: "monospace",
        fontSize: "20px",
        color: COLOR_STR.TEXT_GRAY,
      })
      .setOrigin(0.5);

    this.add
      .text(cx + 60, panelY - 10, timeStr, {
        fontFamily: "monospace",
        fontSize: "46px",
        color: COLOR_STR.NEON_GREEN,
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    // Coins earned this run
    this.add
      .text(cx, panelY + 50, `COINS EARNED THIS RUN`, {
        fontFamily: "monospace",
        fontSize: "20px",
        color: COLOR_STR.TEXT_GRAY,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, panelY + 90, `+${this.coinsEarned} ◆`, {
        fontFamily: "monospace",
        fontSize: "38px",
        color: COLOR_STR.COIN_GOLD,
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    // Best score
    this.add
      .text(cx, panelY + 130, `BEST SCORE: ${this.save.bestScore}`, {
        fontFamily: "monospace",
        fontSize: "20px",
        color: COLOR_STR.TEXT_DIM,
      })
      .setOrigin(0.5);
  }

  // ── Upgrade shop ──────────────────────────────────────────────

  private createUpgradeList(): void {
    const cx = GAME_WIDTH / 2;
    const startY = 450;
    const rowH = 110;

    // "UPGRADES" section header + coin display
    this.add
      .text(cx - 160, startY - 30, "UPGRADES", {
        fontFamily: "monospace",
        fontSize: "22px",
        color: COLOR_STR.NEON_PURPLE,
      })
      .setOrigin(0.5);

    this.coinText = this.add
      .text(cx + 130, startY - 30, `◆ ${this.save.coins}`, {
        fontFamily: "monospace",
        fontSize: "26px",
        color: COLOR_STR.COIN_GOLD,
      })
      .setOrigin(0.5);

    this.upgradeRows = [];

    UPGRADE_IDS.forEach((id, idx) => {
      const y = startY + idx * rowH + 10;
      const refs = this.createUpgradeRow(id, cx, y);
      this.upgradeRows.push(refs);
    });
  }

  private createUpgradeRow(
    upgradeId: string,
    cx: number,
    y: number,
  ): UpgradeRowRefs {
    const def = META_UPGRADES[upgradeId];
    const currentLevel = this.save.upgrades[upgradeId] ?? 0;
    const isMaxed = currentLevel >= def.maxLevel;
    const cost = isMaxed ? 0 : getMetaUpgradeCost(upgradeId, currentLevel);
    const affordable = !isMaxed && canAffordUpgrade(this.save, upgradeId);

    // Row background
    const rowBg = this.add
      .rectangle(cx, y, 640, 90, COLORS.BG_PANEL, 0.85)
      .setStrokeStyle(2, COLORS.UI_BORDER, 0.7);

    // Upgrade name
    const nameText = this.add
      .text(cx - 260, y - 14, def.name.toUpperCase(), {
        fontFamily: "monospace",
        fontSize: "22px",
        color: COLOR_STR.TEXT_WHITE,
      })
      .setOrigin(0, 0.5);

    // Level pips (max 10, show as filled/empty circles)
    const maxPips = Math.min(def.maxLevel, 10);
    for (let i = 0; i < maxPips; i++) {
      const filled = i < currentLevel;
      this.add
        .rectangle(
          cx - 260 + i * 18,
          y + 18,
          12,
          8,
          filled ? COLORS.NEON_CYAN : COLORS.UI_LEVEL_PIP_EMPTY,
          1,
        )
        .setOrigin(0, 0.5);
    }

    // Level label
    const levelText = this.add
      .text(cx - 260 + maxPips * 18 + 8, y + 18, `Lv.${currentLevel}`, {
        fontFamily: "monospace",
        fontSize: "18px",
        color: isMaxed ? COLOR_STR.NEON_YELLOW : COLOR_STR.TEXT_GRAY,
      })
      .setOrigin(0, 0.5);

    // BUY button
    const btnW = 160;
    const btnX = cx + 230;
    const btnColor = isMaxed
      ? COLORS.UI_SLOT_BORDER
      : affordable
        ? COLORS.NEON_CYAN
        : COLORS.UI_BORDER;

    const buyBtn = this.add
      .rectangle(btnX, y, btnW, 60, COLORS.BG_DARK, 1)
      .setStrokeStyle(2, btnColor, 1);

    const btnLabel = isMaxed
      ? "MAXED"
      : affordable
        ? `BUY ◆${cost}`
        : `◆${cost}`;

    const btnText = this.add
      .text(btnX, y, btnLabel, {
        fontFamily: "monospace",
        fontSize: "20px",
        color: isMaxed
          ? COLOR_STR.TEXT_DIM
          : affordable
            ? COLOR_STR.NEON_CYAN
            : COLOR_STR.TEXT_DIM,
      })
      .setOrigin(0.5);

    if (!isMaxed) {
      buyBtn.setInteractive({ useHandCursor: true });

      buyBtn.on("pointerover", () => {
        if (canAffordUpgrade(this.save, upgradeId)) {
          buyBtn.setFillStyle(COLORS.NEON_CYAN, 0.15);
        }
      });

      buyBtn.on("pointerout", () => {
        buyBtn.setFillStyle(COLORS.BG_DARK, 1);
      });

      buyBtn.on("pointerdown", () => {
        this.handleBuy(upgradeId);
      });
    }

    return {
      upgradeId,
      rowBg,
      nameText,
      levelText,
      buyBtn,
      btnText,
    };
  }

  private handleBuy(upgradeId: string): void {
    if (!canAffordUpgrade(this.save, upgradeId)) return;

    try {
      this.save = purchaseUpgrade(this.save, upgradeId);
      saveMeta(this.save);
    } catch {
      return; // purchase failed, do nothing
    }

    // Update coin display
    this.coinText.setText(`◆ ${this.save.coins}`);

    // Rebuild the affected upgrade row
    const rowIdx = this.upgradeRows.findIndex((r) => r.upgradeId === upgradeId);
    if (rowIdx === -1) return;

    const row = this.upgradeRows[rowIdx];
    // Destroy old row objects
    row.rowBg.destroy();
    row.nameText.destroy();
    row.levelText.destroy();
    row.buyBtn.destroy();
    row.btnText.destroy();

    // Recompute y position
    const cx = GAME_WIDTH / 2;
    const startY = 450;
    const rowH = 110;
    const y = startY + rowIdx * rowH + 10;

    const newRefs = this.createUpgradeRow(upgradeId, cx, y);
    this.upgradeRows[rowIdx] = newRefs;
  }

  // ── Play Again button ─────────────────────────────────────────

  private createPlayAgainButton(): void {
    const cx = GAME_WIDTH / 2;
    const btnY = GAME_HEIGHT - 110;

    const btnBg = this.add
      .rectangle(cx, btnY, 480, 90, COLORS.BG_DARK, 1)
      .setStrokeStyle(3, COLORS.NEON_GREEN, 1)
      .setInteractive({ useHandCursor: true });

    const btnText = this.add
      .text(cx, btnY, "PLAY AGAIN", {
        fontFamily: "monospace",
        fontSize: "38px",
        color: COLOR_STR.NEON_GREEN,
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: btnText,
      alpha: { from: 1, to: 0.4 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    btnBg.on("pointerover", () => {
      btnBg.setStrokeStyle(3, COLORS.NEON_CYAN, 1);
      btnBg.setFillStyle(COLORS.NEON_GREEN, 0.12);
    });
    btnBg.on("pointerout", () => {
      btnBg.setStrokeStyle(3, COLORS.NEON_GREEN, 1);
      btnBg.setFillStyle(COLORS.BG_DARK, 1);
    });
    btnBg.on("pointerdown", () => this.startNewRun());

    // Footer with run count + difficulty
    const diffLabel = getDifficultyLabel(0); // Loop 0 for now (base difficulty)
    this.add
      .text(
        cx,
        GAME_HEIGHT - 40,
        `Total Runs: ${this.save.totalRuns}  |  Best: ${this.save.bestScore}  |  ${diffLabel}`,
        {
          fontFamily: "monospace",
          fontSize: "16px",
          color: COLOR_STR.TEXT_DIM,
        },
      )
      .setOrigin(0.5);
  }

  private startNewRun(): void {
    this.tweens.killAll();
    this.scene.start(SCENE_KEYS.CHARACTER_SELECT);
  }
}

// ── Internal type for row UI references ──────────────────────────

interface UpgradeRowRefs {
  upgradeId: string;
  rowBg: Phaser.GameObjects.Rectangle;
  nameText: Phaser.GameObjects.Text;
  levelText: Phaser.GameObjects.Text;
  buyBtn: Phaser.GameObjects.Rectangle;
  btnText: Phaser.GameObjects.Text;
}
