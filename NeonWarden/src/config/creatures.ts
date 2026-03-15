export type CreatureRole = "Producer" | "Predator" | "Symbiont";

export interface CreatureDef {
  id: string;
  name: string;
  role: CreatureRole;
  pop: number; // Population cost
  cp: number; // Combat Power
  fr: number; // Feed Rate (energy consumed per tick)
  or: number; // Output Rate (energy produced per tick)
  rr: number; // Reproduction Rate (ticks to reproduce, 0 = never)
  res: number; // Resilience (survival priority)
  trait: string; // Display name of trait
  traitDesc: string; // Description of trait effect
}

export const CREATURE_DEFS: CreatureDef[] = [
  // Producers
  {
    id: "P01",
    name: "Neon Moss",
    role: "Producer",
    pop: 1,
    cp: 0,
    fr: 0,
    or: 2,
    rr: 5,
    res: 3,
    trait: "Photosynthetic",
    traitDesc: "0 feed cost, auto-reproduces",
  },
  {
    id: "P02",
    name: "Circuit Fungus",
    role: "Producer",
    pop: 1,
    cp: 0,
    fr: 0,
    or: 3,
    rr: 7,
    res: 2,
    trait: "Networked",
    traitDesc: "+1 OR per adjacent Producer",
  },
  {
    id: "P03",
    name: "Data Coral",
    role: "Producer",
    pop: 2,
    cp: 0,
    fr: 1,
    or: 6,
    rr: 8,
    res: 5,
    trait: "Archive",
    traitDesc: "Stores excess energy (up to 15)",
  },
  {
    id: "P04",
    name: "Quantum Garden",
    role: "Producer",
    pop: 3,
    cp: 0,
    fr: 2,
    or: 10,
    rr: 0,
    res: 8,
    trait: "Superposition",
    traitDesc: "OR randomly doubles or halves",
  },
  // Predators
  {
    id: "D01",
    name: "Street Wolf",
    role: "Predator",
    pop: 2,
    cp: 5,
    fr: 3,
    or: 0,
    rr: 6,
    res: 6,
    trait: "Pack Hunter",
    traitDesc: "+2 CP per other Predator (max +6)",
  },
  {
    id: "D02",
    name: "Chrome Raptor",
    role: "Predator",
    pop: 3,
    cp: 10,
    fr: 5,
    or: 0,
    rr: 0,
    res: 10,
    trait: "Apex",
    traitDesc: "Cannot reproduce",
  },
  {
    id: "D03",
    name: "Neon Viper",
    role: "Predator",
    pop: 2,
    cp: 4,
    fr: 2,
    or: 0,
    rr: 5,
    res: 4,
    trait: "Venomous",
    traitDesc: "Deals 2x damage to threats",
  },
  // Symbionts
  {
    id: "S01",
    name: "Glowfly Swarm",
    role: "Symbiont",
    pop: 1,
    cp: 0,
    fr: 1,
    or: 1,
    rr: 4,
    res: 2,
    trait: "Pollinate",
    traitDesc: "Bonded Producer gets +50% OR",
  },
  {
    id: "S02",
    name: "Neon Lichen",
    role: "Symbiont",
    pop: 1,
    cp: 0,
    fr: 1,
    or: 0,
    rr: 6,
    res: 3,
    trait: "Armor Coat",
    traitDesc: "Bonded creature gets +5 RES",
  },
  {
    id: "S03",
    name: "Data Sprite",
    role: "Symbiont",
    pop: 2,
    cp: 3,
    fr: 2,
    or: 2,
    rr: 0,
    res: 5,
    trait: "Mirror",
    traitDesc: "Copies bonded creature's trait",
  },
];

export const ROLE_COLORS: Record<CreatureRole, number> = {
  Producer: 0x00ff88,
  Predator: 0xff4444,
  Symbiont: 0x4488ff,
};

export const ROLE_LETTERS: Record<CreatureRole, string> = {
  Producer: "P",
  Predator: "D",
  Symbiont: "S",
};
