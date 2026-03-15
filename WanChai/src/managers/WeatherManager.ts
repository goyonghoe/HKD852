import Phaser from 'phaser';
import { BALANCE } from '../config/balance';
import { WEATHER_COLORS } from '../config/colors';
import { getDistrictForStage } from '../config/districts';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/game-config';
import {
  calculateFlameZonePosition,
  calculateLightningPath,
  calculateFogRings,
  getWeatherModifiers,
} from '../core/WeatherCalc';

/**
 * Weather effects application and rendering (district-based).
 *
 * Supported effects:
 *  - speed_all:      Wind district — all unit move speed +10%
 *  - rain:           Heavy Rain — enemies get -15% move speed
 *  - flame_zones:    Heatwave — random flame zones spawn periodically
 *  - armor_all:      Tremor — enemy armor +15%
 *  - crit_all:       Sacred Light — player crit chance +15%  (now unused by districts, kept for backwards compat)
 *  - fog:            Dark Fog — reduced vision radius
 *  - shield_regen:   Energy Field — base HP regenerates +2 HP/s
 *  - lightning_field: Lightning Storm — random lightning strikes every 3s
 *  - void_gravity:   Gravity Well — pull enemies toward screen center
 */
export class WeatherManager {
  private scene: Phaser.Scene;

  // Weather modifiers exposed to RunScene
  speedMult = 1;
  armorMult = 1;
  critBonus = 0;
  enemySpeedMult = 1;
  baseRegenPerSec = 0;

  // Flame zones state
  private flameTimer = 0;
  private fogOverlay?: Phaser.GameObjects.Graphics;
  private activeFlameZones: { x: number; y: number; life: number; gfx: Phaser.GameObjects.Graphics }[] = [];

  // Rain VFX state
  private rainDrops: Phaser.GameObjects.Rectangle[] = [];

  // Shield regen VFX state
  private shieldRegenOverlay?: Phaser.GameObjects.Graphics;
  private shieldRegenPulseTimer = 0;

  // Lightning field state
  private lightningTimer = 0;
  private lightningStrikeGfx?: Phaser.GameObjects.Graphics;
  private lightningStrikeLife = 0;

  // Void gravity state
  private voidGravityOverlay?: Phaser.GameObjects.Graphics;
  private voidPulseTimer = 0;

  /** Pending lightning strike targets for RunScene to apply damage. */
  pendingLightningStrikes: { x: number; y: number; damage: number }[] = [];

  /** Active gravity well center + pull speed for RunScene to apply to enemies. */
  gravityWell: { cx: number; cy: number; pullSpeed: number; radius: number } | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** Apply weather effects for the current stage. */
  apply(stage: number): void {
    // Reset all modifiers
    this.speedMult = 1;
    this.armorMult = 1;
    this.critBonus = 0;
    this.enemySpeedMult = 1;
    this.baseRegenPerSec = 0;
    this.flameTimer = 0;
    this.lightningTimer = 0;
    this.lightningStrikeLife = 0;
    this.shieldRegenPulseTimer = 0;
    this.voidPulseTimer = 0;
    this.pendingLightningStrikes = [];
    this.gravityWell = null;

    // Clean up VFX from previous stage
    this.cleanupVisuals();

    const district = getDistrictForStage(stage);
    if (!district) return;

    // Apply stat modifiers via pure function (individual keys referenced for dead-code audit)
    const mods = getWeatherModifiers(district.weatherEffect, {
      speedAllBonus: BALANCE.WEATHER.speedAllBonus,
      rainEnemySpeedMult: BALANCE.WEATHER.rainEnemySpeedMult,
      armorAllBonus: BALANCE.WEATHER.armorAllBonus,
      critAllBonus: BALANCE.WEATHER.critAllBonus,
      shieldRegenHpPerSec: BALANCE.WEATHER.shieldRegenHpPerSec,
    });
    this.speedMult = mods.speedMult;
    this.armorMult = mods.armorMult;
    this.critBonus = mods.critBonus;
    this.enemySpeedMult = mods.enemySpeedMult;
    this.baseRegenPerSec = mods.baseRegenPerSec;

    // Set up VFX objects (Phaser-dependent, stays in manager)
    switch (district.weatherEffect) {
      case 'rain':
        this.initRainVFX();
        break;
      case 'fog':
        this.fogOverlay = this.scene.add.graphics().setDepth(1000);
        break;
      case 'shield_regen':
        this.shieldRegenOverlay = this.scene.add.graphics().setDepth(50);
        break;
      case 'lightning_field':
        this.lightningStrikeGfx = this.scene.add.graphics().setDepth(500);
        this.lightningStrikeGfx.setVisible(false);
        break;
      case 'void_gravity':
        this.gravityWell = {
          cx: GAME_WIDTH / 2,
          cy: GAME_HEIGHT / 2,
          pullSpeed: BALANCE.WEATHER.voidGravityPullSpeed,
          radius: BALANCE.WEATHER.voidGravityRadius,
        };
        this.voidGravityOverlay = this.scene.add.graphics().setDepth(50);
        break;
    }
  }

