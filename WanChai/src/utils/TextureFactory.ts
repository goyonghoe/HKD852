import Phaser from 'phaser';
import { NEON, RETRO, TEX } from '../config/colors';

/**
 * Procedural texture generator — cyberpunk neon pixel art.
 * Skips any texture key that already exists (loaded from PNG).
 * Place PNGs in public/assets/sprites/{key}.png to override.
 */
export class TextureFactory {
  private static has(scene: Phaser.Scene, key: string): boolean {
    return scene.textures.exists(key) && scene.textures.get(key).key !== '__MISSING';
  }

  static generateAll(scene: Phaser.Scene): void {
    this.generatePlayerTexture(scene);
    this.generateAllyTextures(scene);
    this.generateEnemyTextures(scene);
    this.generateBossTextures(scene);
    this.generateProjectileTextures(scene);
    this.generateParticleTextures(scene);
    this.generatePurifyTextures(scene);
    this.generateUITextures(scene);
  }

  // === PLAYER TURRET ===
  private static generatePlayerTexture(scene: Phaser.Scene): void {
    if (this.has(scene, 'player')) return;
    const s = 32;
    const g = scene.add.graphics();

    // Glow base
    g.fillStyle(NEON.PLAYER, 0.15);
    g.fillCircle(s / 2, s / 2 + 4, 14);

    // Body hull
    g.fillStyle(TEX.PLAYER_HULL_DARK);
    g.fillTriangle(s / 2, 2, 3, s - 4, s - 3, s - 4);
    // Inner hull
    g.fillStyle(TEX.PLAYER_HULL_MID);
    g.fillTriangle(s / 2, 6, 7, s - 7, s - 7, s - 7);

    // Barrel (center stripe)
    g.fillStyle(NEON.PLAYER);
    g.fillRect(s / 2 - 2, 0, 4, s / 2);

    // Engine glow (bottom)
    g.fillStyle(NEON.PLAYER, 0.8);
    g.fillCircle(s / 2, s - 6, 4);
    g.fillStyle(NEON.PROJECTILE, 0.5);
    g.fillCircle(s / 2, s - 6, 2);

    // Neon outline
    g.lineStyle(1, NEON.PLAYER, 0.8);
    g.strokeTriangle(s / 2, 2, 3, s - 4, s - 3, s - 4);

    g.generateTexture('player', s, s);
    g.destroy();
  }

  // === ALLIES ===
  private static generateAllyTextures(scene: Phaser.Scene): void {
    // Sniper ally — blue diamond turret
    if (!this.has(scene, 'ally_sniper')) {
      const s = 28;
      const g = scene.add.graphics();
      g.fillStyle(TEX.ALLY_SNIPER_GLOW, 0.15);
      g.fillCircle(s / 2, s / 2, 12);
      g.fillStyle(TEX.ALLY_SNIPER_BARREL);
      g.fillRect(s / 2 - 4, 2, 8, s - 4);
      g.fillStyle(TEX.ALLY_SNIPER_BODY);
      g.fillRect(s / 2 - 6, s / 2 - 6, 12, 12);
      g.fillStyle(TEX.ALLY_SNIPER_CORE);
      g.fillRect(s / 2 - 3, s / 2 - 3, 6, 6);
      g.lineStyle(1, TEX.ALLY_SNIPER_BODY, 0.8);
      g.strokeCircle(s / 2, s / 2, 11);
      g.generateTexture('ally_sniper', s, s);
      g.destroy();
    }

    // Spread ally — orange multi-barrel turret
    if (!this.has(scene, 'ally_spread')) {
      const s = 28;
      const g = scene.add.graphics();
      g.fillStyle(TEX.ALLY_SPREAD_GLOW, 0.15);
      g.fillCircle(s / 2, s / 2, 12);
      // Three barrels
      g.fillStyle(TEX.ALLY_SPREAD_BARREL);
      g.fillRect(s / 2 - 8, 2, 4, s / 2);
      g.fillRect(s / 2 - 2, 1, 4, s / 2);
      g.fillRect(s / 2 + 4, 2, 4, s / 2);
      g.fillStyle(TEX.ALLY_SPREAD_BODY);
      g.fillRect(s / 2 - 6, s / 2 - 6, 12, 12);
      g.fillStyle(TEX.ALLY_SPREAD_CORE);
      g.fillRect(s / 2 - 3, s / 2 - 3, 6, 6);
      g.lineStyle(1, TEX.ALLY_SPREAD_BODY, 0.8);
      g.strokeCircle(s / 2, s / 2, 11);
      g.generateTexture('ally_spread', s, s);
      g.destroy();
    }
  }

