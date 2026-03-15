import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RetroSFX, getRetroSFX } from '../../src/audio/RetroSFX';

// Mock localStorage for SaveManager dependency
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete store[key];
  }),
};
vi.stubGlobal('localStorage', localStorageMock);

// Minimal AudioContext mock for Node.js environment
class MockGainNode {
  gain = { value: 1, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() };
  connect = vi.fn();
  disconnect = vi.fn();
}

class MockOscillatorNode {
  type: OscillatorType = 'sine';
  frequency = { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() };
  connect = vi.fn();
  disconnect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
  onended: (() => void) | null = null;
}

class MockBufferSource {
  buffer: AudioBuffer | null = null;
  connect = vi.fn();
  disconnect = vi.fn();
  start = vi.fn();
  onended: (() => void) | null = null;
}

class MockAudioContext {
  currentTime = 0;
  sampleRate = 44100;
  state = 'running';
  resume = vi.fn(() => Promise.resolve());
  createGain = vi.fn(() => new MockGainNode());
  createOscillator = vi.fn(() => new MockOscillatorNode());
  createBufferSource = vi.fn(() => new MockBufferSource());
  createBuffer = vi.fn((_channels: number, length: number, sampleRate: number) => ({
    numberOfChannels: 1,
    length,
    sampleRate,
    getChannelData: () => new Float32Array(length),
    duration: length / sampleRate,
    copyFromChannel: vi.fn(),
    copyToChannel: vi.fn(),
  }));
  destination = {};
}

vi.stubGlobal('AudioContext', MockAudioContext);

describe('RetroSFX — class structure', () => {
  let sfx: RetroSFX;

  beforeEach(() => {
    sfx = new RetroSFX();
    sfx.init();
  });

  it('exports RetroSFX class', () => {
    expect(RetroSFX).toBeDefined();
    expect(typeof RetroSFX).toBe('function');
  });

  it('exports getRetroSFX singleton function', () => {
    expect(getRetroSFX).toBeDefined();
    expect(typeof getRetroSFX).toBe('function');
  });

  it('init creates an instance without throwing', () => {
    const instance = new RetroSFX();
    expect(() => instance.init()).not.toThrow();
  });

  // All expected SFX methods
  const expectedMethods = [
    'tap',
    'deploy',
    'gameOver',
    'levelClear',
    'baseHit',
    'xpCollect',
    'goldCollect',
    'purchase',
    'bossDefeat',
    'weaponBullet',
    'weaponLaser',
    'weaponBomb',
    'weaponMissile',
    'weaponShuriken',
    'weaponNapalm',
    'weaponChain',
    'weaponAoe',
    'enemyHit',
    'enemyDeath',
    'bossEntrance',
    'bossDeath',
    'levelUp',
    'achievementUnlock',
    'buttonClick',
    'tabSwitch',
    'purchaseSuccess',
    'purchaseFail',
    'stageClear',
    'challengeStart',
    'dailyReward',
  ];

  for (const method of expectedMethods) {
    it(`has method: ${method}`, () => {
      expect(typeof (sfx as Record<string, unknown>)[method]).toBe('function');
    });
  }
});

describe('RetroSFX — singleton pattern', () => {
  it('getRetroSFX returns the same instance on repeated calls', () => {
    const a = getRetroSFX();
    const b = getRetroSFX();
    expect(a).toBe(b);
  });

  it('getRetroSFX returns an initialized instance', () => {
    const instance = getRetroSFX();
    expect(instance).toBeInstanceOf(RetroSFX);
  });
});

describe('RetroSFX — enable/disable', () => {
  let sfx: RetroSFX;

  beforeEach(() => {
    sfx = new RetroSFX();
    sfx.init();
  });

  it('isEnabled is true by default', () => {
    expect(sfx.isEnabled).toBe(true);
  });

  it('setEnabled(false) disables the SFX', () => {
    sfx.setEnabled(false);
    expect(sfx.isEnabled).toBe(false);
  });

  it('setEnabled(true) re-enables the SFX', () => {
    sfx.setEnabled(false);
    sfx.setEnabled(true);
    expect(sfx.isEnabled).toBe(true);
  });

  it('setMuted(true) disables the SFX', () => {
    sfx.setMuted(true);
    expect(sfx.isEnabled).toBe(false);
  });

  it('setMuted(false) enables the SFX', () => {
    sfx.setMuted(true);
    sfx.setMuted(false);
    expect(sfx.isEnabled).toBe(true);
  });
});

describe('RetroSFX — volume control', () => {
  let sfx: RetroSFX;

  beforeEach(() => {
    sfx = new RetroSFX();
    sfx.init();
  });

  it('setVolume does not throw', () => {
    expect(() => sfx.setVolume(0.5)).not.toThrow();
  });

  it('setVolume clamps to 0..1 range (no throw for out-of-range)', () => {
    expect(() => sfx.setVolume(-1)).not.toThrow();
    expect(() => sfx.setVolume(2)).not.toThrow();
  });
});

describe('RetroSFX — SFX methods do not throw when enabled', () => {
  let sfx: RetroSFX;

  beforeEach(() => {
    sfx = new RetroSFX();
    sfx.init();
  });

  const safeMethods = [
    'tap',
    'deploy',
    'gameOver',
    'levelClear',
    'baseHit',
    'xpCollect',
    'goldCollect',
    'purchase',
    'bossDefeat',
    'enemyHit',
    'enemyDeath',
    'bossEntrance',
    'bossDeath',
    'levelUp',
    'achievementUnlock',
    'buttonClick',
    'tabSwitch',
    'purchaseSuccess',
    'purchaseFail',
    'stageClear',
    'challengeStart',
    'dailyReward',
  ];

  for (const method of safeMethods) {
    it(`${method}() does not throw`, () => {
      expect(() => (sfx as Record<string, () => void>)[method]()).not.toThrow();
    });
  }
});

describe('RetroSFX — SFX methods do not throw when disabled', () => {
  let sfx: RetroSFX;

  beforeEach(() => {
    sfx = new RetroSFX();
    sfx.init();
    sfx.setEnabled(false);
  });

  it('tap() does not throw when disabled', () => {
    expect(() => sfx.tap()).not.toThrow();
  });

  it('bossDefeat() does not throw when disabled', () => {
    expect(() => sfx.bossDefeat()).not.toThrow();
  });
});

describe('RetroSFX — without init', () => {
  it('calling sfx methods before init does not crash', () => {
    const sfx = new RetroSFX();
    // Not calling init()
    expect(() => sfx.tap()).not.toThrow();
    expect(() => sfx.bossDefeat()).not.toThrow();
  });
});
