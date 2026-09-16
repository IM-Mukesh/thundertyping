# SFX worklist — ElevenLabs Sound Effects

Ten remaining one-shots. **S08 and S09 are done.**

---

## Settings

- **Leave duration on Auto for every single one.** Do not set it manually.
- **Prompt influence: about 80%.**
- **Download: WAV / PCM** at the highest sample rate offered.
- **Turn off Explore sharing** (Disable link beside that notice).
- **Save into** `assets-raw/audio/sfx/`.

## Why Auto, when some of these need to be longer

The duration control was overriding itself and picking arbitrary lengths, and
S08 and S09 — the two left on Auto — are the two that came out well. That is not
a coincidence. The model has a natural sense of how long the sound it is
imagining should last, and forcing a number fights it: it pads with silence,
stretches a hit into a texture, or truncates a tail.

So the length is now described **in the prompt text** instead. Every prompt below
carries its own pacing — "over three slow seconds", "quick and immediate",
"with a long tail fading away". The model follows temporal language in the text
far more reliably than the slider.

Whatever length comes back is fine. Trimming, padding and tail-extension are all
trivial in post — I handle that. What cannot be fixed afterwards is the wrong
*content*, which is what the pacing words are protecting.

---

## S01 · `sfx-boss-spawn`

```
Cinematic trailer impact for something enormous arriving. One huge deep drum hit,
then an immense iron gate groaning open in a stone cathedral, its metallic tone
rising slowly and steadily in pitch over three long seconds, with a deep rumble
swelling underneath it the whole time. Slow, patient, vast. Clean cinematic
sound design, no distortion, no static, no harsh high frequencies.
```

## S02 · `sfx-level-up`

```
Three clear glockenspiel notes ascending quickly one after another, bright and
bell-like, with a soft magical shimmer fading gently away after the final note.
Quick and immediate, over in about a second. Clean, warm and musical, the reward
sound of a polished video game. Gentle, never piercing.
```

## S03 · `sfx-relic-acquire`

```
A Tibetan singing bowl struck once with a soft felt mallet, ringing out with a
warm sustained tone that hangs in the air and decays slowly and naturally over
two seconds, with delicate glass wind chimes sparkling quietly underneath.
Peaceful, rich and resonant, recorded close in a quiet room. Let the tail ring
out fully.
```

## S04 · `sfx-chest-open`

```
An old wooden treasure chest being opened in one smooth motion: hinges creaking
briefly, a heavy iron latch clicking free, then a soft sprinkle of small gold
coins settling inside. One continuous action, brisk and unhurried. Warm, woody,
tactile foley recorded close up.
```

## S05 · `sfx-card-play`

```
A single playing card thrown from a dealer's hand, whooshing softly through the
air and landing flat on a green felt table. Fast and over almost immediately, a
brief clean snap with no tail. Crisp, quiet, close-miked foley in a small room.
```

## S06 · `sfx-shield-up`

```
A protective glass barrier forming in the air: a smooth hum rising steadily in
pitch with soft crystalline overtones, finishing with a gentle solid thud as it
locks into place and stops. A short deliberate build, then a clean stop. Warm
and rounded, no screech, no piercing high frequencies.
```

## S07 · `sfx-heal`

```
A gentle healing sound: soft warm bells rising slowly in pitch, with a light
breath of air and a delicate shimmer settling around them and fading away
unhurriedly. Slow, calm and soothing, with a long soft tail and no sharp or
piercing frequencies.
```

## S10 · `sfx-player-death`

```
A dramatic defeat sound. A deep tone descending slowly in pitch, one low drum
hit, then a hollow dark drone left to fade gradually into complete silence over
several long seconds. Slow, heavy and sombre, with a very long natural tail.
Cinematic and smooth.
```

## S11 · `sfx-race-start`

```
A race starting: three short electronic countdown beeps in quick succession,
then a powerful engine roaring to life and accelerating rapidly away into the
distance until it fades out. Urgent at the start, then a receding tail.
Energetic and clean, recorded outdoors.
```

## S12 · `sfx-new-record`

```
A short triumphant fanfare: bright synthesizer notes rising quickly in pitch one
after another, finishing on a sparkling chime that rings briefly and stops. Fast
and punchy, over in about a second. Celebratory, warm and polished, the
high-score sound of an arcade game. Bright but never harsh.
```

---

## Order to work in

S01 next — it is the one that failed hardest at 1.0s, so it is the best test of
whether pacing-in-the-text works. If S01 comes back with a real slow rise, the
rest of the list will behave.

## If one still sounds wrong

1. **Audition all four variations** before re-rolling. They differ a lot and
   re-rolling costs 200 credits.
2. **Change the object, not the adjectives.** If "iron gate groaning" comes out
   thin, try "stone slab dragging across stone". Swapping the physical source
   moves the result far more than rewording.
3. **Add the room** — "in a large stone hall", "close in a small room". Space is
   what makes synthetic results sound recorded.

## Three worth skipping

**S02, S07 and S12** are pure synthesized tones — an ascending chime, a warm
glow, an electronic fanfare. In code they come out cleaner, tunable to each
game's musical key, at zero bytes and zero latency, with no licensing question.
`game-audio.ts` already drives the existing six games that way.

If those three fight you, do not spend credits on them. Say so and they get
synthesized — for these, that is the better result rather than a fallback.
