/**
 * HUDManager unit tests.
 *
 * Tests HP/XP bar calculations, dirty flag system, weather/district/critter HUD,
 * and boss HP bar behavior. Since HUDManager is tightly coupled to Phaser
 * (Graphics, Text, Tweens), we mock Phaser at module level and test the
 * behavioral/calculation logic via the update() method.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BALANCE, VISUAL } from '../../src/config/balance';
import { GAME_WIDTH } from '../../src/config/game-config';
import { NEON, NEON_CSS } from '../../src/config/colors';

// ── Mock Phaser ─────────────────────────────────────────────────────────────
vi.mock('phaser', () => {
  const BaseClass = class {
    constructor(..._args: unknown[]) {
      /* noop */
    }
  };
  return {
    default: {
      WEBGL: 1,
      AUTO: 0,
      Scene: BaseClass,
      Scale: { FIT: 1, CENTER_BOTH: 1 },
      GameObjects: {
        Graphics: BaseClass,
        Rectangle: BaseClass,
        Container: BaseClass,
        Sprite: BaseClass,
        Image: BaseClass,
        Text: BaseClass,
        Zone: BaseClass,
        Group: BaseClass,
      },
      Physics: {
        Arcade: {
          Sprite: BaseClass,
          Group: BaseClass,
          Body: BaseClass,
        },
      },
      Math: {
        Clamp: (val: number, min: number, max: number) => Math.min(Math.max(val, min), max),
      },
    },
  };
});

// Mock i18n
vi.mock('../../src/lib/i18n', () => ({
  t: (key: string, params?: Record<string, unknown>) => {
    if (key === 'hud.kills') return `Kills: ${params?.count ?? 0}`;
    if (key === 'hud.remaining') return `Remaining: ${params?.count ?? 0}`;
    if (key.startsWith('boss.')) return key;
    if (key.startsWith('weather.')) return key;
    if (key.startsWith('district.')) return key;
    return key;
  },
}));

// Mock districts
vi.mock('../../src/config/districts', () => ({
  getDistrictForStage: (stage: number) => {
    if (stage >= 1 && stage <= 2) return { id: 'central', element: 'WIND', weatherEffect: 'speed_all' };
    if (stage >= 3 && stage <= 4) return { id: 'tst', element: 'WATER', weatherEffect: 'rain' };
    return { id: 'central', element: 'WIND', weatherEffect: 'speed_all' };
  },
}));

import { HUDManager, type HUDCallbacks } from '../../src/managers/HUDManager';

// ── Mock factories ──────────────────────────────────────────────────────────

function createMockGraphics() {
  return {
    setScrollFactor: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    setAlpha: vi.fn().mockReturnThis(),
    setVisible: vi.fn().mockReturnThis(),
    clear: vi.fn().mockReturnThis(),
    fillStyle: vi.fn(),
    fillRect: vi.fn(),
    fillCircle: vi.fn(),
    lineStyle: vi.fn(),
    strokeRect: vi.fn(),
    strokeCircle: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    fillPath: vi.fn(),
    destroy: vi.fn(),
    alpha: 1,
  };
}

function createMockText() {
  let textContent = '';
  let color = '';
  let alphaVal = 1;
  return {
    setScrollFactor: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    setOrigin: vi.fn().mockReturnThis(),
    setAlpha: vi.fn(function (this: { alpha: number }, a: number) {
      alphaVal = a;
      this.alpha = a;
      return this;
    }),
    setColor: vi.fn(function (c: string) {
      color = c;
      return this;
    }),
    setText: vi.fn(function (t: string) {
      textContent = t;
      return this;
    }),
    getText: () => textContent,
    getColor: () => color,
    text: '',
    alpha: alphaVal,
    x: 0,
    y: 0,
    setInteractive: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
  };
}

function createMockRectangle() {
  return {
    setScrollFactor: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    setStrokeStyle: vi.fn().mockReturnThis(),
    setFillStyle: vi.fn().mockReturnThis(),
    setInteractive: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
  };
}

