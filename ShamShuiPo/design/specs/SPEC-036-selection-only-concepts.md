# SPEC-036: Selection-Only Hybrid Concepts

> **Project**: ShamShuiPo
> **Version**: v1.0
> **Author**: Lead Game Designer
> **Status**: CEO Review Pending
> **Date**: 2026-03-14
> **Prerequisite**: SPEC-035 (Hybrid Concepts), vs-engine-dissection.md, hybrid-genre-analysis.md
> **CEO Directive**: "Controls should be SELECTION ONLY. Minimize control elements. Focus on ANTICIPATION + SELECTION."

---

## Design Philosophy: The Selection-Only Constraint

### Why Zero Manual Control?

The CEO's directive eliminates joystick, tapping to aim, dodging, and all dexterity-based input. What remains is the purest form of game interaction: **choosing from options and watching consequences unfold**.

This is not a limitation. It is a **design liberation**. Consider the evidence:

| Game               | Dexterity Required | Revenue              | Core Interaction                      |
| ------------------ | ------------------ | -------------------- | ------------------------------------- |
| Balatro            | Zero               | $45M+ (7M copies)    | Select cards to play                  |
| Luck be a Landlord | Zero               | Millions (Steam hit) | Select symbols to add to slot machine |
| CloverPit          | Zero               | 1M units in 10 weeks | Select slot items, watch combos       |
| Super Auto Pets    | Zero               | 10M+ downloads       | Select pets, position them            |
| Slay the Spire     | Zero               | Tens of millions $   | Select cards from draft               |

**The pattern is clear**: selection-only games can achieve massive commercial success when they nail the anticipation-resolution loop. The player designs a system, then watches it execute. The gap between "I chose this" and "look what happened" is where dopamine lives.

### The Anticipation-Resolution Framework

Every selection-only game follows this beat:

```
SELECTION PHASE (Player Active)
  "I see my options. I think about synergies. I make a choice."
  Duration: 3-15 seconds
  Emotion: Strategic excitement, weighing tradeoffs

ANTICIPATION PHASE (Player Watches)
  "My choice is locked in. What will happen?"
  Duration: 5-30 seconds
  Emotion: Tension, hope, dread

RESOLUTION PHASE (System Reveals)
  "It worked! / It almost worked! / Unexpected combo!"
  Duration: 2-5 seconds
  Emotion: Triumph / near-miss / surprise

FEEDBACK PHASE (Rewards Flow)
  "New options unlocked. My system grew."
  Duration: 3-10 seconds
  Emotion: Satisfaction, greed for more
```

VS's 5 addiction engines map perfectly onto this framework:

