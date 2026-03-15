import { describe, it, expect } from "vitest";
import { ObjectPool, swapRemove } from "../../src/core/ObjectPool";

// ── swapRemove ──

describe("swapRemove", () => {
  it("removes from middle by swapping with last", () => {
    const arr = [10, 20, 30, 40];
    const removed = swapRemove(arr, 1);
    expect(removed).toBe(20);
    expect(arr).toHaveLength(3);
    expect(arr).toContain(40);
    expect(arr).not.toContain(20);
  });

  it("removes last element without swap", () => {
    const arr = [1, 2, 3];
    expect(swapRemove(arr, 2)).toBe(3);
    expect(arr).toEqual([1, 2]);
  });

  it("removes first element", () => {
    const arr = [1, 2, 3];
    expect(swapRemove(arr, 0)).toBe(1);
    expect(arr).toHaveLength(2);
    expect(arr).toContain(3);
  });

  it("removes single element", () => {
    const arr = [42];
    expect(swapRemove(arr, 0)).toBe(42);
    expect(arr).toEqual([]);
  });

  it("returns undefined for out of bounds", () => {
    expect(swapRemove([], 0)).toBeUndefined();
    expect(swapRemove([1], 5)).toBeUndefined();
    expect(swapRemove([1], -1)).toBeUndefined();
  });
});

// ── ObjectPool ──

describe("ObjectPool", () => {
  const factory = () => ({ value: 0 });
  const reset = (obj: { value: number }) => { obj.value = 0; };

  it("creates new objects when pool is empty", () => {
    const pool = new ObjectPool(factory, reset);
    const obj = pool.acquire();
    expect(obj).toBeDefined();
    expect(pool.activeCount).toBe(1);
    expect(pool.poolSize).toBe(0);
  });

  it("reuses objects after release", () => {
    const pool = new ObjectPool(factory, reset);
    const obj1 = pool.acquire();
    obj1.value = 42;
    pool.release(obj1);
    expect(pool.activeCount).toBe(0);
    expect(pool.poolSize).toBe(1);

    const obj2 = pool.acquire();
    expect(obj2).toBe(obj1);
    expect(obj2.value).toBe(0);
  });

  it("pre-allocates with initialSize", () => {
    const pool = new ObjectPool(factory, reset, 5);
    expect(pool.poolSize).toBe(5);
    expect(pool.activeCount).toBe(0);
  });

  it("releaseAll returns everything to pool", () => {
    const pool = new ObjectPool(factory, reset);
    pool.acquire();
    pool.acquire();
    pool.acquire();
    expect(pool.activeCount).toBe(3);
    pool.releaseAll();
    expect(pool.activeCount).toBe(0);
    expect(pool.poolSize).toBe(3);
  });

  it("calls reset on release", () => {
    let resetCount = 0;
    const countingReset = () => { resetCount++; };
    const pool = new ObjectPool(factory, countingReset);
    const obj = pool.acquire();
    pool.release(obj);
    expect(resetCount).toBe(1);
  });

  it("release ignores objects not in active set", () => {
    const pool = new ObjectPool(factory, reset);
    const foreign = { value: 99 };
    pool.release(foreign);
    expect(pool.poolSize).toBe(0);
  });

  it("destroy clears everything", () => {
    const pool = new ObjectPool(factory, reset, 3);
    pool.acquire();
    pool.destroy();
    expect(pool.activeCount).toBe(0);
    expect(pool.poolSize).toBe(0);
  });
});
