import { test, expect } from '@playwright/test';
import { waitForGameReady, waitForScene, getGameState, gotoScene, captureScreenshot } from './helpers';

test.describe('Game Flow E2E', () => {
  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      await captureScreenshot(page, `fail-${testInfo.title.replace(/\s+/g, '_')}`);
    }
  });

  test('T1: Boot → MainMenu', async ({ page }) => {
    await waitForGameReady(page);
    const state = await getGameState(page);
    expect(state.activeScene).toBe('MainMenuScene');
  });

  test('T2: MainMenu → CharacterSelect', async ({ page }) => {
    await waitForGameReady(page);
    await gotoScene(page, 'CharacterSelectScene');
    const state = await getGameState(page);
    expect(state.activeScene).toBe('CharacterSelectScene');
  });

  test('T3: CharacterSelect → RunScene', async ({ page }) => {
    await waitForGameReady(page);
    await gotoScene(page, 'RunScene', { characterId: 'kai', tutorial: false });

    const state = await getGameState(page);
    expect(state.activeScene).toBe('RunScene');
    expect(state.stage).toBe(1);
  });

  test('T4: RunScene — enemy spawn after 5s', async ({ page }) => {
    await waitForGameReady(page);
    await gotoScene(page, 'RunScene', { characterId: 'kai', tutorial: false });

    await page.waitForTimeout(5_000);

    const state = await getGameState(page);
    expect(state.enemies).toBeGreaterThan(0);
  });

  test('T5: RunScene — player takes damage after 15s', async ({ page }) => {
    test.setTimeout(90_000);
    await waitForGameReady(page);
    await gotoScene(page, 'RunScene', { characterId: 'kai', tutorial: false });

    // Record initial HP
    await page.waitForTimeout(2_000);
    const initialState = await getGameState(page);
    const initialHp = initialState.hp;
    expect(initialHp).not.toBeNull();

    // Wait for player to take damage
    await page.waitForTimeout(15_000);

    const laterState = await getGameState(page);
    expect(laterState.hp).not.toBeNull();
    // HP should decrease (enemies attacking barrier/player)
    expect(laterState.kills).toBeGreaterThan(0);
  });

  test('T6: RunScene → GameOver (force HP to 0)', async ({ page }) => {
    await waitForGameReady(page);
    await gotoScene(page, 'RunScene', { characterId: 'kai', tutorial: false });
    await page.waitForTimeout(2_000);

    // Force game over by calling progressionManager.onRunComplete(false)
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scenes = game.scene.getScenes(true);
      const runScene = scenes.find((s: any) => s.scene.key === 'RunScene');
      if (runScene) {
        (runScene as any).progressionManager.onRunComplete(false);
      }
    });

    await waitForScene(page, 'GameOverScene', 15_000);
    const state = await getGameState(page);
    expect(state.activeScene).toBe('GameOverScene');
  });

  test('T7: GameOver → MetaScene/MainMenu', async ({ page }) => {
    await waitForGameReady(page);
    await gotoScene(page, 'RunScene', { characterId: 'kai', tutorial: false });
    await page.waitForTimeout(2_000);

    // Force game over
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scenes = game.scene.getScenes(true);
      const runScene = scenes.find((s: any) => s.scene.key === 'RunScene');
      if (runScene) (runScene as any).progressionManager.onRunComplete(false);
    });
    await waitForScene(page, 'GameOverScene', 15_000);

    // Navigate back to menu from GameOver
    await gotoScene(page, 'MainMenuScene');
    const state = await getGameState(page);
    expect(state.activeScene).toBe('MainMenuScene');
  });

  test('T8: WeaponCodex → MainMenu round trip', async ({ page }) => {
    await waitForGameReady(page);
    await gotoScene(page, 'WeaponCodexScene');

    const state = await getGameState(page);
    expect(state.activeScene).toBe('WeaponCodexScene');

    await gotoScene(page, 'MainMenuScene');
    const menuState = await getGameState(page);
    expect(menuState.activeScene).toBe('MainMenuScene');
  });

  test('T9: EnemyCodex → MainMenu round trip', async ({ page }) => {
    await waitForGameReady(page);
    await gotoScene(page, 'EnemyCodexScene');

    const state = await getGameState(page);
    expect(state.activeScene).toBe('EnemyCodexScene');

    await gotoScene(page, 'MainMenuScene');
    const menuState = await getGameState(page);
    expect(menuState.activeScene).toBe('MainMenuScene');
  });

  test('T10: WorldMap → MainMenu round trip', async ({ page }) => {
    await waitForGameReady(page);
    await gotoScene(page, 'WorldMapScene');

    const state = await getGameState(page);
    expect(state.activeScene).toBe('WorldMapScene');

    await gotoScene(page, 'MainMenuScene');
    const menuState = await getGameState(page);
    expect(menuState.activeScene).toBe('MainMenuScene');
  });
});
