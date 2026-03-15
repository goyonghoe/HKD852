import { describe, it, expect } from 'vitest';
import { VISUAL } from '../../src/config/balance';
import { RETRO } from '../../src/config/colors';

/**
 * M-011 / M-013 Compliance — UI standards for touch targets and panel radius.
 *
 * Enforces:
 * - MIN_TOUCH_TARGET >= 48dp (mobile minimum)
 * - BUTTON_HEIGHT >= 48dp
 * - Panel radius >= 12px
 */

describe('UI Touch Target Standards', () => {
  it('MIN_TOUCH_TARGET constant is at least 48', () => {
    expect(VISUAL.UI.MIN_TOUCH_TARGET).toBeGreaterThanOrEqual(48);
  });

  it('BUTTON_HEIGHT is at least 48px (minimum touch target)', () => {
    expect(VISUAL.UI.BUTTON_HEIGHT).toBeGreaterThanOrEqual(48);
  });

  it('BUTTON_MIN_WIDTH is at least 48px', () => {
    expect(VISUAL.UI.BUTTON_MIN_WIDTH).toBeGreaterThanOrEqual(48);
  });
});

describe('UI Panel Radius', () => {
  it('RETRO.radius is at least 12px', () => {
    expect(RETRO.radius).toBeGreaterThanOrEqual(12);
  });
});

describe('UI Color Config Integrity', () => {
  it('RETRO has required panel fields', () => {
    expect(RETRO.panelBg).toBeDefined();
    expect(RETRO.panelBorder).toBeDefined();
    expect(RETRO.borderColor).toBeDefined();
    expect(RETRO.borderWidth).toBeGreaterThan(0);
    expect(RETRO.shadowColor).toBeDefined();
    expect(RETRO.bevelLight).toBeDefined();
    expect(RETRO.bevelDark).toBeDefined();
    expect(RETRO.textColor).toBeDefined();
    expect(RETRO.textHighlight).toBeDefined();
  });
});
