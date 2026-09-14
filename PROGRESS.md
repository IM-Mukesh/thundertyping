# ThunderTyping — Project State & Roadmap

**Read this file first.** It exists so any AI agent or developer (not just the one who wrote it) can pick up this project cold and be productive immediately, without re-asking the human basic questions about scope, stack, or decisions already made. Keep it updated as the source of truth for "what's done" and "what's next." If you finish work, update the relevant sections before ending your session.

## What this project is

A typing-speed-test website (MonkeyType-style) aiming for large organic Google traffic, monetized via Google AdSense. Long-term ambition: "world's best typing platform," but development proceeds in deliberate phases — **do not jump ahead to multiplayer/accounts/backend/games until explicitly prioritized below.**

- **Brand name**: ThunderTyping
- **Current phase**: Frontend-only MVP, feature-complete and hardened. No backend, no accounts, no database. Everything persists to `localStorage`. Not yet launched (no real domain, no AdSense account, no Search Console).
- **Language**: English only (architecture supports adding more later, see `src/data/words/` and `src/data/quotes/`).
- **Design**: Minimalist, MonkeyType-inspired — the typing area is the visual star, chrome stays out of the way. Five built-in themes (Dark default, Light, Midnight, Forest, Sunset) via a theme picker in the header, all color changes transition smoothly except per-character typing feedback (deliberately instant — see Architecture).

## Tech stack & conventions

