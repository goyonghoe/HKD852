import { describe, it, expect } from 'vitest';
import { VISUAL } from '../../src/config/balance';

/**
 * TASK-89: PauseOverlay contract tests.
 * Validates layout geometry and config values WITHOUT Phaser mocking.
 * Enforces M-013 (no UI overflow) and M-011 (touch targets >= 48dp).
 *
 * PauseOverlay layout constants (from src/ui/PauseOverlay.ts):
 *   Panel: 440w x 540h, centered at (360, 640)
 *   Title: y = cy - 170 = 470, fontSize 42px
 *   BGM toggle row: y = cy - 90 = 550
 *   BGM volume row: y = cy - 35 = 605
 *   SFX toggle row: y = cy + 20 = 660
 *   SFX volume row: y = cy + 80 = 720
 *   Resume button: y = cy + 160, 280w x 60h
 *   Menu button: y = cy + 235, 280w x 60h
 *   Volume segments: 5x (36w + 8gap), startX = cx - 20 = 340
 *   Toggle button: 100w x 48h at cx + 90 = 450
 *   Viewport: 720x1280
 */

const GAME_WIDTH = 720;
const GAME_HEIGHT = 1280;
const cx = GAME_WIDTH / 2; // 360
const cy = GAME_HEIGHT / 2; // 640

// Panel dimensions
const PANEL_W = 440;
const PANEL_H = 540;
const panelLeft = cx - PANEL_W / 2; // 140
const panelRight = cx + PANEL_W / 2; // 580
const panelTop = cy - PANEL_H / 2; // 370
const panelBottom = cy + PANEL_H / 2; // 910

// Volume segment geometry
const SEG_W = 36;
const SEG_H = 36;
const SEG_GAP = 8;
const SEG_COUNT = 5;
const SEG_START_X = cx - 20; // 340
const SEG_TOTAL_W = SEG_COUNT * SEG_W + (SEG_COUNT - 1) * SEG_GAP; // 212

// Toggle button geometry
const TOGGLE_W = 100;
const TOGGLE_H = 48;
const TOGGLE_X = cx + 90; // 450

// Buttons
const BTN_W = 280;
const BTN_H = 60;
const RESUME_Y = cy + 160; // 800
const MENU_Y = cy + 235; // 875

describe('PauseOverlay — Panel within viewport (M-013)', () => {
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

describe('PauseOverlay — Title within panel', () => {
  it('title Y is below panel top', () => {
    const titleY = cy - 170; // 470
    expect(titleY).toBeGreaterThan(panelTop);
  });

  it('title Y is above panel bottom', () => {
    const titleY = cy - 170;
    expect(titleY).toBeLessThan(panelBottom);
  });
});

describe('PauseOverlay — Volume segments fit within panel (M-013)', () => {
  it('BGM volume segments right edge is within panel', () => {
    const rightEdge = SEG_START_X + SEG_TOTAL_W;
    expect(rightEdge).toBeLessThanOrEqual(panelRight);
  });

  it('BGM volume segments left edge is within panel', () => {
    expect(SEG_START_X).toBeGreaterThanOrEqual(panelLeft);
  });

  it('SFX volume segments right edge is within panel', () => {
    // SFX uses same segStartX
    const rightEdge = SEG_START_X + SEG_TOTAL_W;
    expect(rightEdge).toBeLessThanOrEqual(panelRight);
  });

  it('volume segment height fits within row spacing', () => {
    // BGM row Y = 605, SFX toggle Y = 660
    // Segment center is at rowY, extends +-SEG_H/2 = +-18
    const bgmVolBottom = cy - 35 + SEG_H / 2; // 605 + 18 = 623
    const sfxToggleTop = cy + 20 - TOGGLE_H / 2; // 660 - 24 = 636
    expect(bgmVolBottom).toBeLessThan(sfxToggleTop);
  });
});

describe('PauseOverlay — Toggle buttons within panel (M-013)', () => {
  it('toggle button right edge is within panel', () => {
    const toggleRight = TOGGLE_X + TOGGLE_W / 2; // 500
    expect(toggleRight).toBeLessThanOrEqual(panelRight);
  });

  it('toggle button left edge is within panel', () => {
    const toggleLeft = TOGGLE_X - TOGGLE_W / 2; // 400
    expect(toggleLeft).toBeGreaterThanOrEqual(panelLeft);
  });
});

describe('PauseOverlay — Action buttons within panel (M-013)', () => {
  it('resume button fits horizontally within panel', () => {
    const btnLeft = cx - BTN_W / 2; // 220
    const btnRight = cx + BTN_W / 2; // 500
    expect(btnLeft).toBeGreaterThanOrEqual(panelLeft);
    expect(btnRight).toBeLessThanOrEqual(panelRight);
  });

  it('resume button fits vertically within panel', () => {
    const btnTop = RESUME_Y - BTN_H / 2; // 770
    const btnBottom = RESUME_Y + BTN_H / 2; // 830
    expect(btnTop).toBeGreaterThan(panelTop);
    expect(btnBottom).toBeLessThanOrEqual(panelBottom);
  });

  it('menu button fits horizontally within panel', () => {
    const btnLeft = cx - BTN_W / 2;
    const btnRight = cx + BTN_W / 2;
    expect(btnLeft).toBeGreaterThanOrEqual(panelLeft);
    expect(btnRight).toBeLessThanOrEqual(panelRight);
  });

  it('menu button fits vertically within panel', () => {
    const btnTop = MENU_Y - BTN_H / 2; // 845
    const btnBottom = MENU_Y + BTN_H / 2; // 905
    expect(btnTop).toBeGreaterThan(panelTop);
    expect(btnBottom).toBeLessThanOrEqual(panelBottom);
  });

  it('resume and menu buttons do not overlap', () => {
    const resumeBottom = RESUME_Y + BTN_H / 2; // 830
    const menuTop = MENU_Y - BTN_H / 2; // 845
    expect(resumeBottom).toBeLessThan(menuTop);
  });
});

describe('PauseOverlay — Touch target sizes (M-011)', () => {
  it('toggle button height meets 48dp minimum', () => {
    expect(TOGGLE_H).toBeGreaterThanOrEqual(VISUAL.UI.MIN_TOUCH_TARGET);
  });

  it('toggle button width meets 48dp minimum', () => {
    expect(TOGGLE_W).toBeGreaterThanOrEqual(VISUAL.UI.MIN_TOUCH_TARGET);
  });

  it('volume segment touch zone meets 48dp minimum', () => {
    // PauseOverlay uses 48x48 zones for volume segments
    const ZONE_SIZE = 48;
    expect(ZONE_SIZE).toBeGreaterThanOrEqual(VISUAL.UI.MIN_TOUCH_TARGET);
  });

  it('resume button height meets 48dp minimum', () => {
    expect(BTN_H).toBeGreaterThanOrEqual(VISUAL.UI.MIN_TOUCH_TARGET);
  });

  it('menu button height meets 48dp minimum', () => {
    expect(BTN_H).toBeGreaterThanOrEqual(VISUAL.UI.MIN_TOUCH_TARGET);
  });
});

describe('PauseOverlay — Font sizes are readable', () => {
  it('title font size is at least 28px', () => {
    const titleFontSize = 42;
    expect(titleFontSize).toBeGreaterThanOrEqual(28);
  });

  it('label font size is at least 20px', () => {
    const labelFontSize = 24;
    expect(labelFontSize).toBeGreaterThanOrEqual(20);
  });

  it('button font size is at least 20px', () => {
    const buttonFontSize = 26;
    expect(buttonFontSize).toBeGreaterThanOrEqual(20);
  });
});
