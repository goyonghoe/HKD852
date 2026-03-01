/**
 * RetroAudio — Procedural chiptune BGM generator using Web Audio API.
 * No audio files required; generates 8-bit style melody at runtime.
 *
 * Lead: square wave, C major pentatonic melody, 8 bars @ 110 BPM
 * Bass: triangle wave, root notes, quarter notes
 * Total loop duration: ~17.45 seconds
 */

// ── Note frequency table (Hz) ────────────────────────────────────────────────
const FREQ: Record<string, number> = {
  G2: 98.0,
  A2: 110.0,
  C3: 130.81,
  D3: 146.83,
  E3: 164.81,
  G3: 196.0,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  G4: 392.0,
  A4: 440.0,
  C5: 523.25,
  D5: 587.33,
};

// ── Melody sequences ─────────────────────────────────────────────────────────

/**
 * Lead melody — 64 eighth notes (8 bars × 8 eighth notes per bar).
 * Pentatonic C major: C D E G A
 */
const LEAD_NOTES: string[] = [
  // Bar 1
  'C4', 'E4', 'G4', 'A4', 'G4', 'E4', 'C4', 'E4',
  // Bar 2
  'D4', 'G4', 'A4', 'C5', 'A4', 'G4', 'E4', 'D4',
  // Bar 3
  'C4', 'E4', 'G4', 'C5', 'A4', 'G4', 'E4', 'C4',
  // Bar 4
  'D4', 'E4', 'G4', 'A4', 'G4', 'E4', 'D4', 'C4',
  // Bar 5
  'E4', 'G4', 'A4', 'C5', 'D5', 'C5', 'A4', 'G4',
  // Bar 6
  'A4', 'G4', 'E4', 'D4', 'E4', 'G4', 'A4', 'G4',
  // Bar 7
  'C4', 'E4', 'G4', 'A4', 'G4', 'E4', 'C4', 'E4',
  // Bar 8
  'D4', 'G4', 'A4', 'G4', 'E4', 'D4', 'C4', 'C4',
];

/**
 * Bass line — 32 quarter notes (8 bars × 4 quarter notes per bar).
 */
const BASS_NOTES: string[] = [
  // Bar 1
  'C3', 'C3', 'C3', 'C3',
  // Bar 2
  'A2', 'A2', 'A2', 'A2',
  // Bar 3
  'C3', 'C3', 'C3', 'C3',
  // Bar 4
  'G2', 'G2', 'G2', 'G2',
  // Bar 5
  'E3', 'E3', 'E3', 'E3',
  // Bar 6
  'A2', 'A2', 'A2', 'A2',
  // Bar 7
  'C3', 'C3', 'C3', 'C3',
  // Bar 8
  'G2', 'G2', 'C3', 'C3',
];

// ── Audio generation constants ────────────────────────────────────────────────
const BPM = 110;
const BEATS_PER_BAR = 4;
const BARS = 8;

/** Duration of one quarter note in seconds */
const QUARTER_SEC = 60.0 / BPM;
/** Duration of one eighth note in seconds */
const EIGHTH_SEC = QUARTER_SEC / 2;

/** Total loop duration in seconds */
const LOOP_DURATION_SEC = BARS * BEATS_PER_BAR * QUARTER_SEC;

const LEAD_AMPLITUDE = 0.12;
const BASS_AMPLITUDE = 0.08;

/** Gate ratio: note sounds for this fraction of its duration (rest is silence) */
const GATE_RATIO = 0.85;

/** Envelope attack/release in samples */
const ATTACK_SAMPLES = 50;
const RELEASE_SAMPLES = 50;

// ── Waveform generators ───────────────────────────────────────────────────────

/** Square wave: 50% duty cycle */
function squareSample(phase: number, amplitude: number): number {
  return phase < 0.5 ? amplitude : -amplitude;
}

/** Triangle wave */
function triangleSample(phase: number, amplitude: number): number {
  return (phase < 0.5 ? 4 * phase - 1 : 3 - 4 * phase) * amplitude;
}

// ── Main class ────────────────────────────────────────────────────────────────

export class RetroAudio {
  private ctx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private isPlaying = false;

  init(): void {
    this.ctx = new AudioContext();
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.value = 0.12;
    this.gainNode.connect(this.ctx.destination);
  }

  play(): void {
    if (!this.ctx || this.isPlaying) return;
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }

