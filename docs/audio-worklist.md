# HeroTyping — audio worklist

Generate one at a time, straight down the list. Each entry gives the **duration
to set**, the **filename to save as**, and the **prompt to paste**.

Ordered by how much the player actually hears each track, so if you run out of
credits, quota or patience partway, the audio that matters already exists.

## Settings that apply to every music generation

- **Instrumental only.** Tools that generate songs (Flow Music, Suno, Udio)
  default to vocals. Every prompt below already ends with "no vocals, no speech,
  instrumental only" — do not trim that line, and set an instrumental toggle too
  if the tool has one.
- **Download the highest quality offered**, WAV over MP3. These get re-encoded
  to Opus for the site, and re-encoding an MP3 is lossy-on-lossy — you hear it
  as smearing on sustained strings and pads.
- **Grab the stems if the tool offers stem split.** Separate drum/bass/melody
  files let the low-HP intensity shift be done by muting and re-adding layers in
  real time, which sounds far better than filtering a mixed track, and it means
  one combat bed covers both "normal" and "desperate".
- **Keep every variation** the tool returns. Suffix them `-a`, `-b`. Pick later
  in context, not on first listen: combat music is heard while concentrating on
  something else, and the take that impresses in isolation is often the one that
  grates by loop twenty.
- **Save into `assets-raw/audio/`** (gitignored).

## Duration

The durations below are targets. Pick the closest option your tool offers, and
**never go above about 4 minutes** — past that these models drift in tempo and
instrumentation, which is exactly what makes a loop impossible to cut cleanly.

If your tool caps at 60–90 seconds, that is fine for menus and stings but thin
for combat beds. Generate the combat tracks first and judge from those.

## Why the combat tracks are longer than the loop

The processing script cuts the loop out of the **middle** of the take, where the
tempo is steady, and crossfades the seam. So a 4-minute generation is not a
4-minute loop — it is four minutes of material to find a clean bar-aligned loop
point in. Longer take, better odds of a seamless loop.

## Why there is no separate "low HP" track

Tension is applied in code: a lowpass sweep over the combat bed plus a
synthesized heartbeat underneath — or layer muting, if you get stems. That gets
the intensity shift without doubling the track count.

---

# PRIORITY 1 — Combat tracks (most-heard audio in the project)

## 01

**FILE:** `music-spellbound-combat` · **4 min**

> Driving dark fantasy orchestral with an electronic pulse: staccato low strings on a repeating ostinato, taiko-style low percussion, tense sustained high violins, a subtle synth arpeggio underneath, 128 BPM, minor key, urgent and focused but never chaotic — a player must be able to concentrate over it. Seamless loop, constant tempo throughout, no intro, no outro, no fade in, no fade out, no vocals, no speech, instrumental only, consistent instrumentation from start to finish.

## 02

**FILE:** `music-survivor-combat` · **4 min**

> Relentless percussive action music: driving tribal war drums, aggressive distorted bass pulse, short brass stabs, fast shaker rhythm, 140 BPM, minor key, propulsive and unending, wave after wave with no let-up. Seamless loop, constant tempo throughout, no intro, no outro, no fade in, no fade out, no vocals, no speech, instrumental only, consistent instrumentation from start to finish.

## 03

**FILE:** `music-racer-combat` · **4 min**

> High-energy synthwave and darksynth race music: driving four-on-the-floor kick, aggressive arpeggiated analog bassline, bright lead synth, gated reverb snare, 150 BPM, minor key, pure forward momentum and speed. Seamless loop, constant tempo throughout, no intro, no outro, no fade in, no fade out, no vocals, no speech, instrumental only, consistent instrumentation from start to finish.

## 04

**FILE:** `music-cards-combat` · **4 min**

> Dark theatrical waltz: minor-key strings in three-four time, tack piano, muted trumpet, pizzicato double bass, a faint music-box bell, 110 BPM, elegant and sinister, an opulent decaying opera house, tension hiding under politeness. Seamless loop, constant tempo throughout, no intro, no outro, no fade in, no fade out, no vocals, no speech, instrumental only, consistent instrumentation from start to finish.

---

# PRIORITY 2 — Boss tracks

## 05

**FILE:** `music-spellbound-boss` · **2 min**

> Epic dark fantasy boss music: full low brass, pounding timpani and war drums, aggressive string ostinato, wordless choir swells, distorted synth bass underneath, 140 BPM, minor key, enormous and threatening, high stakes. Seamless loop, constant tempo throughout, no intro, no outro, no fade in, no fade out, no vocals, no speech, instrumental only, consistent instrumentation from start to finish.

## 06

**FILE:** `music-survivor-boss` · **2 min**

> Heavy hybrid orchestral boss music: enormous drum ensemble, snarling low brass, industrial metal hits, screaming high strings, distorted synth bass, 150 BPM, minor key, brutal and overwhelming. Seamless loop, constant tempo throughout, no intro, no outro, no fade in, no fade out, no vocals, no speech, instrumental only, consistent instrumentation from start to finish.

## 07

**FILE:** `music-racer-boss` · **2 min**

> Peak-intensity darksynth final-lap music: pounding kick, distorted acid bassline, soaring lead synth, rising tension riser textures, 160 BPM, minor key, exhilarating and dangerous. Seamless loop, constant tempo throughout, no intro, no outro, no fade in, no fade out, no vocals, no speech, instrumental only, consistent instrumentation from start to finish.

## 08

**FILE:** `music-cards-boss` · **2 min**

