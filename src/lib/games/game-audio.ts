"use client";

// Every sound here is synthesised with the Web Audio API rather than loaded
// from a file. That matters for this app specifically:
//
// - Keystroke feedback has to land within a few milliseconds of the key, and
//   an oscillator started on demand beats decoding/scheduling a buffer.
// - Zero network weight and zero requests, on a site that cares about INP and
//   deliberately ships no third-party assets.
// - Nothing to license, and the timbres can be tuned by editing numbers.
//
// The context is created lazily on the first real interaction, because
// browsers refuse to start audio before a user gesture.

type SoundName = "key" | "typo" | "clear" | "combo" | "miss" | "over" | "start";

let ctx: AudioContext | null = null;
/** Master gain, so one node mutes everything and keeps overall level sane. */
let master: GainNode | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0.22;
    master.connect(ctx.destination);
    return ctx;
  } catch {
    // Audio unavailable (blocked, no output device) — every call becomes a
    // no-op rather than throwing into a keystroke handler.
    return null;
  }
}

interface ToneOptions {
  freq: number;
  /** Ramp to this frequency over the note, giving a rise or a fall. */
  toFreq?: number;
  durationMs: number;
  type?: OscillatorType;
  gain?: number;
  delayMs?: number;
}

function tone({ freq, toFreq, durationMs, type = "sine", gain = 1, delayMs = 0 }: ToneOptions): void {
  const audio = getContext();
  if (!audio || !master) return;

  const start = audio.currentTime + delayMs / 1000;
  const end = start + durationMs / 1000;

  const osc = audio.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (toFreq !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(1, toFreq), end);

  // A short attack and an exponential decay to near-silence: a linear ramp to
  // exactly 0 clicks audibly at the tail.
  const env = audio.createGain();
  env.gain.setValueAtTime(0.0001, start);
  env.gain.exponentialRampToValueAtTime(gain, start + 0.008);
  env.gain.exponentialRampToValueAtTime(0.0001, end);

  osc.connect(env);
  env.connect(master);
  osc.start(start);
  osc.stop(end + 0.02);
}

const SOUNDS: Record<SoundName, () => void> = {
  // Soft, short, and slightly detuned per press so fast typing doesn't turn
  // into one flat repeated beep.
  key: () =>
    tone({
      freq: 420 + Math.random() * 90,
      durationMs: 45,
      type: "triangle",
      gain: 0.32,
    }),
  // Deliberately quiet and low. A typo is common and self-correcting, so it
  // gets a nudge — losing a life is what earns the harsh sound.
  typo: () => tone({ freq: 190, durationMs: 55, type: "square", gain: 0.16 }),
  clear: () => {
    tone({ freq: 620, toFreq: 950, durationMs: 110, type: "triangle", gain: 0.5 });
    tone({ freq: 930, toFreq: 1420, durationMs: 130, type: "sine", gain: 0.28, delayMs: 45 });
  },
  // Rising arpeggio, used when a combo crosses a milestone.
  combo: () => {
    [700, 900, 1180].forEach((freq, i) =>
      tone({ freq, durationMs: 90, type: "square", gain: 0.2, delayMs: i * 55 }),
    );
  },
  miss: () => tone({ freq: 260, toFreq: 120, durationMs: 260, type: "sawtooth", gain: 0.4 }),
  over: () => {
    [440, 330, 247, 165].forEach((freq, i) =>
      tone({ freq, durationMs: 300, type: "triangle", gain: 0.42, delayMs: i * 130 }),
    );
  },
  start: () => {
    [420, 560, 780].forEach((freq, i) =>
      tone({ freq, durationMs: 120, type: "triangle", gain: 0.34, delayMs: i * 70 }),
    );
  },
};

/**
 * Plays a sound if the caller says sound is enabled. Safe to call from hot
 * paths and from SSR — it no-ops when audio isn't available.
 */
export function playSound(name: SoundName, enabled: boolean): void {
  if (!enabled) return;
  const audio = getContext();
  if (!audio) return;
  // Browsers start the context suspended until a gesture; resume is a no-op
  // once it's already running.
  if (audio.state === "suspended") void audio.resume().catch(() => {});
  try {
    SOUNDS[name]();
  } catch {
    // never let an audio failure break gameplay
  }
}
