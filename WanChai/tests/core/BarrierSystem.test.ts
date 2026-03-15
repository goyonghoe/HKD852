import { describe, it, expect } from 'vitest';
import { BarrierSystem } from '../../src/core/BarrierSystem';

describe('BarrierSystem', () => {
  it('initializes with correct HP', () => {
    const b = new BarrierSystem(500);
    expect(b.maxHp).toBe(500);
    expect(b.currentHp).toBe(500);
    expect(b.isDestroyed()).toBe(false);
    expect(b.getHpPercent()).toBe(1);
  });

  it('takeDamage reduces HP', () => {
    const b = new BarrierSystem(100);
    const destroyed = b.takeDamage(30);
    expect(destroyed).toBe(false);
    expect(b.currentHp).toBe(70);
    expect(b.getHpPercent()).toBeCloseTo(0.7);
  });

  it('takeDamage returns true when destroyed', () => {
    const b = new BarrierSystem(50);
    const destroyed = b.takeDamage(50);
    expect(destroyed).toBe(true);
    expect(b.currentHp).toBe(0);
    expect(b.isDestroyed()).toBe(true);
  });

  it('HP cannot go below 0', () => {
    const b = new BarrierSystem(30);
    b.takeDamage(100);
    expect(b.currentHp).toBe(0);
    expect(b.getHpPercent()).toBe(0);
  });

  it('isDestroyed returns false when HP > 0', () => {
    const b = new BarrierSystem(100);
    b.takeDamage(99);
    expect(b.isDestroyed()).toBe(false);
  });

  it('getHpPercent is correct at half HP', () => {
    const b = new BarrierSystem(200);
    b.takeDamage(100);
    expect(b.getHpPercent()).toBeCloseTo(0.5);
  });

  it('reset restores HP to new max', () => {
    const b = new BarrierSystem(100);
    b.takeDamage(80);
    expect(b.currentHp).toBe(20);
    b.reset(200);
    expect(b.maxHp).toBe(200);
    expect(b.currentHp).toBe(200);
    expect(b.isDestroyed()).toBe(false);
  });

  it('handles zero maxHp gracefully', () => {
    const b = new BarrierSystem(0);
    expect(b.getHpPercent()).toBe(0);
    expect(b.isDestroyed()).toBe(true);
  });
});
