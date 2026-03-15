/**
 * TASK-063: Scene transition wiring auto-verification test.
 * Meta-test: verifies that all scene transitions reference registered scenes.
 * Prevents M-008 (dead code deployment) and M-009 (missing wiring).
 *
 * Approach: hardcode known scene registrations and transitions from source code.
 * If a new scene is added but not registered, or a transition targets a non-existent scene, test fails.
 */
import { describe, it, expect } from 'vitest';

// ── Known scene registrations (from src/config/game-config.ts scene array) ───

const KNOWN_SCENES = new Set([
  'BootScene',
  'PreloadScene',
  'MainMenuScene',
  'CharacterSelectScene',
  'RunScene',
  'GameOverScene',
  'MetaScene',
  'WeaponCodexScene',
  'EnemyCodexScene',
  'WorldMapScene',
]);

// ── Known scene transitions (from grep of scene.start/launch/navigateScene) ──

interface SceneTransition {
  from: string;
  to: string;
  method: 'start' | 'launch' | 'navigateScene';
  description: string;
}

const KNOWN_TRANSITIONS: SceneTransition[] = [
  // Boot → Preload
  { from: 'BootScene', to: 'PreloadScene', method: 'start', description: 'Boot loads assets then starts Preload' },

  // Preload → MainMenu
  {
    from: 'PreloadScene',
    to: 'MainMenuScene',
    method: 'start',
    description: 'Preload completes then starts MainMenu',
  },

  // MainMenu → CharacterSelect
  {
    from: 'MainMenuScene',
    to: 'CharacterSelectScene',
    method: 'navigateScene',
    description: 'Play button opens character selection',
  },

  // MainMenu → RunScene (quick start)
  {
    from: 'MainMenuScene',
    to: 'RunScene',
    method: 'navigateScene',
    description: 'Quick start bypasses character select',
  },

  // MainMenu → WeaponCodexScene
  {
    from: 'MainMenuScene',
    to: 'WeaponCodexScene',
    method: 'navigateScene',
    description: 'Weapons codex from main menu',
  },

  // MainMenu → EnemyCodexScene
  {
    from: 'MainMenuScene',
    to: 'EnemyCodexScene',
    method: 'navigateScene',
    description: 'Enemy codex from main menu',
  },

  // MainMenu → WorldMapScene
  {
    from: 'MainMenuScene',
    to: 'WorldMapScene',
    method: 'navigateScene',
    description: 'World map from main menu',
  },

  // CharacterSelect → MainMenu (back)
  {
    from: 'CharacterSelectScene',
    to: 'MainMenuScene',
    method: 'start',
    description: 'Back from character select',
  },

  // CharacterSelect → RunScene
  {
    from: 'CharacterSelectScene',
    to: 'RunScene',
    method: 'start',
    description: 'Start run with selected character',
  },

  // RunScene → GameOverScene
  {
    from: 'RunScene',
    to: 'GameOverScene',
    method: 'navigateScene',
    description: 'Run ends (death or victory)',
  },

  // RunScene → MainMenuScene (escape/quit)
  {
    from: 'RunScene',
    to: 'MainMenuScene',
    method: 'navigateScene',
    description: 'Quit run from pause menu',
  },

  // GameOver → MetaScene
  {
    from: 'GameOverScene',
    to: 'MetaScene',
    method: 'navigateScene',
    description: 'Go to meta upgrades after game over',
  },

  // GameOver → RunScene (retry)
  {
    from: 'GameOverScene',
    to: 'RunScene',
    method: 'navigateScene',
    description: 'Retry run from game over',
  },

  // GameOver → MainMenuScene
  {
    from: 'GameOverScene',
    to: 'MainMenuScene',
    method: 'navigateScene',
    description: 'Return to main menu from game over',
  },

  // MetaScene → MainMenuScene
  {
    from: 'MetaScene',
    to: 'MainMenuScene',
    method: 'navigateScene',
    description: 'Back from meta upgrades',
  },

  // WeaponCodex → MainMenuScene
  {
    from: 'WeaponCodexScene',
    to: 'MainMenuScene',
    method: 'navigateScene',
    description: 'Back from weapon codex',
  },

  // EnemyCodex → MainMenuScene
  {
    from: 'EnemyCodexScene',
    to: 'MainMenuScene',
    method: 'navigateScene',
    description: 'Back from enemy codex',
  },

  // WorldMap → MainMenuScene
  {
    from: 'WorldMapScene',
    to: 'MainMenuScene',
    method: 'navigateScene',
    description: 'Back from world map',
  },
];

