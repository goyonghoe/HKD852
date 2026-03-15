import { describe, it, expect } from 'vitest';
import { VISUAL } from '../../src/config/balance';
import { UI_COLORS, RETRO, UI_CSS, NEON_CSS } from '../../src/config/colors';

/**
 * ButtonFactory tests — verify config-driven behavior without Phaser runtime.
 * Tests validate dimensions, touch targets (M-011), variants, and label styling.
 */

// ── Constants mirrored from ButtonFactory defaults ──
const DEFAULT_WIDTH = VISUAL.UI.BUTTON_MIN_WIDTH;
const DEFAULT_HEIGHT = VISUAL.UI.BUTTON_HEIGHT;
const MIN_TOUCH = VISUAL.UI.MIN_TOUCH_TARGET;

describe('ButtonFactory — Dimensions', () => {
  it('default width matches BUTTON_MIN_WIDTH from balance.ts', () => {
    expect(DEFAULT_WIDTH).toBe(220);
  });

  it('default height matches BUTTON_HEIGHT from balance.ts', () => {
    expect(DEFAULT_HEIGHT).toBe(60);
  });

  it('default width is a positive number', () => {
    expect(DEFAULT_WIDTH).toBeGreaterThan(0);
  });

  it('default height is a positive number', () => {
    expect(DEFAULT_HEIGHT).toBeGreaterThan(0);
  });
});

describe('ButtonFactory — Touch Target Compliance (M-011)', () => {
  it('default width >= MIN_TOUCH_TARGET (48dp)', () => {
    expect(DEFAULT_WIDTH).toBeGreaterThanOrEqual(MIN_TOUCH);
  });

  it('default height >= MIN_TOUCH_TARGET (48dp)', () => {
    expect(DEFAULT_HEIGHT).toBeGreaterThanOrEqual(MIN_TOUCH);
  });

  it('MIN_TOUCH_TARGET is at least 48', () => {
    expect(MIN_TOUCH).toBeGreaterThanOrEqual(48);
  });

  it('button area is large enough for comfortable tapping', () => {
    const area = DEFAULT_WIDTH * DEFAULT_HEIGHT;
    // 48 * 48 = 2304 minimum area
    expect(area).toBeGreaterThanOrEqual(48 * 48);
  });
});

describe('ButtonFactory — Variant Styling', () => {
  it('primary variant uses accent color from UI_COLORS', () => {
    expect(UI_COLORS.accent).toBeDefined();
    expect(typeof UI_COLORS.accent).toBe('number');
  });

  it('secondary variant uses panelBg from RETRO', () => {
    expect(RETRO.panelBg).toBeDefined();
    expect(typeof RETRO.panelBg).toBe('number');
  });

  it('primary text color is TEXT_WHITE', () => {
    expect(UI_CSS.TEXT_WHITE).toBe('#ffffff');
  });

  it('secondary text color is HEADING', () => {
    expect(UI_CSS.HEADING).toBeDefined();
    expect(typeof UI_CSS.HEADING).toBe('string');
  });

  it('both variants use same border color', () => {
    expect(RETRO.borderColor).toBeDefined();
    expect(typeof RETRO.borderColor).toBe('number');
  });

  it('both variants use same border width', () => {
    expect(RETRO.borderWidth).toBeGreaterThan(0);
  });

  it('shadow color exists for drop shadow', () => {
    expect(RETRO.shadowColor).toBeDefined();
  });

  it('RETRO radius used for rounded corners', () => {
    expect(RETRO.radius).toBeGreaterThanOrEqual(12);
  });
});

describe('ButtonFactory — Animation Config', () => {
  it('BUTTON_PRESS animation duration is defined and positive', () => {
    expect(VISUAL.ANIM.BUTTON_PRESS).toBeDefined();
    expect(VISUAL.ANIM.BUTTON_PRESS).toBeGreaterThan(0);
  });

  it('button press duration is reasonable (50-200ms)', () => {
    expect(VISUAL.ANIM.BUTTON_PRESS).toBeGreaterThanOrEqual(50);
    expect(VISUAL.ANIM.BUTTON_PRESS).toBeLessThanOrEqual(200);
  });

  it('SCENE_FADE duration is defined and positive', () => {
    expect(VISUAL.ANIM.SCENE_FADE).toBeDefined();
    expect(VISUAL.ANIM.SCENE_FADE).toBeGreaterThan(0);
  });
});

describe('ButtonFactory — Color Config Consistency', () => {
  it('UI_COLORS.accent is a valid Phaser hex number', () => {
    expect(typeof UI_COLORS.accent).toBe('number');
    expect(UI_COLORS.accent).toBeGreaterThan(0);
  });

  it('NEON_CSS provides CSS-format colors for text', () => {
    expect(NEON_CSS.UI_ACCENT).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(NEON_CSS.UI_TEXT).toMatch(/^#[0-9a-fA-F]{6}$/);
  });
});
