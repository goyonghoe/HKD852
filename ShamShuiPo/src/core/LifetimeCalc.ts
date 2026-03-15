// LifetimeCalc.ts — Entity Lifetime Management (pure TS, immutable, no Phaser)

export interface LifetimeEntity {
  readonly id: string;
  readonly lifetime: number; // total lifetime in ms
  readonly elapsed: number; // elapsed time in ms
  readonly active: boolean;
  readonly onExpireAction: string; // 'destroy' | 'fade' | 'explode' | 'none'
}

export interface LifetimeState {
  readonly entities: readonly LifetimeEntity[];
  readonly maxEntities: number;
}

export function createLifetimeState(maxEntities: number = 200): LifetimeState {
  return { entities: [], maxEntities };
}

export function addEntity(
  state: LifetimeState,
  id: string,
  lifetime: number,
  onExpireAction: string = "destroy",
): LifetimeState {
  const entity: LifetimeEntity = {
    id,
    lifetime,
    elapsed: 0,
    active: true,
    onExpireAction,
  };

  let entities = [...state.entities, entity];

  // Remove oldest (first) entries if max exceeded
  while (entities.length > state.maxEntities) {
    entities = entities.slice(1);
  }

  return { ...state, entities };
}

export function updateLifetimes(
  state: LifetimeState,
  deltaMs: number,
): {
  newState: LifetimeState;
  expired: readonly { id: string; action: string }[];
} {
  const expired: { id: string; action: string }[] = [];

  const entities = state.entities.map((e) => {
    if (!e.active) return e;

    const newElapsed = e.elapsed + deltaMs;
    if (newElapsed >= e.lifetime) {
      expired.push({ id: e.id, action: e.onExpireAction });
      return { ...e, elapsed: newElapsed, active: false };
    }
    return { ...e, elapsed: newElapsed };
  });

  return { newState: { ...state, entities }, expired };
}

export function removeEntity(state: LifetimeState, id: string): LifetimeState {
  return { ...state, entities: state.entities.filter((e) => e.id !== id) };
}

export function getEntity(
  state: LifetimeState,
  id: string,
): LifetimeEntity | null {
  return state.entities.find((e) => e.id === id) ?? null;
}

export function isAlive(state: LifetimeState, id: string): boolean {
  const entity = getEntity(state, id);
  return entity !== null && entity.active;
}

export function getRemainingTime(state: LifetimeState, id: string): number {
  const entity = getEntity(state, id);
  if (entity === null || !entity.active) return 0;
  return Math.max(0, entity.lifetime - entity.elapsed);
}

export function getLifetimePercent(state: LifetimeState, id: string): number {
  const entity = getEntity(state, id);
  if (entity === null || entity.lifetime <= 0) return 0;
  return Math.min(1, Math.max(0, entity.elapsed / entity.lifetime));
}

export function getActiveCount(state: LifetimeState): number {
  return state.entities.filter((e) => e.active).length;
}

export function clearEntities(state: LifetimeState): LifetimeState {
  return { ...state, entities: [] };
}

export function extendLifetime(
  state: LifetimeState,
  id: string,
  extraMs: number,
): LifetimeState {
  return {
    ...state,
    entities: state.entities.map((e) =>
      e.id === id ? { ...e, lifetime: e.lifetime + extraMs } : e,
    ),
  };
}
