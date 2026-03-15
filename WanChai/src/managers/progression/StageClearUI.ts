import Phaser from 'phaser';
import { BALANCE, VISUAL } from '../../config/balance';
import { NEON, NEON_CSS, STAGE_CLEAR_COLORS } from '../../config/colors';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/game-config';
import { getDistrictForStage } from '../../config/districts';
import { getRetroSFX } from '../../audio/RetroSFX';
import { t } from '../../lib/i18n';
import type { RunState } from '../../types/game';

/**
 * Builds the stage clear overlay container (backdrop, glow, labels, next button).
 * Pure UI construction — no game logic.
 */
export function buildStageClearContainer(
  scene: Phaser.Scene,
  runState: RunState,
  isBossStage: boolean,
  onNextStage: () => void,
): Phaser.GameObjects.Container {
  const cx = GAME_WIDTH / 2;
  const cy = GAME_HEIGHT / 2;
  const container = scene.add.container(cx, cy).setDepth(2000);

  const backdrop = scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, NEON.BG_BLACK, 0.7);
  container.add(backdrop);

  const curConfig = BALANCE.STAGE.stages[runState.stage - 1];
  const glowCfg = VISUAL.STAGE_CLEAR_GLOW;

  // Procedural radial glow burst (TASK-217)
  const glow = scene.add.graphics();
  glow.fillStyle(STAGE_CLEAR_COLORS.OUTER_GLOW, 0.25);
  glow.fillCircle(0, -140, glowCfg.outerRadius);
  glow.fillStyle(STAGE_CLEAR_COLORS.MID_RING, 0.5);
  glow.fillCircle(0, -140, glowCfg.midRadius);
  glow.fillStyle(STAGE_CLEAR_COLORS.INNER_CORE, 0.85);
  glow.fillCircle(0, -140, glowCfg.coreRadius);
  glow.setAlpha(0).setScale(0.3);
  container.add(glow);

  // Phase 1: Scale up with bounce
  scene.tweens.add({
    targets: glow,
    alpha: glowCfg.pulseAlphaMax,
    scaleX: 1,
    scaleY: 1,
    duration: glowCfg.appearMs,
    ease: 'Back.easeOut',
    onComplete: () => {
      // Phase 2: Pulse loop
      const pulseTween = scene.tweens.add({
        targets: glow,
        scaleX: glowCfg.pulseScaleMax,
        scaleY: glowCfg.pulseScaleMax,
        alpha: glowCfg.pulseAlphaMin,
        duration: glowCfg.pulseDurationMs,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });
      // Phase 3: Fade out after hold
      scene.time.delayedCall(glowCfg.holdMs, () => {
        pulseTween.stop();
        scene.tweens.add({
          targets: glow,
          alpha: 0,
          scaleX: 1.5,
          scaleY: 1.5,
          duration: glowCfg.fadeOutMs,
          ease: 'Quad.easeOut',
        });
      });
    },
  });

  const clearTitle = isBossStage
    ? t('stageclear.boss_defeated', { name: curConfig?.name ?? 'BOSS' })
    : t('stageclear.wave_clear', { stage: runState.stage });

  const stageLabel = scene.add
    .text(0, -80, clearTitle, {
      fontSize: '50px',
      color: NEON_CSS.UI_ACCENT,
      fontFamily: 'monospace',
      fontStyle: 'bold',
      wordWrap: { width: GAME_WIDTH - 60 },
    })
    .setOrigin(0.5);
  container.add(stageLabel);

  const healPct = BALANCE.STAGE.clearHealPercent;
  const infoText = scene.add
    .text(0, 0, t('stageclear.base_heal', { pct: Math.round(healPct * 100) }), {
      fontSize: '28px',
      color: NEON_CSS.UI_TEXT,
      fontFamily: 'monospace',
      align: 'center',
      lineSpacing: 8,
    })
    .setOrigin(0.5);
  container.add(infoText);

  const nextConfig = BALANCE.STAGE.stages[runState.stage];
  const nextLabel = scene.add
    .text(
      0,
      60,
      t('stageclear.next', {
        name: nextConfig?.name ?? 'FINAL',
        current: runState.stage + 1,
        max: BALANCE.STAGE.maxStages,
      }),
      {
        fontSize: '28px',
        color: NEON_CSS.GOLD,
        fontFamily: 'monospace',
        fontStyle: 'bold',
        wordWrap: { width: GAME_WIDTH - 80 },
      },
    )
    .setOrigin(0.5);
  container.add(nextLabel);

  const nextDistrict = getDistrictForStage(runState.stage + 1);
  if (nextDistrict) {
    const weatherText = scene.add
      .text(0, 100, nextDistrict.weatherDescription, {
        fontSize: '22px',
        color: NEON_CSS.UI_DIM,
        fontFamily: 'monospace',
        align: 'center',
        wordWrap: { width: GAME_WIDTH - 80 },
      })
      .setOrigin(0.5);
    container.add(weatherText);
  }

  const btnBg = scene.add.rectangle(0, 170, 280, 60, NEON.UI_PANEL).setStrokeStyle(2, NEON.UI_ACCENT);
  const btnText = scene.add
    .text(0, 170, t('stageclear.next_stage'), {
      fontSize: '30px',
      color: NEON_CSS.UI_ACCENT,
      fontFamily: 'monospace',
      fontStyle: 'bold',
    })
    .setOrigin(0.5);
  container.add([btnBg, btnText]);

  btnBg
    .setInteractive({ useHandCursor: true })
    .on('pointerover', () => btnBg.setStrokeStyle(3, NEON.UI_ACCENT))
    .on('pointerout', () => btnBg.setStrokeStyle(2, NEON.UI_ACCENT))
    .on('pointerdown', () => {
      getRetroSFX().tap();
      onNextStage();
    });

  return container;
}
