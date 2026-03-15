// ── Tests: FogOfWarCalc ──

import { describe, it, expect } from "vitest";
import {
  createFogState,
  updateVisibility,
  getCellVisibility,
  getVisibleCells,
  getExploredPercent,
  isVisible,
  isExplored,
  revealArea,
  hideAll,
  revealAll,
  lineOfSight,
} from "../../src/core/FogOfWarCalc";

// ════════════════════════════════════════════════════════════════
// § createFogState
// ════════════════════════════════════════════════════════════════

describe("createFogState", () => {
  it("creates grid with correct dimensions", () => {
    const s = createFogState(10, 8);
    expect(s.width).toBe(10);
    expect(s.height).toBe(8);
    expect(s.grid.length).toBe(8);
    expect(s.grid[0].length).toBe(10);
  });

  it("all cells start as hidden", () => {
    const s = createFogState(5, 5);
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        expect(s.grid[y][x]).toBe("hidden");
      }
    }
  });

  it("default revealRadius is 5", () => {
    const s = createFogState(10, 10);
    expect(s.revealRadius).toBe(5);
  });

  it("custom revealRadius is respected", () => {
    const s = createFogState(10, 10, 3);
    expect(s.revealRadius).toBe(3);
  });

  it("creates 1x1 grid", () => {
    const s = createFogState(1, 1);
    expect(s.grid.length).toBe(1);
    expect(s.grid[0].length).toBe(1);
    expect(s.grid[0][0]).toBe("hidden");
  });

  it("handles large grid", () => {
    const s = createFogState(100, 100, 10);
    expect(s.width).toBe(100);
    expect(s.height).toBe(100);
  });
});

// ════════════════════════════════════════════════════════════════
// § updateVisibility
// ════════════════════════════════════════════════════════════════

describe("updateVisibility", () => {
  it("reveals cells within radius around player", () => {
    const s = createFogState(20, 20, 2);
    const s2 = updateVisibility(s, 10, 10);
    expect(getCellVisibility(s2, 10, 10)).toBe("visible");
    expect(getCellVisibility(s2, 11, 10)).toBe("visible");
    expect(getCellVisibility(s2, 10, 11)).toBe("visible");
  });

  it("does not reveal cells outside radius", () => {
    const s = createFogState(20, 20, 2);
    const s2 = updateVisibility(s, 10, 10);
    expect(getCellVisibility(s2, 0, 0)).toBe("hidden");
    expect(getCellVisibility(s2, 19, 19)).toBe("hidden");
  });

  it("demotes previously visible cells to explored", () => {
    const s = createFogState(30, 30, 2);
    const s2 = updateVisibility(s, 5, 5);
    expect(getCellVisibility(s2, 5, 5)).toBe("visible");
    const s3 = updateVisibility(s2, 20, 20);
    expect(getCellVisibility(s3, 5, 5)).toBe("explored");
    expect(getCellVisibility(s3, 20, 20)).toBe("visible");
  });

  it("explored cells stay explored when player moves away", () => {
    const s = createFogState(30, 30, 2);
    const s2 = updateVisibility(s, 5, 5);
    const s3 = updateVisibility(s2, 15, 15);
    const s4 = updateVisibility(s3, 25, 25);
    expect(getCellVisibility(s4, 5, 5)).toBe("explored");
    expect(getCellVisibility(s4, 15, 15)).toBe("explored");
    expect(getCellVisibility(s4, 25, 25)).toBe("visible");
  });

  it("does not modify the original state (immutability)", () => {
    const s = createFogState(10, 10, 2);
    const s2 = updateVisibility(s, 5, 5);
    expect(getCellVisibility(s, 5, 5)).toBe("hidden");
    expect(getCellVisibility(s2, 5, 5)).toBe("visible");
  });

  it("handles player at edge (0,0)", () => {
    const s = createFogState(10, 10, 3);
    const s2 = updateVisibility(s, 0, 0);
    expect(getCellVisibility(s2, 0, 0)).toBe("visible");
    expect(getCellVisibility(s2, 2, 2)).toBe("visible");
  });

  it("handles player at bottom-right edge", () => {
    const s = createFogState(10, 10, 2);
    const s2 = updateVisibility(s, 9, 9);
    expect(getCellVisibility(s2, 9, 9)).toBe("visible");
    expect(getCellVisibility(s2, 8, 9)).toBe("visible");
  });

  it("reveals circular area not square", () => {
    const s = createFogState(20, 20, 3);
    const s2 = updateVisibility(s, 10, 10);
    // Corner of bounding box (3,3 away diagonally = distance sqrt(18) > 3)
    expect(getCellVisibility(s2, 13, 13)).toBe("hidden");
    // But cells along axis within radius should be visible
    expect(getCellVisibility(s2, 13, 10)).toBe("visible");
  });

  it("revealRadius=0 reveals only the player cell", () => {
    const s = createFogState(10, 10, 0);
    const s2 = updateVisibility(s, 5, 5);
    expect(getCellVisibility(s2, 5, 5)).toBe("visible");
    expect(getCellVisibility(s2, 5, 6)).toBe("hidden");
    expect(getCellVisibility(s2, 6, 5)).toBe("hidden");
  });
});

