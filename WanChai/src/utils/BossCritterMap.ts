/**
 * TASK-126: Boss → Critter mapping for liberation VFX.
 * Each boss is linked to an animal spirit trapped inside.
 * The critter's element color is used for the rising silhouette particles.
 *
 * No Phaser imports — pure data mapping.
 */

import { ELEMENT } from '../config/colors';

export interface BossCritterInfo {
  /** Display name of the freed animal */
  animalName: string;
  /** Element color for rising particles */
  color: number;
  /** Element key for lookup */
  element: 'WIND' | 'WATER' | 'FIRE' | 'EARTH' | 'LIGHT' | 'DARK';
}

/**
 * Map stage number (1-based) to the critter info for the boss of that stage.
 * Boss stages are even numbers: 2, 4, 6, 8, 10, 12, 14, 16.
 *
 * Based on boss-profiles.md:
 *   Stage 2: Aero (Wind) — Eagle / 독수리
 *   Stage 4: Hydra (Water) — Sea Dragon → Dolphin / 해룡
 *   Stage 6: Blaze (Fire) — Phoenix / 불사조
 *   Stage 8: Terra (Earth) — Pangolin / 천산갑
 *   Stage 10: Lumen (Light) — Lion / 사자
 *   Stage 12: Umbra (Dark) — Bat / 박쥐
 *   Stage 14: Aberdeen Water — Sea Turtle
 *   Stage 16: Kowloon Dark — Shadow Wolf
 */
const BOSS_CRITTER_BY_STAGE: Record<number, BossCritterInfo> = {
  2: { animalName: 'Eagle', color: ELEMENT.WIND, element: 'WIND' },
  4: { animalName: 'Sea Dragon', color: ELEMENT.WATER, element: 'WATER' },
  6: { animalName: 'Phoenix', color: ELEMENT.FIRE, element: 'FIRE' },
  8: { animalName: 'Pangolin', color: ELEMENT.EARTH, element: 'EARTH' },
  10: { animalName: 'Lion', color: ELEMENT.LIGHT, element: 'LIGHT' },
  12: { animalName: 'Bat', color: ELEMENT.DARK, element: 'DARK' },
  14: { animalName: 'Sea Turtle', color: ELEMENT.WATER, element: 'WATER' },
  16: { animalName: 'Shadow Wolf', color: ELEMENT.DARK, element: 'DARK' },
};

/** Default fallback if stage isn't mapped */
const DEFAULT_CRITTER: BossCritterInfo = {
  animalName: 'Spirit',
  color: ELEMENT.LIGHT,
  element: 'LIGHT',
};

/**
 * Get the critter info for a boss at a given stage.
 * Returns a default if the stage doesn't have a specific mapping.
 */
export function getBossCritterInfo(stage: number): BossCritterInfo {
  return BOSS_CRITTER_BY_STAGE[stage] ?? DEFAULT_CRITTER;
}
