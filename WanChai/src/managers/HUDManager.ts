import Phaser from 'phaser';
import { BALANCE } from '../config/balance';
import { NEON, NEON_CSS, ELEMENT, ELEMENT_CSS, HUD_COLORS } from '../config/colors';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/game-config';
import { getDistrictForStage } from '../config/districts';
import type { RunState } from '../types/game';
import type { Player } from '../objects/Player';
import type { Enemy } from '../objects/Enemy';
import type { Critter } from '../objects/Critter';
import type { WeaponInstance } from '../types/weapon';
import type { SpawnManager } from './SpawnManager';
import { t } from '../lib/i18n';
import { GaugePanel } from './hud/GaugePanel';
import { WeaponSlotPanel } from './hud/WeaponSlotPanel';

export interface HUDCallbacks {
  togglePause: () => void;
  cycleSpeed: () => void;
  showWeaponRange: (slotIndex: number) => void;
  hideWeaponRange: () => void;
}

/**
 * Manages all HUD rendering. Delegates gauge/bar rendering to GaugePanel
 * and weapon slot display to WeaponSlotPanel.
 */
export class HUDManager {
  private scene: Phaser.Scene;
  private callbacks: HUDCallbacks;

  // Sub-panels
  private gaugePanel: GaugePanel;
  private weaponSlotPanel: WeaponSlotPanel;

  // Text elements
  private killText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private fpsText!: Phaser.GameObjects.Text;
  private goldText!: Phaser.GameObjects.Text;
  private stageText!: Phaser.GameObjects.Text;
  private statsText!: Phaser.GameObjects.Text;
  speedText!: Phaser.GameObjects.Text;

  // Weather indicator
  private weatherDotGfx!: Phaser.GameObjects.Graphics;
  private weatherText!: Phaser.GameObjects.Text;
  private prevWeatherEffect = '';

  // District name label
  private districtLabel!: Phaser.GameObjects.Text;
  private districtFadeTween?: Phaser.Tweens.Tween;
  private prevDistrictId = '';

  // Text dirty-flag cache
  private prevKills = -1;
  private prevLevel = -1;
  private prevTimerStr = '';
  private prevGold = -1;
  private prevStage = -1;
  private prevStatsStr = '';
  private fpsUpdateTimer = 0;

  constructor(scene: Phaser.Scene, callbacks: HUDCallbacks) {
    this.scene = scene;
    this.callbacks = callbacks;
    this.gaugePanel = new GaugePanel(scene);
    this.weaponSlotPanel = new WeaponSlotPanel(scene);
  }

