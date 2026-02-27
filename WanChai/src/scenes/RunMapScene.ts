import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/game-config';
import { BG_COLOR, RETRO, UI_COLORS, ELEMENT_COLORS } from '../config/colors';
import { VISUAL } from '../config/balance';
import { ROGUELIKE } from '../config/roguelike-balance';
import { CRITTER_DEFINITIONS } from '../data/critters/definitions';
import { CritterManager } from '../core/CritterManager';
import { RunManager } from '../core/RunManager';
import { SaveManager } from '../managers/SaveManager';
import { createRetroPanel } from '../ui/GlassPanel';
import type { RunState, MapNode, FloorMap } from '../types/run';

interface RunMapData {
  runState: RunState;
}

const NODE_RADIUS = 30;

const NODE_ICONS: Record<string, string> = {
  battle: '\u2694',  // ⚔
  elite: '\u2620',   // ☠
  shop: '\u25CE',    // ◎ (coin-like)
  rest: '\u2302',    // ⌂
  boss: '\u265A',    // ♚
  event: '\u2605',   // ★
};

const NODE_COLORS: Record<string, number> = {
  battle: 0x5090f8,
  elite: 0xe94560,
  shop: 0xf0d050,
  rest: 0x50c878,
  boss: 0xf06060,
  event: 0x9060d8,
};

