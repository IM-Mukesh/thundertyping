# ThunderTyping — ElevenLabs audio prompt batch

14 music loops + 12 one-shot sound effects.

**Music** tab for tracks 01–14. **Sound Effects** tab for SFX 01–12.
Generate one at a time; name each download exactly as the `FILE:` line says.

Put downloads in `assets-raw/audio/`, then run the processing script.

---

## Before generating

- **Set output quality to the maximum your plan allows.** These get re-encoded
  to Opus for the site. Re-encoding a 128kbps MP3 into Opus is lossy-on-lossy
  and sounds crunchy. High-quality source in, clean Opus out.
- **Confirm commercial rights on your plan.** The site runs AdSense, which makes
  it commercial use.
- **Test the credit cost with one track first** before planning the full set.

## The looping rule — put this in every music prompt

Every music prompt below already ends with this line. Do not drop it:

> Seamless loop, constant tempo throughout, no intro, no outro, no fade in, no
> fade out, no vocals, no speech, instrumental only, consistent instrumentation
> from start to finish.

Generators still tend to add a soft landing at the end. The processing script
cuts a bar-aligned section from the middle and crossfades the seam, so **aim for
2–3 minutes** even though the loop used in game will be shorter.

## Why there is no separate "low HP" track

Tension is applied in code, not generated: a lowpass filter sweep on the combat
bed plus a synthesized heartbeat pulse underneath. That gets the intensity shift
your spec asks for without doubling the track count or the credit spend.

---

# MUSIC — 4 menu, 4 combat, 4 boss, 2 shared stings

## Shared platform

**01** — FILE: `music-hub-menu`
> Dark synth ambient with a slow analog arpeggio, warm low pads, sparse bell
> tones, restrained and confident, unhurried, 80 BPM, minor key, spacious
> reverb, a sense of a quiet arcade at night. Not epic, not sad — inviting and
> slightly mysterious. Seamless loop, constant tempo throughout, no intro, no
> outro, no fade in, no fade out, no vocals, no speech, instrumental only,
> consistent instrumentation from start to finish.

**02** — FILE: `music-sting-victory` *(generate ~6 seconds)*
> A short triumphant resolution sting: rising brass and synth swell landing on a
> bright major chord with a shimmer tail. Rewarding, clean, arcade-flavoured.
> Instrumental only, no vocals, no speech. Single hit, no loop needed.

**03** — FILE: `music-sting-defeat` *(generate ~6 seconds)*
> A short defeat sting: descending minor piano figure with a low detuned synth
> fall and a dry cutoff. Melancholy and final but not comedic, not a cartoon
> failure sound. Instrumental only, no vocals, no speech. Single hit, no loop
> needed.

## Spellbound — arcane, occult, scholarly

**04** — FILE: `music-spellbound-menu`
> Dark fantasy ambient: bowed cello drone, distant choir pad without words,
> muted harp plucks, occasional low bell, dust and candlelight atmosphere,
> 70 BPM, minor key, deep reverb, patient and ominous. Seamless loop, constant
> tempo throughout, no intro, no outro, no fade in, no fade out, no vocals, no
> speech, instrumental only, consistent instrumentation from start to finish.

**05** — FILE: `music-spellbound-combat`
> Driving dark fantasy orchestral with electronic pulse: staccato low strings on
> a repeating ostinato, taiko-style low percussion, tense high violin sustains,
> a subtle synth arpeggio beneath, 128 BPM, minor key, urgent and focused but
> not chaotic — the player must be able to concentrate over it. Seamless loop,
> constant tempo throughout, no intro, no outro, no fade in, no fade out, no
> vocals, no speech, instrumental only, consistent instrumentation from start to
> finish.

**06** — FILE: `music-spellbound-boss`
> Epic dark fantasy boss music: full low brass, pounding timpani and war drums,
> aggressive string ostinato, wordless choir swells, a distorted synth bass
> underneath, 140 BPM, minor key, enormous and threatening, high stakes.
> Seamless loop, constant tempo throughout, no intro, no outro, no fade in, no
> fade out, no vocals, no speech, instrumental only, consistent instrumentation
> from start to finish.

## Typing Survivor — desperate, hot, kinetic

**07** — FILE: `music-survivor-menu`
> Grim frontier ambient: lone low fiddle drone, distant war drum, wind and
> ember crackle texture, sparse muted guitar harmonics, 75 BPM, minor key,
> weary and bracing, the calm before a siege. Seamless loop, constant tempo
> throughout, no intro, no outro, no fade in, no fade out, no vocals, no speech,
> instrumental only, consistent instrumentation from start to finish.

**08** — FILE: `music-survivor-combat`
> Relentless percussive action: driving tribal war drums, aggressive distorted
> bass pulse, short brass stabs, fast shaker rhythm, 140 BPM, minor key,
> propulsive and unending, wave after wave, no let-up. Seamless loop, constant
> tempo throughout, no intro, no outro, no fade in, no fade out, no vocals, no
> speech, instrumental only, consistent instrumentation from start to finish.

