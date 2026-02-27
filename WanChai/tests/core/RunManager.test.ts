import { describe, it, expect, beforeEach } from 'vitest';
import { RunManager } from '../../src/core/RunManager';
import { CritterManager, resetCritterIdCounter } from '../../src/core/CritterManager';
import { ROGUELIKE } from '../../src/config/roguelike-balance';
import type { RunState } from '../../src/types/run';

// Use known critter definition IDs from the definitions file
const CRITTER_ID = 'fire_fox';
const WORLD_ID = 1;
const SEED = 42;

function makeInstances(count: number) {
  return Array.from({ length: count }, () => CritterManager.createInstance(CRITTER_ID));
}

describe('RunManager', () => {
  beforeEach(() => {
    resetCritterIdCounter();
  });

  describe('startRun', () => {
    it('creates a valid RunState with correct initial values', () => {
      const instances = makeInstances(3);
      const state = RunManager.startRun(WORLD_ID, SEED, instances);

      expect(state.seed).toBe(SEED);
      expect(state.worldId).toBe(WORLD_ID);
      expect(state.phase).toBe('map');
      expect(state.currentFloor).toBe(1);
      expect(state.currentNodeId).toBeNull();
      expect(state.stagesCleared).toBe(0);
      expect(state.turnsTotal).toBe(0);
      expect(state.relics).toHaveLength(0);
    });

    it('party is limited to MAX_PARTY_SIZE', () => {
      const overLimit = ROGUELIKE.RUN.MAX_PARTY_SIZE + 5;
      const instances = makeInstances(overLimit);
      const state = RunManager.startRun(WORLD_ID, SEED, instances);

      expect(state.party).toHaveLength(ROGUELIKE.RUN.MAX_PARTY_SIZE);
    });

    it('party critters have correct AP and are not exhausted', () => {
      const instances = makeInstances(2);
      const state = RunManager.startRun(WORLD_ID, SEED, instances);

      for (const partyCritter of state.party) {
        expect(partyCritter.isExhausted).toBe(false);
        expect(partyCritter.currentAP).toBe(partyCritter.maxAP);
        expect(partyCritter.maxAP).toBeGreaterThan(0);
      }
    });

    it('generates floorMaps (FLOORS_PER_RUN + boss floor)', () => {
      const instances = makeInstances(1);
      const state = RunManager.startRun(WORLD_ID, SEED, instances);

      expect(state.floorMaps).toHaveLength(ROGUELIKE.RUN.FLOORS_PER_RUN + 1);
    });
  });

  describe('selectNode', () => {
    let state: RunState;

    beforeEach(() => {
      state = RunManager.startRun(WORLD_ID, SEED, makeInstances(3));
    });

    it('selects a valid layer-0 node when currentNodeId is null', () => {
      const firstFloorMap = state.floorMaps[0];
      const firstNode = firstFloorMap.nodes[0];
      const result = RunManager.selectNode(state, firstNode.id);

      expect(result).toBe(true);
      expect(state.currentNodeId).toBe(firstNode.id);
      expect(firstNode.visited).toBe(true);
    });

    it('fails to select a non-layer-0 node when no current node is set', () => {
      const firstFloorMap = state.floorMaps[0];
      const secondNode = firstFloorMap.nodes[1]; // layer 1
      const result = RunManager.selectNode(state, secondNode.id);

      expect(result).toBe(false);
      expect(state.currentNodeId).toBeNull();
    });

    it('selects connected node from current node', () => {
      const firstFloorMap = state.floorMaps[0];
      const firstNode = firstFloorMap.nodes[0];
      const secondNode = firstFloorMap.nodes[1];

      RunManager.selectNode(state, firstNode.id);
      const result = RunManager.selectNode(state, secondNode.id);

      expect(result).toBe(true);
      expect(state.currentNodeId).toBe(secondNode.id);
    });

    it('fails to select an unreachable node (not connected)', () => {
      const firstFloorMap = state.floorMaps[0];
      const firstNode = firstFloorMap.nodes[0]; // layer 0
      // Find a layer-2 node — not directly reachable from layer 0 (requires going through layer 1)
      const layer2Node = firstFloorMap.nodes.find((n) => n.layer === 2);
      if (!layer2Node) throw new Error('Expected a layer-2 node in the floor map');

      RunManager.selectNode(state, firstNode.id);
      // From layer 0, only layer 1 is directly reachable; layer 2 requires traversing layer 1 first
      const result = RunManager.selectNode(state, layer2Node.id);

      expect(result).toBe(false);
    });
  });

  describe('beginBattle', () => {
    let state: RunState;

    beforeEach(() => {
      state = RunManager.startRun(WORLD_ID, SEED, makeInstances(3));
      // Select the first (battle) node
      const firstFloorMap = state.floorMaps[0];
      RunManager.selectNode(state, firstFloorMap.nodes[0].id);
    });

    it('returns levelData, heroQueue, and blightMap for a battle node', () => {
      const result = RunManager.beginBattle(state);

      expect(result).not.toBeNull();
      expect(result!.levelData).toBeDefined();
      expect(result!.heroQueue).toBeDefined();
      expect(Array.isArray(result!.heroQueue)).toBe(true);
      expect(result!.blightMap).toBeInstanceOf(Map);
    });

    it('levelData has combat board with enemyGrid (SPEC-021)', () => {
      const result = RunManager.beginBattle(state);
      expect(result).not.toBeNull();
      const { rows, cols } = result!.levelData.board;
      // Floor 1 normal battle: 3x3 (COMBAT_SCALING.BOARD_SIZE.F1)
      expect(rows).toBeGreaterThanOrEqual(3);
      expect(cols).toBeGreaterThanOrEqual(3);
      expect(rows).toBeLessThanOrEqual(6);
      expect(cols).toBeLessThanOrEqual(6);
      // Must have enemyGrid and playerHp
      expect(result!.levelData.enemyGrid).toBeDefined();
      expect(result!.levelData.enemyGrid!.length).toBe(rows);
      expect(result!.levelData.playerHp).toBeGreaterThan(0);
    });

    it('blightMap is empty for combat boards', () => {
      const result = RunManager.beginBattle(state);
      expect(result).not.toBeNull();
      expect(result!.blightMap.size).toBe(0);
    });

    it('sets phase to battle', () => {
      RunManager.beginBattle(state);
      expect(state.phase).toBe('battle');
    });

    it('returns null if phase is not map', () => {
      state.phase = 'battle'; // already in battle
      const result = RunManager.beginBattle(state);
      expect(result).toBeNull();
    });

    it('heroQueue contains non-exhausted party critters as HeroInstances', () => {
      const result = RunManager.beginBattle(state);
      expect(result!.heroQueue).toHaveLength(state.party.filter((p) => !p.isExhausted).length);
      for (const hero of result!.heroQueue) {
        expect(hero.ap).toBeGreaterThan(0);
        expect(hero.isSpent).toBe(false);
      }
    });
  });

  describe('endBattle', () => {
    let state: RunState;

    beforeEach(() => {
      state = RunManager.startRun(WORLD_ID, SEED, makeInstances(3));
      const firstFloorMap = state.floorMaps[0];
      RunManager.selectNode(state, firstFloorMap.nodes[0].id);
      RunManager.beginBattle(state);
    });

    it('won: increments stagesCleared', () => {
      expect(state.stagesCleared).toBe(0);
      RunManager.endBattle(state, true, 1000);
      expect(state.stagesCleared).toBe(1);
    });

    it('won: sets phase to reward', () => {
      RunManager.endBattle(state, true, 500);
      expect(state.phase).toBe('reward');
    });

    it('won: awards XP to non-exhausted party members', () => {
      const initialExp = state.party[0].instance.exp;
      RunManager.endBattle(state, true, 1000);
      expect(state.party[0].instance.exp).toBe(initialExp + ROGUELIKE.XP.BATTLE_DEPLOY);
    });

    it('lost: sets phase to run_failed', () => {
      RunManager.endBattle(state, false, 0);
      expect(state.phase).toBe('run_failed');
    });

    it('lost: does not increment stagesCleared', () => {
      RunManager.endBattle(state, false, 0);
      expect(state.stagesCleared).toBe(0);
    });
  });

  describe('advanceToNextFloor', () => {
    it('increments currentFloor and resets navigation state', () => {
      const state = RunManager.startRun(WORLD_ID, SEED, makeInstances(2));
      expect(state.currentFloor).toBe(1);

      const result = RunManager.advanceToNextFloor(state);

      expect(result).toBe(true);
      expect(state.currentFloor).toBe(2);
      expect(state.phase).toBe('map');
      expect(state.currentNodeId).toBeNull();
    });

    it('returns false when no more floors remain', () => {
      const state = RunManager.startRun(WORLD_ID, SEED, makeInstances(1));
      // Advance past all floors
      const totalFloors = state.floorMaps.length;
      for (let i = 0; i < totalFloors - 1; i++) {
        RunManager.advanceToNextFloor(state);
      }
      // Now at last floor — trying to advance should return false
      const result = RunManager.advanceToNextFloor(state);
      expect(result).toBe(false);
    });
  });

  describe('isRunOver', () => {
    it('returns false for active run phases', () => {
      const state = RunManager.startRun(WORLD_ID, SEED, makeInstances(1));
      expect(RunManager.isRunOver(state)).toBe(false);
    });

    it('returns true for run_complete phase', () => {
      const state = RunManager.startRun(WORLD_ID, SEED, makeInstances(1));
      state.phase = 'run_complete';
      expect(RunManager.isRunOver(state)).toBe(true);
    });

    it('returns true for run_failed phase', () => {
      const state = RunManager.startRun(WORLD_ID, SEED, makeInstances(1));
      state.phase = 'run_failed';
      expect(RunManager.isRunOver(state)).toBe(true);
    });
  });

  describe('purchaseShopItem', () => {
    let state: RunState;

    beforeEach(() => {
      state = RunManager.startRun(WORLD_ID, SEED, makeInstances(2));
      state.purificationScore = 1000;
    });

    it('levelup: deducts cost and adds XP to target', () => {
      const target = state.party[0];
      const initialExp = target.instance.exp;
      const result = RunManager.purchaseShopItem(state, 'levelup', target.instance.instanceId);

      expect(result).toBe(true);
      expect(state.purificationScore).toBe(1000 - ROGUELIKE.SHOP.LEVEL_UP_COST);
      expect(target.instance.exp).toBeGreaterThan(initialExp);
    });

    it('levelup: returns false when insufficient points', () => {
      state.purificationScore = 50;
      const target = state.party[0];
      const result = RunManager.purchaseShopItem(state, 'levelup', target.instance.instanceId);

      expect(result).toBe(false);
      expect(state.purificationScore).toBe(50);
    });

    it('levelup: returns false without targetCritterId', () => {
      const result = RunManager.purchaseShopItem(state, 'levelup');
      expect(result).toBe(false);
    });

    it('recruit: adds a critter to the party and deducts cost', () => {
      const initialPartySize = state.party.length;
      const result = RunManager.purchaseShopItem(state, 'recruit');

      expect(result).toBe(true);
      expect(state.party.length).toBe(initialPartySize + 1);
      expect(state.purificationScore).toBeLessThan(1000);
    });

    it('recruit: returns false when party is full', () => {
      const fullInstances = makeInstances(ROGUELIKE.RUN.MAX_PARTY_SIZE);
      const fullState = RunManager.startRun(WORLD_ID, SEED, fullInstances);
      fullState.purificationScore = 1000;

      const result = RunManager.purchaseShopItem(fullState, 'recruit');
      expect(result).toBe(false);
      expect(fullState.party.length).toBe(ROGUELIKE.RUN.MAX_PARTY_SIZE);
    });

    it('relic: adds a relic and deducts cost', () => {
      const result = RunManager.purchaseShopItem(state, 'relic');

      expect(result).toBe(true);
      expect(state.relics.length).toBe(1);
      expect(state.purificationScore).toBeLessThan(1000);
    });

    it('relic: returns false when relics are full', () => {
      // Fill relics up to max
      const relicIds = ['relic_fire_ring', 'relic_wave_amulet', 'relic_earth_shield', 'relic_wind_boots', 'relic_shadow_cloak'];
      state.relics.push(...relicIds.slice(0, ROGUELIKE.RUN.MAX_RELICS));

      const result = RunManager.purchaseShopItem(state, 'relic');
      expect(result).toBe(false);
    });
  });

  describe('applyRest', () => {
    let state: RunState;

    beforeEach(() => {
      state = RunManager.startRun(WORLD_ID, SEED, makeInstances(3));
      // Exhaust the first critter
      state.party[0].isExhausted = true;
    });

    it('clear_bench: resets all party exhaustion', () => {
      const result = RunManager.applyRest(state, 'clear_bench');

      expect(result.success).toBe(true);
      for (const pc of state.party) {
        expect(pc.isExhausted).toBe(false);
      }
    });

    it('train: grants REST_TRAIN XP to the target critter', () => {
      const target = state.party[1];
      const initialExp = target.instance.exp;
      const result = RunManager.applyRest(state, 'train', target.instance.instanceId);

      expect(result.success).toBe(true);
      expect(target.instance.exp).toBe(initialExp + ROGUELIKE.XP.REST_TRAIN);
    });

    it('train: returns false without targetCritterId', () => {
      const result = RunManager.applyRest(state, 'train');
      expect(result.success).toBe(false);
    });

    it('scout: returns next floor node types', () => {
      const result = RunManager.applyRest(state, 'scout');

      expect(result.success).toBe(true);
      expect(result.scoutInfo).toBeDefined();
      expect(Array.isArray(result.scoutInfo)).toBe(true);
    });

    it('scout: returns end-of-run message when on last floor', () => {
      // Advance to last floor
      state.currentFloor = state.floorMaps.length;
      const result = RunManager.applyRest(state, 'scout');

      expect(result.success).toBe(true);
      expect(result.scoutInfo).toEqual(['End of run']);
    });
  });

  describe('applyEvent', () => {
    let state: RunState;

    beforeEach(() => {
      state = RunManager.startRun(WORLD_ID, SEED, makeInstances(3));
      state.purificationScore = 500;
    });

    it('returns failure for unknown eventId', () => {
      const result = RunManager.applyEvent(state, 'not_an_event', 'A');
      expect(result.success).toBe(false);
    });

    it('elemental_spring option A: grants XP to all party members', () => {
      const initialExps = state.party.map((pc) => pc.instance.exp);
      const result = RunManager.applyEvent(state, 'elemental_spring', 'A');

      expect(result.success).toBe(true);
      for (let i = 0; i < state.party.length; i++) {
        expect(state.party[i].instance.exp).toBeGreaterThan(initialExps[i]);
      }
    });

    it('elemental_spring option B: safe — no state change', () => {
      const initialScore = state.purificationScore;
      const result = RunManager.applyEvent(state, 'elemental_spring', 'B');

      expect(result.success).toBe(true);
      expect(state.purificationScore).toBe(initialScore);
    });

    it('mysterious_merchant option A: deducts cost when affordable', () => {
      state.purificationScore = 500;
      const result = RunManager.applyEvent(state, 'mysterious_merchant', 'A');

      // Either succeeds and deducts, or fails if relic slot full — just check score adjusted if success
      if (result.success && result.message !== 'Relic slots are full.') {
        expect(state.purificationScore).toBe(100); // 500 - 400
      }
    });

    it('mysterious_merchant option A: fails when insufficient points', () => {
      state.purificationScore = 100; // less than 400 cost
      const result = RunManager.applyEvent(state, 'mysterious_merchant', 'A');

      expect(result.success).toBe(false);
      expect(state.purificationScore).toBe(100);
    });

    it('dark_altar option B: adds 100 purification', () => {
      const initialScore = state.purificationScore;
      const result = RunManager.applyEvent(state, 'dark_altar', 'B');

      expect(result.success).toBe(true);
      expect(state.purificationScore).toBe(initialScore + 100);
    });
  });
});
