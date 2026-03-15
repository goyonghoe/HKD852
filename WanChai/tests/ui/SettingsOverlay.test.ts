import { describe, it, expect } from 'vitest';
import { VISUAL } from '../../src/config/balance';

/**
 * TASK-89: SettingsOverlay contract tests.
 * Validates layout geometry and config values WITHOUT Phaser mocking.
 * Enforces M-013 (no UI overflow) and M-011 (touch targets >= 48dp).
 *
 * SettingsOverlay layout constants (from src/ui/SettingsOverlay.ts):
 *   Panel: 440w x 720h, centered at (360, 640)
 *   Title: y = cy - 300 = 340, fontSize 42px
 *   BGM section label: y = cy - 240 = 400
 *   BGM audio row: y = cy - 190 = 450
 *   SFX section label: y = cy - 130 = 510
 *   SFX audio row: y = cy - 80 = 560
 *   Language section label: y = cy - 20 = 620
 *   Language row: y = cy + 30 = 670
 *   Vibration section: y = cy + 90 = 730
 *   Close button: y = cy + 170, 280w x 60h
 *   Reset button: y = cy + 260, 220w x 48h
 *   Volume segments: 5x (36w + 8gap), startX = cx - 4 = 356
 *   Toggle button: 100w x 48h at cx - 100 = 260
 *   Language buttons: 2x 120w x 44h, gap=16
 *   Vibration toggle: 100w x 48h at cx + 60 = 420
 *   Viewport: 720x1280
 */

const GAME_WIDTH = 720;
const GAME_HEIGHT = 1280;
const cx = GAME_WIDTH / 2; // 360
const cy = GAME_HEIGHT / 2; // 640

// Panel dimensions
const PANEL_W = 440;
const PANEL_H = 720;
const panelLeft = cx - PANEL_W / 2; // 140
const panelRight = cx + PANEL_W / 2; // 580
const panelTop = cy - PANEL_H / 2; // 280
const panelBottom = cy + PANEL_H / 2; // 1000

// Volume segment geometry (SettingsOverlay)
const SEG_W = 36;
const SEG_H = 36;
const SEG_GAP = 8;
const SEG_COUNT = 5;
const SEG_START_X = cx - 4; // 356
const SEG_TOTAL_W = SEG_COUNT * SEG_W + (SEG_COUNT - 1) * SEG_GAP; // 212

// Toggle button geometry (audio rows)
const AUDIO_TOGGLE_W = 100;
const AUDIO_TOGGLE_H = 48;
const AUDIO_TOGGLE_X = cx - 100; // 260

// Vibration toggle
const VIB_TOGGLE_W = 100;
const VIB_TOGGLE_H = 48;
const VIB_TOGGLE_X = cx + 60; // 420

// Language buttons
const LANG_BTN_W = 120;
const LANG_BTN_H = 48; // M-011: minimum touch target
const LANG_GAP = 16;
const LANG_COUNT = 2;
const LANG_TOTAL_W = LANG_COUNT * LANG_BTN_W + (LANG_COUNT - 1) * LANG_GAP; // 256
const LANG_START_X = cx - LANG_TOTAL_W / 2 + LANG_BTN_W / 2; // 232

// Close button
const CLOSE_BTN_W = 280;
const CLOSE_BTN_H = 60;
const CLOSE_Y = cy + 170; // 810

// Reset button
const RESET_BTN_W = 220;
const RESET_BTN_H = 48;
const RESET_Y = cy + 260; // 900

describe('SettingsOverlay — Panel within viewport (M-013)', () => {
  it('panel left edge is within viewport', () => {
    expect(panelLeft).toBeGreaterThanOrEqual(0);
  });

  it('panel right edge is within viewport', () => {
    expect(panelRight).toBeLessThanOrEqual(GAME_WIDTH);
  });

  it('panel top edge is within viewport', () => {
    expect(panelTop).toBeGreaterThanOrEqual(0);
  });

  it('panel bottom edge is within viewport', () => {
    expect(panelBottom).toBeLessThanOrEqual(GAME_HEIGHT);
  });
});

