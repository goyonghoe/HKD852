/**
 * RetroAudio — Procedural cyberpunk BGM generator using Web Audio API.
 * No audio files required; generates dark synthwave tracks at runtime.
 *
 * Tracks:
 *   menu   — 88 BPM, Am, atmospheric arpeggio + sub bass
 *   combat — 128 BPM, Am, driving synth lead + arp + bass + drums
 *   boss   — 150 BPM, Em, aggressive lead + heavy drums
 */

import { SaveManager } from '../managers/SaveManager';

// ── Frequency table (Hz) ────────────────────────────────────────────────────

const FREQ: Record<string, number> = {
  R: 0,
  E2: 82.41, F2: 87.31, G2: 98.0, A2: 110.0, B2: 123.47,
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0, 'G#3': 207.65, A3: 220.0, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, 'G#4': 415.3, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0,
  'F#4': 369.99,
};

// ── Track types ─────────────────────────────────────────────────────────────

export type BGMTrack = 'menu' | 'combat' | 'boss';

type WaveType = 'square' | 'sawtooth' | 'triangle';

// ── Musical data ────────────────────────────────────────────────────────────

// COMBAT — 128 BPM, A minor, 8 bars ────────────────────────────────────────

const COMBAT_BPM = 128;

/** Sawtooth lead, 8th notes (64) */
const COMBAT_LEAD: string[] = [
  'E5','R','E5','D5', 'C5','R','A4','R',
  'E5','R','E5','D5', 'C5','D5','E5','R',
  'A5','R','G5','R', 'E5','R','D5','R',
  'C5','R','D5','R', 'G#4','R','A4','R',
  'E5','R','E5','D5', 'C5','R','A4','R',
  'E5','R','E5','D5', 'C5','D5','E5','R',
  'A5','G5','E5','D5', 'C5','R','A4','R',
  'G#4','A4','R','R', 'R','R','R','R',
];

/** Triangle bass, quarter notes (32) */
const COMBAT_BASS: string[] = [
  'A2','A2','A2','A2', 'A2','A2','E2','E2',
  'D3','D3','D3','D3', 'E3','E3','E3','E3',
  'A2','A2','A2','A2', 'A2','A2','E2','E2',
  'F2','F2','F2','F2', 'E3','E3','A2','A2',
];

/** Square arp, 16th notes (128) — Am chord cycling */
const COMBAT_ARP: string[] = [
  'A3','C4','E4','C4', 'A3','C4','E4','C4', 'A3','C4','E4','C4', 'A3','C4','E4','C4',
  'A3','C4','E4','C4', 'A3','C4','E4','C4', 'E3','G#3','B3','G#3', 'E3','G#3','B3','G#3',
  'D4','F4','A4','F4', 'D4','F4','A4','F4', 'D4','F4','A4','F4', 'D4','F4','A4','F4',
  'E4','G#4','B4','G#4', 'E4','G#4','B4','G#4', 'E4','G#4','B4','G#4', 'E4','G#4','B4','G#4',
  'A3','C4','E4','C4', 'A3','C4','E4','C4', 'A3','C4','E4','C4', 'A3','C4','E4','C4',
  'A3','C4','E4','C4', 'A3','C4','E4','C4', 'E3','G#3','B3','G#3', 'E3','G#3','B3','G#3',
  'F3','A3','C4','A3', 'F3','A3','C4','A3', 'F3','A3','C4','A3', 'F3','A3','C4','A3',
  'E4','G#4','B4','G#4', 'E4','G#4','B4','G#4', 'A3','C4','E4','C4', 'A3','C4','E4','C4',
];

// MENU — 88 BPM, A minor, atmospheric ──────────────────────────────────────

const MENU_BPM = 88;

/** Square arp, 8th notes (64) — sparse, atmospheric */
const MENU_ARP: string[] = [
  'A3','R','C4','R', 'E4','R','A4','R', 'E4','R','C4','R', 'A3','R','R','R',
  'A3','R','C4','R', 'E4','R','A4','R', 'G4','R','E4','R', 'C4','R','R','R',
  'D4','R','F4','R', 'A4','R','D5','R', 'A4','R','F4','R', 'D4','R','R','R',
  'A3','R','C4','R', 'E4','R','A4','R', 'E4','R','C4','R', 'A3','R','R','R',
];

