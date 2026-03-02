import Phaser from 'phaser';
import { BG_COLOR, NEON_CSS } from '../config/colors';
import { BALANCE } from '../config/balance';
import { GAME_WIDTH } from '../config/game-config';
import { SaveManager } from '../managers/SaveManager';
import { createButton } from '../ui/ButtonFactory';
import { getRetroAudio } from '../audio/RetroAudio';

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
    this.cameras.main.fadeIn(300);
    getRetroAudio().switchTrack('menu');
    const cx = GAME_WIDTH / 2;

    const title = data.survived ? '구역 정화 완료!' : '최적화 완료...';
    const titleColor = data.survived ? NEON_CSS.UI_ACCENT : NEON_CSS.HEALTH;

    this.add
      .text(cx, 180, title, {
        fontSize: '60px',
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
          fontSize: '30px',
          color: NEON_CSS.UI_TEXT,
          fontFamily: 'monospace',
        })
        .setOrigin(0.5);
    });

    // Save gold + records immediately (prevents loss on force-quit)
    const meta = SaveManager.loadMeta();
    meta.totalGold += data.gold;
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
    SaveManager.saveMeta(meta);
    if (isNewRecord) {
      this.add
        .text(cx, 700, '신기록!', {
          fontSize: '38px',
          color: NEON_CSS.GOLD,
          fontFamily: 'monospace',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
    }

    // Upgrade button (primary) — bottom 1/3 zone
    createButton(this, {
      x: cx, y: 880, width: 280, height: 60,
      label: `강화 (${data.gold})`, fontSize: '28px',
      variant: 'primary',
      onClick: () => this.scene.start('MetaScene', { goldEarned: data.gold }),
    });

    // Retry button — save gold before retry
    createButton(this, {
      x: cx, y: 960, width: 240, height: 56,
      label: '재도전', fontSize: '26px',
      variant: 'secondary',
      onClick: () => {
        this.scene.start('RunScene');
      },
    });

    // Menu button — save gold before returning
    createButton(this, {
      x: cx, y: 1050, width: 240, height: 56,
      label: '메인 메뉴', fontSize: '26px',
      variant: 'secondary',
      onClick: () => {
        const m = SaveManager.loadMeta();
        m.runsCompleted = (m.runsCompleted ?? 0) + 1;
        SaveManager.saveMeta(m);
        this.scene.start('MainMenuScene');
      },
    });
  }
}