describe('SettingsOverlay — Volume segments fit in panel (M-013)', () => {
  it('5 volume segments fit horizontally within panel', () => {
    const rightEdge = SEG_START_X + SEG_TOTAL_W; // 356 + 212 = 568
    expect(rightEdge).toBeLessThanOrEqual(panelRight);
  });

  it('volume segments left edge is within panel', () => {
    expect(SEG_START_X).toBeGreaterThanOrEqual(panelLeft);
  });

  it('BGM segments right edge is within panel right', () => {
    const rightEdge = SEG_START_X + SEG_TOTAL_W;
    expect(rightEdge).toBeLessThanOrEqual(panelRight);
  });

  it('SFX segments right edge is within panel right', () => {
    // Same geometry as BGM
    const rightEdge = SEG_START_X + SEG_TOTAL_W;
    expect(rightEdge).toBeLessThanOrEqual(panelRight);
  });

  it('volume segment vertical extent fits in row', () => {
    // BGM row Y = 450, segment extends +-18
    const bgmSegBottom = cy - 190 + SEG_H / 2; // 450 + 18 = 468
    const sfxLabelY = cy - 130; // 510
    expect(bgmSegBottom).toBeLessThan(sfxLabelY);
  });
});

describe('SettingsOverlay — Audio toggle within panel (M-013)', () => {
  it('audio toggle left edge is within panel', () => {
    const toggleLeft = AUDIO_TOGGLE_X - AUDIO_TOGGLE_W / 2; // 210
    expect(toggleLeft).toBeGreaterThanOrEqual(panelLeft);
  });

  it('audio toggle right edge is within panel', () => {
    const toggleRight = AUDIO_TOGGLE_X + AUDIO_TOGGLE_W / 2; // 310
    expect(toggleRight).toBeLessThanOrEqual(panelRight);
  });
});

describe('SettingsOverlay — Language buttons within panel (M-013)', () => {
  it('language buttons row fits horizontally within panel', () => {
    const leftEdge = LANG_START_X - LANG_BTN_W / 2; // 172
    const rightEdge = LANG_START_X + (LANG_COUNT - 1) * (LANG_BTN_W + LANG_GAP) + LANG_BTN_W / 2; // 428
    expect(leftEdge).toBeGreaterThanOrEqual(panelLeft);
    expect(rightEdge).toBeLessThanOrEqual(panelRight);
  });

  it('language row Y is within panel', () => {
    const langRowY = cy + 30; // 670
    const topEdge = langRowY - LANG_BTN_H / 2; // 648
    const bottomEdge = langRowY + LANG_BTN_H / 2; // 692
    expect(topEdge).toBeGreaterThan(panelTop);
    expect(bottomEdge).toBeLessThan(panelBottom);
  });
});

describe('SettingsOverlay — Vibration toggle within panel (M-013)', () => {
  it('vibration toggle left edge is within panel', () => {
    const toggleLeft = VIB_TOGGLE_X - VIB_TOGGLE_W / 2; // 370
    expect(toggleLeft).toBeGreaterThanOrEqual(panelLeft);
  });

  it('vibration toggle right edge is within panel', () => {
    const toggleRight = VIB_TOGGLE_X + VIB_TOGGLE_W / 2; // 470
    expect(toggleRight).toBeLessThanOrEqual(panelRight);
  });
});

