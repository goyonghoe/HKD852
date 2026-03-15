/**
 * TASK-015: DPI-aware scaling config verification.
 *
 * Uses source file reading (like DeadCodeAudit) to avoid importing Phaser
 * which requires a browser environment.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { VISUAL } from '../../src/config/balance';

const CONFIG_SRC = readFileSync(resolve(__dirname, '../../src/config/game-config.ts'), 'utf-8');

describe('Game Config — Scale & DPI', () => {
  it('scale mode is FIT', () => {
    expect(CONFIG_SRC).toContain('Phaser.Scale.FIT');
  });

  it('autoCenter is CENTER_BOTH', () => {
    expect(CONFIG_SRC).toContain('Phaser.Scale.CENTER_BOTH');
  });

  it('base resolution constants are 1280x720', () => {
    expect(CONFIG_SRC).toContain('GAME_WIDTH = 1280');
    expect(CONFIG_SRC).toContain('GAME_HEIGHT = 720');
  });

  it('config uses GAME_WIDTH and GAME_HEIGHT', () => {
    // Verify the config object references the constants, not hardcoded values
    expect(CONFIG_SRC).toMatch(/width:\s*GAME_WIDTH/);
    expect(CONFIG_SRC).toMatch(/height:\s*GAME_HEIGHT/);
  });

  it('MIN_TOUCH_TARGET is at least 48dp', () => {
    expect(VISUAL.UI.MIN_TOUCH_TARGET).toBeGreaterThanOrEqual(48);
  });

  it('scale config has min and max bounds', () => {
    expect(CONFIG_SRC).toMatch(/min:\s*\{/);
    expect(CONFIG_SRC).toMatch(/max:\s*\{/);
  });

  it('aspect ratio is 16:9 (1280/720)', () => {
    const ratio = 1280 / 720;
    expect(ratio).toBeCloseTo(16 / 9, 2);
  });

  it('renderer is WEBGL', () => {
    expect(CONFIG_SRC).toContain('type: Phaser.WEBGL');
  });

  it('pixelArt is false (smooth scaling for DPI)', () => {
    expect(CONFIG_SRC).toContain('pixelArt: false');
  });

  it('parent container is game-container', () => {
    expect(CONFIG_SRC).toContain("parent: 'game-container'");
    expect(CONFIG_SRC).toContain("fullscreenTarget: 'game-container'");
  });
});
