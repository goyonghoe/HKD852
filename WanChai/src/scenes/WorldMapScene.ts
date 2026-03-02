import Phaser from 'phaser';
import { BG_COLOR, NEON, NEON_CSS } from '../config/colors';
import { GAME_WIDTH } from '../config/game-config';
import { createButton } from '../ui/ButtonFactory';
import { SaveManager } from '../managers/SaveManager';
import { BALANCE } from '../config/balance';
import { enableDragScroll } from '../utils/DragScroll';

interface StageNode {
  id: number;
  name: string;
  subtitle: string;
  type: 'wave' | 'boss';
  enemies?: string;
  boss?: string;
  region: string;        // region key for map highlight
}

// Map region → approximate center on the HK wireframe (relative to map origin)
interface RegionPoint {
  x: number;
  y: number;
  label: string;
}

const REGIONS: Record<string, RegionPoint> = {
  central:    { x: 310, y: 195, label: 'Central' },
  tsimshatsui:{ x: 310, y: 150, label: 'TST' },
  peak:       { x: 240, y: 220, label: 'The Peak' },
};

const STAGES: StageNode[] = [
  { id: 1, name: '중환 구역', subtitle: '60초 웨이브', type: 'wave', enemies: '기본형, 돌격형', region: 'central' },
  { id: 2, name: '수호자', subtitle: '보스전', type: 'boss', boss: '수호자', region: 'central' },
  { id: 3, name: '침사추이', subtitle: '60초 웨이브', type: 'wave', enemies: '중장갑, 특수형, 분열체', region: 'tsimshatsui' },
  { id: 4, name: '회전자', subtitle: '보스전', type: 'boss', boss: '회전자', region: 'tsimshatsui' },
  { id: 5, name: '빅토리아 피크', subtitle: '60초 웨이브', type: 'wave', enemies: '추적자, 전 유형', region: 'peak' },
  { id: 6, name: '돌격자', subtitle: '최종 보스', type: 'boss', boss: '돌격자', region: 'peak' },
];

// Simplified Hong Kong outline polygons (points relative to map area 0,0 at top-left)
// Scaled to fit ~600x280 area
const HK_ISLAND: number[][] = [
  [140, 200], [170, 185], [210, 190], [250, 185], [280, 195],
  [310, 190], [340, 185], [370, 190], [400, 195], [430, 200],
  [450, 210], [440, 230], [420, 245], [390, 250], [350, 248],
  [310, 255], [270, 250], [230, 245], [200, 238], [170, 225],
  [150, 215], [140, 200],
];

const KOWLOON: number[][] = [
  [220, 130], [250, 120], [280, 115], [310, 112], [340, 115],
  [370, 120], [400, 130], [410, 145], [400, 160], [380, 168],
  [350, 172], [310, 175], [270, 172], [240, 168], [220, 160],
  [215, 145], [220, 130],
];

const LANTAU: number[][] = [
  [40, 160], [70, 140], [110, 135], [140, 145], [150, 165],
  [140, 185], [110, 195], [80, 190], [50, 180], [40, 160],
];

