import Phaser from 'phaser';
import type { CritterDef } from '../config/critters';
import { resolveTexture } from '../config/atlas-manifest';

/**
 * Critter companion — orbits around the player, auto-fires active skill on cooldown.
 * Visual: small sprite circling the player with element-colored glow on skill activation.
 */
export class Critter extends Phaser.GameObjects.Container {
  public readonly def: CritterDef;

  private sprite: Phaser.GameObjects.Sprite;
  private orbitAngle = 0;
  public cooldownTimer: number;
  public skillActive = false;
  public skillTimer = 0;

  /** Shield bubble: remaining block count (for shieldBubble skill) */
  public shieldBlocksRemaining = 0;

  /** Regen stream: remaining ticks and timer */
  public regenTicksRemaining = 0;
  public regenTickTimer = 0;

  constructor(
    scene: Phaser.Scene,
    playerX: number,
    playerY: number,
    def: CritterDef,
    private orbitRadius: number,
    private orbitSpeed: number,
  ) {
    super(scene, playerX, playerY);
    this.def = def;
    this.cooldownTimer = def.cooldownMs * 0.5; // first skill fires faster

    const critterTex = resolveTexture(scene, def.spriteKey);
    const texKey = critterTex ? def.spriteKey : 'particle_glow';
    if (critterTex) {
      this.sprite = scene.add.sprite(0, 0, critterTex.texture, critterTex.frame);
    } else {
      this.sprite = scene.add.sprite(0, 0, texKey);
    }

    // Scale critter to 40px display (P11: smaller, clearer as companion)
    const critterDisplaySize = 40;
    const texW = this.sprite.texture.getSourceImage().width;
    if (texW > 0 && texW !== critterDisplaySize) {
      this.sprite.setScale(critterDisplaySize / texW);
    }
    this.setAlpha(0.8); // slightly transparent to not compete with player

    this.add(this.sprite);
    scene.add.existing(this);
    this.setDepth(90);
  }

  /**
   * Update orbit position and skill cooldown.
   * Returns true when skill should fire this frame.
   */
  updateOrbit(delta: number, playerX: number, playerY: number): boolean {
    // Orbit movement
    this.orbitAngle += this.orbitSpeed * (delta / 1000);
    const ox = playerX + Math.cos(this.orbitAngle) * this.orbitRadius;
    const oy = playerY + Math.sin(this.orbitAngle) * this.orbitRadius;
    this.setPosition(ox, oy);

    // Skill duration tracking
    if (this.skillActive) {
      this.skillTimer -= delta;
      if (this.skillTimer <= 0) {
        this.skillActive = false;
        this.skillTimer = 0;
      }
    }

    // Cooldown
    this.cooldownTimer -= delta;
    if (this.cooldownTimer <= 0) {
      this.cooldownTimer = this.def.cooldownMs;
      return true; // fire skill
    }

    return false;
  }

  /** Visual pulse when skill activates */
  flashSkill(color: number): void {
    this.sprite.setTint(color);
    this.scene.time.delayedCall(300, () => {
      this.sprite.clearTint();
    });
    // Scale pulse
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: this.sprite.scaleX * 1.5,
      scaleY: this.sprite.scaleY * 1.5,
      duration: 150,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
  }

  /** Activate a duration-based skill */
  activateSkill(): void {
    if (this.def.durationMs > 0) {
      this.skillActive = true;
      this.skillTimer = this.def.durationMs;
    }
  }

  /** Consume one shield block charge. Returns true if a block was consumed. */
  consumeShieldBlock(): boolean {
    if (this.shieldBlocksRemaining > 0) {
      this.shieldBlocksRemaining--;
      if (this.shieldBlocksRemaining <= 0) {
        this.skillActive = false;
        this.skillTimer = 0;
      }
      return true;
    }
    return false;
  }
}
