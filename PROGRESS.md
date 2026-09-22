# ThunderTyping — Project State & Roadmap

**Read this file first, completely, before touching any code.** It exists so *any* AI coding assistant — Claude, GPT-based, Astra, Gemini, a local model, whatever picks this up next — or any human developer can start from zero context and be productive immediately, without re-asking the project owner questions that are already answered here. Nothing in this file assumes you're using a specific tool; where a note is specific to one environment, it's labeled as such near the end, not mixed into the main instructions.

**Keep it updated.** If you finish work, update the relevant section(s) before ending your session — "Current status," "Known issues," and the backlog especially. If you find this file describes something that no longer matches the code, trust the code and fix the file; don't trust the file over reality.

## Quick start (works regardless of which AI tool or editor you are)

```bash
cd path/to/thundertyping
npm install       # only needed if node_modules isn't already present
npm run dev        # starts Next.js on http://localhost:3000 by default
npm test            # 80 unit tests (Node's built-in runner, no extra dependency)
npm run lint        # must be clean before you consider anything "done"
npm run build       # must be clean before you consider anything "done"
npx tsc --noEmit    # typecheck; the build does not fail on type errors alone
```

Open whatever URL `npm run dev` prints (usually `http://localhost:3000`; it'll pick a different port automatically if that one's busy). No environment variables, no database, no API keys are required to run this locally — it's a fully static-data, `localStorage`-only frontend right now.

**The bar for "done" is: `npm test`, `npm run lint`, `npx tsc --noEmit` and `npm run build` all clean, plus live verification in a real browser for anything UI-observable.** A test suite now exists (2026-09-17, expanded 2026-09-22, 80 cases) covering the scoring engine, the mobile input path, the game anti-exploit rules and the lesson curriculum's content generation/gating — it runs on Node 22's built-in `node:test` with `--experimental-strip-types`, so it needs **Node 22+** and adds no dependency. `scripts/test-setup.mjs` maps the `@/*` alias for it, since Node does not read `tsconfig` paths.

**Write a test for anything scoring-related.** Every scoring bug found so far was invisible through the UI — a dropped keystroke and a missed render look identical on screen. The tests drive the pure reducer directly for that reason.

## Right now (orientation for a cold start — the rest of this file has the detail)

As of **2026-09-22**: a feature-complete MVP, fully mobile-responsive, with **ten typing games** under `/games`, **a 28-unit, 3-tier touch-typing curriculum** under `/lessons`, two SEO guides, and an **80-test suite** guarding the scoring engine and the lesson curriculum. Not launched — no domain, no AdSense (wired but not activated), no Search Console yet.

