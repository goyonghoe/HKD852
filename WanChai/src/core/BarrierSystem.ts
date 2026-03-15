/**
 * BarrierSystem — Pure TypeScript barrier HP tracker.
 * No Phaser imports (core/ rule).
 * The barrier sits between the player and enemies;
 * when its HP reaches 0 the run ends.
 */
export class BarrierSystem {
  readonly maxHp: number;
  private _currentHp: number;

  constructor(maxHp: number) {
    this.maxHp = maxHp;
    this._currentHp = maxHp;
  }

  get currentHp(): number {
    return this._currentHp;
  }

  /** Apply damage. Returns true if the barrier is now destroyed. */
  takeDamage(amount: number): boolean {
    this._currentHp = Math.max(0, this._currentHp - amount);
    return this._currentHp <= 0;
  }

  /** Current HP as a 0-1 fraction. */
  getHpPercent(): number {
    if (this.maxHp <= 0) return 0;
    return this._currentHp / this.maxHp;
  }

  isDestroyed(): boolean {
    return this._currentHp <= 0;
  }

  /** Reset to a new max HP (e.g. between stages). */
  reset(newMaxHp: number): void {
    (this as { maxHp: number }).maxHp = newMaxHp;
    this._currentHp = newMaxHp;
  }
}
