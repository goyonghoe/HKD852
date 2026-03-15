import { describe, it, expect } from 'vitest';
import {
  calculateCentroid,
  checkAoeHits,
  tickNapalmZone,
  batchTickNapalmZones,
  calculateNapalmFlightTime,
  calculateBarrelOffset,
  calculateZoneRadius,
  type NapalmZoneState,
  type Position,
} from '../../src/core/WeaponZoneCalc';

// --- calculateCentroid ---
describe('calculateCentroid', () => {
  it('empty array returns {x:0, y:0}', () => {
    const c = calculateCentroid([]);
    expect(c.x).toBe(0);
    expect(c.y).toBe(0);
  });

  it('single point returns that point', () => {
    const c = calculateCentroid([{ x: 10, y: 20 }]);
    expect(c.x).toBe(10);
    expect(c.y).toBe(20);
  });

  it('multiple points returns average', () => {
    const c = calculateCentroid([
      { x: 0, y: 0 },
      { x: 10, y: 20 },
      { x: 20, y: 40 },
    ]);
    expect(c.x).toBeCloseTo(10);
    expect(c.y).toBeCloseTo(20);
  });

  it('negative coordinates', () => {
    const c = calculateCentroid([
      { x: -10, y: -20 },
      { x: 10, y: 20 },
    ]);
    expect(c.x).toBeCloseTo(0);
    expect(c.y).toBeCloseTo(0);
  });

  it('two identical points', () => {
    const c = calculateCentroid([
      { x: 5, y: 5 },
      { x: 5, y: 5 },
    ]);
    expect(c.x).toBe(5);
    expect(c.y).toBe(5);
  });
});

// --- checkAoeHits ---
describe('checkAoeHits', () => {
  const positions: Position[] = [
    { x: 0, y: 0 },
    { x: 5, y: 0 },
    { x: 10, y: 0 },
    { x: 100, y: 100 },
  ];

  it('all in range', () => {
    const hits = checkAoeHits(positions, 0, 0, 200);
    expect(hits).toEqual([0, 1, 2, 3]);
  });

  it('none in range', () => {
    const hits = checkAoeHits(positions, 500, 500, 10);
    expect(hits).toEqual([]);
  });

  it('mixed: some in, some out', () => {
    const hits = checkAoeHits(positions, 0, 0, 8);
    // idx 0: dist=0 < 8 ✓
    // idx 1: dist=5 < 8 ✓
    // idx 2: dist=10 ≥ 8 ✗
    // idx 3: dist=~141 ≥ 8 ✗
    expect(hits).toEqual([0, 1]);
  });

  it('exact boundary is a miss (strict less-than)', () => {
    // Position at exactly radius distance
    const pts: Position[] = [{ x: 10, y: 0 }];
    const hits = checkAoeHits(pts, 0, 0, 10);
    // dist=10, radius=10 → dx*dx=100, radius*radius=100 → 100 < 100 is false
    expect(hits).toEqual([]);
  });

  it('just inside boundary is a hit', () => {
    const pts: Position[] = [{ x: 9.99, y: 0 }];
    const hits = checkAoeHits(pts, 0, 0, 10);
    expect(hits).toEqual([0]);
  });

  it('empty positions array', () => {
    const hits = checkAoeHits([], 0, 0, 100);
    expect(hits).toEqual([]);
  });
});

