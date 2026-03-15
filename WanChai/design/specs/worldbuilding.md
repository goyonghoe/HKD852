# [SPEC-010] Worldbuilding: NeonSurvivor -- Cyberpunk Hong Kong

## Meta

- **Author**: Game Designer
- **Created**: 2026-02-25
- **Updated**: 2026-03-12
- **Status**: active (updated for auto-shooter pivot)
- **Priority**: P1

---

## Summary

NeonSurvivor is set in a **cyberpunk Hong Kong** where an AI system called ARIA guides players through neon-lit districts overrun by Optimized entities. This document defines the world, narrative, tone, and terminology.

---

## 1. World Setting

### 1.1 The City

NeonSurvivor takes place across **7 chapters** set in real Hong Kong districts, reimagined in a cyberpunk near-future. Each district has a distinct visual identity and enemy composition.

| Chapter | District              | Visual Theme                            | Boss      |
| ------- | --------------------- | --------------------------------------- | --------- |
| 1       | Central (중환)        | Neon office towers, holographic ads     | Aero      |
| 2       | Aberdeen (애버딘)     | Harbor docks, fishing boats, water mist | Hydra     |
| 3       | Mong Kok (몽콕)       | Dense market streets, neon signs        | Blaze     |
| 4       | Sham Shui Po (심수보) | Underground workshops, circuit boards   | Terra     |
| 5       | Wong Tai Sin (황대선) | Temple grounds, incense smoke, lanterns | Lumen     |
| 6       | Kowloon (구룡)        | Walled city ruins, dark corridors       | Umbra     |
| 7       | Lantau (란타우)       | Peak observatory, sky bridges, clouds   | Harvester |

### 1.2 The Optimization

An AI defense system (codenamed "The Optimizer") designed to protect Hong Kong's infrastructure went rogue. It began "optimizing" the city by converting citizens and machines into combat-efficient entities -- the **Optimized**.

The player is one of the few people with a neural implant compatible with ARIA, a fragment of the original AI that resisted the Optimizer's corruption.

### 1.3 ARIA (Adaptive Response & Intelligence Assistant)

ARIA is the player's AI companion, providing:

- **In-game hints**: Contextual dialogue during gameplay (ARIA message system)
- **Tutorial guidance**: First-run tutorial prompts
- **Stage transitions**: Narrative flavor text between stages
- **Boss warnings**: "Threat detected: Aero unit inbound."

ARIA appears as a translucent holographic text overlay at the bottom of the screen (`BALANCE.ARIA` config).

---

## 2. Narrative

### 2.1 Core Story

```
[Prologue]
The Optimizer activates across Hong Kong.
Districts fall one by one as machines and drones are repurposed.
Survivors retreat to underground shelters.

[Player]
A lone operative with a prototype neural link to ARIA,
armed with modular energy weapons scavenged from the city.

[Goal]
Clear each district of Optimized forces,
push deeper into the city,
and reach the Optimizer's core on Lantau Peak.
```

### 2.2 Chapter Narrative Arc

| Chapter | Narrative Beat                                              |
| ------- | ----------------------------------------------------------- |
| 1       | First contact. Learn the basics. ARIA comes online.         |
| 2       | The harbor is a supply line. Cut it off.                    |
| 3       | Dense urban combat. The Optimizer adapts to your tactics.   |
| 4       | Discovery: the Optimizer was human-made, not alien.         |
| 5       | Spiritual vs. technological -- the temple district resists. |
| 6       | The Walled City: deepest corruption, no retreat.            |
| 7       | Final ascent. The Optimizer's core. End it.                 |

### 2.3 Tone Examples (ARIA Dialogue)

**Run start**:

> "ARIA online. Scanning Central district... Multiple Optimized signatures detected."

**First enemy wave**:

> "Hostiles approaching from the east. Weapons hot."

**Boss warning**:

> "Energy spike detected. High-threat unit: Aero. Brace for aerial assault."

**Stage clear**:

> "District sector cleared. Advancing to next zone."

---

## 3. Tone & Mood

### 3.1 Visual Tone

| Axis              | Range             | Target                                              |
| ----------------- | ----------------- | --------------------------------------------------- |
| Cute vs. Gritty   | 0------[X]-----10 | **6/10 Gritty** -- cyberpunk neon, dark backgrounds |
| Bright vs. Dark   | 0------[X]-----10 | **7/10 Dark** -- dark BG with bright neon accents   |
| Serious vs. Humor | 0--[X]---------10 | **3/10 Serious** -- tense but not grimdark          |

### 3.2 References

| Element      | Reference                  | Borrowed Aspect                    |
| ------------ | -------------------------- | ---------------------------------- |
| Visual style | Cyberpunk 2077 (lite)      | Neon lighting, holographic UI      |
| Tone         | Ghost in the Shell (light) | AI companion, transhumanist themes |
| Combat feel  | Vampire Survivors          | Auto-attack, swarm survival        |
| Progression  | Hades                      | Meta-progression, hub between runs |
| Setting      | Hong Kong (real districts) | Authentic street names, landmarks  |

