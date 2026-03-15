# Session 047 — QuestCalc + AchievementCalc + DialogueCalc

**Date**: 2026-03-13
**Round**: 47

## Modules Created/Fixed

| Module          | Lines | Tests | Description                                                  |
| --------------- | ----- | ----- | ------------------------------------------------------------ |
| QuestCalc       | ~372  | 55    | 6 quest types, 3 rarities, 16 templates, daily generation    |
| AchievementCalc | ~451  | 55    | 6 categories, 4 tiers, 22 achievements, progress tracking    |
| DialogueCalc    | ~223  | 52    | Branching dialogue, flag conditions, visit tracking, history |

## Issues & Fixes

1. **QuestCalc test full rewrite**: Agent used `addQuest`, `checkCompletion`, `removeQuest`, `getActiveQuests`, `getCompletedQuests`, `generateRunQuests` — all nonexistent. Source exports: `createQuestState`, `generateDailyQuests`, `updateProgress`, `claimReward`, etc. Full rewrite.
2. **AchievementCalc test full rewrite**: Agent used `ACHIEVEMENTS`, `checkAchievements`, `getAchievementProgress`, `RunStats`, `AchievementDef` — none existed. Source exports: `ACHIEVEMENT_DEFS`, `createAchievementState`, `checkProgress`, `unlockAchievement`, etc. Full rewrite.
3. **DialogueCalc test full rewrite**: Agent used `advanceLine`, `selectChoice`, `getCurrentLine`, `isDialogueActive`, `endDialogue`, `buildDialogueScript` — all wrong. Source exports: `createDialogueState`, `startDialogue`, `advanceDialogue`, `getCurrentNode`, etc. Full rewrite.
4. **Template count off-by-one**: QuestCalc has 16 templates (not 15 as I initially wrote). Fixed test assertion.
5. **Unused type imports**: Removed `AchievementCategory`, `AchievementTier` from AchievementCalc test.

## Metrics

- **Core modules**: 91
- **Test files**: 90
- **Total tests**: 4,472
- **Build**: ✓
- **Deploy**: ✓ (neon-survivors-tau.vercel.app)
- **Type check**: ✓ clean
