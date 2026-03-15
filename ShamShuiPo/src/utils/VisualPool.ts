import Phaser from "phaser";

export class CirclePool {
  private pool: Phaser.GameObjects.Arc[] = [];
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  acquire(
    x: number,
    y: number,
    radius: number,
    color: number,
    alpha?: number,
  ): Phaser.GameObjects.Arc {
    let circle = this.pool.pop();
    if (!circle) {
      circle = this.scene.add.circle(x, y, radius, color, alpha ?? 1);
    } else {
      circle.setPosition(x, y);
      circle.setRadius(radius);
      circle.setFillStyle(color, alpha ?? 1);
      circle
        .setActive(true)
        .setVisible(true)
        .setAlpha(alpha ?? 1);
      circle.setScale(1);
      circle.setDepth(0);
    }
    return circle;
  }

  release(circle: Phaser.GameObjects.Arc): void {
    circle.setActive(false).setVisible(false);
    this.pool.push(circle);
  }

  destroy(): void {
    this.pool.forEach((c) => c.destroy());
    this.pool.length = 0;
  }
}

export class TextPool {
  private pool: Phaser.GameObjects.Text[] = [];
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  acquire(
    x: number,
    y: number,
    text: string,
    style: Phaser.Types.GameObjects.Text.TextStyle,
  ): Phaser.GameObjects.Text {
    let txt = this.pool.pop();
    if (!txt) {
      txt = this.scene.add.text(x, y, text, style);
    } else {
      txt.setPosition(x, y);
      txt.setText(text);
      txt.setStyle(style);
      txt.setActive(true).setVisible(true).setAlpha(1);
      txt.setScale(1);
      txt.setDepth(0);
    }
    return txt;
  }

  release(txt: Phaser.GameObjects.Text): void {
    txt.setActive(false).setVisible(false);
    this.pool.push(txt);
  }

  destroy(): void {
    this.pool.forEach((t) => t.destroy());
    this.pool.length = 0;
  }
}
