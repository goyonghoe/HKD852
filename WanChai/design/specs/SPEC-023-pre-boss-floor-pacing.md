# [SPEC-023] Pre-Boss Floor Pacing -- L3 Node Type Redesign

## Meta
- **Author**: Game Designer
- **Date**: 2026-02-28
- **Status**: ready
- **Priority**: P0
- **Estimated Effort**: S

---

## CEO Feedback

> "마지막 스테이지가 휴식이면 뭐 어쩌라는거야? 보스가 나오던가 다음으로 넘어가야 하는거 아니야?"

## Problem Statement

With `FLOORS_PER_RUN: 1`, the player's run consists of:

```
Floor 1 (4 layers):
  L0: battle     -- start node
  L1: 2-3 nodes  -- branch (battle/event)
  L2: 2-3 nodes  -- branch (battle/elite)
  L3: 1 node     -- converge: REST (because floor 1 is odd)

Floor 2 (boss):
  L0: boss       -- single boss node
```

The player finishes Floor 1 on a rest node, then immediately enters a boss floor. From a pacing perspective, this creates an anticlimax: the final node before the climactic boss encounter is a passive "rest" that offers no dramatic tension.

---

## Analysis of Three Options

### Option A: Raise FLOORS_PER_RUN to 2

```
Floor 1: L0(battle) -> L1(branch) -> L2(branch) -> L3(rest)
Floor 2: L0(battle) -> L1(branch) -> L2(branch) -> L3(shop)
Floor 3: boss
```

**Pros:**
- Full 3-floor structure as originally designed in SPEC-011 (Floor 1 battle, Floor 2 elite, Floor 3 boss prep)
- Rest on F1-L3 is fine because there are still 2 more floors of content
- Shop on F2-L3 (even floor) gives a nice "gear up before the boss" moment
- More content per run = more decisions = more replayability

**Cons:**
- Run time nearly doubles (~10 min -> ~18 min per run)
- For early development/playtesting, longer runs slow down iteration cycles
- Increases total combat encounters before the player even reaches the boss, which can feel grindy if the puzzle variety is limited
- The CEO feedback is about the **pacing of the L3 node**, not the run length

**Verdict: NOT RECOMMENDED for current state.** The problem is pacing at the L3-to-boss boundary, not insufficient content. Raising FLOORS_PER_RUN is a valid future change (see "Future Considerations") but does not directly address the CEO's concern.

---

### Option B: Change pre-boss floor's L3 to 'elite' or 'battle'

Make the converge node (L3) of the floor immediately before the boss into a combat node instead of rest/shop.

```
Floor 1: L0(battle) -> L1(branch) -> L2(branch) -> L3(elite)
Floor 2: boss
```

**Pros:**
- Direct response to CEO feedback: the last thing the player does before the boss is a challenging fight
- Creates a "gauntlet" pacing: battle -> battle/elite -> battle/elite -> ELITE -> BOSS
- High tension, no lull before the climax

**Cons:**
- Removes the only rest/shop opportunity in the entire run when FLOORS_PER_RUN=1
- Player has zero recovery chance before the boss, making runs feel punishing
- Violates the roguelike I/O balance principle (Numerical Bible Section 5): the player's only economic input (shop) or health recovery (rest) is eliminated
- At FLOORS_PER_RUN=1, the player already has limited strategic decisions; removing the rest/shop further reduces decision space
- Breaks the counter-attribute pair: "bench recovery (rest)" counters "AP depletion across stages" -- without rest, there is no recovery mechanism before the boss

**Verdict: NOT RECOMMENDED.** Replacing the rest entirely removes a critical balancing mechanism. The problem is not that rest exists before the boss, but that the player does not *feel* like they are preparing for something.

---

### Option C (RECOMMENDED): Keep rest at L3 but rebrand as "Pre-Boss Preparation"

Keep the rest node before the boss floor, but change the UX framing so the player understands this is their **last chance to prepare before the boss fight**. Additionally, introduce a conditional L3 type rule.

#### Design: Hybrid Approach (C+)

The solution has two parts:

**Part 1: Pre-boss L3 type assignment rule change**

When a floor is the LAST floor before the boss (i.e., `floorNumber === FLOORS_PER_RUN`), the L3 converge node should ALWAYS be `rest`, regardless of odd/even parity. Rationale: the pre-boss rest is the player's final preparation point. Shop does not serve the same dramatic/mechanical purpose (it requires points, which the player may not have).

This is already the case when `FLOORS_PER_RUN=1` (floor 1 is odd = rest), but it formalizes the intent.

**Part 2: UX transformation of pre-boss rest**

When the rest node is on the floor immediately before the boss, the scene presentation changes:

