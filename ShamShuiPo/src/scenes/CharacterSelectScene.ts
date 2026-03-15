// ── Neon Survivors: Character Select Scene ──
// Shown after Main Menu. Player picks one of three heroes before starting a run.

import Phaser from "phaser";
import { SCENE_KEYS } from "../types/game";
import { GAME_WIDTH, GAME_HEIGHT, WEAPONS } from "../config/balance";
import { COLORS, COLOR_STR } from "../config/colors";
import { CHARACTERS, type CharacterDef } from "../config/characters";

/** Data passed to GameScene when starting a run. */
export interface CharacterSelectData {
  characterId: string;
}

// ── Layout ─────────────────────────────────────────────────────────────────
const CARD_W = 660;
const CARD_H = 240;
const CARD_GAP = 24;
// Cards start after title region
const FIRST_CARD_Y = 360;

export class CharacterSelectScene extends Phaser.Scene {
  private selectedIndex = 0;
  private cardBorders: Phaser.GameObjects.Rectangle[] = [];
  private cardSprites: (Phaser.GameObjects.Sprite | null)[] = [];

  constructor() {
    super({ key: SCENE_KEYS.CHARACTER_SELECT });
  }

  create(): void {
    this.selectedIndex = 0;
    this.cardBorders = [];
    this.cardSprites = [];

    this.createBackground();
    this.createTitle();
    this.createCards();
    this.createStartButton();
  }

  // ── Background ─────────────────────────────────────────────────────────

  private createBackground(): void {
    const bgKey = "bg_layer1";
    if (this.textures.exists(bgKey)) {
      const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, bgKey);
      const scaleX = GAME_WIDTH / bg.width;
      const scaleY = GAME_HEIGHT / bg.height;
      bg.setScale(Math.max(scaleX, scaleY));
    }

