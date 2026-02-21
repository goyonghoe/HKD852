import { Element, ElementDistribution, FourPillars } from "./types";

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

export function getDominantElement(dist: ElementDistribution): Element {
  const entries = Object.entries(dist) as [Element, number][];
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

export function getWeakestElement(dist: ElementDistribution): Element {
  const entries = Object.entries(dist) as [Element, number][];
  entries.sort((a, b) => a[1] - b[1]);
  return entries[0][0];
}

export function getElementPercentages(dist: ElementDistribution): Record<Element, number> {
  const total = Object.values(dist).reduce((a, b) => a + b, 0);
  if (total === 0) return { wood: 20, fire: 20, earth: 20, metal: 20, water: 20 };

  return {
    wood: Math.round((dist.wood / total) * 100),
    fire: Math.round((dist.fire / total) * 100),
    earth: Math.round((dist.earth / total) * 100),
    metal: Math.round((dist.metal / total) * 100),
    water: Math.round((dist.water / total) * 100),
  };
}
