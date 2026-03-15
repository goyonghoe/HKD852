export interface UltimateDef {
  id: string;
  name: string;
  nameKo: string;
  description: string;
  element: string;
  type: 'aoe' | 'buff' | 'projectile' | 'debuff';
}

export const ULTIMATE_DEFS: Record<string, UltimateDef> = {
  hai: {
    id: 'hai',
    name: 'Cyclone',
    nameKo: '회오리',
    description: '주변 적 넉백+데미지',
    element: 'WIND',
    type: 'aoe',
  },
  nova: {
    id: 'nova',
    name: 'Frost Wave',
    nameKo: '빙결파',
    description: '화면 내 적 동결',
    element: 'WATER',
    type: 'debuff',
  },
  sol: {
    id: 'sol',
    name: 'Firestorm',
    nameKo: '화염폭풍',
    description: '화면 전체 지속 데미지',
    element: 'FIRE',
    type: 'aoe',
  },
  mei: {
    id: 'mei',
    name: 'Light Pillar',
    nameKo: '빛기둥',
    description: '전방 관통 초고데미지',
    element: 'LIGHT',
    type: 'projectile',
  },
  kai: {
    id: 'kai',
    name: 'Earthquake',
    nameKo: '지진',
    description: '적 스턴+방어력 버프',
    element: 'EARTH',
    type: 'buff',
  },
};