  // === ENEMIES ===
  private static generateEnemyTextures(scene: Phaser.Scene): void {
    // Basic — red circle with core eye
    if (!this.has(scene, 'enemy_circle')) {
      const s = 24;
      const g = scene.add.graphics();
      // Glow
      g.fillStyle(NEON.ENEMY_BASIC, 0.15);
      g.fillCircle(s / 2, s / 2, s / 2);
      // Body
      g.fillStyle(TEX.ENEMY_CIRCLE_SHELL);
      g.fillCircle(s / 2, s / 2, 10);
      g.fillStyle(NEON.ENEMY_BASIC);
      g.fillCircle(s / 2, s / 2, 8);
      // Core eye
      g.fillStyle(TEX.ENEMY_CIRCLE_EYE);
      g.fillCircle(s / 2, s / 2, 4);
      g.fillStyle(TEX.ENEMY_CIRCLE_IRIS);
      g.fillCircle(s / 2, s / 2, 2);
      // Outline
      g.lineStyle(1, TEX.ENEMY_CIRCLE_IRIS, 0.6);
      g.strokeCircle(s / 2, s / 2, 10);
      g.generateTexture('enemy_circle', s, s);
      g.destroy();
    }

    // Fast — orange arrow/chevron
    if (!this.has(scene, 'enemy_triangle')) {
      const s = 24;
      const g = scene.add.graphics();
      // Body
      g.fillStyle(TEX.ENEMY_FAST_SHELL);
      g.fillTriangle(s / 2, 1, 1, s - 2, s - 1, s - 2);
      g.fillStyle(NEON.ENEMY_FAST);
      g.fillTriangle(s / 2, 4, 4, s - 4, s - 4, s - 4);
      // Speed lines
      g.lineStyle(1, TEX.ENEMY_FAST_SPEED_LINE, 0.6);
      g.moveTo(s / 2, 7);
      g.lineTo(s / 2, s - 6);
      g.strokePath();
      // Outline
      g.lineStyle(1, NEON.ENEMY_FAST, 0.7);
      g.strokeTriangle(s / 2, 1, 1, s - 2, s - 1, s - 2);
      g.generateTexture('enemy_triangle', s, s);
      g.destroy();
    }

    // Tank — purple armored square with plate detail
    if (!this.has(scene, 'enemy_rect')) {
      const s = 36;
      const g = scene.add.graphics();
      // Outer armor
      g.fillStyle(TEX.ENEMY_TANK_ARMOR);
      g.fillRect(0, 0, s, s);
      // Inner plate
      g.fillStyle(NEON.ENEMY_TANK);
      g.fillRect(3, 3, s - 6, s - 6);
      // Armor cross
      g.fillStyle(TEX.ENEMY_TANK_ARMOR);
      g.fillRect(s / 2 - 1, 3, 2, s - 6);
      g.fillRect(3, s / 2 - 1, s - 6, 2);
      // Core
      g.fillStyle(TEX.ENEMY_TANK_CORE);
      g.fillRect(s / 2 - 3, s / 2 - 3, 6, 6);
      // Outline
      g.lineStyle(1, TEX.ENEMY_TANK_CORE, 0.6);
      g.strokeRect(0, 0, s, s);
      g.generateTexture('enemy_rect', s, s);
      g.destroy();
    }

    // Special — pink diamond with pulsing core
    if (!this.has(scene, 'enemy_diamond')) {
      const s = 28;
      const g = scene.add.graphics();
      const cx = s / 2,
        cy = s / 2;
      // Glow
      g.fillStyle(NEON.ENEMY_SPECIAL, 0.12);
      g.fillCircle(cx, cy, 14);
      // Body diamond
      g.fillStyle(TEX.ENEMY_SPECIAL_SHELL);
      g.fillTriangle(cx, 1, 1, cy, cx, s - 1);
      g.fillTriangle(cx, 1, s - 1, cy, cx, s - 1);
      g.fillStyle(NEON.ENEMY_SPECIAL);
      g.fillTriangle(cx, 4, 4, cy, cx, s - 4);
      g.fillTriangle(cx, 4, s - 4, cy, cx, s - 4);
      // Inner core
      g.fillStyle(NEON.PROJECTILE, 0.4);
      g.fillCircle(cx, cy, 4);
      g.fillStyle(TEX.ENEMY_SPECIAL_CORE);
      g.fillCircle(cx, cy, 2);
      // Outline
      g.lineStyle(1, TEX.ENEMY_SPECIAL_CORE, 0.7);
      g.moveTo(cx, 1);
      g.lineTo(s - 1, cy);
      g.lineTo(cx, s - 1);
      g.lineTo(1, cy);
      g.closePath();
      g.strokePath();
      g.generateTexture('enemy_diamond', s, s);
      g.destroy();
    }

    // Elite/Boss — gold hexagon with inner hex pattern
    if (!this.has(scene, 'enemy_hexagon')) {
      const s = 32;
      const g = scene.add.graphics();
      const cx = s / 2,
        cy = s / 2;

      const hexPoints = (r: number) => {
        const pts: { x: number; y: number }[] = [];
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI / 3) * i - Math.PI / 6;
          pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
        }
        return pts;
      };

