import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/game-config';
import { UI_COLORS, RETRO } from '../config/colors';
import { VISUAL } from '../config/balance';
import { EventBus } from '../managers/EventBus';
import { GameEvents } from '../types/events';
import { createGlassPanel } from '../ui/GlassPanel';
import { ScoreCounter } from '../ui/ScoreCounter';
import { PauseOverlay } from '../ui/PauseOverlay';
import { getRetroAudio } from '../audio/RetroAudio';
import { SaveManager } from '../managers/SaveManager';


export class PuzzleUIScene extends Phaser.Scene {
  private scoreCounter!: ScoreCounter;
  private comboText!: Phaser.GameObjects.Text;
  private cubeCountText!: Phaser.GameObjects.Text;
  private totalCubes = 0;
  private destroyedCubes = 0;
  private levelName = '';

  // Combat mode
  private combatMode = false;
  private playerMaxHp = 100;
  private playerHpFill: Phaser.GameObjects.Rectangle | null = null;
  private playerHpText: Phaser.GameObjects.Text | null = null;

  // Sound toggle
  private soundIcon!: Phaser.GameObjects.Text;
  private bgmMuted = true;

  // Pause overlay
  private pauseOverlay: PauseOverlay | null = null;
  private isPaused = false;

  constructor() {
    super({ key: 'PuzzleUIScene' });
  }

  init(data: {
    levelId: string;
    levelName: string;
    totalCubes: number;
    combatMode?: boolean;
    playerMaxHp?: number;
    totalEnemies?: number;
  }): void {
    this.totalCubes = data.totalCubes;
    this.destroyedCubes = 0;
    this.levelName = data.levelName;
    this.combatMode = data.combatMode ?? false;
    this.playerMaxHp = data.playerMaxHp ?? 100;
    this.pauseOverlay = null;
    this.isPaused = false;
    this.playerHpFill = null;
    this.playerHpText = null;
  }