/** Triangle bass, quarter notes (32) — sub drone */
const MENU_BASS: string[] = [
  'A2','R','A2','R', 'A2','R','A2','R',
  'A2','R','A2','R', 'A2','R','A2','R',
  'D3','R','D3','R', 'D3','R','D3','R',
  'A2','R','A2','R', 'A2','R','A2','R',
];

// BOSS — 150 BPM, E minor, aggressive ─────────────────────────────────────

const BOSS_BPM = 150;

/** Sawtooth lead, 8th notes (64) — aggressive */
const BOSS_LEAD: string[] = [
  'E5','G5','E5','D5', 'B4','R','E5','R',
  'G5','R','A5','G5', 'E5','D5','B4','R',
  'C5','D5','E5','G5', 'E5','D5','B4','R',
  'A4','B4','D5','R', 'E5','R','R','R',
  'E5','G5','E5','D5', 'B4','R','E5','R',
  'G5','A5','G5','E5', 'D5','B4','R','R',
  'C5','D5','E5','G5', 'A5','G5','E5','D5',
  'B4','R','E5','R', 'R','R','R','R',
];

/** Triangle bass, quarter notes (32) */
const BOSS_BASS: string[] = [
  'E2','E2','E2','E2', 'E2','E2','B2','B2',
  'C3','C3','C3','C3', 'D3','D3','D3','D3',
  'E2','E2','E2','E2', 'G2','G2','G2','G2',
  'A2','A2','B2','B2', 'E2','E2','E2','E2',
];

/** Square arp, 16th notes (128) — Em chord driving */
const BOSS_ARP: string[] = [
  'E4','G4','B4','G4', 'E4','G4','B4','G4', 'E4','G4','B4','G4', 'E4','G4','B4','G4',
  'E4','G4','B4','G4', 'E4','G4','B4','G4', 'B3','D4','F#4','D4', 'B3','D4','F#4','D4',
  'C4','E4','G4','E4', 'C4','E4','G4','E4', 'C4','E4','G4','E4', 'C4','E4','G4','E4',
  'D4','F#4','A4','F#4', 'D4','F#4','A4','F#4', 'D4','F#4','A4','F#4', 'D4','F#4','A4','F#4',
  'E4','G4','B4','G4', 'E4','G4','B4','G4', 'E4','G4','B4','G4', 'E4','G4','B4','G4',
  'G3','B3','D4','B3', 'G3','B3','D4','B3', 'G3','B3','D4','B3', 'G3','B3','D4','B3',
  'A3','C4','E4','C4', 'A3','C4','E4','C4', 'B3','D4','F#4','D4', 'B3','D4','F#4','D4',
  'E4','G4','B4','G4', 'E4','G4','B4','G4', 'E4','G4','B4','G4', 'E4','G4','B4','G4',
];

// ── Waveform generators ────────────────────────────────────────────────────

function squareSample(phase: number, amp: number): number {
  return phase < 0.5 ? amp : -amp;
}
function sawtoothSample(phase: number, amp: number): number {
  return (2 * phase - 1) * amp;
}
function triangleSample(phase: number, amp: number): number {
  return (phase < 0.5 ? 4 * phase - 1 : 3 - 4 * phase) * amp;
}

const WAVE_FN = {
  square: squareSample,
  sawtooth: sawtoothSample,
  triangle: triangleSample,
} as const;

// ── Envelope constants ─────────────────────────────────────────────────────

const ATTACK_SAMPLES = 40;
const RELEASE_SAMPLES = 40;

// ── Main class ─────────────────────────────────────────────────────────────

export class RetroAudio {
  private ctx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private isPlaying = false;
  private currentTrack: BGMTrack = 'combat';
  private bufferCache = new Map<BGMTrack, AudioBuffer>();

  init(): void {
    this.ctx = new AudioContext();
    this.gainNode = this.ctx.createGain();
    const { volume, muted } = SaveManager.getBgmSettings();
    this.gainNode.gain.value = muted ? 0 : volume;
    this.gainNode.connect(this.ctx.destination);
  }

