import { describe, it, expect } from 'vitest';
import { getSceneTransition, isSleepable, isOverlay, getSceneMemoryWeight } from '../../src/core/SceneLifecycleCalc';

describe('SceneLifecycleCalc', () => {
  describe('getSceneTransition', () => {
    it('RunScene → codex should sleep', () => {
      const t = getSceneTransition('RunScene', 'WeaponCodexScene');
      expect(t.action).toBe('sleep');
      expect(t.preserveState).toBe(true);
    });

    it('RunScene → EnemyCodex should sleep', () => {
      const t = getSceneTransition('RunScene', 'EnemyCodexScene');
      expect(t.action).toBe('sleep');
    });

    it('RunScene → WorldMap should sleep', () => {
      const t = getSceneTransition('RunScene', 'WorldMapScene');
      expect(t.action).toBe('sleep');
    });

    it('codex → RunScene should wake', () => {
      const t = getSceneTransition('WeaponCodexScene', 'RunScene');
      expect(t.action).toBe('wake');
      expect(t.preserveState).toBe(true);
    });

    it('RunScene → GameOverScene should start (destroy)', () => {
      const t = getSceneTransition('RunScene', 'GameOverScene');
      expect(t.action).toBe('start');
      expect(t.preserveState).toBe(false);
    });

    it('MainMenu → RunScene should start', () => {
      const t = getSceneTransition('MainMenuScene', 'RunScene');
      expect(t.action).toBe('start');
    });

    it('any → HUDScene should launch (overlay)', () => {
      const t = getSceneTransition('RunScene', 'HUDScene');
      expect(t.action).toBe('launch');
      expect(t.preserveState).toBe(true);
    });

    it('any → PauseScene should launch (overlay)', () => {
      const t = getSceneTransition('RunScene', 'PauseScene');
      expect(t.action).toBe('launch');
    });
  });

  describe('isSleepable', () => {
    it('RunScene is sleepable', () => {
      expect(isSleepable('RunScene')).toBe(true);
    });

    it('MainMenuScene is not sleepable', () => {
      expect(isSleepable('MainMenuScene')).toBe(false);
    });
  });

  describe('isOverlay', () => {
    it('HUDScene is overlay', () => {
      expect(isOverlay('HUDScene')).toBe(true);
    });

    it('PauseScene is overlay', () => {
      expect(isOverlay('PauseScene')).toBe(true);
    });

    it('RunScene is not overlay', () => {
      expect(isOverlay('RunScene')).toBe(false);
    });
  });

  describe('getSceneMemoryWeight', () => {
    it('RunScene has highest weight', () => {
      expect(getSceneMemoryWeight('RunScene')).toBe(10);
    });

    it('codex scenes have low weight', () => {
      expect(getSceneMemoryWeight('WeaponCodexScene')).toBe(1);
      expect(getSceneMemoryWeight('EnemyCodexScene')).toBe(1);
    });

    it('unknown scene defaults to 1', () => {
      expect(getSceneMemoryWeight('UnknownScene')).toBe(1);
    });

    it('BootScene has zero weight', () => {
      expect(getSceneMemoryWeight('BootScene')).toBe(0);
    });
  });
});
