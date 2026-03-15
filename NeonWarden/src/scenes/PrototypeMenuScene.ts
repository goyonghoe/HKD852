import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/constants";

interface ProtoCard {
  key: string;
  title: string;
  score: string;
  desc: string;
  color: number;
  icon: string; // single char
}

const PROTOTYPES: ProtoCard[] = [
  {
    key: "TendrilScene",
    title: "TENDRIL",
    score: "8.8",
    desc: "Draw roots to connect organisms.\nDefend against corruption.",
    color: 0x00ffaa,
    icon: "T",
  },
  {
    key: "PulseScene",
    title: "PULSE",
    score: "8.4",
    desc: "Tap to emit energy pulses.\nKeep organisms alive with rhythm.",
    color: 0x00ccff,
    icon: "P",
  },
  {
    key: "SplitScene",
    title: "SPLIT",
    score: "8.0",
    desc: "Swipe to split cells.\nFill the petri dish before time runs.",
    color: 0xff4466,
    icon: "S",
  },
  {
    key: "ConductorScene",
    title: "CONDUCTOR",
    score: "7.9",
    desc: "Draw energy paths in the city.\nRoute power to buildings.",
    color: 0xffcc00,
    icon: "C",
  },
  {
    key: "BloomScene",
    title: "BLOOM",
    score: "7.8",
    desc: "Plant seeds, grow flowers.\nDefend your garden from blight.",
    color: 0xff69b4,
    icon: "B",
  },
];

const CARD_W = 620;
const CARD_H = 160;
const CARD_GAP = 18;
const START_Y = 280;

export class PrototypeMenuScene extends Phaser.Scene {
  private cards: Phaser.GameObjects.Container[] = [];
  private titlePulse = 0;

  constructor() {
    super({ key: "PrototypeMenuScene" });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x08081a);
    this.cards = [];
    this.titlePulse = 0;

    // Background grid
    const gridGfx = this.add.graphics().setDepth(0);
    gridGfx.lineStyle(1, 0x111133, 0.3);
    for (let x = 0; x < GAME_WIDTH; x += 40) {
      gridGfx.lineBetween(x, 0, x, GAME_HEIGHT);
    }
    for (let y = 0; y < GAME_HEIGHT; y += 40) {
      gridGfx.lineBetween(0, y, GAME_WIDTH, y);
    }

    // Title
    this.add
      .text(GAME_WIDTH / 2, 80, "NEON WARDEN", {
        fontSize: "42px",
        fontFamily: "monospace",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 130, "PROTOTYPE LAB", {
        fontSize: "18px",
        fontFamily: "monospace",
        color: "#888899",
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 170, "Select a concept to play", {
        fontSize: "14px",
        fontFamily: "monospace",
        color: "#555577",
      })
      .setOrigin(0.5);

    // Separator line
    const sepGfx = this.add.graphics().setDepth(1);
    sepGfx.lineStyle(1, 0x333366, 0.5);
    sepGfx.lineBetween(50, 210, GAME_WIDTH - 50, 210);

    // Create cards
    PROTOTYPES.forEach((proto, i) => {
      const y = START_Y + i * (CARD_H + CARD_GAP);
      const card = this.createCard(proto, y, i);
      this.cards.push(card);
    });

    // Footer
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 50, "Each prototype: 60 seconds", {
        fontSize: "12px",
        fontFamily: "monospace",
        color: "#444466",
      })
      .setOrigin(0.5);

    this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT - 30,
        "All procedural graphics \u2022 Phaser 3 \u2022 720\u00d71280",
        {
          fontSize: "10px",
          fontFamily: "monospace",
          color: "#333355",
        },
      )
      .setOrigin(0.5);
  }

  private createCard(
    proto: ProtoCard,
    y: number,
    _index: number,
  ): Phaser.GameObjects.Container {
    const cx = GAME_WIDTH / 2;
    const container = this.add.container(cx, y).setDepth(10);

    // Card background
    const bg = this.add.graphics();
    bg.fillStyle(0x111133, 0.8);
    bg.fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 12);
    bg.lineStyle(2, proto.color, 0.4);
    bg.strokeRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 12);
    container.add(bg);

    // Icon circle
    const iconGfx = this.add.graphics();
    iconGfx.fillStyle(proto.color, 0.15);
    iconGfx.fillCircle(-CARD_W / 2 + 55, 0, 30);
    iconGfx.lineStyle(2, proto.color, 0.6);
    iconGfx.strokeCircle(-CARD_W / 2 + 55, 0, 30);
    container.add(iconGfx);

    const iconText = this.add
      .text(-CARD_W / 2 + 55, 0, proto.icon, {
        fontSize: "24px",
        fontFamily: "monospace",
        color: "#" + proto.color.toString(16).padStart(6, "0"),
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    container.add(iconText);

    // Title
    const title = this.add
      .text(-CARD_W / 2 + 100, -CARD_H / 2 + 20, proto.title, {
        fontSize: "22px",
        fontFamily: "monospace",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0, 0);
    container.add(title);

    // Score badge
    const scoreText = this.add
      .text(CARD_W / 2 - 20, -CARD_H / 2 + 20, proto.score, {
        fontSize: "20px",
        fontFamily: "monospace",
        color: "#" + proto.color.toString(16).padStart(6, "0"),
        fontStyle: "bold",
      })
      .setOrigin(1, 0);
    container.add(scoreText);

    // Score bar
    const barGfx = this.add.graphics();
    const barW = 80;
    const barH = 6;
    const barX = CARD_W / 2 - 20 - barW;
    const barY = -CARD_H / 2 + 46;
    barGfx.fillStyle(0x222244, 0.5);
    barGfx.fillRoundedRect(barX, barY, barW, barH, 3);
    barGfx.fillStyle(proto.color, 0.7);
    barGfx.fillRoundedRect(
      barX,
      barY,
      barW * (parseFloat(proto.score) / 10),
      barH,
      3,
    );
    container.add(barGfx);

    // Description
    const desc = this.add
      .text(-CARD_W / 2 + 100, -CARD_H / 2 + 52, proto.desc, {
        fontSize: "12px",
        fontFamily: "monospace",
        color: "#8888aa",
        lineSpacing: 4,
      })
      .setOrigin(0, 0);
    container.add(desc);

    // "PLAY" label
    const playLabel = this.add
      .text(CARD_W / 2 - 20, CARD_H / 2 - 20, "PLAY \u25b6", {
        fontSize: "14px",
        fontFamily: "monospace",
        color: "#" + proto.color.toString(16).padStart(6, "0"),
        fontStyle: "bold",
      })
      .setOrigin(1, 1);
    container.add(playLabel);

    // Interactive zone over entire card
    const zone = this.add
      .zone(0, 0, CARD_W, CARD_H)
      .setInteractive({ useHandCursor: true });
    zone.on("pointerover", () => {
      bg.clear();
      bg.fillStyle(0x1a1a44, 0.9);
      bg.fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 12);
      bg.lineStyle(2, proto.color, 0.8);
      bg.strokeRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 12);
    });
    zone.on("pointerout", () => {
      bg.clear();
      bg.fillStyle(0x111133, 0.8);
      bg.fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 12);
      bg.lineStyle(2, proto.color, 0.4);
      bg.strokeRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 12);
    });
    zone.on("pointerdown", () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(300, () => {
        this.scene.start(proto.key);
      });
    });
    container.add(zone);

    return container;
  }

  update(): void {
    this.titlePulse += 0.02;
    // Subtle card idle animation handled by hover already
  }
}
