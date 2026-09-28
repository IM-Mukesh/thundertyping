# HeroTyping Games Catalog — Comprehensive Game-by-Game Audit

Date: 2026-09-28
Repository: IM-Mukesh/thundertyping (HeroTyping)

---

## 1. Falling Words
- **A. Core loop**: Read board -> Prioritize lowest threat -> Type exact word -> Target destroyed -> Gain score & combo -> Advance wave phase -> Repeat.
- **B. Actual player decision**: Target prioritization under spatial time pressure. Choosing between the dangerously low word (must type now to survive) vs high-value golden/elite target vs slow-down utility target.
- **C. Differentiation**: Multi-lane vertical descent with multiple simultaneous threats. Unlike single-word tests, the user scans 2D space to assess deadline urgency.
- **D. Difficulty ramp**: Words cleared increases spawn frequency, descent speed, and introduces elite/armored word variants.
- **E. Improvement driver**: Peripheral spatial reading, eliminating hesitation on opening keystroke, triaging threats by floor distance.
- **F. Skill reward**: High combos (up to 2x multiplier), Overdrive fever mode triggering slow-motion + 1.5x score bonus, high WPM badge.
- **G. Replayability**: Chasing personal bests, surviving into higher phase waves (Warmup -> Surge -> Mixed -> Elite -> Overdrive).
- **H. Tension**: Multiple words entering the lower 25% "danger strip" with flashing red ground and alarm cue.
- **I. Mastery**: Developing "keystroke commitment" — once committed to a target, bursting it down cleanly without aborting.
- **J. Run variance**: Randomized lane assignments, distinct word length distributions, variable golden/armored spawns.
- **K. Replay hook**: "I lost all lives because I got greedy on a long word while a 3-letter word hit the floor — next time I'll triage better."
- **L. After 10 minutes**: Reaches intense Elite wave with fast 5-8 letter words requiring >50 WPM to sustain.
- **M. After 100 runs**: Second-nature lane scanning; player instinctively targets by altitude rather than reading order.
- **N. Potential boredom**: If every word is the same plain text falling at a constant speed with no variant behaviors.
- **O. Potential confusion**: Target lock jumping between two words starting with the same prefix.
- **P. Exploits**: Space spamming (mitigated: space does not commit), key spamming (mitigated: must match prefix).
- **Q. Mobile hazards**: Narrow screens clip lanes; keyboard opening cuts off the floor where words land.
- **R. OSK behavior**: If board does not re-layout around `visualViewport`, bottom danger zone is buried beneath keyboard.
- **S. Resize/orientation**: Lane count must dynamically adapt (e.g., 4 lanes on mobile portrait, 6 on desktop/landscape) without losing active words.
- **T. Focus loss**: Game pauses or displays focus warning so lives are not lost while clicking away.
- **U. Tab backgrounded**: Clock / interval pauses; no instant death on tab return.
- **V. Fast typing**: Flawless rapid clear triggers rapid combo milestones and Overdrive bonus.
- **W. Enter/Space mash**: Space does not advance words; Enter restarts only when game over.
- **X. Audio failure**: Game logic continues silently without throwing Web Audio errors.
- **Y. Corrupted localStorage**: Sanitizer validates `GameBest` (rejects NaN/negative), falls back to null.
- **Z. Small browser**: Fluid clamp on board height with guaranteed floor visibility above controls.

---

