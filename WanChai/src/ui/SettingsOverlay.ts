import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/game-config';
import { NEON, NEON_CSS, TOGGLE_COLORS, TOGGLE_CSS, UI_CSS } from '../config/colors';
import { createRetroPanel } from './GlassPanel';
import { createButton } from './ButtonFactory';
import { getRetroAudio } from '../audio/RetroAudio';
import { getRetroSFX } from '../audio/RetroSFX';
import { getAudioManager } from '../audio/AudioManager';
import { SaveManager } from '../managers/SaveManager';
import { t, setLocale, getLocale } from '../lib/i18n';
import { segmentLayout, findActiveLevel, shouldAutoMute, shouldAutoUnmute } from '../utils/UICalc';

/** Volume presets for both BGM and SFX */
const VOL_LEVELS = [0, 0.04, 0.08, 0.12, 0.18];
const SFX_VOL_LEVELS = [0, 0.2, 0.4, 0.6, 0.8];

/**
 * Standalone settings overlay for MainMenuScene.
 * BGM toggle + volume, SFX toggle + volume, language selector,
 * vibration toggle, data reset, close button.
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
      .rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, NEON.BG_BLACK, 0.7)
      .setDepth(900)
      .setInteractive();
    objects.push(backdrop);

    // Retro panel — taller to fit new sections
    const panelW = 440;
    const panelH = 720;
    const panel = createRetroPanel(this.scene, {
      x: cx,
      y: cy,
      width: panelW,
      height: panelH,
      depth: 910,
    });
    objects.push(panel);

    // Title
    const title = this.scene.add
      .text(cx, cy - 300, t('settings.title'), {
        fontSize: '42px',
        color: UI_CSS.HEADING,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(920);
    objects.push(title);

    // ── BGM Section ──
    const bgmTitleY = cy - 240;
    objects.push(
      this.scene.add
        .text(cx - 180, bgmTitleY, t('settings.bgm'), {
          fontSize: '22px',
          color: UI_CSS.LABEL,
          fontFamily: 'monospace',
          fontStyle: 'bold',
        })
        .setOrigin(0, 0.5)
        .setDepth(920),
    );

    const bgmRowY = cy - 190;
    this.buildAudioRow(
      objects,
      bgmRowY,
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
      },
      (vol) => {
        SaveManager.setBgmVolume(vol);
        getRetroAudio().setVolume(vol);
        getAudioManager().setBgmVolume(vol);
      },
      VOL_LEVELS,
    );

    // ── SFX Section ──
    const sfxTitleY = cy - 130;
    objects.push(
      this.scene.add
        .text(cx - 180, sfxTitleY, t('settings.sfx'), {
          fontSize: '22px',
          color: UI_CSS.LABEL,
          fontFamily: 'monospace',
          fontStyle: 'bold',
        })
        .setOrigin(0, 0.5)
        .setDepth(920),
    );

    const sfxRowY = cy - 80;
    this.buildAudioRow(
      objects,
      sfxRowY,
      SaveManager.getSfxSettings(),
      (muted) => {
        SaveManager.setSfxMuted(muted);
        getRetroSFX().setMuted(muted);
        if (!muted) getRetroSFX().tap();
        getAudioManager().setSfxMuted(muted);
      },
      (vol) => {
        SaveManager.setSfxVolume(vol);
        getRetroSFX().setVolume(vol);
        getAudioManager().setSfxVolume(vol);
      },
      SFX_VOL_LEVELS,
    );

    // ── Language Section ──
    const langTitleY = cy - 20;
    objects.push(
      this.scene.add
        .text(cx - 180, langTitleY, t('settings.language'), {
          fontSize: '22px',
          color: UI_CSS.LABEL,
          fontFamily: 'monospace',
          fontStyle: 'bold',
        })
        .setOrigin(0, 0.5)
        .setDepth(920),
    );

    this.buildLanguageRow(objects, cy + 30);

    // ── Vibration Section ──
    const vibTitleY = cy + 90;
    objects.push(
      this.scene.add
        .text(cx - 180, vibTitleY, t('settings.vibration'), {
          fontSize: '22px',
          color: UI_CSS.LABEL,
          fontFamily: 'monospace',
          fontStyle: 'bold',
        })
        .setOrigin(0, 0.5)
        .setDepth(920),
    );

    this.buildVibrationToggle(objects, vibTitleY);

    // ── Close button ──
    const closeBtn = createButton(this.scene, {
      x: cx,
      y: cy + 170,
      width: 280,
      height: 60,
      label: t('settings.close'),
      fontSize: '26px',
      variant: 'secondary',
      depth: 920,
      onClick: () => this.hide(),
    });
    objects.push(closeBtn);

    // ── Data reset button ──
    const resetBtn = createButton(this.scene, {
      x: cx,
      y: cy + 260,
      width: 220,
      height: 48,
      label: t('settings.reset'),
      fontSize: '20px',
      variant: 'secondary',
      depth: 920,
      onClick: () => this.showResetConfirm(),
    });
    objects.push(resetBtn);

    this.container = this.scene.add.container(0, 0, objects).setDepth(900);
    this.container.setVisible(false);
  }

  /**
   * Builds a toggle button + 5-segment volume row.
   */
  private buildAudioRow(
    objects: Phaser.GameObjects.GameObject[],
    rowY: number,
    settings: { volume: number; muted: boolean },
    onToggle: (muted: boolean) => void,
    onVolumeChange: (vol: number) => void,
    levels: number[],
  ): void {
    const cx = GAME_WIDTH / 2;

    // Toggle button
    const btnW = 100;
    const btnH = 48;
    const btnX = cx - 100;
    let isMuted = settings.muted;

    const btnGfx = this.scene.add.graphics().setDepth(920);
    objects.push(btnGfx);

    const btnText = this.scene.add
      .text(btnX, rowY, isMuted ? t('settings.off') : t('settings.on'), {
        fontSize: '22px',
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
      btnGfx.fillRoundedRect(btnX - btnW / 2, rowY - btnH / 2, btnW, btnH, 4);
      btnGfx.lineStyle(2, border, 1.0);
      btnGfx.strokeRoundedRect(btnX - btnW / 2, rowY - btnH / 2, btnW, btnH, 4);
    };
    drawBtn(isMuted);

    const btnZone = this.scene.add.zone(btnX, rowY, btnW, btnH).setInteractive({ useHandCursor: true }).setDepth(930);
    objects.push(btnZone);

    // Volume segments — positions computed via UICalc.segmentLayout (M-013)
    const segW = 36;
    const segH = 36;
    const segGap = 8;
    const segStartX = cx - 4;
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
        segGfx.fillRoundedRect(sx, rowY - segH / 2, segW, segH, 3);
        segGfx.lineStyle(1, filled ? TOGGLE_COLORS.ON_FILL_LIGHT : TOGGLE_COLORS.OFF_FILL_LIGHT, 1.0);
        segGfx.strokeRoundedRect(sx, rowY - segH / 2, segW, segH, 3);
      }
    };
    drawSegs();

    // Toggle handler
    btnZone.on('pointerdown', () => {
      isMuted = !isMuted;
      onToggle(isMuted);
      btnText.setText(isMuted ? t('settings.off') : t('settings.on'));
      btnText.setColor(isMuted ? TOGGLE_CSS.OFF : TOGGLE_CSS.ON);
      drawBtn(isMuted);
    });

    // Volume segment handlers
    for (let i = 0; i < segments.length; i++) {
      const sx = segments[i].x + segW / 2;
      const volZone = this.scene.add.zone(sx, rowY, 48, 48).setInteractive({ useHandCursor: true }).setDepth(930);
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
          btnText.setText(t('settings.on'));
          btnText.setColor(TOGGLE_CSS.ON);
          drawBtn(false);
        }
        // Auto-mute if volume = 0
        if (shouldAutoMute(vol, isMuted)) {
          isMuted = true;
          onToggle(true);
          btnText.setText(t('settings.off'));
          btnText.setColor(TOGGLE_CSS.OFF);
          drawBtn(true);
        }
        drawSegs();
      });
    }
  }

  /** Language selector: EN / KO toggle buttons. */
  private buildLanguageRow(objects: Phaser.GameObjects.GameObject[], rowY: number): void {
    const cx = GAME_WIDTH / 2;
    let currentLang = getLocale();

    const langOptions: { label: string; value: string }[] = [
      { label: 'KO', value: 'ko' },
      { label: 'EN', value: 'en' },
    ];

    const btnW = 120;
    const btnH = 48; // M-011: minimum touch target 48dp
    const gap = 16;
    const totalW = langOptions.length * btnW + (langOptions.length - 1) * gap;
    const startX = cx - totalW / 2 + btnW / 2;

    const langGfxList: Phaser.GameObjects.Graphics[] = [];
    const langTextList: Phaser.GameObjects.Text[] = [];

    const drawLangBtns = () => {
      langOptions.forEach((opt, i) => {
        const gfx = langGfxList[i];
        const txt = langTextList[i];
        const isActive = currentLang === opt.value;
        gfx.clear();
        gfx.fillStyle(isActive ? TOGGLE_COLORS.ON_BG : NEON.UI_PANEL);
        gfx.fillRoundedRect(startX + i * (btnW + gap) - btnW / 2, rowY - btnH / 2, btnW, btnH, 4);
        gfx.lineStyle(2, isActive ? TOGGLE_COLORS.ON_BORDER : NEON.UI_BORDER, 1.0);
        gfx.strokeRoundedRect(startX + i * (btnW + gap) - btnW / 2, rowY - btnH / 2, btnW, btnH, 4);
        txt.setColor(isActive ? TOGGLE_CSS.ON : NEON_CSS.UI_DIM);
      });
    };

    langOptions.forEach((opt, i) => {
      const bx = startX + i * (btnW + gap);
      const gfx = this.scene.add.graphics().setDepth(920);
      objects.push(gfx);
      langGfxList.push(gfx);

      const txt = this.scene.add
        .text(bx, rowY, opt.label, {
          fontSize: '22px',
          color: NEON_CSS.UI_DIM,
          fontFamily: 'monospace',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setDepth(921);
      objects.push(txt);
      langTextList.push(txt);

      const zone = this.scene.add.zone(bx, rowY, btnW, btnH).setInteractive({ useHandCursor: true }).setDepth(930);
      objects.push(zone);

      zone.on('pointerdown', () => {
        currentLang = opt.value;
        setLocale(opt.value);
        drawLangBtns();
      });
    });

    drawLangBtns();
  }

  /** Vibration on/off toggle. */
  private buildVibrationToggle(objects: Phaser.GameObjects.GameObject[], rowY: number): void {
    const cx = GAME_WIDTH / 2;
    let vibEnabled = SaveManager.getVibration();

    const btnW = 100;
    const btnH = 48;
    const btnX = cx + 60;

    const btnGfx = this.scene.add.graphics().setDepth(920);
    objects.push(btnGfx);

    const btnText = this.scene.add
      .text(btnX, rowY, vibEnabled ? t('settings.on') : t('settings.off'), {
        fontSize: '22px',
        color: vibEnabled ? TOGGLE_CSS.ON : TOGGLE_CSS.OFF,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(921);
    objects.push(btnText);

    const drawBtn = (enabled: boolean) => {
      btnGfx.clear();
      const color = enabled ? TOGGLE_COLORS.ON_BG : TOGGLE_COLORS.OFF_BG;
      const border = enabled ? TOGGLE_COLORS.ON_BORDER : TOGGLE_COLORS.OFF_BORDER;
      btnGfx.fillStyle(color);
      btnGfx.fillRoundedRect(btnX - btnW / 2, rowY - btnH / 2, btnW, btnH, 4);
      btnGfx.lineStyle(2, border, 1.0);
      btnGfx.strokeRoundedRect(btnX - btnW / 2, rowY - btnH / 2, btnW, btnH, 4);
    };
    drawBtn(vibEnabled);

    const btnZone = this.scene.add.zone(btnX, rowY, btnW, btnH).setInteractive({ useHandCursor: true }).setDepth(930);
    objects.push(btnZone);

    btnZone.on('pointerdown', () => {
      vibEnabled = !vibEnabled;
      SaveManager.setVibration(vibEnabled);
      btnText.setText(vibEnabled ? t('settings.on') : t('settings.off'));
      btnText.setColor(vibEnabled ? TOGGLE_CSS.ON : TOGGLE_CSS.OFF);
      drawBtn(vibEnabled);
    });
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
    const dim = this.scene.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, NEON.BG_BLACK, 0.6).setInteractive();
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
        .text(cx, cy - 90, t('settings.reset_title'), {
          fontSize: '34px',
          color: NEON_CSS.HEALTH,
          fontFamily: 'monospace',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setDepth(951),
    );

    // Warning message
    confirmContainer.add(
      this.scene.add
        .text(cx, cy - 20, t('settings.reset_confirm'), {
          fontSize: '20px',
          color: NEON_CSS.UI_TEXT,
          fontFamily: 'monospace',
          align: 'center',
          lineSpacing: 6,
          wordWrap: { width: dlgW - 60 },
        })
        .setOrigin(0.5)
        .setDepth(951),
    );

    // Confirm button
    const confirmBtn = createButton(this.scene, {
      x: cx - 90,
      y: cy + 60,
      width: 140,
      height: 50,
      label: t('settings.confirm'),
      fontSize: '26px',
      variant: 'primary',
      depth: 951,
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
      x: cx + 90,
      y: cy + 60,
      width: 140,
      height: 50,
      label: t('settings.cancel'),
      fontSize: '26px',
      variant: 'secondary',
      depth: 951,
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
