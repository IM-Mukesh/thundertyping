# HeroTyping: deep game review and upgrade roadmap

**Date:** 4 October 2026

**Revision reviewed:** `948c054` (`main`); working tree was clean before this review.

**Scope:** all 11 catalog entries, game engines, UI components, content, shared controls, scores, rewards, assets and relevant tests. Review only; no implementation changes, migrations, commits or pushes.

## Executive verdict

**This is not eleven empty 3/10 games. It is a roughly 5/10 arcade collection with several promising foundations and some release-blocking correctness problems.** There is already considerable artwork, audio, input handling and game logic. Replacing everything or adding more effects would waste that investment.

The current ceiling comes from four things:

1. **Trust:** saves, score units, achievements and some game rules disagree across layers.
2. **Agency:** many runs ask players to type faster, but rarely make meaningfully different decisions.
3. **Mastery:** personal bests exist, but there is little structured, game-specific journey from beginner to expert.
4. **Delivery:** a polished cover and glowing HUD do not substitute for reliable controls, readable threats, a convincing game world and informative results.

**Recommendation:** repair the collection-wide foundations, then use Fruit Fury as the short-session flagship and Boss Battle as the first deeper, highly polished vertical slice. Restore Ghost Racer's central promise early. Build out Word Blaster next. Expand Survivor and Card Battle only after repairing their simulations. Keep Spellbound unreleased until its rules are complete.

### Evidence and limitations

- **Verified:** source behavior and the 14 isolated probes recorded in the verification appendix. `npm test` passed **357/357** during this review.
- **Source-confirmed:** a reachable mismatch visible by following callers and implementation, without a complete browser reproduction.
- **Risk / needs playtest:** plausible usability, device or performance problems requiring measurement.
- **Proposal:** an upgrade idea, not a claim about current behavior.
- Browser inspection was blocked because the built-in browser was paused under user control. No authenticated browser, deployed database, device, FPS or screen-reader test was completed. The local dev server was started, but that does not establish rendered gameplay quality.
- Ratings are **provisional professional judgments**, not user research or measured fun. Presentation is assessed from component structure and available assets, not a completed visual playthrough. No assertion that every possible bug has been found.

## Rating framework

A high score requires a complete player experience: understandable rules, enjoyable typing, meaningful decisions, readable feedback, fair difficulty, replay value, accessibility and dependable persistence.

- **3/10:** basic interaction works; shallow or unreliable experience.
- **5/10:** recognizable game with a coherent loop, but obvious gaps undermine repeat play.
- **7/10:** polished, dependable, differentiated game people choose to replay.
- **9/10:** exceptional execution, tested balance, strong accessibility and sustained player value.
- **10/10 ambition:** the above without meaningful weaknesses for the intended audience. Not a score that adding a feature list can guarantee.

| Game | Current rating | Strongest foundation | Biggest obstacle |
|---|---:|---|---|
| Fruit Fury | **6/10** | Immediate arcade identity, physics and feedback | Save contract; touch/typing fairness; shallow long-term mastery |
| Falling Words | **5.5/10** | Clear prioritization loop and power-ups | Hazard rules contradict behavior; limited run variety |
| Word Rain | **4/10** | Readable one-life survival concept | Missing pause integration; weather mostly a pacing wrapper |
| Word Blaster | **5.5/10** | Enemy archetypes, lane decisions, boss encounters | Collision/targeting fairness and limited strategic evolution |
| Typing Grand Prix | **5/10** | Visible rivals, readable progress, sprint format | Incomplete-distance placements and ambiguous racing/scoring rules |
| Boss Battle | **6/10** | Strongest coherent dramatic encounter | One boss, one repeating action, no mastery ladder |
| Combo Rush | **5/10** | Strong time-versus-accuracy tension | Tier promises exceed implemented mechanics; eventual plateau |
| Typing Survivor | **4.5/10** | Character/build draft foundation | Simulation, rewards and persistence defects |
| Ghost Racer | **4/10** | Excellent personal-improvement premise | Ghost/text identity and replacement are not reliable |
| Card Battle | **4/10** | Real card vocabulary, archetypes and enemy intents | Several fundamental combat rules are incomplete |
| Spellbound | **4/10 prototype** | Potentially strongest strategic typing concept | Not playable through the public route; incomplete mechanics |

There are **10 playable entries**, not 11 released games. Spellbound has `upcoming: true`; its route renders an upcoming-release panel rather than the game (`src/lib/games/game-types.ts`; `src/app/games/[gameId]/page.tsx:219-251`).

## 1. Collection-wide issues to fix before expansion

### P1 — Results are not trustworthy end to end

**A. Three clients submit zero duration.** Card Battle, Survivor and the unreleased Spellbound submit `survivedMs: 0`:

- `src/components/games/card-battle-game.tsx:98-103`
- `src/components/games/typing-survivor-game.tsx:207-212`
- `src/components/games/spellbound-game.tsx:205-210`

The API permits many such payloads, but `supabase/migrations/20261003020000_progress_integrity.sql:5-7` requires new `game_scores` rows to have `survived_ms >= 1000`. Therefore these writes fail **where that constraint is installed**. The earlier migration history says it was applied; this review did not re-inspect the live database. `NOT VALID` exempts existing rows from initial validation, not future inserts.

**B. Fruit Fury sends fractional duration.** Its frame clock adds fractional `deltaMs` (`use-fruit-fury.ts:961-975`); the component passes it unchanged (`fruit-fury-game.tsx:135-140`); `validation.ts:331` requires an integer. A representative fractional-duration payload was rejected in a probe. Measure real active time and normalize at a well-defined boundary; do not fabricate a one-second duration merely to satisfy a constraint.

**C. The UI can announce success before storage succeeds.** `src/lib/games/game-scores.ts:181-209` optimistically updates cloud bests, returns immediately and does not handle a JSON error response as an error state. There is no durable retry queue or visible pending/failed/saved lifecycle here. It also returns the submitted run as `best` for signed-in users even when it was not their best, unlike the guest branch.

**D. Score units are wrong for two games.** Survivor stores points and Ghost Racer stores WPM, but both declare `scoreBy: "time"`. `game-best-badge.tsx:30` appends `s`. A speed of 80 can appear as `80s`; Survivor points can look like survival seconds. Replace the points/time switch with explicit metric, unit, comparison direction and mode/rules version.

**E. Result schema cannot express the games.** `recordGameResult` sends score, cleared, combo and duration, but not WPM, accuracy, outcome, character, difficulty, input method, seed or rule version. Ghost Racer abuses `cleared` for wins and `bestCombo` for accuracy. Server Ghost Racer achievements read `run.wpm`/`run.accuracy`, which this caller does not submit (`server/progress.ts:151-159`). Many declared achievements have no corresponding evaluator branch. Build typed per-game result contracts, then derive rewards from those contracts.