## 2. Word Rain
- **A. Core loop**: Type falling word -> Clear -> Survive another second -> Weather storm escalates -> Tension mounts -> Run ends on single miss.
- **B. Actual player decision**: Rhythm vs panic management. Zero error tolerance means steady 98%+ accuracy beats frantic bursts.
- **C. Differentiation**: Pure endurance survival (1 life only). Scored by survival time, not arbitrary points. Has dynamic storm intensity phases (Calm, Buildup, Storm, Crisis, Surge) with atmospheric weather shifts.
- **D. Difficulty ramp**: Pacing tightens relentlessly; spawn intervals contract and storm wind/rain density increases.
- **E. Improvement driver**: Mental stamina, breathing rhythm, avoiding panic backspacing.
- **F. Skill reward**: Seconds survived badge, milestone celebrations at 30s, 60s, 120s, 180s.
- **G. Replayability**: Seeded daily storms, high adrenaline run-restart loop ("I was 2 seconds away from 1 minute!").
- **H. Tension**: Extreme — a single word touching the bottom ends the entire run immediately.
- **I. Mastery**: Flawless zero-mistake typing under high cognitive load.
- **J. Run variance**: Distinct storm profiles (Squall, Thunderstorm, Monsoon), varying word length profiles.
- **K. Replay hook**: Instant restart with one tap/Spacebar — "Just one more run."
- **L. After 10 minutes**: High-tier players reach Storm/Crisis phase (>65 WPM equivalent fall rate).
- **M. After 100 runs**: Real-world typing accuracy stabilizes at near 100%.
- **N. Potential boredom**: Was previously an exact clone of Falling Words! Needed its own distinct storm engine and presentation.
- **O. Potential confusion**: Unclear why a run ended if the floor collision lacks strong audio/visual impact.
- **P. Exploits**: None (1 life prevents buffering mistakes).
- **Q-Z. Mobile/Robustness**: VisualViewport aware, safe bottom margin, instant restart without double-event firing.

---

## 3. Word Blaster
- **A. Core loop**: Enemy advances in lane -> Type opening letter to lock turret -> Blast target -> Lane clear -> Defend base wall -> Boss encounter.
- **B. Actual player decision**: Target selection & lane queue management. Which lane is crowded? Which enemy is closest to breaching? When to pop weapon powerups?
- **C. Differentiation**: Horizontal shooter defense. Enemies advance across lanes; opening letter commits the turret firing solution.
- **D. Difficulty ramp**: Travel speed increases, multiple enemies stack up in lanes, armored enemies appear, climax Dreadnought boss spawns.
- **E. Improvement driver**: Queue management — destroying lane leaders before they stack into a simultaneous wall.
- **F. Skill reward**: Multi-kill combos, weapon overcharge (Piercing / Chain / Rapid), boss defeat bonus.
- **G. Replayability**: Boss encounters, weapon powerups, wave escalation.
- **H. Tension**: Enemies closing in on the wall; siren sound and red alert edge pulse.
- **I. Mastery**: Reading ahead down the queue to clear targets while they are still far out.
- **J. Run variance**: Varied enemy compositions (Scout, Tank, Shielded, Swarmer).
- **K. Replay hook**: Beating the wave boss and chasing higher kill scores.
- **L. After 10 minutes**: Multi-boss survival with heavy wave density.
- **M. After 100 runs**: High proficiency at typing under horizontal directional scanning.
- **N. Potential boredom**: Repetitive single-shot kills without enemy variety or weapon feedback.
- **O. Potential confusion**: Turret locked onto an enemy off-screen or behind another.
- **P. Exploits**: Must type exact word to kill; backspace unlocks target.
- **Q-Z. Mobile/Robustness**: Responsive horizontal lanes; target labels stay readable on 360px screens.

---

## 4. Typing Grand Prix
- **A. Core loop**: Read sequential word -> Type with flow -> Space commits word -> Car accelerates -> Overtake rivals -> Cross finish line.
- **B. Actual player decision**: Error correction triage vs pace preservation. If a rival is right beside you, do you backspace to fix a typo, or commit and accelerate?
- **C. Differentiation**: Competitive racing against pacing rivals (Shadow 35 WPM, Blaze 50 WPM, Nova 70 WPM) over a fixed course (40 words).
- **D. Difficulty ramp**: Rivals hold steady pacing; player must sustain speed without stalling on difficult words.
- **E. Improvement driver**: Cadence and rhythm consistency; reducing inter-word pause latency.
- **F. Skill reward**: Podium finish (1st, 2nd, 3rd), placement bonuses, Nitro Boost speed surges.
- **G. Replayability**: Ladder progression: beat Shadow, then Blaze, then Nova, then chase Personal Best time.
- **H. Tension**: Sound of rival car engines pulling up along your rear bumper; slipstream visual effects.
- **I. Mastery**: Clean touch-typing rhythm with zero hesitation on punctuation or transitions.
- **J. Run variance**: Rival pace jitter, varied word sequences, track environments.
- **K. Replay hook**: "Nova beat me by 0.4 seconds because I stumbled on 'extraordinary' — I can take her."
- **L. After 10 minutes**: Multiple race attempts refining speed consistency.
- **M. After 100 runs**: Fluid transition between words without cognitive stutter.
- **N. Potential boredom**: Static car sprites moving at fixed rates without racing feel.
- **O. Potential confusion**: Why did my car stop? (A typo stalls the engine until corrected or committed).
- **P. Exploits**: Previously spacebar could advance distance; fixed by tying distance strictly to correct characters.
- **Q-Z. Mobile/Robustness**: Centered word stream above the keyboard, visible track lanes, responsive speedometer.

