/**
 * Falling Words' audio owner.
 *
 * This module intentionally talks to the shared audio bus directly. The older
 * game-audio helpers have their own oscillator context, while the bus is the
 * application-wide owner for decoded samples and music. Keeping the owner
 * here small also means a game can be mounted, restarted, or removed without
 * leaving an in-flight cue behind.
 */

import {
  play as playOnSharedBus,
  playMusic as playSharedMusic,
  preload,
  resumeAudio,
  stopMusic as stopSharedMusic,
  type Bus,
} from "@/lib/audio/audio-bus";

export type FallingWordsAudioCue =
  | "key"
  | "typo"
  | "freeze"
  | "spawn"
  | "clear"
  | "combo"
  | "phase"
  | "miss"
  | "overdrive"
  | "milestone"
  | "victory"
  | "defeat";

export type FallingWordsAudioStatus =
  | "idle"
  | "running"
  | "paused"
  | "over"
  | "victory"
  | "defeat";

export type FallingWordsAudioOutcome = "victory" | "defeat";

/** The audio layer only needs an id to detect a newly spawned word. */
export interface FallingWordsAudioWord {
  readonly id: number;
}

/**
 * The minimal state projection accepted by the transition API.
 *
 * `GameState` from `use-falling-words.ts` is structurally assignable to this
 * type, so a component can pass its state directly. `outcome` and
 * `milestone` are optional escape hatches for a redesign that adds an
 * explicit win screen or a milestone counter without making this module own
 * game rules.
 */
export interface FallingWordsAudioState {
  readonly status: FallingWordsAudioStatus;
  readonly words: readonly FallingWordsAudioWord[];
  readonly cleared: number;
  readonly combo: number;
  readonly missed: number;
  readonly phase: number;
  readonly overdriveMs: number;
  readonly slowdownMs?: number;
  readonly correctKeystrokes?: number;
  readonly incorrectKeystrokes?: number;
  readonly outcome?: FallingWordsAudioOutcome;
  /** A monotonically increasing token for non-combo UI milestones. */
  readonly milestone?: number;
}

/** Original deterministic sound design; rebuild with scripts/generate-skyfall-audio.mjs. */
export const FALLING_WORDS_AUDIO = Object.freeze({
  music: "/audio/skyfall/music-calm.opus",
  storm: "/audio/skyfall/music-storm.opus",
  overdrive: "/audio/skyfall/music-overdrive.opus",
  cues: Object.freeze({
    key: "/audio/skyfall/key.opus",
    typo: "/audio/skyfall/typo.opus",
    freeze: "/audio/skyfall/freeze.opus",
    spawn: "/audio/skyfall/spawn.opus",
    clear: "/audio/skyfall/clear.opus",
    combo: "/audio/skyfall/combo.opus",
    phase: "/audio/skyfall/phase.opus",
    miss: "/audio/skyfall/miss.opus",
    overdrive: "/audio/skyfall/overdrive.opus",
    milestone: "/audio/skyfall/milestone.opus",
    victory: "/audio/skyfall/victory.opus",
    defeat: "/audio/skyfall/defeat.opus",
  }),
} as const);

const CUE_VOLUME: Readonly<Record<FallingWordsAudioCue, number>> = Object.freeze({
  key: 0.7,
  typo: 0.6,
  freeze: 0.7,
  spawn: 0.16,
  clear: 0.34,
  combo: 0.28,
  phase: 0.48,
  miss: 0.32,
  overdrive: 0.42,
  milestone: 0.52,
  victory: 0.68,
  defeat: 0.58,
});

const COMBO_MILESTONE_STEP = 5;
const MAX_TRACKED_WORDS = 32;
const MAX_CUES_PER_TRANSITION = 6;
const SFX_BUS: Bus = "sfx";

export const FALLING_WORDS_AUDIO_URLS = Object.freeze([
  FALLING_WORDS_AUDIO.music,
  ...Object.values(FALLING_WORDS_AUDIO.cues),
]);