**F. Score caps are not engine bounds.** The validator caps Combo Rush at 150 clears, for example, while the engine does not end at 150. Longer legitimate runs can eventually exceed fixed caps. Test the strongest legal run for each ruleset rather than treating arbitrary maximums as anti-cheat.

### P1 — Competitive integrity is not established

`validation.ts:348-354` permits omitted run IDs. IDs generated by the client are not proof that a run occurred. `server/game-scores.ts:39-108` deduplicates a supplied ID, but scores remain client-reported. Insertion, daily stats, XP and achievements are separate operations; a retry after partial settlement may see the inserted row and never repair its missing reward.

For personal casual play, label records appropriately and prioritize dependable saves. Before public competitive rankings: introduce server-issued runs, rules/seed versions, authenticated ownership, idempotent transactional settlement, bounded event verification and abuse monitoring. Even event replay does not prove a human typed; automation remains possible. Do not sell this as cheat-proof or attach valuable prizes without stronger controls.

### P2 — Controls, timing and recovery vary by game

- Falling Words, Blaster, Grand Prix, Boss Battle and Combo Rush pause on tab hide. Word Rain does not wire its pause action to the component or visibility; Survivor/Spellbound have manual pause but no equivalent visibility handling; Ghost Racer uses elapsed wall time without a pause path.
- A focus warning saying “resume” is not an actual pause. Decide explicitly: pause casual play on lost focus, or clearly communicate ranked-run timing rules.
- Most arcade engines add exactly 50ms per interval callback. Event-loop delays can make reported game time differ from real active time. Rendering and simulation should be separated, with a documented monotonic clock and bounded fixed-step catch-up or explicit stall policy. Do not blindly replace every loop with rAF.
- Word-spatial modes mostly auto-complete; Grand Prix commits on Space; Ghost Racer requires spaces; Combo Rush spends time to skip. Teach the correct control at the point of use.
- Fruit Fury intercepts Tab to pause. Global restart handlers and click-to-focus wrappers need keyboard-navigation tests so buttons and assistive controls remain usable.

### P2 — Learning, accessibility and measurement need a shared standard

Keep the good work: dynamic per-game imports, optimized WebP artwork, sound toggles, progress labels, some reduced-motion handling, viewport tracking and ads below the active game.

Add interactive onboarding, readable text-size controls, high-contrast threat shapes, independent music/SFX settings, reduced flashes, remappable pause/cancel controls, save-state messaging and accessible result summaries. The viewport helper floors keyboard-open boards at 260px (`use-game-viewport.ts:95-101`), which can exceed a short landscape viewport before HUD/input space is included. Verify on devices; “responsive classes exist” is not proof of mobile usability.

Long RPG/strategy runs need versioned checkpoint/resume. Game-specific teaching needs measured error patterns, reaction time and useful next-practice suggestions, not just another XP total. Collect aggregate learning data with consent and retention limits; avoid uploading arbitrary typed text by default.

---

## 2. Fruit Fury — 6/10

### Current state and strengths

The most immediately marketable game: flying fruit, visible slices and juice, fatal bombs, three lives, combos, an eight-second Fever window, freeze/golden specials and escalating volleys. There are three difficulties and five keyboard practice pools. Canvas rendering, procedural audio and touch slicing provide more personality than a generic word panel. Preserve this identity.

It mainly trains **single-key recognition and inhibition**, not continuous prose typing. That is useful, but its WPM should not be sold as equivalent to a typing-test WPM.

### Problems and risks

1. **P1, verified contract defect:** fractional duration can prevent cloud saves; see section 1.
2. **P1, source-confirmed fairness problem:** pointer handlers invoke slicing even in “type” mode (`fruit-fury-game.tsx:370-391`). Touch and keyboard slices share the same counters and result record. Difficulty, keyboard pool and input method are not recorded, so these are not comparable personal bests.
3. **P2, source-confirmed multi-slice risk:** a swipe can call `sliceFruit` repeatedly in one handler (`use-fruit-fury.ts:1322-1328`). Each call derives new cleared/combo/level values from the same effect-synchronized `stateRef`, then writes those derived values (`:613-648`). Several fruits can score while progression increments undercount. Needs a batched touch integration test.
4. **P2, source-confirmed key ambiguity:** Hard allows up to eight flying objects, but Bottom Row has only seven keys. `pickLetter` reuses a key when exhausted (`:170-176`, `:214-218`). A bomb and fruit can share a key; the input handler chooses the lowest matching object, not necessarily the player's intended safe target.
5. **P2, source-confirmed achievement issue:** Fever achievement is checked from `isFeverActive` only at game over (`fruit-fury-game.tsx:163`). Triggering Fever and surviving until it ends is not recorded as “Fever used.” The golden achievement is registered but not granted by this component.
6. **Needs measurement:** frame-by-frame React state updates, uncapped device pixel ratio, particle volume and differing physics/timer delta caps need low-end-device testing. Reduced motion disables shake but does not by itself make all flashes/particles accessible.

### Upgrade path

**To 7/10 — reliable arcade:** fix saves and multi-slice accounting; make keys unique across bombs and fruit; separate Keyboard Training and Touch Arcade records; separate Easy/Medium/Hard and key pools. Add a 20-second safe tutorial, bomb practice, legible apex labels and a low-effects mode.

**To 8–9/10 — mastery:** introduce short missions such as “30 clean home-row slices,” “alternate hands,” and “choose safe targets during mixed volleys.” Add a reaction-time/key-error breakdown and a one-click weak-key drill. Use distinct volley patterns, not only faster spawns. Cosmetic blades, arenas and mastery medals should reward control rather than confer score advantages.

**10/10 ambition:** authored challenge packs, fair deterministic daily seeds, satisfying audiovisual timing and consistently readable play on real devices. Add optional two-key/short-word fruit only as separate modes; do not destroy the original instant-reflex loop.

**Done when:** keyboard mode cannot be scored with touch; every slice in a multi-fruit swipe is counted once; no active key collision is possible; completed runs survive refresh; input-mode metrics are honestly labeled; measured input feedback stays responsive under peak effects.

## 3. Falling Words — 5.5/10

### Current state and strengths

A sound arcade base: three lives, spatial prioritization, prefix targeting, normal/elite/golden/freeze/hazard words, combo scoring, Fever/Overdrive and increasing pressure. Active-word and effect caps are useful engineering safeguards. The engine avoids duplicate active words and occupied lanes; tab-hide pause is already implemented.

### Problems and risks