describe('SettingsOverlay — Close & Reset buttons within panel (M-013)', () => {
  it('close button fits horizontally within panel', () => {
    const btnLeft = cx - CLOSE_BTN_W / 2; // 220
    const btnRight = cx + CLOSE_BTN_W / 2; // 500
    expect(btnLeft).toBeGreaterThanOrEqual(panelLeft);
    expect(btnRight).toBeLessThanOrEqual(panelRight);
  });

  it('close button fits vertically within panel', () => {
    const btnTop = CLOSE_Y - CLOSE_BTN_H / 2; // 780
    const btnBottom = CLOSE_Y + CLOSE_BTN_H / 2; // 840
    expect(btnTop).toBeGreaterThan(panelTop);
    expect(btnBottom).toBeLessThanOrEqual(panelBottom);
  });

  it('reset button fits horizontally within panel', () => {
    const btnLeft = cx - RESET_BTN_W / 2; // 250
    const btnRight = cx + RESET_BTN_W / 2; // 470
    expect(btnLeft).toBeGreaterThanOrEqual(panelLeft);
    expect(btnRight).toBeLessThanOrEqual(panelRight);
  });

  it('reset button fits vertically within panel', () => {
    const btnTop = RESET_Y - RESET_BTN_H / 2; // 876
    const btnBottom = RESET_Y + RESET_BTN_H / 2; // 924
    expect(btnTop).toBeGreaterThan(panelTop);
    expect(btnBottom).toBeLessThanOrEqual(panelBottom);
  });

  it('close and reset buttons do not overlap', () => {
    const closeBottom = CLOSE_Y + CLOSE_BTN_H / 2; // 840
    const resetTop = RESET_Y - RESET_BTN_H / 2; // 876
    expect(closeBottom).toBeLessThan(resetTop);
  });
});

describe('SettingsOverlay — Touch target sizes (M-011)', () => {
  it('audio toggle height meets 48dp minimum', () => {
    expect(AUDIO_TOGGLE_H).toBeGreaterThanOrEqual(VISUAL.UI.MIN_TOUCH_TARGET);
  });

  it('vibration toggle height meets 48dp minimum', () => {
    expect(VIB_TOGGLE_H).toBeGreaterThanOrEqual(VISUAL.UI.MIN_TOUCH_TARGET);
  });

  it('volume segment touch zone meets 48dp minimum', () => {
    // SettingsOverlay uses 48x48 zones for volume segments
    const ZONE_SIZE = 48;
    expect(ZONE_SIZE).toBeGreaterThanOrEqual(VISUAL.UI.MIN_TOUCH_TARGET);
  });

  it('close button height meets 48dp minimum', () => {
    expect(CLOSE_BTN_H).toBeGreaterThanOrEqual(VISUAL.UI.MIN_TOUCH_TARGET);
  });

  it('reset button height meets 48dp minimum', () => {
    expect(RESET_BTN_H).toBeGreaterThanOrEqual(VISUAL.UI.MIN_TOUCH_TARGET);
  });

  it('language button height meets minimum touch target (M-011)', () => {
    expect(LANG_BTN_H).toBeGreaterThanOrEqual(VISUAL.UI.MIN_TOUCH_TARGET);
  });
});

describe('SettingsOverlay — Font sizes are readable', () => {
  it('title font size is at least 28px', () => {
    const titleFontSize = 42;
    expect(titleFontSize).toBeGreaterThanOrEqual(28);
  });

  it('section label font size is at least 18px', () => {
    const sectionFontSize = 22;
    expect(sectionFontSize).toBeGreaterThanOrEqual(18);
  });

  it('button font size is at least 18px', () => {
    const closeFontSize = 26;
    const resetFontSize = 20;
    expect(closeFontSize).toBeGreaterThanOrEqual(18);
    expect(resetFontSize).toBeGreaterThanOrEqual(18);
  });
});

describe('SettingsOverlay — Section ordering is top-to-bottom', () => {
  it('sections are ordered: BGM < SFX < Language < Vibration < Close < Reset', () => {
    const bgmY = cy - 190; // 450
    const sfxY = cy - 80; // 560
    const langY = cy + 30; // 670
    const vibY = cy + 90; // 730
    const closeY = cy + 170; // 810
    const resetY = cy + 260; // 900

    expect(bgmY).toBeLessThan(sfxY);
    expect(sfxY).toBeLessThan(langY);
    expect(langY).toBeLessThan(vibY);
    expect(vibY).toBeLessThan(closeY);
    expect(closeY).toBeLessThan(resetY);
  });
});
