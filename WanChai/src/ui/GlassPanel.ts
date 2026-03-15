import Phaser from 'phaser';
import { RETRO } from '../config/colors';

export interface GlassPanelConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  alpha?: number; // ignored (kept for compat), panels are opaque now
  radius?: number;
  borderAlpha?: number; // ignored
  depth?: number;
  variant?: 'light' | 'dark';
}

/**
 * Retro-style opaque panel with thick border and bevel.
 * Pokemon dialog box aesthetic.
 * Exported as both createRetroPanel and createGlassPanel (backwards compat).
 */
export function createRetroPanel(scene: Phaser.Scene, config: GlassPanelConfig): Phaser.GameObjects.Container {
  const { x, y, width, height, radius = RETRO.radius, depth = 0, variant = 'light' } = config;

  const g = scene.add.graphics();
  const bgColor = variant === 'dark' ? RETRO.panelBgDark : RETRO.panelBg;
  const hw = width / 2;
  const hh = height / 2;

  // 1. Drop shadow (2px offset)
  g.fillStyle(RETRO.shadowColor);
  g.fillRoundedRect(-hw + 2, -hh + 2, width, height, radius);

  // 2. Opaque background fill
  g.fillStyle(bgColor);
  g.fillRoundedRect(-hw, -hh, width, height, radius);

  // 3. Thick border
  g.lineStyle(RETRO.borderWidth, RETRO.borderColor, 1.0);
  g.strokeRoundedRect(-hw, -hh, width, height, radius);

  // 4. Inner bevel — top-left highlight
  g.lineStyle(1, RETRO.bevelLight, 0.5);
  g.lineBetween(-hw + 4, -hh + 4, hw - 4, -hh + 4); // top
  g.lineBetween(-hw + 4, -hh + 4, -hw + 4, hh - 4); // left

  // 5. Inner bevel — bottom-right shadow
  g.lineStyle(1, RETRO.bevelDark, 0.3);
  g.lineBetween(-hw + 4, hh - 4, hw - 4, hh - 4); // bottom
  g.lineBetween(hw - 4, -hh + 4, hw - 4, hh - 4); // right

  const container = scene.add.container(x, y, [g]).setDepth(depth);
  return container;
}
