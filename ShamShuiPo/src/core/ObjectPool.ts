// ── ObjectPool: Generic reusable object pool ──

/**
 * O(1) removal by swapping target with last element and popping.
 * Returns the removed element, or undefined if index is out of bounds.
 */
export function swapRemove<T>(arr: T[], index: number): T | undefined {
  if (index < 0 || index >= arr.length) return undefined;
  const removed = arr[index];
  const last = arr.length - 1;
  if (index !== last) arr[index] = arr[last];
  arr.pop();
  return removed;
}

export class ObjectPool<T> {
  private readonly factory: () => T;
  private readonly resetFn: (obj: T) => void;
  private available: T[] = [];
  private active: T[] = [];

  constructor(factory: () => T, reset: (obj: T) => void, initialSize = 0) {
    this.factory = factory;
    this.resetFn = reset;
    for (let i = 0; i < initialSize; i++) {
      this.available.push(factory());
    }
  }

  /** Get an object from the pool, or create a new one if empty. */
  acquire(): T {
    const obj =
      this.available.length > 0 ? this.available.pop()! : this.factory();
    this.active.push(obj);
    return obj;
  }

  /** Return an object to the pool. Calls the reset function. */
  release(obj: T): void {
    const idx = this.active.indexOf(obj);
    if (idx === -1) return;
    swapRemove(this.active, idx);
    this.resetFn(obj);
    this.available.push(obj);
  }

  /** Release all active objects back to the pool. */
  releaseAll(): void {
    for (let i = this.active.length - 1; i >= 0; i--) {
      this.resetFn(this.active[i]);
      this.available.push(this.active[i]);
    }
    this.active.length = 0;
  }

  /** Number of objects currently in use. */
  get activeCount(): number {
    return this.active.length;
  }

  /** Number of objects available in the pool. */
  get poolSize(): number {
    return this.available.length;
  }

  /** Clear all objects. Pool becomes empty. */
  destroy(): void {
    this.available.length = 0;
    this.active.length = 0;
  }
}
