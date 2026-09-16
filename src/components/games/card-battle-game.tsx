"use client";

import type { GameComponentProps } from "@/components/games/game-client";

/**
 * Card Battle — scaffold.
 *
 * Owned end to end by the card-battle workstream. The shared systems this should
 * build on already exist and must not be reimplemented here:
 *
 *   @/lib/audio/audio-bus      mixer, music crossfade, ducking, preload
 *   @/lib/audio/game-sounds    sound(name, enabled) over samples + synthesis
 *   @/lib/fx/particles         FxSystem: pooled particles, shake, floating text
 *   @/lib/rng/seeded-rng       createRng(seed), dailySeedFor(gameId)
 *   @/lib/profile/player-profile  awardXp, grantAchievement, bumpStat, streaks
 *   @/lib/games/game-art-assets   getArt("card-battle", role)
 *
 * Art lives at public/games/card-battle/<role>.webp; music at
 * /audio/music/<track>.opus.
 */
export default function CardBattleGame({ definition }: GameComponentProps) {
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
