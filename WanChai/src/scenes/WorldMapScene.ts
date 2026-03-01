import Phaser from 'phaser';
import { BG_COLOR, NEON, NEON_CSS } from '../config/colors';
import { GAME_WIDTH } from '../config/game-config';
import { SaveManager } from '../managers/SaveManager';
import { BALANCE } from '../config/balance';

interface StageNode {
  id: number;
  name: string;
  subtitle: string;
  y: number;
}

const STAGES: StageNode[] = [
  { id: 1, name: '중환 구역', subtitle: '기본 적 출현', y: 350 },
  { id: 2, name: '침사추이', subtitle: '강화 적 + 보스', y: 600 },
  { id: 3, name: '빅토리아 피크', subtitle: '최종 방어전', y: 850 },
];

export class WorldMapScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WorldMapScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(BG_COLOR);
    const cx = GAME_WIDTH / 2;

    // Title
    this.add
      .text(cx, 50, '구역 맵', {
        fontSize: '32px',
        color: NEON_CSS.UI_ACCENT,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Subtitle
    this.add
      .text(cx, 95, `${BALANCE.STAGE.maxStages}개 구역 · 각 60초 방어`, {
        fontSize: '16px',
        color: NEON_CSS.UI_DIM,
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);

    // Determine max cleared stage from save data
    const meta = SaveManager.loadMeta();
    // runsCompleted > 0 means at least one full clear (all 3 stages)
    const maxCleared = meta.runsCompleted > 0 ? 3 : 0;

    // Draw connecting lines first
    const g = this.add.graphics();
    for (let i = 0; i < STAGES.length - 1; i++) {
      const from = STAGES[i];
      const to = STAGES[i + 1];
      const lineColor = (i + 1) <= maxCleared ? NEON.UI_ACCENT : NEON.UI_BORDER;
      g.lineStyle(2, lineColor, 0.5);

      // Dashed line effect
      const segments = 12;
      const dy = (to.y - from.y) / segments;
      for (let s = 0; s < segments; s += 2) {
        g.moveTo(cx, from.y + s * dy);
        g.lineTo(cx, from.y + (s + 1) * dy);
      }
      g.strokePath();
    }

    // Draw stage nodes
    STAGES.forEach((stage) => {
      const cleared = stage.id <= maxCleared;
      const nodeColor = cleared ? NEON.UI_ACCENT : NEON.UI_BORDER;
      const textColor = cleared ? NEON_CSS.UI_ACCENT : NEON_CSS.UI_DIM;
      const numColor = cleared ? NEON_CSS.UI_TEXT : NEON_CSS.UI_DIM;
      const r = 40;

      // Node circle
      const nodeG = this.add.graphics();
      nodeG.lineStyle(3, nodeColor, 1);
      nodeG.strokeCircle(cx, stage.y, r);

      // Inner glow for cleared
      if (cleared) {
        nodeG.fillStyle(nodeColor, 0.15);
        nodeG.fillCircle(cx, stage.y, r);
      }

      // Stage number
      this.add
        .text(cx, stage.y, `${stage.id}`, {
          fontSize: '28px',
          color: numColor,
          fontFamily: 'monospace',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      // Stage name (right of node)
      this.add
        .text(cx + r + 20, stage.y - 12, stage.name, {
          fontSize: '20px',
          color: textColor,
          fontFamily: 'monospace',
          fontStyle: 'bold',
        });

      // Subtitle (right of node, below name)
      this.add
        .text(cx + r + 20, stage.y + 14, stage.subtitle, {
          fontSize: '14px',
          color: NEON_CSS.UI_DIM,
          fontFamily: 'monospace',
        });

      // Status badge (left of node)
      if (cleared) {
        this.add
          .text(cx - r - 20, stage.y, 'CLEAR', {
            fontSize: '14px',
            color: NEON_CSS.UI_ACCENT,
            fontFamily: 'monospace',
            fontStyle: 'bold',
          })
          .setOrigin(1, 0.5);
      }
    });

    // Run stats summary
    if (meta.runsCompleted > 0) {
      this.add
        .text(cx, 170, `완료 ${meta.runsCompleted}회 · 최고 레벨 ${meta.bestLevel} · 최다 처치 ${meta.bestKills}`, {
          fontSize: '16px',
          color: NEON_CSS.UI_DIM,
          fontFamily: 'monospace',
        })
        .setOrigin(0.5);
    }

    // Back button
    const btnY = 1050;
    const btnBg = this.add
      .rectangle(cx, btnY, 200, 48, NEON.UI_PANEL)
      .setStrokeStyle(2, NEON.UI_BORDER);

    this.add
      .text(cx, btnY, '돌아가기', {
        fontSize: '22px',
        color: NEON_CSS.UI_TEXT,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    btnBg
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => btnBg.setStrokeStyle(3, NEON.UI_ACCENT))
      .on('pointerout', () => btnBg.setStrokeStyle(2, NEON.UI_BORDER))
      .on('pointerdown', () => this.scene.start('MainMenuScene'));
  }
}
