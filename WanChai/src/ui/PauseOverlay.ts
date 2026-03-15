import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/game-config';
import { NEON, TOGGLE_COLORS, TOGGLE_CSS, UI_CSS } from '../config/colors';
import { createRetroPanel } from './GlassPanel';
import { createButton } from './ButtonFactory';
import { getRetroAudio } from '../audio/RetroAudio';
import { getRetroSFX } from '../audio/RetroSFX';
import { getAudioManager } from '../audio/AudioManager';
import { SaveManager } from '../managers/SaveManager';
import { t } from '../lib/i18n';
import { segmentLayout, findActiveLevel, shouldAutoMute, shouldAutoUnmute } from '../utils/UICalc';

/** Volume presets for BGM */
const VOL_LEVELS = [0, 0.04, 0.08, 0.12, 0.18];
/** Volume presets for SFX */
const SFX_VOL_LEVELS = [0, 0.2, 0.4, 0.6, 0.8];

export interface PauseOverlayCallbacks {
  onResume: () => void;
  onMenu: () => void;
  onBgmToggle?: () => void;
}

export class PauseOverlay {
  private scene: Phaser.Scene;
  private callbacks: PauseOverlayCallbacks;
  private container!: Phaser.GameObjects.Container;
  private visible = false;

  constructor(scene: Phaser.Scene, callbacks: PauseOverlayCallbacks) {
    this.scene = scene;
    this.callbacks = callbacks;
    this.create();
  }

  private create(): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const objects: Phaser.GameObjects.GameObject[] = [];

