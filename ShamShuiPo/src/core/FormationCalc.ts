// FormationCalc.ts — Enemy formation / group movement patterns (pure TypeScript, immutable)

// ─── Types ───────────────────────────────────────────────────────

export type FormationType =
  | "line"
  | "circle"
  | "v-shape"
  | "wedge"
  | "random-cluster"
  | "grid";

export type Vec2 = {
  readonly x: number;
  readonly y: number;
};

export type FormationSlot = {
  readonly index: number;
  readonly position: Vec2;
  readonly occupied: boolean;
  readonly assignedUnitId: string | null;
};

export type Formation = {
  readonly type: FormationType;
  readonly center: Vec2;
  readonly slots: readonly FormationSlot[];
  readonly spacing: number;
  readonly rotationRad: number;
  readonly facing: number; // radians, 0 = right
};

export type UnitPosition = {
  readonly unitId: string;
  readonly position: Vec2;
};

// ─── Internal helpers ────────────────────────────────────────────

function rotatePoint(point: Vec2, origin: Vec2, rad: number): Vec2 {
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = point.x - origin.x;
  const dy = point.y - origin.y;
  return {
    x: origin.x + dx * cos - dy * sin,
    y: origin.y + dx * sin + dy * cos,
  };
}

function dist(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function angleFromTo(from: Vec2, to: Vec2): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

// ─── Raw position generators (unrotated, centered at origin) ─────

function linePositions(count: number, spacing: number): readonly Vec2[] {
  const result: Vec2[] = [];
  const offset = ((count - 1) * spacing) / 2;
  for (let i = 0; i < count; i++) {
    result.push({ x: i * spacing - offset, y: 0 });
  }
  return result;
}

function circlePositions(count: number, spacing: number): readonly Vec2[] {
  if (count === 0) return [];
  if (count === 1) return [{ x: 0, y: 0 }];
  const radius = (spacing * count) / (2 * Math.PI);
  const result: Vec2[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (2 * Math.PI * i) / count;
    result.push({
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
    });
  }
  return result;
}

function vShapePositions(count: number, spacing: number): readonly Vec2[] {
  const result: Vec2[] = [];
  for (let i = 0; i < count; i++) {
    if (i === 0) {
      result.push({ x: 0, y: 0 });
    } else {
      const row = Math.ceil(i / 2);
      const side = i % 2 === 1 ? -1 : 1;
      result.push({
        x: -row * spacing * 0.707,
        y: side * row * spacing * 0.707,
      });
    }
  }
  return result;
}

function wedgePositions(count: number, spacing: number): readonly Vec2[] {
  const result: Vec2[] = [];
  let placed = 0;
  let row = 0;
  while (placed < count) {
    const unitsInRow = row === 0 ? 1 : row * 2 + 1;
    const toPlace = Math.min(unitsInRow, count - placed);
    const rowOffset = ((toPlace - 1) * spacing) / 2;
    for (let col = 0; col < toPlace; col++) {
      result.push({
        x: -row * spacing,
        y: col * spacing - rowOffset,
      });
      placed++;
    }
    row++;
  }
  return result;
}

function randomClusterPositions(
  count: number,
  spacing: number,
): readonly Vec2[] {
  const result: Vec2[] = [];
  const radius = spacing * Math.max(1, Math.sqrt(count) / 2);
  for (let i = 0; i < count; i++) {
    const angle = (i * 137.508 * Math.PI) / 180; // golden angle
    const r = radius * Math.sqrt(i / Math.max(1, count - 1));
    result.push({
      x: r * Math.cos(angle),
      y: r * Math.sin(angle),
    });
  }
  return result;
}

function gridPositions(count: number, spacing: number): readonly Vec2[] {
  if (count === 0) return [];
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const result: Vec2[] = [];
  const offsetX = ((cols - 1) * spacing) / 2;
  const offsetY = ((rows - 1) * spacing) / 2;
  let placed = 0;
  for (let r = 0; r < rows && placed < count; r++) {
    for (let c = 0; c < cols && placed < count; c++) {
      result.push({
        x: c * spacing - offsetX,
        y: r * spacing - offsetY,
      });
      placed++;
    }
  }
  return result;
}

function generateRawPositions(
  type: FormationType,
  count: number,
  spacing: number,
): readonly Vec2[] {
  switch (type) {
    case "line":
      return linePositions(count, spacing);
    case "circle":
      return circlePositions(count, spacing);
    case "v-shape":
      return vShapePositions(count, spacing);
    case "wedge":
      return wedgePositions(count, spacing);
    case "random-cluster":
      return randomClusterPositions(count, spacing);
    case "grid":
      return gridPositions(count, spacing);
  }
}

// ─── Public API ──────────────────────────────────────────────────

/** Create a formation with center position, unit count, and spacing. */
export function createFormation(
  type: FormationType,
  center: Vec2,
  unitCount: number,
  spacing: number,
): Formation {
  const count = Math.max(0, Math.floor(unitCount));
  const rawPositions = generateRawPositions(type, count, spacing);
  const slots: FormationSlot[] = rawPositions.map((pos, i) => ({
    index: i,
    position: { x: center.x + pos.x, y: center.y + pos.y },
    occupied: false,
    assignedUnitId: null,
  }));
  return {
    type,
    center,
    slots,
    spacing,
    rotationRad: 0,
    facing: 0,
  };
}

/** Return all slot positions as a flat Vec2 array. */
export function getSlotPositions(formation: Formation): readonly Vec2[] {
  return formation.slots.map((s) => s.position);
}

/** Rotate the entire formation around its center by the given radians. */
export function rotateFormation(
  formation: Formation,
  radians: number,
): Formation {
  const newRotation = formation.rotationRad + radians;
  const newSlots = formation.slots.map((slot) => ({
    ...slot,
    position: rotatePoint(slot.position, formation.center, radians),
  }));
  return { ...formation, slots: newSlots, rotationRad: newRotation };
}

/** Scale formation spacing by a multiplier (expand or contract). */
export function scaleFormation(
  formation: Formation,
  scaleFactor: number,
): Formation {
  if (scaleFactor <= 0) return formation;
  const newSpacing = formation.spacing * scaleFactor;
  const newSlots = formation.slots.map((slot) => ({
    ...slot,
    position: {
      x:
        formation.center.x +
        (slot.position.x - formation.center.x) * scaleFactor,
      y:
        formation.center.y +
        (slot.position.y - formation.center.y) * scaleFactor,
    },
  }));
  return { ...formation, slots: newSlots, spacing: newSpacing };
}

/** Translate (move) the entire formation by a delta vector. */
export function moveFormation(formation: Formation, delta: Vec2): Formation {
  const newCenter: Vec2 = {
    x: formation.center.x + delta.x,
    y: formation.center.y + delta.y,
  };
  const newSlots = formation.slots.map((slot) => ({
    ...slot,
    position: {
      x: slot.position.x + delta.x,
      y: slot.position.y + delta.y,
    },
  }));
  return { ...formation, center: newCenter, slots: newSlots };
}

/** Assign units to their nearest available formation slot (greedy). */
export function assignUnitsToSlots(
  formation: Formation,
  units: readonly UnitPosition[],
): Formation {
  const available = new Set(
    formation.slots.filter((s) => !s.occupied).map((s) => s.index),
  );
  const assignments = new Map<number, string>();
  const remaining = [...units];

  while (remaining.length > 0 && available.size > 0) {
    let bestUnit = -1;
    let bestSlot = -1;
    let bestDist = Infinity;

    for (let u = 0; u < remaining.length; u++) {
      for (const slotIdx of available) {
        const d = dist(
          remaining[u].position,
          formation.slots[slotIdx].position,
        );
        if (d < bestDist) {
          bestDist = d;
          bestUnit = u;
          bestSlot = slotIdx;
        }
      }
    }

    if (bestUnit < 0 || bestSlot < 0) break;

    assignments.set(bestSlot, remaining[bestUnit].unitId);
    available.delete(bestSlot);
    remaining.splice(bestUnit, 1);
  }

  const newSlots = formation.slots.map((slot) => {
    const unitId = assignments.get(slot.index);
    if (unitId !== undefined) {
      return { ...slot, occupied: true, assignedUnitId: unitId };
    }
    return slot;
  });

  return { ...formation, slots: newSlots };
}

/**
 * Check formation coherence — are units roughly in their assigned positions?
 * Returns a ratio 0..1 where 1 means all assigned units are within tolerance.
 */
export function checkCoherence(
  formation: Formation,
  unitPositions: readonly UnitPosition[],
  tolerance: number,
): number {
  const unitMap = new Map<string, Vec2>();
  for (const u of unitPositions) {
    unitMap.set(u.unitId, u.position);
  }

  const assigned = formation.slots.filter((s) => s.assignedUnitId !== null);
  if (assigned.length === 0) return 1;

  let inPlace = 0;
  for (const slot of assigned) {
    const unitPos = unitMap.get(slot.assignedUnitId!);
    if (unitPos && dist(unitPos, slot.position) <= tolerance) {
      inPlace++;
    }
  }

  return inPlace / assigned.length;
}

/**
 * Split a formation into N roughly-equal sub-groups.
 * Returns new formations centered on each sub-group's centroid.
 */
export function splitFormation(
  formation: Formation,
  groupCount: number,
): readonly Formation[] {
  const n = Math.max(1, Math.min(groupCount, formation.slots.length));
  const slotsPerGroup = Math.ceil(formation.slots.length / n);
  const groups: Formation[] = [];

  for (let g = 0; g < n; g++) {
    const start = g * slotsPerGroup;
    const end = Math.min(start + slotsPerGroup, formation.slots.length);
    const groupSlots = formation.slots.slice(start, end);
    if (groupSlots.length === 0) break;

    const cx =
      groupSlots.reduce((sum, s) => sum + s.position.x, 0) / groupSlots.length;
    const cy =
      groupSlots.reduce((sum, s) => sum + s.position.y, 0) / groupSlots.length;
    const center: Vec2 = { x: cx, y: cy };

    const reindexed: FormationSlot[] = groupSlots.map((s, i) => ({
      ...s,
      index: i,
    }));

    groups.push({
      type: formation.type,
      center,
      slots: reindexed,
      spacing: formation.spacing,
      rotationRad: formation.rotationRad,
      facing: formation.facing,
    });
  }

  return groups;
}

/** Merge two formations into one. Center is the midpoint. */
export function mergeFormations(a: Formation, b: Formation): Formation {
  const center: Vec2 = {
    x: (a.center.x + b.center.x) / 2,
    y: (a.center.y + b.center.y) / 2,
  };

  const allSlots: FormationSlot[] = [
    ...a.slots.map((s, i) => ({ ...s, index: i })),
    ...b.slots.map((s, i) => ({ ...s, index: a.slots.length + i })),
  ];

  return {
    type: a.type,
    center,
    slots: allSlots,
    spacing: (a.spacing + b.spacing) / 2,
    rotationRad: 0,
    facing: 0,
  };
}

/** Set the formation's facing direction toward a target point. */
export function setFormationFacing(
  formation: Formation,
  target: Vec2,
): Formation {
  const facing = angleFromTo(formation.center, target);
  return { ...formation, facing };
}

/** Get the facing angle each individual slot should have toward a target. */
export function getSlotFacings(
  formation: Formation,
  target: Vec2,
): readonly number[] {
  return formation.slots.map((s) => angleFromTo(s.position, target));
}

/**
 * Add slots to an existing formation. Regenerates using the formation's type
 * pattern for the new total count, preserving existing assignments.
 */
export function addSlots(formation: Formation, count: number): Formation {
  if (count <= 0) return formation;
  const totalCount = formation.slots.length + count;
  const rawPositions = generateRawPositions(
    formation.type,
    totalCount,
    formation.spacing,
  );

  const newSlots: FormationSlot[] = rawPositions.map((pos, i) => {
    let worldPos: Vec2 = {
      x: formation.center.x + pos.x,
      y: formation.center.y + pos.y,
    };
    if (formation.rotationRad !== 0) {
      worldPos = rotatePoint(worldPos, formation.center, formation.rotationRad);
    }
    const existing = i < formation.slots.length ? formation.slots[i] : null;
    return {
      index: i,
      position: worldPos,
      occupied: existing ? existing.occupied : false,
      assignedUnitId: existing ? existing.assignedUnitId : null,
    };
  });

  return { ...formation, slots: newSlots };
}

/** Remove N slots from the end of the formation. */
export function removeSlots(formation: Formation, count: number): Formation {
  if (count <= 0) return formation;
  const keepCount = Math.max(0, formation.slots.length - count);
  const newSlots = formation.slots.slice(0, keepCount).map((s, i) => ({
    ...s,
    index: i,
  }));
  return { ...formation, slots: newSlots };
}

/** Count occupied slots. */
export function getOccupiedCount(formation: Formation): number {
  return formation.slots.filter((s) => s.occupied).length;
}

/** Count available (unoccupied) slots. */
export function getAvailableCount(formation: Formation): number {
  return formation.slots.filter((s) => !s.occupied).length;
}

/** Unassign a specific unit from its slot. */
export function unassignUnit(formation: Formation, unitId: string): Formation {
  const newSlots = formation.slots.map((slot) => {
    if (slot.assignedUnitId === unitId) {
      return { ...slot, occupied: false, assignedUnitId: null };
    }
    return slot;
  });
  return { ...formation, slots: newSlots };
}

/** Get the slot a specific unit is assigned to, or null. */
export function getUnitSlot(
  formation: Formation,
  unitId: string,
): FormationSlot | null {
  return formation.slots.find((s) => s.assignedUnitId === unitId) ?? null;
}

/** Calculate the bounding radius from center to the farthest slot. */
export function getBoundingRadius(formation: Formation): number {
  if (formation.slots.length === 0) return 0;
  let maxDist = 0;
  for (const slot of formation.slots) {
    const d = dist(slot.position, formation.center);
    if (d > maxDist) maxDist = d;
  }
  return maxDist;
}

/** Move formation center to a specific world position. */
export function setFormationCenter(
  formation: Formation,
  newCenter: Vec2,
): Formation {
  const delta: Vec2 = {
    x: newCenter.x - formation.center.x,
    y: newCenter.y - formation.center.y,
  };
  return moveFormation(formation, delta);
}
