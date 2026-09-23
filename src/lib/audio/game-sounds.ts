/**
 * Named sounds, so game code says `sound("crit")` and never a file path.
 *
 * Two sources deliberately coexist:
 *
 * - **Sampled** one-shots, for the twelve impacts and stings that benefit from
 *   recorded character.
 * - **Synthesized** clicks and ticks, for anything that fires on a keystroke.
 *   At 100 WPM a typing sound plays ten times a second; sample playback there
 *   costs a decode, risks voice-stealing, and drifts behind the keypress.
 *   Oscillators start in well under a millisecond and cost nothing.
 *
 * Which one a given effect uses is an implementation detail behind `sound()`.
 */

import { play, resumeAudio, type Bus } from "@/lib/audio/audio-bus";

const SFX = "/audio/sfx";

export type SoundName =
  | "boss-spawn"
  | "level-up"
  | "relic-acquire"
  | "chest-open"
  | "card-play"
  | "shield-up"
  | "heal"
  | "crit-hit"
  | "enemy-death"
  | "player-death"
  | "race-start"
  | "new-record"
  // Word Blaster's boss encounter
  | "turret-fire"
  | "wb-explosion"
  | "boss-core-hit"
  | "boss-intro"
  | "boss-fanfare"
  | "base-alarm"
  | "combo-milestone"
  | "wb-defeat"
  // synthesized, below
  | "key-correct"
  | "key-wrong"
  | "word-complete"
  | "combo-up"
  | "select"
  | "tick";

const SAMPLED: Partial<Record<SoundName, string>> = {
  "boss-spawn": `${SFX}/sfx-boss-spawn.opus`,
  "level-up": `${SFX}/sfx-level-up.opus`,
  "relic-acquire": `${SFX}/sfx-relic-acquire.opus`,
  "chest-open": `${SFX}/sfx-chest-open.opus`,
  "card-play": `${SFX}/sfx-card-play.opus`,
  "shield-up": `${SFX}/sfx-shield-up.opus`,
  heal: `${SFX}/sfx-heal.opus`,
  "crit-hit": `${SFX}/sfx-crit-hit.opus`,
  "enemy-death": `${SFX}/sfx-enemy-death.opus`,
  "player-death": `${SFX}/sfx-player-death.opus`,
  "race-start": `${SFX}/sfx-race-start.opus`,
  "new-record": `${SFX}/sfx-new-record.opus`,
  "turret-fire": `${SFX}/sfx-turret-fire.opus`,
  "wb-explosion": `${SFX}/sfx-wb-explosion.opus`,
  "boss-core-hit": `${SFX}/sfx-boss-core-hit.opus`,
  "boss-intro": `${SFX}/sfx-boss-intro.opus`,
  "boss-fanfare": `${SFX}/sfx-boss-fanfare.opus`,
  "base-alarm": `${SFX}/sfx-base-alarm.opus`,
  "combo-milestone": `${SFX}/sfx-combo-milestone.opus`,
  "wb-defeat": `${SFX}/sfx-wb-defeat.opus`,
};

/** Every sampled file, for preloading a game's set up front. */
export const SAMPLED_URLS = Object.values(SAMPLED) as string[];

interface Tone {
  freq: number;
  toFreq?: number;
  ms: number;
  type?: OscillatorType;
  gain?: number;
  noise?: boolean;
}

const SYNTH: Partial<Record<SoundName, Tone[]>> = {
  "key-correct": [{ freq: 880, ms: 18, type: "sine", gain: 0.05 }],
  "key-wrong": [{ freq: 180, toFreq: 120, ms: 60, type: "sawtooth", gain: 0.08 }],
  "word-complete": [
    { freq: 660, ms: 40, type: "triangle", gain: 0.1 },
    { freq: 990, ms: 60, type: "triangle", gain: 0.08 },
  ],
  "combo-up": [{ freq: 520, toFreq: 1040, ms: 90, type: "square", gain: 0.06 }],
  select: [{ freq: 440, ms: 25, type: "sine", gain: 0.07 }],
  tick: [{ freq: 1200, ms: 12, type: "sine", gain: 0.04 }],
};

let ctxRef: AudioContext | null = null;
function synthContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctxRef) return ctxRef;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  ctxRef = new Ctor();
  return ctxRef;
}

function synth(tones: Tone[], volume: number): void {
  const ctx = synthContext();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume();

  let offset = 0;
  for (const t of tones) {
    const start = ctx.currentTime + offset;
    const stop = start + t.ms / 1000;
    const gain = ctx.createGain();
    // Exponential release, and never to exactly zero -- exponentialRampToValue
    // rejects 0, and a linear cut to silence clicks.
    gain.gain.setValueAtTime((t.gain ?? 0.08) * volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, stop);
    gain.connect(ctx.destination);

    const osc = ctx.createOscillator();
    osc.type = t.type ?? "sine";
    osc.frequency.setValueAtTime(t.freq, start);
    if (t.toFreq) osc.frequency.exponentialRampToValueAtTime(t.toFreq, stop);
    osc.connect(gain);
    osc.start(start);
    osc.stop(stop);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
    offset += t.ms / 1000;
  }
}

export interface SoundOptions {
  volume?: number;
  /** Randomised detune range in cents, for sounds that repeat rapidly. */
  vary?: number;
  bus?: Bus;
}

/**
 * Play a named sound. Silent and harmless when `enabled` is false, when the
 * asset is missing, or during SSR.
 */
export function sound(
  name: SoundName,
  enabled: boolean,
  opts: SoundOptions = {},
): void {
  if (!enabled || typeof window === "undefined") return;

  const tones = SYNTH[name];
  if (tones) {
    synth(tones, opts.volume ?? 1);
    return;
  }

  const url = SAMPLED[name];
  if (!url) return;
  resumeAudio();
  void play(url, {
    bus: opts.bus ?? "sfx",
    volume: opts.volume,
    detune: opts.vary ? (Math.random() * 2 - 1) * opts.vary : 0,
  });
}
