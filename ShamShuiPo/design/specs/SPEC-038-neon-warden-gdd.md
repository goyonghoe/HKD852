# SPEC-038: Neon Warden -- Full Game Design Document

> **Project**: ShamShuiPo
> **Version**: v1.0
> **Author**: Lead Game Designer (Opus 4.6)
> **Status**: CEO Review Pending
> **Date**: 2026-03-14
> **Prerequisite**: SPEC-037, vs-engine-dissection.md, selection-only-games-analysis.md, SPEC-035-redteam-selection-filter.md
> **CEO Directive**: "Selection ONLY. Zero dexterity. Focus on ANTICIPATION + SELECTION. NO clones."

---

## 1. CORE CONCEPT

### Elevator Pitch

You are the Warden of a crumbling Kowloon-inspired cyberpunk district. Creatures queue at your gate seeking entry. You choose who enters. Inside, they form a living ecosystem -- predators hunt, producers generate energy, symbiotes heal, parasites drain. The ecosystem auto-fights waves of external threats. Your only power is deciding who gets in. One bad admission and the whole thing collapses. One brilliant combination and the district becomes an unstoppable fortress. Ten minutes per run. Zero dexterity. Pure judgment.

### The Core Fantasy

**"I am the architect of a living world."**

The player feels like a gardener tending a terrarium -- except the terrarium fights back, surprises you, and sometimes explodes. The emotional arc is:

- Minutes 0-2: **Curiosity** -- "What happens if I let the wolf in with the rabbits?"
- Minutes 3-5: **Pride** -- "My food chain is working. The energy is flowing."
- Minutes 6-8: **Dread** -- "That merchant I admitted is actually a parasite. The system is tipping."
- Minutes 9-10: **Judgment Day** -- "One last arrival. If I'm right, everything holds. If I'm wrong, it all falls apart."

No other game delivers this arc. You don't build the fighters. You don't control the combat. You curate the conditions for life -- and life does the rest.

### Why This Has Never Been Done

Games have ecosystem sims (SimEarth, Ecosystem). Games have gatekeeping (Papers Please). Games have auto-battlers (TFT, SAP). But no game has fused these three ideas into a single mechanic: **curating a population to create a self-sustaining combat ecosystem in 10 minutes**. Papers Please checks documents. TFT drafts units for direct combat. Neon Warden makes you an ecologist -- your "army" is an ecosystem, and its combat power is an emergent property of biological balance.

The closest reference points and why they are fundamentally different:

| Game            | Key Difference                                                                                                                               |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Papers, Please  | PP checks documents against rules. Neon Warden curates populations for ecological balance. No documents, no bureaucratic rules.              |
| Super Auto Pets | SAP drafts pets for direct combat. Here, combat is a side effect of ecosystem health. You don't pick fighters -- you pick an ecology.        |
| Dwarf Fortress  | DF is a sprawling colony sim. This is a 10-minute curated ecosystem compressed into a roguelike session.                                     |
| Reus            | Reus places resources for civilizations at macro scale. This operates at the individual creature level with hidden information and betrayal. |

**Clone perception risk: VERY LOW.** "Ecosystem curation roguelike" is unprecedented.

### Target Audience Profile

| Segment                      | Description                                                             | Est. Share |
| ---------------------------- | ----------------------------------------------------------------------- | :--------: |
| Strategic commuters          | 20-minute sessions with depth, one-handed play on transit               |    40%     |
| Balatro/StS converts         | Proven appetite for selection-only roguelikes, looking for the next fix |    25%     |
| Idle game graduates          | Outgrown pure clickers, want meaningful decisions behind auto-combat    |    20%     |
| Board game / sim enthusiasts | Love systems thinking, want digital terrarium on mobile                 |    15%     |

**Demographics**: 18-35, skews slightly male (55/45), college-educated, enjoys strategy and systems. Plays 3-5 sessions/day at 10 minutes each.

**Primary markets**: NA > EU (strategic game culture). **Secondary**: KR > JP (mobile spending). **Tertiary**: CN (potential viral hit if "wet market ecology" resonates).

---

## 2. CORE LOOP (Minute-by-Minute)

### The Three-Phase Heartbeat

Every 60-90 seconds, the game cycles through three phases:

```
GATE PHASE (15-20s)      ECOSYSTEM PHASE (30-40s)       THREAT PHASE (15-20s)
[Select arrivals]   -->  [Watch ecosystem interact]  -->  [Watch defenses fight]
     |                         |                              |
  AGENCY                   ANTICIPATION                   PAYOFF
     |                         |                              |
"I chose this"          "Is it working?"              "It worked!/It broke!"
                                                            |
                                                     [Next Gate opens]
```

### Detailed 10-Minute Session Breakdown

**MINUTE 0:00 -- THE FIRST GATE**

The zone is empty. A crumbling neon archway frames the gate. Two arrivals wait outside:

- **Neon Rabbit** (Producer) -- Visible trait: generates 2 energy/cycle. Hidden trait: ???
- **Chrome Beetle** (Producer) -- Visible trait: generates 1 energy/cycle, reproduces. Hidden trait: ???

This is tutorial-simple. Both are producers. You admit one or both. The game teaches: "Producers make energy. Energy powers defenses."

Player action: Tap green to admit, red to reject. 2 decisions in ~8 seconds.

**MINUTE 1:00-2:00 -- GATES 2-3: THE FOOD CHAIN LESSON**

Gate 2 brings the first predator option alongside a producer:

- **Alley Cat** (Predator) -- Visible: eats small creatures, patrols zone. Hidden: ???
- **Glow Moss** (Producer) -- Visible: generates 1 energy, heals adjacent creatures. Hidden: ???
- **Wire Rat** (Producer) -- Visible: generates 1 energy, breeds fast. Hidden: ???

The player learns: predators eat producers. But predators also defend the zone from pests (small external threats that nibble energy generators). Too many producers with no predators = pests overrun. First real tradeoff.

Gate 3 introduces the first 3-option choice:

- A second predator (risk: will it eat everything?)
- A symbiote that boosts producers (safe but slow)
- A mystery arrival with 2 hidden traits (gamble)

**Feeling**: "I'm starting to understand the rules. The cat is keeping pests away but it ate one of my beetles..."

**MINUTE 2:00-3:00 -- GATE 4: THE FIRST BETRAYAL**

An arrival you admitted in Gate 2 reveals its hidden trait: **"Territorial -- attacks other creatures of the same role."** Your two producers start fighting each other. Energy generation drops. The first "oh no" moment.

Meanwhile, Gate 4 opens with a Symbiote option -- a creature that can calm territorial disputes. Do you admit it to fix the problem, or do you eject the territorial creature (costs energy) and keep the slot open?

**Feeling**: "That hidden trait screwed me. But I can fix this if I play smart."

**MINUTE 3:00-5:00 -- GATES 5-7: ECOSYSTEM COMPLEXITY PEAKS**

By Gate 5, the zone has 6-8 residents. The ecosystem is now a web of interactions:

```
Glow Moss (Producer) ---energy---> Central Reactor
     |                                    |
  heals                              powers
     |                                    v
Alley Cat (Predator) ---patrols---> Zone Perimeter
     |                                    ^
  hunts                              reinforces
     |                                    |
Wire Rat (Producer) ---breeds---> Population Growth
     ^                                    |
  feeds on                           attracts
     |                                    v
Neon Leech (Parasite!) ----drains----> Energy Pool
```

Gate 6 offers a **Catalyst** -- a rare creature that doesn't fit Producer/Predator/Symbiote/Parasite. It changes the rules: "All producers in my sector generate +50% energy but attract parasites from outside." Massive reward, massive risk.

Gate 7 is a **Smuggler** gate. All three arrivals have 2+ hidden traits. You're choosing nearly blind. But by now you've learned from previous hidden traits and can make educated guesses based on visual cues.

**Feeling**: "I've built something. It's alive. It's producing energy. But it feels fragile. One wrong admission..."

**MINUTE 5:00-7:00 -- GATES 8-10: THE EXTERNAL THREAT ESCALATES**

The zone's energy is powering perimeter defenses -- neon walls, automated turrets, barrier fields. External threats have been small (pest swarms, vagrant drones). Now they get serious:

- **Wave 3**: A Scrap Golem -- a mid-tier threat that tests your defense energy output.
- **Wave 4**: A Glitch Storm -- environmental hazard that disables electronic creatures for one cycle.

If your ecosystem is healthy, defenses shred the Scrap Golem and the Glitch Storm is weathered because your non-electronic producers compensate. If your ecosystem is imbalanced, the golem breaches the wall and kills a creature, destabilizing the food chain further.

Gate 9 brings a **Redirect** option for the first time: instead of Admit or Reject, you can Redirect an arrival to a different sector. This adds spatial strategy -- do you shore up the breached sector or build a new one?

