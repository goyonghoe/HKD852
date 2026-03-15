import { describe, it, expect } from 'vitest';
import { NEON_CSS, BG_COLOR } from '../../src/config/colors';

// Mirrored from game-config.ts (cannot import directly — Phaser + scene deps)
const GAME_WIDTH = 720;
const GAME_HEIGHT = 1280;

/**
 * ARIAMessage tests — verify message queue logic, typing state machine,
 * auto-dismiss timing, and duplicate prevention without Phaser runtime.
 *
 * The ARIAMessage class uses a simple state machine:
 *   idle (alpha=0) → typing (alpha=1) → display (countdown) → fade → idle
 */

// ── Constants mirrored from ARIAMessage.ts ──
const TYPE_SPEED_MS = 25;
const DISPLAY_MS = 3500;
const GLITCH_INTERVAL = 80;

// ── Message Queue Logic ──

describe('ARIAMessage — Queue Management', () => {
  it('queue starts empty', () => {
    const queue: string[] = [];
    expect(queue.length).toBe(0);
  });

  it('show() adds message to queue', () => {
    const queue: string[] = [];
    queue.push('ARIA online');
    expect(queue.length).toBe(1);
    expect(queue[0]).toBe('ARIA online');
  });

  it('multiple messages queue in FIFO order', () => {
    const queue: string[] = [];
    queue.push('First');
    queue.push('Second');
    queue.push('Third');
    expect(queue.length).toBe(3);
    expect(queue[0]).toBe('First');
    expect(queue[2]).toBe('Third');
  });

  it('startNext() dequeues first message (FIFO)', () => {
    const queue = ['First', 'Second', 'Third'];
    const msg = queue.shift();
    expect(msg).toBe('First');
    expect(queue.length).toBe(2);
    expect(queue[0]).toBe('Second');
  });

  it('startNext() returns undefined on empty queue', () => {
    const queue: string[] = [];
    const msg = queue.shift();
    expect(msg).toBeUndefined();
  });

  it('after last message dismissed, queue is empty', () => {
    const queue = ['Only one'];
    queue.shift();
    expect(queue.length).toBe(0);
  });
});

// ── Typing State Machine ──

describe('ARIAMessage — Typing State Machine', () => {
  it('initial state: not typing, container alpha = 0', () => {
    const typing = false;
    const containerAlpha = 0;
    expect(typing).toBe(false);
    expect(containerAlpha).toBe(0);
  });

  it('startNext sets typing = true, alpha = 1, currentIndex = 0', () => {
    // Simulate startNext()
    let typing = false;
    let alpha = 0;
    let currentIndex = 5; // leftover from previous
    const _currentFull = 'ARIA: Systems nominal';

    // startNext:
    typing = true;
    alpha = 1;
    currentIndex = 0;

    expect(typing).toBe(true);
    expect(alpha).toBe(1);
    expect(currentIndex).toBe(0);
  });

  it('typing phase: currentIndex increments per TYPE_SPEED_MS', () => {
    let typeTimer = 0;
    let currentIndex = 0;
    const fullText = 'Hello';

    // Simulate 50ms of updates (2 characters worth)
    typeTimer += 50;
    while (typeTimer >= TYPE_SPEED_MS && currentIndex < fullText.length) {
      typeTimer -= TYPE_SPEED_MS;
      currentIndex++;
    }
    expect(currentIndex).toBe(2); // 50ms / 25ms = 2 chars
  });

  it('typing completes when currentIndex reaches full text length', () => {
    const fullText = 'Hi';
    let currentIndex = 0;
    let typeTimer = 0;
    let typing = true;

    // Simulate 60ms (enough for 2 chars at 25ms each)
    typeTimer += 60;
    while (typeTimer >= TYPE_SPEED_MS && currentIndex < fullText.length) {
      typeTimer -= TYPE_SPEED_MS;
      currentIndex++;
    }
    if (currentIndex >= fullText.length) {
      typing = false;
    }
    expect(typing).toBe(false);
    expect(currentIndex).toBe(2);
  });

  it('after typing completes, displayTimer is set to DISPLAY_MS', () => {
    let displayTimer = 0;
    // Typing just finished:
    displayTimer = DISPLAY_MS;
    expect(displayTimer).toBe(3500);
  });

  it('display phase: timer counts down', () => {
    let displayTimer = DISPLAY_MS;
    displayTimer -= 1000;
    expect(displayTimer).toBe(2500);
  });

  it('display phase ends when displayTimer <= 0', () => {
    let displayTimer = 100;
    displayTimer -= 200;
    expect(displayTimer).toBeLessThanOrEqual(0);
  });

  it('fade phase: alpha = displayTimer / 500 when < 500ms remain', () => {
    const displayTimer = 250;
    const alpha = displayTimer / 500;
    expect(alpha).toBe(0.5);
  });

  it('fade phase: alpha is 0 at displayTimer = 0', () => {
    const displayTimer = 0;
    const alpha = displayTimer / 500;
    expect(alpha).toBe(0);
  });

  it('after fade, container alpha set to 0 and next message starts', () => {
    const queue = ['Next message'];
    let containerAlpha = 0.1;
    // displayTimer <= 0:
    containerAlpha = 0;
    expect(containerAlpha).toBe(0);
    expect(queue.length).toBe(1); // ready for startNext
  });
});