---

## 5. Boss Battle
- **A. Core loop**: Boss charges attack -> Player types words to deal damage and fill shield -> Quota met blocks attack -> Boss stagger -> Next phase.
- **B. Actual player decision**: Risk vs Reward. Short words fill shield pips safely before the charge timer expires; long words deal massive quadratic damage ($L^2$).
- **C. Differentiation**: Attack window management. Deadlines are immediate: failure to clear words before the charge bar fills costs 1 of 3 lives.
- **D. Difficulty ramp**: Boss shifts across 3 phases (66% and 33% HP): charge window shrinks (6.4s -> 4.8s -> 4.0s) and min word length increases.
- **E. Improvement driver**: Burst typing under strict countdown pressure; front-loading safety then maximizing damage.
- **F. Skill reward**: Phase bonuses, flawless block bonuses, victory with all 3 lives intact.
- **G. Replayability**: Defeating the boss with higher WPM and fewer hits taken.
- **H. Tension**: Glowing crimson charge bar filling toward 100% while typing the second block word!
- **I. Mastery**: Flawless burst execution without breaking combo multiplier (up to 1.6x).
- **J. Run variance**: Seeded word queue, boss attack timing variations.
- **K. Replay hook**: "I made it to Phase 3 enrage at 12% boss HP — I know the timing now!"
- **L. After 10 minutes**: Mastery of Phase 3 pacing (>35 WPM sustained error-free).
- **M. After 100 runs**: Exceptional calm under deadline-driven typing.
- **N. Potential boredom**: Lack of boss personality or telegraph animations.
- **O. Potential confusion**: What does the shield bar do? (2 words block the hit).
- **P. Exploits**: Cannot bypass charge by mashing; damage requires exact word typing.
- **Q-Z. Mobile/Robustness**: Boss HP bar and attack charge bar remain sticky at top above keyboard.

---

## 6. Combo Rush
- **A. Core loop**: Timer counts down -> Type word -> Gain seconds back -> Increase combo multiplier -> Drain rate accelerates -> Keep clock alive.
- **B. Actual player decision**: Time economy trading. Typing fast earns time; mistakes break combo and cause net time deficit. When to use Space-to-skip?
- **C. Differentiation**: Draining clock where every word is an economic exchange of milliseconds spent vs milliseconds gained.
- **D. Difficulty ramp**: Drain multiplier increases with words cleared (up to 2.4x drain rate).
- **E. Improvement driver**: Pacing control — typing slightly below maximum speed to guarantee 100% accuracy and keep the 12-combo multiplier active.
- **F. Skill reward**: High combo streaks, Rush Tier transitions (Bronze, Silver, Gold, Hyper), massive score scaling.
- **G. Replayability**: Fast 1-3 minute sessions with immediate feedback.
- **H. Tension**: Clock dropping below 5 seconds, bar pulsing red, siren sound ticking down.
- **I. Mastery**: Sustained flow state with zero typos over 60+ consecutive words.
- **J. Run variance**: Word queue variance, daily rush challenge.
- **K. Replay hook**: Instant restart to beat previous word count.
- **L. After 10 minutes**: High-speed endurance test.
- **M. After 100 runs**: Muscle memory for rapid character transitions.
- **N. Potential boredom**: Monotonous timer drain without visual hype or milestone celebrations.
- **O. Potential confusion**: Skipping a word penalizes time and resets combo.
- **P. Exploits**: Space-skip penalty prevents skipping through hard words.
- **Q-Z. Mobile/Robustness**: High-contrast large timer display, visible next-word queue.