1. **P1, verified rule contradiction:** the catalog says avoid Hazard words, but completing one earns a multiplier plus 25 points; letting it land costs a life like any other word. A probe earned 145 points for `hazard` and lost a life when ignoring it. Sources: `game-types.ts` rules; `use-falling-words.ts:328-360,390-395`.
2. **P2, source-confirmed shallow phases:** phase names change at clear thresholds (`:161-167`), while spawn/fall rates remain continuous formulas (`:223-232`). The phase labels do not introduce the distinct encounters the marketing implies. Catalog phase names also differ from implementation.
3. **P2, targeting:** prefix locking is defensible, but overlapping prefixes can make the nearest target win instead of the intended word. Deduplicating complete words does not eliminate that ambiguity. Explain lock/cancel behavior and test `car` versus `cargo` cases.
4. **Needs device test:** separate lanes prevent identical positions, not wide word chips overlapping adjacent lanes. Existing enemies also keep old lane indexes when responsive lane counts shrink.
5. **Design gap:** beyond the opening power-up discoveries, the main growth is speed and numerical score. There is little authored variety, difficulty choice or explanation of which typing habit caused a loss.

### Upgrade path

**To 7/10:** choose a consistent hazard rule. The least disruptive option is rename it “danger word”: fast, mandatory, valuable. If it truly must be avoided, make missing it safe and typing it harmful. Show a playable example before introducing it. Add explicit pause/cancel, calmer beginner pacing and honest phase descriptions.

**To 8–9/10:** give phases distinct patterns: alternating lanes, a slow armored long word surrounded by short rescue words, timed freeze opportunities and golden-risk choices. Add optional targeted vocabulary/key pools and brief challenge goals. Keep every target readable and every loss explainable.

**10/10 ambition:** a highly tuned “read the board” game, with seeded score challenges, a rescue replay showing the last few target choices, and mastery badges for accuracy, triage and recovery—not just survival length.

**Done when:** a new player can correctly explain hazards; duplicate/prefix/cross-lane cases are tested; resizing cannot hide a target; phases change actual decisions; slow, medium and fast typists all have a suitable mode.

## 4. Word Rain — 4/10

### Current state and strengths

An independent one-life survival engine. Five timed phases accelerate spawn/fall rates; the nearest-floor word drives a threat gauge; clearing near the floor counts a clutch save. The one-life rule creates a distinct emotional tone even though it shares a falling-word vocabulary with Falling Words.

### Problems and risks

1. **P1, source-confirmed pause integration gap:** the hook exposes pause, but the component only takes start/resume/input; neither adds visibility pause or a reachable playing-state pause control (`use-word-rain.ts:296-355`; `word-rain-game.tsx:49,358-365`). A rendered pause overlay does not mean the user can enter that state.
2. **P2, verified duplicate targets:** the spawner shifts words without checking current text values (`use-word-rain.ts:333-349`); the reducer accepts identical words in separate lanes. This increases targeting ambiguity.
3. **P2, source-confirmed weather overclaim:** pressure measures the leading word's position, not impending storm surges (`:208-209`). `rainDensity` is content metadata, not a functioning dynamic rain system in the inspected renderer. Audio reactions play thunder/clear cues, not the promised escalating continuous rain ambience.
4. **P2, presentation risk:** word position changes through `top`, but the chip class transitions `transform` (`word-rain-game.tsx:283-292`), so 20Hz movement is not smoothed by that transition. Confirm perceived stutter in-browser.
5. **Design gap:** phase five is a fixed maximum, with no further pattern development. One mistake ending a run can repel beginners before they understand it. Whole-second bests also hide small improvements.

### Upgrade path

**To 7/10:** wire pause/visibility properly, prevent duplicate words, fix interpolation, preserve millisecond records and describe the gauge as “nearest threat.” Add an optional forgiving Practice Storm; retain one-life rules for Hardcore.

**To 8–9/10:** introduce learnable storm fronts and recovery lulls, genuinely telegraphed gusts and an independent ambience slider. Add 60/120/180-second mastery milestones and same-seed rematches. Make threat understandable without color or sound.

**10/10 ambition:** a minimalist endurance game with superb cadence and atmosphere. Do not turn it into another power-up shooter. If testing shows players cannot distinguish its appeal from Falling Words, consolidate it as a Hardcore/Storm mode rather than maintaining a redundant standalone game.

**Done when:** no unseen tab damage in casual play; no duplicate active words; weather visuals reflect actual rules; first-run onboarding teaches the one-life condition; restart takes one deliberate action.

## 5. Word Blaster — 5.5/10

### Current state and strengths

Five-lane defense, three lives, standard enemies, fast swarmers, two-word tanks and lane-clearing EMP drones. Every twelve scheduled kills introduces a four-word boss encounter. Tracers, kill effects, tank transitions and boss-specific audio give this more mechanical identity than another falling-word reskin.

The useful typing skill is **target triage under pressure**. The most promising advanced direction is deliberate lane defense, not adding an unrelated aiming or movement game.

### Problems and risks

1. **P2, source-confirmed lane fairness risk:** spawn clearance only examines the entry edge (`use-word-blaster.ts:604-616`). Swarmers move faster than tanks (`:326-333`), while movement independently advances every enemy (`:395-401`). There is no queue-spacing constraint; a fast rear enemy can catch a slow front enemy. Resulting label overlap needs visual verification.
2. **P2, source-confirmed target ambiguity:** tank core words are sampled without checking other live words (`:517-521`, `:227-229`). This bypasses the ordinary spawner's duplicate protection.
3. **P2, rule mismatch:** catalog copy promises up to 2.5x combo, but `comboMultiplier` caps at 2x (`:163-165,211-216`).
4. **Design limitation:** bosses clear the existing board and substitute another word sequence (`:378-391`). That is a useful breather, but does not yet create diverse boss behavior or a meaningful defense build.
5. **Design limitation:** enemy distinctions are promising, but the run largely escalates density/speed. No campaign objectives, defensive loadout or authored attack patterns make later runs substantially different.

### Upgrade path

**To 7/10:** fix lane readability and replacement-word uniqueness; align combo descriptions; show shield-break state clearly; teach EMP timing and target cancellation. Add a pre-boss warning so the board transition feels intentional.

**To 8–9/10:** create a short sector campaign with distinct wave compositions and an inter-wave choice: better shield handling, EMP reach, emergency base repair or accuracy-based overcharge. Give choices opportunity costs. Introduce bosses with readable weak-point windows, support drones and lane attacks, without stealing typing focus.

**10/10 ambition:** a compact tactical defense game with several viable strategies, deterministic challenge seeds and a combat recap: breaches by lane, wasted targeting time, shield efficiency and high-value EMP opportunities.

**Done when:** mixed-speed enemies cannot create unreadable targets; all core-word replacements remain unique; every archetype teaches a distinct response; both fast inaccurate and slower accurate styles have understandable tradeoffs; endless scores persist beyond normal play lengths.

## 6. Typing Grand Prix — 5/10

### Current state and strengths

