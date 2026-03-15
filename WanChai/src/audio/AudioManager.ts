/**
 * AudioManager — File-based audio playback via Phaser's sound system.
 *
 * Uses pre-loaded audio assets (MP3/WAV) for BGM and SFX.
 * Falls back gracefully if audio files fail to load (no crash).
 * Works alongside the existing RetroAudio/RetroSFX procedural system.
 *
 * BGM keys: bgm_menu, bgm_battle, bgm_boss, bgm_ch1, bgm_ch3
 * SFX keys: sfx_shoot, sfx_explosion, sfx_hit, sfx_death,
 *           sfx_pickup, sfx_click, sfx_levelup, sfx_warning
 */

import { BALANCE } from '../config/balance';
import { SaveManager } from '../managers/SaveManager';

// ── Types ─────────────────────────────────────────────────────────────────────

export type BGMKey = 'bgm_menu' | 'bgm_battle' | 'bgm_boss' | 'bgm_ch1' | 'bgm_ch3';
export type SFXKey =
  | 'sfx_shoot'
  | 'sfx_explosion'
  | 'sfx_hit'
  | 'sfx_death'
  | 'sfx_pickup'
  | 'sfx_click'
  | 'sfx_levelup'
  | 'sfx_warning';

// ── Audio key lists (used in PreloadScene) ────────────────────────────────────

export const BGM_ASSETS = [
  { key: 'bgm_menu', path: 'assets/audio/bgm/menu.mp3' },
  { key: 'bgm_battle', path: 'assets/audio/bgm/battle.mp3' },
  { key: 'bgm_boss', path: 'assets/audio/bgm/boss.mp3' },
  { key: 'bgm_ch1', path: 'assets/audio/bgm/ch1.mp3' },
  { key: 'bgm_ch3', path: 'assets/audio/bgm/ch3.mp3' },
] as const;

export const SFX_ASSETS = [
  { key: 'sfx_shoot', path: 'assets/audio/sfx/shoot.wav' },
  { key: 'sfx_explosion', path: 'assets/audio/sfx/explosion.wav' },
  { key: 'sfx_hit', path: 'assets/audio/sfx/hit.wav' },
  { key: 'sfx_death', path: 'assets/audio/sfx/death.wav' },
  { key: 'sfx_pickup', path: 'assets/audio/sfx/pickup.wav' },
  { key: 'sfx_click', path: 'assets/audio/sfx/click.wav' },
  { key: 'sfx_levelup', path: 'assets/audio/sfx/levelup.wav' },
  { key: 'sfx_warning', path: 'assets/audio/sfx/warning.wav' },
] as const;

// ── Manager class ─────────────────────────────────────────────────────────────

export class AudioManager {
  private scene: Phaser.Scene | null = null;
  private currentBgm: Phaser.Sound.BaseSound | null = null;
  private currentBgmKey: string | null = null;
  private bgmVolume: number;
  private sfxVolume: number;
  private bgmMuted: boolean;
  private sfxMuted: boolean;
  private sfxThrottles = new Map<string, number>();

  constructor() {
    const bgmSettings = SaveManager.getBgmSettings();
    const sfxSettings = SaveManager.getSfxSettings();
    this.bgmVolume = bgmSettings.muted ? 0 : bgmSettings.volume || BALANCE.AUDIO.bgmVolume;
    this.sfxVolume = sfxSettings.muted ? 0 : sfxSettings.volume || BALANCE.AUDIO.sfxVolume;
    this.bgmMuted = bgmSettings.muted;
    this.sfxMuted = sfxSettings.muted;
  }

  /** Attach to a Phaser scene (call in each scene's create). */
  setScene(scene: Phaser.Scene): void {
    this.scene = scene;
  }

  // ── BGM ───────────────────────────────────────────────────────────────────

