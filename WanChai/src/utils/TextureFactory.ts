import Phaser from 'phaser';
import { NEON, RETRO } from '../config/colors';

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
    this.generateProjectileTextures(scene);
    this.generateParticleTextures(scene);
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
    g.fillStyle(0x005544);
    g.fillTriangle(s / 2, 2, 3, s - 4, s - 3, s - 4);
    // Inner hull
    g.fillStyle(0x008866);
    g.fillTriangle(s / 2, 6, 7, s - 7, s - 7, s - 7);

    // Barrel (center stripe)
    g.fillStyle(NEON.PLAYER);
    g.fillRect(s / 2 - 2, 0, 4, s / 2);

    // Engine glow (bottom)
    g.fillStyle(0x00ffcc, 0.8);
    g.fillCircle(s / 2, s - 6, 4);
    g.fillStyle(0xffffff, 0.5);
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
      g.fillStyle(0x4488ff, 0.15);
      g.fillCircle(s / 2, s / 2, 12);
      g.fillStyle(0x224488);
      g.fillRect(s / 2 - 4, 2, 8, s - 4);
      g.fillStyle(0x4488ff);
      g.fillRect(s / 2 - 6, s / 2 - 6, 12, 12);
      g.fillStyle(0x88ccff);
      g.fillRect(s / 2 - 3, s / 2 - 3, 6, 6);
      g.lineStyle(1, 0x4488ff, 0.8);
      g.strokeCircle(s / 2, s / 2, 11);
      g.generateTexture('ally_sniper', s, s);
      g.destroy();
    }

    // Spread ally — orange multi-barrel turret
    if (!this.has(scene, 'ally_spread')) {
      const s = 28;
      const g = scene.add.graphics();
      g.fillStyle(0xff8844, 0.15);
      g.fillCircle(s / 2, s / 2, 12);
      // Three barrels
      g.fillStyle(0x884422);
      g.fillRect(s / 2 - 8, 2, 4, s / 2);
      g.fillRect(s / 2 - 2, 1, 4, s / 2);
      g.fillRect(s / 2 + 4, 2, 4, s / 2);
      g.fillStyle(0xff8844);
      g.fillRect(s / 2 - 6, s / 2 - 6, 12, 12);
      g.fillStyle(0xffcc88);
      g.fillRect(s / 2 - 3, s / 2 - 3, 6, 6);
      g.lineStyle(1, 0xff8844, 0.8);
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
      g.fillStyle(0x881111);
      g.fillCircle(s / 2, s / 2, 10);
      g.fillStyle(NEON.ENEMY_BASIC);
      g.fillCircle(s / 2, s / 2, 8);
      // Core eye
      g.fillStyle(0x220000);
      g.fillCircle(s / 2, s / 2, 4);
      g.fillStyle(0xff8888);
      g.fillCircle(s / 2, s / 2, 2);
      // Outline
      g.lineStyle(1, 0xff8888, 0.6);
      g.strokeCircle(s / 2, s / 2, 10);
      g.generateTexture('enemy_circle', s, s);
      g.destroy();
    }

    // Fast — orange arrow/chevron
    if (!this.has(scene, 'enemy_triangle')) {
      const s = 24;
      const g = scene.add.graphics();
      // Body
      g.fillStyle(0x663300);
      g.fillTriangle(s / 2, 1, 1, s - 2, s - 1, s - 2);
      g.fillStyle(NEON.ENEMY_FAST);
      g.fillTriangle(s / 2, 4, 4, s - 4, s - 4, s - 4);
      // Speed lines
      g.lineStyle(1, 0xffcc66, 0.6);
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
      g.fillStyle(0x331166);
      g.fillRect(0, 0, s, s);
      // Inner plate
      g.fillStyle(NEON.ENEMY_TANK);
      g.fillRect(3, 3, s - 6, s - 6);
      // Armor cross
      g.fillStyle(0x331166);
      g.fillRect(s / 2 - 1, 3, 2, s - 6);
      g.fillRect(3, s / 2 - 1, s - 6, 2);
      // Core
      g.fillStyle(0xcc88ff);
      g.fillRect(s / 2 - 3, s / 2 - 3, 6, 6);
      // Outline
      g.lineStyle(1, 0xcc88ff, 0.6);
      g.strokeRect(0, 0, s, s);
      g.generateTexture('enemy_rect', s, s);
      g.destroy();
    }

    // Special — pink diamond with pulsing core
    if (!this.has(scene, 'enemy_diamond')) {
      const s = 28;
      const g = scene.add.graphics();
      const cx = s / 2, cy = s / 2;
      // Glow
      g.fillStyle(NEON.ENEMY_SPECIAL, 0.12);
      g.fillCircle(cx, cy, 14);
      // Body diamond
      g.fillStyle(0x661144);
      g.fillTriangle(cx, 1, 1, cy, cx, s - 1);
      g.fillTriangle(cx, 1, s - 1, cy, cx, s - 1);
      g.fillStyle(NEON.ENEMY_SPECIAL);
      g.fillTriangle(cx, 4, 4, cy, cx, s - 4);
      g.fillTriangle(cx, 4, s - 4, cy, cx, s - 4);
      // Inner core
      g.fillStyle(0xffffff, 0.4);
      g.fillCircle(cx, cy, 4);
      g.fillStyle(0xff88cc);
      g.fillCircle(cx, cy, 2);
      // Outline
      g.lineStyle(1, 0xff88cc, 0.7);
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
      const cx = s / 2, cy = s / 2;

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
      g.fillStyle(0x665500);
      g.fillPoints(hexPoints(15), true);
      // Inner hex
      g.fillStyle(NEON.ENEMY_ELITE);
      g.fillPoints(hexPoints(12), true);
      // Core hex
      g.fillStyle(0x665500);
      g.fillPoints(hexPoints(6), true);
      // Center dot
      g.fillStyle(0xffffff, 0.7);
      g.fillCircle(cx, cy, 2);
      // Outline
      g.lineStyle(1, 0xffee88, 0.7);
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

    // Orbit — ring shape
    if (!this.has(scene, 'projectile_orbit')) {
      const g = scene.add.graphics();
      // Glow
      g.fillStyle(NEON.UI_ACCENT, 0.2);
      g.fillCircle(8, 8, 8);
      // Ring
      g.lineStyle(3, NEON.UI_ACCENT, 0.9);
      g.strokeCircle(8, 8, 6);
      // Center dot
      g.fillStyle(NEON.PROJECTILE, 0.8);
      g.fillCircle(8, 8, 2);
      g.generateTexture('projectile_orbit', 16, 16);
      g.destroy();
    }
  }

  // === PARTICLES ===
  private static generateParticleTextures(scene: Phaser.Scene): void {
    if (!this.has(scene, 'particle_square')) {
      const g = scene.add.graphics();
      g.fillStyle(0xffffff);
      g.fillRect(0, 0, 6, 6);
      g.generateTexture('particle_square', 6, 6);
      g.destroy();
    }

    if (!this.has(scene, 'particle_glow')) {
      const g = scene.add.graphics();
      g.fillStyle(0xffffff, 0.3);
      g.fillCircle(12, 12, 12);
      g.fillStyle(0xffffff, 0.6);
      g.fillCircle(12, 12, 8);
      g.fillStyle(0xffffff, 0.9);
      g.fillCircle(12, 12, 4);
      g.generateTexture('particle_glow', 24, 24);
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
      btn.fillRoundedRect(RETRO.borderWidth, RETRO.borderWidth, 300 - RETRO.borderWidth * 2, 70 - RETRO.borderWidth * 2, RETRO.radius);
      btn.generateTexture('btn_primary', 300, 70);
      btn.destroy();
    }

    if (!this.has(scene, 'btn_secondary')) {
      const btn2 = scene.add.graphics();
      btn2.fillStyle(RETRO.borderColor);
      btn2.fillRoundedRect(0, 0, 300, 70, RETRO.radius);
      btn2.fillStyle(RETRO.panelBg);
      btn2.fillRoundedRect(RETRO.borderWidth, RETRO.borderWidth, 300 - RETRO.borderWidth * 2, 70 - RETRO.borderWidth * 2, RETRO.radius);
      btn2.generateTexture('btn_secondary', 300, 70);
      btn2.destroy();
    }
  }
}
