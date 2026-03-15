// ── Neon Survivors: AudioManager ──
// Thin wrapper around Phaser's built-in sound manager.
// Handles BGM (phase-aware) and all SFX for GameScene.

import Phaser from "phaser";
import { BGM_PHASE_MAP, WEAPON_SFX_MAP } from "../config/audio-keys";

/** Phase keys that map to BGM_PHASE_MAP entries */
type BgmPhase = keyof typeof BGM_PHASE_MAP;

const DEFAULT_BGM_VOLUME = 0.3;
const DEFAULT_SFX_VOLUME = 0.5;

// localStorage keys
const LS_BGM_MUTED = "neon_bgm_muted";
const LS_SFX_MUTED = "neon_sfx_muted";

/** Enemy death SFX pool — picked at random on kill */
const ENEMY_DEATH_KEYS = [
  "sfx_enemy_death_1",
  "sfx_enemy_death_2",
  "sfx_enemy_death_3",
] as const;

export class AudioManager {
  private scene: Phaser.Scene;
  private currentBgm: Phaser.Sound.BaseSound | null = null;
  private currentBgmKey = "";

  // Volume levels
  private bgmVolume: number = DEFAULT_BGM_VOLUME;
  private sfxVolume: number = DEFAULT_SFX_VOLUME;

  // Mute flags
  private bgmMuted: boolean = false;
  private sfxMuted: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.loadMuteState();
  }

  // ── Persistence ─────────────────────────────────────────────────

  private loadMuteState(): void {
    try {
      this.bgmMuted = localStorage.getItem(LS_BGM_MUTED) === "true";
      this.sfxMuted = localStorage.getItem(LS_SFX_MUTED) === "true";
    } catch {
      // localStorage unavailable — keep defaults
    }
  }

  private saveMuteState(): void {
    try {
      localStorage.setItem(LS_BGM_MUTED, String(this.bgmMuted));
      localStorage.setItem(LS_SFX_MUTED, String(this.sfxMuted));
    } catch {
      // localStorage unavailable — ignore
    }
  }

  // ── Volume / mute controls ─────────────────────────────────────

  setBgmVolume(vol: number): void {
    this.bgmVolume = Math.max(0, Math.min(1, vol));
    if (this.currentBgm && !this.bgmMuted) {
      (this.currentBgm as Phaser.Sound.WebAudioSound).setVolume(this.bgmVolume);
    }
  }

  setSfxVolume(vol: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
  }

  /** Toggle BGM mute. Returns the new muted state. */
  toggleBgm(): boolean {
    this.bgmMuted = !this.bgmMuted;
    this.saveMuteState();

    if (this.currentBgm) {
      if (this.bgmMuted) {
        (this.currentBgm as Phaser.Sound.WebAudioSound).setVolume(0);
      } else {
        (this.currentBgm as Phaser.Sound.WebAudioSound).setVolume(
          this.bgmVolume,
        );
      }
    }
    return this.bgmMuted;
  }

  /** Toggle SFX mute. Returns the new muted state. */
  toggleSfx(): boolean {
    this.sfxMuted = !this.sfxMuted;
    this.saveMuteState();
    return this.sfxMuted;
  }

  isBgmMuted(): boolean {
    return this.bgmMuted;
  }

  isSfxMuted(): boolean {
    return this.sfxMuted;
  }

  // ── BGM ──────────────────────────────────────────────────────────

  /**
   * Returns the BGM key for the given elapsed seconds.
   *  0  – 4:59  → early   (bgm_battle_main)
   *  5:00 – 7:59 → mid     (bgm_battle_intense)
   *  boss phase  → boss    (bgm_boss)     — call playBgmForPhase("boss") directly
   *  8:00 – 10:00 → finale (bgm_battle_intense)
   */
  getBgmKeyForTime(elapsedSeconds: number): string {
    if (elapsedSeconds < 300) return BGM_PHASE_MAP.early;
    if (elapsedSeconds < 480) return BGM_PHASE_MAP.mid;
    return BGM_PHASE_MAP.finale;
  }

  /** Play a BGM track by phase key. No-op if already playing that track. */
  playBgmForPhase(phase: BgmPhase): void {
    const key = BGM_PHASE_MAP[phase];
    this.playBgm(key);
  }

  /** Play a BGM track by key. Cross-fades if already playing another BGM. */
  playBgm(key: string): void {
    if (this.currentBgmKey === key && this.currentBgm?.isPlaying) return;

    // Stop previous track
    if (this.currentBgm) {
      this.currentBgm.stop();
      this.currentBgm.destroy();
      this.currentBgm = null;
    }

    if (!this.scene.cache.audio.exists(key)) return;

    const volume = this.bgmMuted ? 0 : this.bgmVolume;
    this.currentBgm = this.scene.sound.add(key, {
      loop: true,
      volume,
    });
    this.currentBgm.play();
    this.currentBgmKey = key;
  }

  /** Update BGM based on elapsed time. Call from scene's update() when phase is "playing". */
  updateBgmForTime(elapsedSeconds: number): void {
    const key = this.getBgmKeyForTime(elapsedSeconds);
    this.playBgm(key);
  }

  /** Stop currently-playing BGM. */
  stopBgm(): void {
    if (this.currentBgm) {
      this.currentBgm.stop();
      this.currentBgm.destroy();
      this.currentBgm = null;
      this.currentBgmKey = "";
    }
  }

  // ── SFX ──────────────────────────────────────────────────────────

  private playSfx(key: string, volume = this.sfxVolume): void {
    if (this.sfxMuted) return;
    if (!this.scene.cache.audio.exists(key)) return;
    this.scene.sound.play(key, { volume });
  }

  /** Play weapon fire SFX for a given weapon ID. */
  playWeaponFire(weaponId: string): void {
    const key = WEAPON_SFX_MAP[weaponId];
    if (key) this.playSfx(key);
  }

  /** Play a random enemy death SFX. */
  playEnemyDeath(): void {
    const idx = Math.floor(Math.random() * ENEMY_DEATH_KEYS.length);
    this.playSfx(ENEMY_DEATH_KEYS[idx]);
  }

  /** Play XP gem pickup sound. */
  playXpPickup(): void {
    this.playSfx("sfx_xp_pickup", this.sfxVolume * 0.7);
  }

  /** Play level-up coin sound. */
  playLevelUp(): void {
    this.playSfx("sfx_levelup");
  }

  /** Play boss warning siren. */
  playBossWarning(): void {
    this.playSfx("sfx_boss_warning");
  }

  /** Play victory fanfare. */
  playVictory(): void {
    this.stopBgm();
    this.playSfx("sfx_victory", this.sfxVolume * 0.8);
  }

  /** Play player hurt sound. */
  playPlayerHurt(): void {
    this.playSfx("sfx_player_hurt");
  }

  /** Play player death sound. */
  playPlayerDeath(): void {
    this.playSfx("sfx_player_death");
  }

  /** Destroy and clean up all sounds. Called when scene shuts down. */
  destroy(): void {
    this.stopBgm();
  }
}