function createMockImage() {
  return {
    setDisplaySize: vi.fn().mockReturnThis(),
    setAlpha: vi.fn().mockReturnThis(),
    setScrollFactor: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    setTexture: vi.fn().mockReturnThis(),
    alpha: 0,
    destroy: vi.fn(),
  };
}

function createMockScene() {
  return {
    add: {
      graphics: vi.fn(() => createMockGraphics()),
      text: vi.fn(() => createMockText()),
      rectangle: vi.fn(() => createMockRectangle()),
      image: vi.fn(() => createMockImage()),
    },
    tweens: {
      add: vi.fn(() => ({ stop: vi.fn(), destroy: vi.fn() })),
    },
    textures: {
      exists: vi.fn(() => false),
    },
    game: {
      loop: {
        actualFps: 60,
      },
    },
  } as unknown as import('phaser').Scene;
}

function createHUDCallbacks(): HUDCallbacks {
  return {
    togglePause: vi.fn(),
    cycleSpeed: vi.fn(),
    showWeaponRange: vi.fn(),
    hideWeaponRange: vi.fn(),
  };
}

function createRunState(overrides: Partial<import('../../src/types/game').RunState> = {}) {
  return {
    characterId: 'hai',
    seed: 1,
    runTime: 0,
    stageTime: overrides.stageTime ?? 0,
    stage: overrides.stage ?? 1,
    playerLevel: overrides.playerLevel ?? 1,
    playerXp: overrides.playerXp ?? 0,
    baseHp: overrides.baseHp ?? 600,
    baseMaxHp: overrides.baseMaxHp ?? 600,
    kills: overrides.kills ?? 0,
    gold: overrides.gold ?? 0,
    weapons: overrides.weapons ?? [],
    passives: overrides.passives ?? [],
    totalDamageDealt: overrides.totalDamageDealt ?? 0,
    weaponDamageMap: overrides.weaponDamageMap ?? {},
    critHitsLanded: overrides.critHitsLanded ?? 0,
    totalHitsLanded: overrides.totalHitsLanded ?? 0,
    highestSingleHit: overrides.highestSingleHit ?? 0,
  } as import('../../src/types/game').RunState;
}

function createMockPlayer(
  overrides: Partial<{
    damageMultiplier: number;
    attackSpeedMultiplier: number;
    critChance: number;
    critDamage: number;
    elementColor: number;
    elementName: string;
    ultimateGauge: number;
    ultimateMax: number;
  }> = {},
) {
  return {
    damageMultiplier: overrides.damageMultiplier ?? 1,
    attackSpeedMultiplier: overrides.attackSpeedMultiplier ?? 1,
    critChance: overrides.critChance ?? 0,
    critDamage: overrides.critDamage ?? 2,
    elementColor: overrides.elementColor ?? 0x00ffcc,
    elementName: overrides.elementName ?? 'WIND',
    ultimateGauge: overrides.ultimateGauge ?? 0,
    ultimateMax: overrides.ultimateMax ?? BALANCE.ULTIMATE.gaugeMax,
  };
}