  /** Update weather effects each frame. */
  update(delta: number, stage: number, playerX: number, playerY: number): void {
    const district = getDistrictForStage(stage);
    if (!district) return;

    if (district.weatherEffect === 'flame_zones') {
      this.updateFlameZones(delta);
    }

    if (district.weatherEffect === 'fog' && this.fogOverlay) {
      this.updateFog(playerX, playerY);
    }

    if (district.weatherEffect === 'rain') {
      this.updateRainVFX(delta);
    }

    if (district.weatherEffect === 'shield_regen') {
      this.updateShieldRegenVFX(delta);
    }

    if (district.weatherEffect === 'lightning_field') {
      this.updateLightningField(delta);
    }

    if (district.weatherEffect === 'void_gravity') {
      this.updateVoidGravityVFX(delta);
    }
  }

  // ==================== Flame Zones ====================

  private updateFlameZones(delta: number): void {
    this.flameTimer += delta;
    if (this.flameTimer >= BALANCE.WEATHER.flameZoneIntervalMs) {
      this.flameTimer = 0;
      this.spawnFlameZone();
    }
    for (let i = this.activeFlameZones.length - 1; i >= 0; i--) {
      const fz = this.activeFlameZones[i];
      fz.life -= delta;
      if (fz.life <= 0) {
        fz.gfx.destroy();
        this.activeFlameZones.splice(i, 1);
      }
    }
  }

  private spawnFlameZone(): void {
    const r = BALANCE.WEATHER.flameZoneRadius;
    const pos = calculateFlameZonePosition(
      GAME_WIDTH,
      GAME_HEIGHT,
      r,
      BALANCE.WEATHER.flameZoneSpawnYMin,
      BALANCE.WEATHER.flameZoneSpawnYRange,
      { next: () => Math.random() },
    );
    const x = pos.x;
    const y = pos.y;
    const gfx = this.scene.add.graphics().setDepth(50);
    gfx.fillStyle(WEATHER_COLORS.FLAME_FILL, WEATHER_COLORS.FLAME_FILL_ALPHA);
    gfx.fillCircle(x, y, r);
    gfx.lineStyle(2, WEATHER_COLORS.FLAME_STROKE, WEATHER_COLORS.FLAME_STROKE_ALPHA);
    gfx.strokeCircle(x, y, r);
    this.activeFlameZones.push({ x, y, life: BALANCE.WEATHER.flameZoneDurationMs, gfx });
  }

  // ==================== Fog ====================

  private updateFog(playerX: number, playerY: number): void {
    const g = this.fogOverlay!;
    g.clear();

    const fogR = BALANCE.WEATHER.fogRadius;

    // Draw concentric circle rings from outer (dense) to inner (transparent)
    // Painter's algorithm: outer rings drawn first, inner rings overlay on top
    const fogRings = calculateFogRings(
      playerX,
      playerY,
      fogR,
      GAME_WIDTH,
      GAME_HEIGHT,
      BALANCE.WEATHER.fogRingCount,
      BALANCE.WEATHER.fogRingAlphaMax,
      BALANCE.WEATHER.fogRingAlphaMin,
    );

    for (const ring of fogRings) {
      g.fillStyle(WEATHER_COLORS.FOG_DARK, ring.alpha);
      g.fillCircle(ring.cx, ring.cy, ring.radius);
    }

    // Solid outer darkness beyond the largest fog ring
    // (covers corners that circles might miss)
    const maxR = fogRings.length > 0 ? fogRings[0].radius : fogR;
    g.fillStyle(WEATHER_COLORS.FOG_DARK, BALANCE.WEATHER.fogOuterDarknessAlpha);
    // Top strip
    g.fillRect(0, 0, GAME_WIDTH, Math.max(0, playerY - maxR));
    // Bottom strip
    const bottomY = playerY + maxR;
    g.fillRect(0, bottomY, GAME_WIDTH, Math.max(0, GAME_HEIGHT - bottomY));
    // Left strip (mid band)
    g.fillRect(0, Math.max(0, playerY - maxR), Math.max(0, playerX - maxR), maxR * 2);
    // Right strip (mid band)
    const rightX = playerX + maxR;
    g.fillRect(rightX, Math.max(0, playerY - maxR), Math.max(0, GAME_WIDTH - rightX), maxR * 2);
  }

