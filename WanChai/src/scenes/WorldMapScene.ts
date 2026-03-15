import Phaser from 'phaser';
import { BG_COLOR, NEON, NEON_CSS } from '../config/colors';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/game-config';
import { createButton } from '../ui/ButtonFactory';
import { SaveManager } from '../managers/SaveManager';
import { BALANCE } from '../config/balance';
import { enableDragScroll } from '../utils/DragScroll';
import { t } from '../lib/i18n';
import { getMaxClearedStage, getStageStatus, getNextPlayableStage } from '../core/StageProgression';
import { navigateScene } from '../utils/SceneNav';
const FIXED_FOOTER_H = 80; // reserved for fixed Back button at bottom

interface StageNode {
  id: number;
  nameKey: string;
  subtitleKey: string;
  type: 'wave' | 'boss';
  enemiesKey?: string;
  bossKey?: string;
  region: string;
}

interface RegionPoint {
  x: number;
  y: number;
  label: string;
}

const REGIONS: Record<string, RegionPoint> = {
  central: { x: 310, y: 195, label: 'Central' },
  tsimshatsui: { x: 310, y: 150, label: 'TST' },
  peak: { x: 240, y: 220, label: 'The Peak' },
};

const STAGES: StageNode[] = [
  {
    id: 1,
    nameKey: 'stage.central',
    subtitleKey: 'stage.wave_subtitle',
    type: 'wave',
    enemiesKey: 'stage.enemies_1',
    region: 'central',
  },
  {
    id: 2,
    nameKey: 'stage.guardian',
    subtitleKey: 'stage.boss_subtitle',
    type: 'boss',
    bossKey: 'stage.guardian',
    region: 'central',
  },
  {
    id: 3,
    nameKey: 'stage.tst',
    subtitleKey: 'stage.wave_subtitle',
    type: 'wave',
    enemiesKey: 'stage.enemies_3',
    region: 'tsimshatsui',
  },
  {
    id: 4,
    nameKey: 'stage.orbiter',
    subtitleKey: 'stage.boss_subtitle',
    type: 'boss',
    bossKey: 'stage.orbiter',
    region: 'tsimshatsui',
  },
  {
    id: 5,
    nameKey: 'stage.peak',
    subtitleKey: 'stage.wave_subtitle',
    type: 'wave',
    enemiesKey: 'stage.enemies_5',
    region: 'peak',
  },
  {
    id: 6,
    nameKey: 'stage.striker',
    subtitleKey: 'stage.final_boss',
    type: 'boss',
    bossKey: 'stage.striker',
    region: 'peak',
  },
];

const HK_ISLAND: number[][] = [
  [140, 200],
  [170, 185],
  [210, 190],
  [250, 185],
  [280, 195],
  [310, 190],
  [340, 185],
  [370, 190],
  [400, 195],
  [430, 200],
  [450, 210],
  [440, 230],
  [420, 245],
  [390, 250],
  [350, 248],
  [310, 255],
  [270, 250],
  [230, 245],
  [200, 238],
  [170, 225],
  [150, 215],
  [140, 200],
];

const KOWLOON: number[][] = [
  [220, 130],
  [250, 120],
  [280, 115],
  [310, 112],
  [340, 115],
  [370, 120],
  [400, 130],
  [410, 145],
  [400, 160],
  [380, 168],
  [350, 172],
  [310, 175],
  [270, 172],
  [240, 168],
  [220, 160],
  [215, 145],
  [220, 130],
];

const LANTAU: number[][] = [
  [40, 160],
  [70, 140],
  [110, 135],
  [140, 145],
  [150, 165],
  [140, 185],
  [110, 195],
  [80, 190],
  [50, 180],
  [40, 160],
];

