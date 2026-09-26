/**
 * Fruit Fury Audio Engine: Fully procedural Web Audio synthesis for slice,
 * explosion, combo chords, fever fanfare, and dynamic background rhythms.
 *
 * Plugs directly into the shared HeroTyping audio mixer (`audio-bus.ts`),
 * respecting user master volume, music volume, SFX volume, and mute settings.
 * Works 100% offline with zero external audio assets required.
 */

const STATE_KEY = "__herotyping_audio__";

interface AudioBusState {
  ctx: AudioContext;
  master: GainNode;
  music: GainNode;
  sfx: GainNode;
}

function getAudioState(): AudioBusState | null {
  if (typeof window === "undefined") return null;
  const win = window as unknown as Record<string, unknown>;
  const bus = win[STATE_KEY] as AudioBusState | undefined;
  if (bus?.ctx && bus.sfx && bus.music) {
    if (bus.ctx.state === "suspended") {
      void bus.ctx.resume();
    }
    return bus;
  }

  // Fallback: standalone context if accessed prior to audio-bus initialization
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;

  if (!win["__fruit_fury_fallback_audio__"]) {
    const ctx = new Ctor();
    const master = ctx.createGain();
    const music = ctx.createGain();
    const sfx = ctx.createGain();
    music.connect(master);
    sfx.connect(master);
    master.connect(ctx.destination);
    win["__fruit_fury_fallback_audio__"] = { ctx, master, music, sfx };
  }
  const fb = win["__fruit_fury_fallback_audio__"] as AudioBusState;
  if (fb.ctx.state === "suspended") {
    void fb.ctx.resume();
  }
  return fb;
}

/** Crisp metallic blade swish followed by a juicy cut */
export function playSliceSound(enabled = true): void {
  if (!enabled) return;
  const bus = getAudioState();
  if (!bus) return;
  const { ctx, sfx } = bus;
  const now = ctx.currentTime;

  // Blade swoosh (Bandpassed white noise sweep)
  const bufferSize = Math.floor(ctx.sampleRate * 0.12);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }

  const noiseNode = ctx.createBufferSource();
  noiseNode.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(3200, now);
  filter.frequency.exponentialRampToValueAtTime(800, now + 0.1);
  filter.Q.value = 3.0;

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.28, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

  noiseNode.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(sfx);
  noiseNode.start(now);

  // Sharp tonal blade resonance
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(880 + Math.random() * 220, now);
  osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);

  oscGain.gain.setValueAtTime(0.18, now);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

  osc.connect(oscGain);
  oscGain.connect(sfx);
  osc.start(now);
  osc.stop(now + 0.1);
}

/** Juicy burst droplet sound */
export function playFruitBurstSound(enabled = true): void {
  if (!enabled) return;
  const bus = getAudioState();
  if (!bus) return;
  const { ctx, sfx } = bus;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  const startFreq = 400 + Math.random() * 150;
  osc.frequency.setValueAtTime(startFreq, now);
  osc.frequency.exponentialRampToValueAtTime(startFreq * 1.8, now + 0.04);
  osc.frequency.exponentialRampToValueAtTime(140, now + 0.16);

  gain.gain.setValueAtTime(0.22, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

  osc.connect(gain);
  gain.connect(sfx);
  osc.start(now);
  osc.stop(now + 0.2);
}

/** Ascending musical arpeggios that scale dynamically with combo count */
export function playComboSound(combo: number, enabled = true): void {
  if (!enabled) return;
  const bus = getAudioState();
  if (!bus) return;
  const { ctx, sfx } = bus;
  const now = ctx.currentTime;

  // Pentatonic scale degrees in Hz: C4, D4, E4, G4, A4, C5, D5, E5, G5, A5, C6
  const scale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
  const rootIndex = Math.min(combo % scale.length, scale.length - 2);
  const baseFreq = scale[rootIndex];
  const harmonyFreq = scale[rootIndex + 2] ?? baseFreq * 1.5;

  [baseFreq, harmonyFreq].forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = combo >= 5 ? "triangle" : "sine";
    osc.frequency.setValueAtTime(freq, now + idx * 0.04);

    const noteStart = now + idx * 0.04;
    gain.gain.setValueAtTime(0.14, noteStart);
    gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.28);

    osc.connect(gain);
    gain.connect(sfx);
    osc.start(noteStart);
    osc.stop(noteStart + 0.3);
  });
}

/** Catastrophic bomb detonation: sub-bass rumble, white-noise blast, distortion */
export function playBombExplosionSound(enabled = true): void {
  if (!enabled) return;
  const bus = getAudioState();
  if (!bus) return;
  const { ctx, sfx } = bus;
  const now = ctx.currentTime;

  // 1. Heavy low-frequency sub-drop
  const sub = ctx.createOscillator();
  const subGain = ctx.createGain();
  sub.type = "sawtooth";
  sub.frequency.setValueAtTime(140, now);
  sub.frequency.exponentialRampToValueAtTime(28, now + 0.85);

  subGain.gain.setValueAtTime(0.5, now);
  subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

  sub.connect(subGain);
  subGain.connect(sfx);
  sub.start(now);
  sub.stop(now + 0.95);

  // 2. White noise shockwave blast
  const bufSize = Math.floor(ctx.sampleRate * 0.7);
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.18));
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buf;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1600, now);
  filter.frequency.linearRampToValueAtTime(200, now + 0.6);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.45, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(sfx);
  noise.start(now);
}