- Next.js 16 (App Router, Turbopack), React 19, TypeScript (strict), Tailwind CSS v4 (theming via CSS variables in `globals.css`, **no `tailwind.config.ts`** — Tailwind v4 doesn't need one here).
- `zustand` (+ `persist` middleware) for durable, low-frequency state (user settings). `useReducer` for the high-frequency typing engine state (not zustand — see Architecture).
- `motion` (formerly Framer Motion) for animation — imported from `motion/react`, **not** the bare `motion` package root (that resolves to the vanilla-JS DOM API, not React components/`layoutId`).
- `lucide-react` for icons, `clsx` (wrapped as `cn()` in `src/lib/utils/cn.ts`) for conditional classnames.
- `src/` directory, `@/*` path alias to `./src/*`.
- Conventions mirrored from a sibling project at `../Git-Review` (Next.js 16.3.4, same Tailwind v4 pattern) for consistency, though the two projects are unrelated products.
- Git repo initialized at the project root. Commit as you go — meaningful, scoped commits, not one giant dump.
- Dev server: `.claude/launch.json` in the **sibling `Git-Review` directory** has a `"thundertyping"` entry using `npm --prefix ../thundertyping run dev -- -p 3002` (the harness's `preview_start` tool reads `launch.json` from the primary working directory, which is `Git-Review`, not this repo — environment quirk, not a design choice). A dev server may already be running on port 3001 — check `ss -ltnp | grep 300` before starting a new one. If the dev server's error overlay ever disagrees with a fresh `npm run build`, trust the build and restart the dev server (`rm -rf .next` then `npm run dev`) rather than "fixing" code that isn't broken (Turbopack has served stale compile errors in this environment before).

## Current status (as of 2026-09-14)

### Done and verified working
Manually tested via browser automation (typed real words, confirmed char-by-char coloring, word advancement, caret positioning, timer countdown, auto-finish, personal-best recording, restart, mobile viewport layout, malformed-localStorage recovery, paste blocking, zero layout shift on test start, theme switching, punctuation-skip handling) — every bullet below was actually exercised, not just written and assumed correct.

- Project scaffold, 5-theme system (`data-theme` attribute + CSS vars, picker in `theme-switcher.tsx`), header/footer, ad-slot placeholders (footer + post-results, not near the typing area).
- Full typing engine (`src/lib/typing-engine/`): time mode (15/30/60/120s, infinite word regeneration), words mode (10/25/50/100), quote mode (curated public-domain quotes, short/medium/long), custom text mode (capped at 2000 chars), punctuation/numbers injection toggles.
- Per-character correct/incorrect/extra/pending rendering, animated caret (via `motion` `layoutId` shared-element transition), smooth 3-line word-window scrolling that re-measures after web fonts finish loading.
- Live stats while running (countdown or word progress + live WPM, stabilized against early-test noise), results screen (net WPM, raw WPM, accuracy, consistency, char breakdown, personal-best badge) — **accuracy and the correct/incorrect breakdown are now mathematically guaranteed to agree** (see Known issues fixed).
- **Results graph** (`results-graph.tsx`, new): plots net WPM and raw WPM as two lines over time on a single y-axis — deliberately **not** MonkeyType's dual-axis (WPM + errors on a second scale) layout, which is a well-known charting anti-pattern; error-count-over-time was scoped out rather than bolted on as a second axis. `WpmSample` gained a `rawWpm` field (populated every `TICK` via `calculateRawWpm`). Has a legend (line-key + label, not color-only), recessive gridlines, end-dot markers, and a hover crosshair + tooltip reading the nearest sample. Colors reuse existing theme tokens (`--accent`, `--sub`) rather than introducing a new chart palette, so it adapts correctly across all 5 themes automatically. Verified two ways: (1) a clean-typing test showed the two lines exactly overlapping (mathematically correct — raw and net WPM are identical at 100% accuracy), (2) a test with one deliberate uncorrected mistake showed the lines genuinely diverge (raw consistently above net, as it must be). Returns nothing for the (rare) sub-1-second test where fewer than 2 samples exist, rather than rendering a misleading single-point chart.
- **Restart icon**: a small always-present circular button below the word-stream (idle/running only — the results screen has its own explicit "Restart" button already), matching the persistent restart affordance MonkeyType shows. Follows the same "always mounted, opacity-only crossfade" pattern as the config bar — no layout shift.
- **Language selector**: a real (not decorative) popover next to the config bar showing "English" as the sole, checked option — same interaction pattern as the theme picker. Only one language exists today, but the control is honestly functional (opens a real menu) rather than a fake button that does nothing, so adding a second language later is one more row, not a rebuild.
- **Typography**: monospace font switched from Geist Mono to JetBrains Mono site-wide (`layout.tsx`, `globals.css`'s `--font-mono`) per explicit request for better legibility. Word-stream font size was briefly reduced to `text-lg/xl` in the same pass; the human found it too small on sight, so it's back to the original `text-2xl/3xl` with `LINE_HEIGHT` (`word-stream.tsx`) restored to 48 to match — worth remembering if a future "make it more compact" request comes in, since this exact size was already tried and rejected once.
- **Custom time duration**: the time-mode pills (15/30/60/120s) now sit next to a real numeric input — type any whole-second value (clamped 5–600s via `MIN_CUSTOM_TIME_DURATION`/`MAX_CUSTOM_TIME_DURATION` in `engine-types.ts`), press Enter/blur to apply, and it renders as its own active pill (e.g. "45s") replacing the input until clicked again. Required widening `TimeDuration` from the `15 | 30 | 60 | 120` literal union to plain `number` — `settings-store.ts`'s rehydration validator now range-checks instead of set-membership-checks, so a persisted custom value survives reload. Verified via simulated input + Enter: pill appeared, countdown reflected the custom value, and a full restart preserved it.
- **Header logo now actually resets the test.** Previously `<Link href="/">` was a no-op when already on `/` (no navigation = no remount), so clicking the logo from the results screen (or mid-test) did nothing — reported by the human. Fixed with a small pub-sub (`reset-bus.ts`, plain `window` `CustomEvent`, deliberately not zustand — nothing needs to *read* a value, just react to the signal) that `TypingTest` listens for and `SiteHeader` emits on click, but only when `pathname === "/"` (elsewhere the `Link` navigation alone is correct and sufficient). Verified: typed into a running test, clicked the logo, input cleared and a fresh word list appeared.
- Config bar's outer border removed (`test-config-bar.tsx`) per explicit design feedback — background tint + padding still delineate it, just no hard border line.
- Skipping punctuation via space (not typing the trailing comma/period/etc.) is never penalized as "missed" — only genuinely skipped letters count.
- Personal bests persisted per mode+config in `localStorage` (time/words modes only), with type-validated rehydration so corrupted storage can't inject garbage into the UI.
- Settings persisted via zustand with full validation on rehydration — every field falls back to a safe default if the stored value is out of range, wrong type, or (for `mode`) `"custom"` with no text behind it.
- Paste is blocked in the typing input; keystroke counting loops over every newly-inserted character rather than assuming exactly one.
- Supporting pages: `/about`, `/privacy`, `/terms`, a themed custom `/not-found` (404), a root `error.tsx` boundary, and a dynamically generated OG image (`app/opengraph-image.tsx`).
- Mobile layout (375×812) verified with no horizontal overflow. Hidden input has `font-size: 16px` to prevent iOS auto-zoom.
- Custom-text modal has proper dialog semantics, closes on Escape or backdrop click, live character counter, returns focus on close.
- Mode-selection and toggle pills expose `aria-pressed`.
- Build (`npm run build`) and lint (`npm run lint`) both pass clean.

### Known issues fixed this session (context for why the code looks the way it does)
- **Results screen's accuracy % and its "correct/incorrect" breakdown could contradict each other.** Reported by the human, reproduced precisely: custom text "cat" typed with one backspaced-out mistake showed "3 correct, 0 incorrect" but 75% accuracy — impossible for both to be right. Root cause: the breakdown was tallied from each word's *final* character state, while accuracy came from full keystroke history (including corrected mistakes). Fixed by removing correct/incorrect from `CharTally` entirely; the breakdown now reads `correctKeystrokes`/`incorrectKeystrokes` directly — the same numbers accuracy is computed from — so they can never disagree again.
- **Skipping punctuation via space was counted as a "missed" mistake.** Reported by the human with a screenshot. If you type "hello" and space past a "hello," word without typing the comma, that's not an error — you chose not to type a mark that's arguably decorative. Fixed in `tallyWord`/`countPenalizedMissed` (`use-typing-engine.ts`): trailing untyped characters only count as "missed" if they aren't punctuation (shared `PUNCTUATION_MARKS` list from `word-generator.ts`). Verified real skipped *letters* still count as missed — only punctuation is exempt.
- **Live WPM could spike to absurd values (e.g. "12000 wpm") in the first instant of a test.** Caught on video. `netWpm = correctChars / 5 / minutesElapsed` is unstable when elapsed time is a few milliseconds. Fixed by flooring the denominator at 1000ms for live display (`calculateLiveWpm`) and skipping consistency-score sampling entirely during that window. Final results always use true elapsed time.
- **UI jumped/glitched the instant typing started.** Also caught on video. The config bar was conditionally unmounted, so its layout space collapsed instantly when it exited, snapping the word-stream upward. Fixed by keeping the config bar permanently mounted and crossfading it with the live-stats bar inside one fixed-height slot — verified via `getBoundingClientRect()` that the word-stream's position is bit-for-bit identical before and after a test starts.
- **Hydration mismatch**: the engine's initial word list uses `Math.random()`, which would differ between server and client render. Fixed via `next/dynamic(..., { ssr: false })` for the interactive island; the SSR'd shell (h1, intro, JSON-LD) around it stays server-rendered for SEO.
- **Double word-regeneration on mount**: React Strict Mode's dev-only double effect invocation defeated a naive "skip first run" ref guard. Fixed by comparing the memoized config object by reference instead of a boolean flag.
- **Custom mode + reload = stuck blank test**: `mode` persists via zustand but `customText` deliberately doesn't. Fixed: a persisted `"custom"` mode is treated as absent on rehydration and falls back to the default.
- Environment-specific testing quirks (not app bugs, documented so a future session doesn't chase ghosts): this session's browser-automation tool dispatches a malformed event for the "space" named key (empty `key`/`code`/`which`) — verified the real app logic is correct via `Tab` and manually-constructed `KeyboardEvent`s. `requestAnimationFrame` doesn't reliably fire when this environment's Browser pane isn't actively displayed, which can leave `AnimatePresence` exit-animated elements visually hidden but still mounted in the DOM — standard library behavior, not verifiable end-to-end in this specific environment, worth a real-browser spot-check but not something to "fix" based on this evidence.

### Awaiting human input (asked, not yet actioned)
The human reported (2026-09-14) that typing a word but skipping its trailing punctuation (e.g. "cut" instead of "cut,") still shows 100% accuracy / 0 incorrect. **This is the current design, not a bug** — see the punctuation-skip fix above, which was itself a previous explicit human request to stop penalizing exactly this. Asked whether they now want the opposite behavior (untyped punctuation counts as a real miss/mistake) before touching it, since flipping it back would undo that earlier fix. Do not change `countPenalizedMissed`/accuracy semantics until that's answered.
Also asked, not yet scoped: what "make the language selector better" means concretely (visual polish vs. actual functionality beyond the English-only stub), and which specific interactions the human wants a Framer Motion animation pass applied to first (a "make it look like the best site in the world" request is too open-ended to implement blind — asked for a prioritized short list: results reveal, stat count-up, pill/tab transitions, hover states, page-level transitions, etc.).

### Not built yet (by design, not oversight)
- No settings modal (Escape currently just blurs the input); no sound effects (`soundEnabled` exists in settings but nothing plays).
- No custom favicon (still Next.js default); OG image is handled.
- No real AdSense integration — `AdSlot` renders placeholders until `NEXT_PUBLIC_ADSENSE_CLIENT_ID` is set; creating/approving the account requires the human.
- No focus-trap in the custom-text modal — low risk (one textarea, two buttons), worth doing if a more complex modal is added later.
- Screen-reader typing experience is fundamentally limited (industry-wide issue with this app category, not a small patch).
- Unicode edge case: character comparison indexes by UTF-16 code unit, not grapheme cluster — emoji in custom text render oddly but don't crash anything. Low priority.
- **No SEO beyond the technical baseline** — see the SEO section below, which is now the top priority.

## Architecture notes (read before modifying the engine)

- **Engine state** (`use-typing-engine.ts`) is a `useReducer`, not zustand — mutates every keystroke (high-frequency, subtree-local). Zustand (`settings-store.ts`) holds durable, low-frequency, cross-cutting state. Don't swap these.
- **Keystroke capture** is a real, focused, offscreen `<input>` (`hidden-input.tsx`), not raw `keydown` — needed for IME composition and mobile keyboards. Space/Tab/Escape intercepted in `onKeyDown`; paste blocked entirely.
- **`correctKeystrokes`/`incorrectKeystrokes` are monotonic** — never decremented by backspace — and are the **only** source for accuracy/WPM/raw-WPM *and* the results breakdown's correct/incorrect. Don't reintroduce a second, final-state-derived tally for these two; that's the exact bug that was just fixed.
- **`charTally`** only tracks `extra`/`missed` (final-state concepts with no keystroke-history equivalent). `missed` excludes trailing punctuation — see `countPenalizedMissed`.
- **One engine, all four modes** — time/words/quote/custom share the same reducer and rendering path.
- **Word/quote data is fully static** (`english-1k.ts` — actually ~360 words; `english-quotes.ts` — ~26 public-domain quotes). Adding a language = new data file + config extension, not an engine rewrite.
- **Shared option constants live in `engine-types.ts`** (`TIME_DURATIONS`, `WORD_COUNTS`, `QUOTE_LENGTHS`) and `word-generator.ts` (`PUNCTUATION_MARKS`) — don't redefine these elsewhere.
- **Persisted data is never trusted blindly** — `settings-store.ts`'s `merge` validates every field on rehydration; `results-store.ts`'s `getPersonalBest` validates the parsed shape. Add new persisted fields to the corresponding validator.
- **Theming**: 5 themes as CSS var blocks in `globals.css`, registered in `THEMES` in `themes.ts`. `--correct` is the bright foreground color in every theme, not green (explicit design request, matches MonkeyType's convention). Global `transition` on `*` makes theme switches fade smoothly, **except** `.char-instant` (per-character spans in `word-stream.tsx`), which must stay instant.
- **Use `transition`, not `transition-opacity`, for elements that crossfade AND need the global theme transition.** Tailwind's `transition-opacity` utility sets `transition-property: opacity` on that element specifically, which — because a class selector beats the bare `*` universal selector — overrides (doesn't merge with) the global `transition: background-color, border-color, color` rule from `globals.css`. Any element that both fades in/out (opacity) and has its own background/border/text color (e.g. a hover state) needs the general `transition` utility, which covers both. Cost nothing to get right; easy to get subtly wrong.
- **The config bar and live-stats bar never unmount** — crossfaded via opacity inside one fixed-size slot. Don't go back to conditional mounting; that's what caused the layout-shift bug.
- **`SUPPORT_EMAIL`/`SITE_URL` in `src/lib/seo/constants.ts` are placeholders** (`hello@thundertyping.com`, `https://thundertyping.com`) — not real yet. Referenced from `/privacy`, `/terms`, and all metadata.

---

## SEO — top priority, needs to be genuinely world-class

Pre-launch, zero traffic, zero backlinks, zero domain authority. "World-class SEO" for a site in this position doesn't mean "rank for 'typing test' on day one" — it means the *foundation* (technical correctness, content depth, site architecture) is built so well that once the domain has any authority at all, nothing structural is holding it back, and early long-tail/informational traffic compounds into topical authority instead of getting capped by thin-content or technical mistakes. Everything below is organized as an honest checklist: what's actually done, what's missing, and in what order to build it.

### Technical SEO — current state (audited directly against the live code, 2026-09-14)

**In place:**
- Per-route `Metadata` API usage with a title template (`%s | ThunderTyping`), description, canonical (`alternates.canonical` on `/`, `/about`, `/privacy`, `/terms`), Open Graph + Twitter card defaults in the root layout.
- `sitemap.ts` and `robots.ts` via Next.js file conventions, sitemap linked from robots.
- One JSON-LD `WebApplication` schema on the homepage.
- Dynamically generated OG image (`opengraph-image.tsx`) — no static asset to go stale.
- SSR'd shell (h1, intro paragraph, JSON-LD) around a client-only interactive island — crawlers see real content without executing JS, Core Web Vitals aren't dragged down by the typing engine's client bundle blocking the initial paint.
- Self-hosted fonts via `next/font` (no external font request, no render-blocking `@font-face`).
- Semantic heading hierarchy on content pages (`ContentPage` component: one h1, h2 subsections).
- Custom themed 404 with `robots: { index: false }`.
- No client-side data fetching on any page — word/quote lists are static imports, so there's nothing for Core Web Vitals to wait on.

**Missing or wrong — fix before/at launch, roughly in priority order:**
1. **`sitemap.ts`'s `lastModified` is `new Date()` evaluated at request time** — every crawl sees "modified right now," which is meaningless/inaccurate (it should reflect real content change dates, or at minimum be static per-deploy). Low effort, real correctness issue.
2. **No Search Console verification mechanism wired up.** Add a `metadata.verification.google` field (or a DNS TXT record once the domain exists) so ownership can actually be claimed — this blocks literally every other measurement/indexing action, so it's the first thing to do once a domain exists.
3. **No `Organization`/`WebSite` JSON-LD with a `SearchAction`** — this is what makes a site eligible for a sitelinks search box and helps Google understand brand identity separately from the tool itself. Cheap to add, currently missing entirely.
4. **Only one schema type in use.** Worth adding once content exists: `BreadcrumbList` for any nested content (guides), `HowTo` or `Article` for guide pages (see content plan below), and consider `FAQPage` for a genuine FAQ section on `/about` — but do not add FAQ schema just to game rich results; only if there's a real FAQ block that helps users first.
5. **`robots.ts` doesn't address AI/LLM crawlers** (GPTBot, Google-Extended, CCBot, ClaudeBot, etc.) one way or the other. This is a genuine, live 2025-2026 policy question with no universally "correct" answer — it's a judgment call about whether AI-training crawler traffic is wanted, and it's the human's call, not a default to silently pick. Flagging it as an open decision, not a bug.
6. **No analytics wired up at all** — not Google Analytics, not Search Console, not anything privacy-respecting like Plausible/Fathom. Currently honest (the Privacy Policy correctly says "no analytics"), but this means there's no way to measure any of the SEO work below once the site is live. Needs a decision (which tool, and whether to update the Privacy Policy accordingly) before or right at launch.
7. **No `manifest.json` (PWA web app manifest).** Not strictly SEO, but low-effort, and gives "add to home screen" on mobile plus a small legitimacy/completeness signal. Worth doing in the same pass as the favicon (already flagged in the backlog).

### Content architecture — building real topical authority without thin content

The earlier competitive research (Monkeytype, 10FastFingers, TypingClub, NitroType/TypeRacer, Keybr, Ratatype) already established the strategic position: **don't chase head terms pre-launch** ("typing test", "wpm test" are dominated by huge incumbents); **the real wedge is Monkeytype-grade UX + genuinely good mobile support + light beginner guidance + real accessibility**, wrapped in a legitimate content layer that Monkeytype (donation-funded, no SEO incentive) doesn't bother building. And critically: **Google's "scaled content abuse" policy explicitly names templated typing-test-style page patterns as a common abuse example in this exact niche** — any page set built by swapping one keyword across an otherwise-identical template is a real risk to the whole domain's trust, not just that page's ranking.

Given that, here is a concrete, sequenced page plan. Every page listed is something a real user would want to read on its own, not an SEO wrapper — that's the actual guardrail against the scaled-content-abuse trap, not page count or URL pattern.

**Information architecture decision**: use `/guides/<slug>` as a flat namespace (not `/blog/<slug>`). "Guides" reads as evergreen reference material matching how-to search intent; a blog implies a chronological diary, which undersells genuinely durable content and invites unnecessary date-based staleness signals. Each guide should link back to the relevant test mode/config on the homepage (e.g., a "how to improve typing speed" guide links to starting a 1-minute test), and the homepage should link out to 2-3 guides in-content (not just via footer nav) once they exist — internal links are free authority transfer and currently completely unused beyond header/footer chrome.

**Tier 1 — build first (each one is genuinely useful standalone, no thin-content risk, moderate-to-low competition):**
1. `/guides/how-to-improve-typing-speed` — the single highest-value informational page in this space. Real technique content (finger placement, accuracy-before-speed, deliberate practice), not filler.
2. `/guides/average-typing-speed` (or `/guides/good-wpm-by-job`) — benchmark table by context (casual/office/programmer/transcriptionist/competitive), sourced honestly, not fabricated precision.
3. `/guides/touch-typing-basics` — home-row fundamentals for genuine beginners, a real gap since the tool itself assumes you already know how to type.
4. `/guides/wpm-vs-cpm` — a clean comparison/definitional page; easy to make substantive, decent recurring search interest, and a natural internal-link target from anywhere WPM is mentioned.
5. `/guides/typing-accuracy-vs-speed` — "should I slow down to be more accurate" — genuinely useful, and a natural place to explain this site's own consistency/accuracy metrics in depth (ties content back to product).

**Tier 2 — after Tier 1 is live and indexed:**
6. At most **one, maybe two** duration-specific landing pages (e.g. `/typing-test/1-minute`) — only if each has real, distinct copy about *why* that duration matters (quick check-in vs. exam-stamina simulation), not a template with the number swapped. This is exactly the pattern flagged as risky — treat it as an exception that earns its place, not a series to churn out.
7. A shareable/downloadable results certificate (feature + its own landing page) — Ratatype's certificate feature is a proven pattern for résumé/job-application use cases, and it's a natural link-worthy, shareable artifact.

**Tier 3 — later, larger investments:**
8. Job/exam-context long-tail content (e.g. government-exam typing test prep) — recurring, well-defined demand, especially India-specific (SSC/government exam typing tests) — but needs genuine localized depth, not a title swap, and realistically pairs well with non-English (Hindi) language support rather than English-only content targeting a non-English-primary audience.
9. Non-English language support generally — flagged repeatedly as a strong future opportunity (large, recurring, well-defined demand), explicitly out of scope for the current English MVP.

### Internal linking

Currently the only internal links are header nav (Typing/About) and footer nav (About/Privacy/Terms) — a shallow, purely-navigational link graph with zero contextual/in-content linking. Once Tier 1 guides exist: link from the homepage intro copy to 1-2 guides, link between related guides (e.g. "how to improve typing speed" ↔ "touch typing basics" ↔ "wpm vs cpm"), and link from every guide back to a relevant test configuration on the homepage (deep-linkable via query params or anchors if that's ever added — currently the homepage doesn't support pre-selecting a mode via URL, which would be a small, useful addition to make guide→tool internal links more specific than just linking to `/`).

### Core Web Vitals / INP

The entire product *is* keypress-to-render latency — this is unusually high-stakes here, not a generic checklist item. Current state is good (per-character rendering deliberately bypasses the app's global CSS transition via `.char-instant`, no client data fetching, self-hosted fonts, static word/quote data) but has never been measured with real tooling (Lighthouse, PageSpeed Insights, or Chrome UX Report data) since there's no deployed URL yet. Once deployed: run Lighthouse/PSI immediately and treat any INP regression as a priority-one bug, not backlog — and specifically watch this once real AdSense scripts are added later, since third-party ad scripts are a common, well-documented source of INP/main-thread-blocking regressions and this codebase has zero experience yet with how the ad loader behaves under load.

### Launch-day technical SEO checklist (do these in order once a real domain exists)

1. Register domain, update `NEXT_PUBLIC_SITE_URL`/`SUPPORT_EMAIL` (already flagged in Product backlog).
2. Deploy, then immediately verify the site in Google Search Console (see gap #2 above) and Bing Webmaster Tools (still worth the ~10 minutes of setup even though its traffic share is much smaller than Google's).
3. Submit the sitemap in both.
4. Set up whichever analytics tool is chosen (gap #6) and update the Privacy Policy to match honestly, same day.
5. Run Lighthouse/PageSpeed Insights on the live URL, fix anything red before doing further content work.
6. Do **not** expect meaningful organic movement quickly — a brand-new domain with zero backlinks realistically takes weeks to months to get fully indexed and see any real ranking movement, even with perfect technical SEO. Set that expectation explicitly with the human rather than implying otherwise; the value of doing technical SEO well *now* is that it removes friction later, not that it produces fast results.

### Guardrails (don't repeat these mistakes)

- Never build a batch of templated pages differing only by a keyword substitution (duration, city, job title, language) without genuinely distinct content per page — this is the single most-flagged risk in this niche specifically.
- Don't add structured data purely for rich-result gaming (e.g., FAQPage schema wrapping non-obvious "FAQs" invented just to get schema) — only mark up content that would exist anyway because it's useful.
- Don't treat page count as a proxy for progress. Five genuinely good guide pages beat fifty thin ones, both for users and for how Google's site-wide quality evaluation treats the whole domain.

---

## Prioritized backlog (non-SEO)

### Product / Architecture (unblocks SEO launch checklist above)
1. Register a real domain, update `NEXT_PUBLIC_SITE_URL` and `SUPPORT_EMAIL` in `src/lib/seo/constants.ts`.
2. Add a custom favicon + `manifest.json`.
3. Set up a real, monitored support inbox.
4. Decide on an analytics tool (see SEO gap #6) — this is a product/privacy decision, not purely technical.

### Frontend / UX
1. Settings modal (sound toggle, additional themes) — low priority until there's a stub sound system worth surfacing.
2. Focus-trap the custom-text modal if it grows more complex.
3. Custom `:focus-visible` ring styled to match the accent color (native default works, just isn't bespoke).
4. Real mobile-device check (physical phone/tablet, not just a resized desktop viewport).

### QA / Performance / Security
1. No automated tests yet — the engine's reducer/pure functions are good unit-test candidates if/when a framework is chosen (don't add one speculatively).
2. Lint and build are the only current automated gates, both clean.
3. No security concerns identified; custom text capped at 2000 chars bounds worst-case rendering cost.
4. `AnimatePresence` exit-unmount behavior couldn't be fully verified in this session's automation environment — quick real-browser spot-check worth doing.

### Growth / Retention / Monetization
- Deferred by design: accounts, leaderboards, multiplayer, typing games, achievements/streaks. Don't build until there's real usage data or an explicit ask.
- AdSense requires the human to create/verify the account — `AdSlot` is ready for a real client ID whenever that happens.

## Operating model notes (for whichever agent picks this up)

This project was set up under an ambitious "operate as an autonomous 5-lens product organization" instruction, later a "keep going through review/polish phases" directive, most recently a "make SEO world-class" directive. Honesty notes carried forward:

- **There is no standing, always-on scheduler** unless one has actually been configured via this platform's scheduled-task tooling — check before claiming a cycle is scheduled. One *is* configured for this project (`thundertyping-work-cycle`, every 6 hours) and it has now fired at least once **while an interactive session was simultaneously active** on the same working tree: it read in-progress uncommitted files, did its own verification pass, and added one line to this file without committing anything. That specific instance didn't cause a conflict, but it's a real scenario worth being deliberate about — if you're a scheduled-cycle session and `git status`/`git diff` show substantial uncommitted work already in progress, that's a signal a human or another session may be actively mid-task; verify and document conservatively rather than committing over it.
- **A local dev process cannot run while the machine is off or the harness isn't open.**
- Treat "built" / "verified" / "recommended" / "blocked on human" as distinct claims. The SEO section above tries to model this explicitly: "in place" items were read directly from the live code, "missing" items are real gaps, and the launch checklist is honest that organic results take time.
- A research sub-agent spawned this session to deepen the SEO section (current 2026 structured-data/AI-crawler/Search-Console specifics) hit a session limit and didn't complete. The SEO section above is therefore this agent's own direct code audit plus the earlier session's competitive/keyword research — solid, but a future session with research capacity available could still usefully re-run a deeper technical-SEO-specifics pass (the exact prompt used is a good starting point, focused on: current Google structured-data rich-result eligibility by schema type, current AI-crawler robots.txt norms, and Next.js-App-Router-specific Search Console verification steps).
- Prefer fixing a small number of real, high-value things well over generating volume to look productive. This session found and fixed real, user-reported bugs (contradictory accuracy stats, punctuation-skip penalty, WPM spike, layout shift) by reproducing them precisely before touching code, not by guessing — keep doing that.

## How to resume work

1. Read this file, especially the SEO section if the task is SEO-related.
2. `cd` into this directory, run `npm run lint && npm run build` to confirm nothing regressed.
3. Check `git log` for what's actually landed vs. what this file claims — trust git + the running app over stale prose if they disagree, and fix the drift here when noticed.
4. Pick the next item based on what's actually being asked right now — this file is context, not a queue to blindly execute without checking in.
