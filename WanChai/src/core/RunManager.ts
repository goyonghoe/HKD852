/**
 * Manages the roguelike run state machine.
 * Pure TypeScript — no Phaser dependency.
 */
import type { RunState, RunPhase, PartyCritter, MapNode, FloorMap } from '../types/run';
import type { CritterInstance } from '../types/critter';
import type { LevelData } from '../types/level';
import type { HeroInstance } from '../types/hero';
import { CritterManager } from './CritterManager';
import { MapGenerator } from './MapGenerator';
import { EnemyPlacer } from './EnemyPlacer';
import { SeededRandom } from './SeededRandom';
import { ROGUELIKE } from '../config/roguelike-balance';
import { CRITTER_LIST } from '../data/critters/definitions';
import { RELIC_LIST } from '../data/relics/definitions';
import type { BlightData } from '../types/blight';

export class RunManager {
  /**
   * Creates an initial RunState with party (up to MAX_PARTY_SIZE critters),
   * generates floorMaps, sets phase to 'map'.
   */
  static startRun(
    worldId: number,
    seed: number,
    critterInstances: CritterInstance[]
  ): RunState {
    const partyInstances = critterInstances.slice(0, ROGUELIKE.RUN.MAX_PARTY_SIZE);

    const party: PartyCritter[] = partyInstances.map((instance) => {
      const effectiveAP = CritterManager.getEffectiveAP(instance);
      const passives = CritterManager.getActivePassives(instance);
      return {
        instance,
        definitionId: instance.definitionId,
        currentAP: effectiveAP,
        maxAP: effectiveAP,
        isExhausted: false,
        passives,
      };
    });

    const floorMaps = MapGenerator.generateRunMap(worldId, seed);

    return {
      seed,
      worldId,
      phase: 'map',
      currentFloor: 1,
      currentNodeId: null,
      party,
      relics: [],
      purificationScore: ROGUELIKE.RUN.STARTING_PURIFICATION,
      maxRelics: ROGUELIKE.RUN.MAX_RELICS,
      floorMaps,
      stagesCleared: 0,
      turnsTotal: 0,
    };
  }

  /**
   * Validates the node is reachable and sets it as the current node.
   * A node is reachable if:
   *   - It is in the current floor's map
   *   - currentNodeId is null and the node is in layer 0, OR
   *   - The current node has a connection to the target node
   * Returns true if the selection was valid.
   */
  static selectNode(state: RunState, nodeId: string): boolean {
    const currentFloorMap = RunManager._getCurrentFloorMap(state);
    if (!currentFloorMap) return false;

    const targetNode = currentFloorMap.nodes.find((n) => n.id === nodeId);
    if (!targetNode) return false;

    if (state.currentNodeId === null) {
      // First selection: must be in layer 0
      if (targetNode.layer !== 0) return false;
    } else {
      // Must be reachable from the current node
      const currentNode = currentFloorMap.nodes.find((n) => n.id === state.currentNodeId);
      if (!currentNode) return false;
      if (!currentNode.connections.includes(nodeId)) return false;
    }

    state.currentNodeId = nodeId;
    targetNode.visited = true;
    return true;
  }

  /**
   * If current node is battle/elite/boss, returns procedural levelData, heroQueue, and blightMap.
   * Sets phase to 'battle'. Returns null if not in a valid state.
   */
  static beginBattle(
    state: RunState,
  ): { levelData: LevelData; heroQueue: HeroInstance[]; blightMap: Map<string, BlightData> } | null {
    if (state.phase !== 'map') return null;
    if (!state.currentNodeId) return null;

    const currentFloorMap = RunManager._getCurrentFloorMap(state);
    if (!currentFloorMap) return null;

    const node = currentFloorMap.nodes.find((n) => n.id === state.currentNodeId);
    if (!node) return null;

    const battleTypes: Array<MapNode['type']> = ['battle', 'elite', 'boss'];
    if (!battleTypes.includes(node.type)) return null;

    // Generate procedural combat board via EnemyPlacer (SPEC-021)
    const random = new SeededRandom(state.seed + state.stagesCleared);
    const levelData = EnemyPlacer.generateCombatBoard(
      state.worldId,
      state.currentFloor,
      node.type as 'battle' | 'elite' | 'boss',
      random,
    );

    // Convert non-exhausted party critters to HeroInstance[]
    const heroQueue: HeroInstance[] = state.party
      .filter((pc) => !pc.isExhausted)
      .map((pc) => CritterManager.toHeroInstance(pc.instance));

    state.phase = 'battle';

    return { levelData, heroQueue, blightMap: new Map() };
  }