export class RunMapScene extends Phaser.Scene {
  private runState!: RunState;
  private nodeObjects: Map<string, Phaser.GameObjects.Container> = new Map();
  private infoPanel!: Phaser.GameObjects.Container;
  private infoPanelText!: Phaser.GameObjects.Text;
  private infoPanelSubText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'RunMapScene' });
  }

  init(data: RunMapData): void {
    this.runState = data.runState;
    this.nodeObjects = new Map();
  }

  create(): void {
    const cx = GAME_WIDTH / 2;

    // Background
    this.cameras.main.setBackgroundColor(BG_COLOR);
    this.add.rectangle(cx, 4, GAME_WIDTH, 4, UI_COLORS.accent).setDepth(10);
    this.add.rectangle(cx, GAME_HEIGHT - 4, GAME_WIDTH, 4, UI_COLORS.accent, 0.3).setDepth(10);
    this.createAmbientParticles();

    // HUD bar (y 40-100)
    this.buildHUD(cx);

    // Map visualization (y 120-900)
    this.buildMap(cx);

    // Party preview (y 920-1000)
    this.buildPartyPreview(cx);

    // Current node info panel (y 1050-1120)
    this.buildInfoPanel(cx);

    // Auto-save on every map entry
    SaveManager.saveRun(this.runState);

    this.cameras.main.fadeIn(VISUAL.ANIM.SCENE_FADE, 0, 0, 0);
  }

  private buildHUD(cx: number): void {
    createRetroPanel(this, {
      x: cx,
      y: 68,
      width: GAME_WIDTH - 20,
      height: 80,
      depth: 10,
    });

    // Floor indicator
    this.add
      .text(cx - 240, 68, `FLOOR  ${this.runState.currentFloor}`, {
        fontSize: '22px',
        color: '#e2e8f0',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5)
      .setDepth(20);

    // Purification Score
    this.add
      .text(cx, 55, 'PURIFICATION', {
        fontSize: '12px',
        color: '#718096',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5)
      .setDepth(20);

    this.add
      .text(cx, 78, `${this.runState.purificationScore.toLocaleString()}`, {
        fontSize: '22px',
        color: '#50c878',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(20);

    // Relic count
    const relicCount = this.runState.relics.length;
    const maxRelics = this.runState.maxRelics;
    this.add
      .text(cx + 180, 68, `\u25C6 ${relicCount}/${maxRelics}`, {
        fontSize: '18px',
        color: '#f0d050',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5)
      .setDepth(20);
  }

  private buildMap(_cx: number): void {
    const state = this.runState;
    const currentFloorMap = state.floorMaps.find((fm) => fm.floorNumber === state.currentFloor);
    if (!currentFloorMap) return;

    const MAP_TOP = 160;
    const MAP_BOTTOM = 860;
    const layers = currentFloorMap.layers;

    // Pre-compute (x, y) for every node so connections can reference them
    const nodePositions = new Map<string, { x: number; y: number }>();

    const layerSpacing = layers <= 1 ? 0 : (MAP_BOTTOM - MAP_TOP) / (layers - 1);

    for (let layer = 0; layer < layers; layer++) {
      const nodesInLayer = currentFloorMap.nodes.filter((n) => n.layer === layer);
      const nodeSpacing = GAME_WIDTH / (nodesInLayer.length + 1);

      nodesInLayer.forEach((node, idx) => {
        const x = nodeSpacing * (idx + 1);
        // Layer 0 is at the BOTTOM (start), last layer is at the TOP (converge/rest/shop)
        const y = MAP_BOTTOM - layer * layerSpacing;
        nodePositions.set(node.id, { x, y });
      });
    }

    // Draw connection lines first (behind nodes)
    this.drawConnections(currentFloorMap, nodePositions);

    // Draw nodes
    currentFloorMap.nodes.forEach((node) => {
      const pos = nodePositions.get(node.id);
      if (!pos) return;
      const nodeContainer = this.buildMapNode(node, pos.x, pos.y, state);
      this.nodeObjects.set(node.id, nodeContainer);
    });
  }

  private drawConnections(
    floorMap: FloorMap,
    nodePositions: Map<string, { x: number; y: number }>
  ): void {
    const graphics = this.add.graphics().setDepth(15);

    for (const node of floorMap.nodes) {
      const posA = nodePositions.get(node.id);
      if (!posA) continue;

      for (const connId of node.connections) {
        const connNode = floorMap.nodes.find((n) => n.id === connId);
        if (!connNode) continue;

        const posB = nodePositions.get(connId);
        if (!posB) continue;

        // Determine line style based on path state
        const isVisitedPath = node.visited;
        const isAvailablePath = this.isNodeAvailable(connNode);

        let lineColor: number;
        let lineAlpha: number;
        let lineWidth: number;

        if (isVisitedPath) {
          lineColor = ELEMENT_COLORS.earth; // green — already walked
          lineAlpha = 0.8;
          lineWidth = 2;
        } else if (isAvailablePath) {
          lineColor = 0xffffff; // bright white — accessible next step
          lineAlpha = 0.6;
          lineWidth = 2;
        } else {
          lineColor = RETRO.borderColor; // dim gray — locked future path
          lineAlpha = 0.3;
          lineWidth = 1;
        }

        graphics.lineStyle(lineWidth, lineColor, lineAlpha);
        graphics.lineBetween(posA.x, posA.y, posB.x, posB.y);
      }
    }
  }

  private buildMapNode(
    node: MapNode,
    x: number,
    y: number,
    state: RunState
  ): Phaser.GameObjects.Container {
    const isVisited = node.visited;
    const isCurrent = node.id === state.currentNodeId;
    const isAvailable = this.isNodeAvailable(node);

    const nodeColor = NODE_COLORS[node.type] ?? 0x5090f8;
    const icon = NODE_ICONS[node.type] ?? '?';

    const g = this.add.graphics();

    if (isCurrent) {
      // Current node — bright glow
      g.fillStyle(nodeColor, 0.3);
      g.fillCircle(0, 0, NODE_RADIUS + 8);
      g.fillStyle(nodeColor, 1.0);
      g.fillCircle(0, 0, NODE_RADIUS);
      g.lineStyle(3, 0xffffff, 0.8);
      g.strokeCircle(0, 0, NODE_RADIUS);
    } else if (isAvailable) {
      // Available — normal bright
      g.fillStyle(nodeColor, 0.8);
      g.fillCircle(0, 0, NODE_RADIUS);
      g.lineStyle(2, nodeColor, 1.0);
      g.strokeCircle(0, 0, NODE_RADIUS);
    } else if (isVisited) {
      // Visited — dimmed
      g.fillStyle(RETRO.panelBgDark, 1.0);
      g.fillCircle(0, 0, NODE_RADIUS);
      g.lineStyle(2, nodeColor, 0.4);
      g.strokeCircle(0, 0, NODE_RADIUS);
    } else {
      // Locked future node
      g.fillStyle(RETRO.panelBgDark, 0.7);
      g.fillCircle(0, 0, NODE_RADIUS);
      g.lineStyle(1, RETRO.borderColor, 0.4);
      g.strokeCircle(0, 0, NODE_RADIUS);
    }

    const iconAlpha = isVisited && !isCurrent ? 0.3 : isAvailable || isCurrent ? 1.0 : 0.4;
    const iconText = this.add
      .text(0, 0, icon, {
        fontSize: '22px',
        color: isCurrent || isAvailable ? '#ffffff' : '#718096',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5)
      .setAlpha(iconAlpha);

    // Node type label below
    const labelText = this.add
      .text(0, NODE_RADIUS + 14, node.type.toUpperCase(), {
        fontSize: '10px',
        color: isCurrent || isAvailable ? '#a0aec0' : '#4a5568',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);

    const children: Phaser.GameObjects.GameObject[] = [g, iconText, labelText];
    const container = this.add.container(x, y, children).setDepth(20);

    // Glowing pulse for available nodes
    if (isAvailable && !isCurrent) {
      this.tweens.add({
        targets: g,
        alpha: { from: 1, to: 0.6 },
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    if (isCurrent) {
      this.tweens.add({
        targets: g,
        scaleX: { from: 1.0, to: 1.1 },
        scaleY: { from: 1.0, to: 1.1 },
        alpha: { from: 1, to: 0.8 },
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // Tap handler for available nodes
    if (isAvailable) {
      const hitZone = this.add
        .zone(0, 0, (NODE_RADIUS + 10) * 2, (NODE_RADIUS + 10) * 2)
        .setInteractive({ useHandCursor: true });

      hitZone.on('pointerdown', () => {
        this.onNodeTapped(node);
      });

      container.add(hitZone);
    }

    return container;
  }

  private isNodeAvailable(node: MapNode): boolean {
    const state = this.runState;
    const currentFloorMap = state.floorMaps.find((fm) => fm.floorNumber === state.currentFloor);
    if (!currentFloorMap) return false;

    if (node.visited) return false;

    if (state.currentNodeId === null) {
      return node.layer === 0;
    }

    const currentNode = currentFloorMap.nodes.find((n) => n.id === state.currentNodeId);
    if (!currentNode) return false;
    return currentNode.connections.includes(node.id);
  }

  private onNodeTapped(node: MapNode): void {
    const success = RunManager.selectNode(this.runState, node.id);
    if (!success) return;

    const type = node.type;

    if (type === 'battle' || type === 'elite' || type === 'boss') {
      const battleData = RunManager.beginBattle(this.runState);
      if (!battleData) return;

      const transitionToPuzzle = () => {
        this.cameras.main.fadeOut(VISUAL.ANIM.SCENE_FADE, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('PuzzleScene', {
            levelId: battleData.levelData.id,
            runState: this.runState,
            levelData: battleData.levelData,
            heroQueue: battleData.heroQueue,
            blightMap: battleData.blightMap,
            combatMode: true,
          });
        });
      };

      if (type === 'boss') {
        this.showBossIntro(transitionToPuzzle);
      } else {
        transitionToPuzzle();
      }
    } else if (type === 'shop') {
      this.runState.phase = 'shop';
      this.cameras.main.fadeOut(VISUAL.ANIM.SCENE_FADE, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('ShopScene', { runState: this.runState });
      });
    } else if (type === 'rest') {
      this.runState.phase = 'rest';
      this.cameras.main.fadeOut(VISUAL.ANIM.SCENE_FADE, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('RestScene', { runState: this.runState });
      });
    } else if (type === 'event') {
      this.runState.phase = 'event';
      this.cameras.main.fadeOut(VISUAL.ANIM.SCENE_FADE, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('EventScene', { runState: this.runState });
      });
    } else {
      // Fallback for unknown types: restart map
      this.scene.restart({ runState: this.runState });
    }
  }

  private showPlaceholderMessage(title: string, subtitle: string, onDone: () => void): void {
    const cx = GAME_WIDTH / 2;
    const overlay = this.add.rectangle(cx, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7)
      .setDepth(200)
      .setInteractive();

    const panel = createRetroPanel(this, {
      x: cx,
      y: GAME_HEIGHT / 2,
      width: 460,
      height: 200,
      depth: 210,
    });

    this.add
      .text(cx, GAME_HEIGHT / 2 - 40, title.toUpperCase(), {
        fontSize: '28px',
        color: '#f0d050',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(220);

    this.add
      .text(cx, GAME_HEIGHT / 2 + 10, subtitle, {
        fontSize: '18px',
        color: '#718096',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5)
      .setDepth(220);

    const okText = this.add
      .text(cx, GAME_HEIGHT / 2 + 60, 'TAP TO CONTINUE', {
        fontSize: '16px',
        color: '#5090f8',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5)
      .setDepth(220)
      .setInteractive({ useHandCursor: true });

    okText.on('pointerdown', () => {
      overlay.destroy();
      panel.destroy();
      okText.destroy();
      onDone();
    });
  }

  private buildPartyPreview(cx: number): void {
    const partyY = 958;
    const max = ROGUELIKE.RUN.MAX_PARTY_SIZE;
    const iconSize = 44;
    const iconGap = 6;
    const totalW = max * iconSize + (max - 1) * iconGap;
    const startX = cx - totalW / 2 + iconSize / 2;

    // Label
    this.add
      .text(cx, partyY - 28, 'YOUR PARTY', {
        fontSize: '12px',
        color: '#4a5568',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5)
      .setDepth(18);

    // Background panel
    createRetroPanel(this, {
      x: cx,
      y: partyY + 2,
      width: totalW + 20,
      height: iconSize + 20,
      depth: 17,
      variant: 'dark',
    });

    this.runState.party.forEach((pc, i) => {
      const x = startX + i * (iconSize + iconGap);
      const def = CRITTER_DEFINITIONS[pc.definitionId];
      if (!def) return;

      const elemColor = ELEMENT_COLORS[def.element];
      const apPercent = pc.maxAP > 0 ? pc.currentAP / pc.maxAP : 0;

      // Icon background
      const g = this.add.graphics().setDepth(20);
      g.fillStyle(elemColor, pc.isExhausted ? 0.15 : 0.4);
      g.fillRoundedRect(x - iconSize / 2, partyY - iconSize / 2, iconSize, iconSize, 6);
      g.lineStyle(2, elemColor, pc.isExhausted ? 0.3 : 0.8);
      g.strokeRoundedRect(x - iconSize / 2, partyY - iconSize / 2, iconSize, iconSize, 6);

      // Critter abbrev
      const abbrev = def.nameEn.substring(0, 2).toUpperCase();
      this.add
        .text(x, partyY - 6, abbrev, {
          fontSize: '13px',
          color: pc.isExhausted ? '#4a5568' : '#e2e8f0',
          fontFamily: 'monospace',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setDepth(21);

      // AP bar (small, at bottom of icon)
      const barW = iconSize - 6;
      const barH = 4;
      const barX = x - barW / 2;
      const barY = partyY + iconSize / 2 - barH - 2;
      const barFillW = Math.max(0, barW * apPercent);

      this.add.rectangle(x, barY + barH / 2, barW, barH, RETRO.panelBgDark).setDepth(21);
      if (barFillW > 0) {
        this.add.rectangle(barX + barFillW / 2, barY + barH / 2, barFillW, barH, elemColor).setDepth(22);
      }
    });
  }

  private buildInfoPanel(cx: number): void {
    createRetroPanel(this, {
      x: cx,
      y: 1085,
      width: GAME_WIDTH - 20,
      height: 100,
      depth: 15,
    });

    const state = this.runState;
    const currentFloorMap = state.floorMaps.find((fm) => fm.floorNumber === state.currentFloor);

    let titleStr = 'SELECT A NODE';
    let descStr = 'Tap an available node to proceed';

    if (state.currentNodeId && currentFloorMap) {
      const node = currentFloorMap.nodes.find((n) => n.id === state.currentNodeId);
      if (node) {
        titleStr = node.type.toUpperCase();
        const descs: Record<string, string> = {
          battle: 'Face an enemy encounter',
          elite: 'A powerful elite enemy awaits',
          shop: 'Buy items and upgrades',
          rest: 'Rest to recover AP',
          boss: 'The boss of this floor!',
          event: 'A random event',
        };
        descStr = descs[node.type] ?? '';
      }
    }

    this.add
      .text(cx, 1068, titleStr, {
        fontSize: '20px',
        color: '#e2e8f0',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(25);

    this.add
      .text(cx, 1096, descStr, {
        fontSize: '14px',
        color: '#718096',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5)
      .setDepth(25);

    // Stage progress
    const totalNodes = currentFloorMap?.nodes.length ?? 0;
    const visitedNodes = currentFloorMap?.nodes.filter((n) => n.visited).length ?? 0;
    this.add
      .text(cx, 1120, `Stage ${visitedNodes} / ${totalNodes} complete`, {
        fontSize: '12px',
        color: '#4a5568',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5)
      .setDepth(25);
  }

  private showBossIntro(onComplete: () => void): void {
    const overlay = this.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2,
      GAME_WIDTH, GAME_HEIGHT, 0x000000, 0
    ).setDepth(900);

    this.tweens.add({
      targets: overlay,
      fillAlpha: 0.6,
      duration: 300,
      onComplete: () => {
        const bossText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'BOSS BATTLE', {
          fontSize: '42px',
          color: '#e83820',
          fontFamily: 'monospace',
          fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(910).setScale(0);

        this.tweens.add({
          targets: bossText,
          scaleX: { from: 0, to: 1.2 },
          scaleY: { from: 0, to: 1.2 },
          duration: 300,
          ease: 'Back.easeOut',
          onComplete: () => {
            this.tweens.add({
              targets: bossText,
              scaleX: 1.0,
              scaleY: 1.0,
              duration: 200,
              onComplete: () => {
                this.time.delayedCall(500, () => {
                  bossText.destroy();
                  overlay.destroy();
                  onComplete();
                });
              },
            });
          },
        });
      },
    });
  }

  private createAmbientParticles(): void {
    const colors = [0xf06060, 0x5090f8, 0x50c878, 0xf0d050, 0x9060d8];
    for (let i = 0; i < 8; i++) {
      const x = Phaser.Math.Between(40, GAME_WIDTH - 40);
      const y = Phaser.Math.Between(200, GAME_HEIGHT - 200);
      const color = colors[i % colors.length];
      const size = Phaser.Math.Between(2, 5);
      const dot = this.add
        .rectangle(x, y, size, size, color, 0.15)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(1);
      this.tweens.add({
        targets: dot,
        y: y - Phaser.Math.Between(60, 150),
        alpha: { from: 0.15, to: 0 },
        duration: Phaser.Math.Between(5000, 9000),
        delay: Phaser.Math.Between(0, 3000),
        repeat: -1,
        onRepeat: () => {
          dot.setPosition(
            Phaser.Math.Between(40, GAME_WIDTH - 40),
            Phaser.Math.Between(GAME_HEIGHT * 0.3, GAME_HEIGHT - 200)
          );
          dot.setAlpha(0.15);
        },
      });
    }
  }
}
