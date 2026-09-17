# Typing engine specification

What counts, what does not, and why. This is the contract the tests in
`src/lib/typing-engine/typing-engine.test.ts` enforce. Change a rule here only
together with the test that pins it.

## The unit of measurement

A "word" in WPM is not an English word. It is **five characters, including the
space that follows it**. This is the standard definition and the one every
typing test is expected to use, so a score is comparable across sites.

That definition is the whole reason the space matters. A typist producing
eighteen four-letter words in fifteen seconds produces 72 letters and 17
separators — 89 characters, not 72. Dropping the separators understates the
result by roughly 20%, and it does so invisibly, because accuracy barely moves.

## What counts as a typed character

| Key | Counts as typed | Counts as correct | Notes |
|---|---|---|---|
| A matching letter | yes | yes | |
| A wrong letter | yes | no | counted incorrect |
| A letter past the end of the word | yes | no | counted as `extra` |
| Space between two words | yes | yes | the separator; see below |
| Space after the final word | no | no | there is no separator after the last word |
| Space on an empty word | no | no | cursor does not advance either |
| Backspace | no | no | a keypress, not a character |
| Shift, Ctrl, Alt, Meta, arrows, Tab, Escape | no | no | never reach the buffer |
| Letters the clock cut off | no | no | not typed, so not counted |
| Letters skipped by an early space | no | no | counted as `missed` against accuracy |

### The separator rule, precisely

Committing a word credits exactly one correct character **unless it is the last
word in the test**, which has nothing after it to separate. A space pressed while
the current word is still empty is ignored entirely — it neither scores nor
advances the cursor, matching what people expect when they double-tap space.

### Backspace

Deleting a mistake does not un-make it. The incorrect keystroke stays in the
count, and the deletion is additionally recorded as a `correctedErrors`. This is
what stops a typist from farming a perfect score by deleting and retyping.
Deleting a *correct* character is not an error and is not recorded as one.

## The formulas

```
netWpm   = correctCharacters / 5 / minutes
rawWpm   = (correctCharacters + incorrectCharacters) / 5 / minutes
accuracy = correct / (correct + incorrect + missed) * 100
```

`netWpm` is the headline number. Nothing is added to the numerator that the
typist did not type, and nothing is subtracted from the denominator to flatter
the result. `extra` characters count against accuracy through the incorrect
tally; `missed` characters — the ones skipped by an early space — count against
accuracy but are not charged as incorrect keystrokes, because no key was pressed.

## Timing

The clock reads `performance.now()`, which is monotonic. `Date.now()` is
wall-clock and can jump backwards when the system clock is corrected or NTP
steps it mid-test, which would produce a negative elapsed time and a nonsense
score.

- The timer starts on the **first typed character**, never on mount or focus.
- A time-mode test records **exactly** its nominal duration. The tick that ends
  the test usually lands a few milliseconds late; recording that real overshoot
  would make a 15s test score as 15.04s and quietly depress every WPM. The
  recorded duration is clamped to the nominal one.
- The clock runs on `setInterval`, not `requestAnimationFrame`. rAF does not
  fire in a hidden tab, which would freeze the timer while the typist kept
  typing.

## What the engine deliberately does not do

- It does not count generated-but-untyped words. Ten words on screen and one
  word typed scores one word.
- It does not round the elapsed time up or down to make the arithmetic tidy.
- It does not subtract errors from the character count. Errors are excluded from
  `netWpm` by never entering it, and they are reported separately.
- It does not treat modifier keys as input.

## State the engine tracks

`correctKeystrokes` and `incorrectKeystrokes` feed the score. `totalTyped` is
their sum and exists so the results screen can show an audit trail that adds up.
`totalKeypresses` includes backspace and is **diagnostic only** — it never feeds
any score. `correctedErrors` counts deletions of wrong characters.

## Running the tests

```
npm test
```

31 cases against the reducer directly, not against a rendered component: through
the UI a dropped keystroke and a missed render look identical, and only one of
them is a scoring bug.
## Consistency

Consistency is 100 minus the coefficient of variation of **per-second** typing
speed, bucketed into one-second windows.

It deliberately does not use the cumulative WPM curve. A cumulative average
converges by construction — its spread shrinks as the test runs no matter how
erratic the typing was — so scoring its deviation measures test length rather
than evenness, and reports a high number for everybody. Only instantaneous speed
shows real bursts and pauses. Buckets are one second wide because the 100ms tick
holds under two characters at 80 WPM, where rounding alone would swing the
per-tick rate by tens of WPM.

## Focus and visibility

**Focus loss does not pause the clock.** Pausing on blur would hand anyone an
untimed thinking break, which is a scoring exploit. Instead, a run that loses
focus shows an overlay saying so, and any click or keystroke resumes — the
failure is made obvious rather than silently draining the score.

**A backgrounded tab is not special-cased.** Browsers throttle timers in hidden
tabs, but elapsed time is measured from timestamp deltas rather than by counting
ticks, so a late tick still finalises at the correct duration. The test may be
*detected* as finished late; the recorded score is unaffected.

Focus losses and visibility changes are counted for diagnostics only. Neither is
ever subtracted from the test duration.

## Personal bests

Compared on **unrounded** values. Rounding first makes 65.6 and 66.4 both "66",
so a genuine improvement of nearly a word per minute reads as a tie. Rounding
happens at display time only.

## Same-text benchmark

`/debug/typing-engine` (development builds only) runs the engine against a
pasted, fixed prompt at a fixed duration, and dumps every raw counter. Two tests
on different random words are not the same test and support no conclusion about
the engine; this is how to make a cross-site comparison mean something.

## Known difference from MonkeyType

MonkeyType's default mode draws from the ~200 most common English words. This
engine samples uniformly from a 489-word frequency-ordered list. Expected mean
word length is 4.45 characters (p05–p95: 4.13–4.80) against 3.58 for the top
hundred, so a typical draw here runs somewhat harder and the same typist scores
somewhat lower. That is a difference in the test, not in the scoring, and it has
been left as-is rather than tuned to match.

Note this did *not* explain the original 66-vs-86 comparison: both prompts in
that comparison measured 4.10 and 4.11 mean word length — equally easy draws,
both at the 4th percentile of this generator's distribution.
