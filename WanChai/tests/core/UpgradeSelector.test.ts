import { describe, it, expect } from 'vitest';
import { selectUpgrades, type EvolutionRecipe } from '../../src/core/UpgradeSelector';
import { SeededRandom } from '../../src/core/SeededRandom';

const weaponNames: Record<string, string> = {
  energy_shot: '에너지 샷',
  shotgun: '산탄총',
  laser: '레이저',
  rapid_fire: '속사포',
};

const passiveData: Record<string, { name: string; description: string; characterId?: string }> = {
  passive_speed: { name: '이동 속도', description: '+10% 이동 속도' },
  passive_crit: { name: '치명타', description: '+5% 치명타' },
};

// Extended passive data with character-specific entries
const passiveDataWithChar: Record<string, { name: string; description: string; characterId?: string }> = {
  ...passiveData,
  dash_trail: { name: '잔상', description: '이동 시 데미지 트레일 생성', characterId: 'hai' },
  gust: { name: '돌풍', description: '넉백 거리 +50%', characterId: 'hai' },
  frost_shot: { name: '결빙탄', description: '적중 시 20% 확률로 2초 감속', characterId: 'nova' },
  torrent: { name: '급류', description: '연속 공격 3회 시 공격속도 +30%', characterId: 'nova' },
  burn: { name: '연소', description: '적중 시 3초 DOT 데미지 부여', characterId: 'sol' },
};

const allPassiveIdsWithChar = ['passive_speed', 'passive_crit', 'dash_trail', 'gust', 'frost_shot', 'torrent', 'burn'];

function rng(seed = 42) {
  return new SeededRandom(seed);
}

