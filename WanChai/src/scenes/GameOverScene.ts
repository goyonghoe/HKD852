import Phaser from 'phaser';
import { BG_COLOR, NEON_CSS } from '../config/colors';
import { BALANCE } from '../config/balance';
import { GAME_WIDTH } from '../config/game-config';
import { SaveManager } from '../managers/SaveManager';
import { createButton } from '../ui/ButtonFactory';
import { getRetroAudio } from '../audio/RetroAudio';
import { getRetroSFX } from '../audio/RetroSFX';
import { getAudioManager } from '../audio/AudioManager';
import { trackEvent } from '../lib/analytics';
import { t } from '../lib/i18n';
import { checkAchievements, ACHIEVEMENTS } from '../core/Achievements';
import { submitChallengeScore, getChallengeLeaderboard, type ChallengeScore } from '../core/ChallengeMode';
import { formatTimeMs, formatNumber, calculateCritRate, calculateWeaponDmgPercent } from '../core/GameStatFormatting';
import {
  calculateStatSpacing,
  isCurrentRunMatch,
  sortWeaponsByDamage,
  calculateBaseHpPercent,
  calculateButtonBaseY,
  calculateAchievementNotifyY,
  checkNewRecords,
} from '../core/GameOverCalc';
import { navigateScene } from '../utils/SceneNav';
import type { RunEndData } from '../types/game';

