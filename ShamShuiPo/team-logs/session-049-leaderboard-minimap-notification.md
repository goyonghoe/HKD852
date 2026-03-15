# Session 049 — LeaderboardCalc + MinimapCalc + NotificationCalc

**Date**: 2026-03-13
**Round**: 49

## Modules Created/Fixed

| Module           | Lines | Tests | Description                                               |
| ---------------- | ----- | ----- | --------------------------------------------------------- |
| LeaderboardCalc  | ~113  | 55    | High score board, rank/percentile, personal best, stats   |
| MinimapCalc      | ~214  | 65    | Minimap coords, markers, camera viewport, enemy dots      |
| NotificationCalc | ~180  | 59    | Toast/notification queue, priority, expiry, read tracking |

## Issues & Fixes

1. **Linter reverted LeaderboardCalc**: Agent created complex API (playerId, rank, sortBy, removeEntry, mergeLeaderboards). Linter reverted to simpler API (playerName, score, wave, time, date, character). Test had to be fully rewritten to match simple API.
2. **Linter reverted MinimapCalc**: Removed `size`, `centerX`, `centerY` from MinimapConfig and `getDefaultMinimapConfig`/`getEnemyDots`. Re-applied edits — GameScene.ts depends on these.
3. **Agent test API mismatch (all 3 modules)**: All 3 agent-generated tests used invented function names not in source. Required full rewrites.
4. **NotificationCalc test**: Used `pushNotification`, `tick`, `dismissAll` — none exist. Rewritten to use actual API.
5. **MinimapCalc test**: Used wrong signatures for `getEnemyDots`. Rewritten with correct `(enemies, playerX, playerY, config)` signature.

## Metrics

- **Core modules**: 93
- **Test files**: 92
- **Total tests**: 4,688
- **Build**: ✓
- **Deploy**: ✓ (neon-survivors-tau.vercel.app)
- **Type check**: ✓ clean