/** Ticking warning for ticking bomb */
export function playBombWarningSound(enabled = true): void {
  if (!enabled) return;
  const bus = getAudioState();
  if (!bus) return;
  const { ctx, sfx } = bus;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(1200, now);
  osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);

  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

  osc.connect(gain);
  gain.connect(sfx);
  osc.start(now);
  osc.stop(now + 0.07);
}

/** Life lost / fruit fell off screen */
export function playMissSound(enabled = true): void {
  if (!enabled) return;
  const bus = getAudioState();
  if (!bus) return;
  const { ctx, sfx } = bus;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(180, now);
  osc.frequency.exponentialRampToValueAtTime(70, now + 0.25);

  gain.gain.setValueAtTime(0.18, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

  osc.connect(gain);
  gain.connect(sfx);
  osc.start(now);
  osc.stop(now + 0.3);
}

/** Fever mode activation fanfare */
export function playFeverStartSound(enabled = true): void {
  if (!enabled) return;
  const bus = getAudioState();
  if (!bus) return;
  const { ctx, sfx } = bus;
  const now = ctx.currentTime;

  const notes = [440, 554.37, 659.25, 880, 1108.73];
  notes.forEach((freq, i) => {
    const t = now + i * 0.06;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0.16, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(sfx);
    osc.start(t);
    osc.stop(t + 0.4);
  });
}

/** Golden Fruit celestial shimmer */
export function playGoldenFruitSound(enabled = true): void {
  if (!enabled) return;
  const bus = getAudioState();
  if (!bus) return;
  const { ctx, sfx } = bus;
  const now = ctx.currentTime;

  const freqs = [784, 987.77, 1174.66, 1567.98];
  freqs.forEach((f, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    const start = now + i * 0.05;
    osc.frequency.setValueAtTime(f, start);

    gain.gain.setValueAtTime(0.15, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.45);

    osc.connect(gain);
    gain.connect(sfx);
    osc.start(start);
    osc.stop(start + 0.5);
  });
}

/** Frost Berry crystalline slow-freeze sound */
export function playFrozenFruitSound(enabled = true): void {
  if (!enabled) return;
  const bus = getAudioState();
  if (!bus) return;
  const { ctx, sfx } = bus;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(1400, now);
  osc.frequency.exponentialRampToValueAtTime(520, now + 0.4);

  gain.gain.setValueAtTime(0.18, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

  osc.connect(gain);
  gain.connect(sfx);
  osc.start(now);
  osc.stop(now + 0.5);
}

/** Level Up chime */
export function playLevelUpSound(enabled = true): void {
  if (!enabled) return;
  const bus = getAudioState();
  if (!bus) return;
  const { ctx, sfx } = bus;
  const now = ctx.currentTime;

  const chords = [523.25, 659.25, 783.99, 1046.5];
  chords.forEach((freq, idx) => {
    const t = now + idx * 0.08;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.connect(gain);
    gain.connect(sfx);
    osc.start(t);
    osc.stop(t + 0.45);
  });
}

/**
 * Procedural Dynamic Synthesizer Soundtrack:
 * Rhythmic pulsing synthwave bass and arpeggio chords that react
 * to the gameplay state (faster, higher pitch, richer harmonic content during Fever).
 */
class ProceduralSynthMusic {
  private timer: number | null = null;
  private step = 0;
  private isFever = false;
  private isPlaying = false;
  private soundEnabled = true;

  public start(soundEnabled: boolean): void {
    this.soundEnabled = soundEnabled;
    this.isPlaying = true;
    this.step = 0;
    if (this.timer) clearInterval(this.timer);
    // 128 BPM -> 16th note ~ 117ms
    this.timer = window.setInterval(() => this.tick(), 125);
  }

  public setFever(isFever: boolean): void {
    this.isFever = isFever;
  }

  public setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
  }

  public stop(): void {
    this.isPlaying = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private tick(): void {
    if (!this.isPlaying || !this.soundEnabled) return;
    const bus = getAudioState();
    if (!bus) return;
    const { ctx, music } = bus;
    const now = ctx.currentTime;

    const normalBassNotes = [110, 110, 130.81, 110, 146.83, 110, 130.81, 164.81]; // A2 progression
    const feverBassNotes = [146.83, 146.83, 164.81, 146.83, 196.0, 164.81, 220.0, 246.94]; // Upbeat fever bass
    const bass = this.isFever ? feverBassNotes : normalBassNotes;
    const freq = bass[this.step % bass.length];

    // Bass synth pulse on eighth notes
    if (this.step % 2 === 0) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = this.isFever ? "sawtooth" : "triangle";
      osc.frequency.setValueAtTime(freq, now);

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(this.isFever ? 900 : 450, now);
      filter.frequency.exponentialRampToValueAtTime(150, now + 0.18);

      gain.gain.setValueAtTime(this.isFever ? 0.16 : 0.11, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(music);
      osc.start(now);
      osc.stop(now + 0.22);
    }

    // High shimmer arpeggio on sixteenth notes during Fever
    if (this.isFever && this.step % 2 === 1) {
      const arpFreqs = [587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66];
      const arpFreq = arpFreqs[(this.step * 3) % arpFreqs.length];

      const lead = ctx.createOscillator();
      const leadGain = ctx.createGain();
      lead.type = "sine";
      lead.frequency.setValueAtTime(arpFreq, now);

      leadGain.gain.setValueAtTime(0.08, now);
      leadGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      lead.connect(leadGain);
      leadGain.connect(music);
      lead.start(now);
      lead.stop(now + 0.12);
    }

    this.step++;
  }
}

export const musicPlayer = new ProceduralSynthMusic();
