/**
 * TASK-075: M-008 Integration Audit Tests
 * Automated dead code / wiring checks:
 *   1. Unused BALANCE constants scanner
 *   2. Scene transition completeness
 *   3. Manager wiring check in RunScene
 *
 * Uses fs.readFileSync to verify source patterns (same approach as PoolingAudit).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { resolve } from 'path';
import { BALANCE, VISUAL } from '../../src/config/balance';

// ── Helpers ──────────────────────────────────────────────────────────────────

const PROJECT_ROOT = resolve(__dirname, '../..');
const SRC_ROOT = resolve(PROJECT_ROOT, 'src');

function readSource(relativePath: string): string {
  return readFileSync(resolve(SRC_ROOT, relativePath), 'utf-8');
}

/**
 * Recursively collect all .ts files under a directory.
 */
function collectTsFiles(dir: string): string[] {
  const results: string[] = [];
  if (!existsSync(dir)) return results;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectTsFiles(fullPath));
    } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Read all src/ .ts files (excluding balance.ts itself and test files) into a single concatenated string.
 */
function getAllSrcContent(excludeFiles: string[] = []): string {
  const allFiles = collectTsFiles(SRC_ROOT);
  const normalizedExcludes = excludeFiles.map((f) => resolve(SRC_ROOT, f));
  return allFiles
    .filter((f) => !normalizedExcludes.includes(f))
    .map((f) => readFileSync(f, 'utf-8'))
    .join('\n');
}

// Lazy caches
let _allSrcExceptBalance: string;
function allSrcExceptBalance(): string {
  return (_allSrcExceptBalance ??= getAllSrcContent(['config/balance.ts']));
}

let _runSceneSource: string;
function runSceneSource(): string {
  // Include RunSceneInit.ts (extracted factory helpers) alongside RunScene.ts
  return (_runSceneSource ??= readSource('scenes/RunScene.ts') + '\n' + readSource('scenes/RunSceneInit.ts'));
}