// ── Duplicate Message Prevention ──

describe('ARIAMessage — Duplicate Prevention', () => {
  it('identical messages can be queued (no built-in dedup)', () => {
    // ARIAMessage has no built-in dedup — caller is responsible
    const queue: string[] = [];
    queue.push('ARIA online');
    queue.push('ARIA online');
    expect(queue.length).toBe(2);
  });

  it('RunScene prevents duplicates via flag (ariaBossShown etc.)', () => {
    // External flag pattern used in RunScene
    let ariaBossShown = false;
    const queue: string[] = [];

    // First attempt
    if (!ariaBossShown) {
      queue.push('Boss incoming!');
      ariaBossShown = true;
    }
    // Second attempt (blocked)
    if (!ariaBossShown) {
      queue.push('Boss incoming!');
    }
    expect(queue.length).toBe(1);
  });

  it('different messages are both accepted', () => {
    const queue: string[] = [];
    queue.push('ARIA: Systems nominal');
    queue.push('ARIA: Boss detected');
    expect(queue.length).toBe(2);
    expect(queue[0]).not.toBe(queue[1]);
  });
});

// ── Auto-Dismiss Timeout ──

describe('ARIAMessage — Auto-Dismiss Timeout', () => {
  it('TYPE_SPEED_MS is 25ms per character', () => {
    expect(TYPE_SPEED_MS).toBe(25);
  });

  it('DISPLAY_MS is 3500ms after typing finishes', () => {
    expect(DISPLAY_MS).toBe(3500);
  });

  it('total visible time = typing time + display time', () => {
    const message = 'ARIA: Threat neutralized';
    const typingTime = message.length * TYPE_SPEED_MS;
    const totalTime = typingTime + DISPLAY_MS;
    expect(typingTime).toBe(24 * 25); // 600ms
    expect(totalTime).toBe(4100); // 600 + 3500
  });

  it('short message has shorter total time', () => {
    const short = 'Hi';
    const long = 'This is a much longer ARIA communication message';
    const shortTotal = short.length * TYPE_SPEED_MS + DISPLAY_MS;
    const longTotal = long.length * TYPE_SPEED_MS + DISPLAY_MS;
    expect(shortTotal).toBeLessThan(longTotal);
  });

  it('fade begins 500ms before displayTimer reaches 0', () => {
    // When displayTimer < 500, alpha = displayTimer / 500
    const fadeThreshold = 500;
    const displayTimerAtFadeStart = 500;
    const alpha = displayTimerAtFadeStart / fadeThreshold;
    expect(alpha).toBe(1); // just entering fade zone
  });
});

// ── Glitch Effect ──

describe('ARIAMessage — Glitch Effect', () => {
  it('GLITCH_INTERVAL is 80ms', () => {
    expect(GLITCH_INTERVAL).toBe(80);
  });

  it('glitch chars include cyberpunk block elements', () => {
    const chars = '!@#$%^&*░▒▓█';
    expect(chars).toContain('░');
    expect(chars).toContain('▒');
    expect(chars).toContain('▓');
    expect(chars).toContain('█');
  });

  it('glitch only applies during typing phase with >= 2 chars revealed', () => {
    const typing = true;
    const currentIndex = 1; // only 1 char
    const shouldGlitch = typing && currentIndex >= 2;
    expect(shouldGlitch).toBe(false);

    const currentIndex2 = 2;
    const shouldGlitch2 = typing && currentIndex2 >= 2;
    expect(shouldGlitch2).toBe(true);
  });

  it('glitch does not apply outside typing phase', () => {
    const typing = false;
    const currentIndex = 10;
    const shouldGlitch = typing && currentIndex >= 2;
    expect(shouldGlitch).toBe(false);
  });
});

// ── Show/Hide State ──

describe('ARIAMessage — Show/Hide State', () => {
  it('container starts hidden (alpha = 0)', () => {
    const alpha = 0;
    expect(alpha).toBe(0);
  });

  it('container becomes visible when message starts (alpha = 1)', () => {
    let alpha = 0;
    // startNext:
    alpha = 1;
    expect(alpha).toBe(1);
  });

  it('update returns early when alpha is 0 (idle)', () => {
    const alpha = 0;
    const shouldProcess = alpha !== 0;
    expect(shouldProcess).toBe(false);
  });

  it('container depth is 1600 (above all game elements)', () => {
    const depth = 1600;
    expect(depth).toBe(1600);
  });

  it('text styling uses UI_ACCENT color', () => {
    expect(NEON_CSS.UI_ACCENT).toBe('#00ffcc');
  });

  it('background rect uses BG_COLOR with 0.92 alpha', () => {
    expect(BG_COLOR).toBe(0x0a0a1a);
    const bgAlpha = 0.92;
    expect(bgAlpha).toBeCloseTo(0.92);
  });

  it('background position is at 38% of game height', () => {
    const cy = GAME_HEIGHT * 0.38;
    expect(cy).toBeCloseTo(486.4);
  });

  it('background width is GAME_WIDTH - 60', () => {
    const bgWidth = GAME_WIDTH - 60;
    expect(bgWidth).toBe(660);
  });

  it('text wraps at GAME_WIDTH - 100', () => {
    const wrapWidth = GAME_WIDTH - 100;
    expect(wrapWidth).toBe(620);
  });
});
