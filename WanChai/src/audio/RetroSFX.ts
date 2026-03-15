/**
 * RetroSFX — Procedural chiptune SFX generator using Web Audio API.
 * No audio files required; generates 8-bit style sound effects at runtime.
 *
 * All effects are fire-and-forget: short-lived OscillatorNode + GainNode pairs
 * that auto-disconnect after playback.
 *
 * Volume is controlled by a masterGain node. The initial gain value is read
 * from SaveManager.settings.sfxVolume (default 1.0) on init().
 */

import { SaveManager } from '../managers/SaveManager';

// ── Note frequency table (Hz) ────────────────────────────────────────────────

const FREQ: Record<string, number> = {
  A3: 220.0,
  B3: 246.94,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  G5: 783.99,
  A5: 880.0,
  C6: 1046.5,
  E6: 1318.51,
};

// ── Main class ────────────────────────────────────────────────────────────────

export class RetroSFX {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private enabled = true;

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  init(): void {
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();

    // Wire volume + muted from persisted settings
    const sfxSettings = SaveManager.getSfxSettings();
    this.masterGain.gain.value = Math.max(0, Math.min(1, sfxSettings.volume));
    this.enabled = !sfxSettings.muted;

    this.masterGain.connect(this.ctx.destination);
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
  }

  setMuted(muted: boolean): void {
    this.enabled = !muted;
  }

