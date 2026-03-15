import { type Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/** VQA state shape returned by __VQA_STATE__() */
export interface VQAState {
  activeScene: string;
  phase: string | null;
  stage: number | null;
  hp: number | null;
  kills: number | null;
  level: number | null;
  bossAlive: boolean | null;
  enemies: number | null;
}

const SCREENSHOT_DIR = '/tmp/vqa';

/**
 * Wait until the specified Phaser scene becomes active.
 * Delegates to __VQA_WAIT_SCENE__ exposed by the game in dev mode.
 */
export async function waitForScene(page: Page, sceneName: string, timeout = 15_000): Promise<void> {
  await page.evaluate(({ scene, ms }) => (window as any).__VQA_WAIT_SCENE__(scene, ms), {
    scene: sceneName,
    ms: timeout,
  });
}

/**
 * Query the current game state via __VQA_STATE__().
 */
export async function getGameState(page: Page): Promise<VQAState> {
  return page.evaluate(() => (window as any).__VQA_STATE__()) as Promise<VQAState>;
}

/**
 * Dispatch a pointer click at game-coordinate (x, y) in 1280x720 design space.
 * Uses __VQA_CLICK__ which handles FIT + CENTER_BOTH scaling.
 */
export async function gameClick(page: Page, x: number, y: number): Promise<void> {
  await page.evaluate(({ cx, cy }) => (window as any).__VQA_CLICK__(cx, cy), { cx: x, cy: y });
}

/**
 * Navigate to a scene directly via __VQA_GOTO__ (bypasses UI clicks).
 * More reliable than click simulation in headless WebGL mode.
 */
export async function gotoScene(page: Page, sceneName: string, data?: Record<string, unknown>): Promise<void> {
  await page.evaluate(({ scene, d }) => (window as any).__VQA_GOTO__(scene, d), { scene: sceneName, d: data });
  await page.waitForTimeout(500);
  await waitForScene(page, sceneName);
}

/**
 * Wait for the Phaser canvas to load and MainMenuScene to become active.
 * Clears localStorage to ensure a fresh state.
 * Automatically dismisses Daily Reward popup if present.
 */
export async function waitForGameReady(page: Page, timeout = 30_000): Promise<void> {
  // Clear save data before loading the game
  await page.addInitScript(() => {
    localStorage.clear();
  });

  await page.goto('/', { waitUntil: 'domcontentloaded' });

  // Wait for the Phaser canvas element to appear
  await page.waitForSelector('canvas', { timeout });

  // Wait for VQA hooks to be available
  await page.waitForFunction(() => typeof (window as any).__VQA_STATE__ === 'function', { timeout });

  // Wait for MainMenuScene (goes through BootScene → PreloadScene → MainMenuScene)
  await waitForScene(page, 'MainMenuScene', timeout);

  // Dismiss Daily Reward popup by clicking Claim button (appears after ~400ms)
  await page.waitForTimeout(800);
  await page.evaluate(({ cx, cy }) => (window as any).__VQA_CLICK__(cx, cy), { cx: 640, cy: 470 });
  await page.waitForTimeout(500);
}

/**
 * Save a screenshot to /tmp/vqa/{name}.png
 */
export async function captureScreenshot(page: Page, name: string): Promise<string> {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
  const filePath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: filePath });
  return filePath;
}