---

## 7. Typing Survivor
- **A. Core loop**: Swarm surrounds player -> Type words to strike -> Collect XP -> Level up -> Draft upgrades -> Build synergies -> Defeat wave bosses.
- **B. Actual player decision**: Upgrade drafting and build crafting. Do I build Chain Lightning, Frost slow, Critical executions, or Rapid short-word bursts?
- **C. Differentiation**: Roguelite horde survival with 4 character classes, deep upgrade trees, and escalating wave mechanics.
- **D. Difficulty ramp**: Horde density grows, fast sprinters, shielded brutes, and elite bosses appear at wave milestones.
- **E. Improvement driver**: Balancing target priority with upgrade draft synergies.
- **F. Skill reward**: Synergistic builds melting entire swarms, surviving deep into late waves.
- **G. Replayability**: High — multiple characters, randomized 3-card upgrade drafts, diverse build archetypes.
- **H. Tension**: 15+ enemies converging on the center while drafting your next upgrade!
- **I. Mastery**: Crafting focused builds that counter specific enemy threats.
- **J. Run variance**: Distinct upgrade offerings each run, different wave enemy combinations.
- **K. Replay hook**: Trying an alternate build archetype (e.g. Frost CC vs Burst Crit).
- **L. After 10 minutes**: Wave 8+ elite encounters with multi-stage bosses.
- **M. After 100 runs**: Deep understanding of upgrade synergies and crowd control mechanics.
- **N. Potential boredom**: If upgrades are just flat "+5% stat" bonuses without visual/mechanical distinction.
- **O. Potential confusion**: What does an upgrade actually do? (Needs clear actionable tooltips).
- **P. Exploits**: Typing target locks and requires exact match; level-up queues handled cleanly without dropping drafts.
- **Q-Z. Mobile/Robustness**: 2D circular arena scales cleanly to square/vertical viewports; upgrade draft modal adapts to screen height.

---

## 8. Ghost Racer
- **A. Core loop**: See target text -> Start typing -> Ghost of your own best past run replays keystroke-by-keystroke -> Gauge delta (+/- seconds) -> Beat your past self.
- **B. Actual player decision**: Pacing against your own past habits. Not panicking when the ghost hits a burst; capitalizing where the ghost hesitated.
- **C. Differentiation**: Racing against REAL recorded keystroke timing from your own prior run, not simulated bots.
- **D. Difficulty ramp**: Dynamic self-pacing: the better you get, the faster the ghost opponent becomes.
- **E. Improvement driver**: Eradicating micro-hesitations and smoothing out typing cadence.
- **F. Skill reward**: "NEW GHOST RECORD", rank tier promotions (Bronze -> Silver -> Gold -> Legend).
- **G. Replayability**: The most personal replay loop in the entire product — chasing yourself.
- **H. Tension**: Ahead by 0.2s on the final sentence, matching ghost stride for stride!
- **I. Mastery**: Uniform velocity and high rhythmic flow across varied sentence structures.
- **J. Run variance**: Multiple selectable texts, daily race seed.
- **K. Replay hook**: "I know exactly where I stumbled in that recording — I can shave 2 seconds off."
- **L. After 10 minutes**: Meaningful WPM gains as hesitations are systematically smoothed out.
- **M. After 100 runs**: Transforms typists into competitive touch typists.
- **N. Potential boredom**: Inadequate feedback on whether you are currently gaining or losing ground.
- **O. Potential confusion**: Distinguishing player car from ghost car.
- **P. Exploits**: Space-mashing exploit patched in v2; position strictly tracks correct character prefix.
- **Q-Z. Mobile/Robustness**: Real-time delta bar (+0.5s / -0.3s) positioned clearly above keyboard.

---