interface GameOverData {
  survived: boolean;
  kills: number;
  gold: number;
  level: number;
  timeMs: number;
  baseHpRemaining?: number;
  stage?: number;
  maxStages?: number;
  characterId?: string;
  weaponsUsed?: number;
  highestWeaponLevel?: number;
  bossKills?: number;
  challengeMode?: boolean;
  totalDamageDealt?: number;
  weaponDamageMap?: Record<string, number>;
  critHitsLanded?: number;
  totalHitsLanded?: number;
  highestSingleHit?: number;
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data: GameOverData): void {
    this.cameras.main.setBackgroundColor(BG_COLOR);
    this.cameras.main.fadeIn(300);
    getRetroAudio().switchTrack('menu');
    const am = getAudioManager();
    am.setScene(this);
    am.stopBGM();
    const cx = GAME_WIDTH / 2;

    const title = data.survived ? t('gameover.victory') : t('gameover.defeat');
    const titleColor = data.survived ? NEON_CSS.UI_ACCENT : NEON_CSS.HEALTH;

    this.add
      .text(cx, 60, title, {
        fontSize: '60px',
        color: titleColor,
        fontFamily: 'monospace',
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5);

    const timeStr = formatTimeMs(data.timeMs);

    const baseHp = data.baseHpRemaining ?? 0;
    const baseHpPct = calculateBaseHpPercent(baseHp, BALANCE.BASE.hp);

    const stage = data.stage ?? 1;
    const maxStages = data.maxStages ?? BALANCE.STAGE.maxStages;

    const stats = [
      t('gameover.stage', { current: stage, max: maxStages }),
      t('gameover.time', { time: timeStr }),
      t('gameover.level', { level: data.level }),
      t('gameover.kills', { kills: data.kills }),
      t('gameover.data', { gold: data.gold }),
      data.survived
        ? t('gameover.resistance_alive', { hp: Math.round(baseHp), pct: baseHpPct })
        : t('gameover.resistance_dead'),
    ];

    // Extra stats: weapons used and highest weapon level
    if (data.weaponsUsed != null && data.weaponsUsed > 0) {
      stats.push(t('gameover.weapons_used', { count: data.weaponsUsed }));
    }
    if (data.highestWeaponLevel != null && data.highestWeaponLevel > 0) {
      stats.push(t('gameover.highest_weapon_level', { level: data.highestWeaponLevel }));
    }

    // === Damage Breakdown Stats ===
    const totalDmg = data.totalDamageDealt ?? 0;
    if (totalDmg > 0) {
      stats.push(t('gameover.total_damage', { damage: formatNumber(totalDmg) }));

      // Highest single hit
      const highHit = data.highestSingleHit ?? 0;
      if (highHit > 0) {
        stats.push(t('gameover.highest_hit', { damage: formatNumber(highHit) }));
      }

      // Crit rate (use total hits landed as denominator, not kills)
      const critHits = data.critHitsLanded ?? 0;
      const totalHits = data.totalHitsLanded ?? 0;
      const critPct = calculateCritRate(critHits, totalHits);
      stats.push(t('gameover.crit_rate', { rate: critPct }));

      // Top 3 weapons by damage
      const weaponMap = data.weaponDamageMap ?? {};
      const sortedWeapons = sortWeaponsByDamage(weaponMap, 3);
      if (sortedWeapons.length > 0) {
        for (const [wId, wDmg] of sortedWeapons) {
          const pct = calculateWeaponDmgPercent(wDmg, totalDmg);
          const weaponName = t(`weapon.${wId}`);
          stats.push(t('gameover.weapon_damage', { name: weaponName, pct }));
        }
      }
    }

    // Scale stat spacing based on count to fit between title and buttons
    const statStartY = 130;
    const statSpacing = calculateStatSpacing(stats.length);

    stats.forEach((line, i) => {
      this.add
        .text(cx, statStartY + i * statSpacing, line, {
          fontSize: '24px',
          color: NEON_CSS.UI_TEXT,
          fontFamily: 'monospace',
          wordWrap: { width: GAME_WIDTH - 60 },
        })
        .setOrigin(0.5);
    });

    trackEvent('game_over', {
      stage: data.stage ?? 1,
      kills: data.kills,
      goldEarned: data.gold,
      timeMs: data.timeMs,
      survived: data.survived,
    });

    if (data.survived) {
      trackEvent('run_complete', {
        stage: data.stage ?? 1,
        kills: data.kills,
        gold: data.gold,
        timeMs: data.timeMs,
        characterId: data.characterId ?? 'unknown',
        level: data.level,
      });
    }

    // Save gold + records immediately (prevents loss on force-quit)
    const meta = SaveManager.loadMeta();
    meta.totalGold += data.gold;
    meta.totalGoldEarned = (meta.totalGoldEarned ?? 0) + data.gold;
    const recordCheck = checkNewRecords(
      { kills: data.kills, level: data.level, timeMs: data.timeMs },
      { bestKills: meta.bestKills ?? 0, bestLevel: meta.bestLevel ?? 0, bestTimeMs: meta.bestTimeMs ?? 0 },
    );
    const isNewRecord = recordCheck.isNewRecord;
    if (recordCheck.fields.includes('kills')) {
      meta.bestKills = data.kills;
    }
    if (recordCheck.fields.includes('level')) {
      meta.bestLevel = data.level;
    }
    if (recordCheck.fields.includes('timeMs')) {
      meta.bestTimeMs = data.timeMs;
    }
    // Track boss kills on meta
    if (data.bossKills && data.bossKills > 0) {
      meta.totalBossKills = (meta.totalBossKills ?? 0) + data.bossKills;
    }

    SaveManager.saveMeta(meta);

    // === Achievement check ===
    const runEndData: RunEndData = {
      kills: data.kills,
      gold: data.gold,
      level: data.level,
      timeMs: data.timeMs,
      weaponsUsed: data.weaponsUsed ?? 0,
      highestWeaponLevel: data.highestWeaponLevel ?? 0,
      bossKills: data.bossKills ?? 0,
      survived: data.survived,
      totalDamageDealt: data.totalDamageDealt,
      weaponDamageMap: data.weaponDamageMap,
      critHitsLanded: data.critHitsLanded,
      totalHitsLanded: data.totalHitsLanded,
      highestSingleHit: data.highestSingleHit,
    };
    const freshMeta = SaveManager.loadMeta();
    const newAchievements = checkAchievements(freshMeta, runEndData);
    if (newAchievements.length > 0) {
      const updatedMeta = SaveManager.loadMeta();
      updatedMeta.unlockedAchievements = updatedMeta.unlockedAchievements ?? [];
      let totalAchievementGold = 0;
      for (const achId of newAchievements) {
        updatedMeta.unlockedAchievements.push(achId);
        const reward = ACHIEVEMENTS[achId]?.goldReward ?? 0;
        totalAchievementGold += reward;
      }
      updatedMeta.totalGold += totalAchievementGold;
      updatedMeta.totalGoldEarned = (updatedMeta.totalGoldEarned ?? 0) + totalAchievementGold;
      SaveManager.saveMeta(updatedMeta);

      // Play achievement SFX
      getRetroSFX().achievementUnlock();

      // Display achievement notifications
      const achieveY = calculateAchievementNotifyY(statStartY, stats.length, statSpacing, isNewRecord);
      newAchievements.forEach((achId, idx) => {
        const def = ACHIEVEMENTS[achId];
        if (!def) return;
        const achName = t(def.nameKey);
        const achText = this.add
          .text(
            cx,
            achieveY + idx * 40,
            `${t('achievement.unlocked')} ${achName} ${t('achievement.reward', { gold: def.goldReward })}`,
            {
              fontSize: '20px',
              color: NEON_CSS.GOLD,
              fontFamily: 'monospace',
              fontStyle: 'bold',
              wordWrap: { width: GAME_WIDTH - 80 },
            },
          )
          .setOrigin(0.5)
          .setAlpha(0);
        this.tweens.add({
          targets: achText,
          alpha: 1,
          y: achieveY + idx * 40 - 10,
          duration: 400,
          delay: idx * 300,
          ease: 'Back.easeOut',
        });
      });
    }

    if (isNewRecord) {
      const recordY = statStartY + stats.length * statSpacing + 20;
      this.add
        .text(cx, recordY, t('gameover.new_record'), {
          fontSize: '38px',
          color: NEON_CSS.GOLD,
          fontFamily: 'monospace',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
    }

    // Submit challenge score if applicable
    let leaderboard: ChallengeScore[] = [];
    if (data.challengeMode) {
      leaderboard = submitChallengeScore({
        kills: data.kills,
        gold: data.gold,
        timeMs: data.timeMs,
        level: data.level,
        survived: data.survived,
      });
    }

    // === Challenge Leaderboard display (only for challenge mode) ===
    let leaderboardHeight = 0;
    if (data.challengeMode) {
      if (leaderboard.length === 0) {
        leaderboard = getChallengeLeaderboard();
      }
      leaderboardHeight = this.renderLeaderboard(
        cx,
        statStartY +
          stats.length * statSpacing +
          (isNewRecord ? 70 : 30) +
          (newAchievements.length > 0 ? newAchievements.length * 40 + 10 : 0),
        leaderboard,
        data,
      );
    }

    // Guard: prevent double-tap incrementing runsCompleted twice
    let runCounted = false;
    const countRun = () => {
      if (runCounted) return;
      runCounted = true;
      const m = SaveManager.loadMeta();
      m.runsCompleted = (m.runsCompleted ?? 0) + 1;
      SaveManager.saveMeta(m);
    };

    // Adjust button Y positions based on whether leaderboard is shown
    const btnBaseY = calculateButtonBaseY({
      challengeMode: data.challengeMode ?? false,
      statStartY,
      statsCount: stats.length,
      statSpacing,
      isNewRecord,
      achievementCount: newAchievements.length,
      leaderboardHeight,
    });
    const btnGap = 80;

    // Upgrade button (primary) — bottom 1/3 zone
    createButton(this, {
      x: cx,
      y: btnBaseY,
      width: 280,
      height: 60,
      label: t('gameover.upgrade', { gold: data.gold }),
      fontSize: '28px',
      variant: 'primary',
      onClick: () => {
        countRun();
        navigateScene(this, 'GameOverScene', 'MetaScene');
      },
    });

    // Retry button
    createButton(this, {
      x: cx,
      y: btnBaseY + btnGap,
      width: 240,
      height: 56,
      label: t('gameover.retry'),
      fontSize: '26px',
      variant: 'secondary',
      onClick: () => {
        countRun();
        navigateScene(this, 'GameOverScene', 'RunScene', { characterId: data.characterId });
      },
    });

    // Menu button
    createButton(this, {
      x: cx,
      y: btnBaseY + btnGap * 2,
      width: 240,
      height: 56,
      label: t('gameover.main_menu'),
      fontSize: '26px',
      variant: 'secondary',
      onClick: () => {
        countRun();
        navigateScene(this, 'GameOverScene', 'MainMenuScene');
      },
    });
  }

  /**
   * Render leaderboard table for challenge mode.
   * Returns the total height consumed by the leaderboard section.
   */
  private renderLeaderboard(
    cx: number,
    startY: number,
    leaderboard: ChallengeScore[],
    currentRun: GameOverData,
  ): number {
    const maxVisible = 5;
    const rowH = 28;
    let y = startY;

    // Title
    this.add
      .text(cx, y, t('leaderboard.title'), {
        fontSize: '26px',
        color: NEON_CSS.UI_ACCENT,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    y += 36;

    if (leaderboard.length === 0) {
      this.add
        .text(cx, y, t('challenge.no_scores'), {
          fontSize: '22px',
          color: NEON_CSS.UI_DIM,
          fontFamily: 'monospace',
        })
        .setOrigin(0.5);
      y += rowH;
      return y - startY;
    }

    // Column headers
    const colRankX = cx - 200;
    const colKillsX = cx - 40;
    const colTimeX = cx + 140;

    this.add
      .text(colRankX, y, t('leaderboard.rank'), {
        fontSize: '18px',
        color: NEON_CSS.UI_DIM,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);
    this.add
      .text(colKillsX, y, t('leaderboard.kills'), {
        fontSize: '18px',
        color: NEON_CSS.UI_DIM,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);
    this.add
      .text(colTimeX, y, t('leaderboard.time'), {
        fontSize: '18px',
        color: NEON_CSS.UI_DIM,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);
    y += rowH;

    // Determine if current run is on leaderboard
    const visible = leaderboard.slice(0, maxVisible);

    visible.forEach((entry, idx) => {
      const rank = idx + 1;
      const isCurrentRun = isCurrentRunMatch(entry, currentRun);
      const color = isCurrentRun ? NEON_CSS.UI_ACCENT : NEON_CSS.UI_TEXT;
      const fontSize = '22px';

      // Rank
      this.add
        .text(colRankX, y, `#${rank}`, {
          fontSize,
          color,
          fontFamily: 'monospace',
          fontStyle: isCurrentRun ? 'bold' : 'normal',
        })
        .setOrigin(0, 0.5);

      // Kills
      this.add
        .text(colKillsX, y, `${entry.kills}`, {
          fontSize,
          color,
          fontFamily: 'monospace',
          fontStyle: isCurrentRun ? 'bold' : 'normal',
        })
        .setOrigin(0, 0.5);

      // Time
      this.add
        .text(colTimeX, y, formatTimeMs(entry.timeMs), {
          fontSize,
          color,
          fontFamily: 'monospace',
          fontStyle: isCurrentRun ? 'bold' : 'normal',
        })
        .setOrigin(0, 0.5);

      // Current run indicator
      if (isCurrentRun) {
        this.add
          .text(cx + 260, y, t('leaderboard.current_run'), {
            fontSize: '16px',
            color: NEON_CSS.UI_ACCENT,
            fontFamily: 'monospace',
            fontStyle: 'bold',
          })
          .setOrigin(0, 0.5);
      }

      y += rowH;
    });

    // Show "...+N more" if there are more entries
    if (leaderboard.length > maxVisible) {
      const remaining = leaderboard.length - maxVisible;
      this.add
        .text(cx, y, t('leaderboard.more', { count: remaining }), {
          fontSize: '18px',
          color: NEON_CSS.UI_DIM,
          fontFamily: 'monospace',
        })
        .setOrigin(0.5);
      y += rowH;
    }

    return y - startY;
  }
}
