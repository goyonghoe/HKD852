import Phaser from 'phaser';
import { BALANCE, VISUAL } from '../../config/balance';
import { NEON, NEON_CSS, ELEMENT, HUD_COLORS } from '../../config/colors';
import { GAME_WIDTH } from '../../config/game-config';
import { calculateGaugePercent, calculateXpPercent } from '../../core/GaugeCalc';
import { t } from '../../lib/i18n';
import type { Player } from '../../objects/Player';
import type { Enemy } from '../../objects/Enemy';
import type { Critter } from '../../objects/Critter';
import type { RunState } from '../../types/game';

/**
 * Manages all graphical gauge/bar elements:
 * base HP, XP, boss HP, ultimate gauge, critter cooldown, enemy overhead HP.
 */
export class GaugePanel {
  private scene: Phaser.Scene;

  // Graphics elements
  private baseBar!: Phaser.GameObjects.Graphics;
  private xpBar!: Phaser.GameObjects.Graphics;
  private bossNameText!: Phaser.GameObjects.Text;
  private bossHpBar!: Phaser.GameObjects.Graphics;
  ultimateGaugeBar!: Phaser.GameObjects.Graphics;
  ultimateGaugePulse?: Phaser.Tweens.Tween;
  enemyHpBarsGfx!: Phaser.GameObjects.Graphics;

  // Critter skill cooldown
  private critterCdGfx!: Phaser.GameObjects.Graphics;
  private critterCdLabel!: Phaser.GameObjects.Text;