function counter(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function entered(before: number, after: number): boolean {
  return counter(before) <= 0 && counter(after) > 0;
}

function crossedComboMilestone(before: number, after: number): boolean {
  return (
    Math.floor(counter(after) / COMBO_MILESTONE_STEP) >
    Math.floor(counter(before) / COMBO_MILESTONE_STEP)
  );
}

function hasNewWord(before: FallingWordsAudioState, after: FallingWordsAudioState): boolean {
  const previousIds = new Set(
    before.words
      .slice(0, MAX_TRACKED_WORDS)
      .map((word) => word.id)
      .filter((id) => Number.isFinite(id)),
  );
  return after.words
    .slice(0, MAX_TRACKED_WORDS)
    .some((word) => Number.isFinite(word.id) && !previousIds.has(word.id));
}

function isVictory(state: FallingWordsAudioState): boolean {
  return state.outcome === "victory" || state.status === "victory";
}

function isDefeat(state: FallingWordsAudioState): boolean {
  return state.outcome === "defeat" || state.status === "defeat" || state.status === "over";
}

/**
 * Selects at most one of each cue from one state transition.
 *
 * The function is deliberately side-effect free. Replaying the same pair is
 * therefore deterministic, and the controller below adds a transition key
 * when a component needs duplicate-call protection.
 */
export function selectFallingWordsCues(
  before: FallingWordsAudioState,
  after: FallingWordsAudioState,
): FallingWordsAudioCue[] {
  const cues: FallingWordsAudioCue[] = [];
  const add = (cue: FallingWordsAudioCue) => {
    if (cues.length < MAX_CUES_PER_TRANSITION && !cues.includes(cue)) cues.push(cue);
  };

  if (counter(after.correctKeystrokes ?? 0) > counter(before.correctKeystrokes ?? 0) && after.cleared === before.cleared) add("key");
  if (counter(after.incorrectKeystrokes ?? 0) > counter(before.incorrectKeystrokes ?? 0)) add("typo");
  if (entered(before.slowdownMs ?? 0, after.slowdownMs ?? 0)) add("freeze");
  if (hasNewWord(before, after)) add("spawn");
  if (counter(after.cleared) > counter(before.cleared)) add("clear");
  if (crossedComboMilestone(before.combo, after.combo)) add("combo");
  if (counter(after.phase) > counter(before.phase)) add("phase");
  if (counter(after.missed) > counter(before.missed)) add("miss");
  if (entered(before.overdriveMs, after.overdriveMs)) add("overdrive");
  if (
    after.milestone !== undefined &&
      counter(after.milestone) > counter(before.milestone ?? 0)
  ) {
    add("milestone");
  }

  if (isVictory(after) && !isVictory(before)) add("victory");
  else if (isDefeat(after) && !isDefeat(before)) add("defeat");

  return cues;
}

function transitionKey(state: FallingWordsAudioState): string {
  const ids = state.words
    .slice(0, MAX_TRACKED_WORDS)
    .map((word) => word.id)
    .join(",");
  return [
    state.status,
    state.outcome ?? "",
    counter(state.cleared),
    counter(state.combo),
    counter(state.missed),
    counter(state.phase),
    state.overdriveMs > 0 ? 1 : 0,
    counter(state.milestone ?? 0),
    counter(state.correctKeystrokes ?? 0),
    counter(state.incorrectKeystrokes ?? 0),
    (state.slowdownMs ?? 0) > 0 ? 1 : 0,
    ids,
  ].join("|");
}

function safeResumeAudio(): void {
  try {
    resumeAudio();
  } catch {
    // Web Audio is optional; a failed gesture unlock must not affect gameplay.
  }
}

/** Warm the shared context and bounded Falling Words sample set from a gesture. */
export function warmFallingWordsAudio(): void {
  safeResumeAudio();
  try {
    // Music variations load only when selected, not all three at each start.
    preload(Object.values(FALLING_WORDS_AUDIO.cues));
  } catch {
    // Missing fetch, decode, or an unavailable output device is silent mode.
  }
}

export interface FallingWordsAudioController {
  /** Resume and preload the shared bus. Call from the Play button/key gesture. */
  warm(): void;
  /** Start the idempotent shared music bed. */
  startMusic(enabled?: boolean): void;
  /** Stop only the shared music bed; terminal one-shots may finish. */
  stopMusic(): void;
  /** Keep the bed aligned with the current run status and sound preference. */
  reconcileMusic(status: FallingWordsAudioStatus, enabled: boolean, phase?: number, overdrive?: boolean): void;
  /** Trigger one named cue; safe when audio is disabled or unavailable. */
  playCue(cue: FallingWordsAudioCue, enabled?: boolean): void;
  /** Select and play cues for a state transition, ignoring duplicate snapshots. */
  transition(
    before: FallingWordsAudioState,
    after: FallingWordsAudioState,
    enabled?: boolean,
  ): FallingWordsAudioCue[];
  /** Idempotent owner cleanup for unmount or a hard restart. */
  stop(): void;
}

/**
 * Create one owner per mounted game instance. It holds no AudioContext; all
 * playback remains in `audio-bus.ts` and this owner only holds cancellation
 * state for its own in-flight one-shots.
 */
export function createFallingWordsAudio(): FallingWordsAudioController {
  let feedback: AbortController | null = null;
  let musicState: "unknown" | "playing" | "stopped" = "unknown";
  let lastTransitionKey: string | null = null;
  let track: string | null = null;

  const signal = (): AbortSignal => {
    if (!feedback || feedback.signal.aborted) feedback = new AbortController();
    return feedback.signal;
  };

  const stopOwnedCues = () => {
    feedback?.abort();
    feedback = null;
  };

  const startMusic = (enabled = true, nextTrack: string = FALLING_WORDS_AUDIO.music): void => {
    if (!enabled) {
      stopMusic();
      return;
    }
    if (musicState === "playing" && track === nextTrack) return;
    musicState = "playing";
    track = nextTrack;
    try {
      void playSharedMusic(nextTrack).catch(() => {
        // A missing/blocked bed is allowed; cues and gameplay remain live.
      });
    } catch {
      // AudioContext construction can fail synchronously in restricted browsers.
    }
  };

  const stopMusic = (): void => {
    if (musicState === "stopped") return;
    musicState = "stopped";
    track = null;
    try {
      stopSharedMusic();
    } catch {
      // Stopping an unavailable shared bus is already the desired result.
    }
  };

  const reconcileMusic = (status: FallingWordsAudioStatus, enabled: boolean, phase = 1, overdrive = false): void => {
    if (enabled && status === "running") startMusic(true, overdrive ? FALLING_WORDS_AUDIO.overdrive : phase >= 3 ? FALLING_WORDS_AUDIO.storm : FALLING_WORDS_AUDIO.music);
    else {
      stopMusic();
      if (!enabled || status === "paused" || status === "idle") stopOwnedCues();
    }
  };

  const playCue = (cue: FallingWordsAudioCue, enabled = true): void => {
    if (!enabled || typeof window === "undefined") return;
    try {
      void playOnSharedBus(FALLING_WORDS_AUDIO.cues[cue], {
        bus: SFX_BUS,
        volume: CUE_VOLUME[cue],
        signal: signal(),
      }).catch(() => {
        // A cue is decoration; an absent/undecodable sample is silent mode.
      });
    } catch {
      // Never let an audio failure escape a typing/gameplay path.
    }
  };

  const transition = (
    before: FallingWordsAudioState,
    after: FallingWordsAudioState,
    enabled = true,
  ): FallingWordsAudioCue[] => {
    const key = transitionKey(after);
    if (key === lastTransitionKey) return [];
    lastTransitionKey = key;
    const cues = selectFallingWordsCues(before, after);
    for (const cue of cues) playCue(cue, enabled);
    return cues;
  };

  const stop = (): void => {
    stopOwnedCues();
    stopMusic();
    lastTransitionKey = null;
  };

  return {
    warm: warmFallingWordsAudio,
    startMusic,
    stopMusic,
    reconcileMusic,
    playCue,
    transition,
    stop,
  };
}