**Feeling**: "The threats are getting real. My ecosystem held, but barely. I need more predators... but more predators might eat my producers..."

**MINUTE 7:00-9:00 -- GATES 11-13: THE REJECTED RETURN**

Here's the twist: arrivals you rejected in earlier gates have formed a hostile faction outside the walls. They attack alongside the regular threat waves. The more you rejected, the stronger this faction.

This retroactively adds weight to every previous rejection. "I rejected that Predator in Gate 3 because I had too many. Now it's attacking me."

Gate 12 offers a **Pardon** mechanic (unlocked via meta-progression): you can re-admit one rejected creature, but it arrives angry (-50% effectiveness for 2 cycles).

**Feeling**: "My past decisions are haunting me. The rejected are vengeful. Every rejection had a cost I didn't see."

**MINUTE 9:00-10:00 -- THE FINAL GATE**

One last arrival. It's powerful -- a Legendary creature with 3 visible traits and 3 hidden traits. It could be:

- A **Keystone Species** that doubles ecosystem energy output
- A **Super-Parasite** that drains energy faster than your entire ecosystem produces
- A **Transformer** that converts all creatures of one role to another

You have ~30% information. Your entire run comes down to this judgment call. The ecosystem health meter is at the center of the screen, pulsing. The final external threat -- a Boss -- is approaching.

Admit or reject?

**Feeling**: "Everything I've built is on the line. This is the most important decision of the run. I don't have enough information. I have to trust my gut."

### Session Pacing Graph (Tension Curve)

```
Tension
  10 |                                          *  Final Gate
     |                                     *  /
   8 |                              *     /  /
     |                         *  /  \  /  /
   6 |                    *  /      Rejected
     |              *   /     Return
   4 |         *  /  \/
     |    *  /  Betrayal
   2 | */
     |/   First Gate
   0 └──────────────────────────────────────────
     0    1    2    3    4    5    6    7    8    9   10  (minutes)

     [Gate]  [Eco]  [Threat]  [Gate]  [Eco]  [Threat] ...
```

The curve follows the VS Engine 1 pattern: weak start (low stakes, few creatures) --> crossing point at minutes 4-6 (ecosystem can go either way) --> climax at minutes 8-10 (final gate + boss + rejected return).

### The Selection Moment