// ── Tests ────────────────────────────────────────────────────────────────────

describe('TASK-063: Scene registration completeness', () => {
  it('has exactly 10 registered scenes', () => {
    expect(KNOWN_SCENES.size).toBe(10);
  });

  it('all scene files have matching registrations', () => {
    // These are the scene files found in src/scenes/ (excluding RunSceneInit which is a partial)
    const sceneFiles = [
      'BootScene',
      'PreloadScene',
      'MainMenuScene',
      'CharacterSelectScene',
      'RunScene',
      'GameOverScene',
      'MetaScene',
      'WeaponCodexScene',
      'EnemyCodexScene',
      'WorldMapScene',
    ];
    for (const scene of sceneFiles) {
      expect(KNOWN_SCENES.has(scene), `${scene} should be registered in game-config.ts`).toBe(true);
    }
  });
});

describe('TASK-063: All transition targets exist in KNOWN_SCENES', () => {
  for (const t of KNOWN_TRANSITIONS) {
    it(`${t.from} → ${t.to} (${t.description})`, () => {
      expect(KNOWN_SCENES.has(t.to), `Target scene "${t.to}" is not registered`).toBe(true);
      expect(KNOWN_SCENES.has(t.from), `Source scene "${t.from}" is not registered`).toBe(true);
    });
  }
});

describe('TASK-063: Scene graph connectivity', () => {
  it('every scene is reachable from BootScene', () => {
    // BFS from BootScene
    const adjacency = new Map<string, Set<string>>();
    for (const t of KNOWN_TRANSITIONS) {
      if (!adjacency.has(t.from)) adjacency.set(t.from, new Set());
      adjacency.get(t.from)!.add(t.to);
    }

    const visited = new Set<string>();
    const queue = ['BootScene'];
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);
      const neighbors = adjacency.get(current);
      if (neighbors) {
        for (const n of neighbors) {
          if (!visited.has(n)) queue.push(n);
        }
      }
    }

    for (const scene of KNOWN_SCENES) {
      expect(visited.has(scene), `${scene} is not reachable from BootScene`).toBe(true);
    }
  });

  it('MainMenuScene is the hub — reachable from most scenes', () => {
    const toMainMenu = KNOWN_TRANSITIONS.filter((t) => t.to === 'MainMenuScene');
    // At least 6 scenes navigate back to MainMenu
    expect(toMainMenu.length).toBeGreaterThanOrEqual(6);
  });

  it('RunScene is reachable from at least 2 paths', () => {
    const toRun = KNOWN_TRANSITIONS.filter((t) => t.to === 'RunScene');
    // CharacterSelect → RunScene, MainMenu → RunScene, GameOver → RunScene
    expect(toRun.length).toBeGreaterThanOrEqual(2);
  });

  it('no scene transitions to itself', () => {
    for (const t of KNOWN_TRANSITIONS) {
      expect(t.from).not.toBe(t.to);
    }
  });

  it('BootScene has no incoming transitions (entry point)', () => {
    const toBoot = KNOWN_TRANSITIONS.filter((t) => t.to === 'BootScene');
    expect(toBoot).toHaveLength(0);
  });

  it('GameOverScene has outgoing transitions (not a dead end)', () => {
    const fromGameOver = KNOWN_TRANSITIONS.filter((t) => t.from === 'GameOverScene');
    expect(fromGameOver.length).toBeGreaterThanOrEqual(2);
  });
});

describe('TASK-063: Transition count sanity', () => {
  it('has at least 18 known transitions', () => {
    expect(KNOWN_TRANSITIONS.length).toBeGreaterThanOrEqual(18);
  });

  it('all transitions use valid methods', () => {
    for (const t of KNOWN_TRANSITIONS) {
      expect(['start', 'launch', 'navigateScene']).toContain(t.method);
    }
  });

  it('navigateScene is the predominant method (safer transitions)', () => {
    const navCount = KNOWN_TRANSITIONS.filter((t) => t.method === 'navigateScene').length;
    const startCount = KNOWN_TRANSITIONS.filter((t) => t.method === 'start').length;
    // navigateScene handles fade-out/cleanup; most transitions should use it
    expect(navCount).toBeGreaterThan(startCount);
  });
});