  setVolume(v: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, v));
    }
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  // ── Guard helper ──────────────────────────────────────────────────────────

  /**
   * Returns the AudioContext if the system is ready to play, otherwise null.
   * Also resumes a suspended context (required after user gesture on some browsers).
   */
  private getCtx(): AudioContext | null {
    if (!this.enabled || !this.ctx || !this.masterGain) return null;
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  // ── Oscillator helpers ─────────────────────────────────────────────────────

  /**
   * Plays a single tone with an optional frequency sweep.
   *
   * @param type    OscillatorType ('square' | 'triangle' | 'sine' | 'sawtooth')
   * @param freqStart  Starting frequency in Hz
   * @param freqEnd    Ending frequency in Hz (same as freqStart for fixed pitch)
   * @param durationSec  Note duration in seconds
   * @param peakGain   Peak gain for this note (relative to masterGain)
   * @param startTime  AudioContext time to start playback
   */
  private playTone(
    type: OscillatorType,
    freqStart: number,
    freqEnd: number,
    durationSec: number,
    peakGain: number,
    startTime: number,
  ): void {
    const ctx = this.getCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, startTime);
    if (freqEnd !== freqStart) {
      osc.frequency.linearRampToValueAtTime(freqEnd, startTime + durationSec);
    }

    // Simple envelope: attack 5ms, sustain, release 10ms
    const attackEnd = startTime + Math.min(0.005, durationSec * 0.1);
    const releaseStart = startTime + durationSec - Math.min(0.01, durationSec * 0.2);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(peakGain, attackEnd);
    gain.gain.setValueAtTime(peakGain, releaseStart);
    gain.gain.linearRampToValueAtTime(0, startTime + durationSec);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(startTime);
    osc.stop(startTime + durationSec + 0.005); // tiny tail to avoid clicks
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }

  /**
   * Plays a burst of white noise.
   *
   * @param durationSec  Noise duration in seconds
   * @param peakGain     Peak gain for this burst
   * @param startTime    AudioContext time to start playback
   */
  private playNoise(durationSec: number, peakGain: number, startTime: number): void {
    const ctx = this.getCtx();
    if (!ctx) return;

    const sampleRate = ctx.sampleRate;
    const numSamples = Math.ceil(durationSec * sampleRate);
    const buffer = ctx.createBuffer(1, numSamples, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < numSamples; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gain = ctx.createGain();
    const releaseStart = startTime + durationSec * 0.7;

    gain.gain.setValueAtTime(peakGain, startTime);
    gain.gain.setValueAtTime(peakGain, releaseStart);
    gain.gain.linearRampToValueAtTime(0, startTime + durationSec);

    source.connect(gain);
    gain.connect(this.masterGain!);

    source.start(startTime);
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
    };
  }

  // ── Individual SFX methods ─────────────────────────────────────────────────

  /**
   * tap — Short high blip.
   * Square wave, 880 Hz, 30 ms.
   */
  tap(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    this.playTone('square', 880, 880, 0.03, 0.2, ctx.currentTime);
  }

  /**
   * deploy — Rising tone.
   * Square wave, 440 → 660 Hz sweep, 80 ms.
   */
  deploy(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    this.playTone('square', 440, 660, 0.08, 0.18, ctx.currentTime);
  }

  /**
   * gameOver — Descending 4-note sad phrase.
   * G4 → E4 → C4 → A3, square wave, 120 ms each = 480 ms total.
   */
  gameOver(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const step = 0.12;
    this.playTone('square', FREQ.G4, FREQ.G4, step, 0.18, t);
    this.playTone('square', FREQ.E4, FREQ.E4, step, 0.18, t + step);
    this.playTone('square', FREQ.C4, FREQ.C4, step, 0.18, t + step * 2);
    this.playTone('square', FREQ.A3, FREQ.A3, step, 0.15, t + step * 3);
  }

  /**
   * levelClear — Victory fanfare ascending.
   * C5 → E5 → G5 → C6, square wave.
   * First three notes: 100 ms each; final note: 200 ms.
   * Total: 500 ms.
   */
  levelClear(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const step = 0.1;
    this.playTone('square', FREQ.C5, FREQ.C5, step, 0.2, t);
    this.playTone('square', FREQ.E5, FREQ.E5, step, 0.2, t + step);
    this.playTone('square', FREQ.G5, FREQ.G5, step, 0.2, t + step * 2);
    this.playTone('square', FREQ.C6, FREQ.C6, 0.2, 0.22, t + step * 3);
  }

  /**
   * baseHit — Low warning pulse when base takes damage.
   * Sine wave sweep 200→80 Hz, 120 ms.
   */
  baseHit(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.playTone('sine', 200, 80, 0.12, 0.2, t);
    this.playNoise(0.04, 0.1, t);
  }

  /**
   * xpCollect — Quick ascending blip for XP pickup.
   * Triangle wave, 800→1200 Hz, 40 ms.
   */
  xpCollect(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    this.playTone('triangle', 800, 1200, 0.04, 0.12, ctx.currentTime);
  }

  /**
   * goldCollect — Coin clink.
   * Sine wave, 1200 Hz, 50 ms.
   */
  goldCollect(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.playTone('sine', 1200, 1200, 0.03, 0.15, t);
    this.playTone('sine', 1800, 1800, 0.03, 0.1, t + 0.03);
  }

  /**
   * purchase — Confirmation chime (two ascending notes).
   * Square wave, C5→E5, 60 ms each.
   */
  purchase(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.playTone('square', FREQ.C5, FREQ.C5, 0.06, 0.18, t);
    this.playTone('square', FREQ.E5, FREQ.E5, 0.08, 0.2, t + 0.06);
  }

  /**
   * bossDefeat — Triumphant fanfare + explosion.
   * Ascending arpeggio + noise burst.
   */
  bossDefeat(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.playNoise(0.1, 0.15, t);
    this.playTone('square', FREQ.C5, FREQ.C5, 0.08, 0.2, t + 0.05);
    this.playTone('square', FREQ.E5, FREQ.E5, 0.08, 0.2, t + 0.13);
    this.playTone('square', FREQ.G5, FREQ.G5, 0.08, 0.2, t + 0.21);
    this.playTone('square', FREQ.C6, FREQ.C6, 0.2, 0.25, t + 0.29);
    this.playNoise(0.08, 0.12, t + 0.29);
  }

  // ── Weapon fire SFX (differentiated by weapon type) ────────────────────────

  /**
   * weaponBullet — Short, sharp pop.
   * Square wave 600→400 Hz, 20 ms, low volume.
   */
  weaponBullet(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    this.playTone('square', 600, 400, 0.02, 0.06, ctx.currentTime);
  }

  /**
   * weaponLaser — Sustained sine sweep.
   * Sine wave 800→1600 Hz, 60 ms.
   */
  weaponLaser(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    this.playTone('sine', 800, 1600, 0.06, 0.07, ctx.currentTime);
  }

  /**
   * weaponBomb — Low thump with reverb tail.
   * Sine wave 150→60 Hz, 100 ms + noise tail.
   */
  weaponBomb(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.playTone('sine', 150, 60, 0.1, 0.12, t);
    this.playNoise(0.08, 0.06, t + 0.02);
  }

  /**
   * weaponMissile — Whoosh + high frequency sweep.
   * Sawtooth 300→900 Hz, 50 ms + noise whoosh.
   */
  weaponMissile(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.playTone('sawtooth', 300, 900, 0.05, 0.06, t);
    this.playNoise(0.03, 0.04, t);
  }

  /**
   * weaponShuriken — Fast whistle/whoosh.
   * Triangle wave 1000→600 Hz, 30 ms.
   */
  weaponShuriken(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    this.playTone('triangle', 1000, 600, 0.03, 0.06, ctx.currentTime);
  }

  /**
   * weaponNapalm — Crackling fire launch.
   * Sawtooth 200→100 Hz, 60 ms + noise.
   */
  weaponNapalm(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.playTone('sawtooth', 200, 100, 0.06, 0.08, t);
    this.playNoise(0.04, 0.06, t + 0.01);
  }

  /**
   * weaponChain — Electric zap.
   * Square wave 800→1200 Hz, 25 ms.
   */
  weaponChain(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    this.playTone('square', 800, 1200, 0.025, 0.07, ctx.currentTime);
  }

  /**
   * weaponAoe — Area pulse.
   * Sine wave 400→200 Hz, 40 ms + noise.
   */
  weaponAoe(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.playTone('sine', 400, 200, 0.04, 0.08, t);
    this.playNoise(0.02, 0.04, t);
  }

  // ── Enemy SFX ──────────────────────────────────────────────────────────────

  /**
   * enemyHit — Short metallic ping.
   * Sine wave 1200 Hz, 20 ms.
   */
  enemyHit(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    this.playTone('sine', 1200, 1200, 0.02, 0.1, ctx.currentTime);
  }

  /**
   * enemyDeath — Crunchy disintegrate sound.
   * Noise burst + descending square wave 600→200 Hz.
   */
  enemyDeath(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.playNoise(0.06, 0.15, t);
    this.playTone('square', 600, 200, 0.08, 0.12, t);
  }

  /**
   * bossEntrance — Deep rumble + rising tone.
   * Sine wave 60→200 Hz, 300 ms + noise rumble.
   */
  bossEntrance(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.playTone('sine', 60, 200, 0.3, 0.2, t);
    this.playNoise(0.2, 0.1, t);
    this.playTone('sawtooth', 200, 600, 0.2, 0.12, t + 0.2);
  }

  /**
   * bossDeath — Massive explosion + reverb.
   * Noise burst + descending sweep + ascending fanfare.
   */
  bossDeath(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.playNoise(0.2, 0.2, t);
    this.playTone('sine', 200, 40, 0.2, 0.18, t);
    this.playNoise(0.15, 0.12, t + 0.15);
    this.playTone('square', FREQ.C5, FREQ.C5, 0.08, 0.18, t + 0.3);
    this.playTone('square', FREQ.E5, FREQ.E5, 0.08, 0.18, t + 0.38);
    this.playTone('square', FREQ.G5, FREQ.G5, 0.08, 0.18, t + 0.46);
    this.playTone('square', FREQ.C6, FREQ.C6, 0.25, 0.22, t + 0.54);
  }

  // ── Player/Progression SFX ─────────────────────────────────────────────────

  /**
   * levelUp — Ascending arpeggio chord.
   * C5 → E5 → G5 → C6, triangle wave, 50 ms each + final hold.
   */
  levelUp(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const step = 0.05;
    this.playTone('triangle', FREQ.C5, FREQ.C5, step, 0.18, t);
    this.playTone('triangle', FREQ.E5, FREQ.E5, step, 0.18, t + step);
    this.playTone('triangle', FREQ.G5, FREQ.G5, step, 0.18, t + step * 2);
    this.playTone('triangle', FREQ.C6, FREQ.C6, 0.12, 0.22, t + step * 3);
  }

  /**
   * achievementUnlock — Triumphant short fanfare.
   * E5 → G5 → C6 → E6, square wave, 60 ms each + final 150ms.
   */
  achievementUnlock(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const step = 0.06;
    this.playTone('square', FREQ.E5, FREQ.E5, step, 0.16, t);
    this.playTone('square', FREQ.G5, FREQ.G5, step, 0.18, t + step);
    this.playTone('square', FREQ.C6, FREQ.C6, step, 0.2, t + step * 2);
    this.playTone('square', FREQ.E6, FREQ.E6, 0.15, 0.22, t + step * 3);
  }

  // ── UI SFX ─────────────────────────────────────────────────────────────────

  /**
   * buttonClick — Clean click.
   * Square wave, 700 Hz, 15 ms.
   */
  buttonClick(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    this.playTone('square', 700, 700, 0.015, 0.15, ctx.currentTime);
  }

  /**
   * tabSwitch — Subtle whoosh.
   * Triangle wave 500→800 Hz, 30 ms, low volume.
   */
  tabSwitch(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    this.playTone('triangle', 500, 800, 0.03, 0.08, ctx.currentTime);
  }

  /**
   * purchaseSuccess — Cash register ding.
   * Sine 1000 Hz, 30 ms + sine 1500 Hz, 50 ms.
   */
  purchaseSuccess(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.playTone('sine', 1000, 1000, 0.03, 0.16, t);
    this.playTone('sine', 1500, 1500, 0.05, 0.18, t + 0.03);
  }

  /**
   * purchaseFail — Error buzz.
   * Square wave 200 Hz, 80 ms + square 180 Hz, 80 ms.
   */
  purchaseFail(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.playTone('square', 200, 200, 0.08, 0.15, t);
    this.playTone('square', 180, 180, 0.08, 0.12, t + 0.08);
  }

  /**
   * stageClear — Victory jingle (3 ascending notes).
   * C5 → E5 → G5, square wave, 80 ms each + noise confetti.
   */
  stageClear(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const step = 0.08;
    this.playTone('square', FREQ.C5, FREQ.C5, step, 0.18, t);
    this.playTone('square', FREQ.E5, FREQ.E5, step, 0.2, t + step);
    this.playTone('square', FREQ.G5, FREQ.G5, 0.12, 0.22, t + step * 2);
    this.playNoise(0.04, 0.06, t + step * 2);
  }

  // ── Challenge/Special SFX ──────────────────────────────────────────────────

  /**
   * challengeStart — Dramatic countdown tone.
   * Three descending beeps then a rising chord.
   */
  challengeStart(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.playTone('square', FREQ.A4, FREQ.A4, 0.06, 0.16, t);
    this.playTone('square', FREQ.A4, FREQ.A4, 0.06, 0.16, t + 0.15);
    this.playTone('square', FREQ.A4, FREQ.A4, 0.06, 0.16, t + 0.3);
    this.playTone('square', FREQ.A5, FREQ.A5, 0.12, 0.22, t + 0.45);
  }

  /**
   * dailyReward — Celebration burst.
   * Ascending arpeggio + noise confetti.
   */
  dailyReward(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const step = 0.05;
    this.playTone('sine', FREQ.C5, FREQ.C5, step, 0.14, t);
    this.playTone('sine', FREQ.E5, FREQ.E5, step, 0.16, t + step);
    this.playTone('sine', FREQ.G5, FREQ.G5, step, 0.18, t + step * 2);
    this.playTone('sine', FREQ.C6, FREQ.C6, 0.1, 0.2, t + step * 3);
    this.playNoise(0.06, 0.08, t + step * 3);
  }
}

// ── Singleton accessor ────────────────────────────────────────────────────────

let _sfxInstance: RetroSFX | null = null;

export function getRetroSFX(): RetroSFX {
  if (!_sfxInstance) {
    _sfxInstance = new RetroSFX();
    _sfxInstance.init();
  }
  return _sfxInstance;
}
