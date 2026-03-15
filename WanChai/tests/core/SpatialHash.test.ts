import { describe, it, expect, beforeEach } from 'vitest';
import { SpatialHash } from '../../src/core/SpatialHash';

describe('SpatialHash', () => {
  let hash: SpatialHash;

  beforeEach(() => {
    hash = new SpatialHash(64);
  });

  it('queryRadius returns entity inserted at same position', () => {
    hash.insert(0, 100, 100);
    const results = hash.queryRadius(100, 100, 10);
    expect(results).toContain(0);
  });

  it('queryRadius returns multiple entities in same cell', () => {
    hash.insert(0, 100, 100);
    hash.insert(1, 110, 110);
    hash.insert(2, 120, 120);
    const results = hash.queryRadius(110, 110, 32);
    expect(results).toContain(0);
    expect(results).toContain(1);
    expect(results).toContain(2);
  });

  it('queryRadius does not return entities far outside radius cells', () => {
    hash.insert(0, 100, 100);
    hash.insert(1, 800, 800); // far away — different cell grid entirely
    const results = hash.queryRadius(100, 100, 10);
    expect(results).toContain(0);
    expect(results).not.toContain(1);
  });

  it('clear removes all entries', () => {
    hash.insert(0, 100, 100);
    hash.insert(1, 200, 200);
    hash.clear();
    const results = hash.queryRadius(100, 100, 200);
    expect(results).toHaveLength(0);
  });

  it('queryRadius with large radius spans multiple cells', () => {
    hash.insert(0, 0, 0);
    hash.insert(1, 300, 300);
    const results = hash.queryRadius(150, 150, 300);
    expect(results).toContain(0);
    expect(results).toContain(1);
  });
});
