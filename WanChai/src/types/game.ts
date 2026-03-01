export interface RunState {
  runTime: number;        // ms elapsed
  playerLevel: number;
  playerXp: number;
  baseHp: number;         // current base wall HP
  baseMaxHp: number;      // max base wall HP
  kills: number;
  gold: number;           // earned this run
  weapons: string[];      // weapon IDs equipped
  passives: string[];     // passive upgrade IDs
}

export interface MetaState {
  totalGold: number;
  highScore: number;
  bestKills: number;
  bestLevel: number;
  bestTimeMs: number;
  upgrades: Record<string, number>; // upgradeId → level
  runsCompleted: number;
}

export type GamePhase = 'playing' | 'levelup' | 'paused' | 'gameover' | 'shop';