  play(): void {
    if (!this.ctx || this.isPlaying) return;
    if (this.ctx.state === 'suspended') void this.ctx.resume();

    const buffer = this.getOrCreateBuffer(this.currentTrack);
    this.sourceNode = this.ctx.createBufferSource();
    this.sourceNode.buffer = buffer;
    this.sourceNode.loop = true;
    this.sourceNode.connect(this.gainNode!);
    this.sourceNode.start();
    this.isPlaying = true;
  }

  stop(): void {
    if (this.sourceNode) {
      try { this.sourceNode.stop(); } catch { /* noop */ }
      this.sourceNode = null;
    }
    this.isPlaying = false;
  }

  setVolume(v: number): void {
    if (this.gainNode) this.gainNode.gain.value = Math.max(0, Math.min(1, v));
  }

  get playing(): boolean {
    return this.isPlaying;
  }

  /** Switch to a different track. Restarts if currently playing. */
  switchTrack(track: BGMTrack): void {
    if (this.currentTrack === track) return;
    this.currentTrack = track;
    if (this.isPlaying) {
      this.stop();
      this.play();
    }
  }

  get track(): BGMTrack {
    return this.currentTrack;
  }

  // ── Buffer cache ────────────────────────────────────────────────────────

  private getOrCreateBuffer(track: BGMTrack): AudioBuffer {
    let buf = this.bufferCache.get(track);
    if (!buf) {
      buf = this.generateTrack(track);
      this.bufferCache.set(track, buf);
    }
    return buf;
  }

  // ── Track generation ────────────────────────────────────────────────────

  private generateTrack(track: BGMTrack): AudioBuffer {
    if (!this.ctx) throw new Error('AudioContext not initialized');
    const sr = this.ctx.sampleRate;

    switch (track) {
      case 'menu': return this.generateMenu(sr);
      case 'combat': return this.generateCombat(sr);
      case 'boss': return this.generateBoss(sr);
    }
  }

  private generateCombat(sr: number): AudioBuffer {
    const quarterSec = 60 / COMBAT_BPM;
    const totalSec = 8 * 4 * quarterSec;
    const totalSamples = Math.ceil(totalSec * sr);
    const buf = this.ctx!.createBuffer(1, totalSamples, sr);
    const data = buf.getChannelData(0);

    // Lead — sawtooth, 8th notes
    this.renderLayer(data, sr, 'sawtooth', COMBAT_LEAD, quarterSec / 2, 0.08, 0.8);
    // Bass — triangle, quarter notes
    this.renderLayer(data, sr, 'triangle', COMBAT_BASS, quarterSec, 0.10, 0.85);
    // Arp — square, 16th notes
    this.renderLayer(data, sr, 'square', COMBAT_ARP, quarterSec / 4, 0.04, 0.7);
    // Drums
    this.renderDrums(data, sr, COMBAT_BPM, 8);

    return buf;
  }

  private generateMenu(sr: number): AudioBuffer {
    const quarterSec = 60 / MENU_BPM;
    const totalSec = 8 * 4 * quarterSec;
    const totalSamples = Math.ceil(totalSec * sr);
    const buf = this.ctx!.createBuffer(1, totalSamples, sr);
    const data = buf.getChannelData(0);

    // Arp — square, 8th notes, quiet
    this.renderLayer(data, sr, 'square', MENU_ARP, quarterSec / 2, 0.05, 0.6);
    // Bass — triangle, quarter notes, subtle
    this.renderLayer(data, sr, 'triangle', MENU_BASS, quarterSec, 0.06, 0.9);
    // No drums — atmospheric

    return buf;
  }

  private generateBoss(sr: number): AudioBuffer {
    const quarterSec = 60 / BOSS_BPM;
    const totalSec = 8 * 4 * quarterSec;
    const totalSamples = Math.ceil(totalSec * sr);
    const buf = this.ctx!.createBuffer(1, totalSamples, sr);
    const data = buf.getChannelData(0);

    // Lead — sawtooth, 8th notes, louder
    this.renderLayer(data, sr, 'sawtooth', BOSS_LEAD, quarterSec / 2, 0.10, 0.85);
    // Bass — triangle, quarter notes, heavy
    this.renderLayer(data, sr, 'triangle', BOSS_BASS, quarterSec, 0.12, 0.85);
    // Arp — square, 16th notes
    this.renderLayer(data, sr, 'square', BOSS_ARP, quarterSec / 4, 0.05, 0.7);
    // Drums — heavier
    this.renderDrums(data, sr, BOSS_BPM, 8, true);

    return buf;
  }