    const buffer = this.generateMelody();
    this.sourceNode = this.ctx.createBufferSource();
    this.sourceNode.buffer = buffer;
    this.sourceNode.loop = true;
    this.sourceNode.connect(this.gainNode!);
    this.sourceNode.start();
    this.isPlaying = true;
  }

  stop(): void {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
      } catch {
        // Ignore — may already be stopped
      }
      this.sourceNode = null;
    }
    this.isPlaying = false;
  }

  setVolume(v: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, v));
    }
  }

  get playing(): boolean {
    return this.isPlaying;
  }

  // ── Private: PCM buffer generation ─────────────────────────────────────────

  private generateMelody(): AudioBuffer {
    if (!this.ctx) throw new Error('AudioContext not initialized');

    const sampleRate = this.ctx.sampleRate;
    const totalSamples = Math.ceil(LOOP_DURATION_SEC * sampleRate);
    const buffer = this.ctx.createBuffer(1, totalSamples, sampleRate);
    const data = buffer.getChannelData(0);

    // Mix lead and bass into the same mono channel
    this.renderLead(data, sampleRate);
    this.renderBass(data, sampleRate);

    return buffer;
  }

  /**
   * Render lead melody (square wave, eighth notes) into the PCM data array.
   * Adds to existing values (allows mixing with bass).
   */
  private renderLead(data: Float32Array, sampleRate: number): void {
    const noteDuration = EIGHTH_SEC;
    const gateDuration = noteDuration * GATE_RATIO;
    const noteSamples = Math.floor(noteDuration * sampleRate);
    const gateSamples = Math.floor(gateDuration * sampleRate);

    for (let i = 0; i < LEAD_NOTES.length; i++) {
      const freq = FREQ[LEAD_NOTES[i]];
      if (!freq) continue;

      const noteStart = Math.floor(i * noteDuration * sampleRate);
      let phase = 0;
      const phaseInc = freq / sampleRate;

      for (let s = 0; s < noteSamples; s++) {
        const idx = noteStart + s;
        if (idx >= data.length) break;

        // Within gate window
        if (s < gateSamples) {
          let envelope = 1.0;
          if (s < ATTACK_SAMPLES) {
            envelope = s / ATTACK_SAMPLES;
          } else if (s >= gateSamples - RELEASE_SAMPLES) {
            envelope = (gateSamples - s) / RELEASE_SAMPLES;
          }
          data[idx] += squareSample(phase, LEAD_AMPLITUDE) * envelope;
        }
        // Silence for the remaining (1 - GATE_RATIO) portion — no sample written

        phase += phaseInc;
        if (phase >= 1) phase -= 1;
      }
    }
  }

  /**
   * Render bass line (triangle wave, quarter notes) into the PCM data array.
   * Adds to existing values (allows mixing with lead).
   */
  private renderBass(data: Float32Array, sampleRate: number): void {
    const noteDuration = QUARTER_SEC;
    const gateDuration = noteDuration * GATE_RATIO;
    const noteSamples = Math.floor(noteDuration * sampleRate);
    const gateSamples = Math.floor(gateDuration * sampleRate);

    for (let i = 0; i < BASS_NOTES.length; i++) {
      const freq = FREQ[BASS_NOTES[i]];
      if (!freq) continue;

      const noteStart = Math.floor(i * noteDuration * sampleRate);
      let phase = 0;
      const phaseInc = freq / sampleRate;

      for (let s = 0; s < noteSamples; s++) {
        const idx = noteStart + s;
        if (idx >= data.length) break;

        if (s < gateSamples) {
          let envelope = 1.0;
          if (s < ATTACK_SAMPLES) {
            envelope = s / ATTACK_SAMPLES;
          } else if (s >= gateSamples - RELEASE_SAMPLES) {
            envelope = (gateSamples - s) / RELEASE_SAMPLES;
          }
          data[idx] += triangleSample(phase, BASS_AMPLITUDE) * envelope;
        }

        phase += phaseInc;
        if (phase >= 1) phase -= 1;
      }
    }
  }
}

// ── Singleton accessor ────────────────────────────────────────────────────────

let _instance: RetroAudio | null = null;

export function getRetroAudio(): RetroAudio {
  if (!_instance) {
    _instance = new RetroAudio();
    _instance.init();
  }
  return _instance;
}
