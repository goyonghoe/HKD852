import Phaser from "phaser";
import { GateManager, GateArrival } from "../core/GateManager";
import { ROLE_COLORS } from "../config/creatures";
import { GAME_WIDTH } from "../config/constants";

const GATE_Y = 860;
const GATE_HEIGHT = 420;
const CARD_WIDTH = 200;
const CARD_HEIGHT = 280;
const CARD_GAP = 12;

export class GateUI {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private bg: Phaser.GameObjects.Graphics;
  private gateLabel: Phaser.GameObjects.Text;
  private waitLabel: Phaser.GameObjects.Text;
  private cardContainers: Phaser.GameObjects.Container[] = [];
  private onAdmit: (index: number) => void;
  private onReject: (index: number) => void;
  private lastArrivalsKey: string = "";

  constructor(
    scene: Phaser.Scene,
    onAdmit: (index: number) => void,
    onReject: (index: number) => void,
  ) {
    this.scene = scene;
    this.onAdmit = onAdmit;
    this.onReject = onReject;

    this.container = scene.add.container(0, 0).setDepth(90);

    // Gate area background
    this.bg = scene.add.graphics();
    this.bg.fillStyle(0x2a2a4e, 0.95);
    this.bg.fillRect(0, GATE_Y, GAME_WIDTH, GATE_HEIGHT);
    this.bg.lineStyle(2, 0x4444aa, 0.6);
    this.bg.lineBetween(0, GATE_Y, GAME_WIDTH, GATE_Y);
    this.container.add(this.bg);

    // Gate label
    this.gateLabel = scene.add
      .text(GAME_WIDTH / 2, GATE_Y + 10, "GATE", {
        fontSize: "16px",
        fontFamily: "monospace",
        color: "#8888ff",
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0);
    this.container.add(this.gateLabel);

    // Waiting label
    this.waitLabel = scene.add
      .text(
        GAME_WIDTH / 2,
        GATE_Y + GATE_HEIGHT / 2,
        "Waiting for arrivals...",
        {
          fontSize: "14px",
          fontFamily: "monospace",
          color: "#666699",
        },
      )
      .setOrigin(0.5);
    this.container.add(this.waitLabel);
  }

  public update(gateManager: GateManager): void {
    // Build a key from current state to detect changes
    const key = this.buildStateKey(gateManager);
    if (key === this.lastArrivalsKey) return; // No change — skip rebuild
    this.lastArrivalsKey = key;

    // Clear old cards
    for (const c of this.cardContainers) {
      c.destroy();
    }
    this.cardContainers = [];

    if (!gateManager.isGateOpen || gateManager.currentArrivals.length === 0) {
      this.waitLabel.setVisible(true);
      this.gateLabel.setText("GATE");
      return;
    }

    this.waitLabel.setVisible(false);
    const undecided = gateManager.currentArrivals.filter(
      (a) => !a.decided,
    ).length;
    this.gateLabel.setText(`GATE - ${undecided} awaiting`);

    const arrivals = gateManager.currentArrivals;
    const totalWidth =
      arrivals.length * CARD_WIDTH + (arrivals.length - 1) * CARD_GAP;
    const startX = (GAME_WIDTH - totalWidth) / 2 + CARD_WIDTH / 2;

    arrivals.forEach((arrival, index) => {
      const cardX = startX + index * (CARD_WIDTH + CARD_GAP);
      const cardY = GATE_Y + 40 + CARD_HEIGHT / 2;
      const card = this.createCard(arrival, index, cardX, cardY);
      this.cardContainers.push(card);
    });
  }

  private buildStateKey(gateManager: GateManager): string {
    if (!gateManager.isGateOpen || gateManager.currentArrivals.length === 0) {
      return "closed";
    }
    return gateManager.currentArrivals
      .map((a) => `${a.def.id}:${a.decided}:${a.admitted}`)
      .join("|");
  }

  private createCard(
    arrival: GateArrival,
    index: number,
    x: number,
    y: number,
  ): Phaser.GameObjects.Container {
    const card = this.scene.add.container(x, y).setDepth(91);
    const def = arrival.def;
    const color = ROLE_COLORS[def.role];
    const decided = arrival.decided;

    // Card background
    const bg = this.scene.add.graphics();
    bg.fillStyle(decided ? 0x333355 : 0x1a1a3e, 0.95);
    bg.fillRoundedRect(
      -CARD_WIDTH / 2,
      -CARD_HEIGHT / 2,
      CARD_WIDTH,
      CARD_HEIGHT,
      8,
    );
    bg.lineStyle(2, decided ? 0x555577 : color, 0.7);
    bg.strokeRoundedRect(
      -CARD_WIDTH / 2,
      -CARD_HEIGHT / 2,
      CARD_WIDTH,
      CARD_HEIGHT,
      8,
    );
    card.add(bg);

    if (decided) {
      const statusText = arrival.admitted ? "ADMITTED" : "REJECTED";
      const statusColor = arrival.admitted ? "#00ff88" : "#ff4444";
      const st = this.scene.add
        .text(0, 0, statusText, {
          fontSize: "16px",
          fontFamily: "monospace",
          color: statusColor,
          fontStyle: "bold",
        })
        .setOrigin(0.5);
      card.add(st);
      return card;
    }

    // Role circle
    const circle = this.scene.add.graphics();
    circle.fillStyle(color, 0.8);
    circle.fillCircle(0, -CARD_HEIGHT / 2 + 40, 18);
    circle.lineStyle(2, color, 1);
    circle.strokeCircle(0, -CARD_HEIGHT / 2 + 40, 18);
    card.add(circle);

    const roleChar =
      def.role === "Producer" ? "P" : def.role === "Predator" ? "D" : "S";
    const roleLetter = this.scene.add
      .text(0, -CARD_HEIGHT / 2 + 40, roleChar, {
        fontSize: "16px",
        fontFamily: "monospace",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    card.add(roleLetter);

    // Name
    const name = this.scene.add
      .text(0, -CARD_HEIGHT / 2 + 68, def.name, {
        fontSize: "12px",
        fontFamily: "monospace",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    card.add(name);

    // Role tag
    const roleTag = this.scene.add
      .text(0, -CARD_HEIGHT / 2 + 84, def.role.toUpperCase(), {
        fontSize: "10px",
        fontFamily: "monospace",
        color: "#" + color.toString(16).padStart(6, "0"),
      })
      .setOrigin(0.5);
    card.add(roleTag);

    // Stats
    const statsY = -CARD_HEIGHT / 2 + 104;
    const statsLines = [
      `POP: ${def.pop}  CP: ${def.cp}`,
      `FR: ${def.fr}  OR: ${def.or}`,
      `RR: ${def.rr || "--"}  RES: ${def.res}`,
    ];
    statsLines.forEach((line, i) => {
      const st = this.scene.add
        .text(0, statsY + i * 16, line, {
          fontSize: "10px",
          fontFamily: "monospace",
          color: "#aaaacc",
        })
        .setOrigin(0.5);
      card.add(st);
    });

    // Trait
    const traitY = statsY + 56;
    const traitName = this.scene.add
      .text(0, traitY, def.trait, {
        fontSize: "11px",
        fontFamily: "monospace",
        color: "#ffcc00",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    card.add(traitName);

    const traitDesc = this.scene.add
      .text(0, traitY + 16, def.traitDesc, {
        fontSize: "9px",
        fontFamily: "monospace",
        color: "#999999",
        wordWrap: { width: CARD_WIDTH - 20 },
        align: "center",
      })
      .setOrigin(0.5, 0);
    card.add(traitDesc);

    // Buttons
    const btnY = CARD_HEIGHT / 2 - 30;
    const btnW = 75;
    const btnH = 30;

    // ADMIT button
    const admitBg = this.scene.add.graphics();
    admitBg.fillStyle(0x005533, 0.9);
    admitBg.fillRoundedRect(
      -CARD_WIDTH / 2 + 8,
      btnY - btnH / 2,
      btnW,
      btnH,
      4,
    );
    admitBg.lineStyle(1, 0x00ff88, 0.8);
    admitBg.strokeRoundedRect(
      -CARD_WIDTH / 2 + 8,
      btnY - btnH / 2,
      btnW,
      btnH,
      4,
    );
    card.add(admitBg);

    const admitText = this.scene.add
      .text(-CARD_WIDTH / 2 + 8 + btnW / 2, btnY, "ADMIT", {
        fontSize: "12px",
        fontFamily: "monospace",
        color: "#00ff88",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    card.add(admitText);

    const admitZone = this.scene.add
      .zone(-CARD_WIDTH / 2 + 8 + btnW / 2, btnY, btnW, btnH)
      .setInteractive({ useHandCursor: true });
    admitZone.on("pointerdown", () => this.onAdmit(index));
    card.add(admitZone);

    // REJECT button
    const rejectBg = this.scene.add.graphics();
    rejectBg.fillStyle(0x550022, 0.9);
    rejectBg.fillRoundedRect(
      CARD_WIDTH / 2 - btnW - 8,
      btnY - btnH / 2,
      btnW,
      btnH,
      4,
    );
    rejectBg.lineStyle(1, 0xff4444, 0.8);
    rejectBg.strokeRoundedRect(
      CARD_WIDTH / 2 - btnW - 8,
      btnY - btnH / 2,
      btnW,
      btnH,
      4,
    );
    card.add(rejectBg);

    const rejectText = this.scene.add
      .text(CARD_WIDTH / 2 - btnW / 2 - 8, btnY, "REJECT", {
        fontSize: "12px",
        fontFamily: "monospace",
        color: "#ff4444",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    card.add(rejectText);

    const rejectZone = this.scene.add
      .zone(CARD_WIDTH / 2 - btnW / 2 - 8, btnY, btnW, btnH)
      .setInteractive({ useHandCursor: true });
    rejectZone.on("pointerdown", () => this.onReject(index));
    card.add(rejectZone);

    return card;
  }
}
