import Phaser from "phaser";

export class Threat extends Phaser.GameObjects.Container {
  public hp: number;
  public maxHp: number;
  public waveNum: number;
  public speed: number = 15; // pixels per second downward

  private triangle: Phaser.GameObjects.Graphics;
  private hpBar: Phaser.GameObjects.Graphics;
  private hpText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, waveNum: number) {
    super(scene, x, y);
    this.waveNum = waveNum;
    this.maxHp = 10 + waveNum * 8;
    this.hp = this.maxHp;
    this.speed = 12 + waveNum * 2;

    // Triangle shape
    this.triangle = scene.add.graphics();
    this.add(this.triangle);

    // HP bar
    this.hpBar = scene.add.graphics();
    this.add(this.hpBar);

    // HP text
    this.hpText = scene.add
      .text(0, -30, "", {
        fontSize: "11px",
        fontFamily: "monospace",
        color: "#ffffff",
      })
      .setOrigin(0.5);
    this.add(this.hpText);

    this.drawVisuals();
    scene.add.existing(this);
  }

  private drawVisuals(): void {
    const size = 18 + this.waveNum * 2;
    this.triangle.clear();
    // Glow
    this.triangle.fillStyle(0x8844aa, 0.2);
    this.triangle.fillTriangle(
      0,
      -size - 4,
      -size - 4,
      size + 4,
      size + 4,
      size + 4,
    );
    // Main shape
    this.triangle.fillStyle(0x6633aa, 0.9);
    this.triangle.fillTriangle(0, -size, -size, size, size, size);
    this.triangle.lineStyle(2, 0xaa66ff, 1);
    this.triangle.strokeTriangle(0, -size, -size, size, size, size);

    // HP bar
    this.hpBar.clear();
    const barWidth = 40;
    const barHeight = 4;
    const ratio = this.hp / this.maxHp;
    this.hpBar.fillStyle(0x333333, 0.8);
    this.hpBar.fillRect(-barWidth / 2, -size - 12, barWidth, barHeight);
    this.hpBar.fillStyle(ratio > 0.5 ? 0xaa66ff : 0xff4444, 1);
    this.hpBar.fillRect(-barWidth / 2, -size - 12, barWidth * ratio, barHeight);

    this.hpText.setText(`${this.hp}`);
    this.hpText.setY(-size - 18);
  }

  public takeDamage(amount: number): boolean {
    this.hp = Math.max(0, this.hp - amount);
    this.drawVisuals();
    if (this.hp <= 0) {
      this.flashAndDie();
      return true;
    }
    // Flash on hit
    this.triangle.clear();
    this.triangle.fillStyle(0xffffff, 0.8);
    const size = 18 + this.waveNum * 2;
    this.triangle.fillTriangle(0, -size, -size, size, size, size);
    this.scene.time.delayedCall(100, () => {
      if (this.active) this.drawVisuals();
    });
    return false;
  }

  private flashAndDie(): void {
    this.scene.time.delayedCall(150, () => {
      this.setActive(false);
      this.setVisible(false);
    });
  }

  public updateMovement(delta: number): void {
    this.y += this.speed * (delta / 1000);
  }
}