// --- tickNapalmZone ---
describe('tickNapalmZone', () => {
  const makeZone = (overrides: Partial<NapalmZoneState> = {}): NapalmZoneState => ({
    x: 100,
    y: 200,
    radius: 80,
    damage: 25,
    remainingMs: 4000,
    tickMs: 500,
    tickTimer: 500,
    ...overrides,
  });

  it('normal tick: neither expires nor ticks', () => {
    const zone = makeZone({ remainingMs: 4000, tickTimer: 500 });
    const result = tickNapalmZone(zone, 100);
    expect(result.expired).toBe(false);
    expect(result.shouldTick).toBe(false);
    expect(result.updatedZone.remainingMs).toBe(3900);
    expect(result.updatedZone.tickTimer).toBe(400);
  });

  it('zone expires when remainingMs reaches 0', () => {
    const zone = makeZone({ remainingMs: 100 });
    const result = tickNapalmZone(zone, 100);
    expect(result.expired).toBe(true);
    expect(result.updatedZone.remainingMs).toBe(0);
  });

  it('zone expires when remainingMs goes negative', () => {
    const zone = makeZone({ remainingMs: 50 });
    const result = tickNapalmZone(zone, 100);
    expect(result.expired).toBe(true);
    expect(result.updatedZone.remainingMs).toBe(-50);
  });

  it('tick fires when tickTimer reaches 0', () => {
    const zone = makeZone({ tickTimer: 100 });
    const result = tickNapalmZone(zone, 100);
    expect(result.shouldTick).toBe(true);
    expect(result.updatedZone.tickTimer).toBe(500); // reset to tickMs
  });

  it('tick fires when tickTimer goes negative', () => {
    const zone = makeZone({ tickTimer: 50 });
    const result = tickNapalmZone(zone, 100);
    expect(result.shouldTick).toBe(true);
    expect(result.updatedZone.tickTimer).toBe(500);
  });

  it('tick and expire in same frame', () => {
    const zone = makeZone({ remainingMs: 100, tickTimer: 50 });
    const result = tickNapalmZone(zone, 100);
    expect(result.expired).toBe(true);
    expect(result.shouldTick).toBe(true);
  });

  it('does not mutate input zone', () => {
    const zone = makeZone();
    const originalRemaining = zone.remainingMs;
    const originalTimer = zone.tickTimer;
    tickNapalmZone(zone, 100);
    expect(zone.remainingMs).toBe(originalRemaining);
    expect(zone.tickTimer).toBe(originalTimer);
  });

  it('fresh zone (tickTimer=0) ticks immediately', () => {
    const zone = makeZone({ tickTimer: 0 });
    const result = tickNapalmZone(zone, 16);
    expect(result.shouldTick).toBe(true);
    expect(result.updatedZone.tickTimer).toBe(500);
  });
});

// --- batchTickNapalmZones ---
describe('batchTickNapalmZones', () => {
  const makeZone = (overrides: Partial<NapalmZoneState> = {}): NapalmZoneState => ({
    x: 0,
    y: 0,
    radius: 80,
    damage: 25,
    remainingMs: 4000,
    tickMs: 500,
    tickTimer: 500,
    ...overrides,
  });

  it('empty zones array', () => {
    const result = batchTickNapalmZones([], 100);
    expect(result.activeZones).toHaveLength(0);
    expect(result.tickingIndices).toHaveLength(0);
  });

  it('3 zones: 1 expires, 1 ticks, 1 neither', () => {
    const zones = [
      makeZone({ remainingMs: 50, tickTimer: 400 }), // will expire, no tick
      makeZone({ tickTimer: 50 }), // will tick
      makeZone({ remainingMs: 4000, tickTimer: 400 }), // neither
    ];
    const result = batchTickNapalmZones(zones, 100);
    // Zone 0 expired → removed
    expect(result.activeZones).toHaveLength(2);
    // tickingIndices use INPUT indices: zone 1 ticked → input index 1
    expect(result.tickingIndices).toEqual([1]);
  });

  it('all zones expire (no tick)', () => {
    const zones = [makeZone({ remainingMs: 50, tickTimer: 400 }), makeZone({ remainingMs: 80, tickTimer: 400 })];
    const result = batchTickNapalmZones(zones, 100);
    expect(result.activeZones).toHaveLength(0);
    expect(result.tickingIndices).toHaveLength(0);
  });

  it('no zones expire, multiple tick', () => {
    const zones = [makeZone({ tickTimer: 50 }), makeZone({ tickTimer: 30 })];
    const result = batchTickNapalmZones(zones, 100);
    expect(result.activeZones).toHaveLength(2);
    // tickingIndices use INPUT indices
    expect(result.tickingIndices).toEqual([0, 1]);
  });

  it('zone that ticks AND expires is included in tickingIndices', () => {
    const zones = [
      makeZone({ remainingMs: 50, tickTimer: 30 }), // expires AND ticks
      makeZone({ remainingMs: 4000, tickTimer: 400 }), // neither
    ];
    const result = batchTickNapalmZones(zones, 100);
    // Zone 0 expired → removed from activeZones
    expect(result.activeZones).toHaveLength(1);
    // But zone 0 also ticked → input index 0 is in tickingIndices
    expect(result.tickingIndices).toEqual([0]);
  });
});

