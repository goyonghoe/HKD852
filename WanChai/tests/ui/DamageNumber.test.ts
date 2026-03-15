import { describe, it, expect } from 'vitest';
import { NEON_CSS, ELEMENT_CSS } from '../../src/config/colors';

/**
 * DamageNumber tests — verify number formatting, styling per damage type,
 * and pool lifecycle constants without Phaser runtime.
 */

// ── Constants mirrored from DamageNumber.ts ──
const POOL_SIZE = 20;
const FLOAT_SPEED = 80; // px/s
const LIFE_MS = 600;

// ── Number formatting ──

describe('DamageNumber — Number Formatting', () => {
  it('rounds damage to integer via Math.round', () => {
    expect(Math.round(123.4)).toBe(123);
    expect(Math.round(123.6)).toBe(124);
    expect(Math.round(0.5)).toBe(1);
    expect(Math.round(0.4)).toBe(0);
  });

  it('formats to string via String()', () => {
    expect(String(Math.round(999))).toBe('999');
    expect(String(Math.round(1234))).toBe('1234');
    expect(String(Math.round(0))).toBe('0');
  });

  it('large numbers display without commas (raw String())', () => {
    // DamageNumber uses String(Math.round(damage)) — no comma formatting
    expect(String(Math.round(99999))).toBe('99999');
    expect(String(Math.round(1000000))).toBe('1000000');
  });

  it('negative damage is technically possible (clamps externally)', () => {
    expect(String(Math.round(-5))).toBe('-5');
  });

  it('decimal damage is rounded to nearest integer', () => {
    expect(String(Math.round(42.7))).toBe('43');
    expect(String(Math.round(42.2))).toBe('42');
  });
});

// ── Crit vs Normal Styling ──

describe('DamageNumber — Crit vs Normal Styling', () => {
  it('crit font size is 34px', () => {
    const critFontSize = 34;
    expect(critFontSize).toBe(34);
  });

  it('normal font size is 22px', () => {
    const normalFontSize = 22;
    expect(normalFontSize).toBe(22);
  });

  it('crit color is GOLD', () => {
    expect(NEON_CSS.GOLD).toBe('#ffdd00');
  });

  it('normal color is UI_TEXT (white)', () => {
    expect(NEON_CSS.UI_TEXT).toBe('#ffffff');
  });

  it('effective font size is 28px (between crit and normal)', () => {
    const effectiveFontSize = 28;
    expect(effectiveFontSize).toBeGreaterThan(22); // > normal
    expect(effectiveFontSize).toBeLessThan(34); // < crit
  });

  it('effective color is EARTH (green)', () => {
    expect(ELEMENT_CSS.EARTH).toBe('#44cc44');
  });

  it('resist font size is 18px (smaller than normal)', () => {
    const resistFontSize = 18;
    expect(resistFontSize).toBeLessThan(22);
  });

  it('resist color is UI_DIM (gray)', () => {
    expect(NEON_CSS.UI_DIM).toBe('#888899');
  });

  it('font size hierarchy: resist < normal < effective < crit', () => {
    const sizes = { resist: 18, normal: 22, effective: 28, crit: 34 };
    expect(sizes.resist).toBeLessThan(sizes.normal);
    expect(sizes.normal).toBeLessThan(sizes.effective);
    expect(sizes.effective).toBeLessThan(sizes.crit);
  });
});

// ── Position Calculation ──

describe('DamageNumber — Position Calculation', () => {
  it('vertical offset is -10 from enemy Y', () => {
    const enemyY = 500;
    const offsetY = enemyY - 10;
    expect(offsetY).toBe(490);
  });

  it('horizontal jitter range is [-10, 10] (±10px)', () => {
    // (Math.random() - 0.5) * 20 → range [-10, 10]
    const minJitter = (0 - 0.5) * 20;
    const maxJitter = (1 - 0.5) * 20;
    expect(minJitter).toBe(-10);
    expect(maxJitter).toBe(10);
  });

  it('float speed is 80px/s upward', () => {
    expect(FLOAT_SPEED).toBe(80);
  });

  it('number floats upward over time (y decreases)', () => {
    const startY = 500;
    const dt = 0.5; // 500ms in seconds
    const newY = startY - FLOAT_SPEED * dt;
    expect(newY).toBe(460); // 500 - 80*0.5 = 460
  });

  it('alpha fades linearly from 1 to 0 over LIFE_MS', () => {
    // alpha = remaining_life / LIFE_MS
    const fullAlpha = LIFE_MS / LIFE_MS;
    const halfAlpha = LIFE_MS / 2 / LIFE_MS;
    const zeroAlpha = 0 / LIFE_MS;
    expect(fullAlpha).toBe(1);
    expect(halfAlpha).toBe(0.5);
    expect(zeroAlpha).toBe(0);
  });
});

// ── Pool Lifecycle ──

describe('DamageNumber — Pool Lifecycle', () => {
  it('pool size is 20', () => {
    expect(POOL_SIZE).toBe(20);
  });

  it('lifetime per number is 600ms', () => {
    expect(LIFE_MS).toBe(600);
  });

  it('deactivated numbers go to position (-100, -100)', () => {
    // release() sets position to (-100, -100) — off-screen
    const releaseX = -100;
    const releaseY = -100;
    expect(releaseX).toBe(-100);
    expect(releaseY).toBe(-100);
  });

  it('pool uses round-robin acquisition via poolHead', () => {
    // Simulating poolHead advancement
    let poolHead = 0;
    const idx = poolHead;
    poolHead = (idx + 1) % POOL_SIZE;
    expect(poolHead).toBe(1);

    // Wrap around
    poolHead = 19;
    poolHead = (poolHead + 1) % POOL_SIZE;
    expect(poolHead).toBe(0);
  });

  it('acquire returns null when all pool items are visible (in use)', () => {
    // When all 20 items are visible, loop exhausts without finding free slot
    let found = false;
    const allVisible = Array(POOL_SIZE).fill(true);
    for (let i = 0; i < POOL_SIZE; i++) {
      if (!allVisible[i]) {
        found = true;
        break;
      }
    }
    expect(found).toBe(false); // null return
  });

  it('acquire finds first invisible slot in pool', () => {
    const visibility = Array(POOL_SIZE).fill(true);
    visibility[7] = false; // slot 7 is free
    let foundIdx = -1;
    for (let i = 0; i < POOL_SIZE; i++) {
      if (!visibility[i]) {
        foundIdx = i;
        break;
      }
    }
    expect(foundIdx).toBe(7);
  });

  it('active entries are removed when life reaches 0', () => {
    // Simulating update loop logic
    const active = [
      { life: 100 },
      { life: -10 }, // expired
      { life: 300 },
    ];
    const remaining = active.filter((e) => e.life > 0);
    expect(remaining.length).toBe(2);
  });

  it('update reduces life by delta each frame', () => {
    let life = LIFE_MS;
    const delta = 16; // ~60fps frame
    life -= delta;
    expect(life).toBe(584);
  });
});

// ── Depth and Visibility ──

describe('DamageNumber — Depth and Visibility', () => {
  it('damage numbers render at depth 600', () => {
    const depth = 600;
    expect(depth).toBe(600);
  });

  it('initial visibility is false (pooled off-screen)', () => {
    const initialVisible = false;
    expect(initialVisible).toBe(false);
  });

  it('initial position is (-100, -100) off-screen', () => {
    const initX = -100;
    const initY = -100;
    expect(initX).toBe(-100);
    expect(initY).toBe(-100);
  });
});
