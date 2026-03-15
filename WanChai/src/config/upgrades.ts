import type { PassiveDef } from '../types/upgrade';

export const PASSIVE_DEFS: Record<string, PassiveDef> = {
  attack_speed: {
    id: 'attack_speed',
    name: '속사 장치',
    description: '공격 속도 +10%',
    maxLevel: 5,
    effect: 'attack_speed',
    valuePerLevel: 0.1,
  },
  damage: {
    id: 'damage',
    name: '파워 코어',
    description: '공격력 +15%',
    maxLevel: 5,
    effect: 'damage',
    valuePerLevel: 0.15,
  },
  base_armor: {
    id: 'base_armor',
    name: '장갑 강화',
    description: '기지 피해량 -10%',
    maxLevel: 5,
    effect: 'base_armor',
    valuePerLevel: 0.1,
  },
  hp_regen: {
    id: 'hp_regen',
    name: '실드 수리',
    description: '기지 HP 초당 +5 회복',
    maxLevel: 3,
    effect: 'hp_regen',
    valuePerLevel: 5,
  },
  crit_chance: {
    id: 'crit_chance',
    name: '집중 렌즈',
    description: '치명타 확률 +5%',
    maxLevel: 5,
    effect: 'crit_chance',
    valuePerLevel: 0.05,
  },
  crit_damage: {
    id: 'crit_damage',
    name: '증폭기',
    description: '치명타 피해 +25%',
    maxLevel: 3,
    effect: 'crit_damage',
    valuePerLevel: 0.25,
  },

  // === HAI (WIND) ===
  dash_trail: {
    id: 'dash_trail',
    name: '잔상',
    description: '이동 시 데미지 트레일 생성',
    maxLevel: 3,
    effect: 'dash_trail',
    valuePerLevel: 10,
    characterId: 'hai',
  },
  gust: {
    id: 'gust',
    name: '돌풍',
    description: '넉백 거리 +50%',
    maxLevel: 3,
    effect: 'gust',
    valuePerLevel: 0.5,
    characterId: 'hai',
  },

  // === NOVA (WATER) ===
  frost_shot: {
    id: 'frost_shot',
    name: '결빙탄',
    description: '적중 시 20% 확률로 2초 감속',
    maxLevel: 3,
    effect: 'frost_shot',
    valuePerLevel: 0.2,
    characterId: 'nova',
  },
  torrent: {
    id: 'torrent',
    name: '급류',
    description: '연속 공격 3회 시 공격속도 +30%',
    maxLevel: 3,
    effect: 'torrent',
    valuePerLevel: 0.3,
    characterId: 'nova',
  },

  // === SOL (FIRE) ===
  burn: {
    id: 'burn',
    name: '연소',
    description: '적중 시 3초 DOT 데미지 부여',
    maxLevel: 3,
    effect: 'burn',
    valuePerLevel: 5,
    characterId: 'sol',
  },
  ignite: {
    id: 'ignite',
    name: '점화',
    description: '폭발 범위 +25%',
    maxLevel: 3,
    effect: 'ignite',
    valuePerLevel: 0.25,
    characterId: 'sol',
  },

  // === MEI (LIGHT) ===
  refraction: {
    id: 'refraction',
    name: '난반사',
    description: '관통 시 30% 확률로 분기 발사',
    maxLevel: 3,
    effect: 'refraction',
    valuePerLevel: 0.3,
    characterId: 'mei',
  },
  lightspeed: {
    id: 'lightspeed',
    name: '광속',
    description: '투사체 속도 +20%',
    maxLevel: 3,
    effect: 'lightspeed',
    valuePerLevel: 0.2,
    characterId: 'mei',
  },

  // === KAI (EARTH) ===
  thorns: {
    id: 'thorns',
    name: '가시갑옷',
    description: '기지 피격 시 반사 데미지',
    maxLevel: 3,
    effect: 'thorns',
    valuePerLevel: 15,
    characterId: 'kai',
  },
  fortify: {
    id: 'fortify',
    name: '견고',
    description: 'CC 지속시간 -40%',
    maxLevel: 3,
    effect: 'fortify',
    valuePerLevel: 0.4,
    characterId: 'kai',
  },
};