// ════════════════════════════════════════════════════════════════
// § getCellVisibility
// ════════════════════════════════════════════════════════════════

describe("getCellVisibility", () => {
  it("returns hidden for unvisited cell", () => {
    const s = createFogState(5, 5);
    expect(getCellVisibility(s, 2, 2)).toBe("hidden");
  });

  it("returns hidden for out-of-bounds negative", () => {
    const s = createFogState(5, 5);
    expect(getCellVisibility(s, -1, 0)).toBe("hidden");
    expect(getCellVisibility(s, 0, -1)).toBe("hidden");
  });

  it("returns hidden for out-of-bounds positive", () => {
    const s = createFogState(5, 5);
    expect(getCellVisibility(s, 5, 0)).toBe("hidden");
    expect(getCellVisibility(s, 0, 5)).toBe("hidden");
  });

  it("returns visible after update", () => {
    const s = updateVisibility(createFogState(10, 10, 1), 5, 5);
    expect(getCellVisibility(s, 5, 5)).toBe("visible");
  });

  it("returns explored after player moves away", () => {
    let s = createFogState(20, 20, 1);
    s = updateVisibility(s, 5, 5);
    s = updateVisibility(s, 15, 15);
    expect(getCellVisibility(s, 5, 5)).toBe("explored");
  });
});

// ════════════════════════════════════════════════════════════════
// § getVisibleCells
// ════════════════════════════════════════════════════════════════

describe("getVisibleCells", () => {
  it("returns empty array for fresh state", () => {
    const s = createFogState(5, 5);
    expect(getVisibleCells(s)).toEqual([]);
  });

  it("returns cells after update", () => {
    const s = updateVisibility(createFogState(10, 10, 0), 3, 3);
    const cells = getVisibleCells(s);
    expect(cells.length).toBe(1);
    expect(cells[0]).toEqual({ x: 3, y: 3 });
  });

  it("does not include explored cells", () => {
    let s = createFogState(20, 20, 1);
    s = updateVisibility(s, 5, 5);
    s = updateVisibility(s, 15, 15);
    const cells = getVisibleCells(s);
    const hasOld = cells.some((c) => c.x === 5 && c.y === 5);
    expect(hasOld).toBe(false);
  });

  it("all returned cells have visible status", () => {
    const s = updateVisibility(createFogState(10, 10, 2), 5, 5);
    const cells = getVisibleCells(s);
    for (const c of cells) {
      expect(getCellVisibility(s, c.x, c.y)).toBe("visible");
    }
  });

  it("returns correct count for radius=1", () => {
    // radius=1 circle: center + 4 cardinal = 5 cells
    const s = updateVisibility(createFogState(10, 10, 1), 5, 5);
    const cells = getVisibleCells(s);
    expect(cells.length).toBe(5);
  });
});

// ════════════════════════════════════════════════════════════════
// § getExploredPercent
// ════════════════════════════════════════════════════════════════