| Aspect | Normal Rest | Pre-Boss Rest |
|--------|------------|---------------|
| Title | "Rest Site" | "Final Preparation" / "Boss Ahead" |
| Color theme | Green (calm) | Orange-red (urgency) |
| Flavor text | "A quiet place to rest." | "The boss lurks ahead. This is your last chance to prepare." |
| Options | Same 3 (Recover/Train/Scout) | Same 3 but Scout shows "BOSS" info instead |
| Visual | Ambient particles | Warning particles, boss silhouette hint |
| Music/SFX | Calm ambient | Tense ambient |
| Bottom bar | "Continue" | "Face the Boss" |
| Next floor preview | Not shown | Boss type teaser shown at top |

**Part 3: Map visualization enhancement**

On the RunMapScene, when the player can see the L3 rest node and the boss floor beyond, add visual cues:

- L3 rest node gets a **warning border** (orange glow instead of green)
- A visible connection line from L3 to the boss floor node (even though they are on different floors)
- Text label under L3 changes from "Rest" to "Rest (Boss Next)"

---

## Detailed Design

### 1. MapGenerator._assignNodeTypes Change

```
Current (line 197):
  const l3Type: NodeType = floorNumber % 2 === 1 ? 'rest' : 'shop';

Proposed:
  const isPreBossFloor = (floorNumber === ROGUELIKE.RUN.FLOORS_PER_RUN);
  const l3Type: NodeType = isPreBossFloor ? 'rest' : (floorNumber % 2 === 1 ? 'rest' : 'shop');
```

When `FLOORS_PER_RUN=1`, this changes nothing (floor 1 is already rest). When `FLOORS_PER_RUN=2`, the last floor (floor 2, even) would get rest instead of shop. When `FLOORS_PER_RUN=3`, floor 3 (odd) was already rest.

This ensures the pre-boss floor ALWAYS ends with rest regardless of future FLOORS_PER_RUN changes.

### 2. RestScene context-aware presentation

RestScene receives `runState` which contains `currentFloor` and `floorMaps`. By checking:

```
const isPreBossRest = (runState.currentFloor === ROGUELIKE.RUN.FLOORS_PER_RUN);
```

The scene can switch to the "Pre-Boss Preparation" visual treatment.

#### Pre-Boss Rest UI Layout (720x1280)

```
+-------------------------------------+ y=0
|  [!] BOSS APPROACHES                | y=50   (warning banner, red/orange)
|  Floor X -- Final Preparation        | y=105
+-------------------------------------+ y=140
|                                       |
|  +-------------------------------+   | y=310
|  |  [heart] Recover              |   |
|  |  Clear all exhaustion         |   |
|  +-------------------------------+   |
|                                       |
|  +-------------------------------+   | y=480
|  |  [star] Train                 |   |
|  |  +150 XP to one critter      |   |
|  +-------------------------------+   |
|                                       |
|  +-------------------------------+   | y=650
|  |  [eye] Scout Boss             |   |
|  |  Reveal boss type and stats   |   |
|  +-------------------------------+   |
|                                       |
|  [Result text area]                   | y=825
|                                       |
|  +=======================+           | y=1000
|  |   FACE THE BOSS  >>  |           | (primary button, red accent)
|  +=======================+           |
+-------------------------------------+ y=1280
```

### 3. Scout Option Enhancement for Pre-Boss

When `isPreBossRest === true` and the player chooses "Scout":

**Current behavior**: Shows next floor's L0 node types (just "boss").
**Enhanced behavior**: Shows boss name, element, and estimated difficulty tier.

This requires `RunManager.applyRest` to return richer `scoutInfo` when the next floor is a boss floor. Example:

```
scoutInfo: ["BOSS: Sentinel SCOUT-01", "Element: Dark", "Estimated: Hard"]
```

### 4. RunMapScene Pre-Boss Visualization

When rendering the last floor's L3 node, if `isPreBossFloor`:

- Node border color: orange (0xf0a040) instead of green (0x50c878)
- Node label: "Preparation" instead of "Rest"
- Add a faint dotted line from L3 to a small boss icon below the map (visual hint)

---

## Requirements

### Functional Requirements

- [ ] FR-01: Pre-boss floor's L3 node is always `rest` type, regardless of floor parity
- [ ] FR-02: RestScene detects `isPreBossRest` and applies alternate visual treatment (title, colors, button text)
- [ ] FR-03: Pre-boss Scout option returns enriched boss info (name, element, difficulty)
- [ ] FR-04: RunMapScene renders pre-boss rest node with warning visual treatment (orange border, "Boss Next" label)
- [ ] FR-05: Continue button on pre-boss RestScene reads "Face the Boss" instead of "Continue"