## 9. Card Battle
- **A. Core loop**: Read enemy intent -> Plan energy expenditure -> Type card name to play -> Apply status/damage -> End turn -> Enemy acts -> Gain loot/cards.
- **B. Actual player decision**: Strategic deckbuilding & card sequencing. Blight + Multiplier + Execute; Shield + Retain + Counter.
- **C. Differentiation**: Turn-based strategy roguelike. No rush clock; accuracy and sequencing are paramount.
- **D. Difficulty ramp**: Elite enemies with dangerous status effects (Vulnerable, Frail, Strength buffs), boss encounters with complex phases.
- **E. Improvement driver**: High accuracy under deliberate cognitive planning.
- **F. Skill reward**: Infinite block builds, massive 100+ blight bursts, flawless boss victories.
- **G. Replayability**: 3 distinct character classes, 40+ cards, card upgrade/removal paths, node map choices.
- **H. Tension**: Boss preparing a 28-damage heavy slam while you have 18 HP and 1 energy left!
- **I. Mastery**: Deck thinning, synergy optimization, calculating lethal turns.
- **J. Run variance**: Procedural encounter map, random card reward drafts, shop inventory.
- **K. Replay hook**: "Next run I'll draft a pure Defense/Thorns build instead of Blight."
- **L. After 10 minutes**: Floor 2/3 elite combat requiring precise energy math.
- **M. After 100 runs**: Deep tactical mastery of all deck archetypes.
- **N. Potential boredom**: Sluggish card animations or redundant cards.
- **O. Potential confusion**: Hidden status effect math (needs clear tooltips).
- **P. Exploits**: Energy clamping, card instances sanitized, non-letters ignored.
- **Q-Z. Mobile/Robustness**: Card hand displays cleanly as accessible scrollable pills; enemy intent badges clear on small screens.

---

## 10. Fruit Fury
- **A. Core loop**: Fruits launch on parabolic arcs -> Read letter -> Type matching key -> Fruit slices with juicy splash -> Avoid bomb letters -> Build Fever.
- **B. Actual player decision**: Reflex letter recognition with high-stakes bomb discrimination. Slicing a bomb is instant game over!
- **C. Differentiation**: Arcade fruit-slicing action with authentic physics, juice particles, cut halves, and 2X Fever frenzy.
- **D. Difficulty ramp**: Higher launch velocity, multi-fruit volleys, deceptive bomb placement.
- **E. Improvement driver**: Single-key tactile reflex, instant visual-to-finger mapping.
- **F. Skill reward**: Golden fruit +200 bonus, Frost fruit time freeze, Fever Frenzy 2X rainbow shower, slicing combos.
- **G. Replayability**: High-octane reflex arcade loop, score chasing, practice mode row filters.
- **H. Tension**: A bomb launched right next to a ripe watermelon at the arc apex!
- **I. Mastery**: Lightning-quick split-second target confirmation without mis-keying.
- **J. Run variance**: Dynamic launch arcs, unpredictable volley patterns.
- **K. Replay hook**: "I hit the bomb at 1,800 points because I rushed — one more game!"
- **L. After 10 minutes**: Razor-sharp finger placement across all keyboard rows.
- **M. After 100 runs**: Zero keyboard looking; pure motor reflex.
- **N. Potential boredom**: Repetitive spawn rates or lack of special fruits.
- **O. Potential confusion**: Bomb letter looking too similar to fruit letter.
- **P. Exploits**: Must match exact flying fruit letter; bomb letter triggers fatal explosion.
- **Q-Z. Mobile/Robustness**: Canvas auto-scales; launch apex calibrated so fruits float in the upper 60% of visible viewport above mobile keyboard.

---

## 11. Spellbound (Upcoming Preview)
- **Status**: Roguelite RPG currently in development (preview).
- **Design Philosophy**: Word length equals cast time. Short spells cast fast for light damage; long spells deal massive damage but leave mage vulnerable.
- **Audit Findings**: Systems (relics, spells, room map, enemies, characters) are drafted in `src/lib/games/spellbound/`.
- **Integrity Directive**: Preserved with `upcoming: true` so it remains a teaser on the arcade hub, does not appear in public indexable sitemaps, does not gate the `site:all-games` arcade achievement, and does not leak unfinished endpoints to search engines.
