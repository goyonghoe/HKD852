/**
 * All replaceable sprite texture keys.
 * Place PNG files in public/assets/sprites/{key}.png to override procedural textures.
 */
export const SPRITE_KEYS = [
  'player',
  'enemy_circle',
  'enemy_triangle',
  'enemy_rect',
  'enemy_diamond',
  'enemy_hexagon',
  'projectile_bullet',
  'projectile_laser',
  'projectile_orbit',
  'xp_orb',
  'particle_square',
  'particle_glow',
] as const;

export type SpriteKey = (typeof SPRITE_KEYS)[number];
