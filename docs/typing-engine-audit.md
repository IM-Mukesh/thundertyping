# Typing engine audit

Prompted by a 15-second comparison: MonkeyType 86 WPM / 108 characters,
ThunderTyping 66 WPM / 82 characters, same typist, minutes apart.

No formula was changed to move a score. Where a formula was changed
(consistency), it was because it measured the wrong quantity, and the change
can just as easily lower the number as raise it.

---

## A. Root causes found

### ROOT CAUSE 1 — Spaces were never counted as characters (high confidence)

**Evidence.** `hidden-input.tsx` intercepts the space key, calls
`preventDefault()`, and dispatches `COMMIT_WORD`. `COMMIT_WORD` in
`use-typing-engine.ts` tallied the finished word's letters and advanced the
cursor — it never touched `correctKeystrokes`. Every inter-word space vanished
from the numerator and the denominator alike.

**Why it matters.** WPM is defined on five-character units *including the
trailing space*. Dropping them loses ~1 character in 6 — about 17%.

**Why it stayed hidden.** Accuracy is `correct / (correct + incorrect +
missed)`. A space is almost always struck correctly, so removing it from
numerator *and* denominator barely moves the ratio. Accuracy reported a
truthful 100% while WPM read ~20% low. One bug, and only one of the two numbers
on screen reacted.

**Fix.** `COMMIT_WORD` credits one correct character per separator, skipped on
the final word, which has none. A space on an empty word neither scores nor
advances.

**Tests.** `typing-engine.test.ts` → "the space between words" (5 cases).

### ROOT CAUSE 2 — Consistency measured a running average (high confidence)

**Evidence.** Each `wpmSamples` entry was
`calculateNetWpm(cumulativeCorrect, cumulativeElapsed)` — a cumulative average,
not instantaneous speed.

**Why it matters.** A cumulative average converges by construction. Its spread
shrinks as the test runs regardless of how erratic the typing was, so the score
mostly measured test length. Measured directly:

| typing pattern | old formula | new formula |
|---|---|---|
| perfectly even, 7 chars/s | 100.0 | 100.0 |
| alternating 14 chars/s and dead stop | **78.1** | **0.0** |
| steady with a 4-second stall | **82.8** | **36.8** |

A typist alternating between full speed and complete stops scored 78%
"consistency". This is also why your screenshots show ThunderTyping 95% against
MonkeyType 85% for the same typist.

**Fix.** Samples now carry raw cumulative counts; consistency differences them
into one-second buckets and takes the coefficient of variation of *per-second*
speed. One-second buckets because the 100ms tick holds under two characters at
80 WPM, so per-tick rates would measure rounding noise.

**Tests.** `typing-engine.test.ts` → "consistency" (4 cases).

### LIKELY CONTRIBUTOR — You were comparing a dev build to a production build

**Evidence.** Per-keystroke processing time, same machine, same synthetic
200-keystroke burst:

| build | median | p95 | max | over 8ms |
|---|---|---|---|---|
| `next dev` | 8.6ms | 34.1ms | 47.0ms | 69/120 |
| `next start` | **1.1ms** | **3.2ms** | 13.2ms | 2/200 |

**Why it matters.** monkeytype.com is a production build. A 34ms p95 input
latency is perceptible while typing fast — it is above the 16ms frame budget —
and degrades both speed and accuracy. This matches your report that
ThunderTyping "feels like I make significantly more typing mistakes" while
showing 100% accuracy: the lag was real, the missing errors were the space bug.

**Fix.** None required in code — production is already fast. Benchmark against
`npm run build && npm start`, never `npm run dev`.

### NOT A PROBLEM — Text difficulty, for the runs you compared

I initially suspected this and was wrong. Measured on the two prompts in your
screenshots:

| | MonkeyType | ThunderTyping |
|---|---|---|
| words | 46 | 39 |
| mean word length | 4.11 | **4.10** |
| words over 5 letters | 11% | **5%** |

Statistically indistinguishable; if anything ThunderTyping's draw was easier.
Monte Carlo over 20,000 simulated prompts shows our generator's expected mean is
4.45 (p05–p95: 4.13–4.80), so *both* observed prompts sat at the 4th percentile.

The corpus-level difference is real but did not cause this gap: on a typical
draw our text runs ~0.35 letters/word longer than MonkeyType's default
top-200 list. Left unchanged — narrowing the corpus would raise the displayed
number, which is what you asked me not to do by reflex. One-line change if you
want like-for-like.

### NOT A PROBLEM — XP / levels

The typing test awards no XP. That system belongs to the games, so game
progression cannot perturb typing metrics.

---

## B. Files changed