describe('selectUpgrades', () => {
  it('returns empty when no options exist', () => {
    const result = selectUpgrades([], [], [], [], {}, {}, 3, 4, rng());
    expect(result).toHaveLength(0);
  });

  it('returns at most count choices', () => {
    const owned = [{ id: 'energy_shot', level: 1, maxLevel: 5 }];
    const result = selectUpgrades(
      owned,
      [],
      ['energy_shot', 'shotgun', 'laser', 'rapid_fire'],
      ['passive_speed', 'passive_crit'],
      weaponNames,
      passiveData,
      3,
      4,
      rng(),
    );
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it('includes upgradable owned weapons', () => {
    const owned = [{ id: 'energy_shot', level: 1, maxLevel: 5 }];
    const result = selectUpgrades(owned, [], ['energy_shot'], [], weaponNames, passiveData, 3, 4, rng());
    expect(result.length).toBe(1);
    expect(result[0].type).toBe('weapon');
    expect(result[0].id).toBe('energy_shot');
    expect(result[0].isNew).toBe(false);
    expect(result[0].level).toBe(2);
  });

  it('excludes maxed-out weapons', () => {
    const owned = [{ id: 'energy_shot', level: 5, maxLevel: 5 }];
    const result = selectUpgrades(owned, [], ['energy_shot'], [], weaponNames, passiveData, 3, 4, rng());
    expect(result).toHaveLength(0);
  });

  it('offers new weapons when under maxWeapons', () => {
    const owned = [{ id: 'energy_shot', level: 5, maxLevel: 5 }];
    const result = selectUpgrades(owned, [], ['energy_shot', 'shotgun'], [], weaponNames, passiveData, 3, 4, rng());
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('shotgun');
    expect(result[0].isNew).toBe(true);
    expect(result[0].level).toBe(1);
  });

  it('does not offer new weapons when at maxWeapons', () => {
    const owned = [
      { id: 'energy_shot', level: 5, maxLevel: 5 },
      { id: 'shotgun', level: 5, maxLevel: 5 },
    ];
    const result = selectUpgrades(
      owned,
      [],
      ['energy_shot', 'shotgun', 'laser'],
      [],
      weaponNames,
      passiveData,
      3,
      2,
      rng(),
    );
    expect(result).toHaveLength(0);
  });

  it('includes new passives', () => {
    const result = selectUpgrades([], [], [], ['passive_speed', 'passive_crit'], weaponNames, passiveData, 3, 4, rng());
    expect(result.length).toBe(2);
    expect(result.every((c) => c.type === 'passive')).toBe(true);
    expect(result.every((c) => c.isNew)).toBe(true);
  });

  it('includes upgradable passives', () => {
    const ownedPassives = [{ id: 'passive_speed', level: 1, maxLevel: 3 }];
    const result = selectUpgrades([], ownedPassives, [], ['passive_speed'], weaponNames, passiveData, 3, 4, rng());
    expect(result.length).toBe(1);
    expect(result[0].type).toBe('passive');
    expect(result[0].isNew).toBe(false);
    expect(result[0].level).toBe(2);
  });

  it('mixes weapons and passives', () => {
    const owned = [{ id: 'energy_shot', level: 1, maxLevel: 5 }];
    const result = selectUpgrades(
      owned,
      [],
      ['energy_shot', 'shotgun'],
      ['passive_speed'],
      weaponNames,
      passiveData,
      10,
      4,
      rng(),
    );
    const types = new Set(result.map((c) => c.type));
    expect(types.has('weapon')).toBe(true);
    expect(types.has('passive')).toBe(true);
  });

  it('never returns duplicate ids', () => {
    const owned = [{ id: 'energy_shot', level: 1, maxLevel: 5 }];
    for (let i = 0; i < 20; i++) {
      const result = selectUpgrades(
        owned,
        [],
        ['energy_shot', 'shotgun', 'laser'],
        ['passive_speed', 'passive_crit'],
        weaponNames,
        passiveData,
        5,
        4,
        rng(i),
      );
      const ids = result.map((c) => `${c.type}:${c.id}`);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('returns empty when all weapons and passives are maxed (pool exhaustion)', () => {
    // Simulate endgame: 4 weapons at max level, 2 passives at max level
    const maxedWeapons = [
      { id: 'energy_shot', level: 5, maxLevel: 5 },
      { id: 'shotgun', level: 5, maxLevel: 5 },
      { id: 'laser', level: 5, maxLevel: 5 },
      { id: 'rapid_fire', level: 5, maxLevel: 5 },
    ];
    const maxedPassives = [
      { id: 'passive_speed', level: 3, maxLevel: 3 },
      { id: 'passive_crit', level: 3, maxLevel: 3 },
    ];
    const result = selectUpgrades(
      maxedWeapons,
      maxedPassives,
      ['energy_shot', 'shotgun', 'laser', 'rapid_fire'],
      ['passive_speed', 'passive_crit'],
      weaponNames,
      passiveData,
      3,
      4,
      rng(),
    );
    expect(result).toHaveLength(0);
  });

  it('produces deterministic results with same seed', () => {
    const owned = [{ id: 'energy_shot', level: 1, maxLevel: 5 }];
    const result1 = selectUpgrades(
      owned,
      [],
      ['energy_shot', 'shotgun', 'laser'],
      ['passive_speed', 'passive_crit'],
      weaponNames,
      passiveData,
      3,
      4,
      rng(555),
    );
    const result2 = selectUpgrades(
      owned,
      [],
      ['energy_shot', 'shotgun', 'laser'],
      ['passive_speed', 'passive_crit'],
      weaponNames,
      passiveData,
      3,
      4,
      rng(555),
    );
    expect(result1.map((c) => c.id)).toEqual(result2.map((c) => c.id));
  });

  // === CHARACTER-SPECIFIC PASSIVE TESTS ===

  describe('character-specific passives', () => {
    it('only shows matching character passives for hai', () => {
      const result = selectUpgrades(
        [],
        [],
        [],
        allPassiveIdsWithChar,
        weaponNames,
        passiveDataWithChar,
        20,
        4,
        rng(),
        'hai',
      );
      const passiveIds = result.filter((c) => c.type === 'passive').map((c) => c.id);
      // Should include universal passives
      expect(passiveIds).toContain('passive_speed');
      expect(passiveIds).toContain('passive_crit');
      // Should include hai-specific passives
      expect(passiveIds).toContain('dash_trail');
      expect(passiveIds).toContain('gust');
      // Should NOT include nova or sol passives
      expect(passiveIds).not.toContain('frost_shot');
      expect(passiveIds).not.toContain('torrent');
      expect(passiveIds).not.toContain('burn');
    });

    it('only shows matching character passives for nova', () => {
      const result = selectUpgrades(
        [],
        [],
        [],
        allPassiveIdsWithChar,
        weaponNames,
        passiveDataWithChar,
        20,
        4,
        rng(),
        'nova',
      );
      const passiveIds = result.filter((c) => c.type === 'passive').map((c) => c.id);
      // Universal passives always present
      expect(passiveIds).toContain('passive_speed');
      expect(passiveIds).toContain('passive_crit');
      // Nova-specific
      expect(passiveIds).toContain('frost_shot');
      expect(passiveIds).toContain('torrent');
      // NOT hai or sol
      expect(passiveIds).not.toContain('dash_trail');
      expect(passiveIds).not.toContain('gust');
      expect(passiveIds).not.toContain('burn');
    });

    it('shows only universal passives when no characterId is provided', () => {
      const result = selectUpgrades([], [], [], allPassiveIdsWithChar, weaponNames, passiveDataWithChar, 20, 4, rng());
      const passiveIds = result.filter((c) => c.type === 'passive').map((c) => c.id);
      expect(passiveIds).toContain('passive_speed');
      expect(passiveIds).toContain('passive_crit');
      // No character-specific passives
      expect(passiveIds).not.toContain('dash_trail');
      expect(passiveIds).not.toContain('gust');
      expect(passiveIds).not.toContain('frost_shot');
      expect(passiveIds).not.toContain('torrent');
      expect(passiveIds).not.toContain('burn');
    });

    it('never returns duplicate ids even with character-specific 2x weighting', () => {
      for (let i = 0; i < 50; i++) {
        const result = selectUpgrades(
          [],
          [],
          [],
          allPassiveIdsWithChar,
          weaponNames,
          passiveDataWithChar,
          10,
          4,
          rng(i),
          'hai',
        );
        const ids = result.map((c) => `${c.type}:${c.id}`);
        expect(new Set(ids).size).toBe(ids.length);
      }
    });

    it('character-specific passives appear more often than universal (2x weight)', () => {
      // Statistical test: run many iterations and count appearances
      const charAppearances: Record<string, number> = { dash_trail: 0, gust: 0 };
      const universalAppearances: Record<string, number> = { passive_speed: 0, passive_crit: 0 };
      const iterations = 500;

      for (let i = 0; i < iterations; i++) {
        const result = selectUpgrades(
          [],
          [],
          [],
          allPassiveIdsWithChar,
          weaponNames,
          passiveDataWithChar,
          2,
          4,
          rng(i),
          'hai',
        );
        for (const choice of result) {
          if (choice.id in charAppearances) charAppearances[choice.id]++;
          if (choice.id in universalAppearances) universalAppearances[choice.id]++;
        }
      }

      // Character passives (2x weight) should appear more often on average
      const avgChar = (charAppearances.dash_trail + charAppearances.gust) / 2;
      const avgUniversal = (universalAppearances.passive_speed + universalAppearances.passive_crit) / 2;
      // With 2x weighting, character passives should be picked roughly twice as often
      // Allow generous tolerance for randomness
      expect(avgChar).toBeGreaterThan(avgUniversal * 0.8);
    });

    it('filters owned character-specific passives correctly during upgrade', () => {
      const ownedPassives = [{ id: 'dash_trail', level: 1, maxLevel: 3 }];
      const result = selectUpgrades(
        [],
        ownedPassives,
        [],
        allPassiveIdsWithChar,
        weaponNames,
        passiveDataWithChar,
        20,
        4,
        rng(),
        'hai',
      );
      const dashTrailChoice = result.find((c) => c.id === 'dash_trail');
      // Should offer upgrade (level 2)
      expect(dashTrailChoice).toBeDefined();
      expect(dashTrailChoice!.level).toBe(2);
      expect(dashTrailChoice!.isNew).toBe(false);
    });

    it('does not show other character owned passives', () => {
      // Player is hai but somehow has a nova passive (shouldn't happen, but test defensively)
      const ownedPassives = [{ id: 'frost_shot', level: 1, maxLevel: 3 }];
      const result = selectUpgrades(
        [],
        ownedPassives,
        [],
        allPassiveIdsWithChar,
        weaponNames,
        passiveDataWithChar,
        20,
        4,
        rng(),
        'hai',
      );
      // frost_shot belongs to nova — should not appear for hai
      const frostChoice = result.find((c) => c.id === 'frost_shot');
      expect(frostChoice).toBeUndefined();
    });
  });

  // === WEAPON EVOLUTION (T2) TESTS ===

  describe('weapon evolution', () => {
    const evoWeaponNames: Record<string, string> = {
      ...weaponNames,
      plasma_gatling: '플라즈마 개틀링',
      missile: '추적 미사일',
      bomb: '에너지 폭탄',
      cluster_warhead: '클러스터 탄두',
      laser_beam: '레이저 빔',
      lightning: '체인 라이트닝',
      tesla_arc: '테슬라 아크',
    };

    const evoRecipes: EvolutionRecipe[] = [
      {
        id: 'plasma_gatling',
        name: '플라즈마 개틀링',
        primary: 'energy_shot',
        primaryLevel: 5,
        secondary: 'rapid_fire',
        secondaryLevel: 3,
      },
      {
        id: 'cluster_warhead',
        name: '클러스터 탄두',
        primary: 'missile',
        primaryLevel: 5,
        secondary: 'bomb',
        secondaryLevel: 3,
      },
      {
        id: 'tesla_arc',
        name: '테슬라 아크',
        primary: 'laser_beam',
        primaryLevel: 5,
        secondary: 'lightning',
        secondaryLevel: 3,
      },
    ];

    it('offers evolution when both ingredients meet level requirement', () => {
      const owned = [
        { id: 'energy_shot', level: 5, maxLevel: 5 },
        { id: 'rapid_fire', level: 3, maxLevel: 5 },
      ];
      const result = selectUpgrades(
        owned,
        [],
        ['energy_shot', 'rapid_fire', 'plasma_gatling'],
        [],
        evoWeaponNames,
        passiveData,
        3,
        4,
        rng(),
        undefined,
        evoRecipes,
      );
      const evo = result.find((c) => c.type === 'evolution');
      expect(evo).toBeDefined();
      expect(evo!.id).toBe('plasma_gatling');
      expect(evo!.recipe).toEqual({ primary: 'energy_shot', secondary: 'rapid_fire' });
    });

    it('does NOT offer evolution when primary level is too low', () => {
      const owned = [
        { id: 'energy_shot', level: 4, maxLevel: 5 }, // needs 5
        { id: 'rapid_fire', level: 3, maxLevel: 5 },
      ];
      const result = selectUpgrades(
        owned,
        [],
        ['energy_shot', 'rapid_fire', 'plasma_gatling'],
        [],
        evoWeaponNames,
        passiveData,
        10,
        4,
        rng(),
        undefined,
        evoRecipes,
      );
      const evo = result.find((c) => c.type === 'evolution');
      expect(evo).toBeUndefined();
    });

    it('does NOT offer evolution when secondary level is too low', () => {
      const owned = [
        { id: 'energy_shot', level: 5, maxLevel: 5 },
        { id: 'rapid_fire', level: 2, maxLevel: 5 }, // needs 3
      ];
      const result = selectUpgrades(
        owned,
        [],
        ['energy_shot', 'rapid_fire', 'plasma_gatling'],
        [],
        evoWeaponNames,
        passiveData,
        10,
        4,
        rng(),
        undefined,
        evoRecipes,
      );
      const evo = result.find((c) => c.type === 'evolution');
      expect(evo).toBeUndefined();
    });

    it('does NOT offer evolution when player already owns T2 weapon', () => {
      const owned = [
        { id: 'energy_shot', level: 5, maxLevel: 5 },
        { id: 'rapid_fire', level: 3, maxLevel: 5 },
        { id: 'plasma_gatling', level: 1, maxLevel: 5 }, // already has it
      ];
      const result = selectUpgrades(
        owned,
        [],
        ['energy_shot', 'rapid_fire', 'plasma_gatling'],
        [],
        evoWeaponNames,
        passiveData,
        10,
        4,
        rng(),
        undefined,
        evoRecipes,
      );
      const evo = result.find((c) => c.type === 'evolution');
      expect(evo).toBeUndefined();
    });

    it('evolution choices appear first (priority)', () => {
      const owned = [
        { id: 'energy_shot', level: 5, maxLevel: 5 },
        { id: 'rapid_fire', level: 3, maxLevel: 5 },
      ];
      const result = selectUpgrades(
        owned,
        [],
        ['energy_shot', 'rapid_fire', 'plasma_gatling'],
        ['passive_speed'],
        evoWeaponNames,
        passiveData,
        3,
        4,
        rng(),
        undefined,
        evoRecipes,
      );
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].type).toBe('evolution');
      expect(result[0].id).toBe('plasma_gatling');
    });

    it('T2 weapons are not offered as new regular weapons', () => {
      const owned = [{ id: 'energy_shot', level: 1, maxLevel: 5 }];
      const allIds = ['energy_shot', 'rapid_fire', 'plasma_gatling', 'cluster_warhead', 'tesla_arc'];
      const result = selectUpgrades(
        owned,
        [],
        allIds,
        [],
        evoWeaponNames,
        passiveData,
        20,
        4,
        rng(),
        undefined,
        evoRecipes,
      );
      const t2InResults = result.filter(
        (c) => c.type === 'weapon' && ['plasma_gatling', 'cluster_warhead', 'tesla_arc'].includes(c.id),
      );
      expect(t2InResults).toHaveLength(0);
    });

    it('does NOT offer evolution when missing one ingredient entirely', () => {
      const owned = [
        { id: 'energy_shot', level: 5, maxLevel: 5 },
        // no rapid_fire at all
      ];
      const result = selectUpgrades(
        owned,
        [],
        ['energy_shot', 'rapid_fire', 'plasma_gatling'],
        [],
        evoWeaponNames,
        passiveData,
        10,
        4,
        rng(),
        undefined,
        evoRecipes,
      );
      const evo = result.find((c) => c.type === 'evolution');
      expect(evo).toBeUndefined();
    });
  });
});