**09** — FILE: `music-survivor-boss`
> Heavy hybrid orchestral boss music: enormous drum ensemble, snarling low
> brass, industrial metal hits, screaming high strings, distorted synth bass,
> 150 BPM, minor key, brutal and overwhelming. Seamless loop, constant tempo
> throughout, no intro, no outro, no fade in, no fade out, no vocals, no speech,
> instrumental only, consistent instrumentation from start to finish.

## Ghost Racer — cold, fast, electric

**10** — FILE: `music-racer-menu`
> Cool synthwave ambient: slow analog pad, gated reverb snare far back in the
> mix, clean chorus guitar single notes, neon night atmosphere, 90 BPM, minor
> key, confident and cold, waiting on the grid. Seamless loop, constant tempo
> throughout, no intro, no outro, no fade in, no fade out, no vocals, no speech,
> instrumental only, consistent instrumentation from start to finish.

**11** — FILE: `music-racer-combat`
> High-energy synthwave / darksynth race music: driving four-on-the-floor kick,
> aggressive arpeggiated analog bass, bright lead synth, gated snare, 150 BPM,
> minor key, pure forward momentum and speed. Seamless loop, constant tempo
> throughout, no intro, no outro, no fade in, no fade out, no vocals, no speech,
> instrumental only, consistent instrumentation from start to finish.

**12** — FILE: `music-racer-boss`
> Peak-intensity darksynth final lap: pounding kick, distorted acid bassline,
> soaring lead synth, rising tension riser textures, 160 BPM, minor key,
> exhilarating and dangerous. Seamless loop, constant tempo throughout, no
> intro, no outro, no fade in, no fade out, no vocals, no speech, instrumental
> only, consistent instrumentation from start to finish.

## Card Battle — ritual, opulent, tense

**13** — FILE: `music-cards-combat`
> Dark theatrical waltz: minor-key strings in three, tack piano, muted trumpet,
> pizzicato bass, faint music-box bell, 110 BPM, elegant and sinister, an
> opulent decaying opera house, tension under politeness. Seamless loop,
> constant tempo throughout, no intro, no outro, no fade in, no fade out, no
> vocals, no speech, instrumental only, consistent instrumentation from start to
> finish.

**14** — FILE: `music-cards-boss`
> Grand operatic boss theme: full dramatic strings, pipe organ, timpani rolls,
> wordless soprano-like synth pad, crashing cymbals, 130 BPM, minor key,
> theatrical and enormous, a performance and a duel at once. Seamless loop,
> constant tempo throughout, no intro, no outro, no fade in, no fade out, no
> vocals, no speech, instrumental only, consistent instrumentation from start to
> finish.

*(Card Battle reuses `music-hub-menu` for its menu — the moods match and it
saves a generation.)*

---

# SOUND EFFECTS — Sound Effects tab, short one-shots

Keep every one of these **under 2 seconds**. Typing, combo and UI click sounds
are NOT here — those stay synthesized in code, because at 100 WPM they fire ten
times a second and sample playback introduces latency and voice-stealing.

**S01** — FILE: `sfx-boss-spawn`
> A deep ominous impact with a long rising sub-bass swell and metallic
> resonance, announcing something enormous arriving. Dark, weighty, no music.

**S02** — FILE: `sfx-level-up`
> A bright ascending magical chime, three quick rising notes with a shimmering
> tail. Rewarding and clean, not cute.

**S03** — FILE: `sfx-relic-acquire`
> A warm resonant singing-bowl tone with a soft magical sparkle tail, something
> precious being obtained. Short and rich.

**S04** — FILE: `sfx-chest-open`
> A wooden creak and metal latch release followed by a soft glittering shimmer.
> Tactile, physical, satisfying.

**S05** — FILE: `sfx-card-play`
> A crisp card flick through air landing flat on felt, with a faint arcane
> whoosh underneath. Sharp and quick.

**S06** — FILE: `sfx-shield-up`
> A rising crystalline hum forming into a solid barrier, ending with a firm
> glassy set. Protective and reassuring.

**S07** — FILE: `sfx-heal`
> A soft warm upward glow, gentle bell and breath texture, restorative and
> calm. No sparkle, no chime cliché.

**S08** — FILE: `sfx-crit-hit`
> A sharp devastating impact: metallic crack with a heavy low punch and a short
> distorted tail. Brutal and precise.

**S09** — FILE: `sfx-enemy-death`
> A wet crunching collapse with a fading dissolve into dust. Short, not gory,
> not comedic.

**S10** — FILE: `sfx-player-death`
> A heavy descending impact with a slow reverse-reverb swell and a hollow low
> drone settling. Final and grim.

**S11** — FILE: `sfx-race-start`
> A sharp electronic countdown beep followed by a powerful launch whoosh and
> engine surge. Urgent, arcade racing energy.

**S12** — FILE: `sfx-new-record`
> A triumphant ascending electronic fanfare with a bright shimmer burst.
> Celebratory, short, punchy.

---

## After downloading

1. Put everything in `assets-raw/audio/` (gitignored).
2. Run the processing script — it trims each music track to a clean loop,
   crossfades the seam, and encodes to Opus.
3. Music lands in `public/audio/music/`, SFX in `public/audio/sfx/`.
4. Expect roughly 15MB total for all 14 loops at Opus 96kbps.