    // Dark backdrop
    const backdrop = this.scene.add
      .rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, NEON.BG_BLACK, 0.7)
      .setDepth(900)
      .setInteractive();
    objects.push(backdrop);

    // Retro panel
    const panel = createRetroPanel(this.scene, {
      x: cx,
      y: cy,
      width: 440,
      height: 540,
      depth: 910,
    });
    objects.push(panel);

    // Title
    const title = this.scene.add
      .text(cx, cy - 170, t('pause.title'), {
        fontSize: '42px',
        color: UI_CSS.HEADING,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(920);
    objects.push(title);

    // BGM row
    this.buildAudioRow(
      objects,
      cy - 90,
      t('pause.volume'),
      cy - 35,
      SaveManager.getBgmSettings(),
      (muted) => {
        SaveManager.setBgmMuted(muted);
        const audio = getRetroAudio();
        if (muted) {
          audio.stop();
        } else {
          audio.setVolume(SaveManager.getBgmSettings().volume);
          audio.play();
        }
        getAudioManager().setBgmMuted(muted);
        this.callbacks.onBgmToggle?.();
      },
      (vol) => {
        SaveManager.setBgmVolume(vol);
        getRetroAudio().setVolume(vol);
        getAudioManager().setBgmVolume(vol);
      },
      VOL_LEVELS,
      'BGM',
    );

    // SFX row
    this.buildAudioRow(
      objects,
      cy + 20,
      t('pause.volume'),
      cy + 80,
      SaveManager.getSfxSettings(),
      (muted) => {
        SaveManager.setSfxMuted(muted);
        getRetroSFX().setMuted(muted);
        getAudioManager().setSfxMuted(muted);
      },
      (vol) => {
        SaveManager.setSfxVolume(vol);
        getRetroSFX().setVolume(vol);
        getAudioManager().setSfxVolume(vol);
      },
      SFX_VOL_LEVELS,
      'SFX',
    );

    // Resume button
    const resumeBtn = createButton(this.scene, {
      x: cx,
      y: cy + 160,
      width: 280,
      height: 60,
      label: t('pause.resume'),
      fontSize: '26px',
      variant: 'primary',
      depth: 920,
      onClick: () => {
        this.hide();
        this.callbacks.onResume();
      },
    });
    objects.push(resumeBtn);

    // Menu button
    const menuBtn = createButton(this.scene, {
      x: cx,
      y: cy + 235,
      width: 280,
      height: 60,
      label: t('pause.menu'),
      fontSize: '26px',
      variant: 'secondary',
      depth: 920,
      onClick: () => {
        this.callbacks.onMenu();
      },
    });
    objects.push(menuBtn);

    this.container = this.scene.add.container(0, 0, objects).setDepth(900);
    this.container.setVisible(false);
  }

  /**
   * Builds a toggle button + label row, plus a 5-segment volume row below.
   * Shared pattern — eliminates BGM/SFX copy-paste.
   */
  private buildAudioRow(
    objects: Phaser.GameObjects.GameObject[],
    toggleY: number,
    volLabelText: string,
    volRowY: number,
    settings: { volume: number; muted: boolean },
    onToggle: (muted: boolean) => void,
    onVolumeChange: (vol: number) => void,
    levels: number[],
    channelLabel: string,
  ): void {
    const cx = GAME_WIDTH / 2;
    let isMuted = settings.muted;

    // Channel label
    const label = this.scene.add
      .text(cx - 160, toggleY, channelLabel, {
        fontSize: '24px',
        color: UI_CSS.SUBLABEL,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5)
      .setDepth(920);
    objects.push(label);

    // Toggle button
    const btnW = 100;
    const btnH = 48;
    const btnX = cx + 90;

    const btnGfx = this.scene.add.graphics().setDepth(920);
    objects.push(btnGfx);

    const btnText = this.scene.add
      .text(btnX, toggleY, isMuted ? t('pause.off') : t('pause.on'), {
        fontSize: '26px',
        color: isMuted ? TOGGLE_CSS.OFF : TOGGLE_CSS.ON,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(921);
    objects.push(btnText);

    const drawBtn = (muted: boolean) => {
      btnGfx.clear();
      const color = muted ? TOGGLE_COLORS.OFF_BG : TOGGLE_COLORS.ON_BG;
      const border = muted ? TOGGLE_COLORS.OFF_BORDER : TOGGLE_COLORS.ON_BORDER;
      btnGfx.fillStyle(color);
      btnGfx.fillRoundedRect(btnX - btnW / 2, toggleY - btnH / 2, btnW, btnH, 4);
      btnGfx.lineStyle(2, border, 1.0);
      btnGfx.strokeRoundedRect(btnX - btnW / 2, toggleY - btnH / 2, btnW, btnH, 4);
    };
    drawBtn(isMuted);

    const btnZone = this.scene.add
      .zone(btnX, toggleY, btnW, btnH)
      .setInteractive({ useHandCursor: true })
      .setDepth(930);
    objects.push(btnZone);

    btnZone.on('pointerdown', () => {
      isMuted = !isMuted;
      onToggle(isMuted);
      btnText.setText(isMuted ? t('pause.off') : t('pause.on'));
      btnText.setColor(isMuted ? TOGGLE_CSS.OFF : TOGGLE_CSS.ON);
      drawBtn(isMuted);
    });

    // Volume label
    const volLabel = this.scene.add
      .text(cx - 160, volRowY, volLabelText, {
        fontSize: '24px',
        color: UI_CSS.SUBLABEL,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5)
      .setDepth(920);
    objects.push(volLabel);

    // Volume segments — positions computed via UICalc.segmentLayout (M-013)
    const segW = 36;
    const segH = 36;
    const segGap = 8;
    const segStartX = cx - 20;
    const segments = segmentLayout(5, segW, segGap, segStartX);
    let activeLevel = findActiveLevel(levels, settings.volume);

    const segGfx = this.scene.add.graphics().setDepth(920);
    objects.push(segGfx);

    const drawSegs = () => {
      segGfx.clear();
      for (let i = 0; i < segments.length; i++) {
        const { x: sx } = segments[i];
        const filled = i <= activeLevel;
        segGfx.fillStyle(filled ? TOGGLE_COLORS.ON_FILL : TOGGLE_COLORS.OFF_FILL);
        segGfx.fillRoundedRect(sx, volRowY - segH / 2, segW, segH, 3);
        segGfx.lineStyle(1, filled ? TOGGLE_COLORS.ON_FILL_LIGHT : TOGGLE_COLORS.OFF_FILL_LIGHT, 1.0);
        segGfx.strokeRoundedRect(sx, volRowY - segH / 2, segW, segH, 3);
      }
    };
    drawSegs();

    for (let i = 0; i < segments.length; i++) {
      const sx = segments[i].x + segW / 2;
      const volZone = this.scene.add.zone(sx, volRowY, 48, 48).setInteractive({ useHandCursor: true }).setDepth(930);
      objects.push(volZone);

      const level = i;
      volZone.on('pointerdown', () => {
        activeLevel = level;
        const vol = levels[level];
        onVolumeChange(vol);

        // Auto-unmute if volume > 0
        if (shouldAutoUnmute(vol, isMuted)) {
          isMuted = false;
          onToggle(false);
          btnText.setText(t('pause.on'));
          btnText.setColor(TOGGLE_CSS.ON);
          drawBtn(false);
        }
        // Auto-mute if volume = 0
        if (shouldAutoMute(vol, isMuted)) {
          isMuted = true;
          onToggle(true);
          btnText.setText(t('pause.off'));
          btnText.setColor(TOGGLE_CSS.OFF);
          drawBtn(true);
        }
        drawSegs();
      });
    }
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

  destroy(): void {
    this.container.destroy();
  }
}