A forty-word sprint against three approximately 35/50/70 WPM AI rivals, with pace jitter, countdown, perspective car sprites, overtakes, combo points and a scoring boost. Correct characters drive distance; Space commits a word. The fixed reading area and visible opponents make improvement more tangible than a bare WPM number.

### Problems and risks

1. **P1, verified incomplete-distance win:** exhausting the word list ends the race and places the player against rivals' current distance, even when the player did not complete the course (`use-typing-grand-prix.ts:339-372,482-494`). A two-word fixture with only the first letter of each committed awarded first place at **20% distance** when rivals were at 5%. This does not prove every short-input strategy wins every random race; it proves the finish invariant is missing.
2. **P2, verified speed-numerator inflation:** repeatedly type a correct prefix and erase it: `correctKeystrokes` increases without banked distance. It is then used for “net” WPM and finish bonuses (`:352-362,419-435`). Repeating `hell` ten times produced 40 credited correct keystrokes and zero banked characters. Separate physical correct keypresses from unique scored output.
3. **P2, design confusion:** Boost changes points, not car distance, intentionally (`:171-175`). Nitro-style presentation can imply acceleration. Rename it Score Boost, or implement a clearly separate arcade-racing mode whose movement rules are honest and tested.
4. **P2, finish semantics:** early word commits can permanently leave the car short of the line; results still look like ordinary race placement. Choose strict correction, penalty distance, or explicit DNF—not an ambiguous hybrid.
5. **Design limitation:** one race length and one rival band underserve beginners and experts. Random texts also vary in length/difficulty; same word count is not the same course.

### Upgrade path

**To 7/10:** define and test valid finish/DNF/tie rules. Score only legitimate output, disclose AI rivals and use “Score Boost” language. Offer a novice pace band and a faster expert band.

**To 8–9/10:** add short championships, track themes tied to text difficulty, per-sector split times and rivals with distinct but fair pacing profiles. Let practice adapt to the user's ability; keep ranked challenge parameters fixed. Add free practice versus competitive correction rules rather than mixing them.

**10/10 ambition:** satisfying races where placement is trustworthy, close finishes are legible and coaching explains the decisive mistakes. Asynchronous friend races are lower-risk than immediately building real-time multiplayer. Real-time racing later requires matchmaking, authoritative timing, reconnects and abuse handling.

**Done when:** no incomplete distance receives a normal finish; backspacing cannot inflate scored output; AI and player distance use the same metric; identical challenge rules reproduce the same course; results distinguish speed, accuracy, placement and points.

## 7. Boss Battle — 6/10

### Current state and strengths

The strongest self-contained dramatic loop: one boss, three health phases, shorter attack windows, progressively longer words, two-word blocks, phase staggers and an explicit victory/defeat outcome. Damage grows with word length and combo; bonuses reward speed, accuracy and remaining lives. Distinct boss art, charge telegraphs, shield pips and hit feedback already support the mechanic.

Sources: `use-boss-battle.ts:102-105,196-198,301-344,375-424`; `boss-battle-game.tsx:380-529`.

### Problems and risks

1. **Design limitation, not a broken engine:** there is one word available at a time. The fantasy suggests tactical combat, but the main decision is still “type the assigned word as fast and accurately as possible.” The player cannot meaningfully choose attack versus defense.
2. **Design limitation:** all three phases retain the same two-word block rule. Shorter windows and longer words increase pressure, not encounter variety.
3. **P2, shared scoring concern:** correct keystrokes include retyped prefixes and drive speed bonuses (`use-boss-battle.ts:254-258,351-377`). Audit the scoring numerator, just as for Grand Prix.
4. **P2, timing/control gap:** tab-hide pauses, but there is no matching obvious manual pause in the inspected HUD. A common pause control and resume countdown would be more discoverable.
5. **Needs playtest:** random word-length distributions affect damage and time-to-victory. Fixed tuning cannot be assumed equally fair for different skill levels. Large artwork, health, charge and typing panels need small-screen hierarchy checks.

### Upgrade path

**To 7/10:** a playable tutorial attack; explicit “two words block” feedback; difficulty bands; accurate output-based scoring; phase-specific defeat analysis. Add a practice button that restarts the phase the player struggled with, separately from scored runs.

**To 8–9/10:** implement three genuinely different bosses before adding many skins. Examples: a guardian with a timed shield-break word; a trickster with a clearly telegraphed target swap; a dragon with a long-word punish window after an attack. Introduce a small attack/guard choice only if it remains readable at typing speed.

**10/10 ambition:** a short campaign and boss-rush ladder where each encounter teaches a transferable typing skill. Reward no-hit wins, clean blocks and successful recovery. Use animation anticipation, impact and recovery—not constant shaking—as the core visual upgrade.

**Done when:** players can explain why an attack landed; each boss requires a different response; a novice can learn safely; experts have a mastery challenge; scoring is reproducible; learning a phase improves later success without grinding power.

## 8. Combo Rush — 5/10

### Current state and strengths

A good compact arcade premise: start with 15 seconds, bank at most 20, clear words to earn time, build a combo and face increasingly fast drain. Four-word lookahead supports rhythm; a 750ms skip cost prevents free word shopping. Wrong letters reset combo but do not directly deduct time. This is a useful **accuracy under time pressure** game.

Sources: `use-combo-rush.ts:40-96,267-320`.

### Problems and risks

1. **P2, verified tier/scoring mismatch:** `getRushTier(25)` describes Hyper as 2.5x, but actual scoring/time use `comboMultiplier`, capped at 1.6x after twelve words (`:150-173`). The HUD correctly shows the actual multiplier (`combo-rush-game.tsx:185-235`); the problem is that the tier metadata/marketing promises stronger mechanics than the badge actually provides.
2. **P2, rule mismatch:** catalog prose says mistakes penalize the clock. Actual incorrect-letter handling explicitly avoids a direct time penalty (`use-combo-rush.ts:267-277`). Choose the desired rule and state it accurately.
3. **P2, save ceiling:** the engine permits continuing past 150 clears, but the API rejects them. Better players should not be the first to encounter result loss.
4. **Design limitation:** drain and multiplier eventually cap. The late game can become maintenance rather than new decisions for sufficiently skilled players. The explanatory balance comments are hypotheses, not measured cohorts.
5. **Accessibility/design risk:** returning straight to the base tier after one typo may feel disproportionate to beginners. Conversely, reducing the penalty indiscriminately would remove the game's identity.

### Upgrade path

**To 7/10:** make tier thresholds, time refunds, points and UI derive from one rules table. Preserve strict classic mode and add a clearly labeled practice mode with gentler loss. Display actual time earned and why a skip cost time.