  /**
   * Handles the end of a battle.
   * Won: increment stagesCleared, set phase to 'reward', award XP to deployed critters.
   * Lost: set phase to 'run_failed'.
   */
  static endBattle(state: RunState, won: boolean, score: number): void {
    if (state.phase !== 'battle') return;

    if (won) {
      state.stagesCleared++;
      state.purificationScore += score;
      state.phase = 'reward';

      // Award XP to all non-exhausted critters (deployed into battle)
      for (const partyCritter of state.party) {
        if (!partyCritter.isExhausted) {
          CritterManager.addExp(partyCritter.instance, ROGUELIKE.XP.BATTLE_DEPLOY);
        }
      }
    } else {
      state.phase = 'run_failed';
    }
  }

  /**
   * Advances to the next floor.
   * Increments currentFloor, sets phase to 'map', resets currentNodeId.
   * Returns false if no more floors remain.
   */
  static advanceToNextFloor(state: RunState): boolean {
    const totalFloors = state.floorMaps.length;
    if (state.currentFloor >= totalFloors) return false;

    state.currentFloor++;
    state.phase = 'map';
    state.currentNodeId = null;
    return true;
  }

  /**
   * Returns true if the run is over (complete or failed).
   */
  static isRunOver(state: RunState): boolean {
    return state.phase === 'run_complete' || state.phase === 'run_failed';
  }

