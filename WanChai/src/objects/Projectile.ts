import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/game-config';

export class Projectile extends Phaser.Physics.Arcade.Sprite {
  public damage = 0;
  public piercing = 0;
  public hitCount = 0;
  public weaponId = '';
  public lifeMs = 0;
  public isCrit = false;
  public spinRate = 0; // radians/s, 0 = no spin (used by shuriken)
  private spawnTime = 0;

  // Homing properties
  public homingTarget: Phaser.GameObjects.GameObject | null = null;
  public homingTurnRate = 0; // radians per second
  public homingSpeed = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'projectile_bullet');
  }

  fire(
    x: number,
    y: number,
    vx: number,
    vy: number,
    damage: number,
    piercing: number,
    weaponId: string,
    texture = 'projectile_bullet',
    isCrit = false,
  ): void {
    if (this.scene.textures.exists(texture)) {
      this.setTexture(texture);
    }
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.reset(x, y);
    this.setVelocity(vx, vy);

    // Rotate to face direction
    this.setRotation(Math.atan2(vy, vx));

    this.damage = damage;
    this.piercing = piercing;
    this.hitCount = 0;
    this.weaponId = weaponId;
    this.isCrit = isCrit;
    this.spawnTime = this.scene.time.now;
    this.lifeMs = 5000;
    this.homingTarget = null;
    this.homingTurnRate = 0;
    this.homingSpeed = 0;
    this.spinRate = 0;
  }

  deactivate(): void {
    this.setActive(false);
    this.setVisible(false);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = false;
    this.setVelocity(0, 0);
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);

    if (!this.active) return;

    // Expired
    if (time - this.spawnTime > this.lifeMs) {
      this.deactivate();
      return;
    }

    // Spin rotation (shuriken)
    if (this.spinRate !== 0) {
      this.rotation += this.spinRate * (delta / 1000);
    }

    // Homing: steer toward target
    if (this.homingTarget && this.homingTarget.active && this.homingTurnRate > 0) {
      const target = this.homingTarget as Phaser.GameObjects.Sprite;
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const desiredAngle = Math.atan2(dy, dx);

      const body = this.body as Phaser.Physics.Arcade.Body;
      const currentAngle = Math.atan2(body.velocity.y, body.velocity.x);

      // Shortest rotation direction
      let diff = desiredAngle - currentAngle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;

      const maxTurn = this.homingTurnRate * (delta / 1000);
      const turn = Math.abs(diff) < maxTurn ? diff : Math.sign(diff) * maxTurn;
      const newAngle = currentAngle + turn;

      body.setVelocity(
        Math.cos(newAngle) * this.homingSpeed,
        Math.sin(newAngle) * this.homingSpeed,
      );
      this.setRotation(newAngle);
    }

    // Out of world bounds
    if (this.x < -100 || this.x > GAME_WIDTH + 100 || this.y < -100 || this.y > GAME_HEIGHT + 100) {
      this.deactivate();
    }
  }
}
