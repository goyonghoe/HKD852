/**
 * Grid-based spatial hash for fast 2D collision queries.
 * Pure TS — no Phaser dependency.
 * Optimized: numeric keys, reusable cell arrays, buffer-based query.
 */
export class SpatialHash {
  private cells = new Map<number, number[]>();
  private cellSize: number;

  constructor(cellSize = 64) {
    this.cellSize = cellSize;
  }

  clear(): void {
    for (const arr of this.cells.values()) {
      arr.length = 0;
    }
  }

  private cellKey(x: number, y: number): number {
    return (Math.floor(x / this.cellSize) + 200) * 10007 +
           (Math.floor(y / this.cellSize) + 200);
  }

  insert(index: number, x: number, y: number): void {
    const k = this.cellKey(x, y);
    let list = this.cells.get(k);
    if (!list) {
      list = [];
      this.cells.set(k, list);
    }
    list.push(index);
  }

  /** Query indices into a pre-allocated buffer. Returns count written.
   *  When `out` is pre-allocated (length > 0), bounds-checks to avoid overflow. */
  queryRadiusInto(x: number, y: number, radius: number, out: number[]): number {
    let count = 0;
    const maxCount = out.length; // 0 for dynamic arrays, >0 for pre-allocated buffers
    const r = Math.ceil(radius / this.cellSize);
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        const k = (cx + dx + 200) * 10007 + (cy + dy + 200);
        const list = this.cells.get(k);
        if (list) {
          for (let i = 0; i < list.length; i++) {
            if (maxCount > 0 && count >= maxCount) return count;
            out[count++] = list[i];
          }
        }
      }
    }
    return count;
  }

  /** Legacy API — allocates array. Use queryRadiusInto for perf-critical code. */
  queryRadius(x: number, y: number, radius: number): number[] {
    const results: number[] = [];
    const count = this.queryRadiusInto(x, y, radius, results);
    results.length = count;
    return results;
  }
}
