export type CritterSkillType =
  | 'healPulse' // dolphin: instant base HP restore
  | 'knockbackAura' // kite: push nearby enemies away
  | 'regenStream' // koi: heal over time (3 ticks)
  | 'flameBurst' // lion: AOE damage to nearby enemies
  | 'chainLightning' // macaque: damage 3 nearest enemies
  | 'shieldBubble'; // pangolin: block next N incoming base damage

export interface CritterDef {
  id: string;
  name: string;
  nameKo: string;
  element: 'WIND' | 'WATER' | 'FIRE' | 'LIGHT' | 'EARTH' | 'DARK';
  skill: CritterSkillType;
  skillName: string;
  skillNameEn: string;
  skillDesc: string;
  skillDescEn: string;
  cooldownMs: number;
  durationMs: number;
  spriteKey: string;
}

export const CRITTERS: Record<string, CritterDef> = {
  dolphin: {
    id: 'dolphin',
    name: 'Dolphin',
    nameKo: '돌고래',
    element: 'WATER',
    skill: 'healPulse',
    skillName: '치유 파동',
    skillNameEn: 'Heal Pulse',
    skillDesc: '기지 HP를 즉시 회복합니다',
    skillDescEn: 'Instantly restore base HP',
    cooldownMs: 15000,
    durationMs: 0,
    spriteKey: 'critter_dolphin',
  },
  kite: {
    id: 'kite',
    name: 'Kite',
    nameKo: '연',
    element: 'WIND',
    skill: 'knockbackAura',
    skillName: '밀어내기 오라',
    skillNameEn: 'Knockback Aura',
    skillDesc: '주변 적을 밀어냅니다',
    skillDescEn: 'Push nearby enemies away',
    cooldownMs: 12000,
    durationMs: 0,
    spriteKey: 'critter_kite',
  },
  koi: {
    id: 'koi',
    name: 'Koi',
    nameKo: '코이',
    element: 'WATER',
    skill: 'regenStream',
    skillName: '재생 물줄기',
    skillNameEn: 'Regen Stream',
    skillDesc: '기지 HP를 3회에 걸쳐 회복합니다',
    skillDescEn: 'Heal base HP over 3 ticks',
    cooldownMs: 12000,
    durationMs: 3000,
    spriteKey: 'critter_koi',
  },
  lion: {
    id: 'lion',
    name: 'Lion',
    nameKo: '사자',
    element: 'FIRE',
    skill: 'flameBurst',
    skillName: '화염 폭발',
    skillNameEn: 'Flame Burst',
    skillDesc: '주변 적에게 광역 화염 피해를 줍니다',
    skillDescEn: 'Deal AOE fire damage to nearby enemies',
    cooldownMs: 10000,
    durationMs: 0,
    spriteKey: 'critter_lion',
  },
  macaque: {
    id: 'macaque',
    name: 'Macaque',
    nameKo: '원숭이',
    element: 'LIGHT',
    skill: 'chainLightning',
    skillName: '연쇄 번개',
    skillNameEn: 'Chain Lightning',
    skillDesc: '가장 가까운 적 3마리에게 연쇄 번개를 내립니다',
    skillDescEn: 'Chain lightning between 3 nearest enemies',
    cooldownMs: 10000,
    durationMs: 0,
    spriteKey: 'critter_macaque',
  },
  pangolin: {
    id: 'pangolin',
    name: 'Pangolin',
    nameKo: '천산갑',
    element: 'EARTH',
    skill: 'shieldBubble',
    skillName: '방어막',
    skillNameEn: 'Shield Bubble',
    skillDesc: '다음 피해 1회를 방어합니다',
    skillDescEn: 'Block next 1 incoming base damage',
    cooldownMs: 18000,
    durationMs: 8000,
    spriteKey: 'critter_pangolin',
  },
};

/** Find critter matching a character's element */
export function getCritterForElement(element: string): CritterDef | undefined {
  return Object.values(CRITTERS).find((c) => c.element === element);
}