Every gate presents **2-4 arrivals** (never more than 4 -- Hick's Law). For each arrival, the player chooses:

- **ADMIT** (tap green): The creature enters your zone. Costs 1 population slot.
- **REJECT** (tap red): The creature is turned away. Joins the Rejected faction (external threat later).
- **REDIRECT** (swipe to sector -- unlocked Wave 5+): Admit to a specific sector for placement bonus.

Max 3 meaningful decisions per gate. Avg decision time: 3-5 seconds per arrival. Total decision count per run: ~35-45 decisions across 13-15 gates.

### The Anticipation Phase

After each gate closes, the player watches for 30-40 seconds as:

1. New arrivals enter the zone and find their place in the ecosystem
2. Food chain interactions play out (predator chases prey, producer generates energy, symbiote heals)
3. Hidden traits reveal (1 per cycle, dramatic "!" reveal animation)
4. Energy flows visually from producers to the central reactor (glowing neon streams)
5. External threats approach and test defenses
6. Ecosystem health meter fluctuates in real-time

The player does **nothing** during this phase. They watch. They hope. They dread. This is the anticipation that CEO demanded.

### The Feedback Loop

After each Ecosystem + Threat phase, the player receives:

- **Ecosystem Health Update**: "Balanced / Tipping / Critical" with specific cause ("Too many predators in Sector A")
- **Energy Output**: Numerical + visual (reactor glow intensity)
- **Trait Journal**: Newly revealed hidden traits are logged for future runs (meta-knowledge)
- **Next Gate Preview**: Silhouettes of upcoming arrivals (partial info -- Rule 1)

This feeds the next gate decision: "I know I have too many predators. I need producers or a symbiote. But what if the next gate only offers predators?"

---

## 3. ECOSYSTEM MECHANICS

### 3.1 The Five Creature Roles

Every creature in Neon Warden belongs to one of five roles. Roles are not types -- a "Chrome Wolf" and a "Neon Mantis" are both Predators, but behave differently within the role.

#### PRODUCER (The Foundation)

**Function**: Generates energy. Energy powers zone defenses and is the primary resource.

**Behavior**: Producers sit in their territory, convert ambient neon energy into usable power, and feed energy to the central reactor. They are passive, vulnerable, and essential.

**Sub-variants**:
| Variant | Trait | Example |
|---------|-------|---------|
| Steady Producer | Consistent output, no variance | Glow Moss: 2 energy/cycle, always |
| Boom Producer | High output with rest cycles | Neon Fungus: 5 energy, then 0, then 5 |
| Breeding Producer | Low output but reproduces | Wire Rat: 1 energy, spawns copy every 3 cycles |
| Conditional Producer | High output when conditions met | Solar Jelly: 4 energy if adjacent to another Producer, else 1 |

**Ecosystem interaction**: Predators eat them. Parasites drain them. Symbionts buff them. Catalysts transform them.

#### PREDATOR (The Defender)

**Function**: Hunts pests/parasites, defends the zone perimeter, provides active protection.

**Behavior**: Predators patrol. They consume small creatures (pests from outside, parasites that sneak in). They also eat Producers if they run out of prey -- this is the core tension of admitting Predators.

**Sub-variants**:
| Variant | Trait | Example |
|---------|-------|---------|
| Specialist | Only hunts specific prey type | Alley Cat: hunts Vermin-class only |
| Generalist | Hunts anything smaller | Chrome Wolf: attacks any creature below 3 power |
| Apex | Hunts other Predators too | Neon Tiger: dominates all non-Apex creatures |
| Pack Hunter | Weak alone, devastating in groups | Circuit Hound: +100% per adjacent Pack Hunter |

**Ecosystem interaction**: Eats producers when hungry. Fights parasites. Ignores symbionts. Competes with other predators for territory.

#### SYMBIONT (The Multiplier)

**Function**: Enhances other creatures. Never produces energy directly, never fights directly. A force multiplier.

**Behavior**: Symbionts attach to or position near other creatures and amplify their function. A Symbiont next to a Producer increases energy output. A Symbiont next to a Predator increases patrol range.

**Sub-variants**:
| Variant | Trait | Example |
|---------|-------|---------|
| Healer | Restores damaged creatures | Medi-Moth: heals 1 HP/cycle to adjacent creatures |
| Booster | Amplifies primary function | Signal Vine: +50% output to adjacent Producer |
| Protector | Shields from predation | Shell Crab: makes adjacent creature un-huntable |
| Connector | Links distant creatures | Fiber Worm: two creatures it touches share buffs |

**Ecosystem interaction**: Enhances producers and predators. Multiple symbionts stack (diminishing returns). Vulnerable to parasites.

#### PARASITE (The Disruptor)

**Function**: Drains energy, weakens creatures, destabilizes the ecosystem. But parasites are not always bad -- some have powerful secondary effects.

**Behavior**: Parasites attach to other creatures and drain their output. A Parasite on a Producer reduces energy. A Parasite on a Predator slows its patrol. But some parasites have hidden benefits -- they might convert drained energy into a rare resource, or weaken a creature that was about to overpopulate.

**Sub-variants**:
| Variant | Trait | Example |
|---------|-------|---------|
| Energy Leech | Drains energy directly | Neon Leech: -2 energy/cycle from host |
| Saboteur | Reduces creature effectiveness | Glitch Bug: host creature operates at 50% |
| Converter | Drains one resource, produces another | Rust Moth: drains 2 energy, produces 1 rare catalyst |
| Timebomb | Dormant, then devastating | Spore Pod: harmless for 5 cycles, then infects all adjacent |

**The Parasite Gamble**: Some of the best runs involve intentionally admitting parasites for their hidden secondary effects. A Rust Moth drains energy but produces catalysts needed for Symbiont evolution. This creates an advanced strategy layer.

**Ecosystem interaction**: Drains producers, slows predators, corrupts symbionts. Predators can hunt parasites if they detect them.

#### CATALYST (The Wildcard)

**Function**: Changes the rules. Catalysts don't produce, hunt, heal, or drain -- they transform the ecosystem itself.

**Behavior**: Catalysts create zone-wide effects. They're rare (appear in ~30% of gates after minute 3). They're powerful and unpredictable.

**Sub-variants**:
| Variant | Trait | Example |
|---------|-------|---------|
| Mutator | Transforms creature roles | Prism Shard: converts 1 random Producer to Predator |
| Amplifier | Doubles a zone-wide effect | Resonance Crystal: all energy generation x2 for 3 cycles |
| Disruptor | Resets interactions | EMP Eel: all Predators stop hunting for 1 cycle |
| Fuser | Merges two creatures into one | Forge Spider: combines two adjacent creatures into a hybrid |

**Ecosystem interaction**: Catalysts are the "Joker cards" of the ecosystem. They create the "systemic surprise" moments that fuel Engine 3.

### 3.2 Ecosystem Interactions (The Food Web)

```
                    EXTERNAL THREATS
                         |
                    [Zone Defenses] <--- powered by ---+
                         |                              |
                    fight off                      ENERGY POOL
                         |                         ^    ^    ^
                    (breach = kill                  |    |    |
                     a creature)              +----+    |    +----+
                                              |         |         |
                                          PRODUCER  PRODUCER  PRODUCER
                                            ^  |      ^  |       |
                                            |  |      |  |       |
                                         buff  |   heals |    drains
                                            |  |      |  |       |
                                        SYMBIONT  SYMBIONT   PARASITE
                                                               ^
                                                               |
                                                            hunts
                                                               |
                                                          PREDATOR
                                                            ^  |
                                                            |  |
                                                         competes
                                                            |  |
                                                          PREDATOR
```

**Key Interactions**:

1. **Predator eats Producer**: When predators run out of pests/parasites, they target producers. Energy drops.
2. **Predator hunts Parasite**: Predators can detect and consume parasites, cleansing infected creatures.
3. **Symbiont buffs Producer**: Adjacency bonuses. Stacks up to 3x (diminishing: +50%, +30%, +15%).
4. **Parasite drains Producer**: Attached parasite reduces energy output. Spreads to adjacent creatures at 20%/cycle.
5. **Catalyst transforms**: Each catalyst has a unique zone-wide effect. Effects can chain (Mutator converts Producer to Predator, new Predator hunts existing Producer).
6. **Overcrowding**: Zone has a soft cap of 12 creatures and hard cap of 20. Beyond 12, all creatures get -10% effectiveness per extra creature. Beyond 20, no more admissions.
7. **Starvation cascade**: If producers drop below 30% of population, energy dips below defense threshold, walls weaken, external threats breach, breach kills a creature, further destabilizing the ecosystem.

### 3.3 Ecosystem Health and Combat Power

**Ecosystem Health** is a single 0-100 meter derived from:

| Factor                                       | Weight | Healthy                  | Critical                  |
| -------------------------------------------- | :----: | ------------------------ | ------------------------- |
| Role diversity (all 5 roles present)         |  30%   | 4-5 roles present        | 1-2 roles only            |
| Energy surplus (output > defense cost)       |  25%   | 150%+ of defense cost    | Below 80%                 |
| Population stability (no starvation cascade) |  25%   | All creatures fed        | 3+ creatures starving     |
| Symbiosis ratio (symbiont:host balance)      |  10%   | 1 symbiont per 2-3 hosts | 0 symbionts or >1:1 ratio |
| Parasite load (% of creatures infected)      |  10%   | <20% infected            | >50% infected             |

**Health --> Combat Power mapping**:

```
Health 80-100: "Thriving"  --> Defenses at 150% power. Auto-repair walls. Bonus energy overflow.
Health 60-79:  "Stable"    --> Defenses at 100% power. Normal operation.
Health 40-59:  "Stressed"  --> Defenses at 75% power. Occasional breaches.
Health 20-39:  "Tipping"   --> Defenses at 50% power. Frequent breaches. Creature deaths.
Health 0-19:   "Collapse"  --> Defenses at 25% power. Cascade failure imminent.
Health 0:      "RUN OVER"  --> Zone falls. All creatures scatter. Score tallied.
```

### 3.4 The Tipping Point Mechanic

The ecosystem has two stable states and one unstable zone:

```
SELF-SUSTAINING (Health 60+)         UNSTABLE (Health 30-60)         COLLAPSE (Health <30)
   Positive feedback loop:             Could go either way:           Negative feedback loop:
   Producers thrive -->                One bad admission -->           Producers die -->
   Energy surplus -->                  Or one lucky catalyst -->       Energy deficit -->
   Strong defenses -->                 Tips to sustaining              Walls breach -->
   No breaches -->                     or collapse                     Creatures die -->
   Producers safe -->                                                  More producers die -->
   More energy -->                                                     Total collapse
   LOOP CONTINUES                                                      LOOP CONTINUES
```

**The "45-60 Health" corridor** is the game's emotional heart. This is where every decision matters most. One good Symbiont tips you to self-sustaining. One hidden Parasite tips you to collapse. This is VS Engine 1's "crossing point" -- maximum tension.

**Player agency in the tipping zone**: The player can issue an **Emergency Edict** (1 per run, 2 with meta-upgrade) that directly intervenes:

- **Curfew**: All Predators stop hunting for 2 cycles (saves Producers)
- **Harvest**: All Producers generate 2x for 1 cycle (energy spike)
- **Purge**: Eject the lowest-contribution creature (opens a population slot)
- **Quarantine**: Isolate all Parasites for 2 cycles (stops spread)

### 3.5 Balance: Preventing Dominant Strategies

**"Why can't I always pick Predators?"**

| Dominant Strategy Attempt | Counter-Mechanic                                                                                                            |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| All Predators             | Predators eat each other when no prey exists. Energy generation drops to 0. Defenses fail.                                  |
| All Producers             | No predator defense against pests. Pest swarms consume 30% of producers per wave. Parasites unchecked.                      |
| All Symbionts             | Symbionts with nothing to buff are useless. 0 energy generation. Instant collapse.                                          |
| Only Specialists          | External threats diversify over time. Specialist predators can't handle wave variety.                                       |
| Reject Everyone           | Rejected faction grows massive. Attacks overwhelm even strong ecosystems. Also, 0 energy.                                   |
| Admit Everyone            | Overcrowding penalty kicks in at 12+. All creatures at reduced effectiveness. Parasites spread faster in dense populations. |

**The Ideal Ratio Shifts**: The "optimal" population mix changes every run because:

1. Arrival pool is randomized -- you can't guarantee ideal composition
2. Hidden traits alter creature behavior -- a "Producer" with "Territorial" trait is half-useless
3. External threats demand different responses -- Glitch Storm punishes electronic creatures, Fire Wave punishes organic ones
4. Boss abilities specifically counter common strategies (the "Meta-Breaker Boss")

### 3.6 Emergent Behavior Examples

**Scenario 1: "The Accidental Garden"**

You admit three Breeding Producers because nothing else shows up. They reproduce. Now you have 8 producers and 0 predators. Pests swarm. You're about to lose. Then Gate 7 offers a single Apex Predator. You admit it. It kills all pests in one cycle. But then it starts eating your producers. Tension: will the predator eat them all, or will the producers breed fast enough to sustain themselves and the predator? A race between reproduction rate and consumption rate plays out in real-time. You watch, helpless.

**Scenario 2: "The Parasite Savior"**

Your ecosystem is overrun with Predators (you got unlucky with arrivals). Predators are fighting each other, killing your producers, energy is crashing. Gate 9 offers a Parasite -- normally terrible. But this Parasite's hidden trait is "Pacifier: infected predators stop hunting." You admit the Parasite intentionally. It infects your predators, they stop fighting, your remaining producers stabilize. You sacrificed efficiency for survival. The Parasite saved your run.

**Scenario 3: "The Chain Reaction Extinction"**

You admit a Catalyst (Mutator type) that converts a random Producer to a Predator. Unfortunately, it converts your only Conditional Producer -- the one that was generating 4 energy because it was adjacent to another Producer. Now that adjacent Producer loses its bonus (no longer adjacent to a Producer). Energy drops. The new Predator eats a Symbiont. The Symbiont was boosting another Producer. That Producer's output halves. Two cascading failures from one Catalyst admission. Your ecosystem drops from "Stable" to "Tipping" in one cycle.

**Scenario 4: "The Rejected Ally"**

You rejected a powerful Predator in Gate 4 because you had too many. In Gate 11, the Rejected faction attacks -- and that Predator is leading them. It's now hostile with +50% power. Your defenses hold, barely. Then Gate 13 offers the Pardon mechanic. You pardon that same Predator, re-admitting it. It arrives angry but still fights for you. It single-handedly clears the remaining Rejected faction -- the creatures it was leading -- and becomes your strongest defender. Narrative: the prodigal predator returns.

**Scenario 5: "The Symbiont Superconductor"**

You discover (through meta-knowledge from previous runs) that placing 3 Connector Symbionts in a triangle creates a "Superconductor Network" -- all creatures within the triangle get +100% effectiveness. You spend 5 gates carefully positioning this triangle. When it activates at minute 7, your energy output triples, your predators become unstoppable, and the boss at minute 9 melts in seconds. You achieved this through knowledge accumulated over 20+ runs. This moment is Engine 5 (Cumulative Mastery) at its finest.

---

## 4. THE GATE MECHANIC (Core Selection)

### 4.1 How Arrivals Are Presented

Each gate opening shows 2-5 arrival cards arranged horizontally at the bottom of the screen. Each card is a **creature silhouette** (neon outline, role color-coded) with:

```
┌─────────────────────┐
│  [Neon Silhouette]  │
│                     │
│  Chrome Wolf        │
│  Role: PREDATOR     │
│  ─────────────────  │
│  Hunts: Small prey  │
│  Power: 3           │
│  ─────────────────  │
│  Trait 1: Pack Bond │
│  Trait 2: ???       │
│                     │
│  [ADMIT] [REJECT]   │
└─────────────────────┘
```

### 4.2 Information Hierarchy (Partial Info -- Rule 1)

Every arrival has 2-4 traits. The player sees:

| Run Phase   | Visible Traits | Hidden Traits |      Info Ratio       |
| ----------- | :------------: | :-----------: | :-------------------: |
| Gates 1-3   |       2        |      0-1      |        70-100%        |
| Gates 4-7   |       2        |      1-2      |        50-70%         |
| Gates 8-10  |      1-2       |      2-3      |        30-50%         |
| Gates 11-13 |       1        |      2-3      |        25-40%         |
| Final Gate  |       3        |       3       | 50% (but high-impact) |

**Visual hints for hidden traits**: Hidden traits are shown as "???" but with subtle color tints:

- Red tint ??? = likely negative trait
- Green tint ??? = likely positive trait
- Gold tint ??? = rare/powerful (could be either)
- No tint ??? = truly unknown

These hints are ~70% accurate, creating a "probability reading" skill that rewards experienced players.

### 4.3 The Accept/Reject/Redirect Decision

**ADMIT (tap green / swipe right)**: Creature enters the zone. Placed in the default sector (or player-chosen sector if Redirect is unlocked). Consumes 1 population slot. Irreversible (ejection costs 3 energy).

**REJECT (tap red / swipe left)**: Creature is turned away. Joins the Rejected faction outside the walls. Will return as a hostile in late-game waves. Rejection is free but has delayed consequences.

**REDIRECT (swipe to sector -- unlocked at Gate 5)**: A more precise admission. The player chooses which sector the creature enters. Sectors have environmental properties:

| Sector        | Bonus                        | Visual Theme                   |
| ------------- | ---------------------------- | ------------------------------ |
| Neon Garden   | Producers +30% energy        | Glowing plants, vertical farms |
| Dark Alley    | Predators +30% hunt range    | Shadows, flickering signs      |
| Market Square | Symbionts affect +1 adjacent | Stalls, crowds, neon signs     |
| Reactor Core  | Catalysts effect +50%        | Humming machinery, energy arcs |

### 4.4 Queue Pressure

**What happens if you take too long?**

Each gate has a 15-second decision window per arrival. If the timer expires:

- **Auto-Reject**: The creature is rejected by default (joins hostile faction)
- **Queue Overflow**: If 3+ creatures are auto-rejected in a single gate, a "Queue Riot" triggers -- all rejected creatures attack immediately instead of waiting for late-game waves

This prevents analysis paralysis while maintaining the "consequences of inaction" theme. The timer is generous enough for thoughtful play (3-5 seconds per creature is comfortable) but prevents infinite deliberation.

**Timer visual**: A neon line depleting under each creature card. Audio: ticking clock that speeds up in final 3 seconds.

### 4.5 The Smuggler Mechanic

**Smugglers** are special arrivals that appear starting at Gate 4. They have:

- 1 visible trait that looks desirable (e.g., "Producer: 5 energy/cycle" -- very high)
- 2-3 hidden traits that are often (but not always) negative
- A distinct visual tell: their neon silhouette flickers slightly

**The gamble**: Smugglers offer high visible rewards. But they might be:

- A **Mole**: Secretly a Parasite disguised as a Producer. Drains instead of generating.
- A **Sleeper Agent**: Normal for 3 cycles, then activates a devastating hidden ability.
- A **Double Agent**: Actually has amazing hidden traits. The flicker was just cosmetic.
- A **Carrier**: Brings a dormant disease that infects adjacent creatures after 2 cycles.

Over many runs, players learn Smuggler patterns. Certain visual cues (flicker frequency, silhouette shape details, trait phrasing) become readable. This is Engine 5 -- knowledge as progression.

**Smuggler frequency**: ~1 per gate from Gate 4 onward. ~30% are genuinely beneficial (excellent hidden traits). ~50% are harmful. ~20% are mixed (one great trait, one terrible trait).

### 4.6 Arrivals Per Wave, Per Run

| Wave      | Gates  | Arrivals/Gate | Total Arrivals | Total Decisions |
| --------- | :----: | :-----------: | :------------: | :-------------: |
| 1         |   1    |       2       |       2        |        2        |
| 2         |  2-3   |      2-3      |      4-9       |       4-9       |
| 3         |  4-5   |       3       |       6        |        6        |
| 4         |  6-7   |      3-4      |      6-8       |       6-8       |
| 5         |  8-10  |      3-4      |      9-12      |      9-12       |
| 6         | 11-13  |      3-4      |      9-12      |      9-12       |
| Final     |   14   |       1       |       1        |        1        |
| **Total** | **14** |      --       |   **37-50**    |    **37-50**    |

Average: ~40 admission decisions per 10-minute run. ~1 decision every 15 seconds. But decisions cluster in gate phases, with 30-40 second anticipation gaps between gates.

---

## 5. THREAT SYSTEM

### 5.1 External Threats

External threats approach the zone perimeter in waves. They are NOT player-controlled -- defenses handle them automatically based on ecosystem energy output.

**Threat Types**:

| Tier | Threat             | Description                                                                         | Appears     |
| ---- | ------------------ | ----------------------------------------------------------------------------------- | ----------- |
| 1    | Pest Swarm         | Tiny creatures that nibble producers. Easy for predators to handle.                 | Minute 0-3  |
| 1    | Scrap Drone        | Automated probe. Low HP. Tests basic defenses.                                      | Minute 1-4  |
| 2    | Scrap Golem        | Mid-tier bruiser. Requires sustained defense energy to repel.                       | Minute 3-6  |
| 2    | Glitch Storm       | Environmental. Disables electronic creatures for 1 cycle.                           | Minute 4-7  |
| 3    | Neon Wraith        | Phase-shifts through walls. Only predators can engage directly.                     | Minute 5-8  |
| 3    | Acid Rain          | Environmental. Damages organic creatures. Electronic immune.                        | Minute 6-9  |
| 4    | Rejected Faction   | Your rejected arrivals, hostile and vengeful. Strength scales with rejection count. | Minute 7-9  |
| BOSS | Zone-specific Boss | Unique per district. Has ability that counters common strategies.                   | Minute 9-10 |

### 5.2 Internal Threats

| Threat               | Cause                                              | Consequence                                                                                                        |
| -------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Starvation Cascade   | Producers < 30% population                         | Energy deficit --> defense failure --> creature death --> more deficit                                             |
| Territorial War      | 2+ Predators with Territorial trait in same sector | Predators fight each other, ignoring external threats                                                              |
| Parasite Epidemic    | Parasite infects 3+ creatures                      | Spreads to all adjacent at 20%/cycle. Energy drains accelerate.                                                    |
| Overcrowding         | Population > 12 (soft cap)                         | All creatures -10% effectiveness per excess creature                                                               |
| Monoculture Collapse | >70% of population is one role                     | Specialized threat targets that role (pest swarm if too many producers, anti-predator toxin if too many predators) |

### 5.3 How the Ecosystem Auto-Resolves Combat

The player watches. This is what they see:

1. **Threat approach**: Red shapes move toward the zone perimeter from the edges of the screen. Threat icons show type and intensity.

2. **Defense activation**: The zone's neon walls glow brighter. Energy streams from the reactor to defense nodes. Automated turrets (powered by energy) fire neon projectiles at approaching threats.

3. **Predator engagement**: If threats breach the wall or are phase-type (Wraiths), Predators within range engage. Predators dash toward threats, attack animations play, damage numbers pop.

4. **Ecosystem strain**: During combat, energy is consumed by defenses. The energy meter drops. Producers work harder (glow brighter). Symbionts buff nearby combatants (heal particles flow). The entire zone reacts as a living system.

5. **Resolution**: Threat repelled (celebration glow) or wall breached (alarm, a creature dies, ecosystem destabilizes).

**Visual clarity**: Each interaction has a distinct visual signature. Energy is cyan streams. Predator attacks are orange slashes. Symbiont heals are green pulses. Parasite drain is purple siphon. Even at peak complexity (20 creatures + boss), the player can read ecosystem health through ambient zone glow color (bright cyan = healthy, amber = stressed, red = critical).

### 5.4 Boss Encounters

Bosses appear at minute 9. Each boss specifically challenges ecosystem strategies:

| Boss                     | Ability                                                          | Strategy Counter                                                                     |
| ------------------------ | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **The Harvester**        | Captures 1 creature per cycle (removes from ecosystem)           | Forces player to have redundant creatures -- can't rely on a single keystone         |
| **The Mimic**            | Copies the most common role in your zone and uses it against you | Punishes monoculture. Rewards diverse ecosystems                                     |
| **The Null Field**       | Creates a zone where Symbionts are disabled                      | Forces predator-heavy defense. Symbiont-reliant builds collapse                      |
| **The Incubator**        | Converts killed threats into Parasites that enter your zone      | Winning fights creates new problems. Energy-efficient kills are better than overkill |
| **The Resonance Engine** | Gets stronger every cycle the fight continues                    | Forces burst damage ecosystem. Slow-but-steady builds lose to this boss              |
| **The Exile King**       | Powered by your Rejected faction (more rejections = stronger)    | Retroactive punishment for aggressive rejection. Merciful wardens have an edge       |

### 5.5 The Collapse Condition

The run ends when **Ecosystem Health reaches 0**. This happens through:

1. **Defense failure cascade**: Energy < defense cost --> walls breach --> creatures die --> energy drops more --> complete collapse in 2-3 cycles.
2. **Population extinction**: All creatures die or are captured. Zone is empty.
3. **Boss overwhelm**: Boss kills creatures faster than ecosystem can sustain.

The collapse is **dramatic, not instant**. The player watches the zone dim, creatures scatter, neon signs flicker off, and the zone goes dark. This 5-second "death animation" serves as emotional punctuation -- VS Engine 1's ending.

The run also ends successfully if the player survives the Boss (minute 10). Score is tallied based on ecosystem health, energy produced, creatures saved, threats repelled, and hidden traits discovered.

---

## 6. META-PROGRESSION (Between Runs)

### 6.1 What Carries Over

**Nothing carries over that makes the next run easier mechanically.** VS Engine 5 principle: quality unlocks, not quantity boosts.

What carries over:

| Progression                 | Type                 | Effect                                                                                                                            |
| --------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Species Codex**           | Knowledge            | Previously discovered hidden traits are cataloged. Next time you see "Chrome Wolf," you know its hidden trait pool.               |
| **Gate Upgrades**           | Options              | Unlock new gate abilities: Redirect (sector placement), Pardon (re-admit rejected), Scan (reveal 1 hidden trait before deciding). |
| **District Layouts**        | Variety              | New sector configurations with different environmental bonuses.                                                                   |
| **Creature Pool Expansion** | Content              | New creature types unlock (start with 15, expand to 60+).                                                                         |
| **Edict Library**           | Tools                | Unlock new Emergency Edicts beyond the starting 4.                                                                                |
| **Warden Titles**           | Cosmetic + challenge | Achievement-based titles that unlock challenge modifiers.                                                                         |

### 6.2 Unlock System

**Creature Unlocks**: New creatures unlock by achieving specific ecosystem states:

- "Sustain an ecosystem with 5+ producers for 3 waves" --> Unlocks **Solar Jelly** (Conditional Producer)
- "Have a Predator kill 10+ parasites in one run" --> Unlocks **Neon Tiger** (Apex Predator)
- "Complete a run with 0 rejections" --> Unlocks **The Peacekeeper** (Legendary Symbiont)
- "Survive the Exile King boss" --> Unlocks **The Defector** (Rejected creature that can be admitted as a double agent)

**Gate Upgrades**: Unlock via cumulative runs:

| Upgrade      | Unlock Condition          | Effect                                                    |
| ------------ | ------------------------- | --------------------------------------------------------- |
| Redirect     | Complete 5 runs           | Place admitted creatures in specific sectors              |
| Scan         | Discover 20 hidden traits | Reveal 1 hidden trait per gate before deciding            |
| Pardon       | Reject 50 total creatures | Re-admit 1 rejected creature per run                      |
| Double Gate  | Complete 15 runs          | Occasionally get 2 gate phases in a row (strategic burst) |
| Warden's Eye | Discover 40 hidden traits | Smuggler visual tells become more distinct                |

**District Layouts**: Each layout changes the sector map, adding strategic variety:

- **Standard District**: 4 sectors, balanced bonuses
- **Vertical Stack**: 3 stacked sectors, adjacency bonuses are vertical
- **Hexagonal Quarter**: 6 small sectors, more placement precision
- **The Corridor**: 2 long sectors, creatures in a line (adjacency chain-focused)
- **Kowloon Maze**: Randomized sector connections each run (chaos mode)

### 6.3 Species Codex (Knowledge as Progression)

The Species Codex is the game's primary meta-progression system. It makes **knowledge the most valuable currency**.

**How it works**:

1. First time you encounter "Chrome Wolf," its hidden trait pool is completely unknown.
2. You admit a Chrome Wolf. Its hidden trait reveals: "Territorial."
3. The Codex records: "Chrome Wolf -- Known trait: Territorial (1/3 discovered)."
4. Next run, when Chrome Wolf appears at the gate, you see: "Known traits: Territorial (33%). Unknown traits: 2."
5. Over many runs, you discover all 3 possible hidden traits for Chrome Wolf. The Codex shows them all with probabilities.

**Codex progression curve**:

| Runs  | Codex Completion | Player Knowledge                                                                  |
| :---: | :--------------: | --------------------------------------------------------------------------------- |
|  1-5  |      5-10%       | Constantly surprised by hidden traits                                             |
| 10-20 |      20-35%      | Starting to predict common creatures                                              |
| 30-50 |      50-70%      | Expert-level trait prediction for common creatures. New creatures still surprise. |
| 100+  |      80-95%      | Near-complete knowledge. New unlocked creatures provide fresh unknowns.           |

**The Codex creates VS Engine 5's "qualitative unlock" effect**: run #1 and run #50 feel completely different not because the player is stronger, but because the player is wiser.

### 6.4 Mastery System

**Ecosystem Mastery Tracks** reward expertise in specific strategies:

| Mastery Track      | Condition                                                | Reward                                            |
| ------------------ | -------------------------------------------------------- | ------------------------------------------------- |
| Producer Whisperer | Generate 500+ total energy across runs                   | Start with 1 pre-placed Producer                  |
| Apex Guardian      | Kill 100+ threats with Predators                         | Predators gain +10% patrol range                  |
| Symbiosis Expert   | Create 50+ Symbiont connections                          | Symbionts affect +1 adjacent slot                 |
| Parasite Handler   | Intentionally admit 30+ parasites that benefited the run | Parasites' hidden positive traits revealed sooner |
| Catalyst Pioneer   | Discover 20+ unique Catalyst interactions                | Catalysts appear 15% more often in arrivals       |

Mastery rewards are **subtle, not game-breaking** -- they nudge, not carry. A +10% patrol range is helpful but never mandatory.

---

## 7. VS ENGINE INTEGRATION

### 7.1 E1: Compressed Hero's Journey

**Minute-by-minute emotional arc**:

```
POWER ▲
      │                                          ╱ Ecosystem output
      │                                    ╱   ╱
      │                              ╱   ╱  ╱
      │                        ╱   ╱  ╱  (if balanced)
      │                  ╱   ╱  ✕ ← CROSSING POINT (min 4-6)
      │            ╱   ╱  ╱
      │      ╱   ╱  ╱
      │╱   ╱  ╱  ╱ Threat intensity
      └──────────────────────────────────────→ TIME
           2    4    6    8    10
```

**0-2 min (Survival)**: 2-4 creatures. Simple ecosystem. Low energy. Player learning the rules. First pest swarm is alarming ("my wall almost broke!"). Emotion: vulnerability, curiosity.

**3-5 min (Crossing Point)**: 6-10 creatures. First hidden trait betrayal. Energy oscillates between surplus and deficit. One good Symbiont tips to stability; one Parasite tips to crisis. This is the "near-miss zone" where dopamine doubles (danger recognition + danger avoidance). Emotion: tension, ownership ("this is MY ecosystem").

**6-8 min (Power Fantasy or Death Spiral)**: If balanced: 12-16 creatures, energy overflows, defenses crush threats, zone glows brilliant. If imbalanced: creatures dying, energy crashing, desperate Edict usage. Either way, emotion is intense. Good ecosystem: pride, flow. Bad ecosystem: dread, scramble.

**9-10 min (Climax)**: Boss + Rejected faction + Final Gate arrival. The entire run converges. A thriving ecosystem detonates the boss in a visual spectacle (Engine 4 payoff). A struggling ecosystem makes the Final Gate decision a genuine "life or death" moment. Emotion: climactic tension, then either triumph or dramatic collapse.

### 7.2 E2: Controlled Randomness

**What's random**:

- Which creatures appear at each gate (from the unlocked pool)
- Hidden trait assignment (from each creature's trait pool)
- External threat type/timing within the wave
- Catalyst effects (from the Catalyst's effect pool)

**What's player-controlled**:

- Which creatures to admit/reject (100% player choice)
- Sector placement (when Redirect is unlocked)
- Emergency Edict timing and type
- When to use Scan (reveal hidden trait before deciding)

**The ratio**: ~60% of outcome is determined by player decisions, ~40% by randomness. This matches the VS sweet spot where players feel responsible for success ("my ecosystem design was brilliant") and can externalize failure ("the arrivals were terrible this run, I'll do better next time").

**Variable ratio reward schedule**: Energy generation, creature interactions, and hidden trait reveals all occur at irregular intervals. The player never knows exactly when the next "big moment" will happen -- will the Smuggler's hidden trait be amazing or devastating? Will the Catalyst chain into something incredible? This unpredictability sustains attention between decision points.

### 7.3 E3: Systemic Surprise (10+ Emergent Scenarios)

1. **The Accidental Garden** (see 3.6 above) -- Breeding Producers overwhelm, then Apex Predator creates equilibrium race
2. **The Parasite Savior** (see 3.6) -- Intentional parasite admission pacifies warring predators
3. **The Chain Reaction Extinction** (see 3.6) -- Catalyst triggers cascade of failures
4. **The Rejected Ally** (see 3.6) -- Pardoned rejected creature leads defense
5. **The Symbiont Superconductor** (see 3.6) -- Triangle of Connectors creates super-zone
6. **The Double Agent Jackpot**: Smuggler reveals hidden trait "Loyalty: converts all parasites in sector to producers." Your parasite-ridden zone is cleansed in one cycle.
7. **The Predator Civil War**: Two Apex Predators in the same sector trigger a dominance fight. Loser is ejected. Winner gets +100% power. You deliberately admit a second Apex to force this gamble.
8. **The Ecosystem Fork**: A Mutator Catalyst gives you a choice (rare variant): "Convert all Producers to Symbionts OR all Symbionts to Producers?" This single decision reshapes your entire ecosystem in one moment.
9. **The Perfect Storm**: Glitch Storm disables electronic creatures + Fire Wave damages organic ones at the same time. Only hybrid creatures (rare, from Catalyst fusion) survive unscathed. The player who happened to have fused two creatures is the only one who can weather this.
10. **The Self-Healing Collapse**: Ecosystem health drops to 15 (near-death). A Breeding Producer reproduces. The offspring is placed next to a Symbiont (random placement). Symbiont boosts the offspring. Offspring generates enough energy to repair one wall segment. Wall holds against the next threat. Health climbs to 25, then 35. The ecosystem saved itself while the player watched helplessly.
11. **The Legendary Migration**: If you admit 3+ creatures of the same species, they form a "colony" with a unique bonus. Colony of Wire Rats: energy output per rat triples. But if a predator eats one, all colony rats panic and stop producing for 2 cycles.
12. **The Spy Network**: Admit 2+ Mole-type Smugglers. Instead of draining individually, they link up and drain your entire energy pool simultaneously. But if you also have a Predator with "Investigator" trait, it detects and eliminates the network, and you gain a permanent +20% spy detection bonus for the run.

### 7.4 E4: Sensory Saturation

**Minute 1 screen state**:

```
┌─────────────────────────────┐
│                             │
│  Dim zone. 2 creatures      │
│  moving slowly. Faint       │
│  neon glow. Quiet hum.      │
│  One energy stream to       │
│  reactor. Minimal.          │
│                             │
│                             │
├─────────────────────────────┤
│ [Glow Moss] [Wire Rat]      │
│  ADMIT  REJ  ADMIT  REJ     │
└─────────────────────────────┘
```

**Minute 5 screen state**:

```
┌─────────────────────────────┐
│ HP: ████████░░ Energy: 47   │
│                             │
│  Zone alive. 10 creatures   │
│  moving, interacting.       │
│  Multiple energy streams.   │
│  Predator chasing pest.     │
│  Symbiont pulse healing.    │
│  Neon signs flickering on.  │
│  Buildings forming. Glow    │
│  spreading.                 │
│                             │
├─────────────────────────────┤
│ [Wolf] [Moth] [???]         │
│ ADMIT REJ ADMIT REJ ADMIT   │
└─────────────────────────────┘
```

**Minute 9 screen state**:

```
┌─────────────────────────────┐
│ HP: ██████████ Energy: 128  │
│ BOSS APPROACHING ▓▓▓▓▓░░░  │
│                             │
│  Zone BLAZING. 18 creatures │
│  swarming. Energy rivers.   │
│  Turrets firing neon bolts. │
│  Predators fighting boss.   │
│  Symbionts chain-healing.   │
│  Catalyst pulse wave.       │
│  Buildings 3 stories tall.  │
│  Zone GLOWING through       │
│  screen. Particle rain.     │
│                             │
├─────────────────────────────┤
│ [LEGENDARY: ???] 3 visible  │
│ traits, 3 hidden. ADMIT?    │
└─────────────────────────────┘
```

**Sensory saturation in a selection game**: Neon Warden's visual spectacle is the ecosystem itself. Unlike VS (where weapon effects are the spectacle), here the spectacle is **emergent from your decisions**. Every creature you admitted is visible, moving, interacting. The zone transforms from a dark ruin to a blazing neon metropolis over 10 minutes. The growth is literal and visual -- buildings grow, neon signs ignite, energy streams multiply.

**Audio escalation**: Ambient track evolves from lonely cyberpunk drone (minute 1) to dense urban soundscape (minute 5) to symphonic crescendo with creature vocalizations, energy hums, and combat impacts layered (minute 9). The audio IS the ecosystem health indicator.

### 7.5 E5: Cumulative Mastery

**Run #1**: The player admits creatures with no knowledge of hidden traits. Everything is a surprise. Most runs end in collapse by minute 6. The player learns: "Too many predators is bad. Symbionts are important."

**Run #10**: The player knows ~25% of the Codex. They can predict common creatures' hidden traits. They start planning: "If Chrome Wolf shows up, I'll reject it because it might be Territorial." Runs reach minute 8 regularly.

**Run #25**: The player has unlocked Redirect and Scan. They can place creatures strategically and reveal one hidden trait per gate. They're experimenting with Parasite strategies ("what if I intentionally admit a Rust Moth for catalysts?"). First boss kill.

**Run #50**: Codex ~60% complete. The player has mastered basic ecosystems and is now chasing emergent combos. "The Superconductor Network" becomes a known strategy. The player starts runs with a plan ("I'm going for a Breeding Producer colony this time") and adapts when arrivals don't cooperate.

**Run #100**: Codex ~85% complete. The player is a master ecologist. They can read Smuggler tells, predict Catalyst chains, and recover from hidden Parasite reveals. They're now chasing difficult achievements ("Complete a run with 0 producers" or "Beat the Exile King with 15+ rejections"). The game hasn't gotten easier -- new creatures keep unlocking, and mastery enables harder challenges.

**Run #1 vs Run #50 in one sentence**: Run #1 is "what does this creature do?" Run #50 is "given these arrivals, what's the optimal ecosystem composition for the Null Field boss on the Hexagonal layout?"

---

## 8. MONETIZATION (F2P Design)

### 8.1 Core Principle: Knowledge Cannot Be Bought

The Species Codex -- the game's most valuable resource -- is earned exclusively through play. No IAP reveals hidden traits. No shortcut to mastery. This is the Balatro lesson: respect the player's intelligence, and they respect your monetization.

### 8.2 Cosmetic Opportunities

**District Themes** ($2.99-4.99 each or in bundles):

| Theme           | Visual Change                                              | Audio Change                                        |
| --------------- | ---------------------------------------------------------- | --------------------------------------------------- |
| Classic Kowloon | Warm amber neon, Chinese signage, dense vertical buildings | Cantonese chatter, mahjong tiles, wok sizzle        |
| Cyber Tokyo     | Cool blue-white, Japanese signage, clean geometry          | J-synth, train chime, vending machine               |
| Neon Mumbai     | Hot pink-orange, Devanagari script, chaotic wiring         | Tabla loops, auto-rickshaw horns, chai vendor calls |
| Solarpunk       | Green-gold bioluminescence, vertical gardens, solar panels | Bird song, wind chimes, water flow                  |
| Void District   | Inverted colors, floating geometry, glitch effects         | Reversed audio, digital artifacts, bass drones      |

**Creature Skins** ($0.99-1.99 per creature family):

- Alternate neon color schemes for creature silhouettes
- Seasonal variants (Lunar New Year dragon-themed predators, Halloween ghost-themed parasites)
- "Realistic" mode skins (actual animal silhouettes instead of cyberpunk abstractions)

**Gate Aesthetics** ($1.99-2.99):

- Gate frame designs (ornate Chinese gate, industrial blast door, organic membrane, digital portal)
- Admission/rejection animation variants (stamp, laser scan, portal swirl, disintegration)

**Warden Portraits** ($0.99):

- Player avatar shown on the run summary screen
- Unlockable through achievements (free) or purchasable (premium designs)

### 8.3 Season System

**Season duration**: 8 weeks. Each season introduces:

1. **3-5 new creature types** (permanently added to pool after season)
2. **1 new Boss** (permanently added)
3. **1 new District Layout** (permanently added)
4. **Season Challenge Chain**: 20 linked challenges with escalating difficulty
5. **Seasonal Ecosystem Event**: A global modifier (e.g., "Solar Flare Season: all electronic creatures get +20% but organic creatures get -10%")

**Season economy**: Seasons keep the meta fresh without invalidating existing knowledge. New creatures mean the Codex is never "complete" -- there's always something new to discover.

### 8.4 Battle Pass Structure

**Free Track** (everyone gets):

- Seasonal currency
- 2 creature skins
- 1 gate frame
- New creatures unlock at reduced rate (play more to unlock)

**Premium Track** ($4.99/season):

- All free track rewards
- Exclusive district theme
- 5 creature skins (seasonal collection)
- 2 gate frames
- Warden portrait
- New creatures unlock immediately
- "Early Access" to season challenges (1 week ahead)

**Key rule**: Premium track provides **cosmetics and convenience, never power**. A free player with 100 runs and a premium player with 10 runs -- the free player is stronger because they have more Codex knowledge.

### 8.5 Ad Integration

**Rewarded ads only. Never interruptive.**

| Trigger                     | Reward                                                                   | Frequency Cap |
| --------------------------- | ------------------------------------------------------------------------ | :-----------: |
| Run Over screen             | "Watch ad to reveal 1 hidden trait from this run" (adds to Codex)        |     3/day     |
| Codex screen                | "Watch ad to reveal the rarest trait of any creature you've encountered" |     1/day     |
| Season challenge completion | "Watch ad to double season currency reward"                              |     2/day     |
| After 3 consecutive runs    | "Watch ad for a cosmetic token (10 tokens = random skin)"                |     1/day     |

**Ad placement design**: Ads appear at natural break points (between runs, never during). The run flow is never interrupted. The player chooses to watch ads for accelerated Codex completion -- which is a convenience, not a power advantage.

---

## 9. MOBILE UX (720x1280 Portrait)

### 9.1 Screen Layout Diagram

```
720px
┌────────────────────────────────────────────────────────────────┐
│                       STATUS BAR (8%)                          │ 102px
│  [Eco Health ████████░░]  [Energy: 47⚡]  [Wave 4/6]  [5:23]  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│                                                                │
│                     ZONE DIORAMA (52%)                          │ 666px
│                                                                │
│   Living ecosystem view. Creatures move, interact,             │
│   produce energy. Buildings grow. Neon glow intensifies.       │
│   Threats approach from edges. Defenses fire.                  │
│   This area is VIEW-ONLY. No touch interaction.                │
│                                                                │
│                                                                │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                    SECTOR TABS (5%)                             │ 64px
│  [Garden] [Alley] [Market] [Core]     (tap to view sector)    │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│                  ARRIVAL CARDS (28%)                            │ 358px
│                                                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                     │
│  │ [Silhou] │  │ [Silhou] │  │ [Silhou] │                     │
│  │ Chrome   │  │ Glow     │  │ ???      │                     │
│  │ Wolf     │  │ Moss     │  │ Smuggler │                     │
│  │ PREDATOR │  │ PRODUCER │  │ ???      │                     │
│  │ Hunt: Sm │  │ E: 2/cyc │  │ E: 5/cyc │                     │
│  │ Pwr: 3   │  │ Heal adj │  │ ???      │                     │
│  │ T1: Pack │  │ T1: Glow │  │ T1: ???  │                     │
│  │ T2: ???  │  │          │  │ T2: ???  │                     │
│  │[ADMIT][X]│  │[ADMIT][X]│  │[ADMIT][X]│                     │
│  └──────────┘  └──────────┘  └──────────┘                     │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                    ACTION BAR (7%)                              │ 90px
│  [🔍 SCAN]  [⚡ EDICT]  [☮ PARDON]       [TIMER: ██████░░ ]  │
└────────────────────────────────────────────────────────────────┘
```

### 9.2 Touch Interaction Map

```
REACHABILITY (left thumb, iPhone 15 Pro Max)
┌────────────────────────────────────────┐
│ ████████████████████████████████████████│ UNREACHABLE - Status (auto-display)
│ ████████████████████████████████████████│
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ HARD - Zone diorama (no interaction needed)
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│ EASY - Sector tabs (occasional tap)
│ ████████████████████████████████████████│ OPTIMAL - Arrival cards (primary interaction)
│ ████████████████████████████████████████│
│ ████████████████████████████████████████│
│ ████████████████████████████████████████│ OPTIMAL - Action bar (infrequent use)
└────────────────────────────────────────┘

Touch targets: All buttons minimum 52x52pt (exceeds Apple HIG 44pt minimum)
Button spacing: 12pt minimum between adjacent buttons
```

**One-handed operation**: ALL interactive elements are in the bottom 40% of the screen. The top 60% is view-only (zone diorama). The player never needs to reach to the top of the screen.

### 9.3 Information Hierarchy

**Always visible**:

- Ecosystem Health bar (color-coded: cyan/amber/red)
- Energy count (number + reactor glow)
- Wave counter + timer
- Current arrivals at gate (during gate phase)

**On-demand (tap sector tab)**:

- Sector detail view (zoom into one sector, see individual creatures)
- Creature detail (tap a creature in sector view to see all known traits)

**Post-run only**:

- Full run timeline (every decision and its consequence)
- Codex update (newly discovered traits)
- Score breakdown

**Notification design for ecosystem events**:

- Subtle: Green pulse on ecosystem bar when health improves
- Moderate: Amber flash + haptic when hidden trait reveals
- Urgent: Red border flash + sound when ecosystem health drops below 40
- Critical: Screen edge vignette goes red + alarm chime when breach occurs

All notifications are visual/haptic. No pop-ups during ecosystem phase. The zone diorama IS the notification system -- a dimming zone IS the "health is dropping" notification.

### 9.4 Gesture Reference

| Action               | Gesture                                      | Context               |
| -------------------- | -------------------------------------------- | --------------------- |
| Admit creature       | Tap green button or swipe card right         | Gate phase            |
| Reject creature      | Tap red button or swipe card left            | Gate phase            |
| Redirect to sector   | Long-press card, drag to sector tab          | Gate phase (unlocked) |
| View creature detail | Tap creature card (hold 0.5s)                | Gate phase            |
| Scan hidden trait    | Tap Scan button, then tap a card             | Gate phase (unlocked) |
| Issue Edict          | Tap Edict button, select from 4 options      | Any phase             |
| Pardon rejected      | Tap Pardon button, select from rejected list | Gate phase (unlocked) |
| View sector detail   | Tap sector tab                               | Any phase             |
| Pause                | Tap anywhere with 2 fingers                  | Any phase             |

---

## 10. HONG KONG CULTURAL INTEGRATION

### 10.1 Kowloon Walled City History as Game Mechanic

The Kowloon Walled City (demolished 1994) was a 2.7-hectare block housing ~33,000 people at its peak -- one of the densest human settlements in history. It was self-governing, unregulated, and organically structured. This is not decoration for Neon Warden; it IS the mechanic.

| Historical Reality                                                                          | Game Mechanic                                                                                            |
| ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Self-governing**: No police entered. Residents created their own order.                   | The zone is self-managing. Player sets initial conditions (who enters), then the ecosystem self-governs. |
| **Organic growth**: Buildings grew upward and inward without planning.                      | Zone structures grow visually as ecosystem thrives. No grid layout -- organic, chaotic architecture.     |
| **Dense interdependence**: Plumber knows electrician knows noodle shop. Everyone connected. | Creature adjacency matters. Symbionts link to hosts. Food chains interlock.                              |
| **Doctor-dentists and bakeries**: Real services thrived in unregulated space.               | Producers generate real value. The zone is productive, not parasitic.                                    |
| **Triads AND families**: Both criminal and civil elements coexisted.                        | Parasites and Producers coexist. Sometimes parasites are useful (Converter type).                        |
| **Overcrowding crisis**: Too many people, not enough space.                                 | Population soft cap at 12. Beyond that, overcrowding penalties degrade everything.                       |

### 10.2 Cultural References as Mechanics

**Wet Market Ecology**: Hong Kong's wet markets are living ecosystems. The fishmonger, vegetable seller, butcher, and regular customers form interdependent networks. When one vendor leaves, it ripples through the market. This maps directly to Neon Warden's ecosystem -- each creature is a "vendor" in the market of the zone. Remove one, and the network shifts.

**One Country, Two Systems**: The gate between "outside" (hostile wasteland) and "inside" (curated zone) mirrors Hong Kong's border between systems. What you let in defines what you are. The Warden is the border, and every admission decision is a policy decision.

**Immigration Waves**: Hong Kong's identity was shaped by successive immigration waves (1940s-70s mainland refugees, 1990s returnees, 2020s+ emigration). Each wave brought new skills, new tensions, new opportunities. Neon Warden's gate waves mirror this -- each wave of arrivals changes the zone's character.

**Housing Density**: Hong Kong has the world's most expensive housing and some of the smallest apartments. The zone's population cap and overcrowding mechanic directly references this pressure. "How many can we fit before quality of life collapses?" is a question Hong Kongers ask about their city every day.

**Dai Pai Dong Culture**: Street food stalls that are ecosystems unto themselves -- cook, supplier, customer, and cleaner in symbiosis. The zone's sector system (Neon Garden, Market Square) references these micro-ecosystems within the greater city ecosystem.

### 10.3 Market Considerations

| Market |  Cultural Fit   |                                                                               Risk                                                                               | Mitigation                                                                                                          |
| ------ | :-------------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------: | ------------------------------------------------------------------------------------------------------------------- |
| NA     |    **High**     |                       "Kowloon Walled City" has strong cyberpunk cachet in Western gaming culture (Blade Runner, Ghost in Shell, Deus Ex)                        | Lean into cyberpunk aesthetic. Western players already romanticize KWC.                                             |
| EU     |    **High**     |                                  Same as NA. European indie game culture especially receptive to "exotic" settings with depth.                                   | Emphasize the ecological simulation angle for European "thinking gamer" segment.                                    |
| CN     |    **High**     |     Chinese players may connect with HK culture, wet market references, mahjong-adjacent imagery. Risk: political sensitivity around "immigration" metaphor.     | Never explicitly reference real HK politics. Frame as "cyberpunk sci-fi." Creatures are robots/mutants, not people. |
| KR     |   **Medium**    |                          Korean mobile gamers prefer clear power progression and competitive elements. Ecosystem sim may be too "soft."                          | Add competitive leaderboards (daily/weekly). Score-based ranking gives KR players their power metric.               |
| JP     | **Medium-High** | Japanese gaming culture appreciates systems depth (Monster Hunter, Dragon Quest). "Terrarium building" concept resonates (Japan loves miniature garden culture). | Market as "digital terrarium roguelike." Japanese localization should emphasize the zen/gardening fantasy.          |

### 10.4 Sensitivity Check

| Concern                                 | Assessment                                                                                  | Mitigation                                                                                                                                                                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Immigration metaphor**                | Could be read as commentary on real immigration policy.                                     | All arrivals are neon creatures/robots/mutants -- never human-passing. The "gate" is sci-fi, not political. No documents, no nationality, no ethnicity.                                                                        |
| **Kowloon Walled City romanticization** | Could be seen as trivializing a real place where real people lived in difficult conditions. | Treat KWC with respect in marketing copy. Acknowledge it was a real place. Frame the game as "inspired by" not "simulating." Include a brief historical note in the game's credits/about page.                                 |
| **"Parasite" terminology**              | Could be read as dehumanizing if mapped to real groups.                                     | All creatures are clearly non-human (neon silhouettes, cyberpunk names). "Parasite" is an ecological term used in its biological sense. No creature design resembles any ethnic or social group.                               |
| **Density/overcrowding as negative**    | Could be read as anti-urban or anti-immigrant.                                              | Frame overcrowding as a resource management challenge, not a moral judgment. The game rewards inclusion (reject too many = stronger hostile faction). The optimal strategy often involves admitting MORE creatures, not fewer. |
| **Chinese cultural elements**           | Must be accurate and respectful.                                                            | Consult cultural references for neon signage, architecture, and ambient audio. No stereotypical "Oriental" music. Use actual Cantonese urban soundscapes.                                                                      |

**Overall sensitivity risk: LOW.** The sci-fi framing, non-human creatures, and ecological (not political) mechanics provide sufficient distance from real-world issues. The game celebrates Hong Kong's density and diversity as strengths, not problems.

---

## Appendix A: Key Metrics & Targets

| Metric                      |  Target  | Rationale                                   |
| --------------------------- | :------: | ------------------------------------------- |
| Session length              | 8-12 min | VS sweet spot, mobile commute-compatible    |
| Decisions per run           |  35-50   | ~1 every 15s, clustered in gate phases      |
| Decision time               | 3-5s avg | Hick's Law: 3 options = fast but meaningful |
| Runs before first boss kill |  15-25   | Engine 5: knowledge builds gradually        |
| Creature types at launch    |   40+    | Codex discovery sustains 100+ runs          |
| Hidden traits per creature  |   2-4    | Information gap drives replay               |
| Codex completion at 50 runs |   ~60%   | Always something new to discover            |
| D1 retention target         |   45%+   | Roguelike benchmark                         |
| D7 retention target         |   20%+   | Ecosystem depth sustains interest           |
| D30 retention target        |   10%+   | Meta-progression + seasonal content         |
| Avg revenue per paying user |  $8-15   | Cosmetic-driven, no P2W                     |

## Appendix B: Paper Prototype Script (60-Second Test)

**Materials**: 20 creature cards (4 Producers, 4 Predators, 3 Symbionts, 3 Parasites, 2 Catalysts, 4 with hidden traits face-down), 1 energy tracker (d20 or paper), 1 health tracker (d20 or paper), threat cards (5 levels).

**Setup**: Start with Energy 5, Health 50. Draw 2 creature cards face-up.

**Each round (represents 1 gate + ecosystem + threat cycle)**:

1. **Gate**: Draw 3 creature cards. For each: Admit (place in "zone") or Reject (place in "rejected" pile). Hidden trait cards stay face-down until step 3.
2. **Ecosystem**: Each Producer in zone adds 2 energy. Each Predator eats 1 energy (patrolling costs energy). Each Symbiont adds 1 energy to an adjacent Producer. Each Parasite removes 2 energy.
3. **Reveal**: Flip 1 hidden trait card. Apply its effect.
4. **Threat**: Draw 1 threat card. Compare its power to your energy. If energy > threat, you win (threat discarded). If energy < threat, lose health equal to the difference. Rejected pile adds +1 to threat power per 2 rejected creatures.
5. **Health check**: If health <= 0, run over. Otherwise, next round.

**Play 5 rounds. Takes ~60 seconds per round = 5 minutes total. Did you want to play again? That's the test.**

---

## Appendix C: Competitive Landscape

| Game                | Similarity                           | Key Differentiator for Neon Warden                              |
| ------------------- | ------------------------------------ | --------------------------------------------------------------- |
| Papers, Please      | Gate mechanic                        | NW curates for ecology, not bureaucratic compliance             |
| Super Auto Pets     | Auto-battler with creature selection | NW creatures interact as ecosystem, not just fight              |
| Balatro             | Selection-only roguelike             | NW has spatial ecosystem instead of hand-scoring                |
| Luck be a Landlord  | Curate-and-watch mechanic            | NW ecosystem is 2D spatial with food chains, not slot positions |
| TFT                 | Draft-and-watch auto-combat          | NW is PvE with ecosystem emergent behavior, not PvP meta        |
| Ecosystem (Steam)   | Ecosystem simulation                 | NW is a 10-min roguelike, not a sandbox sim                     |
| Oxygen Not Included | Colony management with ecology       | NW is mobile-first, 10-min sessions, selection-only             |

---

> **Next Steps**:
>
> 1. CEO review of this GDD
> 2. Paper prototype test (Appendix B)
> 3. Red team review (SPEC-039)
> 4. Digital prototype in Phaser (SPEC-040)

---

## Sources

- SPEC-037: Novel Hybrid Concepts (Neon Warden section)
- vs-engine-dissection.md: VS 5 Addiction Engines
- selection-only-games-analysis.md: 6-game deep analysis
- SPEC-035-redteam-selection-filter.md: Selection-only design principles (10 rules + 5 anti-patterns)
- Kowloon Walled City historical references: [City of Darkness Revisited -- Greg Girard & Ian Lambot](https://www.amazon.com/City-Darkness-Revisited-Greg-Girard/dp/1908211148)
- Hong Kong immigration history: [Asia Pacific Foundation of Canada](https://www.asiapacific.ca/publication/hong-kong-migration-story)