  create(): void {
    const eventBus = EventBus.getInstance();
    const safeTop = VISUAL.UI.SAFE_AREA_TOP;
    const barH = VISUAL.UI.TOP_BAR_HEIGHT;

    // Load saved BGM state
    const bgmSettings = SaveManager.getBgmSettings();
    this.bgmMuted = bgmSettings.muted;

    // Retro panel HUD top bar
    createGlassPanel(this, {
      x: GAME_WIDTH / 2,
      y: safeTop + barH / 2,
      width: GAME_WIDTH - 20,
      height: barH,
      depth: 590,
    });

    // Pause button — inside top bar, left edge
    const pauseSize = 48;
    const zoneSize = 56;
    const pauseX = 34;
    const pauseY = safeTop + barH / 2;

    const pauseGfx = this.add.graphics().setDepth(600);
    pauseGfx.fillStyle(0x2d3748);
    pauseGfx.fillRoundedRect(pauseX - pauseSize / 2, pauseY - pauseSize / 2, pauseSize, pauseSize, 6);
    pauseGfx.lineStyle(2, 0x4a5568, 1.0);
    pauseGfx.strokeRoundedRect(pauseX - pauseSize / 2, pauseY - pauseSize / 2, pauseSize, pauseSize, 6);

    this.add
      .text(pauseX, pauseY, '||', {
        fontSize: '20px',
        color: '#718096',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(601);

    const pauseZone = this.add
      .zone(pauseX, pauseY, zoneSize, zoneSize)
      .setInteractive({ useHandCursor: true })
      .setDepth(610);

    pauseZone.on('pointerdown', () => this.showPauseMenu());

    // Sound toggle — next to pause
    const soundX = 86;
    const soundY = pauseY;
    const soundGfx = this.add.graphics().setDepth(600);
    soundGfx.fillStyle(0x2d3748);
    soundGfx.fillRoundedRect(soundX - pauseSize / 2, soundY - pauseSize / 2, pauseSize, pauseSize, 6);
    soundGfx.lineStyle(2, 0x4a5568, 1.0);
    soundGfx.strokeRoundedRect(soundX - pauseSize / 2, soundY - pauseSize / 2, pauseSize, pauseSize, 6);

    this.soundIcon = this.add
      .text(soundX, soundY, this.bgmMuted ? 'OFF' : 'ON', {
        fontSize: '14px',
        color: this.bgmMuted ? '#4a5568' : '#48bb78',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(601);

    const soundZone = this.add
      .zone(soundX, soundY, zoneSize, zoneSize)
      .setInteractive({ useHandCursor: true })
      .setDepth(610);

    soundZone.on('pointerdown', () => this.toggleBgm());

    // Left side: Level name (shifted right for pause+sound buttons)
    this.add
      .text(100, safeTop + 20, this.levelName, {
        fontSize: '18px',
        color: '#e2e8f0',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5)
      .setDepth(600);

    // Left side: Sling combo (below level name)
    this.comboText = this.add
      .text(100, safeTop + 52, '', {
        fontSize: '22px',
        color: '#f39c12',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5)
      .setDepth(600);

    // Center: Cube count / Enemy info
    this.cubeCountText = this.add
      .text(GAME_WIDTH / 2, safeTop + 22,
        this.combatMode ? `HP ${this.playerMaxHp}/${this.playerMaxHp}` : `${this.totalCubes} cubes`,
        {
          fontSize: '16px',
          color: this.combatMode ? '#48bb78' : '#718096',
          fontFamily: 'monospace',
        })
      .setOrigin(0.5)
      .setDepth(600);

    if (this.combatMode) {
      this.playerHpText = this.cubeCountText;
    }

    // Center: Progress bar (classic) / HP bar (combat)
    const barW = 240;
    const barHeight = 12;
    const barX = GAME_WIDTH / 2 - barW / 2;
    const barY = safeTop + 48;

    const barBg = this.add.graphics().setDepth(600);
    barBg.fillStyle(RETRO.panelBgDark, 1.0);
    barBg.fillRoundedRect(barX, barY - barHeight / 2, barW, barHeight, 3);
    barBg.lineStyle(2, RETRO.borderColor, 1.0);
    barBg.strokeRoundedRect(barX, barY - barHeight / 2, barW, barHeight, 3);

    const hpBarColor = this.combatMode ? 0x48bb78 : UI_COLORS.accent;
    const initialFillW = this.combatMode ? barW : 0; // HP starts full

    const progressFill = this.add
      .rectangle(barX, barY, initialFillW, barHeight - 4, hpBarColor)
      .setOrigin(0, 0.5)
      .setDepth(601);

    if (this.combatMode) {
      this.playerHpFill = progressFill;
    }

    const progressGlow = this.add
      .rectangle(barX, barY, 4, barHeight - 4, hpBarColor, 0.8)
      .setOrigin(0, 0.5)
      .setDepth(602);

    if (this.combatMode) {
      progressGlow.setPosition(barX + barW, barY);
    }

    // Right side: Score label
    this.add
      .text(GAME_WIDTH - 30, safeTop + 20, 'SCORE', {
        fontSize: '16px',
        color: '#718096',
        fontFamily: 'monospace',
      })
      .setOrigin(1, 0.5)
      .setDepth(600);

    // Right side: Score text
    const scoreText = this.add
      .text(GAME_WIDTH - 30, safeTop + 55, '0', {
        fontSize: '42px',
        color: '#e2e8f0',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(1, 0.5)
      .setDepth(600);

    this.scoreCounter = new ScoreCounter(this, scoreText);

    // Event listeners
    eventBus.on(GameEvents.SCORE_CHANGED, (data: unknown) => {
      const { score } = data as { score: number };
      this.scoreCounter.rollTo(score);
    });

    eventBus.on(GameEvents.SLING_COMBO, (data: unknown) => {
      const { count } = data as { count: number };
      this.comboText.setText(`SLING x${count}!`);
      this.comboText.setColor(count >= 4 ? '#e74c3c' : '#f39c12');

      this.tweens.add({
        targets: this.comboText,
        scaleX: 1.4,
        scaleY: 1.4,
        duration: 150,
        yoyo: true,
        ease: 'Back.easeOut',
      });
    });

    eventBus.on(GameEvents.SLING_BREAK, () => {
      this.comboText.setText('BREAK!');
      this.comboText.setColor('#e74c3c');
      this.time.delayedCall(1000, () => {
        this.comboText.setText('');
      });
    });

    eventBus.on(GameEvents.CUBES_DESTROYED, (data: unknown) => {
      const { destroyed } = data as { destroyed: { cubeId: string }[] };
      this.destroyedCubes += destroyed.length;
      const remaining = this.totalCubes - this.destroyedCubes;
      this.cubeCountText.setText(`${remaining} cubes`);

      const progress = this.destroyedCubes / this.totalCubes;
      const fillWidth = barW * progress;

      this.tweens.add({
        targets: progressFill,
        width: fillWidth,
        duration: 200,
        ease: 'Power2',
      });

      this.tweens.add({
        targets: progressGlow,
        x: barX + fillWidth,
        duration: 200,
        ease: 'Power2',
      });
    });

    // Combat mode: Player HP bar updates
    if (this.combatMode) {
      eventBus.on(GameEvents.PLAYER_HP_CHANGED, (data: unknown) => {
        const { hp, maxHp } = data as { hp: number; maxHp: number };
        const ratio = Math.max(0, hp / maxHp);
        const fillWidth = barW * ratio;
        const color = ratio > 0.5 ? '#48bb78' : ratio > 0.25 ? '#f0d050' : '#e74c3c';

        if (this.playerHpText) {
          this.playerHpText.setText(`HP ${Math.max(0, hp)}/${maxHp}`);
          this.playerHpText.setColor(color);
        }

        if (this.playerHpFill) {
          const fillColor = ratio > 0.5 ? 0x48bb78 : ratio > 0.25 ? 0xf0d050 : 0xe74c3c;
          this.playerHpFill.fillColor = fillColor;
          this.tweens.add({
            targets: this.playerHpFill,
            width: Math.max(1, fillWidth),
            duration: 200,
            ease: 'Power2',
          });
          this.tweens.add({
            targets: progressGlow,
            x: barX + fillWidth,
            duration: 200,
            ease: 'Power2',
          });
        }

        // Low HP warning flash
        if (ratio <= 0.25 && ratio > 0) {
          this.tweens.add({
            targets: this.playerHpFill,
            alpha: 0.5, duration: 100, yoyo: true,
          });
        }
      });

      eventBus.on(GameEvents.ENEMY_TIMER_TICK, (data: unknown) => {
        const { readyCount } = data as { readyCount: number };
        if (readyCount > 0) {
          this.comboText.setText(`${readyCount} ATTACK!`);
          this.comboText.setColor('#e74c3c');
          this.time.delayedCall(1000, () => {
            if (this.comboText.text.includes('ATTACK')) {
              this.comboText.setText('');
            }
          });
        }
      });
    }
  }

  // ─── BGM Toggle ──────────────────────────────────────────

  private toggleBgm(): void {
    this.bgmMuted = !this.bgmMuted;
    SaveManager.setBgmMuted(this.bgmMuted);

    const audio = getRetroAudio();
    if (this.bgmMuted) {
      audio.stop();
    } else {
      const vol = SaveManager.getBgmSettings().volume;
      audio.setVolume(vol);
      audio.play();
    }

    this.soundIcon.setText(this.bgmMuted ? 'OFF' : 'ON');
    this.soundIcon.setColor(this.bgmMuted ? '#4a5568' : '#48bb78');
  }

  // ─── Pause Menu ──────────────────────────────────────────

  private showPauseMenu(): void {
    if (this.isPaused) return;
    this.isPaused = true;
    this.scene.pause('PuzzleScene');

    this.pauseOverlay = new PauseOverlay(this, {
      onResume: () => this.hidePauseMenu(),
      onMenu: () => {
        getRetroAudio().stop();
        this.scene.stop('PuzzleScene');
        this.scene.stop('PuzzleUIScene');
        this.scene.start('StageSelectScene');
      },
      onBgmToggle: () => {
        // Sync HUD sound icon with changes made inside the overlay
        const muted = SaveManager.getBgmSettings().muted;
        this.bgmMuted = muted;
        this.soundIcon.setText(muted ? 'OFF' : 'ON');
        this.soundIcon.setColor(muted ? '#4a5568' : '#48bb78');
      },
    });

    this.pauseOverlay.show();
  }

  private hidePauseMenu(): void {
    if (this.pauseOverlay) {
      this.pauseOverlay.destroy();
      this.pauseOverlay = null;
    }
    this.isPaused = false;
    this.scene.resume('PuzzleScene');
  }
}