  create(): void {
    const scene = this.scene;

    // Sub-panel creation
    this.gaugePanel.create();
    this.weaponSlotPanel.create({
      showWeaponRange: (idx) => this.callbacks.showWeaponRange(idx),
      hideWeaponRange: () => this.callbacks.hideWeaponRange(),
    });

    // === Row 1 (y=16): Kill | Timer | [II][1x] ===
    this.killText = scene.add
      .text(20, 16, t('hud.kills', { count: 0 }), {
        fontSize: '24px',
        color: NEON_CSS.UI_TEXT,
        fontFamily: 'monospace',
      })
      .setScrollFactor(0)
      .setDepth(1500);

    this.timerText = scene.add
      .text(GAME_WIDTH / 2, 14, '1:00', {
        fontSize: '30px',
        color: NEON_CSS.UI_DIM,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(1500);

    // Pause button (top-right) — 48x48 minimum touch target (M-011)
    scene.add
      .rectangle(GAME_WIDTH - 34, 28, 48, 48, NEON.UI_PANEL, 0.9)
      .setStrokeStyle(1, NEON.UI_BORDER)
      .setScrollFactor(0)
      .setDepth(1500)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.callbacks.togglePause());
    scene.add
      .text(GAME_WIDTH - 34, 28, 'II', {
        fontSize: '22px',
        color: NEON_CSS.UI_TEXT,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1501);

    // Speed toggle button
    const speedBtnY = 680;
    scene.add
      .rectangle(GAME_WIDTH - 70, speedBtnY, 100, 50, NEON.UI_PANEL, 0.85)
      .setStrokeStyle(2, NEON.UI_BORDER)
      .setScrollFactor(0)
      .setDepth(1500)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.callbacks.cycleSpeed());
    this.speedText = scene.add
      .text(GAME_WIDTH - 70, speedBtnY, '1x', {
        fontSize: '28px',
        color: NEON_CSS.UI_ACCENT,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1501);

    // === Row 2 (y=44): Lv + Gold | Stage ===
    this.levelText = scene.add
      .text(20, 44, 'Lv 1', {
        fontSize: '22px',
        color: NEON_CSS.UI_ACCENT,
        fontFamily: 'monospace',
      })
      .setScrollFactor(0)
      .setDepth(1500);

    this.goldText = scene.add
      .text(120, 44, 'G 0', {
        fontSize: '22px',
        color: NEON_CSS.GOLD,
        fontFamily: 'monospace',
      })
      .setScrollFactor(0)
      .setDepth(1500);

    this.stageText = scene.add
      .text(GAME_WIDTH / 2, 44, `Stage 1/${BALANCE.STAGE.maxStages}`, {
        fontSize: '22px',
        color: NEON_CSS.GOLD,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(1500);

    // Left panel: Player stats
    this.statsText = scene.add
      .text(BALANCE.HUD.statsX, BALANCE.HUD.statsY, '', {
        fontSize: `${BALANCE.HUD.statsFontSize}px`,
        color: NEON_CSS.UI_DIM,
        fontFamily: 'monospace',
        lineSpacing: 2,
      })
      .setScrollFactor(0)
      .setDepth(1500)
      .setAlpha(BALANCE.HUD.statsAlpha);

    // Weather indicator
    const wxBase = BALANCE.HUD.weatherIndicatorX;
    const wyBase = BALANCE.HUD.weatherIndicatorY;
    this.weatherDotGfx = scene.add.graphics().setScrollFactor(0).setDepth(1500);
    this.weatherText = scene.add
      .text(wxBase + BALANCE.HUD.weatherTextOffsetX, wyBase - 8, '', {
        fontSize: '16px',
        color: NEON_CSS.UI_DIM,
        fontFamily: 'monospace',
        wordWrap: { width: 200 },
      })
      .setScrollFactor(0)
      .setDepth(1500);

    // District name label
    this.districtLabel = scene.add
      .text(GAME_WIDTH / 2, 120, '', {
        fontSize: `${BALANCE.HUD.districtLabelFontSize}px`,
        color: NEON_CSS.UI_ACCENT,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(1501)
      .setAlpha(0);

    // FPS counter
    this.fpsText = scene.add
      .text(GAME_WIDTH - 10, GAME_HEIGHT - 14, '', {
        fontSize: `${BALANCE.HUD.fpsFontSize}px`,
        color: NEON_CSS.UI_DIM,
        fontFamily: 'monospace',
      })
      .setOrigin(1, 1)
      .setScrollFactor(0)
      .setDepth(1500)
      .setAlpha(BALANCE.HUD.fpsAlpha);
  }

  resetDirtyFlags(): void {
    this.gaugePanel.resetDirtyFlags();
    this.weaponSlotPanel.resetDirtyFlags();
    this.prevKills = -1;
    this.prevLevel = -1;
    this.prevTimerStr = '';
    this.prevGold = -1;
    this.prevStage = -1;
    this.prevStatsStr = '';
    this.prevWeatherEffect = '';
    this.prevDistrictId = '';
    this.fpsUpdateTimer = 0;
  }

  update(
    rawDelta: number,
    runState: RunState,
    player: Player,
    weapons: WeaponInstance[],
    activeBoss: Enemy | null,
    activeEnemies: Enemy[],
    activeEnemyCount: number,
    spawnManager: SpawnManager,
    xpRequired: number,
    critter?: Critter | null,
    weatherEffect?: string,
  ): void {
    // Delegate gauge/bar updates
    this.gaugePanel.updateBaseHp(runState);
    this.gaugePanel.updateXp(runState.playerXp, xpRequired);
    this.gaugePanel.updateBossHp(activeBoss);
    this.gaugePanel.updateUltimateGauge(player);
    this.gaugePanel.updateEnemyOverheadBars(activeEnemies, activeEnemyCount);
    this.gaugePanel.updateCritterCd(critter);

    // Delegate weapon slot updates
    this.weaponSlotPanel.updateSlots(weapons);

    // Kill text
    if (runState.kills !== this.prevKills) {
      this.prevKills = runState.kills;
      this.killText.setText(t('hud.kills', { count: runState.kills }));
    }

    // Level text
    if (runState.playerLevel !== this.prevLevel) {
      this.prevLevel = runState.playerLevel;
      this.levelText.setText(`Lv ${runState.playerLevel}`);
    }

    // Gold text
    if (runState.gold !== this.prevGold) {
      this.prevGold = runState.gold;
      this.goldText.setText(`G ${runState.gold}`);
    }

    // Stage text
    if (runState.stage !== this.prevStage) {
      this.prevStage = runState.stage;
      this.stageText.setText(`Stage ${runState.stage}/${BALANCE.STAGE.maxStages}`);
    }

    // Timer
    let timerStr: string;
    if (spawnManager.isBossStage) {
      timerStr = 'BOSS';
    } else if (spawnManager.isSpawnEnded) {
      timerStr = t('hud.remaining', { count: activeEnemyCount });
    } else {
      const curStageConfig = BALANCE.STAGE.stages[runState.stage - 1];
      const duration = curStageConfig?.durationMs ?? 60000;
      const remaining = Math.max(0, Math.ceil((duration - runState.stageTime) / 1000));
      const min = Math.floor(remaining / 60);
      const sec = remaining % 60;
      timerStr = `${min}:${sec.toString().padStart(2, '0')}`;
    }
    if (timerStr !== this.prevTimerStr) {
      this.prevTimerStr = timerStr;
      this.timerText.setText(timerStr);
      if (spawnManager.isBossStage || spawnManager.isSpawnEnded) {
        this.timerText.setColor(NEON_CSS.GOLD);
      } else {
        const curStageConfig = BALANCE.STAGE.stages[runState.stage - 1];
        const duration = curStageConfig?.durationMs ?? 60000;
        const remaining = Math.max(0, Math.ceil((duration - runState.stageTime) / 1000));
        this.timerText.setColor(remaining <= 10 ? NEON_CSS.HEALTH : NEON_CSS.UI_TEXT);
      }
    }

    // Player stats
    const dmgMult = player.damageMultiplier;
    const spdMult = player.attackSpeedMultiplier;
    const critPct = Math.round(player.critChance * 100);
    const critDmg = player.critDamage;
    const statsStr =
      `DMG x${dmgMult.toFixed(1)}\n` +
      `SPD x${spdMult.toFixed(1)}\n` +
      `CRT ${critPct}%\n` +
      `CRT DMG x${critDmg.toFixed(1)}`;
    if (statsStr !== this.prevStatsStr) {
      this.prevStatsStr = statsStr;
      this.statsText.setText(statsStr);
    }

    // Weather indicator
    const curWeatherEffect = weatherEffect ?? '';
    if (curWeatherEffect !== this.prevWeatherEffect) {
      this.prevWeatherEffect = curWeatherEffect;
      if (curWeatherEffect) {
        const district = getDistrictForStage(runState.stage);
        const dotColor = district ? (ELEMENT[district.element as keyof typeof ELEMENT] ?? NEON.UI_DIM) : NEON.UI_DIM;
        const wxBase = BALANCE.HUD.weatherIndicatorX;
        const wyBase = BALANCE.HUD.weatherIndicatorY;
        this.weatherDotGfx.clear();
        this.weatherDotGfx.fillStyle(dotColor, HUD_COLORS.CRITTER_CD_FILL_ALPHA);
        this.weatherDotGfx.fillCircle(wxBase + BALANCE.HUD.weatherDotRadius, wyBase, BALANCE.HUD.weatherDotRadius);
        this.weatherText.setText(t(`weather.${curWeatherEffect}`));
        this.weatherText.setAlpha(1);
        this.weatherDotGfx.setAlpha(1);
      } else {
        this.weatherDotGfx.clear().setAlpha(0);
        this.weatherText.setText('').setAlpha(0);
      }
    }

    // District name label
    const district = getDistrictForStage(runState.stage);
    const currentDistrictId = district?.id ?? '';
    if (currentDistrictId !== this.prevDistrictId) {
      this.prevDistrictId = currentDistrictId;
      if (district) {
        const districtColor = ELEMENT_CSS[district.element as keyof typeof ELEMENT_CSS] ?? NEON_CSS.UI_ACCENT;
        this.districtLabel.setText(t(`district.${district.id}`));
        this.districtLabel.setColor(districtColor);
        this.districtLabel.setAlpha(HUD_COLORS.DISTRICT_LABEL_ALPHA);
        if (this.districtFadeTween) {
          this.districtFadeTween.stop();
        }
        this.districtFadeTween = this.scene.tweens.add({
          targets: this.districtLabel,
          alpha: 0,
          delay: BALANCE.HUD.districtLabelFadeMs,
          duration: 500,
          ease: 'Quad.easeOut',
        });
      } else {
        this.districtLabel.setAlpha(0);
      }
    }

    // FPS — update every 500ms
    this.fpsUpdateTimer += rawDelta;
    if (this.fpsUpdateTimer >= 500) {
      this.fpsUpdateTimer = 0;
      const fps = Math.round(this.scene.game.loop.actualFps);
      this.fpsText.setText(`FPS: ${fps}`);
      this.fpsText.setColor(fps >= 50 ? NEON_CSS.UI_DIM : fps >= 30 ? NEON_CSS.GOLD : NEON_CSS.HEALTH);
    }
  }

  showWeaponRange(slotIndex: number, playerX: number, playerY: number, weapons: WeaponInstance[]): void {
    this.weaponSlotPanel.showWeaponRange(slotIndex, playerX, playerY, weapons);
  }

  hideWeaponRange(weapons: WeaponInstance[]): void {
    this.weaponSlotPanel.hideWeaponRange(weapons);
  }
}
