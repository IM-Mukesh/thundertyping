# SFX worklist — ElevenLabs Sound Effects

Twelve one-shots. Generate one at a time in the **Sound Effects** tab.

---

## Settings

- **Prompt influence: raise it to about 80%.** At the default it interprets
  mood; higher, it renders what you actually wrote. If results sound harsh or
  noisy, this is the first dial to move.
- **Duration:** set per effect, given with each prompt below. Leave the clock on
  Auto only where it says Auto.
- **Download: WAV / PCM** at the highest sample rate offered. These are all
  transient-heavy, and transients are where lossy codecs smear.
- **Turn off Explore sharing** — generations are published publicly by default;
  there is a Disable link beside that notice.
- **Save into** `assets-raw/audio/sfx/`.
- **Cost:** ~200 credits per generation, 4 variations each.

## Why these prompts are shaped this way

Each one names a **real physical object doing a real thing**, then states the
**tonal quality** wanted. That combination is what the model renders well.

The previous versions leaned on words like *sharp*, *crack*, *brutal* and
*devastating*. Those describe an impression rather than a sound, and they push
the model toward harsh, noisy, digital-sounding output — which is exactly the
irritating result. "A sword striking metal armour" gives it something real to
render; "a brutal crack" gives it nothing but aggression.

Where a sound could plausibly come out harsh, the prompt now says so explicitly
at the end. Keep those clauses.

---

## S01 · `sfx-boss-spawn` · **3 seconds**

```
Cinematic trailer impact: one huge deep drum hit, followed by an enormous iron
gate groaning open in a stone cathedral, the metallic tone rising slowly in
pitch. Deep, smooth and powerful, with a long low rumble underneath. Clean
cinematic sound design, no distortion, no static, no harsh high frequencies.
```

## S02 · `sfx-level-up` · **1.5 seconds**

```
Three clear glockenspiel notes ascending quickly, bright and bell-like, with a
soft magical shimmer fading gently after the last note. Clean, warm and
musical, the reward sound of a polished video game. Gentle, not piercing.
```

## S03 · `sfx-relic-acquire` · **2 seconds**

```
A Tibetan singing bowl struck once with a soft felt mallet, ringing out with a
warm sustained tone, with delicate glass wind chimes sparkling quietly
underneath. Peaceful, rich and resonant, recorded close in a quiet room.
```

## S04 · `sfx-chest-open` · **1.5 seconds**

```
An old wooden treasure chest being opened: hinges creaking, a heavy iron latch
clicking free, then a soft sprinkle of small gold coins settling inside. Warm,
woody, tactile foley recorded close up.
```

## S05 · `sfx-card-play` · **Auto (about 1 second)**

```
A single playing card thrown from a dealer's hand, whooshing softly through the
air and landing flat on a green felt table. Crisp, quiet, close-miked foley in
a small room.
```

## S06 · `sfx-shield-up` · **1.5 seconds**

```
A protective glass barrier forming in the air: a smooth hum rising in pitch with
soft crystalline overtones, finishing with a gentle solid thud as it locks into
place. Clean and warm, no screech, no piercing high frequencies.
```

## S07 · `sfx-heal` · **2 seconds**

```
A gentle healing sound: soft warm bells rising slowly in pitch, with a light
breath of air and a delicate shimmer settling around them. Calm, soothing and
rounded, with no sharp or piercing frequencies.
```

## S08 · `sfx-crit-hit` · **Auto (about 1 second)**

```
A heavy sword striking steel plate armour: a solid metallic clang with a deep
bass thump underneath it. Punchy, meaty and cinematic, recorded close. Clean and
full-bodied, not distorted and not thin.
```

## S09 · `sfx-enemy-death` · **Auto (about 1 second)**

```
A large creature collapsing onto stone ground: a muffled heavy body impact with
a soft organic crunch, followed by a short dusty exhale. Dull, low and organic,
not sharp and not wet.
```

## S10 · `sfx-player-death` · **3 seconds**

```
A dramatic defeat sound: a deep tone descending slowly in pitch, one low drum
hit, then a hollow dark drone fading gradually into silence. Cinematic, sombre
and smooth, with a long natural tail.
```

## S11 · `sfx-race-start` · **2 seconds**

```
A race starting: three short electronic countdown beeps, then a powerful engine
roaring to life and accelerating rapidly away into the distance. Energetic and
clean, recorded outdoors.
```

## S12 · `sfx-new-record` · **1.5 seconds**

```
A short triumphant fanfare: bright synthesizer notes rising quickly in pitch,
finishing on a sparkling chime. Celebratory, warm and polished, the high-score
sound of an arcade game. Bright but not harsh.
```

---

## Generate S08 first

A critical hit is the most-heard effect across all four games and the easiest to
judge instantly. If that one lands, the rest of the list will.

## If one still sounds wrong

In order of what actually helps:

1. **Raise prompt influence.** Harsh output usually means it is improvising.
2. **Change the object, not the adjectives.** If "sword on steel plate" comes
   out thin, try "hammer striking an anvil". Swapping the physical source
   changes the result far more than any amount of rewording.
3. **Add the room.** "Recorded close in a small room", "in a large stone hall".
   Space makes synthetic results sound real.
4. **Pick a different variation.** Four come back per generation and they vary
   a lot — audition all four before re-rolling and spending credits.

## What to skip entirely

**S02, S07 and S12 are pure synthesized tones** — an ascending chime, a warm
glow, an electronic fanfare. Those are better generated in code than sampled:
cleaner, tunable to each game's musical key, zero bytes, zero latency, and no
licensing question at all. `game-audio.ts` already drives the existing six games
that way.

If any of the twelve refuse to come out right, say which and they get
synthesized instead. That is not a fallback — for several of these it is the
better result.
