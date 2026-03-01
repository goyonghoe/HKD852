/**
 * XP requirements per level.
 * Formula: base * growthFactor^(level-1)
 */
export class XpTable {
  private cache: number[] = [];

  constructor(
    private base: number,
    private growthFactor: number,
  ) {}

  /** XP required to reach this level (from level-1) */
  required(level: number): number {
    if (level <= 1) return this.base;
    while (this.cache.length < level) {
      const lv = this.cache.length + 1;
      this.cache.push(Math.ceil(this.base * Math.pow(this.growthFactor, lv - 1)));
    }
    return this.cache[level - 1];
  }

  /** Total XP from level 1 to reach this level */
  totalToLevel(level: number): number {
    let total = 0;
    for (let i = 1; i <= level; i++) {
      total += this.required(i);
    }
    return total;
  }
}
