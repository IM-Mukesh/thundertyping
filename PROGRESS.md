# ThunderTyping — Project State & Roadmap

**Read this file first, completely, before touching any code.** It exists so *any* AI coding assistant — Claude, GPT-based, Astra, Gemini, a local model, whatever picks this up next — or any human developer can start from zero context and be productive immediately, without re-asking the project owner questions that are already answered here. Nothing in this file assumes you're using a specific tool; where a note is specific to one environment, it's labeled as such near the end, not mixed into the main instructions.

**Keep it updated.** If you finish work, update the relevant section(s) before ending your session — "Current status," "Known issues," and the backlog especially. If you find this file describes something that no longer matches the code, trust the code and fix the file; don't trust the file over reality.

## Quick start (works regardless of which AI tool or editor you are)

```bash
cd path/to/thundertyping
npm install       # only needed if node_modules isn't already present
npm run dev        # starts Next.js on http://localhost:3000 by default
npm run lint        # must be clean before you consider anything "done"
npm run build       # must be clean before you consider anything "done"
```

Open whatever URL `npm run dev` prints (usually `http://localhost:3000`; it'll pick a different port automatically if that one's busy). No environment variables, no database, no API keys are required to run this locally — it's a fully static-data, `localStorage`-only frontend right now. There is no test suite yet (see QA backlog below), so "lint + build both clean" is the current bar, plus manual verification in a real browser for anything UI-observable.

## What this project is

A typing-speed-test website (MonkeyType-style) aiming for large organic Google traffic, monetized via Google AdSense. Long-term ambition: "world's best typing platform," but development proceeds in deliberate phases — **do not jump ahead to multiplayer/accounts/backend/games until explicitly prioritized below.**

- **Brand name**: ThunderTyping
- **Current phase**: Frontend-only MVP, feature-complete and hardened. No backend, no accounts, no database. Everything persists to `localStorage`. Not yet launched (no real domain, no AdSense account, no Search Console).
- **Language**: English only (architecture supports adding more later, see `src/data/words/` and `src/data/quotes/`).
- **Design**: Minimalist, MonkeyType-inspired — the typing area is the visual star, chrome stays out of the way. Five built-in themes (Dark default, Light, Midnight, Forest, Sunset) via a theme picker in the header, all color changes transition smoothly except per-character typing feedback (deliberately instant — see Architecture).

## Tech stack & conventions