**To 8–9/10:** add fixed-duration score attack for bounded comparisons, tier-specific challenge rounds and optional risk/reward word choices. Give expert players controlled “cash out combo for time” decisions rather than more arbitrary speed. Add a post-run combo-break timeline and targeted practice.

**10/10 ambition:** a precise flow-state score game with recognizable rhythm, instantly understandable feedback and a real mastery ceiling. Daily equal-seed sprints and personal percentile trends can create replay value without padding it with unrelated RPG systems.

**Done when:** tier effects match rules exactly; both a typo and skip have documented consequences; long legal runs save; consistent-input simulations validate pacing across ability bands; score comparisons separate practice from strict mode.

## 9. Typing Survivor — 4.5/10

### Current state and strengths

Four characters, six minion types, elites, bosses, XP levels and upgrade drafts already exist. Short-word, long-word, combo, critical-hit and defensive upgrades could support genuinely different builds. Enemies approach from radial positions; most damage is caused by contact. Every fifth wave is a boss; the campaign ends after wave fifteen.

### Problems and risks

1. **P1, persistence/units:** zero duration and points labeled as survival time; see section 1. `cleared` is the current wave, not kills or necessarily waves completed. Outcome/wave/kills need distinct fields.
2. **P1, verified retained corpses:** dead enemies return before their `hitFlash` decays (`use-survivor.ts:216-220`), but cleanup retains corpses while `hitFlash > 0` (`:259-260`). A 600ms tick probe left the same dead record at 220ms. The active-enemy cap does not cap retained dead entries, so arrays can grow through a run.
3. **P1/P2, source-confirmed reward defect:** detonation and chain damage can kill secondary enemies (`:319-350`), but kills, XP, score and callbacks are awarded only for the main target. Area-effect builds can lose progression credit for doing what their build promises.
4. **P2, source-confirmed accuracy mechanic defect:** Perfectionist checks `target.typed === word.length`; every complete-match path sets that value before striking (`:292-295,424-432`). No per-word mistake history distinguishes an actually flawless word.
5. **P2, source-confirmed combo reporting:** non-lethal hits increment combo without updating bestCombo (`:353-356`). A run can end with a streak larger than its saved best.
6. **P2, simulation risk:** RNG consumption, callbacks and queued strikes occur inside React state updaters. These should be pure; development replay can run side effects more than once. This is not a proven production double-hit report, but it needs mounted Strict Mode tests.
7. **Product mismatch:** “endless” and “10–30 min” do not describe a strictly fifteen-wave campaign. Twelve non-boss waves contribute six simulated minutes; boss time and drafts add variable duration. Many enemy identities remain stat changes on the same contact loop, limiting tactical variety.

### Upgrade path

**To 7/10:** use one death-resolution function for every damage source; decay/remove corpses; track actual accuracy history and streaks; save real time and outcome. Add reliable pause-on-hide, checkpoint/resume and deterministic simulation tests before more content.

**To 8–9/10:** give ranged enemies a visible projectile deadline, shield enemies a learnable guard pattern and bosses actual phases. Introduce upgrade evolutions with clear prerequisites and two or three demonstrably viable builds. Add recovery opportunities, an enemy codex and a readable draft comparison.

**10/10 ambition:** a campaign with a satisfying ending plus a separately balanced Endless mode. Build synergies should change target selection, not only multiply damage. Provide a run recap with damage by source, upgrade contribution, threat mistakes and a useful next build suggestion.

**Done when:** every death grants rewards exactly once; long runs retain bounded entities; accuracy upgrades depend on real accuracy; pause freezes inputs and simulation consistently; every character can complete a seeded campaign under its intended skill band; checkpoints resume without rerolling rewards.

## 10. Ghost Racer — 4/10

### Current state and strengths

Perhaps the best educational idea in the collection: race the timing of your own previous run. It records character progress, interpolates samples with a binary search, stores up to five runs per text key and uses an honestly labeled 45 WPM pacer when no ghost exists. Strict-prefix distance correctly prevents space-mashing from advancing the car.

### Problems and risks

1. **P1, verified daily determinism defect:** daily selection uses a seeded RNG over an unseeded random pool (`ghost-racer-game.tsx:102-110`; `word-generator.ts:17-25,51-65`). The same daily seed produced different texts in the isolated probe. Shared date does not mean shared course.
2. **P1, source-confirmed text identity defect:** Practice uses the constant `practice:english` key while its text is randomized on mount. Saved ghosts can therefore refer to a different course, length and word difficulty. Storage carries no full text/hash for validation (`ghost-store.ts:23-34`).
3. **P1, source-confirmed rematch defect:** finishing saves the run but does not update `bestRun` or `ghost`; those reload only when `textKey`/text length changes (`ghost-racer-game.tsx:134-146,200-208,272-280`). An immediate rematch can still use the old ghost, contradicting “beat it and it becomes the new ghost.”
4. **P2, source-confirmed beginner dead end:** the race ends when the ghost finishes (`:241-246`), and only a player-finished race saves. Someone slower than the 45 WPM fallback cannot complete and establish their first personal baseline through that path.
5. **P2, scoring and ownership:** WPM is displayed as seconds; accuracy is stored in a combo field; replay storage is browser-wide, not account-scoped; parsing casts JSON without structural validation (`ghost-store.ts:43-55,178-204`). Refreshing or switching account can expose incompatible local replay state.
6. **P2, timing/UX:** no pause policy, no fresh-word restart key despite the comment, and an opponent completing first stops the learning session rather than allowing a clear “finish your practice” state.

### Upgrade path

**To 7/10:** use canonical versioned text and a content hash as course identity; make all random generation seeded; update the in-memory opponent after a new PB; validate and account-scope recordings. Allow the first attempt to finish unopposed and let losing players finish practice. Offer configurable pacers.

**To 8–9/10:** show time delta, per-word splits and the exact hesitations that improved. Separate “rematch this text” from “new text.” Add a small course library and compare today's run with a previous personal baseline on that exact course.

**10/10 ambition:** asynchronous friend ghosts, opt-in replay sharing, equal-course daily challenges and excellent improvement analysis. Clearly distinguish a real recorded ghost from a pacer. Verify competitive records before rankings; never invent human rivals.

**Done when:** identical seed/version means byte-identical text; wrong-course ghosts cannot load; a slower beginner can record a baseline; the next rematch uses the new PB; replay/account switching is safe; WPM, elapsed time, accuracy and victory are separate metrics.

## 11. Card Battle — 4/10

### Current state and strengths

Three starter decks, 39 card definitions, energy, draw/discard/exhaust piles, statuses, summons, visible enemy intents and nine fixed encounters ending in three bosses. The declarative card-operation model is a useful foundation. Turn-based play can be a welcoming entry for slower typists. The catalog's “40+ cards” should be corrected or fulfilled.