  /**
   * Handles shop purchases.
   * itemType: 'levelup' (300 pts, requires targetCritterId),
   *           'recruit' (cost based on rarity, adds to party if not full),
   *           'relic'   (cost based on rarity, adds to relics if not full).
   * Returns true if the purchase was successful.
   */
  static purchaseShopItem(
    state: RunState,
    itemType: 'levelup' | 'recruit' | 'relic',
    targetCritterId?: string
  ): boolean {
    if (itemType === 'levelup') {
      const cost = ROGUELIKE.SHOP.LEVEL_UP_COST;
      if (state.purificationScore < cost) return false;
      if (!targetCritterId) return false;
      const target = state.party.find((pc) => pc.definitionId === targetCritterId || pc.instance.instanceId === targetCritterId);
      if (!target) return false;
      state.purificationScore -= cost;
      CritterManager.addExp(target.instance, ROGUELIKE.XP.REST_TRAIN * 2);
      return true;
    }

    if (itemType === 'recruit') {
      if (state.party.length >= ROGUELIKE.RUN.MAX_PARTY_SIZE) return false;
      const random = new SeededRandom(state.seed + state.stagesCleared + state.purificationScore);
      const rarityRoll = random.next();
      let rarity: 'common' | 'rare' | 'epic';
      const totalWeight = ROGUELIKE.RECRUIT.WEIGHT.common + ROGUELIKE.RECRUIT.WEIGHT.rare + ROGUELIKE.RECRUIT.WEIGHT.epic;
      const commonThreshold = ROGUELIKE.RECRUIT.WEIGHT.common / totalWeight;
      const rareThreshold = commonThreshold + ROGUELIKE.RECRUIT.WEIGHT.rare / totalWeight;
      if (rarityRoll < commonThreshold) {
        rarity = 'common';
      } else if (rarityRoll < rareThreshold) {
        rarity = 'rare';
      } else {
        rarity = 'epic';
      }
      const cost = ROGUELIKE.SHOP.CRITTER_COST[rarity];
      if (state.purificationScore < cost) return false;

      const pool = CRITTER_LIST.filter((c) => c.rarity === rarity);
      const def = pool.length > 0 ? pool[random.nextInt(0, pool.length)] : CRITTER_LIST[random.nextInt(0, CRITTER_LIST.length)];

      const instance = CritterManager.createInstance(def.id);
      const effectiveAP = CritterManager.getEffectiveAP(instance);
      const passives = CritterManager.getActivePassives(instance);
      const newPartyCritter: PartyCritter = {
        instance,
        definitionId: def.id,
        currentAP: effectiveAP,
        maxAP: effectiveAP,
        isExhausted: false,
        passives,
      };
      state.party.push(newPartyCritter);
      state.purificationScore -= cost;
      return true;
    }

    if (itemType === 'relic') {
      if (state.relics.length >= state.maxRelics) return false;
      const random = new SeededRandom(state.seed + state.stagesCleared + 7777);
      const rarityRoll = random.next();
      let rarity: 'common' | 'rare' | 'epic';
      const totalWeight = ROGUELIKE.RECRUIT.WEIGHT.common + ROGUELIKE.RECRUIT.WEIGHT.rare + ROGUELIKE.RECRUIT.WEIGHT.epic;
      const commonThreshold = ROGUELIKE.RECRUIT.WEIGHT.common / totalWeight;
      const rareThreshold = commonThreshold + ROGUELIKE.RECRUIT.WEIGHT.rare / totalWeight;
      if (rarityRoll < commonThreshold) {
        rarity = 'common';
      } else if (rarityRoll < rareThreshold) {
        rarity = 'rare';
      } else {
        rarity = 'epic';
      }
      const cost = ROGUELIKE.SHOP.RELIC_COST[rarity];
      if (state.purificationScore < cost) return false;

      const pool = RELIC_LIST.filter((r) => r.rarity === rarity && !state.relics.includes(r.id));
      if (pool.length === 0) return false;
      const relic = pool[random.nextInt(0, pool.length)];
      state.relics.push(relic.id);
      state.purificationScore -= cost;
      return true;
    }

    return false;
  }

  /**
   * Applies a rest site choice.
   * 'clear_bench': reset all party isExhausted = false
   * 'train': give REST_TRAIN XP to target critter (by instanceId or definitionId)
   * 'scout': return next floor's first node types
   */
  static applyRest(
    state: RunState,
    choice: 'clear_bench' | 'train' | 'scout',
    targetCritterId?: string
  ): { success: boolean; scoutInfo?: string[] } {
    if (choice === 'clear_bench') {
      for (const pc of state.party) {
        pc.isExhausted = false;
      }
      return { success: true };
    }

    if (choice === 'train') {
      if (!targetCritterId) return { success: false };
      const target = state.party.find(
        (pc) => pc.instance.instanceId === targetCritterId || pc.definitionId === targetCritterId
      );
      if (!target) return { success: false };
      CritterManager.addExp(target.instance, ROGUELIKE.XP.REST_TRAIN);
      return { success: true };
    }

    if (choice === 'scout') {
      const nextFloor = state.currentFloor + 1;
      const nextFloorMap = state.floorMaps.find((fm) => fm.floorNumber === nextFloor);
      if (!nextFloorMap) return { success: true, scoutInfo: ['End of run'] };
      const layer0Nodes = nextFloorMap.nodes.filter((n) => n.layer === 0);
      const scoutInfo = layer0Nodes.slice(0, 2).map((n) => n.type);
      return { success: true, scoutInfo };
    }

    return { success: false };
  }