function createMockSpawnManager(
  overrides: Partial<{
    isBossStage: boolean;
    isSpawnEnded: boolean;
  }> = {},
) {
  return {
    isBossStage: overrides.isBossStage ?? false,
    isSpawnEnded: overrides.isSpawnEnded ?? false,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// Tests
// ═════════════════════════════════════════════════════════════════════════════

describe('HUDManager — HP bar calculations', () => {
  let hud: HUDManager;
  let scene: ReturnType<typeof createMockScene>;

  beforeEach(() => {
    scene = createMockScene();
    hud = new HUDManager(scene as never, createHUDCallbacks());
    hud.create();
  });

  it('HP bar width proportional to current/max HP (full)', () => {
    const rs = createRunState({ baseHp: 600, baseMaxHp: 600 });
    hud.update(16, rs, createMockPlayer() as never, [], null, [], 0, createMockSpawnManager() as never, 10);
    // Full HP → pct = 100 → base bar should fill entire width
    // We verify the dirty flag cache was updated
    expect((hud as any).gaugePanel.prevBaseHpPct).toBe(100);
  });

  it('HP bar pct at 50% HP', () => {
    const rs = createRunState({ baseHp: 300, baseMaxHp: 600 });
    hud.update(16, rs, createMockPlayer() as never, [], null, [], 0, createMockSpawnManager() as never, 10);
    expect((hud as any).gaugePanel.prevBaseHpPct).toBe(50);
  });

  it('HP bar pct at 0 HP', () => {
    const rs = createRunState({ baseHp: 0, baseMaxHp: 600 });
    hud.update(16, rs, createMockPlayer() as never, [], null, [], 0, createMockSpawnManager() as never, 10);
    expect((hud as any).gaugePanel.prevBaseHpPct).toBe(0);
  });

  it('XP bar width proportional to xp/xpToNext (half full)', () => {
    const rs = createRunState({ playerXp: 5 });
    hud.update(16, rs, createMockPlayer() as never, [], null, [], 0, createMockSpawnManager() as never, 10);
    // xp=5, xpRequired=10 → 50%
    expect((hud as any).gaugePanel.prevXpPct).toBe(50);
  });

  it('XP bar clamped to 100% when xp >= xpRequired', () => {
    const rs = createRunState({ playerXp: 15 });
    hud.update(16, rs, createMockPlayer() as never, [], null, [], 0, createMockSpawnManager() as never, 10);
    // min(15/10, 1) = 1 → 100%
    expect((hud as any).gaugePanel.prevXpPct).toBe(100);
  });

  it('XP bar at 0% when no XP', () => {
    const rs = createRunState({ playerXp: 0 });
    hud.update(16, rs, createMockPlayer() as never, [], null, [], 0, createMockSpawnManager() as never, 10);
    expect((hud as any).gaugePanel.prevXpPct).toBe(0);
  });

  it('HP bar width constant from VISUAL.UI.baseBarWidth', () => {
    expect(VISUAL.UI.baseBarWidth).toBeGreaterThan(0);
    expect(VISUAL.UI.baseBarWidth).toBeLessThanOrEqual(GAME_WIDTH);
  });

  it('XP bar width constant from VISUAL.UI.xpBarWidth', () => {
    expect(VISUAL.UI.xpBarWidth).toBeGreaterThan(0);
    expect(VISUAL.UI.xpBarWidth).toBeLessThanOrEqual(GAME_WIDTH);
  });
});

describe('HUDManager — dirty flag system', () => {
  let hud: HUDManager;
  let scene: ReturnType<typeof createMockScene>;

  beforeEach(() => {
    scene = createMockScene();
    hud = new HUDManager(scene as never, createHUDCallbacks());
    hud.create();
  });

  it('HUD only updates bar when values change', () => {
    const rs = createRunState({ baseHp: 600, baseMaxHp: 600, kills: 5 });
    const player = createMockPlayer();
    const sm = createMockSpawnManager();

    // First update sets dirty flags
    hud.update(16, rs, player as never, [], null, [], 0, sm as never, 10);
    const firstBaseHpPct = (hud as any).gaugePanel.prevBaseHpPct;
    expect(firstBaseHpPct).toBe(100);

    // Graphics clear is called during first render
    const gfxCalls = (scene.add.graphics as ReturnType<typeof vi.fn>).mock.results;
    const baseBarGfx = gfxCalls[0]?.value;
    const clearCallCount1 = baseBarGfx?.clear.mock.calls.length ?? 0;

    // Second update with same values — should NOT re-render base bar
    hud.update(16, rs, player as never, [], null, [], 0, sm as never, 10);
    const clearCallCount2 = baseBarGfx?.clear.mock.calls.length ?? 0;
    expect(clearCallCount2).toBe(clearCallCount1); // no additional clear
  });

  it('resetDirtyFlags clears all flags', () => {
    const rs = createRunState({ baseHp: 300, baseMaxHp: 600, kills: 10, playerLevel: 3 });
    hud.update(16, rs, createMockPlayer() as never, [], null, [], 0, createMockSpawnManager() as never, 10);

    hud.resetDirtyFlags();

    // All prev* fields should be reset to -1 or empty
    const internal = hud as unknown as Record<string, unknown>;
    // Fields on GaugePanel
    const gaugePanel = (hud as any).gaugePanel;
    expect(gaugePanel.prevBaseHpPct).toBe(-1);
    expect(gaugePanel.prevXpPct).toBe(-1);
    expect(gaugePanel.prevBossHpPct).toBe(-1);
    expect(gaugePanel.prevUltGaugePct).toBe(-1);
    expect(gaugePanel.prevCritterCdPct).toBe(-1);
    // Fields on WeaponSlotPanel
    const weaponPanel = (hud as any).weaponSlotPanel;
    expect(weaponPanel.prevWeaponSlotStr).toBe('');
    // Fields on HUDManager
    expect(internal.prevKills).toBe(-1);
    expect(internal.prevLevel).toBe(-1);
    expect(internal.prevTimerStr).toBe('');
    expect(internal.prevGold).toBe(-1);
    expect(internal.prevStage).toBe(-1);
    expect(internal.prevStatsStr).toBe('');
    expect(internal.prevWeatherEffect).toBe('');
    expect(internal.prevDistrictId).toBe('');
  });

  it('each stat has independent dirty tracking', () => {
    const rs1 = createRunState({ baseHp: 600, baseMaxHp: 600, kills: 0 });
    hud.update(16, rs1, createMockPlayer() as never, [], null, [], 0, createMockSpawnManager() as never, 10);

    // Change only kills
    const rs2 = createRunState({ baseHp: 600, baseMaxHp: 600, kills: 5 });
    hud.update(16, rs2, createMockPlayer() as never, [], null, [], 0, createMockSpawnManager() as never, 10);

    const internal = hud as unknown as Record<string, unknown>;
    // HP should remain cached (unchanged), kills should update
    expect((hud as any).gaugePanel.prevBaseHpPct).toBe(100);
    expect(internal.prevKills).toBe(5);
  });

  it('gold text updates when gold changes', () => {
    const rs1 = createRunState({ gold: 0 });
    hud.update(16, rs1, createMockPlayer() as never, [], null, [], 0, createMockSpawnManager() as never, 10);
    expect((hud as unknown as { prevGold: number }).prevGold).toBe(0);

    const rs2 = createRunState({ gold: 50 });
    hud.update(16, rs2, createMockPlayer() as never, [], null, [], 0, createMockSpawnManager() as never, 10);
    expect((hud as unknown as { prevGold: number }).prevGold).toBe(50);
  });

  it('level text updates when playerLevel changes', () => {
    const rs1 = createRunState({ playerLevel: 1 });
    hud.update(16, rs1, createMockPlayer() as never, [], null, [], 0, createMockSpawnManager() as never, 10);
    expect((hud as unknown as { prevLevel: number }).prevLevel).toBe(1);

    const rs2 = createRunState({ playerLevel: 5 });
    hud.update(16, rs2, createMockPlayer() as never, [], null, [], 0, createMockSpawnManager() as never, 10);
    expect((hud as unknown as { prevLevel: number }).prevLevel).toBe(5);
  });
});

describe('HUDManager — weather/district/critter HUD', () => {
  let hud: HUDManager;
  let scene: ReturnType<typeof createMockScene>;

  beforeEach(() => {
    scene = createMockScene();
    hud = new HUDManager(scene as never, createHUDCallbacks());
    hud.create();
  });

  it('weather indicator updates when weather effect changes', () => {
    const rs = createRunState({ stage: 1 });
    hud.update(
      16,
      rs,
      createMockPlayer() as never,
      [],
      null,
      [],
      0,
      createMockSpawnManager() as never,
      10,
      null,
      'speed_all',
    );
    expect((hud as unknown as { prevWeatherEffect: string }).prevWeatherEffect).toBe('speed_all');
  });

  it('weather indicator clears when weather is empty', () => {
    const rs = createRunState({ stage: 1 });
    // First set weather
    hud.update(
      16,
      rs,
      createMockPlayer() as never,
      [],
      null,
      [],
      0,
      createMockSpawnManager() as never,
      10,
      null,
      'rain',
    );
    expect((hud as unknown as { prevWeatherEffect: string }).prevWeatherEffect).toBe('rain');

    // Clear weather
    hud.update(16, rs, createMockPlayer() as never, [], null, [], 0, createMockSpawnManager() as never, 10, null, '');
    expect((hud as unknown as { prevWeatherEffect: string }).prevWeatherEffect).toBe('');
  });

  it('district name shows on stage change', () => {
    const rs1 = createRunState({ stage: 1 });
    hud.update(16, rs1, createMockPlayer() as never, [], null, [], 0, createMockSpawnManager() as never, 10);
    expect((hud as unknown as { prevDistrictId: string }).prevDistrictId).toBe('central');

    const rs2 = createRunState({ stage: 3 });
    hud.update(16, rs2, createMockPlayer() as never, [], null, [], 0, createMockSpawnManager() as never, 10);
    expect((hud as unknown as { prevDistrictId: string }).prevDistrictId).toBe('tst');
  });

  it('critter cooldown arc progress tracks correctly', () => {
    const rs = createRunState();
    const critter = {
      cooldownTimer: 500,
      def: { cooldownMs: 1000, element: 'WIND', nameKo: 'test' },
    };
    hud.update(
      16,
      rs,
      createMockPlayer() as never,
      [],
      null,
      [],
      0,
      createMockSpawnManager() as never,
      10,
      critter as never,
    );
    // cdPct = Math.round((500/1000)*100) = 50
    expect((hud as any).gaugePanel.prevCritterCdPct).toBe(50);
  });

  it('critter HUD clears when critter is null', () => {
    const rs = createRunState();
    // First show critter
    const critter = {
      cooldownTimer: 100,
      def: { cooldownMs: 1000, element: 'WIND', nameKo: 'test' },
    };
    hud.update(
      16,
      rs,
      createMockPlayer() as never,
      [],
      null,
      [],
      0,
      createMockSpawnManager() as never,
      10,
      critter as never,
    );
    expect((hud as any).gaugePanel.prevCritterCdPct).toBe(10);

    // Then remove critter
    hud.update(16, rs, createMockPlayer() as never, [], null, [], 0, createMockSpawnManager() as never, 10, null);
    expect((hud as any).gaugePanel.prevCritterCdPct).toBe(-1);
  });
});

describe('HUDManager — boss HP bar', () => {
  let hud: HUDManager;
  let scene: ReturnType<typeof createMockScene>;

  beforeEach(() => {
    scene = createMockScene();
    hud = new HUDManager(scene as never, createHUDCallbacks());
    hud.create();
  });

  it('boss HP bar appears when boss spawns', () => {
    const boss = {
      active: true,
      hp: 1000,
      maxHp: 1000,
      behavior: 'boss_chase',
      x: 360,
      y: 200,
      isElite: false,
    };
    const rs = createRunState();
    hud.update(
      16,
      rs,
      createMockPlayer() as never,
      [],
      boss as never,
      [],
      0,
      createMockSpawnManager({ isBossStage: true }) as never,
      10,
    );

    // Boss HP pct should be tracked
    expect((hud as any).gaugePanel.prevBossHpPct).toBe(100);
  });

  it('boss HP bar updates with boss damage', () => {
    const rs = createRunState();
    const boss1 = { active: true, hp: 1000, maxHp: 1000, behavior: 'boss_chase', x: 360, y: 200, isElite: false };
    hud.update(
      16,
      rs,
      createMockPlayer() as never,
      [],
      boss1 as never,
      [],
      0,
      createMockSpawnManager({ isBossStage: true }) as never,
      10,
    );
    expect((hud as any).gaugePanel.prevBossHpPct).toBe(100);

    const boss2 = { active: true, hp: 500, maxHp: 1000, behavior: 'boss_chase', x: 360, y: 200, isElite: false };
    hud.update(
      16,
      rs,
      createMockPlayer() as never,
      [],
      boss2 as never,
      [],
      0,
      createMockSpawnManager({ isBossStage: true }) as never,
      10,
    );
    expect((hud as any).gaugePanel.prevBossHpPct).toBe(50);
  });

  it('boss HP bar disappears when boss dies', () => {
    const rs = createRunState();
    // Boss alive
    const boss = { active: true, hp: 100, maxHp: 1000, behavior: 'boss_chase', x: 360, y: 200, isElite: false };
    hud.update(
      16,
      rs,
      createMockPlayer() as never,
      [],
      boss as never,
      [],
      0,
      createMockSpawnManager({ isBossStage: true }) as never,
      10,
    );
    expect((hud as any).gaugePanel.prevBossHpPct).toBe(10);

    // Boss dead (null)
    hud.update(
      16,
      rs,
      createMockPlayer() as never,
      [],
      null,
      [],
      0,
      createMockSpawnManager({ isBossStage: true }) as never,
      10,
    );
    expect((hud as any).gaugePanel.prevBossHpPct).toBe(-1);
  });
});

describe('HUDManager — timer display', () => {
  let hud: HUDManager;

  beforeEach(() => {
    const scene = createMockScene();
    hud = new HUDManager(scene as never, createHUDCallbacks());
    hud.create();
  });

  it('shows BOSS when isBossStage', () => {
    const rs = createRunState({ stageTime: 5000 });
    hud.update(
      16,
      rs,
      createMockPlayer() as never,
      [],
      null,
      [],
      0,
      createMockSpawnManager({ isBossStage: true }) as never,
      10,
    );
    expect((hud as unknown as { prevTimerStr: string }).prevTimerStr).toBe('BOSS');
  });

  it('shows remaining count when spawn ended', () => {
    const rs = createRunState({ stageTime: 70000 });
    // activeEnemyCount=5 must match an activeEnemies array of length >= 5
    const fakeEnemies = Array.from({ length: 5 }, (_, i) => ({
      x: 100 + i * 50,
      y: 200,
      active: true,
      hp: 10,
      maxHp: 10,
      isElite: false,
      behavior: 'march',
    }));
    hud.update(
      16,
      rs,
      createMockPlayer() as never,
      [],
      null,
      fakeEnemies as never[],
      5,
      createMockSpawnManager({ isSpawnEnded: true }) as never,
      10,
    );
    expect((hud as unknown as { prevTimerStr: string }).prevTimerStr).toContain('5');
  });

  it('shows countdown timer during wave', () => {
    const rs = createRunState({ stageTime: 10000, stage: 1 });
    hud.update(16, rs, createMockPlayer() as never, [], null, [], 0, createMockSpawnManager() as never, 10);
    // stage 1 duration = 60000, stageTime=10000 → remaining = 50s → "0:50"
    expect((hud as unknown as { prevTimerStr: string }).prevTimerStr).toBe('0:50');
  });
});

describe('HUDManager — ultimate gauge', () => {
  let hud: HUDManager;

  beforeEach(() => {
    const scene = createMockScene();
    hud = new HUDManager(scene as never, createHUDCallbacks());
    hud.create();
  });

  it('ultimate gauge pct tracks player gauge', () => {
    const rs = createRunState();
    const player = createMockPlayer({ ultimateGauge: 50, ultimateMax: 100 });
    hud.update(16, rs, player as never, [], null, [], 0, createMockSpawnManager() as never, 10);
    expect((hud as any).gaugePanel.prevUltGaugePct).toBe(50);
  });

  it('ultimate gauge at 100% when full', () => {
    const rs = createRunState();
    const player = createMockPlayer({ ultimateGauge: 100, ultimateMax: 100 });
    hud.update(16, rs, player as never, [], null, [], 0, createMockSpawnManager() as never, 10);
    expect((hud as any).gaugePanel.prevUltGaugePct).toBe(100);
  });

  it('ultimate gauge at 0% when empty', () => {
    const rs = createRunState();
    const player = createMockPlayer({ ultimateGauge: 0, ultimateMax: 100 });
    hud.update(16, rs, player as never, [], null, [], 0, createMockSpawnManager() as never, 10);
    expect((hud as any).gaugePanel.prevUltGaugePct).toBe(0);
  });
});

describe('HUDManager — balance config integration', () => {
  it('HUD constants are defined in BALANCE.HUD', () => {
    expect(BALANCE.HUD.weatherIndicatorX).toBeDefined();
    expect(BALANCE.HUD.weatherIndicatorY).toBeDefined();
    expect(BALANCE.HUD.weatherDotRadius).toBeGreaterThan(0);
    expect(BALANCE.HUD.weatherTextOffsetX).toBeDefined();
    expect(BALANCE.HUD.critterCdX).toBeDefined();
    expect(BALANCE.HUD.critterCdY).toBeDefined();
    expect(BALANCE.HUD.critterCdRadius).toBeGreaterThan(0);
    expect(BALANCE.HUD.districtLabelFadeMs).toBeGreaterThan(0);
    expect(BALANCE.HUD.districtLabelFontSize).toBeGreaterThan(0);
  });

  it('ULTIMATE gauge bar dimensions are defined', () => {
    expect(BALANCE.ULTIMATE.gaugeBarWidth).toBeGreaterThan(0);
    expect(BALANCE.ULTIMATE.gaugeBarHeight).toBeGreaterThan(0);
    expect(BALANCE.ULTIMATE.pulseAlphaMin).toBeGreaterThan(0);
    expect(BALANCE.ULTIMATE.pulseAlphaMax).toBeLessThanOrEqual(1);
    expect(BALANCE.ULTIMATE.pulseDurationMs).toBeGreaterThan(0);
  });

  it('base bar and XP bar fit within game width', () => {
    expect(VISUAL.UI.baseBarWidth).toBeLessThanOrEqual(GAME_WIDTH);
    expect(VISUAL.UI.xpBarWidth).toBeLessThanOrEqual(GAME_WIDTH);
  });

  it('all NEON colors used in HUD are defined', () => {
    expect(NEON.UI_PANEL).toBeDefined();
    expect(NEON.UI_BORDER).toBeDefined();
    expect(NEON.UI_ACCENT).toBeDefined();
    expect(NEON.HEALTH).toBeDefined();
    expect(NEON.GOLD).toBeDefined();
    expect(NEON.XP_BAR).toBeDefined();
    expect(NEON.BOSS_WARNING).toBeDefined();
    expect(NEON_CSS.UI_TEXT).toBeDefined();
    expect(NEON_CSS.UI_DIM).toBeDefined();
    expect(NEON_CSS.GOLD).toBeDefined();
  });
});

describe('HUDManager — stage text', () => {
  let hud: HUDManager;

  beforeEach(() => {
    const scene = createMockScene();
    hud = new HUDManager(scene as never, createHUDCallbacks());
    hud.create();
  });

  it('stage text updates on stage change', () => {
    const rs = createRunState({ stage: 3 });
    hud.update(16, rs, createMockPlayer() as never, [], null, [], 0, createMockSpawnManager() as never, 10);
    expect((hud as unknown as { prevStage: number }).prevStage).toBe(3);
  });
});
