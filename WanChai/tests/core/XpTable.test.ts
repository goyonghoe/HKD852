import { describe, it, expect } from 'vitest';
import { XpTable } from '../../src/core/XpTable';

describe('XpTable', () => {
  it('required(1) returns the base value', () => {
    const table = new XpTable(100, 1.5);
    expect(table.required(1)).toBe(100);
  });

  it('required grows by growthFactor each level', () => {
    const table = new XpTable(100, 1.5);
    // level 2: ceil(100 * 1.5^1) = ceil(150) = 150
    expect(table.required(2)).toBe(150);
    // level 3: ceil(100 * 1.5^2) = ceil(225) = 225
    expect(table.required(3)).toBe(225);
  });

  it('totalToLevel sums required XP for all levels', () => {
    const table = new XpTable(100, 1.5);
    // lv1=100, lv2=150 → total to reach lv2 = 250
    expect(table.totalToLevel(2)).toBe(250);
    // lv3=225 → total = 475
    expect(table.totalToLevel(3)).toBe(475);
  });

  it('cache is stable: repeated calls return the same value', () => {
    const table = new XpTable(50, 2.0);
    const first = table.required(5);
    const second = table.required(5);
    expect(first).toBe(second);
  });
});