**Session 2026-09-22 (two passes) built `/lessons`, then reshaped it into a typing.com-style dashboard.** First pass: 17 flat lessons, home row through a graduation passage. Second pass, same day, after the project owner saw typing.com directly: restructured into three tiers (Beginner/Intermediate/Advanced, 28 units total), each unit now runs several sub-lessons of escalating difficulty rather than one drill, progress moved to a proper zustand store (`useLessonProgressStore`), keystroke sound was wired in (reusing the games' existing synth audio, not a new system), and a persistent ad rail was added beside every active typing surface. Read "Lessons architecture" below before touching any of it — the sub-lesson generator and the progress store's averaging logic are the two places a change is most likely to silently break something.

**The 2026-09-17 session was an audit-and-repair pass, not a feature pass.** Four real defect classes were found and fixed; read "Session 2026-09-17" below before touching the typing engine, the games' scoring, the audio bus or the image pipeline, because several of those fixes look like things you might "simplify" back into bugs.

**What's genuinely open right now, roughly by leverage:**
1. **`NEXT_PUBLIC_SITE_URL` is unset**, so canonicals, `sitemap.xml` and `robots.txt` all emit `https://thundertyping.com`. Set it before deploying anywhere else, or search engines get pointed at a domain that may not be yours yet. This is the single highest-risk item for launch.
2. **AdSense is fully wired but not activated** — `NEXT_PUBLIC_ADSENSE_CLIENT_ID` unset. `layout.tsx` now loads the AdSense script conditionally, `AdSlot` placements exist on every route (including a new persistent side rail on `/`, `/lessons/[lessonId]` and every `ContentPage`-based route), and everything stays exactly as-is — no visible change anywhere — until a real client ID is set. Setting it is the only remaining step; no code changes needed.
3. SEO content roadmap: guides #1 and #2 of 5 planned Tier-1 guides are done; #3–5 (`touch-typing-basics`, `wpm-vs-cpm`, `typing-accuracy-vs-speed`) are scoped and ready to write — see "Content architecture" below. Note `touch-typing-basics` now substantially overlaps with `/lessons` itself; worth deciding whether it still needs to be a separate guide or should just link into the lesson track.
4. **Ten games shipped**: `falling-words`, `word-rain`, `word-blaster`, `typing-grand-prix`, `boss-battle`, `combo-rush`, `spellbound`, `typing-survivor`, `ghost-racer`, `card-battle`. Adding another means a new `GameId`, a `GAME_DEFINITIONS` entry and one line in the `game-client.tsx` registry. Read "Games architecture" below first. **Deliberately not given an ad rail** — that page already documents, in its own comment, why an ad beside an active game board is a distraction/mis-click risk; the new rail respects that and was only added to keyboard-only typing surfaces (home, lessons).
5. **28 lesson units shipped** across Beginner (17)/Intermediate (6)/Advanced (5). The finger-color palette (`globals.css`, `--finger-*` tokens) was checked live against Dark and Light; Midnight/Forest/Sunset were not individually screenshotted since the palette is theme-invariant by design — worth a quick visual pass on those three before calling it fully verified.
6. Two "Awaiting human input" questions are genuinely blocked on the project owner — don't guess, ask.
7. The live countdown still shows raw seconds for long custom durations (a 24h test reads `86400`) — see Frontend/UX backlog item 6.
8. Everything else is in "Prioritized backlog," roughly ordered within each category but not urgent.

**Corpus note, deliberately left alone:** the word generator samples uniformly from a 489-word frequency-ordered list (mean word length 4.45), while MonkeyType's default draws from the ~200 most common words. Ours therefore runs slightly harder and scores slightly lower on a typical run. That is a product decision, not a bug — narrowing the corpus would raise the displayed WPM without the typist improving, which was explicitly ruled out. Change it only on instruction.

## What this project is

A typing-speed-test website (MonkeyType-style) aiming for large organic Google traffic, monetized via Google AdSense. Long-term ambition: "world's best typing platform," but development proceeds in deliberate phases — **do not jump ahead to multiplayer/accounts/backend/games until explicitly prioritized below.**

- **Brand name**: ThunderTyping
- **Current phase**: Frontend-only MVP, feature-complete and hardened. No backend, no accounts, no database. Everything persists to `localStorage`. Not yet launched (no real domain, no AdSense account, no Search Console).
- **Language**: English only (architecture supports adding more later, see `src/data/words/` and `src/data/quotes/`). The games draw from the same word list, so a new language reaches them for free.
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
- **"Another `next dev` server is already running" is usually a STALE LOCK, not a running server.** Next writes `.next/dev/lock` (`{pid, port, ...}`) and refuses to start if it exists — **without checking whether that PID is still alive**. Any unclean kill (`pkill`, a crashed shell, a sandbox teardown) leaves the lock behind and then blocks every future `npm run dev` **in that directory, on every port**, which is why switching ports never helps. This exact stale lock burned two full sessions, who misread it as a "wedged Turbopack cache."
  **Diagnose first, don't guess**: take the PID from the error message and check `kill -0 <pid>` (plus `ss -ltnp | grep <port>`). If the process is dead, just `rm .next/dev/lock` and start normally. Only clear the whole cache (`rm -r .next/dev`) if you have separate evidence of stale *compilation*.
- **Tailwind v4's content detection is scoped by hand** in `globals.css` (`@import "tailwindcss" source(none)` plus explicit `@source` lines for `src/app`, `src/components`, `src/lib`). Automatic detection walks the project root, which holds agent-managed special files (`.mcp.json`, `.claude/`) that are unreadable to the build process and fail it outright with `Permission denied` — and gitignoring them is *not* enough to stop the scan. **If you add a new top-level source directory, add an `@source` line for it**, or its classes will silently go missing from the CSS.
- **If a running dev server's error overlay disagrees with a fresh `npm run build`, trust the build.** Turbopack's dev server here has served misleading overlay errors for code that no longer exists on disk. Restarting clears it. Don't "fix" code a clean build already proves is fine.
- **`requestAnimationFrame` never fires when the preview pane isn't displayed** (`document.hidden === true`; `setTimeout` still works normally). This is not an app bug, but it has a big consequence: **every `motion` / `AnimatePresence` animation is rAF-driven, so in that environment exit animations never start, never complete, and `AnimatePresence` therefore never unmounts its child** — the element just sits there at full size, which looks exactly like a broken state signal. Screenshots also fail with "the Browser pane is not displayed." When verifying anything animated, check `requestAnimationFrame` actually fires before concluding the feature is broken, and prefer asserting on a non-animated signal (a `data-` attribute, a CSS class) rather than on animated geometry.

## Current status (core through 2026-09-16; see "Session 2026-09-17" below for the latest pass)

### Done and verified working
Manually tested in a real browser (typed real words, confirmed char-by-char coloring, word advancement, caret positioning, timer countdown, auto-finish, personal-best recording, restart, mobile viewport layout, malformed-localStorage recovery, paste blocking, zero layout shift on test start, theme switching, punctuation-skip handling) — every bullet below was actually exercised, not just written and assumed correct.

**Verification backlog is now clear** (2026-09-15): the three items previously carried as "built but never seen rendering" — the chrome collapse, the flip-clock stats bar, and the `/guides` page — have all been live-verified against a clean dev server. Two of them turned out to be genuinely broken and were fixed (see Known issues fixed); that is exactly why the "confirmed by clean build" standard is not a substitute for looking at the running app.

*Testing note for whoever is next:* synthetic space keypresses from browser-automation tooling often arrive with an empty `key`, so the `onKeyDown` space handler never matches. **Since 2026-09-17 there is an easier path**: append the space to the input's value and dispatch a plain `input` event — `splitOnCommit` treats a space in the buffer as a commit, which is exactly the mobile-keyboard path, so automation and real phones exercise the same code. The old approach still works: `new KeyboardEvent("keydown", { key: " ", code: "Space", keyCode: 32, which: 32, bubbles: true, cancelable: true })`.

Two more automation gotchas worth knowing: each dev-server port is its own origin, so `localStorage` settings (mode, duration) reset whenever the port changes — and **`document.body.innerText` returns empty in a headless/non-compositing pane** because it is layout-dependent. Use `textContent` or `querySelector`; an `innerText` check once made a working focus overlay look broken four times in a row.

**Core engine & features:**
- Project scaffold, 5-theme system (`data-theme` attribute + CSS vars, picker in `theme-switcher.tsx`), header/footer, ad slots (footer + post-results, not near the typing area). **As of 2026-09-17 `AdSlot` renders `null` until `NEXT_PUBLIC_ADSENSE_CLIENT_ID` is set** — the dashed "Ad space" placeholders made a finished product look unfinished pre-approval. All nine placements stay in the tree, so switching ads on is one env var and no code change.
- Full typing engine (`src/lib/typing-engine/`): time mode (15/30/60/120s presets **plus a free-form custom duration**, infinite word regeneration), words mode (10/25/50/100), quote mode (curated public-domain quotes, short/medium/long), custom text mode (capped at 2000 chars), punctuation/numbers injection toggles.
- Per-character correct/incorrect/extra/pending rendering, animated caret (via `motion` `layoutId` shared-element transition), smooth 3-line word-window scrolling that re-measures after web fonts finish loading.
- Live stats while running (countdown or word progress + live WPM, stabilized against early-test noise), results screen (net WPM, raw WPM, accuracy, consistency, char breakdown, personal-best badge) — **accuracy and the correct/incorrect breakdown are mathematically guaranteed to agree** (see Known issues fixed).
- **Results graph** (`results-graph.tsx`): plots net WPM and raw WPM as two lines over time on a single y-axis — deliberately **not** MonkeyType's dual-axis (WPM + errors on a second scale) layout, which is a well-known charting anti-pattern; error-count-over-time was scoped out rather than bolted on as a second axis. Has a legend (line-key + label, not color-only), recessive gridlines, end-dot markers, and a hover crosshair + tooltip reading the nearest sample. Colors reuse existing theme tokens (`--accent`, `--sub`), so it adapts across all 5 themes automatically. Verified two ways: a clean-typing test showed the two lines exactly overlapping (correct — raw and net WPM are identical at 100% accuracy), and a test with one deliberate uncorrected mistake showed them genuinely diverge (raw consistently above net, as it must be).
- **Restart icon**: a small always-present circular button below the word-stream (idle/running only — the results screen has its own explicit "Restart" button). Follows the "always mounted, opacity-only crossfade" pattern — no layout shift.
- **Header logo resets the test** when clicked while already on `/` (a plain `<Link>` is a no-op in that case since there's no navigation) — via a tiny pub-sub, `reset-bus.ts`.
- **Language selector**: a real (not decorative) popover showing "English" as the sole, checked option — same interaction pattern as the theme picker. Functionally honest (opens a real menu) rather than a fake button, so adding a second language later is one more row, not a rebuild.

**Visual redesign (most recent round, matching MonkeyType's look):**
- **Typography**: monospace font is JetBrains Mono (switched from Geist Mono site-wide). Word-stream size is currently `text-2xl sm:text-3xl`. **The line height is no longer a constant** — as of 2026-09-17 `word-stream.tsx` measures the real gap between wrapped rows at runtime, because a single hardcoded value cannot be right at two breakpoints (32px on phones, 38px from `sm:` up) and had been stale three times. You can change the font/size freely now without re-measuring anything.
- **Config bar is icon + label** (`test-config-bar.tsx`): punctuation/numbers/time/words/quote/custom render as a `lucide-react` icon *and* its lowercase word. It was icon-only until 2026-09-17, when that was reported as unreadable — every control was a guess. Pills keep their `aria-label`/`title`. Spacing is tightened below `sm:` so the labels still fit three rows on a 375px phone, and sizing is `pointer-fine:min-h-9` (touch stays 44px) rather than a width breakpoint. Container background removed so it blends with the page instead of sitting in a visibly distinct box.
- **Custom time duration**: time-mode presets (15/30/60/120s) sit next to a real numeric input, clamped **1s–86400s / 24 hours**, tucked behind a pencil-icon trigger rather than a permanently-visible bare input. Durations over a minute format as "1m 13s" / "2h 3m 14s" (a local `formatDuration` helper) instead of a raw second count — applied to the preset pills too ("15s"/"30s"/"1m"/"2m"), not just the custom one. **Not yet applied to the live countdown while a test is running** — that still shows raw seconds; deliberately out of scope this round (a proper HH:MM:SS-style flip-clock treatment deserves its own design pass, see backlog).
- **Default (Dark) theme now matches MonkeyType's Serika Dark palette** (`#323437` background, `#d1d0c5` foreground, `#646669` sub, `#e2b714` accent) — the other 4 themes are unchanged/independent of this.
- **Typing area widened** to `max-w-6xl` (was `max-w-4xl`), matching MonkeyType's proportions more closely.
- **Page intro (h1/subtitle), the config-bar/language-selector, and the site footer all collapse once a test finishes** — the results screen shows only the results, not leftover chrome. All four key off `test-status-store.ts`; `PageIntro` and `SiteFooter` are client components still SSR'd for SEO (no random content, so no hydration-mismatch risk — see Architecture notes). `PageIntro`/`SiteFooter` collapse via a **pure-CSS `grid-template-rows: 1fr → 0fr`** transition, deliberately not `AnimatePresence` (see the rAF note under Tech stack — a JS-animated collapse silently does nothing in a pane with no animation frames). The flag is cleared when the typing island unmounts, so the footer comes back on `/about` etc. **Live-verified 2026-09-15**: both collapse to `0px` on finish, and the footer returns to 210px after navigating away.
- **Results screen fits above the fold.** Live-measured at a 720×1280 viewport with the WPM graph rendered: the core results — stats row, graph, correct/incorrect/extra/missed breakdown, and the Restart button — end at **706px**, inside the 720px fold. The 300×250 post-results ad slot sits just below it by design; shrinking or dropping that unit to win the last ~250px would cost the site's single best-performing ad placement, so it stays below the fold. On a typical laptop viewport (800–950px) there's considerably more headroom.
- **Results panel tightened and polished**: smaller gaps, a shorter graph (170px, was 220px), a border-top divider above the correct/incorrect/extra/missed row, and the "new personal best" badge (now with a sparkle icon) moved above the stats instead of after the graph.
- **Live stats bar** (`live-stats-bar.tsx`): the countdown / word-progress figure renders large (48px) with a flip-clock/split-flap digit animation, and is **the only thing it shows**. The opt-in live-WPM readout and its `liveSpeed` setting were **removed entirely on 2026-09-17** by request — the setting, its toggle, its store field, its persistence and its validation are all gone. Don't reintroduce a live WPM figure without new instruction. The flip animation still holds at a maximum of **2 DOM nodes per digit slot** under live ticking (see the `AnimatePresence` note in Known issues fixed).
- **Every skipped character counts as a mistake**, punctuation and digits included — spacing past `Among;` or typing `9` of `98` is penalised the same as skipping a letter. Skipped characters are tallied into `charTally.missed`, subtracted from accuracy, and rendered in red in the word-stream. *(This reverses an earlier exemption for punctuation; the reversal was explicitly requested — see Known issues fixed.)*
- Personal bests persisted per mode+config in `localStorage` (time/words modes only), with type-validated rehydration so corrupted storage can't inject garbage into the UI.
- Settings persisted via zustand with full validation on rehydration — every field falls back to a safe default if the stored value is out of range, wrong type, or (for `mode`) `"custom"` with no text behind it.
- Paste is blocked in the typing input; keystroke counting loops over every newly-inserted character rather than assuming exactly one.
- Supporting pages: `/about`, `/privacy`, `/terms`, a themed custom `/not-found` (404), a root `error.tsx` boundary, and a dynamically generated OG image (`app/opengraph-image.tsx`).

**SEO & content:**
- **First Tier 1 SEO guide is live**: `/guides/how-to-improve-typing-speed` (real, non-templated content — accuracy-before-speed, home-row finger placement, deliberate short practice sessions, consistency-over-peak-WPM, and common speed-capping habits), using the same `ContentPage` component as `/about`/`/privacy`/`/terms`. Has its own `Article` JSON-LD (`buildArticleSchema` in `src/lib/seo/json-ld.ts`), is in `sitemap.ts`, and is linked from both `PageIntro` ("Want to type faster?") and `SiteFooter` ("Guides") — the first real internal links this site has had beyond header/footer chrome nav. Verified via a clean `npm run build`'s prerendered static HTML (checked the actual `.next/server/app/guides/...html` output for the h1 and the JSON-LD script tag) and the generated `sitemap.xml.body` — **not live-verified in a running browser**: this was an unattended scheduled-task session and `preview_start`/dev-server launch is blocked for unattended runs (no one present to approve). A normal interactive session should do a quick visual pass (it's static content through a component already proven to render correctly for `/about`, so risk is low, but hasn't been literally seen).
- **Second Tier 1 SEO guide is live** (2026-09-15): `/guides/average-typing-speed` — a benchmark table by context (casual/office/programmer/transcriptionist/competitive), sourced honestly as "commonly cited bands" rather than inventing a false-precision citation, plus a section explaining *why* WPM figures vary so much between sources (test length, text difficulty, net vs. raw). Cross-links with guide #1 in both directions (guide #1's closing section now points here; this guide points back to guide #1 for the "how to actually improve" follow-up) and links to `/`. Same `ContentPage`/`buildArticleSchema`/`sitemap.ts` pattern as guide #1. Verified the same way as guide #1 — clean `npm run build`, inspected the prerendered `.next/server/app/guides/average-typing-speed.html` for the h1, JSON-LD, and table content, and confirmed the URL in `sitemap.xml.body` — **not live-verified in a running browser**, same unattended-session constraint as guide #1. One thing worth a human/interactive-session glance: the table borrows the existing `border-border` Tailwind token (used elsewhere for `AdSlot`'s dashed border) rather than inventing new styling, so it should theme correctly across all 5 themes, but a visual table hasn't existed on this site before now and hasn't been literally seen rendered.
- **`sitemap.ts`'s `lastModified` bug is fixed**: it previously evaluated `new Date()` per request, so every crawl saw "modified right now" regardless of whether anything changed. Now each route has a hand-set date in a `routes` array; bump a route's date only when that page's content actually changes. This was Technical SEO gap #1 in the roadmap below — now resolved.

**Typing games** (six shipped 2026-09-15, four more since — ten total):
- **Ten games live under `/games`**: the six below, plus `spellbound` (roguelike spell-casting), `typing-survivor` (endless waves + upgrades), `ghost-racer` (race a recorded run) and `card-battle` (deck-builder). The original six: a hub page plus `falling-words` (3 lives, combo-multiplied score), `word-rain` (one life, faster ramp, scored by seconds survived), `word-blaster` (shooter — enemies cross lanes toward a base, first keystroke commits the turret to a target), `typing-grand-prix` (racer — sequential typing drives your car against three AI opponents over 40 words), `boss-battle` (multi-phase boss, longer words hit harder, a telegraphed attack costs a life if the current word isn't finished in time) and `combo-rush` (a draining clock each cleared word tops back up). Both are statically prerendered via `generateStaticParams`, linked from the header, footer and the games hub, and listed in `sitemap.ts`. Each game route carries its own long-form "how to play well" copy — genuinely mode-specific advice, not one template with the name swapped (see the thin-content guardrail in the SEO section).
- **Live-verified 2026-09-15**: words spawn and fall at the expected rate (measured 41.8px/s against a 9s fall across 376px), typing clears the targeted word, score/combo/accuracy all track, one word reaching the floor costs exactly one life, game over records a high score to `localStorage`, and Word Rain correctly runs with a single life and a "survived" headline.
- **Arcade visual layer** (`globals.css`, `game-cover-art.tsx`): drifting perspective grid, horizon haze, danger gradient, faint scanlines, neon glow and corner brackets. All of it is CSS + hand-drawn SVG deriving from theme CSS variables via `color-mix`, **not raster art** — verified recolouring correctly across dark/light/forest/sunset. That's the reason to keep it: a fixed image would clash with the light themes, add real LCP weight, and couldn't animate.
- **Real artwork is now in place** (2026-09-15): `public/games/falling-words.webp`, `word-rain.webp` and `hero.webp` — AI-generated neon scenes, vivid and each with its own palette (cyan/violet, indigo/magenta, full synthwave sunset). The drawn SVG in `game-cover-art.tsx` is still the automatic fallback for any game without a file, so deleting an image restores it instantly. `game-art-assets.ts` finds files by convention at build time; `public/games/README.txt` documents the names.
- **Artwork rules if you add or replace any**: convert to WebP (the originals were 7.9MB of PNG, 764KB as WebP at q82 — ~90% smaller, no visible loss) and don't keep both formats, since everything under `public/` ships. Serve through `next/image` with `fill`, never a raw `<img>`, so it's resized per viewport rather than sending 1536px art into a 498px card. The hub cards are `loading="eager"` (both above the fold; lazy makes the main content pop in late) and the hero/page backdrops are `priority` as LCP elements. **Check new art against the Light theme** — baked art can only match one theme, which is exactly why the SVG fallback is kept.
- **In-play chrome is icons and numbers only.** The SCORE/CLEARED/ACCURACY word labels are gone; the icons keep `aria-label`s so screen readers lose nothing. Long-form copy sits well below the board behind a divider, out of the way during play but still indexable.
- **Sound is synthesised via the Web Audio API** (`game-audio.ts`) — no audio files anywhere. Oscillators started on demand keep keystroke feedback tight, there's nothing to download or license, and timbres are tuned by editing numbers. Distinct cues for keystroke, typo, clear, combo milestone, life lost, game over and start. Driven off state transitions rather than inline from handlers, so paths that change the game on the tick (a word landing, an auto game-over) get audio for free. Wired to the existing persisted `soundEnabled` setting — **now defaulted to `true`** — with a mute toggle in the HUD. Audio can't start before the Start click (browsers gate it behind a gesture), so it never autoplays.
- Game high scores live in `game-scores.ts`, deliberately separate from `results-store.ts` — that store keys personal bests by typing-test mode + config and only tracks WPM/accuracy, which doesn't describe a game run. Same validate-on-read posture.

**Accessibility & polish:**
- Mobile layout (375×812) verified with no horizontal overflow. Hidden input has `font-size: 16px` to prevent iOS auto-zoom.
- Custom-text modal has proper dialog semantics, closes on Escape or backdrop click, live character counter, returns focus on close.
- Mode-selection and toggle pills expose `aria-pressed`.
- `npm run build` and `npm run lint` both pass clean as of the latest commit.

## Session 2026-09-17 — audit & repair pass (READ BEFORE TOUCHING SCORING, AUDIO OR IMAGES)

Four separate audits, each triggered by a real user-visible symptom. Every fix below is verified by mutation testing where possible: the bug was deliberately reintroduced to prove the test/fix actually catches it, then restored. **Several of these look like over-engineering until you know the failure they prevent — the reasoning is in the code comments; read them before simplifying.**

Full write-ups: `docs/typing-engine.md` (the engine spec the tests enforce), `docs/typing-engine-audit.md`, `docs/games-integrity-audit.md`, `docs/audio-and-asset-audit.md`.

### 1. The typing engine was under-reporting WPM by ~20%

**Symptom:** the same typist scored 66 WPM here and 86 on MonkeyType, at 100% accuracy in both.

**Root cause: spaces were never counted as characters.** `hidden-input.tsx` intercepts the space key and dispatches `COMMIT_WORD`; that reducer case tallied the finished word's letters and advanced the cursor but never touched `correctKeystrokes`. Every inter-word space vanished.

**Why it hid for so long, and the lesson:** WPM is defined on five-character units *including the trailing space*, so dropping them loses ~1 character in 6. But accuracy is `correct / (correct + incorrect + missed)`, and a space is almost always struck correctly — removing it from numerator *and* denominator barely moves the ratio. One bug, and only one of the two numbers on screen reacted. **When one metric looks wrong and a related one looks fine, that is evidence about the shape of the bug, not evidence that the first metric is fine.**

Also fixed in the same pass:
- **`Date.now()` → `performance.now()`** everywhere in the engine. Wall-clock steps under NTP correction and can yield a negative elapsed time mid-test.
- **Backspace now records `correctedErrors`.** Deleting a mistake does not un-make it; the incorrect keystroke stays counted. This is what stops someone farming a perfect score by delete-and-retype.
- **Consistency was measuring a running average** — each sample was cumulative WPM, which converges by construction, so the score mostly measured test length and read high for everyone. It now differences the samples into one-second buckets and takes the coefficient of variation of *per-second* speed. Measured effect: a typist alternating full-speed and dead stops scored **78%** under the old formula and **0%** under the new one.
- **Personal bests were compared on rounded values**, so a genuine 65.6 → 66.4 improvement read as a tie at 66. Now compared unrounded, rounded only for display.
- Results screen gained **Total Typed** and corrected-errors, so the breakdown visibly reconciles with the WPM above it.

**Verified end to end** on MonkeyType's own prompt via the new `/debug/typing-engine` page (dev-only, 404s in production): 20 words typed → predicted 86 letters + 20 separators = 106, recorded exactly 106. On identical text the two engines agree.

### 2. Two games could be won without typing

**Ghost Racer** computed race position as `typed.length` — the raw count of keys pressed, never compared against the text. Proven by attack: **400 spaces and nothing else produced "You win", "New personal best", 39 WPM at 19% accuracy** — and saved itself as the personal-best ghost, so every later race on that text would run against a mash.

**Typing Grand Prix** banked `target.length` for whatever was in the buffer, so one letter plus space advanced a full word. This one had the exploit in **three** places; after fixing the two obvious ones, `finishRace` still hardcoded `playerProgress: 1` and computed placement from opponents who had *already finished*, so spacing through all forty words still crossed the line in **first place**. That third site was only caught because a test failed. **Do not assume one fix covers a scoring exploit — enumerate every write to the progress variable.**

Both now tie distance to correctly-typed characters, which keeps it consistent with the WPM numerator. Ghost store bumped `v1` → `v2` to abandon pre-fix recordings, which hold inflated positions.

The other eight games were audited and are sound: all require an exact match before anything clears. Combo Rush maps space to "skip" but charges time and resets the combo; Spellbound and Survivor treat a space as a miss; Card Battle strips non-letters.

### 3. Music kept playing after leaving a game

**Not a missing cleanup** — all four music games already had `return () => stopMusic()`. The race was in the bus: `playMusic` awaits the file decode, and `nowPlaying` is only assigned *after* it resolves. Leave during that gap and `stopMusic()` finds `nowPlaying === null`, concludes there is nothing to stop, and returns; then the decode finishes and starts a track nothing holds a reference to.

Fixed with an epoch claimed on the shared state *before* any await. The counter lives on the `window`-anchored singleton, **not module scope** — `next/dynamic` gives each game its own chunk and a module-level counter would be duplicated (this codebase has been bitten by that exact thing twice now; see the `test-status-store` note).

Every game clock and animation loop was also audited for cleanup — all clean.

### 4. Images were already optimized; two real wins found anyway

The suspicion was that images had never been compressed. They had: 141 WebP files at a median **0.097 bytes/pixel**, every `<Image>` already carrying a correct `sizes`, nothing bypassing the optimizer. Re-encoding the fifteen largest was tested and **rejected** — it recovers 5–30% while compounding artefacts on an already-lossy source (28–31 dB PSNR on the alpha cut-outs, which is visible). **Don't re-encode these again without measuring; the obvious win isn't one.**

What was actually wrong:
- **Decorative backdrops served at full quality.** Art sitting at 25–70% opacity under gradient overlays now uses `quality={45}` (Next 16 requires the value be allowlisted in `images.qualities`, which `next.config.ts` now does). Everything a reader actually looks at stays at 75.
- **One image downloaded twice.** On a game page the blurred backdrop and the marquee render the *same* hero file but asked for different variants. Giving the backdrop the marquee's exact `sizes` collapses them to one URL and the backdrop becomes free. **The obvious move here is wrong:** asking for a smaller cheaper variant for a blurred backdrop sounds thriftier and is strictly worse, because it downloads a second copy.

Measured on a production build: `/games` 209 KB → **171 KB**, `/games/spellbound` 100 KB → **79 KB**. The typing-test home page loads **no images and no audio at all** (16 KB total transfer).

Audio was checked and deliberately left alone: 13 MB across 26 files, already Opus at ~64 kbps, and no game loads more than its own two or three tracks. `assets-raw/` is 596 MB on disk but is gitignored and excluded from build tracing, so it never deploys.

### 5. Mobile typing was broken, and the build had a deploy hazard

- **You could not get past the first word on a phone.** Android's GBoard (and every IME-backed keyboard) reports composing input as `keydown` with `keyCode 229` / `key: "Unidentified"`, so the `e.key === " "` test **never fires on mobile**. The space landed in the input value and was scored as a wrong character against the target word. Fixed via `splitOnCommit` (`src/lib/typing-engine/input-commit.ts`) — a generated word never contains a space, so a space in the buffer can only mean "commit". Typing Grand Prix already had this fallback; the main test didn't. **Any new typing surface needs it too.**
- **Word-stream `LINE_HEIGHT` is now measured at runtime, not hardcoded.** The constant had been wrong three times (48, 32, 38); the last was right on desktop and 6px too large on every phone, since the stream is `text-2xl` there and `text-3xl` from `sm:` up. It now reads the median gap between wrapped rows, with a guard rejecting implausible values (a zero-width container once produced a 312px window). **This kills that recurring trap for good — don't reintroduce a constant.**
- **Touch targets were 24px on tablets.** The config bar shrank at `sm:`, which asks about viewport width when the real question is what is doing the pointing — a tablet is wide *and* touch. Now `pointer-fine:min-h-9`: phones and tablets stay 44px, mice get 36px.
- **Build warning fixed:** `game-art-assets.ts` probed for art with `fs.existsSync(path.join(DIR, templateString))`. Turbopack cannot statically scope a templated path, so it traced **the entire project** into the server bundle and warned it "can lead to failures when size limits are exceeded". Replaced with one statically-scoped directory read into a `Set`. **The build is now 0 warnings — keep it that way.** Note the trade-off: art is listed once at module load, so a newly dropped-in file needs a restart to appear (which matches what this module already promised).

### What a cold start should verify first

The fixes above are the kind that regress silently. Before trusting the app:

```bash
npm test && npm run lint && npx tsc --noEmit && npm run build   # all clean, build must emit 0 warnings
```

Then in a browser: take a 15s test and confirm the results breakdown reconciles (`Total Typed` == correct + incorrect), and confirm a space cannot win Ghost Racer.

### Known issues fixed (context for why the code looks the way it does — read before "fixing" these back)
- **Results screen's accuracy % and its "correct/incorrect" breakdown could contradict each other.** Reproduced precisely: custom text "cat" typed with one backspaced-out mistake showed "3 correct, 0 incorrect" but 75% accuracy — impossible for both to be right. Root cause: the breakdown was tallied from each word's *final* character state, while accuracy came from full keystroke history (including corrected mistakes). Fixed by removing correct/incorrect from `CharTally` entirely; the breakdown now reads `correctKeystrokes`/`incorrectKeystrokes` directly — the same numbers accuracy is computed from — so they can never disagree again.
- **A run with visible skips reported 100% accuracy and "0 incorrect"** (caught on a screencast, 2026-09-15). Three separate causes stacked, which is why it looked so wrong:
  1. **`calculateAccuracy` never saw skipped characters.** It was computed from keystroke history alone, and a character you never press leaves no keystroke — so skips were arithmetically invisible. It now takes `missed` as a third term. Extras are deliberately *not* added on top: an extra character is already counted as an incorrect keystroke when typed, so adding it again would double-count.
  2. **Punctuation was exempt from the missed tally.** `countPenalizedMissed` skipped trailing punctuation on purpose — an explicit earlier request that was later explicitly reversed by the same person. It's `countMissed` now and exempts nothing. **This history is why the file used to carry an "awaiting input" note here; the question is settled — skipped is skipped.**
  3. **Skipped characters rendered dim grey**, identical to text not yet reached, so a mistake looked like ordinary untyped text. A committed word's untyped characters are now re-labelled `"missed"` (a `CharState`) and drawn in error red with a dotted underline. Only *committed* words get marked — the active word's untyped characters aren't skipped yet, they're just not typed yet.
  Verified end to end: ten words typed with their trailing punctuation skipped now reports 95% / 2 missed, where it previously reported 100% / 0.
- **Time-mode expiry counted the in-progress word as skipped.** Harmless while punctuation was exempt, but once every skipped character counted, the partially-typed word at the buzzer inflated the error count on every timed run. `tallyWord` takes `countMissedChars: false` on that one path — running out of time mid-word isn't the same act as spacing past it.
- **Every control on the site showed a plain arrow instead of a pointer.** Tailwind v4's preflight resets `button` to `cursor: default` (a deliberate change from v3), so nothing read as clickable. `globals.css` restores `cursor: pointer` on buttons, `[role="button"]`, `label[for]`, `summary` and `select`, and gives disabled controls `not-allowed`. **Worth remembering as a v4 migration gotcha** — it's silent and easy to miss.
- **Live WPM could spike to absurd values (e.g. "12000 wpm") in the first instant of a test.** `netWpm = correctChars / 5 / minutesElapsed` is unstable when elapsed time is a few milliseconds. Fixed by flooring the denominator at 1000ms for live display and skipping consistency-score sampling entirely during that window. Final results always use true elapsed time.
- **UI jumped/glitched the instant typing started.** The config bar was conditionally unmounted, so its layout space collapsed instantly when it exited, snapping the word-stream upward. Fixed by keeping the config bar permanently mounted and crossfading it with the live-stats bar inside one fixed-height slot.
- **A "N lines rendered inside a 3-line box" bug**, caused by `LINE_HEIGHT` (`word-stream.tsx`) being left stale after a font/size change — this has now happened **twice** (48→32 after a font-family change, then 32→38 after a later font-size bump), confirming it's a real recurring trap, not a one-off. Fixed each time by *measuring* real consecutive wrapped-line `offsetTop` deltas in a live browser rather than assuming a prior value or recalculating on paper. **If you change the word-stream font or size, re-measure this the same way — don't guess, and don't assume the last measured value still holds.**
- **`AnimatePresence` (from `motion`) didn't reliably unmount an exited single-child-by-key element when the key changed rapidly.** Found in the live-stats bar's flip-digit animation (`live-stats-bar.tsx`): each digit's old value was supposed to animate out and then be removed, but under fast successive changes (the countdown/live-WPM tick), old values kept completing their exit animation and then just sitting in the DOM forever (`opacity:0`, fully rotated, never actually removed) — confirmed via direct DOM inspection showing 9+ stacked ghost elements per digit after a burst of typing. Fixed by not using `AnimatePresence` for this case: `FlipChar` now manages its own single `prevChar` state slot and force-clears it with an explicit `setTimeout` matched to the transition duration, which structurally caps it at 2 DOM nodes per digit no matter how fast values change. **If you use `AnimatePresence` for anything that can re-key faster than its transition duration, don't trust it to clean up — verify by inspecting the live DOM node count, not just by watching the animation look right.** (`PageIntro`'s single, rarely-toggled exit has the same non-removal symptom — confirmed via computed style showing a stuck `opacity:0;height:0px` node — but since it only toggles once per test and lands at zero-size/invisible, it's cosmetically harmless and wasn't worth the same fix.)
- **The results screen's chrome didn't actually collapse, and the page overflowed by ~400px** — shipped broken and only caught once someone finally ran it in a browser. Two *independent* causes stacked on top of each other, which is why it looked so baffling: (1) `test-status-store.ts` was a module-level zustand store that the bundler duplicated across the `next/dynamic` boundary, so the writer and readers held different instances — see the Architecture note on that boundary, it is the important lesson here; (2) `PageIntro`/`SiteFooter` collapsed via `AnimatePresence`, which can't run at all without animation frames. Fixed by anchoring the store to `window` and replacing the animated collapse with a pure-CSS one. **Both fixes were needed** — either alone would have left it broken, which is worth remembering when a fix "doesn't work" and the temptation is to revert it.
- **Theme swatches drifted out of sync with the actual palette.** `themes.ts` carries a hardcoded `swatch` per theme (the preview dot in the picker) because CSS variables for a theme that isn't currently applied can't be read from the DOM. The Dark entry still showed `#1a1a1e`/`#facc15` long after the theme itself moved to Serika Dark `#323437`/`#e2b714`. **If you change a theme's `--background`/`--accent` in `globals.css`, update its swatch in `themes.ts` in the same edit.**
- **Time-mode tests recorded slightly too much elapsed time.** The finish path set `elapsedMs` to the exact configured duration and then `finalize()` immediately overwrote it with wall-clock `now - startedAt`; since the tick runs every 100ms, a 30s test recorded ~30.1s and reported WPM a few tenths of a percent low. `finalize()` now takes an explicit `elapsedMsOverride` used only by that one path — every other finish path still uses true elapsed time, which is correct for them.
- **Hydration mismatch**: the engine's initial word list uses `Math.random()`, which would differ between server and client render. Fixed via `next/dynamic(..., { ssr: false })` for the interactive island; the SSR'd shell (h1, intro, JSON-LD) around it stays server-rendered for SEO.
- **Double word-regeneration on mount**: React Strict Mode's dev-only double effect invocation defeated a naive "skip first run" ref guard. Fixed by comparing the memoized config object by reference instead of a boolean flag.
- **Custom mode + reload = stuck blank test**: `mode` persists via zustand but `customText` deliberately doesn't. Fixed: a persisted `"custom"` mode is treated as absent on rehydration and falls back to the default.
- **A CSS specificity gotcha**: Tailwind's `transition-opacity` utility sets `transition-property: opacity` on an element, which — because a class selector beats the bare `*` universal selector — *overrides*, rather than merges with, this project's global `transition: background-color, border-color, color` rule. Any element that both fades in/out AND has its own hover color needs the general `transition` utility, not `transition-opacity`, or its hover transition silently breaks.

### Awaiting human input (asked, not yet actioned — don't guess on these)
- ~~Whether skipping a word's trailing punctuation counts as a mistake~~ — **Resolved 2026-09-15: it does.** Every skipped character is penalised, including punctuation and digits. See Known issues fixed.
- What "make the language selector better" means concretely (visual polish vs. more functionality) is unscoped.
- A "make it look like the best site in the world" animation request came in but is too open-ended to implement blind — a prioritized short list of *which* interactions to focus an animation pass on (results reveal, stat count-up, tab/pill transitions, hover states, page transitions, etc.) was requested but not yet given.

### Not built yet (by design, not oversight)
- No settings modal (Escape currently just blurs the input); no sound effects (`soundEnabled` exists in settings but nothing plays).
- No custom favicon (still Next.js default); no `manifest.json`. OG image *is* handled.
- No real AdSense integration — `AdSlot` renders **nothing** until `NEXT_PUBLIC_ADSENSE_CLIENT_ID` is set; creating/approving the account requires the human, not an AI agent.
- No focus-trap in the custom-text modal — low risk (one textarea, two buttons), worth doing if a more complex modal is added later.
- Screen-reader typing experience is fundamentally limited (industry-wide issue with this app category — a real, visually-hidden `<input>` drives a custom visual rendering, so there's no real-time spoken feedback while typing — not something a small patch fixes).
- Unicode edge case: character comparison indexes by UTF-16 code unit, not grapheme cluster — emoji in custom text render oddly but don't crash anything. Low priority.
- **No SEO beyond the technical baseline** — see the SEO section below, which is a current top priority.

## Mobile responsiveness pass (2026-09-16) — live-verified at 320px and 375px

The site is now usable on phones. Verified by measuring the running app at
375x812 and 320x640, not by reading the source.

**What was actually broken (all fixed):**
1. **Touch targets below 44px site-wide.** Config-bar pills were a 32x24 hit area
   around a 16px icon; the five game mute buttons were bare 15x15 icons with no
   padding; the game info button was 36x36 and its close button 32x32. All now
   clear 44px on touch screens and revert to the compact size from `sm:` up,
   where a pointer makes the padding unnecessary. The mute fix uses a negative
   margin (`-m-2` + `p-2`) so the larger hit area grows outward instead of
   reflowing the HUD.
2. **Falling-words clipped its words on narrow screens.** Lane positions were
   computed in *pixels* against a fixed 440px board, so on a 309px board the
   outer lanes pushed text past the edge. Now percentage-based
   (`LANE_INSET_PCT`, `FLOOR_INSET_PCT`) against a fluid
   `[--board-h:340px] sm:[--board-h:440px]` board. Proven by computing the
   longest word in the list (`together`, 8 chars) against all 6 lane centres at
   a 254px board: every lane fits with 7.3px to spare.
3. **Word Blaster clipped every long word at spawn — and this was never
   mobile-specific.** Enemies were left-edge-anchored at `SPAWN_X = 94%`, so the
   text ran off the board's `overflow-hidden` clip: the longest word overhung a
   320px board by 52px and stayed partly unreadable for roughly the first
   quarter of its approach. Since you cannot type a word you cannot read, this
   was a real difficulty bug that also affected desktop (spawn 722px + ~96px of
   text on a 768px board). Fixed by interpolating the horizontal anchor from the
   word's right edge at spawn to its left edge at the wall, which gets both ends
   right without needing the text width in JS. Verified over 89 live samples at
   a 254px board: zero clipped, worst case 16px *inside* the edge.

**Checked and found already correct — do not "fix" these:**
- The Grand Prix word strip is 645px wide inside a 309px container *by design*:
  it is a masked ticker, active word pinned left, upcoming words fading out at
  72%. Measured the active word ending at 91px against a fade starting at 222px.
- The Grand Prix board keeps a fixed derived height (`LANE_COUNT * LANE_HEIGHT
  + TRACK_PAD_Y * 2`) rather than the fluid `var(--board-h)` the other games
  use, because a fluid container would desync the fixed-height track lanes.
- The guides table is fluid (327px at 375, 272px at 320) — it needs no
  `overflow-x` scroll wrapper.
- The hidden typing input is 16px, so iOS will not auto-zoom on focus.

**Coverage:** every route measured for document-level horizontal overflow at
375px — `/`, `/games`, all six `/games/[gameId]`, `/guides/*`. All clean.
Desktop was re-verified for regression after the falling-words geometry change
(768x440 board, 44px/s fall rate, no clipping) since that change touched
gameplay math, and a life-loss run confirmed the floor detection still fires.

## File map — where the load-bearing logic lives

Everything else is presentation. These are the files where a careless edit changes a score, breaks a build, or reintroduces a fixed bug.

| File | What it owns | Don't |
|---|---|---|
| `src/lib/typing-engine/use-typing-engine.ts` | The reducer: every keystroke, the clock, all counters. `reducer` and `createInitialState` are exported **for tests** | Move timing back to `Date.now()`; drop the separator credit in `COMMIT_WORD` |
| `src/lib/typing-engine/stats.ts` | WPM / raw / accuracy / consistency — the single source of these formulas | Duplicate a formula into a component |
| `src/lib/typing-engine/input-commit.ts` | `splitOnCommit` — the mobile-keyboard space path | Assume `keydown` sees the space; it doesn't on Android |
| `src/components/typing-test/word-stream.tsx` | The 3-line window and its **runtime-measured** line pitch | Reintroduce a hardcoded `LINE_HEIGHT` |
| `src/lib/games/use-typing-grand-prix.ts` | Race distance + placement. Reducer exported for tests | Bank `target.length`; hardcode `playerProgress: 1` |
| `src/lib/games/racer/progress.ts` | Ghost Racer's position rule | Use `typed.length` as position |
| `src/lib/audio/audio-bus.ts` | One AudioContext, buses, the `musicEpoch` race guard | Put the epoch in module scope (chunk duplication) |
| `src/lib/games/game-art-assets.ts` | Build-time art resolution via one scoped directory read | Go back to `existsSync` on a templated path — it traces the whole project into the bundle |
| `src/lib/persistence/settings-store.ts` | Persisted settings **with validation on rehydrate** | Trust `JSON.parse` output |
| `src/components/layout/ad-slot.tsx` | Renders nothing until AdSense is configured | Re-add visible placeholders |
| `next.config.ts` | `images.qualities` allowlist, tracing excludes, dev origins | Remove `qualities` — `quality={45}` then fails the build |
| `src/lib/lessons/lesson-types.ts` | The 28-unit, 3-tier curriculum: `LessonId`, `LessonTier`, `LESSON_DEFINITIONS`, ordered `LESSON_LIST` | Add a unit without adding it to `LESSON_LIST` — gating/routing/sitemap all derive from that array |
| `src/lib/lessons/lesson-content.ts` | Drill/review/graduation text generation (key-constrained) plus `buildSubLessons`, the per-unit step ramp | Let a generator emit a character outside `allowedKeys` — `lessons.test.ts` guards this. Hand-author sub-lesson content instead of extending the ramp |
| `src/lib/lessons/lesson-progress-store.ts` | `useLessonProgressStore` (zustand+persist): unit completion/steps/averages, cumulative totals, pure `computeUnitProgressUpdate` + `isLessonUnlocked` | Persist a separate "unlocked" field — derive it from `LESSON_LIST` order + completion instead. Put averaging logic inline in the store action instead of the exported pure function |
| `src/lib/lessons/keyboard-layout.ts` | The single finger↔key mapping the keyboard grid and hand diagram both read | Define a second, divergent finger mapping anywhere else |

## Before deploying (prerequisites, in order)

1. **Set `NEXT_PUBLIC_SITE_URL`** to the real origin. Unset, everything SEO-facing emits `https://thundertyping.com`. Verified: `sitemap.xml`, `robots.txt` and the `/` canonical all read from it.
2. Confirm `npm run build` is **0 warnings** and `npm test` is green.
3. `/debug/typing-engine` must 404 in production (it is guarded by `NODE_ENV`; verified).
4. `NEXT_PUBLIC_ADSENSE_CLIENT_ID` stays unset until the account is approved — that is what keeps ad slots hidden.
5. Node 22+ on CI, or `npm test` won't run. `npm ci` is in sync with `package.json` (verified).
6. Optional housekeeping: four extraneous packages (`@img/sharp-wasm32` and its wasm deps) sit in local `node_modules` but are in no `package.json`, so `npm ci` won't install them. `npm prune` tidies local to match CI.

## Architecture notes (read before modifying the typing engine)

- **Engine state** (`use-typing-engine.ts`) is a `useReducer`, not zustand — mutates every keystroke (high-frequency, subtree-local). Zustand (`settings-store.ts`) holds durable, low-frequency, cross-cutting state. Don't swap these.
- **Keystroke capture** is a real, focused, offscreen `<input>` (`hidden-input.tsx`), not raw `keydown` — needed for IME composition and mobile keyboards. Space/Tab/Escape intercepted in `onKeyDown`; paste blocked entirely.
- **`correctKeystrokes`/`incorrectKeystrokes` are monotonic** — never decremented by backspace — and are the **only** source for accuracy/WPM/raw-WPM *and* the results breakdown's correct/incorrect. Don't reintroduce a second, final-state-derived tally for these two; that's the exact bug that was fixed once already (see above).
- **`charTally`** only tracks `extra`/`missed` (final-state concepts with no keystroke-history equivalent). `missed` counts **every** untyped character of a committed word, punctuation and digits included — see `countMissed`. It feeds accuracy as a third term alongside correct/incorrect keystrokes, because a skipped character produces no keystroke and would otherwise be invisible to the score.
- **One engine, all four modes** — time/words/quote/custom share the same reducer and rendering path.
- **Word/quote data is fully static** (`english-1k.ts` — actually ~360 words, not literally 1000; `english-quotes.ts` — ~26 public-domain quotes). Adding a language = new data file + config extension, not an engine rewrite.
- **Shared option constants live in `engine-types.ts`** (`TIME_DURATIONS`, `WORD_COUNTS`, `QUOTE_LENGTHS`, `MIN`/`MAX_CUSTOM_TIME_DURATION`) and `word-generator.ts` (`PUNCTUATION_MARKS`) — don't redefine these elsewhere. `TimeDuration` is `number` (not a literal union) precisely so a user-entered custom value has somewhere to live; `settings-store.ts` range-checks it on rehydration rather than checking set membership.
- **Persisted data is never trusted blindly** — `settings-store.ts`'s `merge` validates every field on rehydration; `results-store.ts`'s `getPersonalBest` validates the parsed shape. Add new persisted fields to the corresponding validator.
- **Theming**: 5 themes as CSS var blocks in `globals.css`, registered in `THEMES` in `themes.ts`. `--correct` is the bright foreground color in every theme, not green (explicit design request, matches MonkeyType's convention — correctly-typed text becomes the "main" color, only mistakes get a distinct color). A global `transition` on `*` makes theme switches fade smoothly, **except** `.char-instant` (per-character spans in `word-stream.tsx`), which must stay instant — live typing feedback must never visually lag a keystroke.
- **The config bar and live-stats bar never unmount** — both always rendered, stacked in the same CSS grid cell (`grid-area: 1/1` on both, via Tailwind's `[grid-area:1/1]` arbitrary value) inside one grid container, crossfaded via opacity. Grid-stacking (rather than one normal-flow child plus one `absolute` child) matters because the two children are now very different sizes (compact pill row vs. large flip-digit display) — a grid cell auto-sizes to the tallest stacked child regardless of which one that is, so nothing clips. The same visibility technique drives the config-bar/language-selector row, now keyed off `status === "idle"` specifically (not just `!isRunning`) so both also hide on the results screen. Don't go back to conditional mounting or a relative-plus-one-absolute-child layout; both caused real bugs (see Known issues fixed).
- **Bridging state across the `ssr:false` boundary — do NOT use a module-level singleton.** When a page-level sibling (not a descendant) needs to react to engine/test state — e.g. `PageIntro`'s h1/subtitle and `SiteFooter` hiding once a test finishes — keep that sibling *outside* the `ssr:false` boundary (a plain client component with no random content still server-renders fine, which preserves the SEO value; only `TypingTest` needs `ssr:false`, for its `Math.random()` word generation) and share the signal through **state anchored on `window`**, read via `useSyncExternalStore` — see `test-status-store.ts`.
  **A module-level singleton silently breaks here.** The bundler emits a module imported by both the `next/dynamic` chunk and the shared client chunk into *both* — verified by grepping `.next/static/chunks`, where the store's setter appeared in two separate files. A zustand `create()`, a `createContext()`, or even a plain module-scoped `let` therefore becomes **two independent instances**: the writer inside the lazy chunk updates one, the readers subscribe to the other, and the signal never arrives — with no error, no warning, and code that reads as obviously correct. This shipped once and cost two sessions to find. Anchoring the value to `window` makes the duplication harmless, since every copy of the module reads and writes the same object. The `window`-event bus in `reset-bus.ts` is the same idea and is fine for fire-and-forget signals.
### Games architecture (read before adding another game)

**Adding a game touches exactly three shared things**: a new id in the `GameId` union, one `GAME_DEFINITIONS` entry (`game-types.ts`), and one line in the `GAME_COMPONENTS` registry (`game-client.tsx`). Everything else — the hub cards, the `/games/[gameId]` route, the sitemap, the best-score badge — derives from `GAME_LIST`. Cover art needs a new `case` in `game-cover-art.tsx`; without one the switch won't compile, which is deliberate, because the old `if/else` silently gave every new game the same artwork.

- **`GameDefinition` holds only what every game shares** (name, tagline, rules, prose, lives, how the score is formatted). Mechanic tuning lives with its engine — `use-falling-words.ts` holds the spawn/fall numbers for the two games on that engine. Don't push game-specific knobs back into the shared interface; it becomes a union of unrelated concerns every other game has to ignore.
- **One engine can serve several games.** Falling Words and Word Rain are the same mechanic tuned differently. **A variant of "words descend, you type them" should be a new tuning entry, not a second engine** — but a genuinely different mechanic (racing, boss fight, time attack) rightly gets its own, as the four newer games do.
- **The games engine is separate from the typing-test engine on purpose.** `use-typing-engine.ts` is a linear model (one active word, an index that advances); games are spatial and concurrent (many live targets, positions, lives). Bending either into the other would have hurt both. What *is* shared — and should stay shared — is `word-generator.ts`, the math in `stats.ts`, theming, and `storage.ts`.
- **Words advance by a fixed fraction per tick, not by comparing timestamps.** Pausing then needs no timestamp rebasing, and the loop doesn't depend on animation frames (which matters — see the rAF note under Tech stack). CSS transitions `top` over exactly the tick interval, so 20 updates/sec still reads as continuous motion without running the loop at 60fps. **Don't "optimise" this into a rAF loop**; it would break pausing and stop working in a hidden tab.
- **Difficulty ramps with words cleared, not elapsed time** — it tracks how well the player is actually doing rather than punishing a slow start.
- **Targeting locks on.** Once a word's prefix matches, keystrokes stay committed to it even if another word also matches, otherwise the highlight visibly jumps mid-word. With nothing locked, the word closest to the floor wins — it's the one about to cost a life, so it's almost always what the player meant.
- **Runs pause on tab-hide**, so a backgrounded run doesn't drain every life at once when the player comes back.

- **`SUPPORT_EMAIL`/`SITE_URL` in `src/lib/seo/constants.ts` are placeholders** (`hello@thundertyping.com`, `https://thundertyping.com`) — not real yet. Referenced from `/privacy`, `/terms`, and all metadata. Update these together once a real domain/inbox exists.

### Lessons architecture (read before adding or editing a lesson)

`/lessons` is a 28-unit, 3-tier touch-typing curriculum (Beginner: home row → top row → bottom row → numbers → full-keyboard review → graduation; Intermediate: real sentences, numbers-in-prose, longer passages; Advanced: speed endurance, precision, long-form, full mastery) for people who have never typed before, through to real speed/accuracy work. Built in two passes on 2026-09-22 — the first shipped 17 flat lessons; the second, after the project owner pointed at typing.com directly, restructured everything below into tiers + sub-lessons without touching the underlying reuse strategy. It deliberately reuses the existing typing engine rather than building a second one:

- **A sub-lesson step is `useTypingEngine` in `"custom"` mode, nothing more.** `"custom"` mode already does `customText.trim().split(/\s+/)` to build its word list (`use-typing-engine.ts`), so a step is just a generated string fed in as `customText`. `WordStream` and `HiddenInput` are reused completely unmodified — neither file was touched by this feature. `LessonDrill` (`src/components/lessons/lesson-drill.tsx`) is the driver that wires them together plus the virtual keyboard and runs through a unit's steps sequentially; it is **not** the main `TypingTest` component, because that one is wired to settings-store pickers and a full results graph a drill doesn't want.
- **A unit is one `LessonDefinition`; a sub-lesson is generated from it, not authored.** `buildSubLessons` (`lesson-content.ts`) expands one unit's `content` spec into `subLessonCount` graduated steps (word count ramping ~40%→100% of the unit's full length; a `"review"`-kind unit's first step warms up as a plain drill; a `"graduation"`-kind unit only turns numbers on in its later half). This is *why* 28 units with 4–11 steps each didn't need ~180 hand-authored bodies — **don't hand-author sub-lesson content; extend the generator or the unit's `content`/`subLessonCount` instead.**
- **Adding a unit touches exactly one file**: add its id to `LessonId` and a `LESSON_DEFINITIONS` entry in `src/lib/lessons/lesson-types.ts` (set its `tier`), then add it to `LESSON_LIST` in the order it should be taken. The dashboard, the `/lessons/[lessonId]` route, the sitemap entries (generated from `LESSON_LIST`, not hand-listed — see the sitemap's own comment on this) and the unlock gating all derive from `LESSON_LIST` — same pattern as `GAME_LIST`.
- **A failed sub-lesson retries only that step, never the whole unit.** `currentStep` (in the progress store) only ever moves forward on a pass; a fail leaves it exactly where a retry resumes it. Losing all progress in an 8-step unit over one bad step would be exactly the kind of thing that kills engagement, not just a UX nicety.
- **Progression is gated on accuracy, not WPM** (per-step `minAccuracy`), matching the project's own stated position that accuracy comes before speed. **`isLessonUnlocked` is pure, derived from `LESSON_LIST` order + the completion map — there is no separate "unlocked" field stored anywhere.** Don't add one; it's exactly the kind of redundant persisted state that caused the accuracy/breakdown bug documented above.
- **Progress is a real zustand `persist` store now** (`useLessonProgressStore`, `src/lib/lessons/lesson-progress-store.ts`), not the plain-function/localStorage pattern `game-scores.ts` uses — deliberately, because progress here is read reactively from many places at once (top stats bar, every unit row, the drill's own resume) rather than written once and read by one badge. Follows `settings-store.ts`'s exact `merge`/sanitize shape. **The averaging and pass/fail logic lives in the exported pure function `computeUnitProgressUpdate`, not inline in the store action** — same reasoning as the typing engine exporting its reducer separately: it's what makes the logic testable without a browser. It reads/writes across the `next/dynamic(ssr:false)` boundary `LessonDrill` sits behind exactly the way `settings-store` already does (dynamically-loaded writer, always-loaded dashboard reader) without the module-duplication problem `test-status-store.ts` needed window-anchoring for — that bug was specific to a hand-rolled store, not to zustand's `create()`.
- **Keystroke sound reuses `playSound` from `src/lib/games/game-audio.ts`** — the same lightweight synth module `falling-words-game.tsx` already uses, wired via the identical diff-against-previous-render pattern. No second audio system. The main speed test still stays silent by its own existing, separate design.
- **The virtual keyboard + two-hand finger diagram** (`src/components/lessons/virtual-keyboard.tsx`) is abstract geometric SVG, not illustrated art, colored entirely from the `--finger-*` CSS variables in `globals.css` — same reasoning as the arcade layer's `color-mix` approach: it re-themes for free and costs nothing to load. The finger→key assignments live in `src/lib/lessons/keyboard-layout.ts` (`KEY_FINGER_MAP`) and are the single source both the grid and the hand diagram read from. **The 8 finger colors are deliberately theme-invariant** (defined once in `:root`, not per `[data-theme]`) — a categorical legend, not thematic decoration. Checked live against Dark and Light; Midnight/Forest/Sunset weren't individually screenshotted.
- **`LessonClient` (`src/components/lessons/lesson-client.tsx`) wraps `LessonDrill` in `next/dynamic(..., { ssr: false })`**, same reason `GameClient` and `TypingTest` do — the generated content uses `Math.random()`, so server-rendering it would guarantee a hydration mismatch. Don't import `LessonDrill` directly into the `/lessons/[lessonId]` server page.
- **`AdRail` (`src/components/layout/ad-rail.tsx`)** is a `sticky`, `xl:`-only 300px column beside the content on `/`, `/lessons/[lessonId]` and every `ContentPage`-based route (`/about`, `/privacy`, `/terms`, both guides, via `ContentPage` itself) — deliberately **not** added to `/games/[gameId]`, which already documents its own reasoning against an ad beside the game board (distraction/mis-click risk). Below `xl:` every one of these routes keeps its existing below-content `AdSlot` only.

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
1. ~~**`sitemap.ts`'s `lastModified` is `new Date()` evaluated at request time**~~ — **Fixed 2026-09-15**: now a hand-set date per route, bumped only when that page's content changes.
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
1. ~~`/guides/how-to-improve-typing-speed`~~ — **Done 2026-09-15.** Real technique content (finger placement, accuracy-before-speed, deliberate practice, consistency, common mistakes), not filler. See Current Status above for verification notes.
2. ~~`/guides/average-typing-speed`~~ — **Done 2026-09-15.** Benchmark table by context, honestly sourced as commonly-cited ranges rather than fabricated precision. See Current Status above for verification notes.
3. `/guides/touch-typing-basics` — home-row fundamentals for genuine beginners. The interactive gap this was meant to close is now largely covered by `/lessons` (added 2026-09-22); this guide's scope may want to narrow to article-style content (finger placement theory, posture) that links into the lesson track for practice, rather than re-explaining what the lessons already teach hands-on.
4. `/guides/wpm-vs-cpm` — clean comparison/definitional page, natural internal-link target.
5. `/guides/typing-accuracy-vs-speed` — ties naturally back to this site's own consistency/accuracy metrics.

**Tier 2 — after Tier 1 is live and indexed:**
6. At most one or two duration-specific landing pages (e.g. `/typing-test/1-minute`) — only with real, distinct copy about *why* that duration matters, not a template with the number swapped.
7. A shareable/downloadable results certificate (feature + landing page) — proven pattern (see Ratatype) for résumé/job-application use.

**Tier 3 — later, larger investments:**
8. Job/exam-context long-tail content (e.g. government-exam typing test prep, especially India-specific) — needs genuine localized depth, pairs well with non-English support.
9. Non-English language support generally — strong future opportunity, explicitly out of scope for the current English MVP.

### Internal linking
**First real internal links now exist** (2026-09-15): `PageIntro`'s subtitle links to `/guides/how-to-improve-typing-speed` ("Want to type faster?"), `SiteFooter` has a "Guides" nav link (still points at guide #1 only — worth revisiting once a `/guides` index exists), and the guide itself links back to `/` ("Open the typing test"). Previously this was only header/footer chrome nav with no content-level links. **Guides #1 and #2 now cross-link each other** (guide #1's closing paragraph points to `/guides/average-typing-speed`; guide #2 points back to guide #1 and to `/`) — the first guide-to-guide links on the site. As more Tier 1 guides land: keep cross-linking related guides to each other, consider a `/guides` index page once there are 3+ (so `SiteFooter`'s "Guides" link has somewhere better to go than a single specific guide), and consider linking each guide back to a more specific test configuration (e.g. deep-linking to words mode) rather than just the homepage, once/if the engine supports a URL-driven initial config.

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
6. Live countdown timer (running-state display, `live-stats-bar.tsx`) still shows raw seconds for long custom durations — the config bar's "1h 2m 3s"-style formatting wasn't extended there yet. Needs its own design pass (a fixed-width HH:MM:SS-style flip-clock is a different problem than flipping a handful of freely-resizing digits) rather than a quick bolt-on. With the duration range now running to 24h this is the most visible remaining rough edge: a 24h test currently renders a five-digit `86400` countdown.
7. ~~Live-verify the "not live-verified" items~~ — **Done 2026-09-15**; two were genuinely broken and are now fixed. See Known issues fixed.

### QA / Performance / Security
1. **A test suite exists as of 2026-09-17, expanded 2026-09-22: 80 cases, `npm test`.** No framework was added — it runs on Node 22's built-in `node:test` with `--experimental-strip-types`, so it needs **Node 22+**. `scripts/test-setup.mjs` maps the `@/*` alias (Node ignores `tsconfig` paths). Files: `src/lib/typing-engine/typing-engine.test.ts` (scoring, timing, backspace, consistency, mobile input), `src/lib/games/games-integrity.test.ts` (the anti-exploit rules) and `src/lib/lessons/lessons.test.ts` (drill/review content never leaks a disallowed key, progress gating, curriculum data integrity). Tests drive pure reducers/functions directly, never rendered components — through the UI a dropped keystroke and a missed render are indistinguishable.
2. **Coverage is deliberately narrow: scoring correctness and exploit resistance only.** There are no component/render tests and no e2e suite. That is a real gap if you start changing UI behaviour; live browser verification is still the only check on anything visual.
3. Gates, all currently clean: `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build` (**0 warnings** — a warning here previously meant the whole project was being traced into the server bundle, so treat a new one as a real finding).
4. No security concerns identified; custom text capped at 2000 chars bounds worst-case rendering cost. Note the *integrity* concern that did exist: two games were winnable without typing (see Session 2026-09-17). **Any new game must tie its win condition to correctly-typed characters, and should get a test in `games-integrity.test.ts`.**
5. `AnimatePresence` exit-unmount is now confirmed *unreliable* under rapid re-keying (see Known issues fixed) — the flip-digit case was fixed with manual lifecycle management instead. Other usages (`PageIntro`, `ResultsPanel`'s reveal, `CustomTextModal`) change far less frequently so the same failure mode is much less likely to matter, but haven't been stress-tested the same rigorous way (checking live DOM node counts, not just visual behavior) — worth doing if any of them are ever driven by fast-changing state.

### Growth / Retention / Monetization
- **Typing games shipped** (2026-09-15): Falling Words and Word Rain. More were asked for — add them as `GAME_DEFINITIONS` entries per the Games architecture notes.
- Games worth considering next, roughly by how much new engine work each needs: an **accuracy mode** (a single typo ends the run — pure tuning, no new mechanics), a **time-attack/combo rush** (clears add time — needs a clock mechanic), and a **boss/wave mode** (discrete waves rather than a continuous ramp). None are committed; ask before building.
- Games currently have **no ad slots at all** — deliberate for now, since mid-game ads would wreck the feel. The hub page is the natural place to add one if/when games get traffic.
- Still deferred by design: accounts, leaderboards, multiplayer, achievements/streaks. Games make a leaderboard more tempting, but it needs a backend — don't start one without an explicit ask.
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
2. `cd` into this directory and run the full gate: `npm test && npm run lint && npx tsc --noEmit && npm run build`. All four must be clean and the build must emit **0 warnings**. If any fail, fix that before anything else — it means something regressed since the last session, not that the gate is wrong.
3. Check `git log --oneline -10` and `git status` for what's actually landed vs. what this file claims.
4. Pick the next item based on what's actually being asked right now — this file is context for good decisions, not a queue to execute blindly without checking in with whoever you're working for.
5. When you're done, update this file's relevant section(s) — status, known issues, backlog — before ending your session, so the next session (whoever/whatever it is) doesn't start from behind.

**One habit that has repeatedly paid off here, worth adopting:** when you fix something, try to prove the fix matters by deliberately reintroducing the bug and confirming a test or a measurement catches it, then restoring. Several "fixes" in this codebase's history were verified only by reading the code and turned out to do nothing — a `motion` `animate` prop that silently no-opped, a Tailwind arbitrary value with a comma that never compiled, an `innerText` check that returned empty in a headless pane and made a working feature look broken four times running. If you cannot verify something, say so plainly rather than reporting it as done.