export class WorldMapScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WorldMapScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(BG_COLOR);
    this.cameras.main.fadeIn(300);
    const cx = GAME_WIDTH / 2;

    // Title
    this.add
      .text(cx, 40, '구역 맵', {
        fontSize: '34px',
        color: NEON_CSS.UI_ACCENT,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const meta = SaveManager.loadMeta();
    const maxCleared = meta.runsCompleted > 0 ? 6 : 0;

    // --- HONG KONG WIREFRAME MAP ---
    const mapOffsetX = 60;
    const mapOffsetY = 70;
    const g = this.add.graphics();

    // Draw Lantau Island (dimmer, background)
    this.drawPolygon(g, LANTAU, mapOffsetX, mapOffsetY, NEON.UI_BORDER, 0.3);

    // Draw Kowloon peninsula
    this.drawPolygon(g, KOWLOON, mapOffsetX, mapOffsetY, NEON.UI_BORDER, 0.5);

    // Draw Hong Kong Island
    this.drawPolygon(g, HK_ISLAND, mapOffsetX, mapOffsetY, NEON.UI_BORDER, 0.5);

    // Victoria Harbour (dashed line between HK Island and Kowloon)
    g.lineStyle(1, NEON.UI_ACCENT, 0.2);
    const harbourY = mapOffsetY + 180;
    for (let hx = mapOffsetX + 180; hx < mapOffsetX + 460; hx += 12) {
      g.moveTo(hx, harbourY);
      g.lineTo(hx + 6, harbourY);
    }
    g.strokePath();

    // Harbour label
    this.add
      .text(mapOffsetX + 470, harbourY, 'Victoria\nHarbour', {
        fontSize: '18px',
        color: NEON_CSS.UI_DIM,
        fontFamily: 'monospace',
        align: 'right',
      })
      .setOrigin(0, 0.5)
      .setAlpha(0.5);

    // Draw region highlights
    // Active regions are stages that haven't been cleared yet (first uncleared pair)
    const currentStage = maxCleared + 1;
    const currentRegion = currentStage <= 6
      ? STAGES[currentStage - 1]?.region
      : null;

    Object.entries(REGIONS).forEach(([key, region]) => {
      const rx = mapOffsetX + region.x;
      const ry = mapOffsetY + region.y;

      // Determine region state
      const regionStages = STAGES.filter(s => s.region === key);
      const allCleared = regionStages.every(s => s.id <= maxCleared);
      const isActive = key === currentRegion;

      // Region dot
      const dotG = this.add.graphics();
      if (isActive) {
        // Pulsing highlight for current region
        dotG.fillStyle(NEON.UI_ACCENT, 0.3);
        dotG.fillCircle(rx, ry, 20);
        dotG.fillStyle(NEON.UI_ACCENT, 0.8);
        dotG.fillCircle(rx, ry, 6);

        // Pulse animation
        this.tweens.add({
          targets: dotG,
          alpha: { from: 1, to: 0.4 },
          duration: 800,
          yoyo: true,
          repeat: -1,
        });
      } else if (allCleared) {
        dotG.fillStyle(NEON.UI_ACCENT, 0.6);
        dotG.fillCircle(rx, ry, 5);
      } else {
        dotG.fillStyle(NEON.UI_BORDER, 0.4);
        dotG.fillCircle(rx, ry, 4);
      }

      // Region label
      this.add
        .text(rx, ry - 16, region.label, {
          fontSize: '18px',
          color: isActive ? NEON_CSS.UI_ACCENT : NEON_CSS.UI_DIM,
          fontFamily: 'monospace',
          fontStyle: isActive ? 'bold' : 'normal',
        })
        .setOrigin(0.5, 1)
        .setAlpha(isActive ? 1 : 0.6);
    });

    // Run stats (below map)
    const listStartY = mapOffsetY + 290;
    if (meta.runsCompleted > 0) {
      this.add
        .text(cx, listStartY, `완료 ${meta.runsCompleted}회 · 최고 Lv ${meta.bestLevel} · 최다 ${meta.bestKills}킬`, {
          fontSize: '18px',
          color: NEON_CSS.UI_DIM,
          fontFamily: 'monospace',
        })
        .setOrigin(0.5);
    }

    // --- STAGE LIST ---
    const stageListY = listStartY + 30;

    this.add
      .text(cx, stageListY, `${BALANCE.STAGE.maxStages}개 스테이지`, {
        fontSize: '22px',
        color: NEON_CSS.UI_TEXT,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Info popup elements
    let activePopup: Phaser.GameObjects.GameObject[] | null = null;

    const rowH = 64;
    const rowStartY = stageListY + 36;

    STAGES.forEach((stage, idx) => {
      const y = rowStartY + idx * rowH;
      const cleared = stage.id <= maxCleared;
      const isBoss = stage.type === 'boss';
      const isCurrentStage = stage.id === currentStage;

      // Row background
      const rowBg = this.add
        .rectangle(cx, y, 660, rowH - 4, NEON.UI_PANEL, isCurrentStage ? 0.6 : 0.3)
        .setStrokeStyle(1, isCurrentStage ? NEON.UI_ACCENT : (isBoss ? NEON.ENEMY_ELITE : NEON.UI_BORDER));

      // Stage number badge
      const badgeColor = cleared ? NEON.UI_ACCENT : (isBoss ? NEON.ENEMY_ELITE : NEON.UI_BORDER);
      const badgeG = this.add.graphics();
      const badgeX = cx - 300;
      badgeG.fillStyle(badgeColor, cleared ? 0.5 : 0.2);
      badgeG.fillCircle(badgeX, y, 18);
      badgeG.lineStyle(2, badgeColor, 0.8);
      badgeG.strokeCircle(badgeX, y, 18);

      this.add
        .text(badgeX, y, `${stage.id}`, {
          fontSize: '22px',
          color: cleared ? NEON_CSS.UI_TEXT : NEON_CSS.UI_DIM,
          fontFamily: 'monospace',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      // Stage name
      const nameColor = cleared ? NEON_CSS.UI_ACCENT : (isBoss ? NEON_CSS.GOLD : NEON_CSS.UI_TEXT);
      this.add
        .text(cx - 260, y - 10, stage.name, {
          fontSize: '22px',
          color: nameColor,
          fontFamily: 'monospace',
          fontStyle: 'bold',
        })
        .setOrigin(0, 0.5);

      // Subtitle
      this.add
        .text(cx - 260, y + 12, stage.subtitle, {
          fontSize: '18px',
          color: NEON_CSS.UI_DIM,
          fontFamily: 'monospace',
        })
        .setOrigin(0, 0.5);

      // Type badge (right side)
      const typeLabel = isBoss ? 'BOSS' : 'WAVE';
      const typeColor = isBoss ? NEON_CSS.GOLD : NEON_CSS.UI_DIM;
      this.add
        .text(cx + 300, y - 8, typeLabel, {
          fontSize: '18px',
          color: typeColor,
          fontFamily: 'monospace',
          fontStyle: 'bold',
        })
        .setOrigin(1, 0.5);

      // Clear status
      if (cleared) {
        this.add
          .text(cx + 300, y + 10, 'CLEAR', {
            fontSize: '18px',
            color: NEON_CSS.UI_ACCENT,
            fontFamily: 'monospace',
          })
          .setOrigin(1, 0.5);
      } else if (isCurrentStage) {
        this.add
          .text(cx + 300, y + 10, 'NEXT', {
            fontSize: '18px',
            color: NEON_CSS.UI_ACCENT,
            fontFamily: 'monospace',
            fontStyle: 'bold',
          })
          .setOrigin(1, 0.5);
      }

      // Tap for info
      rowBg.setInteractive({ useHandCursor: true });
      rowBg.on('pointerdown', () => {
        if (activePopup) {
          activePopup.forEach(obj => obj.destroy());
          activePopup = null;
        }

        const popupY = y + rowH / 2 + 50;
        const popupW = 400;
        const popupH = 90;
        const items: Phaser.GameObjects.GameObject[] = [];

        items.push(
          this.add
            .rectangle(cx, popupY, popupW, popupH, NEON.UI_PANEL, 0.95)
            .setStrokeStyle(2, NEON.UI_ACCENT),
        );

        if (stage.type === 'wave') {
          items.push(
            this.add.text(cx - popupW / 2 + 16, popupY - 16, `출현: ${stage.enemies ?? ''}`, {
              fontSize: '18px', color: NEON_CSS.UI_TEXT, fontFamily: 'monospace',
            }),
          );
          items.push(
            this.add.text(cx - popupW / 2 + 16, popupY + 8, '60초 방어전', {
              fontSize: '18px', color: NEON_CSS.UI_DIM, fontFamily: 'monospace',
            }),
          );
        } else {
          items.push(
            this.add.text(cx - popupW / 2 + 16, popupY - 16, `보스: ${stage.boss ?? ''}`, {
              fontSize: '18px', color: NEON_CSS.GOLD, fontFamily: 'monospace', fontStyle: 'bold',
            }),
          );
          items.push(
            this.add.text(cx - popupW / 2 + 16, popupY + 8, '보스 처치 시 클리어', {
              fontSize: '18px', color: NEON_CSS.UI_DIM, fontFamily: 'monospace',
            }),
          );
        }

        activePopup = items;

        this.time.delayedCall(100, () => {
          const dismiss = () => {
            if (activePopup) {
              activePopup.forEach(obj => obj.destroy());
              activePopup = null;
            }
            this.input.off('pointerdown', dismiss);
          };
          this.input.on('pointerdown', dismiss);
        });
      });
    });

    // Back button
    const btnY = rowStartY + STAGES.length * rowH + 24;
    createButton(this, {
      x: cx, y: btnY, width: 220, height: 52,
      label: '돌아가기', fontSize: '26px',
      variant: 'secondary',
      onClick: () => this.scene.start('MainMenuScene'),
    });

    // Enable scroll if content overflows
    const totalHeight = btnY + 50;
    if (totalHeight > 1280) {
      enableDragScroll(this, totalHeight);
    }
  }

  /** Draw a wireframe polygon with offset */
  private drawPolygon(
    g: Phaser.GameObjects.Graphics,
    points: number[][],
    ox: number, oy: number,
    color: number, alpha: number,
  ): void {
    if (points.length < 2) return;
    g.lineStyle(1.5, color, alpha);
    g.beginPath();
    g.moveTo(ox + points[0][0], oy + points[0][1]);
    for (let i = 1; i < points.length; i++) {
      g.lineTo(ox + points[i][0], oy + points[i][1]);
    }
    g.closePath();
    g.strokePath();

    // Subtle fill
    g.fillStyle(color, alpha * 0.08);
    g.beginPath();
    g.moveTo(ox + points[0][0], oy + points[0][1]);
    for (let i = 1; i < points.length; i++) {
      g.lineTo(ox + points[i][0], oy + points[i][1]);
    }
    g.closePath();
    g.fillPath();
  }

}
