# Games integrity audit

All ten games audited for the same question: **can you win without typing the
text?** Two could. Both are fixed; the other eight were already sound.

## Results

| Game | Win rule | Space key | Verdict |
|---|---|---|---|
| Falling Words | word clears on exact match | prevented | sound |
| Word Rain | same engine as Falling Words | prevented | sound |
| Word Blaster | enemy dies on exact match | prevented | sound |
| Boss Battle | exact match | prevented | sound |
| Combo Rush | exact match; space = skip | costs time, resets combo | sound |
| Spellbound | exact match casts | counts as a miss | sound |
| Typing Survivor | exact match strikes | counts as a miss | sound |
| Card Battle | exact match plays card | stripped, inert | sound |
| **Typing Grand Prix** | — none — | committed a full word | **EXPLOIT** |
| **Ghost Racer** | — none — | counted as distance | **EXPLOIT** |

## Ghost Racer

Race position was `typed.length`: the raw count of keys pressed, with no
comparison against the text. `correctChars` was computed two lines above but
only fed WPM and accuracy, never position.

**Proven by attack.** 400 spaces and nothing else:

> **You win** · **New personal best** · 39 WPM · **19% accuracy** · Bronze rank

The run also saved itself as the personal-best ghost, so every later race on
that text would be run against a mash.

**Fixed.** Position is now the length of the longest correctly-typed prefix
(`racePositionOf`). A wrong character stalls the car until it is corrected, and
the finish line is reached only by reproducing the text. Three further
consequences handled:

- The ghost recorder marked raw length; it now marks the honest position, so a
  recording can no longer replay a mash as a fast, accurate opponent.
- Input is held after one wrong character rather than letting the buffer run on
  while the car stands still — otherwise the word on screen drifts away from
  where the car is.
- The displayed word is anchored to the car's position instead of to spaces in
  the buffer, for the same reason.

**After the fix,** the same 400-space attack gives: *Ghost wins · 0 WPM · no
record*. The race ends because the ghost finished, which is the correct failure.

**Stored ghosts from before the fix are abandoned** (store key `v1` → `v2`).
They hold inflated positions and would otherwise put an unbeatable phantom on
the track. Old entries are left in localStorage, simply never read again.

## Typing Grand Prix

Three separate places advanced the car without checking what was typed:

1. `COMMIT_WORD` banked `target.length` — the *target's* length — for whatever
   the player had in the buffer. One letter plus space banked a whole word.
2. `playerProgressFor` used `min(typedLength, target.length)`, so mid-word
   progress counted keystrokes rather than correct characters.
3. `finishRace` hardcoded `playerProgress: 1` and computed finishing position
   from opponents who had *already finished*. Spacing through all forty words
   therefore pinned the car to the line and awarded **first place** — this one
   survived fixing (1) and (2) and was only caught by a test.

The code comment defended (1) as "distance on the track is distance, and
skipping is already paid for in accuracy". Accuracy does not stop you winning
the race, which is the outcome that matters.

**Fixed.** Distance is now the count of positionally-correct characters, which
makes it consistent with the WPM numerator: the car has gone exactly as far as
the score says. Finishing position is read off real distance travelled, so a
player who typed nothing places last.

**After the fix,** 45 rounds of `z` + space: the word cursor advances (space is
still a legitimate skip) but the car sits at **0%** while the three opponents
run to 0.85%, 1.27% and 1.80%.

## Tests

`src/lib/games/games-integrity.test.ts` — 18 cases, run by `npm test`:

- spaces alone advance nothing; any wrong character advances nothing
- progress equals the correct prefix, and stops at the first error
- a fully correct run still reaches the finish line and places first
- a wrong word banks zero; a partly-correct word banks only what matched
- spamming letter + space never completes the race and places last
- the displayed word stays anchored to the car

## Note on local data

The attack runs during this audit awarded XP and Ghost Racer achievements on
this machine, and left one bogus ghost behind. The ghost is already ignored by
the version bump; the XP and achievements are still there if you want them
reset.