  // ==================== Rain ====================

  private initRainVFX(): void {
    const count = BALANCE.WEATHER.rainParticleCount;
    for (let i = 0; i < count; i++) {
      const x = Math.random() * GAME_WIDTH;
      const y = Math.random() * GAME_HEIGHT;
      const drop = this.scene.add
        .rectangle(
          x,
          y,
          BALANCE.WEATHER.rainDropWidth,
          BALANCE.WEATHER.rainDropHeight,
          WEATHER_COLORS.RAIN_DROP,
          WEATHER_COLORS.RAIN_DROP_ALPHA,
        )
        .setDepth(900)
        .setAngle(BALANCE.WEATHER.rainDropAngle);
      this.rainDrops.push(drop);
    }
  }

  private updateRainVFX(delta: number): void {
    const speed = BALANCE.WEATHER.rainFallSpeed;
    const dt = delta / 1000;
    for (const drop of this.rainDrops) {
      drop.y += speed * dt;
      drop.x += BALANCE.WEATHER.rainWindDrift * dt;
      if (drop.y > GAME_HEIGHT + 20) {
        drop.y = -20;
        drop.x = Math.random() * GAME_WIDTH;
      }
    }
  }

  // ==================== Shield Regen ====================

  private updateShieldRegenVFX(delta: number): void {
    if (!this.shieldRegenOverlay) return;
    this.shieldRegenPulseTimer += delta;
    const pulseCycle = BALANCE.WEATHER.shieldRegenPulseCycleMs;
    const t = (this.shieldRegenPulseTimer % pulseCycle) / pulseCycle;
    const alpha = WEATHER_COLORS.SHIELD_REGEN_FILL_ALPHA * (0.5 + 0.5 * Math.sin(t * Math.PI * 2));

    const g = this.shieldRegenOverlay;
    g.clear();
    // Subtle screen-wide energy field shimmer at bottom (near base)
    const baseY = BALANCE.BASE.y;
    const overlayH = BALANCE.WEATHER.shieldRegenOverlayHeight;
    const overlayOff = BALANCE.WEATHER.shieldRegenOverlayOffset;
    g.fillStyle(WEATHER_COLORS.SHIELD_REGEN_FILL, alpha);
    g.fillRect(0, baseY - overlayOff, GAME_WIDTH, overlayH);
    g.lineStyle(
      1,
      WEATHER_COLORS.SHIELD_REGEN_STROKE,
      WEATHER_COLORS.SHIELD_REGEN_STROKE_ALPHA * (0.5 + 0.5 * Math.sin(t * Math.PI * 2)),
    );
    g.strokeRect(0, baseY - overlayOff, GAME_WIDTH, overlayH);
  }

  // ==================== Lightning Field ====================

  private updateLightningField(delta: number): void {
    this.lightningTimer += delta;

    // Fade existing strike
    if (this.lightningStrikeLife > 0) {
      this.lightningStrikeLife -= delta;
      if (this.lightningStrikeLife <= 0 && this.lightningStrikeGfx) {
        this.lightningStrikeGfx.clear().setVisible(false);
      } else if (this.lightningStrikeGfx) {
        this.lightningStrikeGfx.setAlpha(this.lightningStrikeLife / BALANCE.WEATHER.lightningFadeMs);
      }
    }

    if (this.lightningTimer >= BALANCE.WEATHER.lightningFieldIntervalMs) {
      this.lightningTimer = 0;
      this.spawnLightningStrike();
    }
  }

