"use client";

import type { GameComponentProps } from "@/components/games/game-client";

/**
 * Typing Survivor — scaffold.
 *
 * Owned end to end by the typing-survivor workstream. The shared systems this should
 * build on already exist and must not be reimplemented here:
 *
 *   @/lib/audio/audio-bus      mixer, music crossfade, ducking, preload
 *   @/lib/audio/game-sounds    sound(name, enabled) over samples + synthesis
 *   @/lib/fx/particles         FxSystem: pooled particles, shake, floating text
 *   @/lib/rng/seeded-rng       createRng(seed), dailySeedFor(gameId)
 *   @/lib/profile/player-profile  awardXp, grantAchievement, bumpStat, streaks
 *   @/lib/games/game-art-assets   getArt("typing-survivor", role)
 *
 * Art lives at public/games/typing-survivor/<role>.webp; music at
 * /audio/music/<track>.opus.
 */
export default function TypingSurvivorGame({ definition }: GameComponentProps) {
  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-4 py-12 text-center">
      <p className="font-mono text-sm uppercase tracking-widest text-accent">
        {definition.name}
      </p>
      <p className="max-w-md text-sm text-sub">
        This game is under construction.
      </p>
    </div>
  );
}
