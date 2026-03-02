import Phaser from 'phaser';
import { BALANCE } from '../config/balance';

/**
 * Player turret — fixed at the bottom, slides left/right only.
 * The BASE wall has HP; the player itself cannot be killed directly.
 */
export class Player extends Phaser.GameObjects.Container {
  public moveSpeed: number;
  public critChance = 0;
  public critDamage: number;
  public damageMultiplier = 1;
  public attackSpeedMultiplier = 1;

  private sprite: Phaser.GameObjects.Sprite;

  constructor(scene: Phaser.Scene, x: number) {
    super(scene, x, BALANCE.PLAYER.baseY);

    this.moveSpeed = BALANCE.PLAYER.baseMoveSpeed;
    this.critDamage = BALANCE.COMBAT.critMultiplier;

    const ingameKey = 'char_hai_ingame';
    const charKey = scene.textures.exists(ingameKey) ? ingameKey : 'player';
    this.sprite = scene.add.sprite(0, 0, charKey);
    // Scale: 48px source → 96px display (ingame), 128px → 96px (portrait fallback)
    const targetSize = 96;
    const charTexW = this.sprite.texture.getSourceImage().width;
    if (charTexW > 0 && charTexW !== targetSize) {
      this.sprite.setScale(targetSize / charTexW);
    }
    this.add(this.sprite);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(14);
    body.setOffset(-14, -14);
    body.setCollideWorldBounds(true);

    // Lock vertical movement — turret only moves horizontally
    body.allowGravity = false;
    body.setMaxVelocityY(0);
  }

  /** Rotate sprite to point toward a world position (visual only). */
  aimAt(targetX: number, targetY: number): void {
    const angle = Math.atan2(targetY - this.y, targetX - this.x);
    this.sprite.setRotation(angle + Math.PI / 2); // sprite faces up by default
  }

  /** Reset aim to point straight up when no target. */
  aimUp(): void {
    this.sprite.setRotation(0);
  }
}