  private spawnLightningStrike(): void {
    const r = BALANCE.WEATHER.lightningFieldRadius;
    const mathRng = { next: () => Math.random() };
    const x = r + Math.random() * (GAME_WIDTH - r * 2);
    const y = BALANCE.WEATHER.lightningSpawnYMin + Math.random() * BALANCE.WEATHER.lightningSpawnYRange;

    // Calculate bolt path via pure function
    const startX = x + (Math.random() - 0.5) * BALANCE.WEATHER.lightningBoltJitterX;
    const boltPath = calculateLightningPath(
      startX,
      x,
      y,
      BALANCE.WEATHER.lightningBoltSegments,
      BALANCE.WEATHER.lightningBoltSegmentJitterX,
      mathRng,
    );

    // Draw lightning bolt VFX
    if (this.lightningStrikeGfx) {
      const g = this.lightningStrikeGfx;
      g.clear().setVisible(true).setAlpha(1);

      // Flash circle
      g.fillStyle(WEATHER_COLORS.LIGHTNING_FIELD_FLASH, WEATHER_COLORS.LIGHTNING_FIELD_FLASH_ALPHA);
      g.fillCircle(x, y, r);

      // Zigzag bolt from path
      g.lineStyle(BALANCE.WEATHER.lightningBoltWidth, WEATHER_COLORS.LIGHTNING_FIELD_BOLT, 0.9);
      g.beginPath();
      g.moveTo(boltPath[0].x, boltPath[0].y);
      for (let i = 1; i < boltPath.length; i++) {
        g.lineTo(boltPath[i].x, boltPath[i].y);
      }
      g.strokePath();

      this.lightningStrikeLife = BALANCE.WEATHER.lightningFadeMs;
    }

    // Queue damage for RunScene to apply
    this.pendingLightningStrikes.push({
      x,
      y,
      damage: BALANCE.WEATHER.lightningFieldDamage,
    });
  }

  // ==================== Void Gravity ====================

  private updateVoidGravityVFX(delta: number): void {
    if (!this.voidGravityOverlay || !this.gravityWell) return;
    this.voidPulseTimer += delta;
    const pulseCycle = BALANCE.WEATHER.voidPulseCycleMs;
    const t = (this.voidPulseTimer % pulseCycle) / pulseCycle;
    const radius = this.gravityWell.radius;

    const g = this.voidGravityOverlay;
    g.clear();

    // Pulsing gravity distortion rings
    const cx = this.gravityWell.cx;
    const cy = this.gravityWell.cy;

    // Outer ring (expanding inward effect)
    const ring1R = radius * (1 - t * 0.3);
    g.lineStyle(2, WEATHER_COLORS.VOID_GRAVITY_STROKE, WEATHER_COLORS.VOID_GRAVITY_STROKE_ALPHA * (1 - t));
    g.strokeCircle(cx, cy, ring1R);

    // Middle ring
    const ring2R = radius * 0.6 * (1 - t * 0.2);
    g.lineStyle(1, WEATHER_COLORS.VOID_GRAVITY_STROKE, WEATHER_COLORS.VOID_GRAVITY_STROKE_ALPHA * 0.5);
    g.strokeCircle(cx, cy, ring2R);

    // Center fill
    g.fillStyle(WEATHER_COLORS.VOID_GRAVITY_FILL, WEATHER_COLORS.VOID_GRAVITY_FILL_ALPHA);
    g.fillCircle(cx, cy, radius * 0.3);
  }

  // ==================== Cleanup ====================

  private cleanupVisuals(): void {
    if (this.fogOverlay) {
      this.fogOverlay.destroy();
      this.fogOverlay = undefined;
    }
    for (const fz of this.activeFlameZones) fz.gfx.destroy();
    this.activeFlameZones = [];

    for (const drop of this.rainDrops) drop.destroy();
    this.rainDrops = [];

    if (this.shieldRegenOverlay) {
      this.shieldRegenOverlay.destroy();
      this.shieldRegenOverlay = undefined;
    }

    if (this.lightningStrikeGfx) {
      this.lightningStrikeGfx.destroy();
      this.lightningStrikeGfx = undefined;
    }

    if (this.voidGravityOverlay) {
      this.voidGravityOverlay.destroy();
      this.voidGravityOverlay = undefined;
    }
  }

  /** Clean up (scene shutdown). */
  shutdown(): void {
    this.cleanupVisuals();
  }
}
