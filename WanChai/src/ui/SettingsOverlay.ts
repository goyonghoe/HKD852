import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/game-config';
import { NEON, NEON_CSS, RETRO } from '../config/colors';
import { createRetroPanel } from './GlassPanel';
import { createButton } from './ButtonFactory';
import { getRetroAudio } from '../audio/RetroAudio';
import { getRetroSFX } from '../audio/RetroSFX';
import { SaveManager } from '../managers/SaveManager';

/** Volume presets for both BGM and SFX */
const VOL_LEVELS = [0, 0.04, 0.08, 0.12, 0.18];
const SFX_VOL_LEVELS = [0, 0.2, 0.4, 0.6, 0.8];

/**
 * Standalone settings overlay for MainMenuScene.
 * BGM toggle + volume, SFX toggle + volume, close button.
 */
export class SettingsOverlay {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  private visible = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.create();
  }

  private create(): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const objects: Phaser.GameObjects.GameObject[] = [];

    // Dark backdrop
    const backdrop = this.scene.add
      .rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7)
      .setDepth(900)
      .setInteractive();
    objects.push(backdrop);

    // Retro panel
    const panelW = 440;
    const panelH = 560;
    const panel = createRetroPanel(this.scene, {
      x: cx, y: cy, width: panelW, height: panelH, depth: 910,
    });
    objects.push(panel);

    // Title
    const title = this.scene.add
      .text(cx, cy - 200, '설정', {
        fontSize: '42px', color: '#e2e8f0',
        fontFamily: 'monospace', fontStyle: 'bold',
      })
      .setOrigin(0.5).setDepth(920);
    objects.push(title);

    // ── BGM Section ──
    const bgmTitleY = cy - 140;
    objects.push(this.scene.add
      .text(cx - 180, bgmTitleY, '배경 음악 (BGM)', {
        fontSize: '22px', color: '#a0aec0',
        fontFamily: 'monospace', fontStyle: 'bold',
      })
      .setOrigin(0, 0.5).setDepth(920));

    const bgmRowY = cy - 90;
    const bgmState = this.buildAudioRow(
      objects, bgmRowY,
      SaveManager.getBgmSettings(),
      (muted) => {
        SaveManager.setBgmMuted(muted);
        const audio = getRetroAudio();
        if (muted) { audio.stop(); }
        else { audio.setVolume(SaveManager.getBgmSettings().volume); audio.play(); }
      },
      (vol) => {
        SaveManager.setBgmVolume(vol);
        getRetroAudio().setVolume(vol);
      },
      VOL_LEVELS,
    );

    // ── SFX Section ──
    const sfxTitleY = cy - 20;
    objects.push(this.scene.add
      .text(cx - 180, sfxTitleY, '효과음 (SFX)', {
        fontSize: '22px', color: '#a0aec0',
        fontFamily: 'monospace', fontStyle: 'bold',
      })
      .setOrigin(0, 0.5).setDepth(920));

    const sfxRowY = cy + 30;
    this.buildAudioRow(
      objects, sfxRowY,
      SaveManager.getSfxSettings(),
      (muted) => {
        SaveManager.setSfxMuted(muted);
        getRetroSFX().setMuted(muted);
        if (!muted) getRetroSFX().tap(); // preview sound
      },
      (vol) => {
        SaveManager.setSfxVolume(vol);
        getRetroSFX().setVolume(vol);
      },
      SFX_VOL_LEVELS,
    );

    // ── Close button ──
    const closeBtn = createButton(this.scene, {
      x: cx, y: cy + 120, width: 280, height: 60,
      label: '닫기', fontSize: '26px',
      variant: 'secondary', depth: 920,
      onClick: () => this.hide(),
    });
    objects.push(closeBtn);

    // ── Data reset button ──
    const resetBtn = createButton(this.scene, {
      x: cx, y: cy + 210, width: 220, height: 48,
      label: '데이터 초기화', fontSize: '20px',
      variant: 'secondary', depth: 920,
      onClick: () => this.showResetConfirm(),
    });
    objects.push(resetBtn);

    this.container = this.scene.add.container(0, 0, objects).setDepth(900);
    this.container.setVisible(false);
  }

  /**
   * Builds a toggle button + 5-segment volume row.
   * Returns refs for external state sync if needed.
   */
  private buildAudioRow(
    objects: Phaser.GameObjects.GameObject[],
    rowY: number,
    settings: { volume: number; muted: boolean },
    onToggle: (muted: boolean) => void,
    onVolumeChange: (vol: number) => void,
    levels: number[],
  ): { btnText: Phaser.GameObjects.Text; btnGfx: Phaser.GameObjects.Graphics } {
    const cx = GAME_WIDTH / 2;

    // Toggle button
    const btnW = 100;
    const btnH = 48;
    const btnX = cx - 100;
    let isMuted = settings.muted;

    const btnGfx = this.scene.add.graphics().setDepth(920);
    objects.push(btnGfx);

    const btnText = this.scene.add
      .text(btnX, rowY, isMuted ? '끔' : '켬', {
        fontSize: '22px', color: isMuted ? '#e94560' : '#48bb78',
        fontFamily: 'monospace', fontStyle: 'bold',
      })
      .setOrigin(0.5).setDepth(921);
    objects.push(btnText);

    const drawBtn = (muted: boolean) => {
      btnGfx.clear();
      const color = muted ? 0x3a1520 : 0x1a3328;
      const border = muted ? 0xe94560 : 0x48bb78;
      btnGfx.fillStyle(color);
      btnGfx.fillRoundedRect(btnX - btnW / 2, rowY - btnH / 2, btnW, btnH, 4);
      btnGfx.lineStyle(2, border, 1.0);
      btnGfx.strokeRoundedRect(btnX - btnW / 2, rowY - btnH / 2, btnW, btnH, 4);
    };
    drawBtn(isMuted);

    const btnZone = this.scene.add
      .zone(btnX, rowY, btnW, btnH)
      .setInteractive({ useHandCursor: true }).setDepth(930);
    objects.push(btnZone);

    // Volume segments
    const segW = 36;
    const segH = 36;
    const segGap = 8;
    const segStartX = cx - 4;
    let activeLevel = levels.findIndex((v) => v >= settings.volume);
    if (activeLevel < 0) activeLevel = levels.length - 1;

    const segGfx = this.scene.add.graphics().setDepth(920);
    objects.push(segGfx);

    const drawSegs = () => {
      segGfx.clear();
      for (let i = 0; i < 5; i++) {
        const sx = segStartX + i * (segW + segGap);
        const filled = i <= activeLevel;
        segGfx.fillStyle(filled ? 0x48bb78 : 0x2d3748);
        segGfx.fillRoundedRect(sx, rowY - segH / 2, segW, segH, 3);
        segGfx.lineStyle(1, filled ? 0x68dba0 : 0x4a5568, 1.0);
        segGfx.strokeRoundedRect(sx, rowY - segH / 2, segW, segH, 3);
      }
    };
    drawSegs();

    // Toggle handler
    btnZone.on('pointerdown', () => {
      isMuted = !isMuted;
      onToggle(isMuted);
      btnText.setText(isMuted ? '끔' : '켬');
      btnText.setColor(isMuted ? '#e94560' : '#48bb78');
      drawBtn(isMuted);
    });

    // Volume segment handlers
    for (let i = 0; i < 5; i++) {
      const sx = segStartX + i * (segW + segGap) + segW / 2;
      const volZone = this.scene.add
        .zone(sx, rowY, 48, 48)
        .setInteractive({ useHandCursor: true }).setDepth(930);
      objects.push(volZone);

      const level = i;
      volZone.on('pointerdown', () => {
        activeLevel = level;
        const vol = levels[level];
        onVolumeChange(vol);

        // Auto-unmute if volume > 0
        if (vol > 0 && isMuted) {
          isMuted = false;
          onToggle(false);
          btnText.setText('켬');
          btnText.setColor('#48bb78');
          drawBtn(false);
        }
        // Auto-mute if volume = 0
        if (vol === 0 && !isMuted) {
          isMuted = true;
          onToggle(true);
          btnText.setText('끔');
          btnText.setColor('#e94560');
          drawBtn(true);
        }
        drawSegs();
      });
    }

    return { btnText, btnGfx };
  }

  show(): void {
    this.container.setVisible(true);
    this.visible = true;
  }

  hide(): void {
    this.container.setVisible(false);
    this.visible = false;
  }

  get isVisible(): boolean {
    return this.visible;
  }

  /** Show a confirmation dialog for data reset. */
  private showResetConfirm(): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const confirmContainer = this.scene.add.container(0, 0).setDepth(950);

    // Dim overlay on top of settings
    const dim = this.scene.add
      .rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6)
      .setInteractive();
    confirmContainer.add(dim);

    // Dialog panel
    const dlgW = 460;
    const dlgH = 280;
    const dlgGfx = this.scene.add.graphics();
    dlgGfx.fillStyle(NEON.UI_PANEL, 0.97);
    dlgGfx.fillRoundedRect(cx - dlgW / 2, cy - dlgH / 2, dlgW, dlgH, 12);
    dlgGfx.lineStyle(2, NEON.HEALTH);
    dlgGfx.strokeRoundedRect(cx - dlgW / 2, cy - dlgH / 2, dlgW, dlgH, 12);
    confirmContainer.add(dlgGfx);

    // Warning title
    confirmContainer.add(
      this.scene.add
        .text(cx, cy - 90, '데이터 초기화', {
          fontSize: '34px', color: NEON_CSS.HEALTH,
          fontFamily: 'monospace', fontStyle: 'bold',
        })
        .setOrigin(0.5).setDepth(951),
    );

    // Warning message
    confirmContainer.add(
      this.scene.add
        .text(cx, cy - 30, '모든 데이터가 삭제됩니다.\n강화, 기록, 도감이 초기화됩니다.', {
          fontSize: '22px', color: NEON_CSS.UI_TEXT,
          fontFamily: 'monospace', align: 'center', lineSpacing: 6,
        })
        .setOrigin(0.5).setDepth(951),
    );

    // Confirm button
    const confirmBtn = createButton(this.scene, {
      x: cx - 90, y: cy + 60, width: 140, height: 50,
      label: '확인', fontSize: '26px',
      variant: 'primary', depth: 951,
      onClick: () => {
        confirmContainer.destroy();
        SaveManager.resetAll();
        getRetroSFX().purchase();
        this.hide();
        this.scene.scene.restart();
      },
    });
    confirmContainer.add(confirmBtn);

    // Cancel button
    const cancelBtn = createButton(this.scene, {
      x: cx + 90, y: cy + 60, width: 140, height: 50,
      label: '취소', fontSize: '26px',
      variant: 'secondary', depth: 951,
      onClick: () => {
        confirmContainer.destroy();
      },
    });
    confirmContainer.add(cancelBtn);
  }

  destroy(): void {
    this.container.destroy();
  }
}
