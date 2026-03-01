import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/game-config';
import { RETRO, UI_COLORS } from '../config/colors';
import { createRetroPanel } from './GlassPanel';
import { createButton } from './ButtonFactory';
import { getRetroAudio } from '../audio/RetroAudio';
import { SaveManager } from '../managers/SaveManager';

/** Volume presets (matches PuzzleUIScene levels) */
const VOL_LEVELS = [0, 0.04, 0.08, 0.12, 0.18];

export interface PauseOverlayCallbacks {
  onResume: () => void;
  onMenu: () => void;
  onBgmToggle?: () => void;
}

/**
 * Pause overlay for PuzzleUIScene.
 * Renders a dark backdrop + retro panel with RESUME / MENU buttons,
 * BGM toggle, and volume selector.
 *
 * Usage:
 *   const overlay = new PauseOverlay(this, { onResume, onMenu });
 *   overlay.show();
 */
export class PauseOverlay {
  private scene: Phaser.Scene;
  private callbacks: PauseOverlayCallbacks;
  private container!: Phaser.GameObjects.Container;
  private visible = false;

  // Volume state refs so they can be updated from outside
  private bgmBtnText!: Phaser.GameObjects.Text;
  private bgmBtnGfx!: Phaser.GameObjects.Graphics;
  private segGfx!: Phaser.GameObjects.Graphics;
  private activeLevel = 0;

  constructor(scene: Phaser.Scene, callbacks: PauseOverlayCallbacks) {
    this.scene = scene;
    this.callbacks = callbacks;
    this.create();
  }

  // ─── Build ─────────────────────────────────────────────────

  private create(): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    const objects: Phaser.GameObjects.GameObject[] = [];

