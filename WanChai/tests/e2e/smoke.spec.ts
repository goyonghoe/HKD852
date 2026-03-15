import { test, expect } from '@playwright/test';
import { waitForGameReady, getGameState, captureScreenshot } from './helpers';

test.describe('Smoke Tests', () => {
  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      await captureScreenshot(page, `smoke-fail-${testInfo.title.replace(/\s+/g, '_')}`);
    }
  });

  test('S1: Game loads without errors — canvas present and title correct', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('canvas', { timeout: 30_000 });

    expect(await page.title()).toBe('NEXT STOP — HK852');
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test('S2: Main menu is active after boot sequence', async ({ page }) => {
    await waitForGameReady(page);
    const state = await getGameState(page);
    expect(state.activeScene).toBe('MainMenuScene');
  });

  test('S3: No console errors during full boot + 3s idle', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await waitForGameReady(page);
    await page.waitForTimeout(3_000);

    expect(errors).toHaveLength(0);
  });
});
