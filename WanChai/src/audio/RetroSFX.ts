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
  C4: 261.63,
  E4: 329.63,
  G4: 392.0,
  A4: 440.0,
  C5: 523.25,
  E5: 659.25,
  G5: 783.99,
  C6: 1046.50,
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
    startTime: number
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
    const releaseStart = startTime + durationSec - Math.min(0.010, durationSec * 0.2);

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
  private playNoise(
    durationSec: number,
    peakGain: number,
    startTime: number
  ): void {
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
    this.playTone('square', 880, 880, 0.030, 0.20, ctx.currentTime);
  }

  /**
   * deploy — Rising tone.
   * Square wave, 440 → 660 Hz sweep, 80 ms.
   */
  deploy(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    this.playTone('square', 440, 660, 0.080, 0.18, ctx.currentTime);
  }

  /**
   * match — Satisfying hit.
   * Square wave at 523 Hz + noise burst, 60 ms total.
   */
  match(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.playTone('square', 523, 523, 0.060, 0.20, t);
    this.playNoise(0.030, 0.12, t);
  }

  /**
   * destroy — Descending crunch.
   * Noise burst + square wave 440 → 220 Hz, 100 ms.
   */
  destroy(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.playNoise(0.050, 0.18, t);
    this.playTone('square', 440, 220, 0.100, 0.15, t);
  }

  /**
   * combo — Ascending 3-note arpeggio.
   * C5 → E5 → G5, square wave, 40 ms each = 120 ms total.
   */
  combo(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const step = 0.040;
    this.playTone('square', FREQ.C5, FREQ.C5, step, 0.20, t);
    this.playTone('square', FREQ.E5, FREQ.E5, step, 0.20, t + step);
    this.playTone('square', FREQ.G5, FREQ.G5, step, 0.20, t + step * 2);
  }

  /**
   * benchRetreat — Sad descending two-tone.
   * E4 → C4, triangle wave, 80 ms each = 160 ms total.
   */
  benchRetreat(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const step = 0.080;
    this.playTone('triangle', FREQ.E4, FREQ.E4, step, 0.18, t);
    this.playTone('triangle', FREQ.C4, FREQ.C4, step, 0.18, t + step);
  }

  /**
   * gameOver — Descending 4-note sad phrase.
   * G4 → E4 → C4 → A3, square wave, 120 ms each = 480 ms total.
   */
  gameOver(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const step = 0.120;
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
    const step = 0.100;
    this.playTone('square', FREQ.C5, FREQ.C5, step, 0.20, t);
    this.playTone('square', FREQ.E5, FREQ.E5, step, 0.20, t + step);
    this.playTone('square', FREQ.G5, FREQ.G5, step, 0.20, t + step * 2);
    this.playTone('square', FREQ.C6, FREQ.C6, 0.200, 0.22, t + step * 3);
  }

  /**
   * starReveal — Bright ding.
   * Sine wave, 1047 Hz, 150 ms with decay.
   */
  starReveal(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    this.playTone('sine', 1047, 1047, 0.150, 0.22, ctx.currentTime);
  }

  /**
   * weaponFire — Subtle tick for weapon shot.
   * Triangle wave, 500 Hz, 15 ms, low volume.
   */
  weaponFire(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    this.playTone('triangle', 500, 400, 0.015, 0.05, ctx.currentTime);
  }

  /**
   * baseHit — Low warning pulse when base takes damage.
   * Sine wave sweep 200→80 Hz, 120 ms.
   */
  baseHit(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.playTone('sine', 200, 80, 0.120, 0.20, t);
    this.playNoise(0.040, 0.10, t);
  }

  /**
   * xpCollect — Quick ascending blip for XP pickup.
   * Triangle wave, 800→1200 Hz, 40 ms.
   */
  xpCollect(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    this.playTone('triangle', 800, 1200, 0.040, 0.12, ctx.currentTime);
  }

  /**
   * goldCollect — Coin clink.
   * Sine wave, 1200 Hz, 50 ms.
   */
  goldCollect(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.playTone('sine', 1200, 1200, 0.030, 0.15, t);
    this.playTone('sine', 1800, 1800, 0.030, 0.10, t + 0.030);
  }

  /**
   * purchase — Confirmation chime (two ascending notes).
   * Square wave, C5→E5, 60 ms each.
   */
  purchase(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.playTone('square', FREQ.C5, FREQ.C5, 0.060, 0.18, t);
    this.playTone('square', FREQ.E5, FREQ.E5, 0.080, 0.20, t + 0.060);
  }

  /**
   * bossDefeat — Triumphant fanfare + explosion.
   * Ascending arpeggio + noise burst.
   */
  bossDefeat(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.playNoise(0.100, 0.15, t);
    this.playTone('square', FREQ.C5, FREQ.C5, 0.080, 0.20, t + 0.050);
    this.playTone('square', FREQ.E5, FREQ.E5, 0.080, 0.20, t + 0.130);
    this.playTone('square', FREQ.G5, FREQ.G5, 0.080, 0.20, t + 0.210);
    this.playTone('square', FREQ.C6, FREQ.C6, 0.200, 0.25, t + 0.290);
    this.playNoise(0.080, 0.12, t + 0.290);
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