    // ── Dark backdrop ────────────────────────────────────────
    const backdrop = this.scene.add
      .rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7)
      .setDepth(900)
      .setInteractive(); // blocks clicks through to game
    objects.push(backdrop);

    // ── Retro panel ──────────────────────────────────────────
    const panelW = 420;
    const panelH = 420;
    const panel = createRetroPanel(this.scene, {
      x: cx,
      y: cy,
      width: panelW,
      height: panelH,
      depth: 910,
    });
    objects.push(panel);

    // ── "PAUSED" title ───────────────────────────────────────
    const title = this.scene.add
      .text(cx, cy - 170, '일시정지', {
        fontSize: '36px',
        color: '#e2e8f0',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(920);
    objects.push(title);

    // ── BGM Row ──────────────────────────────────────────────
    const bgmRowY = cy - 90;
    const bgmLabel = this.scene.add
      .text(cx - 160, bgmRowY, 'BGM', {
        fontSize: '20px',
        color: '#718096',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5)
      .setDepth(920);
    objects.push(bgmLabel);

    const bgmBtnW = 80;
    const bgmBtnH = 36;
    const bgmBtnX = cx + 90;
    const bgmMuted = SaveManager.getBgmSettings().muted;

    this.bgmBtnGfx = this.scene.add.graphics().setDepth(920);
    objects.push(this.bgmBtnGfx);

    this.bgmBtnText = this.scene.add
      .text(bgmBtnX, bgmRowY, bgmMuted ? '끔' : '켬', {
        fontSize: '18px',
        color: bgmMuted ? '#e94560' : '#48bb78',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(921);
    objects.push(this.bgmBtnText);

    const drawBgmBtn = (muted: boolean) => {
      this.bgmBtnGfx.clear();
      const color = muted ? 0x3a1520 : 0x1a3328;
      const border = muted ? 0xe94560 : 0x48bb78;
      this.bgmBtnGfx.fillStyle(color);
      this.bgmBtnGfx.fillRoundedRect(bgmBtnX - bgmBtnW / 2, bgmRowY - bgmBtnH / 2, bgmBtnW, bgmBtnH, 4);
      this.bgmBtnGfx.lineStyle(2, border, 1.0);
      this.bgmBtnGfx.strokeRoundedRect(bgmBtnX - bgmBtnW / 2, bgmRowY - bgmBtnH / 2, bgmBtnW, bgmBtnH, 4);
    };
    drawBgmBtn(bgmMuted);

    const bgmZone = this.scene.add
      .zone(bgmBtnX, bgmRowY, bgmBtnW, bgmBtnH)
      .setInteractive({ useHandCursor: true })
      .setDepth(930);
    objects.push(bgmZone);

    bgmZone.on('pointerdown', () => {
      const isMuted = SaveManager.getBgmSettings().muted;
      const nowMuted = !isMuted;
      SaveManager.setBgmMuted(nowMuted);
      const audio = getRetroAudio();
      if (nowMuted) {
        audio.stop();
      } else {
        const vol = SaveManager.getBgmSettings().volume;
        audio.setVolume(vol);
        audio.play();
      }
      this.bgmBtnText.setText(nowMuted ? '끔' : '켬');
      this.bgmBtnText.setColor(nowMuted ? '#e94560' : '#48bb78');
      drawBgmBtn(nowMuted);
      this.callbacks.onBgmToggle?.();
    });

    // ── Volume Row ───────────────────────────────────────────
    const volRowY = cy - 35;
    const volLabel = this.scene.add
      .text(cx - 160, volRowY, '볼륨', {
        fontSize: '20px',
        color: '#718096',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5)
      .setDepth(920);
    objects.push(volLabel);

    const segW = 28;
    const segH = 24;
    const segGap = 6;
    const segStartX = cx - 15;
    const currentVol = SaveManager.getBgmSettings().volume;
    this.activeLevel = VOL_LEVELS.findIndex((v) => v >= currentVol);
    if (this.activeLevel < 0) this.activeLevel = VOL_LEVELS.length - 1;

    this.segGfx = this.scene.add.graphics().setDepth(920);
    objects.push(this.segGfx);

    const drawVolSegs = () => {
      this.segGfx.clear();
      for (let i = 0; i < 5; i++) {
        const sx = segStartX + i * (segW + segGap);
        const filled = i <= this.activeLevel;
        this.segGfx.fillStyle(filled ? 0x48bb78 : 0x2d3748);
        this.segGfx.fillRoundedRect(sx, volRowY - segH / 2, segW, segH, 3);
        this.segGfx.lineStyle(1, filled ? 0x68dba0 : 0x4a5568, 1.0);
        this.segGfx.strokeRoundedRect(sx, volRowY - segH / 2, segW, segH, 3);
      }
    };
    drawVolSegs();

    for (let i = 0; i < 5; i++) {
      const sx = segStartX + i * (segW + segGap) + segW / 2;
      const volZone = this.scene.add
        .zone(sx, volRowY, segW + segGap, segH + 8)
        .setInteractive({ useHandCursor: true })
        .setDepth(930);
      objects.push(volZone);

      const level = i;
      volZone.on('pointerdown', () => {
        this.activeLevel = level;
        const vol = VOL_LEVELS[level];
        SaveManager.setBgmVolume(vol);
        getRetroAudio().setVolume(vol);

        const isMuted = SaveManager.getBgmSettings().muted;

        // Auto-unmute if volume > 0 and currently muted
        if (vol > 0 && isMuted) {
          SaveManager.setBgmMuted(false);
          getRetroAudio().play();
          this.bgmBtnText.setText('켬');
          this.bgmBtnText.setColor('#48bb78');
          drawBgmBtn(false);
          this.callbacks.onBgmToggle?.();
        }
        // Auto-mute if volume = 0 and not muted
        if (vol === 0 && !isMuted) {
          SaveManager.setBgmMuted(true);
          getRetroAudio().stop();
          this.bgmBtnText.setText('끔');
          this.bgmBtnText.setColor('#e94560');
          drawBgmBtn(true);
          this.callbacks.onBgmToggle?.();
        }

        drawVolSegs();
      });
    }

    // ── RESUME button ────────────────────────────────────────
    const resumeBtn = createButton(this.scene, {
      x: cx,
      y: cy + 60,
      width: 280,
      height: 60,
      label: '계속',
      fontSize: '22px',
      variant: 'primary',
      depth: 920,
      onClick: () => {
        this.hide();
        this.callbacks.onResume();
      },
    });
    objects.push(resumeBtn);

    // ── MENU button ──────────────────────────────────────────
    const menuBtn = createButton(this.scene, {
      x: cx,
      y: cy + 145,
      width: 280,
      height: 60,
      label: '메뉴',
      fontSize: '22px',
      variant: 'secondary',
      depth: 920,
      onClick: () => {
        this.callbacks.onMenu();
      },
    });
    objects.push(menuBtn);

    // ── Assemble container ───────────────────────────────────
    this.container = this.scene.add.container(0, 0, objects).setDepth(900);
    this.container.setVisible(false);
  }

  // ─── Public API ────────────────────────────────────────────

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
