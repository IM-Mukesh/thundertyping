/**
 * Type Before Death's audio owner.
 *
 * The game deliberately uses the shared HeroTyping mixer and the existing
 * local combat pack. There is one owner-scoped AbortController for one-shots,
 * so an unmount or restart cannot leave a pending cue playing into another
 * game. Missing audio, autoplay policy and muted settings are all silent
 * failure modes; none can block typing.
 */
import {
  play,
  playMusic,
  preload,
  resumeAudio,
  stopMusic,
  type Bus,
} from "@/lib/audio/audio-bus";
import type { DeathState } from "@/lib/games/type-before-death/types";

export const TYPE_BEFORE_DEATH_AUDIO = Object.freeze({
  music: "/audio/music/survivor-combat.opus",
  bossMusic: "/audio/music/survivor-boss.opus",
  cues: Object.freeze({
    shot: "/audio/sfx/sfx-sword-hit.opus",
    kill: "/audio/sfx/sfx-enemy-death.opus",
    hurt: "/audio/sfx/sfx-player-hurt.opus",
    bossIntro: "/audio/sfx/sfx-boss-intro.opus",
    victory: "/audio/sfx/sfx-boss-victory-fanfare.opus",
    defeat: "/audio/sfx/sfx-boss-defeat-stinger.opus",
    upgrade: "/audio/sfx/sfx-shield-up.opus",
    typo: "/audio/sfx/sfx-shield-block.opus",
    jam: "/audio/sfx/sfx-shield-block.opus",
  }),
} as const);

export type TypeBeforeDeathAudioCue = keyof typeof TYPE_BEFORE_DEATH_AUDIO.cues;

const CUE_VOLUME: Readonly<Record<TypeBeforeDeathAudioCue, number>> = {
  shot: 0.18,
  kill: 0.42,
  hurt: 0.72,
  bossIntro: 0.8,
  victory: 0.68,
  defeat: 0.62,
  upgrade: 0.42,
  typo: 0.2,
  jam: 0.34,
};
const SFX_BUS: Bus = "sfx";

let fallbackFeedback: AbortController | null = null;

function safe(action: () => void): void {
  try { action(); } catch { /* Web Audio is optional. */ }
}

export function deathAudioGesture(): void {
  safe(() => resumeAudio());
  if (!fallbackFeedback || fallbackFeedback.signal.aborted) fallbackFeedback = new AbortController();
  try { preload(Object.values(TYPE_BEFORE_DEATH_AUDIO.cues)); } catch { /* silent mode */ }
}

export function deathAudioStop(): void {
  fallbackFeedback?.abort();
  fallbackFeedback = null;
  safe(() => stopMusic());
}

function cue(name: TypeBeforeDeathAudioCue, enabled: boolean): void {
  if (!enabled) return;
  fallbackFeedback ??= new AbortController();
  const signal = fallbackFeedback.signal;
  safe(() => { void play(TYPE_BEFORE_DEATH_AUDIO.cues[name], { bus: SFX_BUS, volume: CUE_VOLUME[name], signal }).catch(() => {}); });
}

export function deathAudioTrack(state: DeathState, enabled: boolean): void {
  if (!enabled || state.phase === "menu" || state.phase === "paused" || state.phase === "results" || state.phase === "upgrade") {
    safe(() => stopMusic());
    return;
  }
  safe(() => { void playMusic(state.phase === "boss" ? TYPE_BEFORE_DEATH_AUDIO.bossMusic : TYPE_BEFORE_DEATH_AUDIO.music).catch(() => {}); });
}

/** Selects at most one cue per semantic event in a state transition. */
export function deathAudioTransition(before: DeathState, after: DeathState, enabled: boolean): void {
  if (!enabled) return;
  const jammed = after.jams > before.jams;
  // A jam is also caused by a mistake, but both cues use the same block
  // sample. Prefer the jam cue so one physical key cannot double-trigger it.
  if (after.incorrectKeys > before.incorrectKeys && !jammed) cue("typo", enabled);
  if (jammed) cue("jam", enabled);
  const beforeEffect = before.effects.at(-1)?.id ?? 0;
  const newEffects = after.effects.filter((effect) => effect.id > beforeEffect);
  const kinds = new Set(newEffects.map((effect) => effect.kind));
  if (kinds.has("shot") || kinds.has("hit")) cue("shot", enabled);
  if (kinds.has("kill")) cue("kill", enabled);
  if (kinds.has("hurt") || kinds.has("breach") || kinds.has("acid") || kinds.has("explosion")) cue("hurt", enabled);
  if (kinds.has("upgrade")) cue("upgrade", enabled);
  if (kinds.has("boss-phase") || (before.phase !== "boss" && after.phase === "boss")) cue("bossIntro", enabled);
  if (kinds.has("overdrive")) cue("upgrade", enabled);
  if (after.phase === "results" && before.phase !== "results") cue(after.outcome === "victory" ? "victory" : "defeat", enabled);
}