  /** Play BGM with crossfade. If same track is already playing, no-op. */
  playBGM(key: BGMKey): void {
    if (!this.scene) return;
    if (this.currentBgmKey === key && this.currentBgm?.isPlaying) return;

    // Check if audio asset exists in cache
    if (!this.scene.cache.audio.exists(key)) return;

    const fadeMs = BALANCE.AUDIO.bgmFadeMs;

    // Fade out current BGM
    if (this.currentBgm && this.currentBgm.isPlaying) {
      const oldBgm = this.currentBgm;
      if (this.scene.tweens && 'volume' in oldBgm) {
        this.scene.tweens.add({
          targets: oldBgm,
          volume: 0,
          duration: fadeMs,
          onComplete: () => {
            oldBgm.stop();
            oldBgm.destroy();
          },
        });
      } else {
        oldBgm.stop();
        oldBgm.destroy();
      }
    }

    // Start new BGM
    try {
      const vol = this.bgmMuted ? 0 : this.bgmVolume;
      this.currentBgm = this.scene.sound.add(key, {
        volume: 0,
        loop: true,
      });
      this.currentBgm.play();
      this.currentBgmKey = key;

      // Fade in
      if (this.scene.tweens && 'volume' in this.currentBgm) {
        this.scene.tweens.add({
          targets: this.currentBgm,
          volume: vol,
          duration: fadeMs,
        });
      }
    } catch {
      // Graceful fallback — audio file may be missing/corrupt
      this.currentBgm = null;
      this.currentBgmKey = null;
    }
  }

  /** Stop current BGM with fade out. */
  stopBGM(): void {
    if (!this.currentBgm || !this.scene) return;
    const fadeMs = BALANCE.AUDIO.bgmFadeMs;
    const bgm = this.currentBgm;

    if (this.scene.tweens && 'volume' in bgm) {
      this.scene.tweens.add({
        targets: bgm,
        volume: 0,
        duration: fadeMs,
        onComplete: () => {
          bgm.stop();
          bgm.destroy();
        },
      });
    } else {
      bgm.stop();
      bgm.destroy();
    }
    this.currentBgm = null;
    this.currentBgmKey = null;
  }

  // ── SFX ───────────────────────────────────────────────────────────────────

  /** Play an SFX with throttling. */
  playSFX(key: SFXKey): void {
    if (!this.scene || this.sfxMuted) return;
    if (!this.scene.cache.audio.exists(key)) return;

    // Throttle check
    const throttleKey = key.replace('sfx_', '');
    const throttleMs = BALANCE.AUDIO.sfxThrottle[throttleKey] ?? 0;
    if (throttleMs > 0) {
      const now = Date.now();
      const lastPlayed = this.sfxThrottles.get(key) ?? 0;
      if (now - lastPlayed < throttleMs) return;
      this.sfxThrottles.set(key, now);
    }

    try {
      this.scene.sound.play(key, { volume: this.sfxVolume });
    } catch {
      // Graceful fallback — no crash on missing/corrupt audio
    }
  }

  // ── Volume control ────────────────────────────────────────────────────────

  setBgmVolume(v: number): void {
    this.bgmVolume = Math.max(0, Math.min(1, v));
    if (this.currentBgm && 'volume' in this.currentBgm) {
      (this.currentBgm as Phaser.Sound.WebAudioSound).setVolume(this.bgmMuted ? 0 : this.bgmVolume);
    }
  }

  setSfxVolume(v: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, v));
  }

  setBgmMuted(muted: boolean): void {
    this.bgmMuted = muted;
    if (this.currentBgm && 'volume' in this.currentBgm) {
      (this.currentBgm as Phaser.Sound.WebAudioSound).setVolume(muted ? 0 : this.bgmVolume);
    }
  }

  setSfxMuted(muted: boolean): void {
    this.sfxMuted = muted;
  }

  get isBgmPlaying(): boolean {
    return this.currentBgm?.isPlaying ?? false;
  }

  get activeBgmKey(): string | null {
    return this.currentBgmKey;
  }
}

// ── Singleton ─────────────────────────────────────────────────────────────────

let _audioManager: AudioManager | null = null;

export function getAudioManager(): AudioManager {
  if (!_audioManager) {
    _audioManager = new AudioManager();
  }
  return _audioManager;
}