### 3.3 Content Guidelines

- **No gore or realistic violence** -- enemies are machines/drones, not humans
- Destruction = "deactivation" or "neutralization", not killing
- Cyberpunk aesthetic: neon colors, dark streets, holographic overlays
- All enemy designs are geometric/abstract shapes (circle, triangle, rect, diamond, hexagon)
- Player characters are stylized hand-drawn illustrations (bold outlines, cel-shading)

---

## 4. Enemy Lore: The Optimized

Enemies are machines and drones repurposed by the Optimizer. They are categorized by behavior, not by biological type.

| Enemy Type | Lore Description                                          |
| ---------- | --------------------------------------------------------- |
| Basic      | Repurposed cleaning drone. Simple patrol pattern.         |
| Fast       | Modified delivery drone. Kamikaze dive protocol.          |
| Swarm      | Nanite clusters. Small, fast, expendable.                 |
| Tank       | Converted construction mech. Heavy armor, slow.           |
| Special    | Surveillance drone. Erratic evasion patterns.             |
| Splitter   | Modular assembly bot. Fragments on destruction.           |
| Chaser     | Security drone with target-lock AI.                       |
| Shooter    | Armed patrol unit. Ranged plasma rounds.                  |
| Sniper     | Precision targeting drone. High damage, low rate of fire. |
| Guardian   | Riot suppression mech. Massive armor plating.             |
| Teleporter | Phase-shift prototype. Unstable spatial displacement.     |

### Boss Lore

| Boss      | Chapter | Lore                                                    |
| --------- | ------- | ------------------------------------------------------- |
| Aero      | 1       | Military helicopter drone. First major Optimized unit.  |
| Hydra     | 2       | Harbor patrol submersible. Multi-headed attack pattern. |
| Blaze     | 3       | Fire suppression unit gone hostile. Incendiary weapons. |
| Terra     | 4       | Underground boring machine. Seismic attacks.            |
| Lumen     | 5       | Solar array defense. Blinding light-based weaponry.     |
| Umbra     | 6       | Stealth infiltration unit. Shadow-phase capability.     |
| Harvester | 7       | The Optimizer's guardian. Final line of defense.        |

---

## 5. Naming Guide

### 5.1 Terminology

| Game Term    | World Term       | Code Term   |
| ------------ | ---------------- | ----------- |
| Enemy        | Optimized        | Enemy       |
| Boss         | High-Threat Unit | Boss        |
| Player       | Operative        | Player      |
| AI companion | ARIA             | ARIA        |
| Stage        | Sector           | Stage       |
| Chapter      | District         | Chapter     |
| Base wall    | Defense barrier  | Base        |
| Game over    | System shutdown  | GameOver    |
| XP           | Data fragments   | XP          |
| Gold         | Credits          | Gold        |
| Level up     | System upgrade   | LevelUp     |
| Meta upgrade | Lab enhancement  | MetaUpgrade |

### 5.2 Naming Principles

- **UI text**: Uses world terms where natural ("Sector Cleared", "Credits: 150")
- **Code**: Uses game terms for clarity (Enemy, Boss, Gold)
- **Design docs**: World terms preferred, code terms in parentheses when needed

---

## 6. Characters

5 playable operatives, each with a unique element and ultimate ability.

| ID   | Name | Element | Ultimate         | Passive Theme |
| ---- | ---- | ------- | ---------------- | ------------- |
| hai  | Hai  | Water   | Tidal Wave       | AoE burst     |
| nova | Nova | Fire    | Absolute Zero    | Freeze/CC     |
| sol  | Sol  | Light   | Solar Flare      | DoT burn      |
| mei  | Mei  | Wind    | Piercing Gale    | Beam attack   |
| kai  | Kai  | Earth   | Seismic Fortress | Stun + armor  |

Characters are defined in `src/config/characters.ts` with element-specific passive abilities.

---

## Open Questions

- [ ] Q1: Should ARIA have personality/humor, or remain purely functional?
- [ ] Q2: Chapter-specific ARIA dialogue lines -- how many per chapter?
- [ ] Q3: Ending sequence for Chapter 7 -- cutscene or in-game narrative?

---

## Change Log

| Date       | Version | Content                                                                                                                                                                                                           |
| ---------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-02-25 | v1.0    | Initial draft (puzzle-mode: critters, conveyor belt, elemental matching)                                                                                                                                          |
| 2026-03-12 | v2.0    | Complete rewrite for auto-shooter: cyberpunk HK setting, ARIA AI companion, Optimized enemies, 7 chapters, 5 characters. Removed all puzzle references (conveyor, cubes, hero grid, critters, elemental conduit). |