      // Glow
      g.fillStyle(NEON.ENEMY_ELITE, 0.12);
      g.fillCircle(cx, cy, 16);
      // Outer hex
      g.fillStyle(TEX.ENEMY_ELITE_SHELL);
      g.fillPoints(hexPoints(15), true);
      // Inner hex
      g.fillStyle(NEON.ENEMY_ELITE);
      g.fillPoints(hexPoints(12), true);
      // Core hex
      g.fillStyle(TEX.ENEMY_ELITE_SHELL);
      g.fillPoints(hexPoints(6), true);
      // Center dot
      g.fillStyle(NEON.PROJECTILE, 0.7);
      g.fillCircle(cx, cy, 2);
      // Outline
      g.lineStyle(1, TEX.ENEMY_ELITE_OUTLINE, 0.7);
      const outerPts = hexPoints(15);
      g.moveTo(outerPts[0].x, outerPts[0].y);
      for (let i = 1; i < 6; i++) {
        g.lineTo(outerPts[i].x, outerPts[i].y);
      }
      g.closePath();
      g.strokePath();
      g.generateTexture('enemy_hexagon', s, s);
      g.destroy();
    }

    // Shooter — red diamond with crosshair detail
    if (!this.has(scene, 'enemy_shooter')) {
      const s = 28;
      const g = scene.add.graphics();
      const cx = s / 2,
        cy = s / 2;
      // Glow
      g.fillStyle(NEON.ENEMY_SPECIAL, 0.12);
      g.fillCircle(cx, cy, 14);
      // Body diamond
      g.fillStyle(TEX.ENEMY_SHOOTER_SHELL);
      g.fillTriangle(cx, 1, 1, cy, cx, s - 1);
      g.fillTriangle(cx, 1, s - 1, cy, cx, s - 1);
      g.fillStyle(TEX.ENEMY_SHOOTER_BODY);
      g.fillTriangle(cx, 4, 4, cy, cx, s - 4);
      g.fillTriangle(cx, 4, s - 4, cy, cx, s - 4);
      // Crosshair
      g.lineStyle(1, TEX.ENEMY_SHOOTER_CROSS, 0.8);
      g.strokeCircle(cx, cy, 5);
      g.beginPath();
      g.moveTo(cx, cy - 8);
      g.lineTo(cx, cy + 8);
      g.moveTo(cx - 8, cy);
      g.lineTo(cx + 8, cy);
      g.strokePath();
      // Outline
      g.lineStyle(1, TEX.ENEMY_SHOOTER_OUTLINE, 0.7);
      g.beginPath();
      g.moveTo(cx, 1);
      g.lineTo(s - 1, cy);
      g.lineTo(cx, s - 1);
      g.lineTo(1, cy);
      g.closePath();
      g.strokePath();
      g.generateTexture('enemy_shooter', s, s);
      g.destroy();
    }

    // Teleporter — gold diamond with phase lines
    if (!this.has(scene, 'enemy_teleporter')) {
      const s = 26;
      const g = scene.add.graphics();
      const cx = s / 2,
        cy = s / 2;
      // Glow
      g.fillStyle(NEON.ENEMY_ELITE, 0.15);
      g.fillCircle(cx, cy, 13);
      // Body diamond
      g.fillStyle(TEX.ENEMY_ELITE_SHELL);
      g.fillTriangle(cx, 2, 2, cy, cx, s - 2);
      g.fillTriangle(cx, 2, s - 2, cy, cx, s - 2);
      g.fillStyle(NEON.ENEMY_ELITE);
      g.fillTriangle(cx, 5, 5, cy, cx, s - 5);
      g.fillTriangle(cx, 5, s - 5, cy, cx, s - 5);
      // Phase lines (horizontal dashes)
      g.lineStyle(1, NEON.PROJECTILE, 0.5);
      g.beginPath();
      g.moveTo(cx - 6, cy - 3);
      g.lineTo(cx + 6, cy - 3);
      g.moveTo(cx - 4, cy + 3);
      g.lineTo(cx + 4, cy + 3);
      g.strokePath();
      // Core
      g.fillStyle(NEON.PROJECTILE, 0.7);
      g.fillCircle(cx, cy, 3);
      // Outline
      g.lineStyle(1, TEX.ENEMY_ELITE_OUTLINE, 0.7);
      g.beginPath();
      g.moveTo(cx, 2);
      g.lineTo(s - 2, cy);
      g.lineTo(cx, s - 2);
      g.lineTo(2, cy);
      g.closePath();
      g.strokePath();
      g.generateTexture('enemy_teleporter', s, s);
      g.destroy();
    }
  }

  // === BOSS TEXTURES ===
  private static generateBossTextures(scene: Phaser.Scene): void {
    // Stage 1 Boss — gold double hexagon with crown
    if (!this.has(scene, 'boss_hex')) {
      const s = 48;
      const g = scene.add.graphics();
      const cx = s / 2,
        cy = s / 2;

      const hexPoints = (r: number) => {
        const pts: { x: number; y: number }[] = [];
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI / 3) * i - Math.PI / 6;
          pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
        }
        return pts;
      };

      // Glow
      g.fillStyle(NEON.ENEMY_ELITE, 0.15);
      g.fillCircle(cx, cy, 24);
      // Outer hex
      g.fillStyle(TEX.ENEMY_ELITE_SHELL);
      g.fillPoints(hexPoints(22), true);
      // Inner hex
      g.fillStyle(NEON.ENEMY_ELITE);
      g.fillPoints(hexPoints(18), true);
      // Core hex
      g.fillStyle(TEX.ENEMY_ELITE_SHELL);
      g.fillPoints(hexPoints(10), true);
      // Crown (3 triangles on top)
      g.fillStyle(NEON.ENEMY_ELITE);
      g.fillTriangle(cx - 10, cy - 18, cx - 6, cy - 26, cx - 2, cy - 18);
      g.fillTriangle(cx - 4, cy - 18, cx, cy - 30, cx + 4, cy - 18);
      g.fillTriangle(cx + 2, cy - 18, cx + 6, cy - 26, cx + 10, cy - 18);
      // Center eye
      g.fillStyle(NEON.PROJECTILE, 0.8);
      g.fillCircle(cx, cy, 4);
      g.fillStyle(NEON.ENEMY_ELITE);
      g.fillCircle(cx, cy, 2);
      // Outline
      g.lineStyle(2, TEX.ENEMY_ELITE_OUTLINE, 0.9);
      const outerPts = hexPoints(22);
      g.moveTo(outerPts[0].x, outerPts[0].y);
      for (let i = 1; i < 6; i++) g.lineTo(outerPts[i].x, outerPts[i].y);
      g.closePath();
      g.strokePath();
      g.generateTexture('boss_hex', s, s);
      g.destroy();
    }

    // Stage 2 Boss — pink diamond with orbital ring and eye
    if (!this.has(scene, 'boss_diamond')) {
      const s = 44;
      const g = scene.add.graphics();
      const cx = s / 2,
        cy = s / 2;

      // Glow
      g.fillStyle(NEON.ENEMY_SPECIAL, 0.15);
      g.fillCircle(cx, cy, 22);
      // Orbital ring
      g.lineStyle(2, NEON.ENEMY_SPECIAL, 0.5);
      g.strokeCircle(cx, cy, 20);
      // Body diamond
      g.fillStyle(TEX.ENEMY_SPECIAL_SHELL);
      g.fillTriangle(cx, 2, 2, cy, cx, s - 2);
      g.fillTriangle(cx, 2, s - 2, cy, cx, s - 2);
      g.fillStyle(NEON.ENEMY_SPECIAL);
      g.fillTriangle(cx, 6, 6, cy, cx, s - 6);
      g.fillTriangle(cx, 6, s - 6, cy, cx, s - 6);
      // Inner eye
      g.fillStyle(TEX.BOSS_DIAMOND_EYE_BG);
      g.fillCircle(cx, cy, 7);
      g.fillStyle(TEX.ENEMY_SPECIAL_CORE);
      g.fillCircle(cx, cy, 4);
      g.fillStyle(NEON.PROJECTILE, 0.6);
      g.fillCircle(cx - 1, cy - 1, 2);
      // Outline
      g.lineStyle(2, TEX.ENEMY_SPECIAL_CORE, 0.9);
      g.moveTo(cx, 2);
      g.lineTo(s - 2, cy);
      g.lineTo(cx, s - 2);
      g.lineTo(2, cy);
      g.closePath();
      g.strokePath();
      g.generateTexture('boss_diamond', s, s);
      g.destroy();
    }

    // Stage 3 Boss — purple armored rectangle with energy core
    if (!this.has(scene, 'boss_rect')) {
      const s = 52;
      const g = scene.add.graphics();

      // Glow
      g.fillStyle(NEON.ENEMY_TANK, 0.12);
      g.fillCircle(s / 2, s / 2, 26);
      // Outer armor
      g.fillStyle(TEX.BOSS_RECT_ARMOR);
      g.fillRect(0, 0, s, s);
      // Inner plate
      g.fillStyle(NEON.ENEMY_TANK);
      g.fillRect(4, 4, s - 8, s - 8);
      // Armor cross
      g.fillStyle(TEX.BOSS_RECT_ARMOR);
      g.fillRect(s / 2 - 2, 4, 4, s - 8);
      g.fillRect(4, s / 2 - 2, s - 8, 4);
      // Corner bolts
      g.fillStyle(TEX.ENEMY_TANK_CORE);
      g.fillCircle(8, 8, 3);
      g.fillCircle(s - 8, 8, 3);
      g.fillCircle(8, s - 8, 3);
      g.fillCircle(s - 8, s - 8, 3);
      // Energy core
      g.fillStyle(NEON.PROJECTILE, 0.6);
      g.fillCircle(s / 2, s / 2, 8);
      g.fillStyle(TEX.ENEMY_TANK_CORE);
      g.fillCircle(s / 2, s / 2, 5);
      g.fillStyle(NEON.PROJECTILE, 0.8);
      g.fillCircle(s / 2, s / 2, 2);
      // Outline
      g.lineStyle(2, TEX.ENEMY_TANK_CORE, 0.9);
      g.strokeRect(0, 0, s, s);
      g.generateTexture('boss_rect', s, s);
      g.destroy();
    }
  }

  // === PROJECTILES ===
  private static generateProjectileTextures(scene: Phaser.Scene): void {
    // Bullet — elongated with glow
    if (!this.has(scene, 'projectile_bullet')) {
      const g = scene.add.graphics();
      // Glow
      g.fillStyle(NEON.PROJECTILE, 0.2);
      g.fillCircle(6, 6, 6);
      // Core
      g.fillStyle(NEON.UI_ACCENT);
      g.fillCircle(6, 6, 4);
      g.fillStyle(NEON.PROJECTILE, 0.9);
      g.fillCircle(6, 6, 2);
      g.generateTexture('projectile_bullet', 12, 12);
      g.destroy();
    }

    // Laser — bright beam line
    if (!this.has(scene, 'projectile_laser')) {
      const g = scene.add.graphics();
      // Outer glow
      g.fillStyle(NEON.UI_ACCENT, 0.3);
      g.fillRect(0, 0, 6, 40);
      // Core beam
      g.fillStyle(NEON.PROJECTILE, 0.95);
      g.fillRect(1, 0, 4, 40);
      // Bright center
      g.fillStyle(NEON.PROJECTILE);
      g.fillRect(2, 0, 2, 40);
      g.generateTexture('projectile_laser', 6, 40);
      g.destroy();
    }

    // Shuriken — 4-pointed star
    if (!this.has(scene, 'projectile_shuriken')) {
      const s = 16;
      const g = scene.add.graphics();
      const cx = s / 2,
        cy = s / 2;
      g.fillStyle(NEON.GOLD, 0.2);
      g.fillCircle(cx, cy, 8);
      g.fillStyle(NEON.GOLD);
      // 4-pointed star
      g.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI / 4) * i - Math.PI / 2;
        const r = i % 2 === 0 ? 7 : 3;
        const px = cx + Math.cos(a) * r;
        const py = cy + Math.sin(a) * r;
        if (i === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.closePath();
      g.fillPath();
      g.fillStyle(NEON.PROJECTILE, 0.6);
      g.fillCircle(cx, cy, 2);
      g.generateTexture('projectile_shuriken', s, s);
      g.destroy();
    }

    // Rapid fire — small bright circle
    if (!this.has(scene, 'projectile_rapid')) {
      const g = scene.add.graphics();
      g.fillStyle(NEON.XP_BAR, 0.3);
      g.fillCircle(4, 4, 4);
      g.fillStyle(NEON.XP_BAR);
      g.fillCircle(4, 4, 2);
      g.generateTexture('projectile_rapid', 8, 8);
      g.destroy();
    }

    // Missile — elongated arrow/rocket with exhaust trail
    if (!this.has(scene, 'projectile_missile')) {
      const g = scene.add.graphics();
      const w = 24,
        h = 10;
      // Exhaust glow
      g.fillStyle(NEON.HEALTH, 0.3);
      g.fillCircle(4, h / 2, 5);
      // Body
      g.fillStyle(TEX.MISSILE_BODY);
      g.fillRect(4, 1, 14, h - 2);
      // Nose cone
      g.fillStyle(NEON.ENEMY_BASIC);
      g.beginPath();
      g.moveTo(w, h / 2);
      g.lineTo(18, 0);
      g.lineTo(18, h);
      g.closePath();
      g.fillPath();
      // Fins
      g.fillStyle(TEX.MISSILE_FINS);
      g.fillTriangle(4, 0, 8, 0, 4, -2 + h / 2);
      g.fillTriangle(4, h, 8, h, 4, 2 + h / 2);
      g.generateTexture('projectile_missile', w, h);
      g.destroy();
    }

    // Napalm — fireball projectile (flies to target before zone)
    if (!this.has(scene, 'projectile_napalm')) {
      const s = 16;
      const g = scene.add.graphics();
      // Outer flame glow
      g.fillStyle(TEX.NAPALM_STROKE, 0.3);
      g.fillCircle(s / 2, s / 2, 8);
      // Inner fire
      g.fillStyle(TEX.NAPALM_FILL, 0.8);
      g.fillCircle(s / 2, s / 2, 5);
      // Hot core
      g.fillStyle(TEX.NAPALM_CORE);
      g.fillCircle(s / 2, s / 2, 3);
      g.generateTexture('projectile_napalm', s, s);
      g.destroy();
    }
  }

  // === PARTICLES ===
  private static generateParticleTextures(scene: Phaser.Scene): void {
    if (!this.has(scene, 'particle_square')) {
      const g = scene.add.graphics();
      g.fillStyle(NEON.PROJECTILE);
      g.fillRect(0, 0, 6, 6);
      g.generateTexture('particle_square', 6, 6);
      g.destroy();
    }

    if (!this.has(scene, 'particle_glow')) {
      const g = scene.add.graphics();
      g.fillStyle(NEON.PROJECTILE, 0.3);
      g.fillCircle(12, 12, 12);
      g.fillStyle(NEON.PROJECTILE, 0.6);
      g.fillCircle(12, 12, 8);
      g.fillStyle(NEON.PROJECTILE, 0.9);
      g.fillCircle(12, 12, 4);
      g.generateTexture('particle_glow', 24, 24);
      g.destroy();
    }
  }

  // === PURIFY PARTICLES ===
  private static generatePurifyTextures(scene: Phaser.Scene): void {
    // Purify burst — soft glow circle (used for purification particles)
    if (!this.has(scene, 'particle_purify')) {
      const s = 16;
      const g = scene.add.graphics();
      g.fillStyle(NEON.PROJECTILE, 0.2);
      g.fillCircle(s / 2, s / 2, s / 2);
      g.fillStyle(NEON.PROJECTILE, 0.5);
      g.fillCircle(s / 2, s / 2, (s / 2) * 0.6);
      g.fillStyle(NEON.PROJECTILE, 0.9);
      g.fillCircle(s / 2, s / 2, (s / 2) * 0.3);
      g.generateTexture('particle_purify', s, s);
      g.destroy();
    }
  }

  // === UI ===
  private static generateUITextures(scene: Phaser.Scene): void {
    if (!this.has(scene, 'btn_primary')) {
      const btn = scene.add.graphics();
      btn.fillStyle(RETRO.borderColor);
      btn.fillRoundedRect(0, 0, 300, 70, RETRO.radius);
      btn.fillStyle(NEON.UI_ACCENT);
      btn.fillRoundedRect(
        RETRO.borderWidth,
        RETRO.borderWidth,
        300 - RETRO.borderWidth * 2,
        70 - RETRO.borderWidth * 2,
        RETRO.radius,
      );
      btn.generateTexture('btn_primary', 300, 70);
      btn.destroy();
    }

    if (!this.has(scene, 'btn_secondary')) {
      const btn2 = scene.add.graphics();
      btn2.fillStyle(RETRO.borderColor);
      btn2.fillRoundedRect(0, 0, 300, 70, RETRO.radius);
      btn2.fillStyle(RETRO.panelBg);
      btn2.fillRoundedRect(
        RETRO.borderWidth,
        RETRO.borderWidth,
        300 - RETRO.borderWidth * 2,
        70 - RETRO.borderWidth * 2,
        RETRO.radius,
      );
      btn2.generateTexture('btn_secondary', 300, 70);
      btn2.destroy();
    }
  }
}