A fixed encounter order is not inherently a defect: it can support learning and deck planning. The problem is that important decisions are currently based on rules the engine does not consistently execute.

### Problems and risks

1. **P1, verified enemy block defect:** enemies gain block during their turn, but `endTurn` resets it to zero before the player can attack (`use-card-battle.ts:532,588-590`). The probe confirmed a nine-block intent leaves zero block. Defensive enemy turns become ineffective.
2. **P1, verified incomplete statuses:** player Blight neither deals damage nor decays. Enemy Encore and player Exposure do not affect incoming attacks (`:509-566`). The content explicitly advertises these effects (`cards/encounters.ts:53-81,97-107,120-151`; `cards/model.ts:42-90`). A ten-damage attack still dealt ten with enemy Encore 5 and player Exposure 3.
3. **P1/P2, verified boss sequence error:** first intent is chosen with index zero, but the next selection uses turn two. Ringmaster proceeds from Bow to Build, skipping Crack on the first cycle (`use-card-battle.ts:175-200,581-590`).
4. **P2, source-confirmed absent special:** Collector advertises taking a card using `special: "discard"` (`encounters.ts:136`); the enemy resolver never handles `it.special`. The hand is already discarded before enemy actions, so even the intended timing needs specification.
5. **P2, source-confirmed deckbuilding overclaim:** the public rules promise adding, upgrading or removing cards, but the reward flow only adds or skips (`use-card-battle.ts:642-658`; `card-battle-game.tsx:296-325`). Gold is earned/displayed without a reachable spending flow in this engine. Upgraded card faces exist, but the inspected run flow does not grant upgrades.
6. **P2, source-confirmed scoring inconsistency:** direct card kills add a 60-point fight-clear bonus (`:470-474`), while end-turn kills transition to reward without that bonus (`:573-577`). Poison/summon strategies are penalized by settlement path rather than intended balance.
7. **P2, input/learning mismatch:** clicking cards bypasses typing by design; that is valid for accessibility/tabletop play, but should not count as equivalent typing practice. There are no meaningful typing-accuracy metrics here. Whole keywords can also be entered through the unguarded input; do not market speed integrity.
8. **P1, persistence:** zero run duration conflicts with the database constraint. Long runs also lack durable resume. Side effects inside state updaters need the same purity audit as Survivor.

### Upgrade path

**To 7/10:** make a single, documented combat-resolution order. Implement every advertised status and enemy intent or remove it from playable content. Test damage, block expiry, poison timing, counters, deaths and rewards. Add real time tracking, checkpoint/resume and a readable combat log.

**To 8–9/10:** make gold useful through a small shop; implement card upgrade/removal; let users inspect their complete deck and draw probabilities; teach one archetype through a short opening encounter. Provide enemy targeting and end-turn controls usable without a mouse. Add a confirm option for ambiguous duplicate card instances.

**10/10 ambition:** a thoughtful typing deckbuilder, not a large unfinished card database. Add branching routes and meaningful relics only after all three starter archetypes are viable. Support relaxed click-assisted play separately from typing-only challenges. Optional speed bonuses should be a separate mode, not a punishment in the accessible turn-based base game.

**Done when:** all card text has corresponding behavior tests; status symmetry is intentional; boss patterns run in the advertised order; every kill path settles identically; gold has a purpose; upgrades/removals are reachable; a full campaign survives browser restart.

## 12. Spellbound — 4/10 prototype; not released

### Current state and strengths

The code contains five characters, sixteen spell definitions, relics, four floors, shops, events, rewards, bosses, mana, cooldowns and four simultaneous spell slots. Typing a longer word naturally takes more time while enemies act. This is a genuinely promising mapping between typing and tactical spell choice.

However, visitors currently receive an upcoming page. This section evaluates implementation potential and release readiness, **not a played public game**.

### Problems and risks

1. **P1 before release, source-confirmed missing promise:** interruption is described as a central risk, and Iron Will promises immunity. The tick explicitly acknowledges that no interrupt mechanic exists while applying Iron Will's damage penalty (`use-spellbound.ts:514-519`; `content.ts:484-486`). Either implement a fair interrupt rule or remove the promise and rebalance the relic.
2. **P1 before release, verified acquisition inconsistency:** Iron Will gained as a reward adds 20 max HP, while buying it does not (`use-spellbound.ts:893-918,962-976`). Probe: reward changed 60→80; purchase stayed 60. Cursed Quill/Mana Engine health adjustments are similarly path-specific. One acquisition resolver should govern rewards, events and shops.
3. **P1 before release, source-confirmed death-order gap:** cast-time health drain/reflection can reduce HP to zero (`:634,734-741`), then room completion can set phase to reward (`:830-838`). The main death check is in the combat tick. A lethal final cast needs explicit settlement precedence so a reward screen cannot bypass defeat.
4. **P2, source-confirmed targeting limitation:** spells hit the first living enemies rather than a player-chosen threat (`:695-704`). Four spell choices are meaningful, but the player has limited control over where expensive casts land.
5. **P2, source-confirmed duplicate-relic policy gap:** reward/shop offers sample the whole relic catalog rather than excluding owned relics (`:419-436,833-837`); acquisition appends IDs, while many effects use binary `includes` checks. A repeat pick can offer no extra effect. Explicitly support stacking/upgrades or filter already-owned non-stacking relics.
6. **P2, incomplete simulation discipline:** RNG mutation and queued casts/callbacks live inside state updaters. Pausing stops the tick but input/cast handlers check phase, not paused. Needs mounted-input and deterministic replay tests.
7. **P1/P2, shared concerns:** zero-duration result, incomplete cloud achievement coverage, no durable long-run resume and no verified mobile combat layout.

### Upgrade path

**To 7/10 prototype:** reduce release scope to one fully reliable floor, two characters, a small complete spell pool, a shop and one excellent boss. Centralize relic effects, death settlement and room resets. Add deterministic simulation, save/resume and a tactical tutorial before making the route playable.

**To 8–9/10:** introduce explicit enemy focus, readable mana/cooldown forecasts and a “why this cast failed” response. If interrupts are retained, telegraph them and allow a defensive response; do not randomly erase long words. Give each character a distinct resource/word-length tradeoff and test at novice/intermediate/expert typing speeds.

**10/10 ambition:** a compact roguelite in which spell selection, word length, resource planning and risk genuinely interact. Add floors and bosses only when the first floor demonstrates those decisions. Version run saves and seeds so balance patches cannot corrupt ongoing campaigns.

**Done when:** no advertised mechanic is inert; identical relic acquisition has identical effects; death always settles correctly; pause blocks gameplay input; room state resets intentionally; the full intended run is completable, resumable and readable on supported devices.

## 13. The advanced collection should have distinct jobs

Do not add the same battle pass, boss, shop and five multipliers to every game. Each game needs a reason to exist.