- Next.js 16 (App Router, Turbopack), React 19, TypeScript (strict), Tailwind CSS v4 (theming via CSS variables in `globals.css`, **no `tailwind.config.ts`** — Tailwind v4 doesn't need one here).
- Exact current dependency versions are in `package.json` — don't assume, check it. As of this writing: `next@16.3.5`, `react@19.2.8`, `zustand@^5`, `motion@^13`, `lucide-react@^1.45`, `clsx@^2`.
- `zustand` (+ `persist` middleware) for durable, low-frequency state (user settings). `useReducer` for the high-frequency typing engine state (not zustand — see Architecture).
- `motion` (formerly Framer Motion) for animation — imported from `motion/react`, **not** the bare `motion` package root (that resolves to the vanilla-JS DOM API, not React components/`layoutId`).
- `lucide-react` for icons, `clsx` (wrapped as `cn()` in `src/lib/utils/cn.ts`) for conditional classnames.
- `src/` directory, `@/*` path alias to `./src/*`.
- Conventions were originally mirrored from a sibling project at `../Git-Review` (Next.js 16.3.4, same Tailwind v4 pattern) for consistency, though the two projects are unrelated products — that sibling project is not otherwise relevant to this one.
- Git repo is initialized at the project root. Commit as you go — meaningful, scoped commits, not one giant dump. Check `git log` and `git status` at the *start* of every session, not just when something looks wrong — see "Multiple sessions/tools may share this codebase" below.
- **Running the dev server**: `npm run dev` in this directory is all you need, from any tool. *(Aside, only relevant if you happen to be Claude Code specifically: that tool's own `preview_start` helper reads a `launch.json` from whatever it considers the "primary" working directory, which in past sessions has been a sibling folder, not this one — if that helper doesn't find a config, just fall back to running `npm run dev` directly in this directory via its terminal/bash tool instead of fighting the helper.)* If a dev server appears to already be running on some port, you don't need to start a second one — check `ss -ltnp` / `lsof -i` / your OS equivalent, or just try loading the port.
- **If a running dev server's error overlay disagrees with a fresh `npm run build`, trust the build.** Turbopack's dev server in this environment has repeatedly served stale compile errors after a file edit (imports/exports that are correct on disk but reported as broken). Fix: stop the dev process, `rm -rf .next`, start it again. Don't "fix" code that a clean build already proves is fine.

## Current status (as of 2026-09-14)

### Done and verified working
Manually tested in a real browser (typed real words, confirmed char-by-char coloring, word advancement, caret positioning, timer countdown, auto-finish, personal-best recording, restart, mobile viewport layout, malformed-localStorage recovery, paste blocking, zero layout shift on test start, theme switching, punctuation-skip handling) — every bullet below was actually exercised, not just written and assumed correct.

- Project scaffold, 5-theme system (`data-theme` attribute + CSS vars, picker in `theme-switcher.tsx`), header/footer, ad-slot placeholders (footer + post-results, not near the typing area).
- Full typing engine (`src/lib/typing-engine/`): time mode (15/30/60/120s presets **plus a free-form custom duration**, infinite word regeneration), words mode (10/25/50/100), quote mode (curated public-domain quotes, short/medium/long), custom text mode (capped at 2000 chars), punctuation/numbers injection toggles.
- Per-character correct/incorrect/extra/pending rendering, animated caret (via `motion` `layoutId` shared-element transition), smooth 3-line word-window scrolling that re-measures after web fonts finish loading.
- Live stats while running (countdown or word progress + live WPM, stabilized against early-test noise), results screen (net WPM, raw WPM, accuracy, consistency, char breakdown, personal-best badge) — **accuracy and the correct/incorrect breakdown are mathematically guaranteed to agree** (see Known issues fixed).
- **Results graph** (`results-graph.tsx`): plots net WPM and raw WPM as two lines over time on a single y-axis — deliberately **not** MonkeyType's dual-axis (WPM + errors on a second scale) layout, which is a well-known charting anti-pattern; error-count-over-time was scoped out rather than bolted on as a second axis. Has a legend (line-key + label, not color-only), recessive gridlines, end-dot markers, and a hover crosshair + tooltip reading the nearest sample. Colors reuse existing theme tokens (`--accent`, `--sub`), so it adapts across all 5 themes automatically. Verified two ways: a clean-typing test showed the two lines exactly overlapping (correct — raw and net WPM are identical at 100% accuracy), and a test with one deliberate uncorrected mistake showed them genuinely diverge (raw consistently above net, as it must be).
- **Restart icon**: a small always-present circular button below the word-stream (idle/running only — the results screen has its own explicit "Restart" button). Follows the "always mounted, opacity-only crossfade" pattern — no layout shift.
- **Header logo resets the test** when clicked while already on `/` (a plain `<Link>` is a no-op in that case since there's no navigation) — via a tiny pub-sub, `reset-bus.ts`.
- **Language selector**: a real (not decorative) popover showing "English" as the sole, checked option — same interaction pattern as the theme picker. Functionally honest (opens a real menu) rather than a fake button, so adding a second language later is one more row, not a rebuild.
- **Typography**: monospace font is JetBrains Mono (switched from Geist Mono site-wide). Word-stream size is currently `text-2xl sm:text-3xl`, `LINE_HEIGHT` re-measured to 38px to match — see the sizing/line-height cautionary notes below before changing this again.
- **Custom time duration**: time-mode presets (15/30/60/120s) sit next to a real numeric input (clamped **1s–36000s / 10 hours**), Enter/blur to apply, renders as its own active pill (e.g. "45s") until clicked again to re-edit.
- **Default (Dark) theme now matches MonkeyType's Serika Dark palette** (`#323437` background, `#d1d0c5` foreground, `#646669` sub, `#e2b714` accent) — the other 4 themes are unchanged/independent of this.
- **Typing area widened** to `max-w-6xl` (was `max-w-4xl`), matching MonkeyType's proportions more closely.
- **Page intro (h1/subtitle) and the config-bar/language-selector hide once a test finishes** — the results screen shows only the results, not leftover chrome. The h1/subtitle hide via a small transient store (`test-status-store.ts`) read by a client component (`page-intro.tsx`) that's still SSR'd for SEO (no random content, so no hydration-mismatch risk — see Architecture notes).
- **Live stats bar** (countdown/word-progress + live WPM) renders at roughly double its previous size with a flip-clock/split-flap digit animation on each value change (`live-stats-bar.tsx`).
- Skipping punctuation via space (not typing the trailing comma/period/etc.) is never penalized as "missed" — only genuinely skipped letters count. **This is current, deliberate, explicitly-requested behavior — see "Awaiting human input" below before changing it.**
- Personal bests persisted per mode+config in `localStorage` (time/words modes only), with type-validated rehydration so corrupted storage can't inject garbage into the UI.
- Settings persisted via zustand with full validation on rehydration — every field falls back to a safe default if the stored value is out of range, wrong type, or (for `mode`) `"custom"` with no text behind it.
- Paste is blocked in the typing input; keystroke counting loops over every newly-inserted character rather than assuming exactly one.
- Supporting pages: `/about`, `/privacy`, `/terms`, a themed custom `/not-found` (404), a root `error.tsx` boundary, and a dynamically generated OG image (`app/opengraph-image.tsx`).
- Mobile layout (375×812) verified with no horizontal overflow. Hidden input has `font-size: 16px` to prevent iOS auto-zoom.
- Custom-text modal has proper dialog semantics, closes on Escape or backdrop click, live character counter, returns focus on close.
- Mode-selection and toggle pills expose `aria-pressed`.
- `npm run build` and `npm run lint` both pass clean as of the latest commit.

### Known issues fixed (context for why the code looks the way it does — read before "fixing" these back)
- **Results screen's accuracy % and its "correct/incorrect" breakdown could contradict each other.** Reproduced precisely: custom text "cat" typed with one backspaced-out mistake showed "3 correct, 0 incorrect" but 75% accuracy — impossible for both to be right. Root cause: the breakdown was tallied from each word's *final* character state, while accuracy came from full keystroke history (including corrected mistakes). Fixed by removing correct/incorrect from `CharTally` entirely; the breakdown now reads `correctKeystrokes`/`incorrectKeystrokes` directly — the same numbers accuracy is computed from — so they can never disagree again.
- **Skipping punctuation via space was counted as a "missed" mistake.** If you type "hello" and space past a "hello," word without typing the comma, that's not an error. Fixed in `tallyWord`/`countPenalizedMissed` (`use-typing-engine.ts`): trailing untyped characters only count as "missed" if they aren't punctuation. Real skipped *letters* still count as missed — only punctuation is exempt. **A follow-up question about this is open — see "Awaiting human input."**
- **Live WPM could spike to absurd values (e.g. "12000 wpm") in the first instant of a test.** `netWpm = correctChars / 5 / minutesElapsed` is unstable when elapsed time is a few milliseconds. Fixed by flooring the denominator at 1000ms for live display and skipping consistency-score sampling entirely during that window. Final results always use true elapsed time.
- **UI jumped/glitched the instant typing started.** The config bar was conditionally unmounted, so its layout space collapsed instantly when it exited, snapping the word-stream upward. Fixed by keeping the config bar permanently mounted and crossfading it with the live-stats bar inside one fixed-height slot.
- **A "N lines rendered inside a 3-line box" bug**, caused by `LINE_HEIGHT` (`word-stream.tsx`) being left stale after a font/size change — this has now happened **twice** (48→32 after a font-family change, then 32→38 after a later font-size bump), confirming it's a real recurring trap, not a one-off. Fixed each time by *measuring* real consecutive wrapped-line `offsetTop` deltas in a live browser rather than assuming a prior value or recalculating on paper. **If you change the word-stream font or size, re-measure this the same way — don't guess, and don't assume the last measured value still holds.**
- **`AnimatePresence` (from `motion`) didn't reliably unmount an exited single-child-by-key element when the key changed rapidly.** Found in the live-stats bar's flip-digit animation (`live-stats-bar.tsx`): each digit's old value was supposed to animate out and then be removed, but under fast successive changes (the countdown/live-WPM tick), old values kept completing their exit animation and then just sitting in the DOM forever (`opacity:0`, fully rotated, never actually removed) — confirmed via direct DOM inspection showing 9+ stacked ghost elements per digit after a burst of typing. Fixed by not using `AnimatePresence` for this case: `FlipChar` now manages its own single `prevChar` state slot and force-clears it with an explicit `setTimeout` matched to the transition duration, which structurally caps it at 2 DOM nodes per digit no matter how fast values change. **If you use `AnimatePresence` for anything that can re-key faster than its transition duration, don't trust it to clean up — verify by inspecting the live DOM node count, not just by watching the animation look right.** (`PageIntro`'s single, rarely-toggled exit has the same non-removal symptom — confirmed via computed style showing a stuck `opacity:0;height:0px` node — but since it only toggles once per test and lands at zero-size/invisible, it's cosmetically harmless and wasn't worth the same fix.)
- **Hydration mismatch**: the engine's initial word list uses `Math.random()`, which would differ between server and client render. Fixed via `next/dynamic(..., { ssr: false })` for the interactive island; the SSR'd shell (h1, intro, JSON-LD) around it stays server-rendered for SEO.
- **Double word-regeneration on mount**: React Strict Mode's dev-only double effect invocation defeated a naive "skip first run" ref guard. Fixed by comparing the memoized config object by reference instead of a boolean flag.
- **Custom mode + reload = stuck blank test**: `mode` persists via zustand but `customText` deliberately doesn't. Fixed: a persisted `"custom"` mode is treated as absent on rehydration and falls back to the default.
- **A CSS specificity gotcha**: Tailwind's `transition-opacity` utility sets `transition-property: opacity` on an element, which — because a class selector beats the bare `*` universal selector — *overrides*, rather than merges with, this project's global `transition: background-color, border-color, color` rule. Any element that both fades in/out AND has its own hover color needs the general `transition` utility, not `transition-opacity`, or its hover transition silently breaks.

### Awaiting human input (asked, not yet actioned — don't guess on these)
- Whether skipping a word's trailing punctuation should count as a real mistake or not is **currently "not a mistake"** by explicit prior request (see above) — but the same person later asked, separately, whether they actually want the opposite. **Do not change `countPenalizedMissed`/accuracy semantics around this until that's explicitly resolved** — flipping it back would undo a fix that was itself an explicit request.
- What "make the language selector better" means concretely (visual polish vs. more functionality) is unscoped.
- A "make it look like the best site in the world" animation request came in but is too open-ended to implement blind — a prioritized short list of *which* interactions to focus an animation pass on (results reveal, stat count-up, tab/pill transitions, hover states, page transitions, etc.) was requested but not yet given.

### Not built yet (by design, not oversight)
- No settings modal (Escape currently just blurs the input); no sound effects (`soundEnabled` exists in settings but nothing plays).
- No custom favicon (still Next.js default); no `manifest.json`. OG image *is* handled.
- No real AdSense integration — `AdSlot` renders placeholders until `NEXT_PUBLIC_ADSENSE_CLIENT_ID` is set; creating/approving the account requires the human, not an AI agent.
- No focus-trap in the custom-text modal — low risk (one textarea, two buttons), worth doing if a more complex modal is added later.
- Screen-reader typing experience is fundamentally limited (industry-wide issue with this app category — a real, visually-hidden `<input>` drives a custom visual rendering, so there's no real-time spoken feedback while typing — not something a small patch fixes).
- Unicode edge case: character comparison indexes by UTF-16 code unit, not grapheme cluster — emoji in custom text render oddly but don't crash anything. Low priority.
- **No SEO beyond the technical baseline** — see the SEO section below, which is a current top priority.

## Architecture notes (read before modifying the typing engine)

- **Engine state** (`use-typing-engine.ts`) is a `useReducer`, not zustand — mutates every keystroke (high-frequency, subtree-local). Zustand (`settings-store.ts`) holds durable, low-frequency, cross-cutting state. Don't swap these.
- **Keystroke capture** is a real, focused, offscreen `<input>` (`hidden-input.tsx`), not raw `keydown` — needed for IME composition and mobile keyboards. Space/Tab/Escape intercepted in `onKeyDown`; paste blocked entirely.
- **`correctKeystrokes`/`incorrectKeystrokes` are monotonic** — never decremented by backspace — and are the **only** source for accuracy/WPM/raw-WPM *and* the results breakdown's correct/incorrect. Don't reintroduce a second, final-state-derived tally for these two; that's the exact bug that was fixed once already (see above).
- **`charTally`** only tracks `extra`/`missed` (final-state concepts with no keystroke-history equivalent). `missed` excludes trailing punctuation — see `countPenalizedMissed`.
- **One engine, all four modes** — time/words/quote/custom share the same reducer and rendering path.
- **Word/quote data is fully static** (`english-1k.ts` — actually ~360 words, not literally 1000; `english-quotes.ts` — ~26 public-domain quotes). Adding a language = new data file + config extension, not an engine rewrite.
- **Shared option constants live in `engine-types.ts`** (`TIME_DURATIONS`, `WORD_COUNTS`, `QUOTE_LENGTHS`, `MIN`/`MAX_CUSTOM_TIME_DURATION`) and `word-generator.ts` (`PUNCTUATION_MARKS`) — don't redefine these elsewhere. `TimeDuration` is `number` (not a literal union) precisely so a user-entered custom value has somewhere to live; `settings-store.ts` range-checks it on rehydration rather than checking set membership.
- **Persisted data is never trusted blindly** — `settings-store.ts`'s `merge` validates every field on rehydration; `results-store.ts`'s `getPersonalBest` validates the parsed shape. Add new persisted fields to the corresponding validator.
- **Theming**: 5 themes as CSS var blocks in `globals.css`, registered in `THEMES` in `themes.ts`. `--correct` is the bright foreground color in every theme, not green (explicit design request, matches MonkeyType's convention — correctly-typed text becomes the "main" color, only mistakes get a distinct color). A global `transition` on `*` makes theme switches fade smoothly, **except** `.char-instant` (per-character spans in `word-stream.tsx`), which must stay instant — live typing feedback must never visually lag a keystroke.
- **The config bar and live-stats bar never unmount** — both always rendered, stacked in the same CSS grid cell (`grid-area: 1/1` on both, via Tailwind's `[grid-area:1/1]` arbitrary value) inside one grid container, crossfaded via opacity. Grid-stacking (rather than one normal-flow child plus one `absolute` child) matters because the two children are now very different sizes (compact pill row vs. large flip-digit display) — a grid cell auto-sizes to the tallest stacked child regardless of which one that is, so nothing clips. The same visibility technique drives the config-bar/language-selector row, now keyed off `status === "idle"` specifically (not just `!isRunning`) so both also hide on the results screen. Don't go back to conditional mounting or a relative-plus-one-absolute-child layout; both caused real bugs (see Known issues fixed).
- **Bridging state between the SSR'd page shell and the client-only typing island**: when a page-level sibling (not a descendant) needs to react to engine/test state — e.g. `PageIntro`'s h1/subtitle hiding once a test finishes — use a small non-persisted zustand store (see `test-status-store.ts`) rather than pulling that sibling inside the `ssr:false` boundary. A plain client component with no random/non-deterministic content still renders fine on the server (only `TypingTest` itself needs `ssr:false`, specifically because of its `Math.random()` word generation), so this keeps the content in the initial server HTML for SEO while still letting it react to client-side state after hydration.
- **`SUPPORT_EMAIL`/`SITE_URL` in `src/lib/seo/constants.ts` are placeholders** (`hello@thundertyping.com`, `https://thundertyping.com`) — not real yet. Referenced from `/privacy`, `/terms`, and all metadata. Update these together once a real domain/inbox exists.

---

## SEO — top priority, needs to be genuinely world-class

Pre-launch, zero traffic, zero backlinks, zero domain authority. "World-class SEO" for a site in this position doesn't mean "rank for 'typing test' on day one" — it means the *foundation* (technical correctness, content depth, site architecture) is built so well that once the domain has any authority at all, nothing structural is holding it back, and early long-tail/informational traffic compounds into topical authority instead of getting capped by thin-content or technical mistakes. Everything below is organized as an honest checklist: what's actually done, what's missing, and in what order to build it.

### Technical SEO — current state (audited directly against the live code)

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
1. **`sitemap.ts`'s `lastModified` is `new Date()` evaluated at request time** — every crawl sees "modified right now," which is meaningless/inaccurate. Low effort, real correctness issue.
2. **No Search Console verification mechanism wired up.** Add a `metadata.verification.google` field (or a DNS TXT record once the domain exists) — this blocks every other measurement/indexing action, so it's the first thing to do once a domain exists.
3. **No `Organization`/`WebSite` JSON-LD with a `SearchAction`** — eligibility for a sitelinks search box, and helps Google understand brand identity separately from the tool itself. Cheap, currently missing.
4. **Only one schema type in use.** Worth adding once content exists: `BreadcrumbList` for nested content (guides), `HowTo`/`Article` for guide pages, and `FAQPage` only for a *real* FAQ block that helps users first — never invent FAQs just for the schema.
5. **`robots.ts` doesn't address AI/LLM crawlers** (GPTBot, Google-Extended, CCBot, ClaudeBot, etc.) one way or the other. Genuine, live policy question with no universally "correct" answer — the human's call, not a default to silently pick.
6. **No analytics wired up at all.** Currently honest (the Privacy Policy correctly says "no analytics"), but there's no way to measure any SEO work once live. Needs a decision (which tool, and update the Privacy Policy to match) before/at launch.
7. **No `manifest.json`.** Low-effort, gives "add to home screen" plus a small completeness signal. Do it alongside the favicon.

### Content architecture — building real topical authority without thin content

Earlier competitive research (Monkeytype, 10FastFingers, TypingClub, NitroType/TypeRacer, Keybr, Ratatype) established the strategic position: **don't chase head terms pre-launch** ("typing test", "wpm test" are dominated by huge incumbents); **the real wedge is Monkeytype-grade UX + genuinely good mobile support + light beginner guidance + real accessibility**, wrapped in a legitimate content layer that Monkeytype (donation-funded, no SEO incentive) doesn't bother building. Critically: **Google's "scaled content abuse" policy explicitly names templated typing-test-style page patterns as a common abuse example in this exact niche** — a page set built by swapping one keyword across an otherwise-identical template is a real risk to the whole domain's trust.

**Information architecture decision**: use `/guides/<slug>` as a flat namespace (not `/blog/<slug>`) — reads as evergreen reference material matching how-to search intent. Each guide should link back to a relevant test mode on the homepage, and the homepage should link out to 2-3 guides in-content once they exist — internal links are currently completely unused beyond header/footer chrome.

**Tier 1 — build first (each one genuinely useful standalone, no thin-content risk):**
1. `/guides/how-to-improve-typing-speed` — real technique content (finger placement, accuracy-before-speed, deliberate practice), not filler.
2. `/guides/average-typing-speed` — benchmark table by context (casual/office/programmer/transcriptionist/competitive), sourced honestly.
3. `/guides/touch-typing-basics` — home-row fundamentals for genuine beginners; a real gap since the tool assumes you already know how to type.
4. `/guides/wpm-vs-cpm` — clean comparison/definitional page, natural internal-link target.
5. `/guides/typing-accuracy-vs-speed` — ties naturally back to this site's own consistency/accuracy metrics.

**Tier 2 — after Tier 1 is live and indexed:**
6. At most one or two duration-specific landing pages (e.g. `/typing-test/1-minute`) — only with real, distinct copy about *why* that duration matters, not a template with the number swapped.
7. A shareable/downloadable results certificate (feature + landing page) — proven pattern (see Ratatype) for résumé/job-application use.

**Tier 3 — later, larger investments:**
8. Job/exam-context long-tail content (e.g. government-exam typing test prep, especially India-specific) — needs genuine localized depth, pairs well with non-English support.
9. Non-English language support generally — strong future opportunity, explicitly out of scope for the current English MVP.

### Internal linking
Currently only header/footer nav — shallow, purely navigational. Once Tier 1 guides exist: link homepage intro copy to 1-2 guides, link related guides to each other, link every guide back to a relevant test configuration on the homepage.

### Core Web Vitals / INP
The entire product *is* keypress-to-render latency — unusually high-stakes here, not a generic checklist item. Current state is good in principle (per-character rendering bypasses the global CSS transition via `.char-instant`, no client data fetching, self-hosted fonts, static data) but has never been measured with real tooling since there's no deployed URL yet. Once deployed: run Lighthouse/PageSpeed Insights immediately, treat any INP regression as priority-one. Watch this especially once real AdSense scripts are added — third-party ad scripts are a well-documented source of INP regressions.

### Launch-day technical SEO checklist (in order, once a real domain exists)
1. Register domain, update `NEXT_PUBLIC_SITE_URL`/`SUPPORT_EMAIL`.
2. Deploy, verify in Google Search Console and Bing Webmaster Tools.
3. Submit the sitemap in both.
4. Set up the chosen analytics tool, update the Privacy Policy same day.
5. Run Lighthouse/PageSpeed Insights on the live URL, fix anything red before further content work.
6. **Do not expect fast organic movement** — a brand-new domain with zero backlinks realistically takes weeks to months to get fully indexed, even with perfect technical SEO. Set that expectation honestly; the value of doing technical SEO well now is removing friction later, not fast results.

### Guardrails (don't repeat these mistakes)
- Never build templated pages differing only by keyword substitution (duration, city, job, language) without genuinely distinct content per page.
- Don't add structured data purely for rich-result gaming — only mark up content that would exist anyway.
- Don't treat page count as progress. Five genuinely good guide pages beat fifty thin ones.

---

## Prioritized backlog (non-SEO)

### Product / Architecture (unblocks the SEO launch checklist above)
1. Register a real domain, update `NEXT_PUBLIC_SITE_URL` and `SUPPORT_EMAIL` in `src/lib/seo/constants.ts`.
2. Add a custom favicon + `manifest.json`.
3. Set up a real, monitored support inbox.
4. Decide on an analytics tool — a product/privacy decision, not purely technical.

### Frontend / UX
1. Settings modal (sound toggle, additional themes) — low priority until there's a stub sound system worth surfacing.
2. Focus-trap the custom-text modal if it grows more complex.
3. Custom `:focus-visible` ring styled to match the accent color (native default works, just isn't bespoke).
4. Real mobile-device check (physical phone/tablet, not just a resized desktop viewport).
5. Resolve the two open "Awaiting human input" items above before doing more animation/language-selector polish.

### QA / Performance / Security
1. No automated tests yet — the engine's reducer/pure functions are good unit-test candidates if/when a framework is chosen. Don't add one speculatively without that decision.
2. Lint and build are the only current automated gates, both clean.
3. No security concerns identified; custom text capped at 2000 chars bounds worst-case rendering cost.
4. `AnimatePresence` exit-unmount is now confirmed *unreliable* under rapid re-keying (see Known issues fixed) — the flip-digit case was fixed with manual lifecycle management instead. Other usages (`PageIntro`, `ResultsPanel`'s reveal, `CustomTextModal`) change far less frequently so the same failure mode is much less likely to matter, but haven't been stress-tested the same rigorous way (checking live DOM node counts, not just visual behavior) — worth doing if any of them are ever driven by fast-changing state.

### Growth / Retention / Monetization
- Deferred by design: accounts, leaderboards, multiplayer, typing games, achievements/streaks. Don't build until there's real usage data or an explicit ask.
- AdSense requires the human to create/verify the account — `AdSlot` is ready for a real client ID whenever that happens.

---

## Working across multiple AI sessions/tools on the same codebase

This project has genuinely been worked on by more than one AI session concurrently at times (observed firsthand: a scheduled autonomous cycle picked up and committed in-progress work while an interactive session was simultaneously testing the same code; separately, commit messages and this file have referenced feedback and decisions from conversations this particular session never saw). That's not hypothetical caution — plan for it:

- **Always `git log --oneline -10` and `git status` before assuming you know the current state.** This file is written carefully but *can* drift or be mid-update by someone/something else. Git is ground truth; this file is a guide.
- **If `git status` shows substantial uncommitted work you didn't create**, someone else (human or AI) may be actively mid-task. Don't commit over it; verify what it is first.
- **Trust direct, current, specific feedback from the human over any secondhand paraphrase in this file** — including paraphrases *in this file itself* of what a "previous session" claimed the human said. If you can get fresh confirmation, prefer it. A real example from this project's history: one session's commit message claimed "the human found the smaller text too small" and reverted a size change; the human's next actual message, with screenshots, said the *reverted* size was too large. The paraphrase wasn't reliable; the direct message was.
- **Claim only what you've actually verified.** Distinguish "built," "verified in a real browser," "recommended," and "blocked on the human" — don't blur them. If you can't test something in your environment, say so plainly rather than asserting it works.

## How to resume work

1. Read this file completely.
2. `cd` into this directory, run `npm run lint && npm run build` to confirm nothing's regressed.
3. Check `git log --oneline -10` and `git status` for what's actually landed vs. what this file claims.
4. Pick the next item based on what's actually being asked right now — this file is context for good decisions, not a queue to execute blindly without checking in with whoever you're working for.
5. When you're done, update this file's relevant section(s) — status, known issues, backlog — before ending your session, so the next session (whoever/whatever it is) doesn't start from behind.
