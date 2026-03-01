import { describe, it, expect, beforeEach } from 'vitest';
import { WaveDirector, WaveConfig } from '../../src/core/WaveDirector';

const DEFAULT_CONFIG: WaveConfig = {
  initialDelayMs: 3000,
  baseIntervalMs: 4000,
  minIntervalMs: 1000,
  intervalDecayPerMin: 0.85,
  eliteChanceBase: 0.05,
  eliteChancePerMin: 0.02,
  bossTimeMinutes: 10,
};

describe('WaveDirector', () => {
  let director: WaveDirector;

  beforeEach(() => {
    director = new WaveDirector(DEFAULT_CONFIG);
  });

  it('produces no spawns during initial delay', () => {
    const commands = director.update(2999);
    expect(commands).toHaveLength(0);
  });

  it('produces a spawn after initial delay + one interval', () => {
    // Advance past initial delay and one full interval
    director.update(3000); // passes initial delay
    const commands = director.update(4000); // passes one interval
    expect(commands.length).toBeGreaterThan(0);
    expect(commands[0]).toHaveProperty('enemyId');
    expect(commands[0]).toHaveProperty('count');
    expect(commands[0]).toHaveProperty('isElite');
  });

  it('elapsed time is tracked correctly', () => {
    director.update(5000);
    expect(director.getElapsedMs()).toBe(5000);
    expect(director.getElapsedMinutes()).toBeCloseTo(5000 / 60000);
  });

  it('boss spawns at configured time', () => {
    // Advance to 10 minutes + initial delay + one interval
    const tenMinMs = DEFAULT_CONFIG.bossTimeMinutes * 60000;
    // Feed time in chunks: first past initial delay, then to boss time
    director.update(DEFAULT_CONFIG.initialDelayMs);
    director.update(DEFAULT_CONFIG.baseIntervalMs); // trigger first spawn

    // Now advance to boss time in one big chunk
    director.reset();
    director.update(DEFAULT_CONFIG.initialDelayMs + tenMinMs + DEFAULT_CONFIG.baseIntervalMs);

    // After reset, advance past initial delay and boss time together
    const allCommands: ReturnType<WaveDirector['update']> = [];
    const fresh = new WaveDirector(DEFAULT_CONFIG);
    fresh.setEnemyPool(['basic', 'fast', 'tank']);

    // Step past initial delay
    fresh.update(DEFAULT_CONFIG.initialDelayMs);
    // Step to boss threshold (10 minutes elapsed total)
    const cmds = fresh.update(tenMinMs + DEFAULT_CONFIG.baseIntervalMs);
    allCommands.push(...cmds);

    const bossCommands = allCommands.filter(c => c.enemyId === 'boss');
    expect(bossCommands).toHaveLength(1);
    expect(bossCommands[0].isElite).toBe(false);
  });

  it('reset restores director to initial state', () => {
    director.update(5000);
    director.reset();
    expect(director.getElapsedMs()).toBe(0);
    // After reset, initial delay should apply again
    const commands = director.update(2999);
    expect(commands).toHaveLength(0);
  });
});