  // Dirty-flag cache
  private prevBaseHpPct = -1;
  private prevXpPct = -1;
  private prevBossHpPct = -1;
  prevUltGaugePct = -1;
  private prevCritterCdPct = -1;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  create(): void {
    const scene = this.scene;

    this.baseBar = scene.add.graphics().setScrollFactor(0).setDepth(1500);
    this.xpBar = scene.add.graphics().setScrollFactor(0).setDepth(1500);

    // Boss name (conditional)
    this.bossNameText = scene.add
      .text(GAME_WIDTH / 2, 84, '', {
        fontSize: '20px',
        color: NEON_CSS.BOSS_WARNING,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(1500)
      .setAlpha(0);

    // Boss HP bar (conditional)
    this.bossHpBar = scene.add.graphics().setScrollFactor(0).setDepth(1500).setAlpha(0);

    // Ultimate gauge bar (above base HP bar)
    this.ultimateGaugeBar = scene.add.graphics().setScrollFactor(0).setDepth(1500);

    // Enemy overhead HP bars (world-space)
    this.enemyHpBarsGfx = scene.add.graphics().setDepth(200);

    // Critter skill cooldown (bottom-left)
    const ccX = BALANCE.HUD.critterCdX;
    const ccY = BALANCE.HUD.critterCdY;
    this.critterCdGfx = scene.add.graphics().setScrollFactor(0).setDepth(1500);
    this.critterCdLabel = scene.add
      .text(ccX + BALANCE.HUD.critterCdLabelOffsetX, ccY - 8, '', {
        fontSize: '14px',
        color: NEON_CSS.UI_DIM,
        fontFamily: 'monospace',
      })
      .setScrollFactor(0)
      .setDepth(1500);
  }

  resetDirtyFlags(): void {
    this.prevBaseHpPct = -1;
    this.prevXpPct = -1;
    this.prevBossHpPct = -1;
    this.prevUltGaugePct = -1;
    this.prevCritterCdPct = -1;
  }

  updateBaseHp(runState: RunState): void {
    const bPct = Math.round(calculateGaugePercent(runState.baseHp, runState.baseMaxHp));
    if (bPct === this.prevBaseHpPct) return;
    this.prevBaseHpPct = bPct;
    const bW = VISUAL.UI.baseBarWidth;
    const bH = VISUAL.UI.baseBarHeight;
    const bX = GAME_WIDTH / 2 - bW / 2;
    const bY = 660;
    const pct = bPct / 100;
    this.baseBar.clear();
    this.baseBar.fillStyle(NEON.UI_PANEL, 0.9);
    this.baseBar.fillRect(bX, bY, bW, bH);
    const barColor = pct > 0.5 ? NEON.UI_ACCENT : pct > 0.25 ? NEON.GOLD : NEON.HEALTH;
    this.baseBar.fillStyle(barColor, 1);
    this.baseBar.fillRect(bX, bY, bW * pct, bH);
    this.baseBar.lineStyle(1, NEON.UI_BORDER, 0.8);
    this.baseBar.strokeRect(bX, bY, bW, bH);
  }

  updateXp(playerXp: number, xpRequired: number): void {
    const xpPct = Math.round(calculateXpPercent(playerXp, xpRequired));
    if (xpPct === this.prevXpPct) return;
    this.prevXpPct = xpPct;
    const xW = VISUAL.UI.xpBarWidth;
    const xH = VISUAL.UI.xpBarHeight;
    const xX = GAME_WIDTH / 2 - xW / 2;
    const xY = 70;
    this.xpBar.clear();
    this.xpBar.fillStyle(NEON.UI_PANEL, 0.8);
    this.xpBar.fillRect(xX, xY, xW, xH);
    this.xpBar.fillStyle(NEON.XP_BAR, 1);
    this.xpBar.fillRect(xX, xY, xW * (xpPct / 100), xH);
  }

  updateBossHp(activeBoss: Enemy | null): void {
    if (activeBoss && activeBoss.active) {
      const bossPct = Math.round(calculateGaugePercent(activeBoss.hp, activeBoss.maxHp));
      if (bossPct !== this.prevBossHpPct) {
        this.prevBossHpPct = bossPct;
        const bW = BALANCE.HUD.bossHpBarWidth;
        const bH = BALANCE.HUD.bossHpBarHeight;
        const bX = GAME_WIDTH / 2 - bW / 2;
        const bY = BALANCE.HUD.bossHpBarY;
        const pct = bossPct / 100;
        this.bossHpBar.clear();
        this.bossHpBar.fillStyle(NEON.UI_PANEL, 0.9);
        this.bossHpBar.fillRect(bX, bY, bW, bH);
        this.bossHpBar.fillStyle(NEON.HEALTH, 1);
        this.bossHpBar.fillRect(bX, bY, bW * pct, bH);
        this.bossHpBar.lineStyle(1, NEON.BOSS_WARNING, 0.8);
        this.bossHpBar.strokeRect(bX, bY, bW, bH);
        this.bossHpBar.setAlpha(1);
      }
      if (this.bossNameText.alpha === 0) {
        this.bossNameText.setText(t(`boss.${activeBoss.behavior}`) || t('boss.default'));
        this.bossNameText.setAlpha(1);
      }
    } else if (this.prevBossHpPct !== -1) {
      this.bossHpBar.clear();
      this.bossHpBar.setAlpha(0);
      this.bossNameText.setAlpha(0);
      this.prevBossHpPct = -1;
    }
  }

  updateUltimateGauge(player: Player): void {
    const ultPct = Math.round(calculateGaugePercent(player.ultimateGauge, player.ultimateMax));
    if (ultPct === this.prevUltGaugePct) return;
    this.prevUltGaugePct = ultPct;
    const uW = BALANCE.ULTIMATE.gaugeBarWidth;
    const uH = BALANCE.ULTIMATE.gaugeBarHeight;
    const uX = GAME_WIDTH / 2 - uW / 2;
    const uY = 648;
    this.ultimateGaugeBar.clear();
    this.ultimateGaugeBar.fillStyle(NEON.UI_PANEL, 0.8);
    this.ultimateGaugeBar.fillRect(uX, uY, uW, uH);
    this.ultimateGaugeBar.fillStyle(player.elementColor, 1);
    this.ultimateGaugeBar.fillRect(uX, uY, uW * (ultPct / 100), uH);
    this.ultimateGaugeBar.lineStyle(1, NEON.UI_BORDER, 0.6);
    this.ultimateGaugeBar.strokeRect(uX, uY, uW, uH);

    if (ultPct >= 100 && !this.ultimateGaugePulse) {
      this.ultimateGaugePulse = this.scene.tweens.add({
        targets: this.ultimateGaugeBar,
        alpha: { from: BALANCE.ULTIMATE.pulseAlphaMin, to: BALANCE.ULTIMATE.pulseAlphaMax },
        duration: BALANCE.ULTIMATE.pulseDurationMs,
        yoyo: true,
        repeat: -1,
      });
    } else if (ultPct < 100 && this.ultimateGaugePulse) {
      this.ultimateGaugePulse.stop();
      this.ultimateGaugePulse = undefined;
      this.ultimateGaugeBar.setAlpha(1);
    }
  }

  updateEnemyOverheadBars(activeEnemies: Enemy[], activeEnemyCount: number): void {
    this.enemyHpBarsGfx.clear();
    for (let i = 0; i < activeEnemyCount; i++) {
      const e = activeEnemies[i];
      if (!e.isElite && !e.behavior.startsWith('boss_')) continue;
      if (e.hp >= e.maxHp) continue;
      const barW = e.isElite ? 30 : 44;
      const barH = 4;
      const barX = e.x - barW / 2;
      const barY = e.y - (e.isElite ? 20 : 36);
      const pct = e.hp / e.maxHp;
      this.enemyHpBarsGfx.fillStyle(NEON.BG_BLACK, 0.6);
      this.enemyHpBarsGfx.fillRect(barX, barY, barW, barH);
      const barColor = pct > 0.5 ? NEON.XP_ORB : pct > 0.25 ? NEON.ENEMY_FAST : NEON.HEALTH;
      this.enemyHpBarsGfx.fillStyle(barColor, 1);
      this.enemyHpBarsGfx.fillRect(barX, barY, barW * pct, barH);
    }
  }

  updateCritterCd(critter?: Critter | null): void {
    if (critter) {
      const cdPct = Math.round(calculateGaugePercent(critter.cooldownTimer, critter.def.cooldownMs));
      if (cdPct === this.prevCritterCdPct) return;
      this.prevCritterCdPct = cdPct;
      const ccX = BALANCE.HUD.critterCdX;
      const ccY = BALANCE.HUD.critterCdY;
      const r = BALANCE.HUD.critterCdRadius;
      const critterColor = ELEMENT[critter.def.element as keyof typeof ELEMENT] ?? NEON.UI_ACCENT;
      this.critterCdGfx.clear();
      this.critterCdGfx.fillStyle(HUD_COLORS.CRITTER_CD_BG, HUD_COLORS.CRITTER_CD_BG_ALPHA);
      this.critterCdGfx.fillCircle(ccX + r, ccY, r);
      const progress = 1 - Math.max(0, Math.min(cdPct / 100, 1));
      if (progress > 0) {
        this.critterCdGfx.fillStyle(critterColor, HUD_COLORS.CRITTER_CD_FILL_ALPHA);
        this.critterCdGfx.beginPath();
        this.critterCdGfx.moveTo(ccX + r, ccY);
        const startAngle = -Math.PI / 2;
        const endAngle = startAngle + progress * Math.PI * 2;
        const segments = 20;
        for (let j = 0; j <= segments; j++) {
          const angle = startAngle + (endAngle - startAngle) * (j / segments);
          this.critterCdGfx.lineTo(ccX + r + Math.cos(angle) * r, ccY + Math.sin(angle) * r);
        }
        this.critterCdGfx.lineTo(ccX + r, ccY);
        this.critterCdGfx.closePath();
        this.critterCdGfx.fillPath();
      }
      this.critterCdGfx.lineStyle(1, NEON.UI_BORDER, 0.6);
      this.critterCdGfx.strokeCircle(ccX + r, ccY, r);
      this.critterCdLabel.setText(critter.def.nameKo);
    } else if (this.prevCritterCdPct !== -1) {
      this.critterCdGfx.clear();
      this.critterCdLabel.setText('');
      this.prevCritterCdPct = -1;
    }
  }
}