describe("getExploredPercent", () => {
  it("returns 0 for fully hidden map", () => {
    const s = createFogState(10, 10);
    expect(getExploredPercent(s)).toBe(0);
  });

  it("returns 100 after revealAll", () => {
    const s = revealAll(createFogState(10, 10));
    expect(getExploredPercent(s)).toBe(100);
  });

  it("counts both visible and explored cells", () => {
    let s = createFogState(10, 10, 0);
    s = updateVisibility(s, 0, 0); // 1 visible
    s = updateVisibility(s, 1, 0); // (0,0) explored, (1,0) visible = 2 non-hidden
    expect(getExploredPercent(s)).toBe(2);
  });

  it("returns 0 for 0-size grid", () => {
    const s = createFogState(0, 0);
    expect(getExploredPercent(s)).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § isVisible
// ════════════════════════════════════════════════════════════════

describe("isVisible", () => {
  it("returns false for hidden cell", () => {
    const s = createFogState(5, 5);
    expect(isVisible(s, 2, 2)).toBe(false);
  });

  it("returns true for visible cell", () => {
    const s = updateVisibility(createFogState(10, 10, 1), 5, 5);
    expect(isVisible(s, 5, 5)).toBe(true);
  });

  it("returns false for explored cell", () => {
    let s = createFogState(20, 20, 1);
    s = updateVisibility(s, 5, 5);
    s = updateVisibility(s, 15, 15);
    expect(isVisible(s, 5, 5)).toBe(false);
  });

  it("returns false for out-of-bounds", () => {
    const s = createFogState(5, 5);
    expect(isVisible(s, -1, -1)).toBe(false);
    expect(isVisible(s, 10, 10)).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════
// § isExplored
// ════════════════════════════════════════════════════════════════

describe("isExplored", () => {
  it("returns false for hidden cell", () => {
    const s = createFogState(5, 5);
    expect(isExplored(s, 2, 2)).toBe(false);
  });

  it("returns true for visible cell", () => {
    const s = updateVisibility(createFogState(10, 10, 1), 5, 5);
    expect(isExplored(s, 5, 5)).toBe(true);
  });

  it("returns true for explored cell", () => {
    let s = createFogState(20, 20, 1);
    s = updateVisibility(s, 5, 5);
    s = updateVisibility(s, 15, 15);
    expect(isExplored(s, 5, 5)).toBe(true);
  });

  it("returns false for out-of-bounds", () => {
    const s = createFogState(5, 5);
    expect(isExplored(s, -1, 0)).toBe(false);
    expect(isExplored(s, 5, 5)).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════
// § revealArea
// ════════════════════════════════════════════════════════════════

describe("revealArea", () => {
  it("reveals a circular area", () => {
    const s = revealArea(createFogState(20, 20), 10, 10, 2);
    expect(getCellVisibility(s, 10, 10)).toBe("visible");
    expect(getCellVisibility(s, 11, 10)).toBe("visible");
    expect(getCellVisibility(s, 12, 10)).toBe("visible");
  });

  it("does not reveal outside radius", () => {
    const s = revealArea(createFogState(20, 20), 10, 10, 1);
    expect(getCellVisibility(s, 10, 10)).toBe("visible");
    // diagonal at sqrt(2) > 1
    expect(getCellVisibility(s, 11, 11)).toBe("hidden");
  });

  it("clamps to grid bounds", () => {
    const s = revealArea(createFogState(5, 5), 0, 0, 3);
    expect(getCellVisibility(s, 0, 0)).toBe("visible");
    expect(getCellVisibility(s, 2, 0)).toBe("visible");
    // No crash from negative indices
  });

  it("is immutable", () => {
    const s = createFogState(10, 10);
    const s2 = revealArea(s, 5, 5, 2);
    expect(getCellVisibility(s, 5, 5)).toBe("hidden");
    expect(getCellVisibility(s2, 5, 5)).toBe("visible");
  });

  it("stacks with existing visibility", () => {
    let s = createFogState(20, 20, 1);
    s = updateVisibility(s, 5, 5);
    s = revealArea(s, 10, 10, 1);
    expect(getCellVisibility(s, 5, 5)).toBe("visible");
    expect(getCellVisibility(s, 10, 10)).toBe("visible");
  });

  it("radius=0 reveals only center cell", () => {
    const s = revealArea(createFogState(10, 10), 5, 5, 0);
    expect(getCellVisibility(s, 5, 5)).toBe("visible");
    expect(getCellVisibility(s, 5, 6)).toBe("hidden");
  });
});

// ════════════════════════════════════════════════════════════════
// § hideAll
// ════════════════════════════════════════════════════════════════

describe("hideAll", () => {
  it("resets all cells to hidden", () => {
    let s = createFogState(10, 10, 3);
    s = updateVisibility(s, 5, 5);
    s = hideAll(s);
    expect(getExploredPercent(s)).toBe(0);
  });

  it("preserves dimensions and revealRadius", () => {
    const s = hideAll(createFogState(15, 20, 7));
    expect(s.width).toBe(15);
    expect(s.height).toBe(20);
    expect(s.revealRadius).toBe(7);
  });

  it("is immutable", () => {
    const s = revealAll(createFogState(5, 5));
    const s2 = hideAll(s);
    expect(getExploredPercent(s)).toBe(100);
    expect(getExploredPercent(s2)).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § revealAll
// ════════════════════════════════════════════════════════════════

describe("revealAll", () => {
  it("sets all cells to visible", () => {
    const s = revealAll(createFogState(5, 5));
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        expect(getCellVisibility(s, x, y)).toBe("visible");
      }
    }
  });

  it("returns 100% explored", () => {
    const s = revealAll(createFogState(10, 10));
    expect(getExploredPercent(s)).toBe(100);
  });

  it("preserves dimensions", () => {
    const s = revealAll(createFogState(7, 13, 4));
    expect(s.width).toBe(7);
    expect(s.height).toBe(13);
    expect(s.revealRadius).toBe(4);
  });

  it("is immutable", () => {
    const s = createFogState(5, 5);
    const s2 = revealAll(s);
    expect(getExploredPercent(s)).toBe(0);
    expect(getExploredPercent(s2)).toBe(100);
  });
});

// ════════════════════════════════════════════════════════════════
// § lineOfSight
// ════════════════════════════════════════════════════════════════

describe("lineOfSight", () => {
  it("returns true for single visible cell (start == end)", () => {
    const s = revealArea(createFogState(10, 10), 5, 5, 0);
    expect(lineOfSight(s, 5, 5, 5, 5)).toBe(true);
  });

  it("returns false if start cell is hidden", () => {
    const s = createFogState(10, 10);
    expect(lineOfSight(s, 0, 0, 5, 5)).toBe(false);
  });

  it("returns true for horizontal visible line", () => {
    const s = revealAll(createFogState(10, 10));
    expect(lineOfSight(s, 0, 5, 9, 5)).toBe(true);
  });

  it("returns true for vertical visible line", () => {
    const s = revealAll(createFogState(10, 10));
    expect(lineOfSight(s, 5, 0, 5, 9)).toBe(true);
  });

  it("returns true for diagonal visible line", () => {
    const s = revealAll(createFogState(10, 10));
    expect(lineOfSight(s, 0, 0, 9, 9)).toBe(true);
  });

  it("returns false when a cell in the middle is hidden", () => {
    let s = revealAll(createFogState(10, 10));
    // hide the middle cell by creating fresh state and selectively revealing
    s = createFogState(10, 1);
    // reveal all except cell (5,0)
    for (let x = 0; x < 10; x++) {
      if (x !== 5) {
        s = revealArea(s, x, 0, 0);
      }
    }
    expect(lineOfSight(s, 0, 0, 9, 0)).toBe(false);
  });

  it("returns false for out-of-bounds start", () => {
    const s = revealAll(createFogState(5, 5));
    expect(lineOfSight(s, -1, 0, 4, 4)).toBe(false);
  });

  it("handles line going right-to-left", () => {
    const s = revealAll(createFogState(10, 10));
    expect(lineOfSight(s, 9, 5, 0, 5)).toBe(true);
  });

  it("handles line going bottom-to-top", () => {
    const s = revealAll(createFogState(10, 10));
    expect(lineOfSight(s, 5, 9, 5, 0)).toBe(true);
  });

  it("returns false when end cell is hidden", () => {
    let s = createFogState(10, 1);
    for (let x = 0; x < 9; x++) {
      s = revealArea(s, x, 0, 0);
    }
    // cell (9,0) is still hidden
    expect(lineOfSight(s, 0, 0, 9, 0)).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════
// § Integration / Edge Cases
// ════════════════════════════════════════════════════════════════

describe("integration", () => {
  it("full workflow: create → update → move → check explored", () => {
    let s = createFogState(20, 20, 2);
    expect(getExploredPercent(s)).toBe(0);

    s = updateVisibility(s, 5, 5);
    const pct1 = getExploredPercent(s);
    expect(pct1).toBeGreaterThan(0);

    s = updateVisibility(s, 10, 10);
    const pct2 = getExploredPercent(s);
    expect(pct2).toBeGreaterThan(pct1);

    // original position should be explored not visible
    expect(isVisible(s, 5, 5)).toBe(false);
    expect(isExplored(s, 5, 5)).toBe(true);
  });

  it("hideAll then revealAll restores full visibility", () => {
    let s = createFogState(5, 5);
    s = updateVisibility(s, 2, 2);
    s = hideAll(s);
    expect(getExploredPercent(s)).toBe(0);
    s = revealAll(s);
    expect(getExploredPercent(s)).toBe(100);
  });

  it("revealArea does not demote existing visible cells", () => {
    let s = createFogState(20, 20, 2);
    s = updateVisibility(s, 5, 5);
    s = revealArea(s, 10, 10, 2);
    // Player area is still visible (not demoted to explored)
    expect(isVisible(s, 5, 5)).toBe(true);
  });

  it("lineOfSight works with updateVisibility-revealed cells", () => {
    let s = createFogState(10, 10, 5);
    s = updateVisibility(s, 5, 5);
    // Line within revealed area
    expect(lineOfSight(s, 3, 5, 7, 5)).toBe(true);
  });

  it("getVisibleCells count matches isVisible checks", () => {
    let s = createFogState(10, 10, 2);
    s = updateVisibility(s, 5, 5);
    const cells = getVisibleCells(s);
    let manualCount = 0;
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        if (isVisible(s, x, y)) manualCount++;
      }
    }
    expect(cells.length).toBe(manualCount);
  });
});
