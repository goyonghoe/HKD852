export interface DistrictDef {
  id: string;
  name: string;
  nameEn: string;
  nameCn: string;
  element: 'WIND' | 'WATER' | 'FIRE' | 'LIGHT' | 'EARTH' | 'DARK';
  weatherEffect: string;
  weatherDescription: string;
  bgKey: string;
}

export const DISTRICTS: DistrictDef[] = [
  {
    id: 'central',
    name: 'Central',
    nameEn: 'Central',
    nameCn: '中環',
    element: 'WIND',
    weatherEffect: 'speed_all',
    weatherDescription: '강풍: 모든 유닛 이동속도 +10%',
    bgKey: 'bg_central',
  },
  {
    id: 'tst',
    name: 'Tsim Sha Tsui',
    nameEn: 'Tsim Sha Tsui',
    nameCn: '尖沙咀',
    element: 'WATER',
    weatherEffect: 'rain',
    weatherDescription: '폭우: 적 이동속도 -15%',
    bgKey: 'bg_wanchai',
  },
  {
    id: 'mongkok',
    name: 'Mong Kok',
    nameEn: 'Mong Kok',
    nameCn: '旺角',
    element: 'FIRE',
    weatherEffect: 'flame_zones',
    weatherDescription: '열파: 랜덤 화염 지대 출현',
    bgKey: 'bg_mongkok',
  },
  {
    id: 'ssp',
    name: 'Sham Shui Po',
    nameEn: 'Sham Shui Po',
    nameCn: '深水埗',
    element: 'EARTH',
    weatherEffect: 'armor_all',
    weatherDescription: '지진파: 적 방어력 +15%',
    bgKey: 'bg_shamshuipo',
  },
  {
    id: 'wts',
    name: 'Wong Tai Sin',
    nameEn: 'Wong Tai Sin',
    nameCn: '黃大仙',
    element: 'LIGHT',
    weatherEffect: 'lightning_field',
    weatherDescription: '뇌우: 3초마다 번개가 적을 타격',
    bgKey: 'bg_wongtaisin',
  },
  {
    id: 'lantau',
    name: 'Lantau',
    nameEn: 'Lantau',
    nameCn: '大嶼山',
    element: 'DARK',
    weatherEffect: 'fog',
    weatherDescription: '암흑 안개: 시야 축소',
    bgKey: 'bg_lantau',
  },
  {
    id: 'aberdeen',
    name: 'Aberdeen',
    nameEn: 'Aberdeen',
    nameCn: '香港仔',
    element: 'WATER',
    weatherEffect: 'shield_regen',
    weatherDescription: '에너지 필드: 기지 HP 초당 +2 회복',
    bgKey: 'bg_aberdeen',
  },
  {
    id: 'kowloon',
    name: 'Kowloon City',
    nameEn: 'Kowloon City',
    nameCn: '九龍城',
    element: 'DARK',
    weatherEffect: 'void_gravity',
    weatherDescription: '중력장: 화면 중앙이 적을 끌어당김',
    bgKey: 'bg_kowloon',
  },
];

/** Get district for a given stage (1-based). Stages 1,3,5 = wave stages → districts 0,1,2... */
export function getDistrictForStage(stage: number): DistrictDef | undefined {
  // Stages: 1=wave, 2=boss, 3=wave, 4=boss, 5=wave, 6=boss
  // Wave stages get districts, boss stages inherit parent district
  const waveIndex = Math.ceil(stage / 2) - 1; // 0,0,1,1,2,2
  return DISTRICTS[waveIndex];
}
