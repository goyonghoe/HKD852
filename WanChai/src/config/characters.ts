export interface CharacterUnlockCondition {
  type: 'runsCompleted' | 'totalGold' | 'bestKills';
  value: number;
  description: string; // Korean display text
}

export interface CharacterDef {
  id: string;
  name: string;
  nameKo: string;
  element: 'WIND' | 'WATER' | 'FIRE' | 'LIGHT' | 'EARTH';
  startWeapon: string;
  passive: {
    type: 'attackSpeed' | 'critChance' | 'damage' | 'cooldown' | 'hp';
    value: number;
    description: string;
  };
  portraitKey: string;
  ingameKey: string;
  /** CraftPix spritesheet key for idle animation (looping) */
  idleAnimKey: string;
  /** CraftPix spritesheet key for attack animation (play once, then return to idle) */
  attackAnimKey: string;
  /** Sprite key for the arm+gun layer (separate rotation from body) */
  handSpriteKey: string;
  unlockCondition?: CharacterUnlockCondition;
}

export const CHARACTERS: Record<string, CharacterDef> = {
  hai: {
    id: 'hai',
    name: 'HAI',
    nameKo: '하이',
    element: 'WIND',
    startWeapon: 'energy_shot',
    passive: { type: 'attackSpeed', value: 0.15, description: '공격속도 +15%' },
    portraitKey: 'char_hai',
    ingameKey: 'char_hai_ingame',
    idleAnimKey: 'biker_idle',
    attackAnimKey: 'biker_attack',
    handSpriteKey: 'hand_biker',
  },
  nova: {
    id: 'nova',
    name: 'NOVA',
    nameKo: '노바',
    element: 'WATER',
    startWeapon: 'shotgun',
    passive: { type: 'critChance', value: 0.1, description: '크리티컬 +10%' },
    portraitKey: 'char_nova',
    ingameKey: 'char_nova_ingame',
    idleAnimKey: 'punk_idle',
    attackAnimKey: 'punk_attack',
    handSpriteKey: 'hand_punk',
  },
  sol: {
    id: 'sol',
    name: 'SOL',
    nameKo: '솔',
    element: 'FIRE',
    startWeapon: 'napalm',
    passive: { type: 'damage', value: 0.1, description: '공격력 +10%' },
    portraitKey: 'char_sol',
    ingameKey: 'char_sol_ingame',
    idleAnimKey: 'cyborg_idle',
    attackAnimKey: 'cyborg_attack',
    handSpriteKey: 'hand_cyborg',
    unlockCondition: { type: 'runsCompleted', value: 3, description: '런 3회 완료 시 해제' },
  },
  mei: {
    id: 'mei',
    name: 'MEI',
    nameKo: '메이',
    element: 'LIGHT',
    startWeapon: 'laser_beam',
    passive: { type: 'cooldown', value: 0.1, description: '쿨다운 -10%' },
    portraitKey: 'char_mei',
    ingameKey: 'char_mei_ingame',
    idleAnimKey: 'mei_idle',
    attackAnimKey: 'mei_attack',
    handSpriteKey: 'hand_mei',
    unlockCondition: { type: 'totalGold', value: 500, description: '누적 골드 500 달성 시 해제' },
  },
  kai: {
    id: 'kai',
    name: 'KAI',
    nameKo: '카이',
    element: 'EARTH',
    startWeapon: 'missile',
    passive: { type: 'hp', value: 0.2, description: '체력 +20%' },
    portraitKey: 'char_kai',
    ingameKey: 'char_kai_ingame',
    idleAnimKey: 'kai_idle',
    attackAnimKey: 'kai_attack',
    handSpriteKey: 'hand_kai',
    unlockCondition: { type: 'bestKills', value: 200, description: '누적 처치 200 달성 시 해제' },
  },
};

export const CHARACTER_LIST = Object.values(CHARACTERS);
