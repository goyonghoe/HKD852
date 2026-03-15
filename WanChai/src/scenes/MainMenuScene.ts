import Phaser from 'phaser';
import { BG_COLOR, NEON, NEON_CSS, TEX, UI_CSS } from '../config/colors';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/game-config';
import { BALANCE, MENU } from '../config/balance';
import { createButton } from '../ui/ButtonFactory';
import { getRetroAudio } from '../audio/RetroAudio';
import { getRetroSFX } from '../audio/RetroSFX';
import { getAudioManager } from '../audio/AudioManager';
import { SettingsOverlay } from '../ui/SettingsOverlay';
import { SaveManager } from '../managers/SaveManager';
import { t } from '../lib/i18n';
import { getWeeklyChallenge } from '../core/ChallengeMode';
import { resolveTexture } from '../config/atlas-manifest';
import { navigateScene } from '../utils/SceneNav';

export class MainMenuScene extends Phaser.Scene {
  private settingsOverlay?: SettingsOverlay;
  private parallaxLayers: Phaser.GameObjects.TileSprite[] = [];
  private neonParticles: { obj: Phaser.GameObjects.Arc; tween: Phaser.Tweens.Tween }[] = [];

  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create(): void {
    this.settingsOverlay = undefined;
    this.parallaxLayers = [];
    this.neonParticles = [];
    this.cameras.main.setBackgroundColor(BG_COLOR);
    this.cameras.main.fadeIn(300);
    getRetroAudio().switchTrack('menu');
    const am = getAudioManager();
    am.setScene(this);
    am.playBGM('bgm_menu');
    const cx = GAME_WIDTH / 2;

    // === Parallax background ===
    this.createParallaxBackground();

    // === Neon floating particles ===
    this.createNeonParticles();

    // === Title logo with glow pulse ===
    this.createLogo(cx);

    // ARIA node label
    this.add
      .text(cx, 230, 'ARIA-01  ·  HONG KONG', {
        fontSize: '22px',
        color: NEON_CSS.UI_DIM,
        fontFamily: 'monospace',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(10);

    // Tagline
    this.add
      .text(cx, 270, t('menu.tagline'), {
        fontSize: '24px',
        color: NEON_CSS.UI_DIM,
        fontFamily: 'monospace',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(10);

    // Best record display
    if (SaveManager.hasProgression()) {
      const meta = SaveManager.loadMeta();
      const records: string[] = [];
      if (meta.bestLevel > 0) records.push(`LV ${meta.bestLevel}`);
      if (meta.bestKills > 0) records.push(`${meta.bestKills} KILL`);
      if (meta.runsCompleted > 0) records.push(`${meta.runsCompleted} RUN`);
      if (records.length > 0) {
        this.add
          .text(cx, 310, records.join('  ·  '), {
            fontSize: '20px',
            color: NEON_CSS.GOLD,
            fontFamily: 'monospace',
          })
          .setOrigin(0.5)
          .setDepth(10);
      }
    }

    // === Glassmorphism panel behind buttons ===
    this.createGlassPanel(cx);

    // === Main play button — large, center ===
    createButton(this, {
      x: cx,
      y: 420,
      width: 340,
      height: 80,
      label: t('menu.play'),
      fontSize: '40px',
      variant: 'primary',
      depth: 20,
      onClick: () => {
        this.input.enabled = false;
        this.cameras.main.fadeOut(300);
        this.time.delayedCall(300, () => navigateScene(this, 'MainMenuScene', 'CharacterSelectScene'));
      },
    });

    // === Challenge mode button ===
    createButton(this, {
      x: cx,
      y: 510,
      width: 260,
      height: 56,
      label: t('challenge.button'),
      fontSize: '26px',
      variant: 'secondary',
      depth: 20,
      onClick: () => {
        const challenge = getWeeklyChallenge();
        this.input.enabled = false;
        this.cameras.main.fadeOut(300);
        this.time.delayedCall(300, () => {
          navigateScene(this, 'MainMenuScene', 'RunScene', {
            challengeMode: true,
            seed: challenge.seed,
            characterId: challenge.characterId,
            weaponId: challenge.startWeapon,
            modifier: challenge.modifier,
          });
        });
      },
    });

    // === Bottom icon button row ===
    const iconY = 630;
    const iconW = 140;
    const iconH = 70;
    const gap = 16;
    const totalW = 4 * iconW + 3 * gap;
    const startX = cx - totalW / 2 + iconW / 2;

    const menuItems = [
      { label: t('menu.weapons'), onClick: () => navigateScene(this, 'MainMenuScene', 'WeaponCodexScene') },
      { label: t('menu.enemies'), onClick: () => navigateScene(this, 'MainMenuScene', 'EnemyCodexScene') },
      { label: t('menu.map'), onClick: () => navigateScene(this, 'MainMenuScene', 'WorldMapScene') },
      {
        label: t('menu.settings'),
        onClick: () => {
          if (!this.settingsOverlay) this.settingsOverlay = new SettingsOverlay(this);
          this.settingsOverlay.show();
        },
      },
    ];

    menuItems.forEach((item, i) => {
      const bx = startX + i * (iconW + gap);
      this.createIconButton(bx, iconY, iconW, iconH, item.label, i, item.onClick);
    });

    // === Daily Streak Badge ===
    this.showStreakBadge(cx);

    // === Daily Reward Popup ===
    this.time.delayedCall(400, () => this.showDailyRewardPopup());
  }

  update(_time: number, delta: number): void {
    // Scroll parallax layers
    const dtSec = delta / 1000;
    for (let i = 0; i < this.parallaxLayers.length; i++) {
      const layer = this.parallaxLayers[i];
      const speed = MENU.PARALLAX.scrollSpeed * MENU.PARALLAX.layerSpeedFactors[i];
      layer.tilePositionX += speed * dtSec;
    }
  }

  /** Create parallax background using loaded sprite layers. */
  private createParallaxBackground(): void {
    const setIdx = MENU.PARALLAX.setIndex;
    const layerKeys = MENU.PARALLAX.layerKeys;

    for (let i = 0; i < layerKeys.length; i++) {
      const key = `parallax_${setIdx}_${layerKeys[i]}`;
      if (this.textures.exists(key)) {
        const tile = this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, key).setOrigin(0, 0).setDepth(i);
        this.parallaxLayers.push(tile);
      }
    }

    // If no parallax layers loaded, draw gradient fallback
    if (this.parallaxLayers.length === 0) {
      const g = this.add.graphics().setDepth(0);
      // Gradient from dark blue to near-black
      const steps = 8;
      const stepH = GAME_HEIGHT / steps;
      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        const r = Math.floor(10 + t * 6);
        const gb = Math.floor(10 + t * 16);
        const color = (r << 16) | (gb << 8) | (gb + 10);
        g.fillStyle(color);
        g.fillRect(0, s * stepH, GAME_WIDTH, stepH + 1);
      }
    }

    // Slight dark overlay for readability
    const overlay = this.add.graphics().setDepth(5);
    overlay.fillStyle(NEON.BG_BLACK, 0.35);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  /** Create floating neon particles in the background. */
  private createNeonParticles(): void {
    const cfg = MENU.NEON_PARTICLES;
    const colors = [NEON.UI_ACCENT, NEON.XP_BAR, NEON.GOLD, NEON.XP_ORB];

    for (let i = 0; i < cfg.count; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT);
      const size = Phaser.Math.FloatBetween(cfg.minSize, cfg.maxSize);
      const color = colors[i % colors.length];
      const alpha = Phaser.Math.FloatBetween(cfg.minAlpha, cfg.maxAlpha);

      const circle = this.add.circle(x, y, size, color, alpha).setDepth(6);

      const duration = Phaser.Math.Between(cfg.minDuration, cfg.maxDuration);
      const targetY = Phaser.Math.Between(0, GAME_HEIGHT);
      const targetX = x + Phaser.Math.Between(-100, 100);

      const tween = this.tweens.add({
        targets: circle,
        x: Phaser.Math.Clamp(targetX, 0, GAME_WIDTH),
        y: targetY,
        alpha: { from: alpha, to: Phaser.Math.FloatBetween(cfg.minAlpha, cfg.maxAlpha) },
        duration,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      this.neonParticles.push({ obj: circle, tween });
    }
  }

  /** Create title logo with glow pulse animation. */
  private createLogo(cx: number): void {
    const logoY = MENU.LOGO.y;

    const logoTex = resolveTexture(this, 'logo_main');
    if (logoTex) {
      const logo = this.add.image(cx, logoY, logoTex.texture, logoTex.frame).setOrigin(0.5).setDepth(10);
      const maxW = GAME_WIDTH - 80;
      if (logo.width > maxW) {
        logo.setScale(maxW / logo.width);
      }

      // Glow pulse
      this.tweens.add({
        targets: logo,
        alpha: { from: MENU.LOGO.glowPulseMax, to: MENU.LOGO.glowPulseMin },
        duration: MENU.LOGO.glowPulseDuration,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    } else {
      // Fallback: text-based title with glow pulse
      const titleText = this.add
        .text(cx, 100, 'NEXT STOP', {
          fontSize: '80px',
          color: NEON_CSS.UI_ACCENT,
          fontFamily: 'monospace',
          fontStyle: 'bold',
          align: 'center',
        })
        .setOrigin(0.5)
        .setDepth(10);

      this.add
        .text(cx, 180, '— HK852', {
          fontSize: '56px',
          color: NEON_CSS.UI_TEXT,
          fontFamily: 'monospace',
          fontStyle: 'bold',
          align: 'center',
        })
        .setOrigin(0.5)
        .setDepth(10);

      // Glow pulse on title
      this.tweens.add({
        targets: titleText,
        alpha: { from: MENU.LOGO.glowPulseMax, to: MENU.LOGO.glowPulseMin },
        duration: MENU.LOGO.glowPulseDuration,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  /** Create glassmorphism panel behind main buttons. */
  private createGlassPanel(cx: number): void {
    const cfg = MENU.GLASS_PANEL;
    const g = this.add.graphics().setDepth(8);
    const hw = cfg.width / 2;
    const hh = cfg.height / 2;
    const py = cfg.y;

    // Semi-transparent fill
    g.fillStyle(NEON.UI_PANEL, cfg.alpha);
    g.fillRoundedRect(cx - hw, py - hh, cfg.width, cfg.height, cfg.radius);

    // Border glow
    g.lineStyle(1, NEON.UI_ACCENT, cfg.borderAlpha);
    g.strokeRoundedRect(cx - hw, py - hh, cfg.width, cfg.height, cfg.radius);

    // Inner top highlight (glass effect)
    g.lineStyle(1, NEON.UI_TEXT, 0.08);
    g.lineBetween(cx - hw + cfg.radius, py - hh + 1, cx + hw - cfg.radius, py - hh + 1);
  }

  /** Show persistent streak badge near the top of the screen. */
  private showStreakBadge(cx: number): void {
    const meta = SaveManager.loadMeta();
    const streak = meta.dailyStreak ?? 0;
    if (streak === 0) return;

    const reward = SaveManager.checkDailyReward();
    const isAvailable = reward !== null;

    const badgeX = cx;
    const badgeY = 60;
    const badgeW = 120;
    const badgeH = 36;

    const badgeContainer = this.add.container(badgeX, badgeY).setDepth(200);

    const badgeBg = this.add.graphics();
    const bgColor = isAvailable ? NEON.GOLD : NEON.UI_PANEL;
    const borderColor = isAvailable ? NEON.GOLD : NEON.UI_BORDER;
    const bgAlpha = isAvailable ? 0.9 : 0.5;
    badgeBg.fillStyle(bgColor, bgAlpha);
    badgeBg.fillRoundedRect(-badgeW / 2, -badgeH / 2, badgeW, badgeH, 8);
    badgeBg.lineStyle(2, borderColor, 1);
    badgeBg.strokeRoundedRect(-badgeW / 2, -badgeH / 2, badgeW, badgeH, 8);
    badgeContainer.add(badgeBg);

    const dayKey = isAvailable ? 'daily.badge_available' : 'daily.badge_claimed';
    const displayStreak = isAvailable ? (reward?.streak ?? streak) : streak;
    const labelText = `\uD83D\uDD25 ${t(dayKey, { day: displayStreak })}`;
    const textColor = isAvailable ? UI_CSS.TEXT_BLACK : NEON_CSS.UI_DIM;

    const badgeLabel = this.add
      .text(0, 0, labelText, {
        fontSize: '18px',
        color: textColor,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    badgeContainer.add(badgeLabel);

    if (isAvailable) {
      this.tweens.add({
        targets: badgeContainer,
        scaleX: 1.06,
        scaleY: 1.06,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  /** Show daily reward popup if a reward is available. */
  private showDailyRewardPopup(): void {
    const reward = SaveManager.checkDailyReward();
    if (!reward) return;

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const popupW = 380;
    const popupH = 340;

    const container = this.add.container(cx, cy).setDepth(3000).setAlpha(0);

    const backdrop = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, NEON.BG_BLACK, 0.6);
    container.add(backdrop);

    const panel = this.add.graphics();
    panel.fillStyle(NEON.UI_PANEL, 0.95);
    panel.fillRoundedRect(-popupW / 2, -popupH / 2, popupW, popupH, 12);
    panel.lineStyle(3, NEON.GOLD, 1);
    panel.strokeRoundedRect(-popupW / 2, -popupH / 2, popupW, popupH, 12);
    container.add(panel);

    const title = this.add
      .text(0, -popupH / 2 + 36, t('daily.title'), {
        fontSize: '36px',
        color: NEON_CSS.GOLD,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    container.add(title);

    const rewardText = this.add
      .text(0, -popupH / 2 + 90, t('daily.reward', { day: reward.streak, gold: reward.gold }), {
        fontSize: '28px',
        color: NEON_CSS.UI_TEXT,
        fontFamily: 'monospace',
        fontStyle: 'bold',
        wordWrap: { width: popupW - 40 },
      })
      .setOrigin(0.5);
    container.add(rewardText);

    const streakText = this.add
      .text(0, -popupH / 2 + 130, t('daily.streak', { streak: reward.streak }), {
        fontSize: '20px',
        color: NEON_CSS.UI_DIM,
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);
    container.add(streakText);

    const maxStreak = BALANCE.DAILY_REWARDS.maxStreak;
    const dotRadius = 12;
    const dotGap = 8;
    const totalDotsW = maxStreak * dotRadius * 2 + (maxStreak - 1) * dotGap;
    const dotsStartX = -totalDotsW / 2 + dotRadius;
    const dotsY = -popupH / 2 + 180;

    const dotsGfx = this.add.graphics();
    for (let d = 0; d < maxStreak; d++) {
      const dx = dotsStartX + d * (dotRadius * 2 + dotGap);
      const filled = d < reward.streak;
      if (filled) {
        dotsGfx.fillStyle(NEON.GOLD, 1);
        dotsGfx.fillCircle(dx, dotsY, dotRadius);
      } else {
        dotsGfx.lineStyle(2, NEON.UI_BORDER, 0.8);
        dotsGfx.strokeCircle(dx, dotsY, dotRadius);
      }
      const dayLabel = this.add
        .text(dx, dotsY, `${d + 1}`, {
          fontSize: '14px',
          color: filled ? UI_CSS.TEXT_BLACK : NEON_CSS.UI_DIM,
          fontFamily: 'monospace',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      container.add(dayLabel);
    }
    container.add(dotsGfx);
    container.sendToBack(dotsGfx);
    container.sendToBack(panel);
    container.sendToBack(backdrop);

    const claimBtn = createButton(this, {
      x: 0,
      y: popupH / 2 - 60,
      width: 220,
      height: 60,
      label: t('daily.claim'),
      fontSize: '28px',
      variant: 'primary',
      depth: 3001,
      onClick: () => {
        SaveManager.claimDailyReward();
        getRetroSFX().dailyReward();
        this.tweens.add({
          targets: container,
          alpha: 0,
          scale: 0.9,
          duration: 200,
          onComplete: () => container.destroy(),
        });
      },
    });
    claimBtn.setPosition(0, popupH / 2 - 60);
    container.add(claimBtn);

    this.tweens.add({
      targets: container,
      alpha: 1,
      scale: { from: 0.9, to: 1 },
      duration: 300,
      ease: 'Back.easeOut',
    });
  }

  /** Create a compact icon button with a drawn symbol + label. */
  private createIconButton(
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    index: number,
    onClick: () => void,
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y).setDepth(100);
    const hw = w / 2;
    const hh = h / 2;

    const bg = this.add.graphics();
    bg.fillStyle(NEON.UI_PANEL, 0.9);
    bg.fillRoundedRect(-hw, -hh, w, h, 6);
    bg.lineStyle(2, NEON.UI_BORDER, 0.8);
    bg.strokeRoundedRect(-hw, -hh, w, h, 6);
    container.add(bg);

    const iconGfx = this.add.graphics();
    const iconY = -8;
    const iconColor = NEON.UI_ACCENT;

    switch (index) {
      case 0: // weapons
        iconGfx.lineStyle(3, iconColor, 1);
        iconGfx.lineBetween(-12, iconY - 10, 12, iconY + 10);
        iconGfx.lineBetween(12, iconY - 10, -12, iconY + 10);
        iconGfx.fillStyle(iconColor);
        iconGfx.fillCircle(0, iconY, 3);
        break;
      case 1: // enemies
        iconGfx.fillStyle(NEON.ENEMY_BASIC);
        iconGfx.fillTriangle(0, iconY - 12, -10, iconY, 0, iconY + 12);
        iconGfx.fillTriangle(0, iconY - 12, 10, iconY, 0, iconY + 12);
        break;
      case 2: // map
        iconGfx.fillStyle(iconColor);
        for (let r = -1; r <= 1; r++) {
          for (let c = -1; c <= 1; c++) {
            iconGfx.fillCircle(c * 10, iconY + r * 10, 3);
          }
        }
        iconGfx.lineStyle(1, iconColor, 0.5);
        iconGfx.lineBetween(-10, iconY - 10, 10, iconY - 10);
        iconGfx.lineBetween(-10, iconY, 10, iconY);
        iconGfx.lineBetween(-10, iconY + 10, 10, iconY + 10);
        break;
      case 3: // settings
        iconGfx.lineStyle(3, iconColor, 1);
        iconGfx.strokeCircle(0, iconY, 8);
        iconGfx.fillStyle(iconColor);
        iconGfx.fillCircle(0, iconY, 3);
        for (let a = 0; a < 4; a++) {
          const angle = (a * Math.PI) / 4;
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          iconGfx.lineBetween(cos * 10, iconY + sin * 10, cos * 14, iconY + sin * 14);
        }
        break;
    }
    container.add(iconGfx);

    const text = this.add
      .text(0, 18, label, {
        fontSize: '20px',
        color: NEON_CSS.UI_TEXT,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    container.add(text);

    const hitZone = this.add.zone(0, 0, w, h).setInteractive({ useHandCursor: true });

    hitZone.on('pointerover', () => {
      container.setScale(1.08);
      bg.clear();
      bg.fillStyle(TEX.MENU_HOVER_BG, 0.95);
      bg.fillRoundedRect(-hw, -hh, w, h, 6);
      bg.lineStyle(2, NEON.UI_ACCENT, 1);
      bg.strokeRoundedRect(-hw, -hh, w, h, 6);
    });

    hitZone.on('pointerout', () => {
      container.setScale(1);
      bg.clear();
      bg.fillStyle(NEON.UI_PANEL, 0.9);
      bg.fillRoundedRect(-hw, -hh, w, h, 6);
      bg.lineStyle(2, NEON.UI_BORDER, 0.8);
      bg.strokeRoundedRect(-hw, -hh, w, h, 6);
    });

    hitZone.on('pointerdown', () => {
      getRetroSFX().buttonClick();
      getAudioManager().playSFX('sfx_click');
      this.tweens.add({
        targets: container,
        scaleX: 0.92,
        scaleY: 0.92,
        duration: 60,
        yoyo: true,
        onComplete: () => onClick(),
      });
    });

    container.add(hitZone);
    return container;
  }
}
