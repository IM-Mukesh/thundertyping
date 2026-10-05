/** Reuse the existing mixer/Opus pack. No additional contexts or asset fetches. */
import { play, playMusic, resumeAudio, stopMusic } from "@/lib/audio/audio-bus";
import type { WarState } from "@/lib/games/rakshasa/types";

export const WAR_AUDIO = {
  combat: "/audio/music/survivor-combat.opus",
  boss: "/audio/music/survivor-boss.opus",
  sword: "/audio/sfx/sfx-sword-hit.opus",
  kill: "/audio/sfx/sfx-enemy-death.opus",
  hurt: "/audio/sfx/sfx-player-hurt.opus",
  bossIntro: "/audio/sfx/sfx-boss-intro.opus",
  victory: "/audio/sfx/sfx-boss-victory-fanfare.opus",
  defeat: "/audio/sfx/sfx-boss-defeat-stinger.opus",
  special: "/audio/sfx/sfx-shield-up.opus",
  typo: "/audio/sfx/sfx-shield-block.opus",
} as const;

let feedback: AbortController | null = null;
const cancelFeedback = () => { feedback?.abort(); feedback = null; };
/** Catch unavailable/denied Web Audio at the game boundary; typing stays live. */
export function warAudioGesture(): void {
  feedback ??= new AbortController();
  try { resumeAudio(); } catch { /* silent mode */ }
}
export function warAudioStop(): void { cancelFeedback(); try { stopMusic(); } catch { /* silent mode */ } }
export function warAudioTrack(state: WarState, enabled: boolean): void {
  if (!enabled || ["paused", "menu"].includes(state.phase)) { warAudioStop(); return; }
  if (["victory", "defeat"].includes(state.phase)) { try { stopMusic(); } catch { /* silent mode */ } return; }
  try { void playMusic(state.boss ? WAR_AUDIO.boss : WAR_AUDIO.combat).catch(() => {}); } catch { /* silent mode */ }
}
function oneShot(url: string, volume = 0.5): void {
  feedback ??= new AbortController();
  try { void play(url, { volume, signal: feedback.signal }).catch(() => {}); } catch { /* silent mode */ }
}
/** At most one cue of each type per transition, not one decode per target. */
export function warAudioTransition(before: WarState, after: WarState, enabled: boolean): void {
  if (!enabled) return;
  const lastId = before.effects.at(-1)?.id ?? 0;
  const kinds = new Set(after.effects.filter((item) => item.id > lastId).map((item) => item.kind));
  if (after.incorrectKeys > before.incorrectKeys) oneShot(WAR_AUDIO.typo, 0.25);
  if (kinds.has("attack") || kinds.has("boss-hit")) oneShot(WAR_AUDIO.sword, 0.2);
  if (kinds.has("kill")) oneShot(WAR_AUDIO.kill, 0.45);
  if (kinds.has("hurt")) oneShot(WAR_AUDIO.hurt);
  if (kinds.has("special")) oneShot(WAR_AUDIO.special);
  if (before.phase !== after.phase) {
    if (after.phase === "boss-intro") oneShot(WAR_AUDIO.bossIntro);
    if (after.phase === "victory") oneShot(WAR_AUDIO.victory, 0.65);
    if (after.phase === "defeat") oneShot(WAR_AUDIO.defeat, 0.65);
  }
}