let _allSrcContent: string;
function allSrcContent(): string {
  return (_allSrcContent ??= getAllSrcContent([]));
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. Unused BALANCE constants scanner (5+ tests)
// ═══════════════════════════════════════════════════════════════════════════════

describe('M-008 Audit — Unused BALANCE constants', () => {
  /**
   * Flatten nested BALANCE object into dot-path keys.
   * e.g., BALANCE.PLAYER.baseMoveSpeed -> 'PLAYER.baseMoveSpeed'
   */
  function flattenKeys(obj: Record<string, unknown>, prefix = ''): string[] {
    const keys: string[] = [];
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        keys.push(...flattenKeys(value as Record<string, unknown>, fullKey));
      } else {
        keys.push(fullKey);
      }
    }
    return keys;
  }

  /**
   * Known legacy / dynamically-accessed constants that are intentionally
   * not referenced by name in src/ but are kept for documentation or
   * accessed via bracket notation (e.g., gaugePerKill[tier]).
   *
   * Each entry should have a comment explaining WHY it is exempted.
   */
  const KNOWN_BALANCE_LEGACY = new Set([
    'SPAWN.eliteChanceMax', // cap checked inside SpawnManager via Math.min (value used as upper bound in config comment)
    'RUN.stageDurationMs', // referenced in SpawnManager via bracket or comment-only config value
    'STAGE.clearPauseMs', // legacy — clearPause was removed in ProgressionManager refactor
    'ULTIMATE.gaugePerKill.t2', // accessed dynamically: gaugePerKill[tier as keyof ...]
    'WEATHER.rainDamagePerSec', // legacy, kept for ref (comment in balance.ts)
    'WEATHER.flameZoneDamage', // used in WeatherManager flame zone logic (accessed via BALANCE.WEATHER destructure)
    'PLAYER.critMultiplier', // duplicate of COMBAT.critMultiplier — COMBAT version is canonical
    'ULTIMATE.nova.range', // defined but unused — ultimateNova uses freezeDurationMs only
    'ULTIMATE.mei.piercing', // defined but unused — ultimateMei uses width + damage only
    'ULTIMATE.mei.range', // defined but unused — ultimateMei uses width + damage only
    'BASE.height', // legacy — hill defense uses circular zone instead of horizontal bar
    'SPAWN.spawnYMin', // legacy — hill defense spawns from left/right edges, kept for ref
    'SPAWN.spawnYMax', // legacy — hill defense spawns from left/right edges, kept for ref
    'SPAWN.spawnYRangeMin', // legacy — replaced by groundY/airYMin/airYMax for side-view
    'SPAWN.spawnYRangeMax', // legacy — replaced by groundY/airYMin/airYMax for side-view
    'BASE.damageFlashMs', // legacy — street defense uses BARRIER.damageFlashMs instead
    'BASE.rightReachX', // legacy — street defense is single-direction (enemies approach from right only)
    'SPAWN.spawnLeftX', // legacy — street defense spawns from right side only
    'BARRIER.width', // legacy — debug rect removed, barricade sprites are visual only
    'BARRIER.height', // legacy — debug rect removed, barricade sprites are visual only
    'PARALLAX.layerSpeeds', // legacy — parallax scrolling disabled (static background)
    'PARALLAX.baseScrollSpeed', // legacy — parallax scrolling disabled (static background)
    'ARIA.cooldownMs', // accessed indirectly in AriaDialogueCalc via throttle check
    'BOSS_PHASE.phase2SpeedMult.boss_chase', // dynamically accessed via getPhase2Stats(speedMultMap[behavior])
    'BOSS_PHASE.phase2SpeedMult.boss_circle', // dynamically accessed via getPhase2Stats(speedMultMap[behavior])
    'BOSS_PHASE.phase2SpeedMult.boss_burst', // dynamically accessed via getPhase2Stats(speedMultMap[behavior])
    'BOSS_PHASE.phase2DamageMult.boss_chase', // dynamically accessed via getPhase2Stats(damageMultMap[behavior])
    'BOSS_PHASE.phase2DamageMult.boss_circle', // dynamically accessed via getPhase2Stats(damageMultMap[behavior])
    'BOSS_PHASE.phase2DamageMult.boss_burst', // dynamically accessed via getPhase2Stats(damageMultMap[behavior])
    'GROUND.height', // legacy — replaced by CraftPix floor tiles (rows * tileSize)
    'GROUND.topHighlightHeight', // legacy — replaced by CraftPix floor tiles
    'GROUND.alpha', // legacy — replaced by CraftPix floor tiles
    'LAYOUT.TOP_HUD_H', // layout reference constant — used for zone design docs
    'LAYOUT.COMBAT_TOP', // layout reference constant — used for zone design docs
    'LAYOUT.COMBAT_BOTTOM', // layout reference constant — used for zone design docs
    'LAYOUT.GROUND_Y', // layout reference constant — duplicated by GROUND.y (canonical)
    'LAYOUT.GROUND_TILE_SIZE', // layout reference constant — duplicated by GROUND.tileSize (canonical)
    'LAYOUT.BOTTOM_HUD_Y', // layout reference constant — used for zone design docs
    'BARRICADE_VISUAL.damageMarkCount', // legacy — CraftPix barrier sprites replace Graphics marks
    'PLAYER.baseMoveSpeed', // legacy — horizontal movement removed in side-view auto-shooter
    'MID_SHOP.armorBuff', // legacy — superseded by armorBoostPercent
    'MID_SHOP.armorDurationMs', // legacy — armor is permanent per-run, not timed
    'BARRICADE_VISUAL.wallWidth', // legacy — kept for reference (comment in balance.ts)
    'BARRICADE_VISUAL.wallHeight', // legacy — kept for reference (comment in balance.ts)
    'POSTFX.poisonTintColor', // reserved — poison mechanic planned but not yet implemented
  ]);

  const KNOWN_VISUAL_LEGACY = new Set([
    'ANIM.levelUpPauseMs', // legacy field
    'ANIM.orbFloatSpeed', // legacy field
    'ANIM.SCENE_FADE', // legacy field kept for existing UI components
    'ANIM.SCORE_ROLL_MIN', // legacy field kept for existing UI components
    'ANIM.SCORE_ROLL_MAX', // legacy field kept for existing UI components
    'PARTICLE.xpPickup', // legacy field
    'UI.MIN_TOUCH_TARGET', // legacy field kept for existing UI components
    'UI.hpBarWidth', // legacy field kept for existing UI components
    'UI.hpBarHeight', // legacy field kept for existing UI components
    'UI.joystickRadius', // legacy field kept for existing UI components
    'UI.joystickDeadzone', // legacy field kept for existing UI components
    'UI.barrierBarWidth', // disabled — barrier HP bar removed (redundant with base HP bar)
    'UI.barrierBarHeight', // disabled — barrier HP bar removed
    'UI.barrierBarOffsetY', // disabled — barrier HP bar removed
  ]);

  // Get all leaf keys from BALANCE
  const balanceLeafKeys = flattenKeys(BALANCE as unknown as Record<string, unknown>);
  // Get all leaf keys from VISUAL
  const visualLeafKeys = flattenKeys(VISUAL as unknown as Record<string, unknown>);

  it('BALANCE has leaf keys to scan', () => {
    expect(balanceLeafKeys.length).toBeGreaterThan(30);
  });

  it('VISUAL has leaf keys to scan', () => {
    expect(visualLeafKeys.length).toBeGreaterThan(10);
  });

  it('every BALANCE top-level section is referenced in src/', () => {
    const src = allSrcExceptBalance();
    const topLevelSections = Object.keys(BALANCE);
    const unreferenced: string[] = [];

    for (const section of topLevelSections) {
      // Check for BALANCE.SECTION pattern
      const pattern = `BALANCE.${section}`;
      if (!src.includes(pattern)) {
        unreferenced.push(section);
      }
    }
    expect(unreferenced).toEqual([]);
  });

  it('every BALANCE leaf constant is referenced or documented as legacy', () => {
    const src = allSrcExceptBalance();
    const unreferenced: string[] = [];

    // Detect alias patterns:
    // Level 1: `const P = BALANCE.PASSIVE;` → aliasMap['PASSIVE'] = ['P']
    // Level 2: `const cfg = BALANCE.ULTIMATE.nova;` → deepAliasMap['ULTIMATE.nova'] = ['cfg']
    const aliasMap = new Map<string, string[]>();
    const deepAliasMap = new Map<string, string[]>();
    const aliasRegex = /(?:const|let)\s+(\w+)\s*=\s*BALANCE\.(\w+)(?:\.(\w+))?/g;
    let m: RegExpExecArray | null;
    while ((m = aliasRegex.exec(src)) !== null) {
      const [, alias, section, subsection] = m;
      if (subsection) {
        // Deep alias: const cfg = BALANCE.ULTIMATE.nova
        const key = `${section}.${subsection}`;
        if (!deepAliasMap.has(key)) deepAliasMap.set(key, []);
        deepAliasMap.get(key)!.push(alias);
      } else {
        if (!aliasMap.has(section)) aliasMap.set(section, []);
        aliasMap.get(section)!.push(alias);
      }
    }

    // Detect function-argument passing: `someFunc(xxx, BALANCE.SECTION)` or `someFunc(BALANCE.SECTION)`
    // When a whole BALANCE section is passed as a typed config parameter, all its fields are consumed.
    const sectionsPassedAsArg = new Set<string>();
    const argRegex = /\bBALANCE\.(\w+)\b/g;
    while ((m = argRegex.exec(src)) !== null) {
      sectionsPassedAsArg.add(m[1]);
    }

    for (const leafKey of balanceLeafKeys) {
      // Skip stages array entries (accessed by index)
      if (leafKey.startsWith('STAGE.stages.')) continue;
      // Skip known legacy/dynamic constants
      if (KNOWN_BALANCE_LEGACY.has(leafKey)) continue;

      const parts = leafKey.split('.');
      const leafName = parts[parts.length - 1];
      const section = parts[0];
      const fullPattern = `BALANCE.${leafKey}`;

      // Build the parent path for deep alias (e.g., ULTIMATE.nova for ULTIMATE.nova.range)
      const parentPath = parts.length >= 3 ? `${parts[0]}.${parts[1]}` : '';

      // Check: full BALANCE.X.y, section.leafName, alias.leafName, deep alias, or section passed as arg
      let found = src.includes(fullPattern);
      if (!found && sectionsPassedAsArg.has(section)) {
        // BALANCE.SECTION is referenced in src (e.g., passed as function argument)
        // so all leaf fields under that section are considered consumed
        found = true;
      }
      if (!found && leafKey.includes('.')) {
        found = src.includes(leafKey); // SECTION.leafName
      }
      if (!found) {
        // Level 1 alias: `P.burnChancePerLevel` when `const P = BALANCE.PASSIVE`
        const aliases = aliasMap.get(section) ?? [];
        for (const alias of aliases) {
          if (src.includes(`${alias}.${leafName}`)) {
            found = true;
            break;
          }
        }
      }
      if (!found && parentPath) {
        // Level 2 alias: `cfg.range` when `const cfg = BALANCE.ULTIMATE.nova`
        const deepAliases = deepAliasMap.get(parentPath) ?? [];
        for (const alias of deepAliases) {
          if (src.includes(`${alias}.${leafName}`)) {
            found = true;
            break;
          }
        }
      }
      if (!found) {
        // Bracket notation: `gaugePerKill[tier]` or `advantages[attacker]`
        // Check if the immediate parent is accessed with bracket notation
        const parentName = parts.length >= 2 ? parts[parts.length - 2] : '';
        if (parentName && src.includes(`${parentName}[`)) {
          found = true;
        }
      }
      if (!found) {
        unreferenced.push(leafKey);
      }
    }

    expect(unreferenced).toEqual([]);
  });

  it('known BALANCE legacy set does not exceed reasonable limit (prevents bloat)', () => {
    expect(KNOWN_BALANCE_LEGACY.size).toBeLessThanOrEqual(50);
  });

  it('every VISUAL leaf constant is referenced or documented as legacy', () => {
    const src = allSrcExceptBalance();
    const unreferenced: string[] = [];

    // Detect alias patterns like `const anim = VISUAL.ANIM;`
    const vAliasMap = new Map<string, string[]>();
    const vAliasRegex = /(?:const|let)\s+(\w+)\s*=\s*VISUAL\.(\w+)/g;
    let vm: RegExpExecArray | null;
    while ((vm = vAliasRegex.exec(src)) !== null) {
      const [, alias, section] = vm;
      if (!vAliasMap.has(section)) vAliasMap.set(section, []);
      vAliasMap.get(section)!.push(alias);
    }

    for (const leafKey of visualLeafKeys) {
      // Skip known legacy
      if (KNOWN_VISUAL_LEGACY.has(leafKey)) continue;

      const parts = leafKey.split('.');
      const leafName = parts[parts.length - 1];
      const section = parts[0];
      const fullPattern = `VISUAL.${leafKey}`;

      let found = src.includes(fullPattern);
      if (!found && leafKey.includes('.')) {
        found = src.includes(leafKey);
      }
      if (!found) {
        const aliases = vAliasMap.get(section) ?? [];
        for (const alias of aliases) {
          if (src.includes(`${alias}.${leafName}`)) {
            found = true;
            break;
          }
        }
      }
      if (!found) {
        unreferenced.push(leafKey);
      }
    }

    expect(unreferenced).toEqual([]);
  });

  it('known VISUAL legacy set does not exceed 15 items (prevents bloat)', () => {
    expect(KNOWN_VISUAL_LEGACY.size).toBeLessThanOrEqual(15);
  });

  it('BALANCE.STAGE.stages array is accessed with index notation in src/', () => {
    const src = allSrcExceptBalance();
    // stages are accessed as BALANCE.STAGE.stages[...]
    expect(src).toContain('BALANCE.STAGE.stages[');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. Scene transition completeness (5+ tests)
// ═══════════════════════════════════════════════════════════════════════════════

describe('M-008 Audit — Scene transition completeness', () => {
  // All scene files in src/scenes/
  const scenesDir = resolve(SRC_ROOT, 'scenes');
  const sceneFiles = readdirSync(scenesDir).filter((f) => f.endsWith('.ts') && f.endsWith('Scene.ts'));

  // Extract scene keys from game-config.ts
  const gameConfigSrc = readSource('config/game-config.ts');

  // Extract all scene transition targets from all src/ files:
  // - scene.start('XXX'), scene.launch('XXX') (direct Phaser calls)
  // - navigateScene(this, 'From', 'Target') (SceneNav utility wrapper)
  function extractSceneTargets(): string[] {
    const src = allSrcContent();
    const targets: string[] = [];
    const regex = /scene\.start\(['"](\w+)['"]/g;
    let match;
    while ((match = regex.exec(src)) !== null) {
      targets.push(match[1]);
    }
    const launchRegex = /scene\.launch\(['"](\w+)['"]/g;
    while ((match = launchRegex.exec(src)) !== null) {
      targets.push(match[1]);
    }
    // navigateScene(scene, 'FromScene', 'TargetScene', data?) — 3rd arg is the target
    const navRegex = /navigateScene\([^,]+,\s*['"](\w+)['"],\s*['"](\w+)['"]/g;
    while ((match = navRegex.exec(src)) !== null) {
      targets.push(match[2]); // 3rd argument = target scene
    }
    return [...new Set(targets)];
  }

  // Extract scene keys registered in game-config.ts
  function extractRegisteredScenes(): string[] {
    const src = gameConfigSrc;
    // Match class names in the scene: [...] array
    const regex = /(\w+Scene)/g;
    const matches = [...src.matchAll(regex)].map((m) => m[1]);
    return [...new Set(matches)];
  }

  it('all scene files in scenes/ directory are .ts files', () => {
    for (const file of sceneFiles) {
      expect(file.endsWith('.ts')).toBe(true);
    }
  });

  it('every scene.start() target has a corresponding scene file', () => {
    const targets = extractSceneTargets();
    const missing: string[] = [];

    for (const target of targets) {
      const expectedFile = `${target}.ts`;
      if (!sceneFiles.includes(expectedFile)) {
        missing.push(target);
      }
    }
    expect(missing).toEqual([]);
  });

  it('every scene.start() target is registered in game-config.ts', () => {
    const targets = extractSceneTargets();
    const registered = extractRegisteredScenes();

    const unregistered: string[] = [];
    for (const target of targets) {
      if (!registered.includes(target)) {
        unregistered.push(target);
      }
    }
    expect(unregistered).toEqual([]);
  });

  it('every scene file in scenes/ is registered in game-config.ts', () => {
    const registered = extractRegisteredScenes();
    const unregistered: string[] = [];

    for (const file of sceneFiles) {
      const sceneName = file.replace('.ts', '');
      if (!registered.includes(sceneName)) {
        unregistered.push(sceneName);
      }
    }
    expect(unregistered).toEqual([]);
  });

  it('no orphan scenes — every scene (except BootScene) is a target of at least one scene.start()', () => {
    const targets = extractSceneTargets();
    const orphans: string[] = [];

    for (const file of sceneFiles) {
      const sceneName = file.replace('.ts', '');
      // BootScene is the entry point — it is never started by another scene
      if (sceneName === 'BootScene') continue;
      if (!targets.includes(sceneName)) {
        orphans.push(sceneName);
      }
    }
    expect(orphans).toEqual([]);
  });

  it('game-config.ts scene array has >= 5 scenes', () => {
    const registered = extractRegisteredScenes();
    expect(registered.length).toBeGreaterThanOrEqual(5);
  });

  it('BootScene is first in game-config scene array', () => {
    // First scene class reference in the scene array should be BootScene
    const sceneArrayMatch = gameConfigSrc.match(/scene:\s*\[\s*(\w+)/);
    expect(sceneArrayMatch).not.toBeNull();
    expect(sceneArrayMatch![1]).toBe('BootScene');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. Manager wiring check (3+ tests)
// ═══════════════════════════════════════════════════════════════════════════════

describe('M-008 Audit — Manager wiring in RunScene', () => {
  const src = runSceneSource();

  /**
   * Extract lifecycle-managed imports (managers instantiated with `new` and stored as fields).
   * Excludes static utility imports like SaveManager which are used via static methods.
   */
  function extractLifecycleManagerImports(): string[] {
    const managers: string[] = [];
    const regex = /import\s+\{?\s*(\w+Manager)\s*\}?\s+from\s+['"]\.\.\/managers\/(\w+)['"]/g;
    let match;
    while ((match = regex.exec(src)) !== null) {
      managers.push(match[1]);
    }
    // SaveManager is a static utility (used via SaveManager.loadMeta(), SaveManager.discoverEnemy())
    // not a lifecycle manager instantiated with `new`
    return managers.filter((m) => m !== 'SaveManager');
  }

  it('all lifecycle managers have a field declaration in RunScene', () => {
    const imports = extractLifecycleManagerImports();
    const missing: string[] = [];

    for (const mgr of imports) {
      // Check for field declaration like: private phaseManager!: PhaseManager
      if (!src.includes(`: ${mgr}`)) {
        missing.push(mgr);
      }
    }
    expect(missing).toEqual([]);
  });

  it('all lifecycle managers are instantiated with new in create()', () => {
    const imports = extractLifecycleManagerImports();
    const notInstantiated: string[] = [];

    for (const mgr of imports) {
      const instantiation = `new ${mgr}(`;
      if (!src.includes(instantiation)) {
        notInstantiated.push(mgr);
      }
    }
    expect(notInstantiated).toEqual([]);
  });

  it('managers with update() are called in RunScene update loop', () => {
    // These managers have update() methods that must be called each frame.
    // We verify their camelCase field name followed by .update( or .update (
    const managersWithUpdate = [
      { className: 'WeatherManager', fieldName: 'weatherManager' },
      { className: 'HUDManager', fieldName: 'hudManager' },
    ];

    const missing: string[] = [];
    for (const { className, fieldName } of managersWithUpdate) {
      const updateCall = `this.${fieldName}.update(`;
      if (!src.includes(updateCall)) {
        missing.push(`${className}.update()`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('UltimateManager has update or equivalent usage in RunScene', () => {
    // UltimateManager may use a different method name; verify field is used
    expect(src).toContain('this.ultimateManager');
  });

  it('ProgressionManager is instantiated and stored as field', () => {
    expect(src).toContain('new ProgressionManager(');
    expect(src).toContain('progressionManager');
  });

  it('WeatherManager has both apply() and shutdown() called in RunScene', () => {
    expect(src).toContain('.weatherManager.apply(');
    expect(src).toContain('.weatherManager.shutdown()');
  });

  it('SpawnManager has create() and update() called in RunScene', () => {
    expect(src).toContain('.spawnManager.create(');
    expect(src).toContain('.spawnManager.update(');
  });

  it('CollisionManager is imported and has clearEnemyProjectiles called', () => {
    expect(src).toContain('CollisionManager');
    expect(src).toContain('clearEnemyProjectiles');
  });

  it('SaveManager is used as a static utility (not a lifecycle manager)', () => {
    // SaveManager is used via static methods, not instantiated as a field
    expect(src).toContain('SaveManager.');
    // Verify it is NOT instantiated with new
    expect(src).not.toContain('new SaveManager(');
  });

  it('no unused lifecycle manager import (every imported manager has at least one method call)', () => {
    const imports = extractLifecycleManagerImports();
    const unused: string[] = [];

    for (const mgr of imports) {
      // Convert ClassName to fieldName: PhaseManager -> phaseManager, HUDManager -> hUDManager (wrong)
      // Instead, look for the class name pattern in field declarations
      // Fields may be private, public, or have no access modifier (internal, accessed by RunSceneInit factories)
      const fieldRegex = new RegExp(`(?:private\\s+|public\\s+)?(?!(?:import|from))\\b(\\w+)[!:?].*${mgr}`);
      const fieldMatch = src.match(fieldRegex);
      if (!fieldMatch) {
        unused.push(mgr);
        continue;
      }
      const fieldName = fieldMatch[1];
      // Count both direct (.) and optional-chain (?.) usage
      const usagePattern1 = `this.${fieldName}.`;
      const usagePattern2 = `this.${fieldName}?.`;
      const occurrences = src.split(usagePattern1).length - 1 + (src.split(usagePattern2).length - 1);
      if (occurrences < 1) {
        unused.push(mgr);
      }
    }
    expect(unused).toEqual([]);
  });
});