  /**
   * Applies an event choice.
   * Looks up the event definition, applies the effect of the chosen option.
   * Risk rolls use SeededRandom(state.seed + floor-based hash).
   */
  static applyEvent(
    state: RunState,
    eventId: string,
    choice: 'A' | 'B'
  ): { success: boolean; message: string } {
    const eventDef = ROGUELIKE.EVENTS.find((e) => e.id === eventId);
    if (!eventDef) return { success: false, message: 'Unknown event.' };

    const option = choice === 'A' ? eventDef.optionA : eventDef.optionB;
    const effect: string = option.effect;
    const random = new SeededRandom(state.seed + state.currentFloor * 31 + (choice === 'A' ? 1 : 2));

    // Handle cost deduction
    if ('cost' in option && typeof option.cost === 'number') {
      if (state.purificationScore < option.cost) {
        return { success: false, message: 'Not enough purification points.' };
      }
      state.purificationScore -= option.cost;
    }

    // Apply effect
    if (effect === 'safe') {
      return { success: true, message: 'Nothing happened. You continue safely.' };
    }

    if (effect === 'purify_300') {
      const hasRisk = 'risk' in option && option.risk === 'lose_100';
      const rollSuccess = random.next() < ROGUELIKE.EVENT_RISK_SUCCESS_RATE;
      if (hasRisk && !rollSuccess) {
        state.purificationScore = Math.max(0, state.purificationScore - 100);
        return { success: true, message: 'The chest was trapped! Lost 100 purification.' };
      }
      state.purificationScore += 300;
      return { success: true, message: 'Found treasure! +300 purification.' };
    }

    if (effect === 'purify_50') {
      state.purificationScore += 50;
      return { success: true, message: 'A small blessing. +50 purification.' };
    }

    if (effect === 'purify_100') {
      state.purificationScore += 100;
      return { success: true, message: 'Wisely avoided. +100 purification.' };
    }

    if (effect === 'recruit_random') {
      if (state.party.length >= ROGUELIKE.RUN.MAX_PARTY_SIZE) {
        return { success: false, message: 'Party is full. Cannot recruit.' };
      }
      const pool = CRITTER_LIST.filter((c) => c.rarity === 'common');
      const def = pool.length > 0 ? random.pick(pool) : random.pick(CRITTER_LIST as readonly (typeof CRITTER_LIST[number])[]);
      const instance = CritterManager.createInstance(def.id);
      const effectiveAP = CritterManager.getEffectiveAP(instance);
      const passives = CritterManager.getActivePassives(instance);
      const newPartyCritter: PartyCritter = {
        instance,
        definitionId: def.id,
        currentAP: effectiveAP,
        maxAP: effectiveAP,
        isExhausted: false,
        passives,
      };
      state.party.push(newPartyCritter);
      return { success: true, message: `${def.nameEn} joined your party!` };
    }

    if (effect === 'relic_random') {
      const hasRisk = 'risk' in option && option.risk === 'exhaust_1';
      const rollSuccess = random.next() < ROGUELIKE.EVENT_RISK_SUCCESS_RATE;

      if (hasRisk && !rollSuccess) {
        const activeParty = state.party.filter((pc) => !pc.isExhausted);
        if (activeParty.length > 0) {
          const target = random.pick(activeParty as readonly PartyCritter[]);
          target.isExhausted = true;
          return { success: true, message: 'The altar cursed your party! A critter is exhausted.' };
        }
        return { success: true, message: 'The altar failed. Nothing happened.' };
      }

      if (state.relics.length >= state.maxRelics) {
        return { success: false, message: 'Relic slots are full.' };
      }
      const availableRelics = RELIC_LIST.filter((r) => !state.relics.includes(r.id));
      if (availableRelics.length === 0) {
        return { success: false, message: 'No relics available.' };
      }
      const relic = random.pick(availableRelics as readonly (typeof RELIC_LIST[number])[]);
      state.relics.push(relic.id);
      return { success: true, message: `Obtained ${relic.nameEn}!` };
    }

    if (effect === 'party_xp_50') {
      for (const pc of state.party) {
        CritterManager.addExp(pc.instance, 50);
      }
      return { success: true, message: 'The spring revitalized your party! All critters +50 XP.' };
    }

    return { success: false, message: 'Unknown effect.' };
  }

  // ---- Private helpers ----

  private static _getCurrentFloorMap(state: RunState): FloorMap | undefined {
    return state.floorMaps.find((fm) => fm.floorNumber === state.currentFloor);
  }
}