### Non-Functional Requirements

- [ ] NFR-01: No new scene required -- RestScene handles both modes via flag
- [ ] NFR-02: Visual changes are purely cosmetic; core rest mechanics (Recover/Train/Scout) remain identical
- [ ] NFR-03: Works correctly at any FLOORS_PER_RUN value (1, 2, 3, etc.)

---

## Technical Hints

- `src/core/MapGenerator.ts` line 197: L3 type assignment -- add `isPreBossFloor` check
- `src/scenes/RestScene.ts`: Read `runState.currentFloor === ROGUELIKE.RUN.FLOORS_PER_RUN` to toggle visual mode
- `src/scenes/RunMapScene.ts`: Conditional node rendering for pre-boss rest node
- `src/core/RunManager.ts` `applyRest`: Enhance scout return for boss floors
- `src/config/colors.ts`: Add `PRE_BOSS_WARNING` color constant if needed
- `src/config/roguelike-balance.ts`: No changes needed

---

## Test Criteria

- [ ] TC-01: At FLOORS_PER_RUN=1, Floor 1 L3 is always `rest`
- [ ] TC-02: At FLOORS_PER_RUN=2, Floor 2 L3 is `rest` (not `shop`, even though floor 2 is even)
- [ ] TC-03: At FLOORS_PER_RUN=3, Floor 3 L3 is `rest` (floor 3 is odd, already was rest)
- [ ] TC-04: Non-pre-boss floors retain existing odd=rest/even=shop behavior
- [ ] TC-05: RestScene pre-boss mode shows "Boss Ahead" title and red/orange theme
- [ ] TC-06: Scout in pre-boss rest returns boss info (not just "boss" string)
- [ ] TC-07: RunMapScene pre-boss L3 node shows orange warning border
- [ ] TC-08: Continue button text changes to "Face the Boss" on pre-boss rest

---

## Level Data Impact

- Schema changes: None
- Existing level migration: None
- `roguelike-balance.ts`: No value changes (FLOORS_PER_RUN stays at 1)

---

## Balance Parameters

| Parameter | Current | Proposed | Rationale |
|-----------|---------|----------|-----------|
| FLOORS_PER_RUN | 1 | 1 (no change) | Problem is pacing, not content length |
| Pre-boss L3 type | odd=rest, even=shop | always=rest | Ensure recovery before boss |
| Rest options | Recover/Train/Scout | Same | No mechanical change |
| Scout (pre-boss) | Shows node types | Shows boss details | Strategic information for preparation |

---

## Attribute Hierarchy Compliance (Numerical Bible Section 2)

No new attributes introduced. This spec modifies presentation and a single assignment rule.

## Counter-Attribute Analysis (Numerical Bible Section 8)

The existing counter-pair is preserved:

| Player Resource | System Pressure | Balance |
|----------------|-----------------|---------|
| Pre-boss rest (AP recovery, XP training) | Boss HP/ATK scaling | Rest gives the player tools to face the boss |
| Scout info (boss preview) | Boss surprise factor | Scouting costs the opportunity to Recover or Train |

The 3-way choice (Recover vs Train vs Scout) at the pre-boss rest creates a meaningful strategic decision: do you heal, invest in growth, or gather intelligence? This is amplified when the player knows the boss is next.

---

## Future Considerations

### FLOORS_PER_RUN Scaling Plan

When the game matures and content variety increases, consider this progression:

| Phase | FLOORS_PER_RUN | Run Time | L3 Pattern |
|-------|---------------|----------|------------|
| Current (alpha) | 1 | ~8 min | rest -> boss |
| Beta | 2 | ~16 min | rest -> shop(->rest per this spec) -> boss |
| Launch | 3 | ~24 min | rest -> shop -> rest -> boss |

At FLOORS_PER_RUN >= 2, the non-final floors retain odd=rest/even=shop, and the FINAL floor always gets rest per this spec. This provides a natural "rest -> boss" cadence regardless of run length.

### Boss Preview Teaser (deferred)

Consider a dedicated "Boss Warning" interstitial screen between the pre-boss rest and the boss floor. This would show:
- Boss model/silhouette with dramatic animation
- Boss name and element weakness hint
- "Entering Boss Territory..." with a tension-building countdown

This is deferred to a visual polish pass and does not block SPEC-023.

---

## Unresolved Items

- [ ] Q1: Should the pre-boss Scout option be free (no opportunity cost) to encourage boss preparation? Current design: no, it still costs the Recover/Train opportunity, which is the strategic tension.
- [ ] Q2: Should we add a 4th option specifically for pre-boss rest (e.g., "Analyze Boss" separate from Scout)? Current design: no, to avoid scope creep. Scout covers this.