> Grand operatic boss theme: full dramatic strings, pipe organ, timpani rolls, a wordless soprano-like synth pad, crashing cymbals, 130 BPM, minor key, theatrical and enormous — a performance and a duel at the same time. Seamless loop, constant tempo throughout, no intro, no outro, no fade in, no fade out, no vocals, no speech, instrumental only, consistent instrumentation from start to finish.

---

# PRIORITY 3 — Menu tracks

## 09

**FILE:** `music-hub-menu` · **2 min**

> Dark synth ambient with a slow analog arpeggio, warm low pads, sparse bell tones, restrained and confident, unhurried, 80 BPM, minor key, spacious reverb, a sense of a quiet arcade at night. Not epic, not sad — inviting and slightly mysterious. Seamless loop, constant tempo throughout, no intro, no outro, no fade in, no fade out, no vocals, no speech, instrumental only, consistent instrumentation from start to finish.

## 10

**FILE:** `music-spellbound-menu` · **2 min**

> Dark fantasy ambient: bowed cello drone, a distant wordless choir pad, muted harp plucks, an occasional low bell, an atmosphere of dust and candlelight, 70 BPM, minor key, deep reverb, patient and ominous. Seamless loop, constant tempo throughout, no intro, no outro, no fade in, no fade out, no vocals, no speech, instrumental only, consistent instrumentation from start to finish.

## 11

**FILE:** `music-survivor-menu` · **2 min**

> Grim frontier ambient: a lone low fiddle drone, a distant war drum, wind and ember-crackle texture, sparse muted guitar harmonics, 75 BPM, minor key, weary and bracing, the calm before a siege. Seamless loop, constant tempo throughout, no intro, no outro, no fade in, no fade out, no vocals, no speech, instrumental only, consistent instrumentation from start to finish.

## 12

**FILE:** `music-racer-menu` · **2 min**

> Cool synthwave ambient: slow analog pad, gated reverb snare set far back in the mix, clean chorus guitar single notes, a neon night atmosphere, 90 BPM, minor key, confident and cold, waiting on the starting grid. Seamless loop, constant tempo throughout, no intro, no outro, no fade in, no fade out, no vocals, no speech, instrumental only, consistent instrumentation from start to finish.

*(Card Battle reuses `music-hub-menu` above — the moods match and it saves a generation.)*

---

# PRIORITY 4 — Stings

Only ~6 seconds are used; 1 min is just the minimum the tool allows. If credits
are running low, **skip these** — a victory fanfare synthesizes convincingly
with oscillators and costs nothing.

## 13

**FILE:** `music-sting-victory` · **1 min**

> A short triumphant resolution: a rising brass and synth swell landing on a bright major chord with a shimmering tail, then silence. Rewarding, clean, arcade-flavoured. No vocals, no speech, instrumental only.

## 14

**FILE:** `music-sting-defeat` · **1 min**

> A short defeat cue: a descending minor piano figure with a low detuned synth fall and a dry cutoff, then silence. Melancholy and final, not comedic, not a cartoon failure sound. No vocals, no speech, instrumental only.

---

# SOUND EFFECTS

All short one-shots, **under 2 seconds each**. Typing, combo and UI click sounds
are deliberately NOT here: at 100 WPM they fire ten times a second, where sample
playback costs decode latency and risks voice-stealing. Those stay synthesized
in `game-audio.ts`.

| # | FILE | Prompt |
|---|---|---|
| S01 | `sfx-boss-spawn` | A deep ominous impact with a long rising sub-bass swell and metallic resonance, announcing something enormous arriving. Dark and weighty. |
| S02 | `sfx-level-up` | A bright ascending magical chime, three quick rising notes with a shimmering tail. Rewarding and clean, not cute. |
| S03 | `sfx-relic-acquire` | A warm resonant singing-bowl tone with a soft magical sparkle tail, something precious being obtained. |
| S04 | `sfx-chest-open` | A wooden creak and metal latch release followed by a soft glittering shimmer. Tactile and physical. |
| S05 | `sfx-card-play` | A crisp card flicking through air and landing flat on felt, with a faint arcane whoosh underneath. |
| S06 | `sfx-shield-up` | A rising crystalline hum forming into a solid barrier, ending with a firm glassy set. |
| S07 | `sfx-heal` | A soft warm upward glow, gentle bell and breath texture, restorative and calm. |
| S08 | `sfx-crit-hit` | A sharp devastating impact: metallic crack with a heavy low punch and a short distorted tail. |
| S09 | `sfx-enemy-death` | A wet crunching collapse fading into a dust dissolve. Short, not gory, not comedic. |
| S10 | `sfx-player-death` | A heavy descending impact with a slow reverse-reverb swell and a hollow low drone settling. |
| S11 | `sfx-race-start` | A sharp electronic countdown beep followed by a powerful launch whoosh and engine surge. |
| S12 | `sfx-new-record` | A triumphant ascending electronic fanfare with a bright shimmer burst. Short and punchy. |

---

## Running total

| Priority | Tracks | Minutes generated |
|---|---|---|
| 1 — Combat | 4 | 16 |
| 2 — Boss | 4 | 8 |
| 3 — Menus | 3 | 6 |
| 4 — Stings | 2 | 2 |
| **Total** | **13** | **32** |

Plus 12 SFX one-shots.

## When you're done

1. Everything in `assets-raw/audio/` (gitignored).
2. Processing script trims each track to a clean bar-aligned loop, crossfades
   the seam, and encodes to Opus.
3. Music → `public/audio/music/`, SFX → `public/audio/sfx/`.
4. Expect roughly 15MB total.
