import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  create(): void {
    // No assets to load - everything is procedural
    this.scene.start("PrototypeMenuScene");
  }
}
