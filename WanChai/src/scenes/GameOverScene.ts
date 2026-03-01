import Phaser from 'phaser';
import { BG_COLOR, NEON, NEON_CSS } from '../config/colors';
import { BALANCE } from '../config/balance';
import { GAME_WIDTH } from '../config/game-config';
import { SaveManager } from '../managers/SaveManager';

interface GameOverData {
  survived: boolean;
  kills: number;
  gold: number;
  level: number;
  timeMs: number;
  baseHpRemaining?: number;
  stage?: number;
  maxStages?: number;
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data: GameOverData): void {
    this.cameras.main.setBackgroundColor(BG_COLOR);
    const cx = GAME_WIDTH / 2;

    const title = data.survived ? '구역 정화 완료!' : '최적화 완료...';
    const titleColor = data.survived ? NEON_CSS.UI_ACCENT : NEON_CSS.HEALTH;

    this.add
      .text(cx, 180, title, {
        fontSize: '52px',
        color: titleColor,
        fontFamily: 'monospace',
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5);

    const secs = Math.floor(data.timeMs / 1000);
    const min = Math.floor(secs / 60);
    const sec = secs % 60;
    const timeStr = `${min}:${sec.toString().padStart(2, '0')}`;

    const baseHp = data.baseHpRemaining ?? 0;
    const baseHpPct = Math.round((baseHp / BALANCE.BASE.hp) * 100);

    const stage = data.stage ?? 1;
    const maxStages = data.maxStages ?? BALANCE.STAGE.maxStages;

    const stats = [
      `구역: ${stage} / ${maxStages}`,
      `시간: ${timeStr}`,
      `레벨: ${data.level}`,
      `정화: ${data.kills}`,
      `데이터: ${data.gold}`,
      data.survived
        ? `저항력: ${Math.round(baseHp)} (${baseHpPct}%)`
        : `저항력: 0 (ARIA 장악)`,
    ];

    stats.forEach((line, i) => {
      this.add
        .text(cx, 360 + i * 55, line, {
          fontSize: '26px',
          color: NEON_CSS.UI_TEXT,
          fontFamily: 'monospace',
        })
        .setOrigin(0.5);
    });

    // Check and save records
    const meta = SaveManager.loadMeta();
    let isNewRecord = false;
    if (data.kills > (meta.bestKills ?? 0)) {
      meta.bestKills = data.kills;
      isNewRecord = true;
    }
    if (data.level > (meta.bestLevel ?? 0)) {
      meta.bestLevel = data.level;
      isNewRecord = true;
    }
    if (data.timeMs > (meta.bestTimeMs ?? 0)) {
      meta.bestTimeMs = data.timeMs;
      isNewRecord = true;
    }
    if (isNewRecord) {
      SaveManager.saveMeta(meta);
      this.add
        .text(cx, 700, '신기록!', {
          fontSize: '32px',
          color: NEON_CSS.GOLD,
          fontFamily: 'monospace',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
    }

    // Upgrade button (primary)
    const btnUpgBg = this.add
      .rectangle(cx, 790, 260, 60, NEON.UI_PANEL)
      .setStrokeStyle(2, NEON.GOLD);
    this.add
      .text(cx, 790, `강화 (${data.gold})`, {
        fontSize: '24px', color: NEON_CSS.GOLD,
        fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5);
    btnUpgBg.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('MetaScene', { goldEarned: data.gold }));

    // Retry button
    const btn1Bg = this.add
      .rectangle(cx, 880, 220, 60, NEON.UI_PANEL)
      .setStrokeStyle(2, NEON.UI_ACCENT);
    this.add
      .text(cx, 880, '재도전', {
        fontSize: '24px', color: NEON_CSS.UI_ACCENT,
        fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5);
    btn1Bg.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('RunScene'));

    // Menu button
    const btn2Bg = this.add
      .rectangle(cx, 970, 220, 60, NEON.UI_PANEL)
      .setStrokeStyle(2, NEON.UI_BORDER);
    this.add
      .text(cx, 970, '메인 메뉴', {
        fontSize: '22px', color: NEON_CSS.UI_DIM,
        fontFamily: 'monospace',
      }).setOrigin(0.5);
    btn2Bg.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('MainMenuScene'));
  }
}