  // ── Layer renderer ──────────────────────────────────────────────────────

  private renderLayer(
    data: Float32Array,
    sr: number,
    wave: WaveType,
    notes: string[],
    noteDuration: number,
    amplitude: number,
    gateRatio: number,
  ): void {
    const fn = WAVE_FN[wave];
    const noteSamples = Math.floor(noteDuration * sr);
    const gateSamples = Math.floor(noteDuration * gateRatio * sr);

    for (let i = 0; i < notes.length; i++) {
      const freq = FREQ[notes[i]];
      if (!freq) continue; // skip rests (freq 0)

      const noteStart = Math.floor(i * noteDuration * sr);
      let phase = 0;
      const phaseInc = freq / sr;

      for (let s = 0; s < noteSamples; s++) {
        const idx = noteStart + s;
        if (idx >= data.length) break;

        if (s < gateSamples) {
          let env = 1.0;
          if (s < ATTACK_SAMPLES) env = s / ATTACK_SAMPLES;
          else if (s >= gateSamples - RELEASE_SAMPLES) env = (gateSamples - s) / RELEASE_SAMPLES;
          data[idx] += fn(phase, amplitude) * env;
        }

        phase += phaseInc;
        if (phase >= 1) phase -= 1;
      }
    }
  }

  // ── Drum renderer ───────────────────────────────────────────────────────

  private renderDrums(
    data: Float32Array,
    sr: number,
    bpm: number,
    bars: number,
    heavy = false,
  ): void {
    const quarterSec = 60 / bpm;
    const eighthSec = quarterSec / 2;
    const totalEighths = bars * 8;

    for (let e = 0; e < totalEighths; e++) {
      const t = e * eighthSec;
      const startSample = Math.floor(t * sr);
      const beatInBar = e % 8; // 0-7

      // Kick: beats 1, 3 (positions 0, 4) — or four-on-the-floor for heavy
      if (heavy ? beatInBar % 2 === 0 : (beatInBar === 0 || beatInBar === 4)) {
        this.renderKick(data, sr, startSample, heavy ? 0.14 : 0.12);
      }
      // Snare: beats 2, 4 (positions 2, 6)
      if (beatInBar === 2 || beatInBar === 6) {
        this.renderSnare(data, sr, startSample, heavy ? 0.10 : 0.07);
      }
      // Hihat: every 8th note
      this.renderHihat(data, sr, startSample, heavy ? 0.04 : 0.03);
    }
  }

  /** Kick — sine sweep 150→50 Hz with exponential decay */
  private renderKick(data: Float32Array, sr: number, start: number, amp: number): void {
    const dur = 0.1;
    const samples = Math.floor(dur * sr);
    for (let s = 0; s < samples; s++) {
      const idx = start + s;
      if (idx >= data.length) break;
      const t = s / sr;
      const env = Math.exp(-t * 30);
      const freq = 150 - 100 * (t / dur);
      data[idx] += Math.sin(2 * Math.PI * freq * t) * amp * env;
    }
  }

  /** Snare — white noise with decay */
  private renderSnare(data: Float32Array, sr: number, start: number, amp: number): void {
    const dur = 0.06;
    const samples = Math.floor(dur * sr);
    for (let s = 0; s < samples; s++) {
      const idx = start + s;
      if (idx >= data.length) break;
      const t = s / sr;
      const env = Math.exp(-t * 30);
      data[idx] += (Math.random() * 2 - 1) * amp * env;
    }
  }

  /** Hihat — short high-frequency noise burst */
  private renderHihat(data: Float32Array, sr: number, start: number, amp: number): void {
    const dur = 0.025;
    const samples = Math.floor(dur * sr);
    for (let s = 0; s < samples; s++) {
      const idx = start + s;
      if (idx >= data.length) break;
      const t = s / sr;
      const env = Math.exp(-t * 80);
      data[idx] += (Math.random() * 2 - 1) * amp * env;
    }
  }
}

// ── Singleton accessor ─────────────────────────────────────────────────────

let _instance: RetroAudio | null = null;

export function getRetroAudio(): RetroAudio {
  if (!_instance) {
    _instance = new RetroAudio();
    _instance.init();
  }
  return _instance;
}