| Game | Player promise | Skill focus | Best advanced structure |
|---|---|---|---|
| Fruit Fury | Instant tactile arcade fun | Key recognition, response inhibition | Short missions and skill medals |
| Falling Words | Save the right target first | Reading ahead and prioritization | Pattern-driven arcade challenges |
| Word Rain | Hold your rhythm under pressure | Endurance and calm accuracy | Minimalist seeded survival |
| Word Blaster | Defend a base through smart targeting | Triage and sustained word input | Sector campaign and tactical loadouts |
| Grand Prix | Beat a clearly paced opponent | Continuous text speed and correction | Championships and asynchronous races |
| Boss Battle | Learn and defeat an encounter | Accuracy under explicit deadlines | Boss campaign and mastery ladder |
| Combo Rush | Sustain a clean flow state | Recovery and consistency | Bounded score attack plus classic endless |
| Survivor | Build a weapon out of your typing | Sustained input and build adaptation | Campaign, evolutions and separate endless |
| Ghost Racer | Beat your actual previous self | Pacing and specific hesitation reduction | Course library, splits and real replays |
| Card Battle | Think first; type to commit | Deliberate accurate input | Tested deckbuilding campaign |
| Spellbound | Choose the right spell under pressure | Word-length risk and resource planning | Compact tactical roguelite |

### Visual and audio upgrades that will actually help

1. **Gameplay first on screen.** Collapse the large marquee after Start and offer an optional focus/fullscreen view. Keep introductory copy/indexability outside active play. Preserve ads below the cabinet; do not insert an ad over a timed input path.
2. **Give every game a readable hierarchy:** target/action first, imminent threat second, progress third, decorative world last. Enlarge important words before enlarging cover art.
3. **Animate cause and effect:** wind-up → attack → impact → recovery. Sprite poses and well-timed flashes can feel much better than a costly 3D rewrite. Prefer transforms for moving visuals where profiling supports it.
4. **Different silhouettes, not only hues:** distinguish bombs, tanks, shields and urgent words by shape and symbols. Support high contrast and large text without changing the underlying challenge secretly.
5. **Use sound priority:** threat > confirmation > ambience. Cap overlapping cues; duck music for important events; independent music/SFX volumes; ensure mute stays respected across game changes.
6. **Separate accessibility from score integrity:** make assist options available and disclose when they alter challenge rules. Do not force sensory effects, punish assistive controls, or pretend touch slicing proves keyboard skill.
7. **Measure actual rendering:** low-end laptop, midrange Android, iOS Safari, high-DPI display, zoom, virtual keyboard and landscape. Source size and asset presence do not establish frame rate or readability.

### Learning and progression without meaningless grind

- Results should answer: **What did I do well? Why did I fail? What should I try next?**
- Offer game-specific mastery: rescue accuracy, shield timing, clean sectors, longest stable streak, useful card combinations—not just “play 100 times.”
- Turn weak-key/error observations into optional practice tasks. Keep typing-test metrics separate from mechanics such as fruit taps, spell power and card actions.
- Use cosmetic unlocks rather than progression purchases that inflate competitive power. Avoid adding many currencies without a useful decision attached.
- Personal history, checkpoints and achievement state must be account-safe and recoverable. Guest mode can remain local and explicitly unverified.
- Cross-game progression should recommend another skill, not require users to grind unrelated modes to enjoy their favorite game.

## 14. Implementation order and release gates

Priorities below refer to product impact: **P1 = correctness/trust blocker**, **P2 = important fairness/UX problem**, **P3 = expansion/polish**. No infrastructure takeover or data-exfiltration vulnerability is alleged by this game review.

### Phase A — Repair trust before adding content

1. Align duration and result contracts across components, API and database; normalize actual measured duration; correct units and comparison rules.
2. Implement pending/saved/failed result states, retry with a stable run ID and account ownership, and transactional or explicitly recoverable reward settlement.
3. Repair Grand Prix finish/scoring, Ghost Racer course identity/rematches, Card Battle turn/status rules and Survivor death accounting/cleanup.
4. Align rules text with gameplay: hazards, combo caps, rush tiers, weather, endless claims and actual content counts.
5. Add common pause/input/focus policies and regression tests for legal extreme runs.

**Gate:** every playable game completes a guest and signed-in test run; confirmed saves survive refresh/logout/login; deliberate save failures are visible and recoverable; no incomplete race can win; turn/damage/reward invariants pass.

**Migration discipline:** if a deployed constraint needs correction, add a new forward migration. Do not silently edit or remove the already-applied `20261003020000` history file. Inspect actual remote schema before assuming migration history proves it.

### Phase B — Establish a shared quality floor

Unify settings, accessible start/pause/result navigation, score presentation, tutorials, checkpoint versions and test fixtures. Extract pure simulation transitions where state updater side effects prevent deterministic tests. Share contracts and infrastructure, **not one giant engine that erases each game's mechanics**.

**Gate:** stable keyboard navigation, working reduced-motion/mute modes, mobile keyboard-safe layout, no unbounded entity/effect accumulation, and an agreed timing policy across supported devices.

### Phase C — Prove two premium vertical slices

**Fruit Fury:** complete one polished learning/arcade mission set with correct input separation and excellent feel.

**Boss Battle:** complete a small set of distinct encounters with tutorial, mastery and meaningful results.

Run moderated playtests before expanding. A small initial round of roughly 5–8 people per target ability band can expose usability problems, but it cannot establish population-level retention or balance. Re-test after changes.

**Gate:** players understand the rules without explanation, can explain failures, voluntarily replay, and show measurable improvement in the intended skill. Choose numeric business targets after collecting a baseline; no such telemetry was inspected here.

### Phase D — Extend depth in a controlled order

1. Word Blaster sectors and build choices.
2. Grand Prix championships and Ghost Racer course/split tools.
3. Survivor character balance and Card Battle complete deck-management systems.
4. Smaller, focused improvements to Falling Words, Word Rain and Combo Rush based on retention and distinctness.
5. Spellbound's complete first-floor slice, then remaining content after its release gates pass.

**Gate:** expand only when new content changes decisions and does not reintroduce persistence/control regressions.

### Phase E — Social competition, only when trustworthy

Start with opt-in asynchronous challenges and shareable results. Add server-verified challenge configuration, replay validation, anomaly review and score invalidation tools before public rankings. Live multiplayer is a separate product/infrastructure project, not a cosmetic game upgrade.

**Do not start with:** eleven simultaneous redesigns, replacing Next/React unnecessarily, a mandatory 3D engine, more generated cover images, prizes on client-authoritative scores, or a battle pass hiding broken core play.

## 15. QA and measurable definition of a premium release

These are proposed gates, not results this review claims to have achieved.

