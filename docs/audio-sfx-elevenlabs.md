# SFX worklist — ElevenLabs Sound Effects tab

Twelve one-shots, generated one at a time in the **Sound Effects** tab (not
Text to Speech, not Music).

## Settings for every one

- **Duration: 2 seconds.** If the tab offers "automatic", set it manually
  instead — automatic tends to pad with silence or stretch a hit into a texture.
- **Prompt influence: high.** These prompts are literal descriptions and you
  want literal results, not creative interpretation.
- **Download:** highest quality offered. MP3 is acceptable here — unlike music,
  these are sub-second sounds where re-encoding artefacts are inaudible.
- **Save into** `assets-raw/audio/sfx/`.

Prompts are deliberately short and concrete. ElevenLabs' SFX model responds to
plain sound description; the flowery phrasing that helps a music model actively
hurts here, because it starts trying to interpret mood instead of rendering a
sound.

Generate **S08 first** — a critical hit is the most-heard effect in the games
and the easiest to judge. If that one lands, the rest will.

---

| # | FILE | Prompt to paste |
|---|---|---|
| S01 | `sfx-boss-spawn` | Deep bass impact with rising metallic drone, huge and ominous |
| S02 | `sfx-level-up` | Bright magical chime, three ascending notes, sparkling tail |
| S03 | `sfx-relic-acquire` | Singing bowl struck once, warm resonant tone with magical sparkle |
| S04 | `sfx-chest-open` | Wooden chest creaking open, metal latch clicks, faint shimmer |
| S05 | `sfx-card-play` | Playing card flicks through air and lands flat on felt table |
| S06 | `sfx-shield-up` | Crystalline energy shield powers up, glassy hum, solid snap |
| S07 | `sfx-heal` | Soft warm healing glow, gentle bell, rising breath |
| S08 | `sfx-crit-hit` | Sharp metallic sword crack with heavy bass punch, brutal impact |
| S09 | `sfx-enemy-death` | Monster collapses with wet crunch, fading into dust |
| S10 | `sfx-player-death` | Heavy descending impact, reverse reverb swell, hollow drone |
| S11 | `sfx-race-start` | Electronic countdown beep, then engine launches away fast |
| S12 | `sfx-new-record` | Short triumphant electronic fanfare, rising, bright sparkle burst |

---

## If a result disappoints

Two things that reliably help, in order:

1. **Cut words.** "Sharp metallic sword crack with heavy bass punch, brutal
   impact" beating a longer version is normal — this model renders nouns and
   verbs, not adjectives about feeling.
2. **Name the physical source.** "Singing bowl struck once" works because it is
   a real object making a real sound. "Warm resonant tone of something precious
   being obtained" does not, because nothing in it is a sound.

## Fallback

Any of these that will not come out right, say so and I will synthesize it in
code instead. Impacts, chimes, whooshes and stings are all well within reach of
oscillators and filtered noise, which is what `game-audio.ts` already does for
the existing six games. Zero files, zero licensing, zero latency — and for
S02, S07 and S12 in particular, synthesis is arguably the better result anyway,
since those are pure tones rather than recorded material.
