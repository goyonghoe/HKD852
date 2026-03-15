// ── Neon Survivors: Character Definitions ──
// Pure TypeScript — NO Phaser imports.

export interface CharacterDef {
  id: string;
  name: string;
  description: string;
  spritePrefix: string; // e.g., "hero_biker"
  startingWeapon: string; // weapon ID from balance.ts
  passiveBonus: { stat: string; value: number }; // unique passive
}

export const CHARACTERS: CharacterDef[] = [
  {
    id: "biker",
    name: "BIKER",
    description: "+10% Move Speed",
    spritePrefix: "hero_biker",
    startingWeapon: "pistol",
    passiveBonus: { stat: "move_speed", value: 0.1 },
  },
  {
    id: "punk",
    name: "PUNK",
    description: "+15% Damage",
    spritePrefix: "hero_punk",
    startingWeapon: "shotgun",
    passiveBonus: { stat: "damage", value: 0.15 },
  },
  {
    id: "cyborg",
    name: "CYBORG",
    description: "+20% Max HP",
    spritePrefix: "hero_cyborg",
    startingWeapon: "laser",
    passiveBonus: { stat: "max_hp", value: 0.2 },
  },
];

/** Look up a character by id; returns biker as fallback. */
export function getCharacter(id: string): CharacterDef {
  return CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0];
}
