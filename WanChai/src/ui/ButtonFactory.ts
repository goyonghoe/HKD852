import Phaser from 'phaser';
import { RETRO, UI_COLORS } from '../config/colors';
import { VISUAL } from '../config/balance';

export interface ButtonConfig {
  x: number;
  y: number;
  width?: number;
  height?: number;
  label: string;
  fontSize?: string;
  variant?: 'primary' | 'secondary';
  depth?: number;
  onClick: () => void;
}

/**
 * Retro-style button with thick border and Pokemon selector cursor.
 */
export function createButton(
  scene: Phaser.Scene,
  config: ButtonConfig
): Phaser.GameObjects.Container {
  const {
    x,
    y,
    width = VISUAL.UI.BUTTON_MIN_WIDTH,
    height = VISUAL.UI.BUTTON_HEIGHT,
    label,
    fontSize = '22px',
    variant = 'primary',
    depth = 100,
    onClick,
  } = config;

  const container = scene.add.container(x, y).setDepth(depth);
  const hw = width / 2;
  const hh = height / 2;

  // Background
  const bg = scene.add.graphics();

  if (variant === 'primary') {
    // Drop shadow
    bg.fillStyle(RETRO.shadowColor);
    bg.fillRoundedRect(-hw + 2, -hh + 2, width, height, RETRO.radius);
    // Accent fill
    bg.fillStyle(UI_COLORS.accent);
    bg.fillRoundedRect(-hw, -hh, width, height, RETRO.radius);
    // Border
    bg.lineStyle(RETRO.borderWidth, RETRO.borderColor, 1.0);
    bg.strokeRoundedRect(-hw, -hh, width, height, RETRO.radius);
    // Top bevel
    bg.lineStyle(1, 0xf87058, 0.5);
    bg.lineBetween(-hw + 4, -hh + 4, hw - 4, -hh + 4);
  } else {
    // Drop shadow
    bg.fillStyle(RETRO.shadowColor);
    bg.fillRoundedRect(-hw + 2, -hh + 2, width, height, RETRO.radius);
    // Panel fill
    bg.fillStyle(RETRO.panelBg);
    bg.fillRoundedRect(-hw, -hh, width, height, RETRO.radius);
    // Border
    bg.lineStyle(RETRO.borderWidth, RETRO.borderColor, 1.0);
    bg.strokeRoundedRect(-hw, -hh, width, height, RETRO.radius);
    // Inner bevel
    bg.lineStyle(1, RETRO.bevelLight, 0.4);
    bg.lineBetween(-hw + 4, -hh + 4, hw - 4, -hh + 4);
    bg.lineBetween(-hw + 4, -hh + 4, -hw + 4, hh - 4);
  }

  const textColor = variant === 'primary' ? '#ffffff' : '#e2e8f0';
  const text = scene.add
    .text(0, 0, label, {
      fontSize,
      color: textColor,
      fontFamily: 'monospace',
      fontStyle: 'bold',
    })
    .setOrigin(0.5);

  // Pokemon selector arrow (▶) — shown on hover
  const cursor = scene.add
    .text(-hw + 14, 0, '\u25B6', {
      fontSize: '16px',
      color: textColor,
      fontFamily: 'monospace',
    })
    .setOrigin(0.5)
    .setVisible(false);

  container.add([bg, text, cursor]);

  // Hit area
  const hitZone = scene.add
    .zone(0, 0, width, height)
    .setInteractive({ useHandCursor: true });

  hitZone.on('pointerover', () => {
    cursor.setVisible(true);
    container.setScale(1.05);
  });

  hitZone.on('pointerout', () => {
    cursor.setVisible(false);
    container.setScale(1);
  });

  hitZone.on('pointerdown', () => {
    scene.tweens.add({
      targets: container,
      scaleX: 0.95,
      scaleY: 0.95,
      duration: VISUAL.ANIM.BUTTON_PRESS,
      yoyo: true,
      onComplete: () => onClick(),
    });
  });

  container.add(hitZone);
  return container;
}