| Area | Required cases | Pass condition |
|---|---|---|
| Run lifecycle | Start, pause, resume, restart, quit, tab hide, focus loss, route change | No duplicate clocks, invisible damage or accidental restart |
| Typing correctness | Wrong key, backspace, deletion, selected-text replacement, repeat key, paste/drop, composition/mobile input | One documented policy; score only intended input; no stuck buffer |
| Time | Slow main thread, background tab, pause, resume countdown | Accurate active duration and deterministic deadline policy |
| Fairness | Same seed/rules; novice through expert pace; hard legal score extremes | Comparable results; no valid run rejected by arbitrary caps |
| Persistence | Guest, account A/B switch, refresh, logout/login, expired session, offline, 400/500, retry | No cross-account run settlement; visible failure; exactly-once rewards |
| Learning | Error-heavy fast player, accurate slow player, repeated identical course | Useful feedback tied to the intended skill; no misleading WPM |
| Long sessions | Many waves/cards/casts/restarts and navigation cycles | Entity/effect/timer/audio counts return to expected bounds |
| Mobile | Small width, landscape, keyboard open/close, touch and hardware keyboard | Target, threat, controls and input remain visible and usable |
| Accessibility | Keyboard-only, screen-reader navigation, zoom, high contrast, reduced motion, mute | Essential state and controls are understandable without color/audio alone |
| Deployment | Real authenticated staging result, schema constraint, reload and second device | Browser→API→DB→hydration agreement, not just a green unit test |

### Instrumentation that would make the next review better

Current analytics expose game start/completion, score and duration (`src/lib/analytics.ts:70-81`). They do not establish why a player left, which rule confused them, or whether a save failed.

Add consent-aware aggregate events for tutorial completion, first meaningful action, run outcome/reason, difficulty/input mode/rules version, retry, pause, quit and save status. Track:

- time to first successful action;
- first-run abandonment and immediate voluntary replay;
- completion/defeat distribution by skill band;
- save success and recoverable failure rates;
- actual active-time and simulation-time disagreement;
- input-to-visible-feedback latency and frame-time distribution on named hardware;
- target skill improvement over repeated comparable runs;
- D1/D7 return behavior only once enough consented data exists to interpret it.

Potential performance targets can be negotiated—for example, p95 input feedback under 50ms and smooth 60fps on a defined desktop class, with a graceful lower-effects mobile mode. These are **targets**, not measured current performance or universal device guarantees.

## Verification appendix

### Checks actually completed

- `git status --short` was empty at review start; revision `948c054`.
- Reviewed the catalog/router, all eleven game implementations and relevant callers/content. Inspected shared viewport/chrome, persistence, result validation, reward evaluation and existing tests.
- `npm test`: **357 passed, 0 failed, 0 skipped**. This is the existing repository suite, not 357 new game tests.
- **8 isolated reducer/validator/generator probes**, executed directly against source with the repository's Node test setup. No API requests or database writes.
- **6 isolated hook-state probes**, transpiling the actual hooks with installed TypeScript and substituting minimal in-memory React hooks/timers. These verify transition logic, **not React rendering, batching, effect scheduling or end-to-end behavior**.
- Content inventory: Spellbound has **16 spells, 16 relics, 5 characters**; Card Battle has **39 cards, 3 starter decks**. Catalog numbers should derive from actual content where possible.

### Probe results and reproducible fixtures

| # | Source path / fixture | Observed result |
|---:|---|---|
| 1 | `validateGameScoreInput`: Survivor, score 100, cleared 3, combo 4, duration 0 | Valid at API boundary; conflicts with the migration's ≥1000ms DB check |
| 2 | Same validator: Fruit Fury, score 100, cleared 3, combo 3, duration 5012.75 | Rejected: duration must be a non-negative integer |
| 3 | Falling Words running state, one `hazard` target | Typing earns 145 points; allowing it to land removes one life |
| 4 | Combo Rush at combo 25 | Tier metadata multiplier 2.5; actual scoring multiplier 1.6; HUD uses the latter |
| 5 | Grand Prix `hello/world`, rivals at 5%, commit `h` then `w` | Run over, player distance 20%, first place, score 1558 |
| 6 | Grand Prix, type `hell` then erase, ten times | 40 correct keypresses credited, zero banked characters |
| 7 | Word Rain, spawn `rain` into two lanes | Both duplicate targets accepted |
| 8 | Ghost daily generation, same seed, two controlled unseeded random-pool sequences | Different daily texts |
| 9 | Card Battle, enemy intent gains 9 block, end turn | Enemy has 0 block before next player action |
| 10 | Card Battle, player HP 70 with Blight 3, harmless enemy turn | HP still 70; Blight still 3 |
| 11 | Card Battle, incoming damage 10, enemy Encore 5, player Exposure 3 | Only 10 HP lost; advertised modifiers not applied |
| 12 | Card Battle Ringmaster first intent Bow, end turn | Next intent Build, skipping Crack at this transition |
| 13 | Survivor dead enemy with hitFlash 220, twelve 50ms ticks | Dead entry remains with hitFlash 220 |
| 14 | Spellbound Apprentice, acquire Iron Will via reward versus shop | Reward max HP 60→80; shop max HP remains 60 |

These are regression-test specifications for the next implementation pass. The diagnostic probes were temporary/in-memory and are **not added to the committed test suite** by this report.

### Why green tests did not establish game quality

- The integrity suite checks useful reducer invariants, but the Grand Prix bad-input fixture places rivals far ahead. It does not test partially correct early commits while rivals are behind.
- Combo tests verify tier labels and reset behavior, not the relationship between tier metadata and real time/point awards.
- Fruit Fury's multiplier test defines its own local `getScoreMultiplier` (`fruit-fury.test.ts:78-100`) instead of importing production scoring. It can stay green if the actual implementation diverges.
- No existing test imports of `useSurvivor`, `useCardBattle`, `useSpellbound` or `useFruitFury` were found. Their content/configuration tests are not full engine tests.
- Pure reducer tests cannot establish mobile focus, pointer batching, paused input, mounted Strict Mode effects, audio cleanup or authenticated database settlement.

### Not verified in this pass

Browser visuals and full runs; screenshots; screen-reader experience; on-device keyboards; FPS/latency/memory measurements; live schema and RLS; authenticated save/retry behavior; deployed version; real user retention; asset-license provenance. Build, lint and typecheck were not rerun for this documentation-only review. Earlier checks are not claimed as current verification.

## Final recommendation

**Keep the best ideas; stop expanding around broken rules.** Repair the shared result pipeline and four highest-risk simulations, establish consistent controls, then finish two exceptional game experiences before upgrading the rest in batches.

The path to a “10/10” collection is not “more of everything.” It is **clear identity, reliable rules, useful typing practice, meaningful choices, excellent feedback and demonstrated replay value** for each game.