export class WorldMapScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WorldMapScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(BG_COLOR);
    this.cameras.main.fadeIn(300);
    const cx = GAME_WIDTH / 2;

    // Title — fixed header (stays on screen when scrolling)
    this.add
      .text(cx, 40, t('worldmap.title'), {
        fontSize: '34px',
        color: NEON_CSS.UI_ACCENT,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    const meta = SaveManager.loadMeta();
    const maxCleared = getMaxClearedStage(meta.runsCompleted, BALANCE.STAGE.maxStages);

    // --- HONG KONG WIREFRAME MAP ---
    const mapOffsetX = 60;
    const mapOffsetY = 70;
    const g = this.add.graphics();

    this.drawPolygon(g, LANTAU, mapOffsetX, mapOffsetY, NEON.UI_BORDER, 0.3);
    this.drawPolygon(g, KOWLOON, mapOffsetX, mapOffsetY, NEON.UI_BORDER, 0.5);
    this.drawPolygon(g, HK_ISLAND, mapOffsetX, mapOffsetY, NEON.UI_BORDER, 0.5);

    // Victoria Harbour
    g.lineStyle(1, NEON.UI_ACCENT, 0.2);
    const harbourY = mapOffsetY + 180;
    for (let hx = mapOffsetX + 180; hx < mapOffsetX + 460; hx += 12) {
      g.moveTo(hx, harbourY);
      g.lineTo(hx + 6, harbourY);
    }
    g.strokePath();

    this.add
      .text(mapOffsetX + 470, harbourY, 'Victoria\nHarbour', {
        fontSize: '18px',
        color: NEON_CSS.UI_DIM,
        fontFamily: 'monospace',
        align: 'right',
      })
      .setOrigin(0, 0.5)
      .setAlpha(0.5);

    const currentStage = getNextPlayableStage(maxCleared, BALANCE.STAGE.maxStages);
    const currentRegion = currentStage <= STAGES.length ? STAGES[currentStage - 1]?.region : null;

    Object.entries(REGIONS).forEach(([key, region]) => {
      const rx = mapOffsetX + region.x;
      const ry = mapOffsetY + region.y;

      const regionStages = STAGES.filter((s) => s.region === key);
      const allCleared = regionStages.every((s) => s.id <= maxCleared);
      const isActive = key === currentRegion;

      const dotG = this.add.graphics();
      if (isActive) {
        dotG.fillStyle(NEON.UI_ACCENT, 0.3);
        dotG.fillCircle(rx, ry, 20);
        dotG.fillStyle(NEON.UI_ACCENT, 0.8);
        dotG.fillCircle(rx, ry, 6);
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
        .text(
          cx,
          listStartY,
          t('worldmap.runs_stats', { runs: meta.runsCompleted, level: meta.bestLevel, kills: meta.bestKills }),
          {
            fontSize: '18px',
            color: NEON_CSS.UI_DIM,
            fontFamily: 'monospace',
          },
        )
        .setOrigin(0.5);
    }

    // --- STAGE LIST ---
    const stageListY = listStartY + 30;

    this.add
      .text(cx, stageListY, t('worldmap.stage_count', { count: BALANCE.STAGE.maxStages }), {
        fontSize: '22px',
        color: NEON_CSS.UI_TEXT,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    let activePopup: Phaser.GameObjects.GameObject[] | null = null;

    const rowH = 64;
    const rowStartY = stageListY + 36;

    STAGES.forEach((stage, idx) => {
      const y = rowStartY + idx * rowH;
      const stageStatus = getStageStatus(idx, maxCleared);
      const cleared = stageStatus === 'cleared';
      const isBoss = stage.type === 'boss';
      const isCurrentStage = stageStatus === 'current';

      const rowBg = this.add
        .rectangle(cx, y, 660, rowH - 4, NEON.UI_PANEL, isCurrentStage ? 0.6 : 0.3)
        .setStrokeStyle(1, isCurrentStage ? NEON.UI_ACCENT : isBoss ? NEON.ENEMY_ELITE : NEON.UI_BORDER);

      const badgeColor = cleared ? NEON.UI_ACCENT : isBoss ? NEON.ENEMY_ELITE : NEON.UI_BORDER;
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

      const nameColor = cleared ? NEON_CSS.UI_ACCENT : isBoss ? NEON_CSS.GOLD : NEON_CSS.UI_TEXT;
      this.add
        .text(cx - 260, y - 10, t(stage.nameKey), {
          fontSize: '22px',
          color: nameColor,
          fontFamily: 'monospace',
          fontStyle: 'bold',
        })
        .setOrigin(0, 0.5);

      this.add
        .text(cx - 260, y + 12, t(stage.subtitleKey), {
          fontSize: '18px',
          color: NEON_CSS.UI_DIM,
          fontFamily: 'monospace',
        })
        .setOrigin(0, 0.5);

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

      rowBg.setInteractive({ useHandCursor: true });
      rowBg.on('pointerdown', () => {
        if (activePopup) {
          activePopup.forEach((obj) => obj.destroy());
          activePopup = null;
        }

        const popupY = y + rowH / 2 + 50;
        const popupW = 400;
        const popupH = 90;
        const items: Phaser.GameObjects.GameObject[] = [];

        items.push(
          this.add.rectangle(cx, popupY, popupW, popupH, NEON.UI_PANEL, 0.95).setStrokeStyle(2, NEON.UI_ACCENT),
        );

        if (stage.type === 'wave') {
          items.push(
            this.add.text(
              cx - popupW / 2 + 16,
              popupY - 16,
              t('worldmap.popup_enemies', { enemies: stage.enemiesKey ? t(stage.enemiesKey) : '' }),
              {
                fontSize: '18px',
                color: NEON_CSS.UI_TEXT,
                fontFamily: 'monospace',
              },
            ),
          );
          items.push(
            this.add.text(cx - popupW / 2 + 16, popupY + 8, t('worldmap.popup_wave'), {
              fontSize: '18px',
              color: NEON_CSS.UI_DIM,
              fontFamily: 'monospace',
            }),
          );
        } else {
          items.push(
            this.add.text(
              cx - popupW / 2 + 16,
              popupY - 16,
              t('worldmap.popup_boss', { boss: stage.bossKey ? t(stage.bossKey) : '' }),
              {
                fontSize: '18px',
                color: NEON_CSS.GOLD,
                fontFamily: 'monospace',
                fontStyle: 'bold',
              },
            ),
          );
          items.push(
            this.add.text(cx - popupW / 2 + 16, popupY + 8, t('worldmap.popup_boss_clear'), {
              fontSize: '18px',
              color: NEON_CSS.UI_DIM,
              fontFamily: 'monospace',
            }),
          );
        }

        activePopup = items;

        this.time.delayedCall(100, () => {
          const dismiss = () => {
            if (activePopup) {
              activePopup.forEach((obj) => obj.destroy());
              activePopup = null;
            }
            this.input.off('pointerdown', dismiss);
          };
          this.input.on('pointerdown', dismiss);
        });
      });
    });

    // Back button — FIXED at bottom of screen, OUTSIDE scroll area
    // scrollFactor(0) ensures it stays on screen regardless of camera position
    const backBtnScreenY = GAME_HEIGHT - FIXED_FOOTER_H / 2; // y=1240 on screen
    createButton(this, {
      x: cx,
      y: backBtnScreenY,
      width: 220,
      height: 52,
      label: t('codex.back'),
      fontSize: '26px',
      variant: 'secondary',
      onClick: () => navigateScene(this, 'WorldMapScene', 'MainMenuScene'),
    })
      .setScrollFactor(0)
      .setDepth(200);

    // Calculate total content height:
    // rowStartY = stageListY+36 ≈ 426, 6 stages * 64 = 384 → last row bottom ≈ 810
    const totalContentHeight = rowStartY + STAGES.length * rowH + 20;

    // Enable drag scroll only if content overflows the scrollable viewport
    const scrollableHeight = GAME_HEIGHT - FIXED_FOOTER_H; // 1200
    if (totalContentHeight > scrollableHeight) {
      enableDragScroll(this, totalContentHeight, scrollableHeight);
    }
  }

  private drawPolygon(
    g: Phaser.GameObjects.Graphics,
    points: number[][],
    ox: number,
    oy: number,
    color: number,
    alpha: number,
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