| File | Change |
|---|---|
| `lib/typing-engine/use-typing-engine.ts` | separator counting; backspace correction tracking; monotonic clock; samples carry raw counts; `reducer`/`createInitialState` exported for tests |
| `lib/typing-engine/engine-types.ts` | `totalTyped`, `totalKeypresses`, `correctedErrors`; `WpmSample` carries raw counts |
| `lib/typing-engine/stats.ts` | consistency rewritten to per-second speed |
| `lib/persistence/results-store.ts` | personal bests compared unrounded |
| `components/typing-test/typing-test.tsx` | passes unrounded values to PB; focus-loss overlay; focus/visibility diagnostics |
| `components/typing-test/hidden-input.tsx` | `event.repeat` guard on command keys; reports focus changes |
| `components/typing-test/results-panel.tsx` | Total Typed, corrected errors, elapsed time |
| `components/typing-test/typing-engine-debug.tsx` | new — same-text benchmark harness |
| `app/debug/typing-engine/page.tsx` | new — dev-only route |
| `data/words/english-1k.ts` | removed duplicate `wait` |
| `lib/typing-engine/typing-engine.test.ts` | new — 31 tests |
| `scripts/test-setup.mjs` | new — `@/*` alias for the Node test runner |

## C–H. Logic, timer, input, scoring, error-tracking fixes

**Timer.** Starts on the first typed character, never on mount or focus. Uses
`performance.now()` (monotonic) — `Date.now()` steps under NTP correction and
can produce a negative elapsed time. A completed time test records *exactly* its
nominal duration: the 100ms tick that ends it lands a few ms late, and recording
that overshoot would score a 15s test as 15.04s, depressing every result
permanently and invisibly. `setInterval`, not `requestAnimationFrame` — rAF does
not fire in a hidden tab, which would freeze the clock while the typist kept
going. One interval, keyed on status, cleaned up on unmount.

**Input.** `onChange` on a real `<input>` is authoritative, so modifier keys are
excluded *by construction* — Shift/Ctrl/Alt/Meta/arrows never change
`e.target.value`. Space, Tab and Escape are commands and are now guarded against
OS key-repeat; printable keys deliberately are not, because a held letter
genuinely types that letter repeatedly. Paste is blocked.

**Backspace.** Deleting a mistake does not un-make it: the incorrect keystroke
stays counted and the deletion is recorded as `correctedErrors`. Deleting a
*correct* character is not an error. Retyping does not double-count.

**Scoring.** `netWpm`, `rawWpm` and `accuracy` are unchanged. Skipped characters
(`missed`) count against accuracy but are not charged as incorrect keystrokes,
because no key was pressed. Characters the clock cut off are not charged at all.

**Personal bests.** Were compared on rounded values, so a genuine 65.6 → 66.4
improvement read as a tie at 66. Now compared unrounded, rounded only for
display.

## I. Result page changes

Adds **Total Typed** (= correct + incorrect), **corrected errors** when any
occurred, and elapsed time, with a note that the space counts as a character.
The breakdown is the audit trail for the WPM above it — if the numbers do not
add up, the score is wrong.

## J. Performance

Production input latency is 1.1ms median / 3.2ms p95. At 150 WPM (12.5 keys/s,
an 80ms budget) that is 96% headroom. No optimisation was needed; the dev-build
figure above is a dev-build artifact, not a shipped problem.

## K. Tests

31 cases in `typing-engine.test.ts`, driven against the reducer directly —
through the UI a dropped keystroke and a missed render look identical, and only
one of them is a scoring bug. Node's built-in runner, no new dependency.

**Mutation-checked.** To confirm the tests bite rather than merely pass, the
root cause was reintroduced (`typedSeparator = false`) and the suite re-run:
2 failures, both in the separator group. Restored: 31/31.

## L. Before vs after

Same scripted run, twelve words typed perfectly through the real UI:

| | before | after |
|---|---|---|
| correct | 53 | **65** |
| totalTyped | — | 65 |
| WPM | 42 | **52** |
| accuracy | 100% | 100% |
| elapsed | 15.00s | 15.00s |

The 12 recovered characters are exactly the 12 separators.

## M. Same-text benchmark

`/debug/typing-engine` (dev only), loaded with the exact MonkeyType prompt from
your screenshot, 46 words. Typed the first 20 words:

```
predicted   86 letters + 20 separators = 106 correct
recorded    106 correct · 0 incorrect · 0 extra · 0 missed · 106 typed
invariant   totalTyped(106) == correct(106) + incorrect(0)   PASS
```

MonkeyType recorded 108 on this same text; the 2-character difference is where
the 15s cutoff landed mid-word. **On identical text the two engines agree.**

## N. Remaining risks and limitations

- **Focus loss does not pause the clock.** Deliberate: pausing on blur would
  hand anyone an untimed thinking break. The state is now made obvious and
  one-keystroke recoverable instead of failing silently.
- **Backgrounded tabs** throttle the tick. Elapsed time stays correct because
  it is measured from timestamp deltas, not by counting ticks, but the test may
  be *detected* as finished late. Score is unaffected.
- **Corpus difficulty** is untouched and will keep typical ThunderTyping runs
  slightly below MonkeyType's default. This is a product decision, not a bug.
- **`english-1k.ts` holds 489 words**, not 1000. The name is wrong, not the
  behaviour.
- The scripted benchmark types via synthetic events. It proves counting and
  arithmetic; it cannot prove how the UI feels under a real keyboard.

## O. Commands used to verify

```bash
npm test          # 31 passed
npm run lint      # clean
npx tsc --noEmit  # clean
npm run build     # passes
npm start         # production, for latency measurement
```