// --- calculateNapalmFlightTime ---
describe('calculateNapalmFlightTime', () => {
  it('same position → 200ms (min clamp)', () => {
    expect(calculateNapalmFlightTime(100, 100, 100, 100)).toBe(200);
  });

  it('close target → clamps to 200ms', () => {
    // dist=100, 100*0.5=50 → max(200,50)=200
    expect(calculateNapalmFlightTime(0, 0, 100, 0)).toBe(200);
  });

  it('far target → clamps to 500ms', () => {
    // dist=2000, 2000*0.5=1000 → min(500,1000)=500
    expect(calculateNapalmFlightTime(0, 0, 2000, 0)).toBe(500);
  });

  it('medium target → proportional', () => {
    // dist=800, 800*0.5=400 → between 200 and 500
    expect(calculateNapalmFlightTime(0, 0, 800, 0)).toBe(400);
  });

  it('diagonal distance calculated correctly', () => {
    // dist = sqrt(300^2+400^2) = 500, 500*0.5=250
    expect(calculateNapalmFlightTime(0, 0, 300, 400)).toBe(250);
  });
});

// --- calculateBarrelOffset ---
describe('calculateBarrelOffset', () => {
  it('aoe: straight up', () => {
    const p = calculateBarrelOffset('aoe', 30, Math.PI / 4);
    expect(p.x).toBe(0);
    expect(p.y).toBe(-30);
  });

  it('bomb: straight up', () => {
    const p = calculateBarrelOffset('bomb', 30, 0);
    expect(p.x).toBe(0);
    expect(p.y).toBe(-30);
  });

  it('napalm: straight up', () => {
    const p = calculateBarrelOffset('napalm', 30, 1.5);
    expect(p.x).toBe(0);
    expect(p.y).toBe(-30);
  });

  it('bullet at angle=0: offset right', () => {
    const p = calculateBarrelOffset('bullet', 30, 0);
    expect(p.x).toBeCloseTo(30);
    expect(p.y).toBeCloseTo(0);
  });

  it('laser at angle=PI/2: offset down', () => {
    const p = calculateBarrelOffset('laser', 30, Math.PI / 2);
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(30);
  });

  it('homing at arbitrary angle', () => {
    const angle = Math.PI / 4;
    const p = calculateBarrelOffset('homing', 30, angle);
    expect(p.x).toBeCloseTo(Math.cos(angle) * 30);
    expect(p.y).toBeCloseTo(Math.sin(angle) * 30);
  });
});

// --- calculateZoneRadius ---
describe('calculateZoneRadius', () => {
  it('level 1, base 80 → 95', () => {
    expect(calculateZoneRadius(80, 1)).toBe(95);
  });
  it('level 3, base 80 → 125', () => {
    expect(calculateZoneRadius(80, 3)).toBe(125);
  });
  it('level 5, base 80 → 155', () => {
    expect(calculateZoneRadius(80, 5)).toBe(155);
  });
  it('level 0, base 100 → 100', () => {
    expect(calculateZoneRadius(100, 0)).toBe(100);
  });
  it('level 2, base 50 → 80', () => {
    expect(calculateZoneRadius(50, 2)).toBe(80);
  });
});