    // Dark overlay
    this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.72,
    );
  }

  // ── Title ──────────────────────────────────────────────────────────────

  private createTitle(): void {
    const cx = GAME_WIDTH / 2;

    this.add
      .text(cx, 90, "SELECT YOUR HERO", {
        fontFamily: "monospace",
        fontSize: "52px",
        color: COLOR_STR.NEON_CYAN,
        stroke: "#000000",
        strokeThickness: 6,
        shadow: {
          offsetX: 0,
          offsetY: 0,
          color: COLOR_STR.NEON_CYAN,
          blur: 18,
          fill: true,
        },
      })
      .setOrigin(0.5);

    // Decorative divider
    this.add
      .text(cx, 150, "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: COLOR_STR.NEON_PINK,
      })
      .setOrigin(0.5)
      .setAlpha(0.7);
  }

  // ── Character Cards ────────────────────────────────────────────────────

  private createCards(): void {
    CHARACTERS.forEach((char, index) => {
      const cardY = FIRST_CARD_Y + index * (CARD_H + CARD_GAP);
      this.createCard(char, index, cardY);
    });

    // Highlight the default selection
    this.highlightCard(0);
  }

  private createCard(char: CharacterDef, index: number, cardY: number): void {
    const cx = GAME_WIDTH / 2;

    // ── Card background ──
    const cardBg = this.add
      .rectangle(cx, cardY, CARD_W, CARD_H, COLORS.BG_PANEL, 0.92)
      .setStrokeStyle(2, COLORS.UI_BORDER, 1)
      .setInteractive({ useHandCursor: true });

    // ── Neon border (highlighted when selected) ──
    const border = this.add
      .rectangle(cx, cardY, CARD_W + 4, CARD_H + 4)
      .setStrokeStyle(3, COLORS.NEON_CYAN, 0)
      .setFillStyle(0x000000, 0);

    this.cardBorders.push(border);

    // ── Sprite preview (left side) ──
    const spriteKey = `${char.spritePrefix}_idle`;
    let sprite: Phaser.GameObjects.Sprite | null = null;
    const spriteX = cx - CARD_W / 2 + 80;

    if (this.textures.exists(spriteKey)) {
      sprite = this.add
        .sprite(spriteX, cardY, spriteKey)
        .setScale(3.5)
        .setDepth(5);

      const animKey = `cs_${char.id}_idle`;
      if (!this.anims.exists(animKey)) {
        const frames = this.anims.generateFrameNumbers(spriteKey, {
          start: 0,
          end: 3,
        });
        if (frames.length > 0) {
          this.anims.create({
            key: animKey,
            frames,
            frameRate: 6,
            repeat: -1,
          });
        }
      }
      if (this.anims.exists(animKey)) {
        sprite.play(animKey);
      }
    } else {
      // Placeholder silhouette if sprite not loaded
      this.add.rectangle(spriteX, cardY, 56, 80, COLORS.UI_PANEL, 1);
    }

    this.cardSprites.push(sprite);

    // ── Character name ──
    const textX = cx - CARD_W / 2 + 170;
    this.add
      .text(textX, cardY - 70, char.name, {
        fontFamily: "monospace",
        fontSize: "36px",
        color: COLOR_STR.NEON_CYAN,
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0, 0.5);

    // ── Passive bonus description ──
    this.add
      .text(textX, cardY - 20, char.description, {
        fontFamily: "monospace",
        fontSize: "24px",
        color: COLOR_STR.NEON_GREEN,
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0, 0.5);

    // ── Starting weapon name ──
    const weaponName =
      WEAPONS[char.startingWeapon as keyof typeof WEAPONS]?.name ??
      char.startingWeapon;

    this.add
      .text(textX, cardY + 30, `STARTS WITH:`, {
        fontFamily: "monospace",
        fontSize: "18px",
        color: COLOR_STR.TEXT_GRAY,
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0, 0.5);

    this.add
      .text(textX, cardY + 70, weaponName.toUpperCase(), {
        fontFamily: "monospace",
        fontSize: "26px",
        color: COLOR_STR.NEON_YELLOW,
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0, 0.5);

    // ── Selection indicator (right side) ──
    const indicatorX = cx + CARD_W / 2 - 50;
    this.add
      .text(indicatorX, cardY, `${index + 1}`, {
        fontFamily: "monospace",
        fontSize: "48px",
        color: COLOR_STR.TEXT_DIM,
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    // ── Interactivity ──
    cardBg.on("pointerdown", () => {
      this.selectCard(index);
    });

    cardBg.on("pointerover", () => {
      if (this.selectedIndex !== index) {
        cardBg.setFillStyle(COLORS.UI_PANEL_HOVER, 0.95);
      }
    });

    cardBg.on("pointerout", () => {
      cardBg.setFillStyle(COLORS.BG_PANEL, 0.92);
    });
  }

  private selectCard(index: number): void {
    this.selectedIndex = index;
    this.highlightCard(index);
  }

  private highlightCard(selectedIndex: number): void {
    this.cardBorders.forEach((border, i) => {
      if (i === selectedIndex) {
        border.setStrokeStyle(3, COLORS.NEON_CYAN, 1);
        // Pulse tween on the selected card border
        this.tweens.killTweensOf(border);
        this.tweens.add({
          targets: border,
          alpha: { from: 1, to: 0.4 },
          duration: 700,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
      } else {
        this.tweens.killTweensOf(border);
        border.setStrokeStyle(3, COLORS.UI_BORDER, 0);
        border.setAlpha(1);
      }
    });
  }

  // ── START Button ───────────────────────────────────────────────────────

  private createStartButton(): void {
    const cx = GAME_WIDTH / 2;
    const btnY = GAME_HEIGHT - 100;

    const btnBg = this.add
      .rectangle(cx, btnY, 480, 90, COLORS.BG_DARK, 1)
      .setStrokeStyle(3, COLORS.NEON_GREEN, 1)
      .setInteractive({ useHandCursor: true });

    const btnText = this.add
      .text(cx, btnY, "START", {
        fontFamily: "monospace",
        fontSize: "42px",
        color: COLOR_STR.NEON_GREEN,
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    // Pulse animation on button text
    this.tweens.add({
      targets: btnText,
      alpha: { from: 1, to: 0.4 },
      duration: 800,
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

    btnBg.on("pointerdown", () => {
      this.startRun();
    });
  }

  // ── Transition ─────────────────────────────────────────────────────────

  private startRun(): void {
    this.tweens.killAll();

    const character = CHARACTERS[this.selectedIndex];
    const data: CharacterSelectData = {
      characterId: character.id,
    };

    this.scene.start(SCENE_KEYS.GAME, data);
  }
}
