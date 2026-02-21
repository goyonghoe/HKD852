import { Element, ElementDistribution, FourPillars } from "./types";

// 동점 시 우선순위: 수→목→화→토→금 (오행 상생 순서)
const ELEMENT_PRIORITY: Element[] = ["water", "wood", "fire", "earth", "metal"];

export function calculateElementDistribution(pillars: FourPillars): ElementDistribution {
  const dist: ElementDistribution = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };

  const activePillars = [pillars.year, pillars.month, pillars.day];
  if (pillars.hour) activePillars.push(pillars.hour);

  for (const pillar of activePillars) {
    dist[pillar.heavenlyStem.element] += 1;
    dist[pillar.earthlyBranch.element] += 1;
  }

  return dist;
}

export function getDominantElement(dist: ElementDistribution, dayMasterElement?: Element): Element {
  const entries = Object.entries(dist) as [Element, number][];
  entries.sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    // 동점: 일간 오행 우선
    if (dayMasterElement) {
      if (a[0] === dayMasterElement) return -1;
      if (b[0] === dayMasterElement) return 1;
    }
    return ELEMENT_PRIORITY.indexOf(a[0]) - ELEMENT_PRIORITY.indexOf(b[0]);
  });
  return entries[0][0];
}

export function getWeakestElement(dist: ElementDistribution, dayMasterElement?: Element): Element {
  const entries = Object.entries(dist) as [Element, number][];
  entries.sort((a, b) => {
    if (a[1] !== b[1]) return a[1] - b[1];
    // 동점: 일간 오행은 약한 쪽에서 제외 (뒤로)
    if (dayMasterElement) {
      if (a[0] === dayMasterElement) return 1;
      if (b[0] === dayMasterElement) return -1;
    }
    return ELEMENT_PRIORITY.indexOf(a[0]) - ELEMENT_PRIORITY.indexOf(b[0]);
  });
  return entries[0][0];
}

