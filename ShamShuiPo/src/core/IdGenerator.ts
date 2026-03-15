// ── Neon Defender: ID Generator ──

/**
 * Simple monotonic unique ID generator.
 * Prefix + counter ensures IDs are readable and collision-free within a session.
 */
export class IdGenerator {
  private counter = 0;

  /**
   * Returns a unique ID such as "hero_0", "enemy_1", "enemy_2".
   */
  next(prefix: string): string {
    return `${prefix}_${this.counter++}`;
  }

  /** Reset counter (useful for tests). */
  reset(): void {
    this.counter = 0;
  }
}