- **E1 (Hero's Journey)**: System starts weak, choices compound into godhood
- **E2 (Controlled Randomness)**: Options presented are weighted random
- **E3 (Systemic Surprise)**: Chosen elements interact in unexpected ways during resolution
- **E4 (Sensory Saturation)**: Resolution phase fills screen with cascading effects
- **E5 (Cumulative Mastery)**: Meta-unlocks expand the option pool across runs

### What "Selection-Only" Patterns Exist?

| Pattern              | Example                       | Feel                             |
| -------------------- | ----------------------------- | -------------------------------- |
| **Draft/Pick**       | Slay the Spire card rewards   | "I'm building something"         |
| **Slot Spin + Keep** | Luck be a Landlord, CloverPit | "I'm engineering probability"    |
| **Card Play**        | Balatro hand selection        | "I'm executing strategy"         |
| **Unit Placement**   | Super Auto Pets               | "I'm arranging my army"          |
| **Route Selection**  | FTL, Slay the Spire map       | "I'm choosing my fate"           |
| **Fusion/Merge**     | Triple Town, merge games      | "I'm creating something greater" |
| **Auction/Bid**      | Arcs, auction games           | "I'm risking for reward"         |

---

## Concept 1: Neon Slots (Neon Jackpot)

### One-Line Pitch

> **"You curate a slot machine's symbol pool, spin, and watch your Hong Kong neon icons cascade into devastating combo attacks that auto-obliterate waves of cyberpunk enemies."**

### Genre DNA: Slot Machine Roguelike (Luck be a Landlord / CloverPit) x VS Addiction Engines

---

### The Core Selection Moment

**What does the player choose?**

After each wave of enemies is auto-resolved, the player enters the **NEON MARKET** phase:

1. **Add Symbol**: Choose 1 of 3 randomly offered neon symbols to add to your slot machine (e.g., "Neon Dragon: adjacent Fire symbols deal 2x damage")
2. **Remove Symbol**: Pay coins to remove a weak symbol (cleaning your probability pool)
3. **Buy Relic**: Spend coins on a persistent modifier (e.g., "Lucky Cat: all Gold symbols also give +1 Mult")

The slot machine starts with 5 reels and 3 basic symbols. By minute 8, it has 20+ symbols with interlocking synergies. The player is **engineering a probability machine**.

**The genius of Luck be a Landlord's design** is that you're not gambling -- you're doing probability engineering. Each "Add Symbol" decision shifts the expected value of future spins. ShamShuiPo takes this and adds VS's escalating enemy threat as the stakes.

### The Anticipation Phase

**What do they watch unfold?**

Each combat round:

1. **SPIN** -- The 5 reels spin with neon Chinese characters. The player taps "SPIN" (single tap, the only input during combat)
2. **CASCADE** -- Symbols resolve left-to-right. Adjacent symbols trigger combos. A "Fire" next to a "Dragon" triggers "Fire Dragon" bonus. Three "Gold" in a row triggers "Jackpot"
3. **ATTACK** -- Each resolved combo translates into an auto-attack on the enemy wave. Fire Dragon = screen-wide flame sweep. Jackpot = coin explosion that damages all enemies
4. **ENEMY ADVANCE** -- Surviving enemies push closer to your "base" (a neon storefront). If they reach it, you take damage
5. **ESCALATION** -- Every 3 spins, "rent" increases (enemy wave gets harder). Your machine must keep pace

The player watches with gripped anticipation as the reels slow down: "Please land on Dragon... please land on Dragon... YES! Fire-Dragon-Dragon TRIPLE! MEGA COMBO!"

### The Surprise Engine

**How do synergies emerge?**

Symbols have adjacency rules, category bonuses, and hidden interactions:

| Interaction Type   | Example                                                                  | Discovery Feel                            |
| ------------------ | ------------------------------------------------------------------------ | ----------------------------------------- |
| **Adjacency**      | Fish Ball next to Noodle = "Street Feast" (heal + area attack)           | "Oh, food symbols combo!"                 |
| **Category**       | 3 Animal symbols anywhere = "Wild Pack" (summon allies for 1 round)      | "I didn't know categories mattered!"      |
| **Relic + Symbol** | Relic "Neon Sign" + any Chinese character symbol = double payout         | "This relic makes my whole build better!" |
| **Destruction**    | "Bomb" symbol destroys adjacent symbols but deals massive damage         | "I can use destruction strategically!"    |
| **Transformation** | "Alchemist" symbol transforms adjacent common symbols into rare ones     | "My commons just became golds!"           |
| **Hidden Recipe**  | Dragon + Phoenix + Tiger in one spin = "Celestial Jackpot" (screen nuke) | "WHAT. HOW. I NEED TO DO THAT AGAIN."     |

The symbol pool grows to 60+ symbols across 8 categories (Fire, Water, Metal, Wood, Earth, Luck, Animal, Neon). With 5 reels, the combinatorial space is vast. Players will discover synergies 50+ runs in.

### The Zero-to-Hero Arc

| Time  | State                                                                                         | Player Feeling                             |
| ----- | --------------------------------------------------------------------------------------------- | ------------------------------------------ |
| 0:00  | 5 reels, 3 basic symbols (Coin, Fist, Shield). Enemies = 3 slow walkers                       | "This is simple"                           |
| 1:30  | 8 symbols. First combo discovered (Fist+Fist = "Double Strike")                               | "Oh, duplicates matter!"                   |
| 3:00  | 12 symbols. First relic acquired. Enemy wave = 15 mixed types                                 | "I need to think about what I add"         |
| 5:00  | 16 symbols, 2 relics. BOSS ROUND: Boss has neon shield requiring specific combo to break      | "Can my machine produce the right combo?!" |
| 7:00  | 20 symbols, 3 relics. Cascading combos fill screen with neon explosions. 30+ enemies per wave | "My machine is PRINTING damage"            |
| 8:30  | Final boss. Must produce "Neon Jackpot" (5 matching symbols) to break final shield            | "One spin to rule them all..."             |
| 10:00 | JACKPOT HIT. Screen erupts in neon. Boss evaporates. Score screen with coins earned           | "I BUILT that machine. I'M the architect." |

### Mobile Fit (720x1280 Portrait)

```
┌─────────────────────┐
│   ENEMY WAVE AREA   │  <- Top 40%: enemies advance
│   (auto-combat vis) │     toward your neon storefront
│                     │     at bottom of this zone
│─────────────────────│
│  ┌───┬───┬───┬───┬──│
│  │ 龍 │ 火 │ 金 │ 魚 │  <- Middle 20%: SLOT REELS
│  │   │   │   │   │  │     5 reels, neon glow
│  └───┴───┴───┴───┴──│     Spin animation here
│─────────────────────│
│  COMBO DISPLAY      │  <- 10%: Shows active combo
│  "FIRE DRAGON x2.5" │     chain and damage output
│─────────────────────│
│  [  S P I N  ]      │  <- 10%: Big spin button
│                     │     (single tap per round)
│  Coins: 245  HP: ██ │  <- Bottom 20%: Resources
│  Wave 7/12   Relics │     + between-wave market
└─────────────────────┘
```

### Why This Hasn't Been Done

- **CloverPit** and **Luck be a Landlord** proved slot-machine roguelikes work commercially (CloverPit: 1M units in 10 weeks)
- **BUT** neither has real-time visual combat resolution. They show numbers going up. ShamShuiPo shows enemies exploding in neon fire as your slot results translate into on-screen carnage
- **The innovation**: Slot machine as weapon system, not just scoring system. Each spin is a combat action, not an abstract point calculation
- No existing game combines: slot roguelike + VS visual spectacle + Hong Kong neon aesthetic + portrait mobile

### Risk Assessment

| Risk                                            | Severity | Mitigation                                                                                               |
| ----------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------- |
| "It's just a slot machine" -- no agency feeling | HIGH     | Symbol pool curation IS the agency. Bad symbols can be removed. The machine is YOUR design               |
| Spin results feel random, not strategic         | HIGH     | Show "next spin preview" for 1 reel (like Tetris next piece). Weight results toward player-added symbols |
| Combat resolution is passive/boring to watch    | MEDIUM   | Juice the resolution: screen shake per combo, escalating sound, chain counter, damage numbers flooding   |
| Symbol pool gets bloated/unreadable             | MEDIUM   | Max 25 symbols in machine. Remove mechanic keeps it curated. Category color coding                       |

---

## Concept 2: Neon Jury (Neon Verdict)

### One-Line Pitch

> **"You draft a jury of Hong Kong street fighters, arrange them in a courtroom-style bench, and watch them auto-brawl waves of enemies -- your verdict on who sits where determines if you survive."**

### Genre DNA: Auto-Battler (Super Auto Pets / TFT) x Roguelike Progression x VS Addiction Engines

---

### The Core Selection Moment

**What does the player choose?**

Between each combat wave, the player enters **RECRUITMENT**:

1. **Draft**: Choose 1 of 3 fighters to add to your bench (max 7 slots). Each fighter has an archetype, element, and passive
2. **Position**: Drag fighters to rearrange bench order. Position matters: Front = takes hits first, Back = attacks last but has range bonuses. Adjacent fighters trigger synergies
3. **Fuse**: Combine 3 identical fighters into a starred-up version (2-star, 3-star). This is the "discover a triple" dopamine hit from TFT
4. **Equip**: Assign collected relics to specific fighters (max 1 relic per fighter)

**The key difference from TFT/Super Auto Pets**: There is no opponent. This is PvE wave survival. The enemy waves escalate like VS, creating the compressed hero's journey. You're not competing against other players' armies -- you're racing against an escalating apocalypse.

### The Anticipation Phase

**What do they watch unfold?**

Combat is fully automatic. Your bench of fighters charges forward into the enemy wave:

1. **CLASH** -- Fighters and enemies collide in a side-scrolling auto-brawl (think Totally Accurate Battle Simulator meets neon Hong Kong)
2. **SYNERGY TRIGGERS** -- Adjacent fighters of the same element trigger combo attacks: two Fire fighters = "Inferno Chain" that sweeps through enemies
3. **CRITICAL MOMENTS** -- Your front-liner's HP drops low... will they survive? The healer in slot 3 triggers just in time! Near-miss psychology at work
4. **ESCALATION** -- Enemy waves get denser. By wave 8, the screen is packed with enemies and your fighters' abilities create cascading neon explosions
5. **BOSS PHASE** -- Boss has specific weakness (e.g., "Weak to Metal synergy"). Did you draft enough Metal fighters?

The player grips their phone: "Come on, come on... the Neon Samurai is almost dead... YES the Street Medic healed her! And the Dragon Fist in the back just triggered his ultimate!"

### The Surprise Engine

The synergy system creates layers of discovery:

| Layer             | Mechanic                                                         | Example                                                             |
| ----------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------- |
| **Element Pairs** | 2 same-element adjacent = combo attack                           | Fire+Fire = Inferno Chain                                           |
| **Element Trios** | 3 same-element = team-wide buff                                  | 3 Water = all fighters gain regen                                   |
| **Cross-Element** | Specific pairs create fusion effects                             | Fire+Metal = "Molten Blade" (burn + armor pierce)                   |
| **Role Synergy**  | Tank in front of DPS = "Bodyguard" bonus (DPS gets attack speed) | Positional strategy                                                 |
| **Star Power**    | 3-star fighter unlocks hidden ability                            | 3-star Dragon Fist = "Awakened Dragon" (attacks all enemies)        |
| **Relic Combos**  | Certain relics on certain fighters = special interaction         | "Lucky Coin" on "Gambler" fighter = every attack has jackpot chance |

**Fighter roster**: 30 fighters across 6 elements (Fire, Water, Metal, Wood, Lightning, Shadow) and 5 roles (Tank, DPS, Support, Assassin, Summoner). That's 150+ possible synergy combinations.

### The Zero-to-Hero Arc

| Time  | Bench State                                             | Combat Visual                              |
| ----- | ------------------------------------------------------- | ------------------------------------------ |
| 0:00  | 1 basic fighter (Street Punk, no element)               | Punches 3 slow enemies                     |
| 2:00  | 3 fighters, first element pair discovered               | Small combo flashes                        |
| 4:00  | 5 fighters, first 2-star fusion. Element trio achieved  | Team buff glows, faster kills              |
| 6:00  | 7 fighters, 2 synergies active, 1 relic equipped        | Screen filling with neon particle effects  |
| 8:00  | 7 fighters (3 at 2-star), multiple synergies chaining   | Auto-brawl is a neon light show            |
| 9:30  | Boss fight. Cross-element fusion triggers               | Ultimate abilities cascade across screen   |
| 10:00 | Victory or defeat. Score tallied, new fighters unlocked | "Next run I'll try full Lightning team..." |

### Mobile Fit (720x1280 Portrait)

```
┌─────────────────────┐
│   COMBAT ARENA      │  <- Top 55%: Side-view auto-brawl
│   Fighters → Enemies│     Your team on left, enemies right
│   [Neon VFX chaos]  │     Neon explosions, damage numbers
│                     │
│─────────────────────│
│  YOUR BENCH         │  <- Middle 15%: 7 fighter slots
│  [1][2][3][4][5][6][7] │  Drag to reposition
│  Synergies: 🔥🔥 ⚡  │  Active synergies shown
│─────────────────────│
│  DRAFT / SHOP       │  <- Bottom 30%: Between waves
│  [Fighter A] [B] [C]│     Draft picks, fuse button,
│  [FUSE] [SELL] Gold:42│  relic shop
└─────────────────────┘
```

### Why This Hasn't Been Done

- Auto-battlers (TFT, Super Auto Pets) are **PvP-focused**. The PvE wave survival format is untapped
- No auto-battler uses VS's compressed hero's journey (zero-to-hero in 10 minutes with escalating enemy density)
- The fusion/starring system from TFT combined with VS's sensory saturation creates a new anticipation loop: "Will I find the third copy to make my 3-star before the boss wave?"
- Hong Kong street fighter theme gives each unit cultural personality (Tai Chi master, Wushu student, Triad enforcer, Dai Pai Dong cook who throws cleavers)

### Risk Assessment

| Risk                                      | Severity | Mitigation                                                                                                             |
| ----------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------- |
| Combat too passive -- "I'm just watching" | HIGH     | Make combat fast (15-20 seconds per wave). The anticipation is in the draft phase, not the fight phase                 |
| Too similar to Super Auto Pets            | MEDIUM   | PvE wave survival (not PvP), Hong Kong aesthetic, fusion system, VS-style escalation -- enough axes of differentiation |
| 30 fighters overwhelming for new players  | MEDIUM   | Start with 10 in pool, unlock more via meta-progression. Tutorial run uses only 5 basic fighters                       |
| Bench positioning too complex for casual  | LOW      | Auto-arrange button available. Manual positioning is optimization, not requirement                                     |

---

## Concept 3: Neon Fortune (Neon Tarot)

### One-Line Pitch

> **"Play poker hands made of neon Hong Kong fortune cards, watch your hand score translate into devastating auto-attacks, and discover that a Dim Sum Flush hits harder than a Royal Straight."**

### Genre DNA: Balatro (Poker Roguelike) x VS Combat Spectacle x Hong Kong Fortune Culture

---

### The Core Selection Moment

**What does the player choose?**

Each combat round, the player has a **HAND** of 8 cards and must:

1. **SELECT** up to 5 cards to play as a "hand" (like Balatro's poker hand selection)
2. **DISCARD** up to 3 cards to draw replacements (limited discards per round)

But these aren't poker cards. They're **Neon Fortune Cards** with Hong Kong cultural suits:

| Suit               | Symbol     | Color   | Theme                    |
| ------------------ | ---------- | ------- | ------------------------ |
| **Dim Sum** (點心) | Dumpling   | Gold    | Healing + economy        |
| **Neon** (霓虹)    | Light tube | Magenta | Damage + visual effects  |
| **Triad** (三合)   | Triangle   | Crimson | Critical + assassination |
| **Jade** (玉)      | Jade stone | Green   | Defense + growth         |

Ranks 1-13, with "hand" types that parallel poker but have unique names:

| Hand Type                 | Cards                   | Base Score | Attack Visual                       |
| ------------------------- | ----------------------- | ---------- | ----------------------------------- |
| **Pair** (雙)             | 2 same rank             | 10 x 2     | Double strike                       |
| **Dim Sum Set** (點心套)  | 3 same suit (Dim Sum)   | 20 x 3     | Healing rain + AoE                  |
| **Straight** (順)         | 5 sequential ranks      | 30 x 4     | Sweeping neon beam                  |
| **Flush** (清)            | 5 same suit             | 35 x 4     | Suit-themed screen attack           |
| **Full House** (滿堂)     | 3+2 same rank           | 40 x 5     | Devastating combo                   |
| **Neon Royal** (霓虹皇家) | 10-J-Q-K-A of Neon suit | 100 x 10   | Screen-obliterating neon apocalypse |

**The Balatro innovation applied**: Between rounds, the player visits a **Fortune Teller** shop to buy **Joker-equivalent modifiers** called "Omens" (吉兆):

- "Lucky Cat" (招財貓): All Dim Sum cards give +3 Mult
- "Dragon's Eye" (龍眼): Pairs count as Triples
- "Neon Fever" (霓虹熱): Playing 3+ Neon cards triggers chain lightning
- "Eight Immortals" (八仙): Having exactly 8 cards in hand before playing gives x2

Up to 5 Omens active simultaneously, creating the multiplicative scoring explosion that makes Balatro addictive.

### The Anticipation Phase

**What do they watch unfold?**

1. **HAND PLAYED** -- Selected cards fly to center screen, forming the hand pattern
2. **SCORE CALCULATION** -- Chips multiply visually: base score x hand mult x Omen 1 x Omen 2... numbers escalate wildly (watching 50 become 500 become 5,000 is PURE dopamine)
3. **ATTACK TRANSLATION** -- The final score determines attack power and visual intensity:
   - Score < 100: Small projectile hits a few enemies
   - Score 100-500: Medium neon blast, screen shake
   - Score 500-2000: Large screen-filling attack, enemies disintegrate
   - Score 2000+: **NEON APOCALYPSE** -- entire screen erupts, slow-mo, all enemies vaporized
4. **ENEMY RESPONSE** -- Surviving enemies advance and attack your HP bar. Next round begins

The Balatro "multiplier escalation" moment -- when you play a hand and watch the score multiply through 4-5 Omens, each one flashing and adding to the total -- this is the most addictive moment in modern game design. ShamShuiPo adds the visual payoff of seeing that score BECOME an on-screen neon explosion.

### The Surprise Engine

| Discovery                              | Trigger                                 | Player Reaction                       |
| -------------------------------------- | --------------------------------------- | ------------------------------------- |
| "Dim Sum cards heal?!"                 | First Dim Sum Flush played              | "Suits have gameplay meaning!"        |
| "Omens stack multiplicatively?!"       | First double-Omen hand                  | "50 became 2,500! HOW?!"              |
| "Triad cards crit!"                    | First all-Triad hand                    | "The red cards are assassins!"        |
| Hidden hand: "Mahjong"                 | Play 1-1-1-2-3 (Pon + Chi pattern)      | "MAHJONG HAND?! It's not even poker!" |
| Hidden hand: "Eight Treasures"         | 8 unique ranks, no matching             | "A non-matching hand is GOOD?!"       |
| Omen combo: "Fortune Teller's Paradox" | "Lucky Cat" + "Bad Luck Charm" equipped | "Opposites create a secret Omen!"     |
| Boss weakness                          | Boss weak to specific suit              | "I need to rebuild my deck for Jade!" |

### The Zero-to-Hero Arc

| Time  | Situation                                                    | Score Range  | Screen                                             |
| ----- | ------------------------------------------------------------ | ------------ | -------------------------------------------------- |
| 0:00  | 4 basic cards, no Omens. Pairs only                          | 20-40        | Small plinks of damage                             |
| 2:00  | 8 cards, 1 Omen. First Flush discovered                      | 50-150       | Visible neon blasts                                |
| 4:00  | 8 cards, 2 Omens. Deck enhanced with special cards from shop | 100-500      | Screen-quarter attacks                             |
| 6:00  | 8 cards, 4 Omens. Multiplicative stacking kicks in           | 300-3,000    | Half-screen neon eruptions                         |
| 8:00  | Enhanced deck, 5 Omens. Every hand is a chain reaction       | 1,000-10,000 | Full-screen chaos, enemies melting                 |
| 10:00 | Final boss. One perfect hand needed                          | 15,000+      | **NEON APOCALYPSE** -- the screen IS the explosion |

**This IS Balatro's scoring escalation mapped onto VS's visual escalation.** The numbers going up IS the screen filling up.

### Mobile Fit (720x1280 Portrait)

```
┌─────────────────────┐
│   ENEMY WAVE        │  <- Top 30%: Enemies + your HP
│   [Neon VFX]        │     Attack visuals play here
│   HP: ████████░░    │
│─────────────────────│
│  SCORE MULTIPLIER   │  <- 15%: Omen chain display
│  50 x2 x3 x1.5 =450│     Shows multiplicative scoring
│─────────────────────│
│  ┌──┬──┬──┬──┬──┐   │  <- 15%: Selected cards
│  │7♦│7♦│K♠│K♠│K♠│   │     (played hand area)
│  └──┴──┴──┴──┴──┘   │
│  FULL HOUSE! 40x5   │
│─────────────────────│
│  YOUR HAND (8 cards)│  <- Bottom 40%: Card hand
│  [tap to select]    │     Fan display, tap to select
│  ┌─┬─┬─┬─┬─┬─┬─┬─┐ │     up to 5, then [PLAY] button
│  │ │ │ │ │ │ │ │ │ │
│  [PLAY]  [DISCARD]  │
│  Discards left: 2   │
└─────────────────────┘
```

### Why This Hasn't Been Done

- **Balatro** proved poker-roguelike works ($45M+, 7M copies). But Balatro has **no visual combat**. The score is abstract
- **No game** has taken Balatro's multiplicative scoring system and translated the score into real-time visual combat intensity
- The Neon Fortune cards replace poker's Western cultural framework with Hong Kong fortune culture -- Dim Sum suits, Mahjong hidden hands, Lucky Cat omens -- making it culturally distinct, not just a reskin
- **The gap**: Balatro players love watching numbers explode. VS players love watching screens explode. This game makes both happen simultaneously

### Risk Assessment

| Risk                                         | Severity | Mitigation                                                                                                                                                                                              |
| -------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "It's just Balatro with a combat skin"       | CRITICAL | Must differentiate: suit-specific gameplay effects (Dim Sum heals, Triad crits), boss suit weaknesses forcing deck pivots, visual combat that changes with score. Balatro is abstract; this is visceral |
| Card text requires reading, breaking flow    | HIGH     | Cards are icon+color based (no text during combat). Omens show effects on hover. Cultural icons (dumpling, jade, neon tube) are instantly readable                                                      |
| Balatro's depth takes hours to appreciate    | MEDIUM   | 10-minute runs mean faster iteration. Simplified hand types (8 vs Balatro's 11). Omens are fewer but more impactful                                                                                     |
| Poker/card game may alienate non-card-gamers | MEDIUM   | Tutorial uses "match colors" framing, not "poker." The word "poker" never appears. It's "Neon Fortune" -- a new game                                                                                    |

---

## Concept 4: Neon Architect (Neon Blueprint)

### One-Line Pitch

> **"Place neon defense modules on a blueprint grid, watch your automated fortress obliterate waves of cyberpunk invaders, then redesign between waves -- you're the architect, the fortress is the weapon."**

### Genre DNA: Placement Strategy (Into the Breach grid thinking) x Auto-Defense x VS Escalation

---

### The Core Selection Moment

**What does the player choose?**

Between each wave, the player has 15 seconds in **BLUEPRINT MODE** (time-frozen):

1. **PLACE**: Drag 1-2 new modules onto a 5x5 grid from a choice of 3 offered modules
2. **ROTATE**: Tap placed modules to rotate (changes their attack direction/coverage)
3. **UPGRADE**: Tap an existing module to spend coins upgrading it (Level 1 → 2 → 3)
4. **RELOCATE**: Drag an existing module to a new position (once per wave, free)

**Module types** (30 total, unlocked via meta-progression):

| Category    | Example Module                                                                  | Grid Effect             |
| ----------- | ------------------------------------------------------------------------------- | ----------------------- |
| **Offense** | Neon Turret: shoots in a line (direction based on rotation)                     | Covers 1 row/column     |
| **Offense** | Dragon Breath: cone attack in facing direction                                  | Covers 3 tiles in front |
| **Defense** | Jade Wall: blocks enemy movement through tile                                   | Redirects enemy pathing |
| **Utility** | Magnet Node: pulls dropped loot to it                                           | Economy optimization    |
| **Buff**    | Amplifier: +50% damage to all adjacent modules                                  | Positional synergy      |
| **Special** | Neon Sign: randomly changes effect each wave                                    | Controlled randomness   |
| **Trap**    | Fish Ball Mine: explodes when enemy steps on it, can only trigger once per wave | Burst damage            |

The 5x5 grid means placement decisions create geometric synergies: an Amplifier surrounded by 4 Turrets creates a kill zone. A line of Jade Walls funnels enemies into a Dragon Breath's cone.

### The Anticipation Phase

**What do they watch unfold?**

Combat phase (20-30 seconds per wave, auto-resolving):

1. **ENEMY SPAWN** -- Enemies enter from the grid edges (top, sides). Paths shown briefly before combat
2. **FORTRESS ACTIVATES** -- All placed modules fire/activate simultaneously. Turrets shoot, traps trigger, walls redirect
3. **CHAIN REACTIONS** -- Enemies pushed by one module into another module's zone. Spatial combos cascade
4. **ESCALATION** -- Each wave adds more enemies from more directions. By wave 10, all 4 edges are flooding with enemies. The grid becomes a kill box of interlocking neon beams
5. **LEAK CHECK** -- Any enemy that reaches the center tile damages your core HP

The player watches with mounting tension: "The left turret is firing... enemies are funneling through the gap... INTO the trap! BOOM! But wait, more from the top -- will the Dragon Breath rotate in time? YES!"

### The Surprise Engine

| Discovery             | Trigger                                             | Effect                                                       |
| --------------------- | --------------------------------------------------- | ------------------------------------------------------------ |
| **Funnel Kill**       | Wall redirects enemies into turret line of fire     | "Walls aren't just defense -- they're offense!"              |
| **Amplifier Stack**   | 2 Amplifiers adjacent to each other AND a turret    | "Amplifiers boost each other?! Exponential!"                 |
| **Neon Sign Jackpot** | Random Neon Sign becomes "Dragon Cannon" for a wave | "The random module became the strongest thing on the board!" |
| **Full Row Bonus**    | Fill an entire row with modules                     | "FULL ROW BONUS: That row's damage doubles!"                 |
| **Blueprint Shapes**  | L-shape of same type = special formation bonus      | "Formations matter! Let me try a cross shape!"               |
| **Module Evolution**  | Level 3 module + adjacent Level 3 = Fusion module   | "My two Level 3s merged into a MEGA TURRET!"                 |

### The Zero-to-Hero Arc

| Time  | Grid State                                                  | Visual                                      |
| ----- | ----------------------------------------------------------- | ------------------------------------------- |
| 0:00  | 1 basic turret on center-adjacent tile                      | Single pellet shots at 2 enemies            |
| 2:00  | 4 modules, first wall placed. Enemies = 5-8                 | Small neon projectiles                      |
| 4:00  | 8 modules, first Amplifier placed. Strategic layout forming | Visible damage zones, brighter beams        |
| 6:00  | 14 modules, 2 at Level 2. Multiple synergies firing         | Grid pulsing with neon energy, chains       |
| 8:00  | 20 modules, formations discovered. All edges under siege    | Screen is a neon kill grid, enemies melting |
| 10:00 | 25 modules, Level 3 fusions active. Boss wave               | Grid is a NEON FORTRESS. Every tile burns   |

**The growth is physically visible**: an empty dark grid becomes a pulsing neon fortress. The player SEES their decisions made manifest.

### Mobile Fit (720x1280 Portrait)

```
┌─────────────────────┐
│  WAVE INFO / HP     │  <- Top 10%: Wave counter, core HP
│  Wave 8/12  HP: ████│
│─────────────────────│
│                     │
│  ┌──┬──┬──┬──┬──┐   │  <- Middle 60%: THE GRID
│  │  │🔫│  │  │  │   │     5x5, each tile = one module
│  ├──┼──┼──┼──┼──┤   │     Enemies enter from edges
│  │  │⚡│🏯│⚡│  │   │     Combat plays out here
│  ├──┼──┼──┼──┼──┤   │     Neon effects fill the grid
│  │🧱│  │❤️│  │🧱│   │
│  ├──┼──┼──┼──┼──┤   │
│  │  │🔫│  │🔫│  │   │
│  ├──┼──┼──┼──┼──┤   │
│  │  │  │🐉│  │  │   │
│  └──┴──┴──┴──┴──┘   │
│─────────────────────│
│  MODULE SELECTION   │  <- Bottom 30%: Between waves
│  [Mod A] [B] [C]    │     Choose module, drag to grid
│  [UPGRADE] Coins:180│     Upgrade/rotate buttons
└─────────────────────┘
```

### Why This Hasn't Been Done

- **Into the Breach** uses a grid for tactical combat but requires per-unit manual commands every turn. This is fully auto-resolving
- **Tower defense** games (Bloons TD, Kingdom Rush) use free-form placement, not grid-based geometric synergies
- **No game** combines: grid placement + auto-resolution + VS escalation + formation bonuses + module fusion
- The **5x5 grid** is the perfect size for mobile: large enough for strategy (25 tiles), small enough for thumb targeting
- The "grid fills up with neon" visual is uniquely suited to the Hong Kong aesthetic -- your grid literally becomes a miniature neon cityscape

### Risk Assessment

| Risk                                    | Severity | Mitigation                                                                                                   |
| --------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------ |
| 15-second placement timer causes stress | MEDIUM   | Timer pauses when dragging a module. First 5 waves have 20-second timer. "Casual mode" option with no timer  |
| Grid too small for meaningful strategy  | MEDIUM   | 5x5 = 25 tiles is enough (chess is 8x8 with only ~16 pieces active). Module rotation adds directionality     |
| Placement precision on mobile           | MEDIUM   | Grid cells are large (144x144px at 720px width). Snap-to-grid. Undo last placement button                    |
| Watching auto-combat becomes boring     | LOW      | Combat is 15-20 seconds max. Fast-paced with escalating VFX. The strategy IS the placement, not the watching |

---

## Concept 5: Neon Heist (Neon Crew)

### One-Line Pitch

> **"Recruit a crew of Hong Kong thieves, plan the heist route through a neon-lit building, and watch them auto-infiltrate floor by floor -- each choice of route, loot, and crew determines if you escape alive or trigger the alarm cascade."**

### Genre DNA: Route Selection (FTL / Slay the Spire map) x Crew Management x VS Escalation x Heist Fantasy

---

### The Core Selection Moment

**What does the player choose?**

The game presents a **HEIST MAP** -- a vertical cross-section of a Hong Kong skyscraper, 10 floors tall. Each floor has 2-3 room options connected by paths:

```
ROOF (Escape) ─────────────────
  │
Floor 10: [BOSS VAULT] ← only path
  │
Floor 9:  [Guard Post] ──── [Server Room]
  │              │                  │
Floor 8:  [Armory] ──── [Lab] ──── [Lounge]
  │           │           │           │
  ... (branching paths continue) ...
  │
Floor 1:  [ENTRANCE] ← start here
```

**Per floor, the player chooses:**

1. **ROUTE**: Which room to enter (each has different risk/reward)
   - Guard Post: Combat encounter (harder, more XP)
   - Server Room: Hacking puzzle (choice-based minigame, tech loot)
   - Lounge: Rest + shop (heal, recruit, buy gear)
   - Vault: Big loot but alarm risk

2. **CREW ACTION**: Before entering, assign crew roles:
   - "Hacker, take point" (bonus to tech rooms)
   - "Muscle, breach the door" (bonus to combat rooms)
   - Each crew member has stamina; using them depletes it

3. **LOOT CHOICE**: After clearing a room, choose 1 of 2-3 rewards:
   - Gear (equip to crew), Intel (reveals future floors), Cash (spend at lounges), Crew recruit

**The heist escalation (VS Engine 1)**: Each floor increases security level. Floor 1 has 2 guards. Floor 10 has automated turrets, drones, and the boss. Your crew must grow faster than the building's defenses.

### The Anticipation Phase

**What do they watch unfold?**

When the player selects a room and assigns crew, the **infiltration plays out automatically**:

1. **ENTRY** -- Crew approaches the room. The hacker disables cameras, the muscle kicks the door
2. **ENCOUNTER** -- Room type determines what happens:
   - Combat: Crew auto-fights guards. Abilities trigger based on crew composition and gear
   - Hack: Progress bar fills based on hacker stats. Random events ("Firewall detected! Hacker uses bypass chip")
   - Rest: Crew heals, shops display wares
3. **COMPLICATIONS** -- Random events during infiltration: "Guard reinforcements!", "Alarm triggered -- 30 seconds to disable!", "Secret passage discovered!"
4. **RESOLUTION** -- Room cleared. Loot appears. Player makes next choice
5. **ALARM CASCADE** -- If alarm reaches max, every subsequent room has +50% enemy density. The VS escalation pressure

The anticipation comes from: "My crew is underleveled for this floor... but the vault has the gear I need... the hacker has 2 stamina left... if the hack fails, the alarm goes to max... BUT the loot could be game-changing... GO."

### The Surprise Engine

| Discovery              | Trigger                               | Impact                                                                                             |
| ---------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **Secret floors**      | Find hidden passage in certain rooms  | "There are HIDDEN floors between the main ones!"                                                   |
| **Crew synergies**     | Specific crew pair in same mission    | "The Hacker and the Lockpick together can open ANYTHING"                                           |
| **Gear combos**        | Equip matching set to one crew member | "Full stealth gear = INVISIBLE for 1 room!"                                                        |
| **Intel payoff**       | Collected 3 intel pieces              | "I can see ALL room contents on the next 2 floors!"                                                |
| **Alarm manipulation** | Find "Alarm Override" item            | "I can REDUCE alarm? This changes everything!"                                                     |
| **Heist within heist** | Vault room has a hidden sub-vault     | "Double loot! But double alarm risk!"                                                              |
| **Betrayal event**     | Rare event: one crew member is a mole | "My strongest member just stole half my cash! But now I have a 'Mole Detector' for future runs..." |

### The Zero-to-Hero Arc

| Floor  | Crew State                                    | Tension Level                                    |
| ------ | --------------------------------------------- | ------------------------------------------------ |
| 1-2    | 2 basic crew, no gear. Easy guards            | "Learning the ropes"                             |
| 3-4    | 3 crew, some gear. First route choice matters | "Which path gives me what I need?"               |
| 5-6    | 4 crew, gear synergies forming. Alarm rising  | "Security is getting tight..."                   |
| 7-8    | 4-5 crew, specialized builds. Alarm at 60%    | "Every room is dangerous. Crew barely surviving" |
| 9      | Full crew, ultimate gear. Alarm at 80%        | "One more floor. All or nothing"                 |
| 10     | BOSS VAULT. Everything on the line            | "The heist of a lifetime"                        |
| Escape | Crew runs to roof. Pursuit sequence (auto)    | "GO GO GO! The chopper's waiting!"               |

**The 10-floor structure = 10 minutes**. Each floor is ~1 minute of selection + resolution. The heist narrative naturally creates the compressed hero's journey: nobody to legend in one building.

### Mobile Fit (720x1280 Portrait)

```
┌─────────────────────┐
│  HEIST MAP          │  <- Top 40%: Vertical building
│  Floor 10: [VAULT]  │     cross-section. Current floor
│  Floor 9: [?] [?]   │     highlighted. Paths visible
│  Floor 8: [?] [?][?]│     Past floors greyed out
│  Floor 7: [A]←[B][C]│     ← Current choice
│  Floor 6: [done]    │
│  ...                │
│─────────────────────│
│  ROOM PREVIEW       │  <- Middle 25%: Selected room
│  "Guard Post"       │     details. Risk/reward shown
│  Risk: ██████░░     │     Enemy preview
│  Reward: ★★★        │
│  Enemies: 🤖🤖🤖    │
│─────────────────────│
│  CREW ASSIGNMENT    │  <- Bottom 35%: Your crew
│  [Hacker ★★ HP:80%] │     Tap to assign point role
│  [Muscle ★  HP:60%] │     Stamina bars visible
│  [Medic  ★★ HP:100%]│
│  [INFILTRATE]       │
│  Alarm: ████░░░░ 45%│
└─────────────────────┘
```

### Why This Hasn't Been Done

- **FTL** and **Slay the Spire** use route selection, but neither has a **heist narrative** that creates natural escalation (each floor = deeper in enemy territory)
- **Heist games** (Payday, Monaco) require manual dexterity. A **selection-only heist** is unexplored territory
- The **vertical building** map is uniquely suited to **portrait mobile** -- you literally scroll UP through the building
- **Crew management** adds the auto-battler's "draft and equip" loop to the route-selection format
- Hong Kong's iconic skyscrapers (IFC, ICC, Chungking Mansions) provide perfect theming for a vertical infiltration fantasy

### Risk Assessment

| Risk                                            | Severity | Mitigation                                                                                                                                               |
| ----------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "It's just Slay the Spire with a heist theme"   | HIGH     | Crew management, alarm system, stamina management, and auto-infiltration add 3 systems StS doesn't have. The route is a building, not a tree             |
| Auto-infiltration lacks VS's sensory saturation | HIGH     | Resolution phase must be juiced: breach animations, combat VFX, alarm sirens, neon explosions when clearing rooms. Speed up time for experienced players |
| 10 floors may feel too short for deep strategy  | MEDIUM   | Each floor has 2-3 meaningful decisions (route + crew + loot). That's 20-30 decisions per run, comparable to Slay the Spire                              |
| Heist theme may not appeal to VS's audience     | MEDIUM   | The "crew gets stronger each floor" progression IS the VS hero's journey. Reframe marketing as "roguelike crew builder" not "heist sim"                  |

---

## Comprehensive Comparison

### VS Engine Preservation Matrix

| Engine                     |        Neon Slots         |         Neon Jury          |         Neon Fortune          |       Neon Architect       |        Neon Heist         |
| -------------------------- | :-----------------------: | :------------------------: | :---------------------------: | :------------------------: | :-----------------------: |
| **E1: Zero-to-Hero**       | 5 reels/3 symbols → 5/20+ |  1 fighter → 7 at 3-star   |  4 cards/0 omens → 8/5 omens  | Empty grid → neon fortress | 2 crew → 5 geared legends |
| **E2: Controlled Random**  |    Symbol draft from 3    |    Fighter draft from 3    |     Card hand + Omen shop     |    Module choice from 3    |     Room route choice     |
| **E3: Systemic Surprise**  |  Symbol adjacency combos  | Element + position synergy | Omen multiplicative stacking  | Formation + fusion bonuses |   Crew synergy + events   |
| **E4: Sensory Saturation** | Spin cascade → combat VFX |   Auto-brawl neon chaos    | Score explosion → screen nuke |   Grid becomes neon city   |    Breach + alarm VFX     |
| **E5: Meta Progression**   |   Symbol pool expansion   |   Fighter roster unlock    |    Card + Omen collection     |   Module catalog unlock    |    Crew + gear unlock     |
| **Engine Score**           |          **5/5**          |          **5/5**           |            **5/5**            |          **5/5**           |         **4.5/5**         |

### Selection Purity Check (Zero Dexterity Guarantee)

| Concept            | Player Input                            | Dexterity Required?       | Verdict        |
| ------------------ | --------------------------------------- | ------------------------- | -------------- |
| **Neon Slots**     | Tap "SPIN" + select from market options | None                      | PURE SELECTION |
| **Neon Jury**      | Tap to draft + drag to reposition bench | Minimal (drag to 7 slots) | PURE SELECTION |
| **Neon Fortune**   | Tap cards to select hand + tap PLAY     | None                      | PURE SELECTION |
| **Neon Architect** | Drag modules to 5x5 grid cells          | Minimal (snap-to-grid)    | PURE SELECTION |
| **Neon Heist**     | Tap room on map + tap crew assignment   | None                      | PURE SELECTION |

All 5 concepts pass the CEO's constraint: **zero joystick, zero aiming, zero dodging, zero real-time dexterity.**

### Decision Matrix

| Criterion                | Weight | Neon Slots | Neon Jury | Neon Fortune | Neon Architect | Neon Heist |
| ------------------------ | ------ | :--------: | :-------: | :----------: | :------------: | :--------: |
| **Genre Novelty**        | 20%    |   ★★★★☆    |   ★★★☆☆   |    ★★★★★     |     ★★★★☆      |   ★★★★★    |
| **Selection Purity**     | 20%    |   ★★★★★    |   ★★★★☆   |    ★★★★★     |     ★★★★☆      |   ★★★★★    |
| **VS Engine Fit**        | 20%    |   ★★★★★    |   ★★★★★   |    ★★★★★     |     ★★★★★      |   ★★★★☆    |
| **Hong Kong Theme**      | 15%    |   ★★★★☆    |   ★★★★★   |    ★★★★★     |     ★★★★☆      |   ★★★★★    |
| **Casual Accessibility** | 10%    |   ★★★★★    |   ★★★★☆   |    ★★★★☆     |     ★★★☆☆      |   ★★★★☆    |
| **Prototype Speed**      | 10%    |   ★★★★★    |   ★★★☆☆   |    ★★★★☆     |     ★★★★☆      |   ★★★☆☆    |
| **Monetization Fit**     | 5%     |   ★★★★☆    |   ★★★★☆   |    ★★★★★     |     ★★★★☆      |   ★★★★☆    |
| **WEIGHTED TOTAL**       | 100%   |  **4.35**  | **3.95**  |   **4.60**   |    **4.00**    |  **4.30**  |

### CEO Decision Guide

**Highest Innovation + Market Gap:**

1. **Neon Fortune** (4.60) -- Balatro's $45M success proves poker-roguelike works; adding VS visual combat is the unfilled gap. Culturally unique with HK fortune cards
2. **Neon Slots** (4.35) -- CloverPit's 1M units in 10 weeks proves slot-roguelike works on mobile; adding combat resolution is the unfilled gap
3. **Neon Heist** (4.30) -- Completely uncharted territory (selection-only heist roguelike exists nowhere). Highest creative risk but highest differentiation ceiling

**Safest Bet (Proven Adjacent Market):**

1. **Neon Slots** -- Luck be a Landlord + CloverPit already validated the core loop on PC AND mobile
2. **Neon Fortune** -- Balatro already validated on mobile ($9M+ mobile revenue)
3. **Neon Jury** -- Super Auto Pets validated auto-battler on mobile (10M+ downloads)

**Fastest to Prototype (1-Week Playable):**

1. **Neon Slots** -- Slot machine + symbol pool is simple to implement
2. **Neon Fortune** -- Card hand selection + scoring is straightforward
3. **Neon Architect** -- Grid placement is well-understood engineering

**Recommended 2-Prototype Pairing:**

- **Neon Fortune** (highest weighted score, most innovative combat-score link) + **Neon Slots** (fastest prototype, most casual-accessible)
- These two concepts share NO mechanical overlap, making A/B comparison clean
- Both have proven market adjacencies (Balatro, CloverPit) reducing concept risk

---

## Appendix A: Market Validation Data

| Reference Game     | Genre                   | Revenue/Sales                       | Relevance                                       |
| ------------------ | ----------------------- | ----------------------------------- | ----------------------------------------------- |
| Balatro            | Poker roguelike         | $45M+, 7M copies                    | Proves card-selection roguelike works           |
| CloverPit          | Slot roguelike          | 1M units in 10 weeks, mobile launch | Proves slot-selection roguelike works on mobile |
| Luck be a Landlord | Slot roguelike          | Steam hit, multi-platform           | Proves "probability engineering" is engaging    |
| Slots & Daggers    | Slot + combat roguelike | High Steam wishlists                | Proves slot+combat hybrid has demand            |
| Super Auto Pets    | Auto-battler            | 10M+ downloads                      | Proves selection-only auto-battler works        |
| Slay the Spire 1+2 | Deckbuilder roguelike   | Tens of millions $                  | Proves draft-based roguelike has depth          |
| Survivor.io        | VS-like mobile          | $500M+ IAP                          | Proves VS format works on mobile                |
| AFK Journey        | Idle auto-battler       | 16M downloads (2024)                | Proves auto-resolution + selection works        |

## Appendix B: Reference Sources

- [Balatro success analysis - Oreate AI](https://www.oreateai.com/blog/indepth-analysis-of-the-game-design-philosophy-and-roguelike-mechanisms-in-balatro/4fdfc5f5314b10a83aa161f2aa243254)
- [Balatro addictive behavior through game feel - SSRN](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5699302)
- [CloverPit mobile launch - Medium](https://outrungaming.medium.com/slots-roguelike-cloverpit-launches-on-ios-android-166a3933ef95)
- [Slots & Daggers hype analysis - Adventure Gamers](https://adventuregamers.com/article/slots-and-daggers-hype)
- [Luck be a Landlord design analysis - Indiecator](https://indiecator.org/2021/04/11/indietail-luck-be-a-landlord/)
- [Best auto battlers mobile 2026 - MiniReview](https://minireview.io/top-mobile-games/best-auto-battlers-mobile)
- [Idle roguelike mobile - MiniReview](https://minireview.io/collections/best-idle-and-roguelike-games-ios-may-2025)
- [VS engine dissection](../reference/vs-engine-dissection.md)
- [Hybrid genre analysis](../reference/hybrid-genre-analysis.md)

---

> **Next Step**: CEO selects 1-2 concepts for 1-week rapid prototype. Each prototype needs only: core selection UI + auto-resolution + 3 waves + 5-10 selectable items/units. No art polish, no meta-progression, no boss -- just the core selection-anticipation-resolution loop playable.
