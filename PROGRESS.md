# ThunderTyping — Project State & Roadmap

**Read this file first.** It exists so any AI agent or developer (not just the one who wrote it) can pick up this project cold and be productive immediately, without re-asking the human basic questions about scope, stack, or decisions already made. Keep it updated as the source of truth for "what's done" and "what's next." If you finish work, update the relevant sections before ending your session.

## What this project is

A typing-speed-test website (MonkeyType-style) aiming for large organic Google traffic, monetized via Google AdSense. Long-term ambition: "world's best typing platform," but development proceeds in deliberate phases — **do not jump ahead to multiplayer/accounts/backend/games until explicitly prioritized below.**

- **Brand name**: ThunderTyping
- **Current phase**: Frontend-only MVP. No backend, no accounts, no database. Everything persists to `localStorage`.
- **Language**: English only (architecture supports adding more later, see `src/data/words/` and `src/data/quotes/`).
- **Design**: Minimalist dark-first theme (light theme also implemented), MonkeyType-inspired — the typing area is the visual star, chrome stays out of the way.

## Tech stack & conventions

- Next.js 16 (App Router, Turbopack), React 19, TypeScript (strict), Tailwind CSS v4 (theming via CSS variables in `globals.css`, **no `tailwind.config.ts`** — Tailwind v4 doesn't need one here).
- `zustand` (+ `persist` middleware) for durable, low-frequency state (user settings). `useReducer` for the high-frequency typing engine state (not zustand — see Architecture).
- `motion` (formerly Framer Motion) for animation — imported from `motion/react`, **not** the bare `motion` package root (that resolves to the vanilla-JS DOM API, not React components/`layoutId`).
- `lucide-react` for icons, `clsx` (wrapped as `cn()` in `src/lib/utils/cn.ts`) for conditional classnames.
- `src/` directory, `@/*` path alias to `./src/*`.
- Conventions mirrored from a sibling project at `../Git-Review` (Next.js 16.3.4, same Tailwind v4 pattern) for consistency, though the two projects are unrelated products.
- Git repo initialized at the project root (was previously un-versioned). Commit as you go — meaningful, scoped commits, not one giant dump.
- Dev server: `.claude/launch.json` in the **sibling `Git-Review` directory** has a `"thundertyping"` entry using `npm --prefix ../thundertyping run dev -- -p 3002` (the harness's `preview_start` tool reads `launch.json` from the primary working directory, which is `Git-Review`, not this repo — this is an environment quirk, not a design choice). In practice a dev server for this project may already be running on port 3001 or 3002 via an external auto-restart supervisor in this environment — check `ss -ltnp | grep 300` before assuming you need to start one.

## Current status (as of 2026-09-14)

### Done and verified working (manually tested via browser automation — typed real words, confirmed char-by-char coloring, word advancement, caret positioning, timer countdown, auto-finish, personal-best recording, restart)
- Project scaffold, theming (dark/light via `data-theme` attribute + CSS vars), header/footer, ad-slot placeholders (footer + post-results, not near the typing area).
- Full typing engine (`src/lib/typing-engine/`): time mode (15/30/60/120s, infinite word regeneration), words mode (10/25/50/100), quote mode (curated public-domain quotes, short/medium/long), custom text mode, punctuation/numbers injection toggles.
- Per-character correct/incorrect/extra/pending rendering, animated caret (via `motion` `layoutId` shared-element transition — not manual rect math), smooth 3-line word-window scrolling.
- Live stats while running (countdown or word progress + live WPM), results screen (net WPM, raw WPM, accuracy, consistency, char breakdown, personal-best badge).
- Personal bests persisted per mode+config in `localStorage` (time/words modes only — quote/custom aren't comparable run-to-run).
- Settings (mode, duration, word count, quote length, punctuation, numbers, theme) persisted via zustand.
- SEO scaffolding: per-route metadata, `sitemap.ts`, `robots.ts`, JSON-LD `WebApplication` schema on the homepage, SSR'd `<h1>`/intro copy with the interactive engine as a client-only island (see "Known issues fixed" below for why it's client-only).
- Build (`npm run build`) and lint (`npm run lint`) both pass clean.

### Known issues fixed this session (context for why the code looks the way it does)
- **Hydration mismatch**: the engine's initial word list uses `Math.random()`. If the interactive `<TypingTest>` component were server-rendered like a normal client component, the server's random words would differ from the client's, corrupting hydration. Fixed by wrapping it in `next/dynamic(..., { ssr: false })` via `src/components/typing-test/typing-test-client.tsx`. The static shell (h1, intro, JSON-LD) around it still renders server-side for SEO.
- **Double word-regeneration on mount**: React Strict Mode (on by default in Next.js dev) double-invokes effects, which defeated a naive `useRef(true)` "skip first run" guard in `typing-test.tsx`. Fixed by comparing the memoized `config` object by reference instead of using a boolean flag (see the `lastAppliedConfigRef` pattern in `typing-test.tsx`) — this is the robust pattern, not a hack; keep it if you touch that file.
- If you see a "space key" not registering during **automated browser testing** in this environment, that's a known quirk of the browser automation tool used in this session (its `key` action for `"space"` dispatches a malformed event with empty `key`/`code`/`which`) — not an app bug. Verified via `Tab` (which dispatches correctly) and via manually constructing a proper `KeyboardEvent`. Real users pressing a physical spacebar are unaffected.

### Not built yet (by design, not oversight)
- No settings modal (Escape currently just blurs the input). Theme is reachable via the header toggle. A settings modal (sound toggle, more themes) is a reasonable near-term addition once there's more than 2 themes / real sound assets.
- No sound effects (keystroke sounds) — `soundEnabled` exists in the settings store but nothing plays yet.
- No `/about` or `/privacy` pages yet, even though they're referenced in the footer nav and `sitemap.ts` — **these will 404 until built.** `/privacy` in particular is a blocker for Google AdSense approval later, not just SEO nicety.
- No custom favicon/OG image (still Next.js defaults minus the removed sample SVGs).
- No real AdSense integration — `AdSlot` component (`src/components/layout/ad-slot.tsx`) renders placeholders until `NEXT_PUBLIC_ADSENSE_CLIENT_ID` is set; wiring a real AdSense account is an external action requiring the human (account creation/approval), not something an agent can do.

## Architecture notes (read before modifying the engine)

- **Engine state** (`src/lib/typing-engine/use-typing-engine.ts`) is a `useReducer`, not zustand — it mutates on every keystroke (high-frequency, subtree-local), whereas zustand (`src/lib/persistence/settings-store.ts`) holds durable, low-frequency, cross-cutting state (settings, theme). Don't move engine state into zustand; don't move settings into the reducer.
- **Keystroke capture** is a real, focused, offscreen `<input>` (`hidden-input.tsx`), not raw `keydown` — needed for IME composition and mobile virtual keyboards. Space/Tab/Escape are intercepted in `onKeyDown`.
- **`correctKeystrokes`/`incorrectKeystrokes` are monotonic** — never decremented by backspace. This is intentional (standard typing-test convention: a mistyped-then-corrected character still counts as effort for raw WPM). Don't "fix" this into a diff-based recount.
- **`charTally`** (correct/incorrect/extra/missed) is accumulated incrementally at word-commit/finish time, not derived by re-scanning `wordStates` at the end — this was a deliberate simplification vs. the original plan's "prune old words from memory" idea. At realistic max test length (120s time mode, worst case a few hundred words), unpruned `wordStates` is cheap enough that pruning would add reducer complexity for no real benefit. If a future mode allows much longer tests, revisit this.
- **One engine, all four modes** — time/words/quote/custom share the same reducer and rendering path, diverging only in word-supply strategy (infinite-regenerating vs. fixed) and completion condition (timer vs. last-word-exact-match). Don't fork into separate engines per mode.
- **Word/quote data is fully static** (`src/data/words/english-1k.ts` — actually ~360 words, not literally 1000; `src/data/quotes/english-quotes.ts` — ~26 public-domain quotes). Adding a language later means adding a new data file + extending the `mode`/language config, not rewriting the engine.

## Prioritized backlog

Organized by lens, roughly in priority order within each. This reflects one research pass (SEO/competitive) plus direct product judgment — re-prioritize as real usage data appears, but there is none yet (pre-launch, zero traffic).

### Product / Architecture (do these soon — they unblock everything else)
1. Build `/about` and `/privacy` pages — currently linked but 404. Privacy policy is a hard requirement before ever applying for AdSense.
2. Register a real domain and update `NEXT_PUBLIC_SITE_URL` / `src/lib/seo/constants.ts` (currently a placeholder `https://thundertyping.com`).
3. Add a proper favicon + OG image (currently Next.js defaults).

### Frontend / UX
1. Settings modal (sound toggle, additional themes) — low priority until there's more than a stub sound system.
2. Keyboard-layout-aware caret/character rendering isn't needed yet (English QWERTY assumed).
3. Mobile UX pass: verify the offscreen `<input>` correctly triggers the virtual keyboard and doesn't cause iOS zoom (font-size is already set to 16px on the input for this reason, but hasn't been tested on a real mobile device/emulator).
4. Accessibility: add `aria-live` regions for stats updates (partially done — `LiveStatsBar` has `aria-live="polite"`), audit keyboard-trap risk on the custom hidden-input widget, verify screen-reader behavior isn't broken by the visually-hidden input pattern.

### SEO / Organic Growth
Full competitive/keyword research was done this session (see condensed summary below). Key strategic takeaways:
- **Don't chase head terms** ("typing test", "wpm test") pre-launch — zero domain authority, dominated by Monkeytype/10FastFingers/TypingClub. Build long-tail + topical authority first.
- **Real product-level wedge**: Monkeytype-grade UX + genuinely good **mobile** support (NitroType/TypeRacer both have poor mobile UX — a gap) + light beginner guidance + real accessibility, wrapped in a legitimate content layer Monkeytype doesn't bother building (it's donation-funded, no SEO incentive).
- **Danger zone**: Google's "scaled content abuse" policy (active, enforced through 2026) specifically calls out templated duration/variant/language page patterns as a common abuse example **in this exact niche**. Any programmatic page set (e.g. `/typing-test/1-minute`, `/typing-test/5-minute`) needs genuinely differentiated copy per page, not keyword-swapped templates, or it risks tanking the whole domain's trust under Google's site-wide helpful-content evaluation.
- **INP (Core Web Vitals) is unusually high-stakes here** — the entire product IS keypress-to-render latency, not just an SEO checkbox. Keep keydown handling lightweight, avoid blocking work per keystroke, keep AdSense script loading isolated from the typing input path once real ads are added.
- Priority content build order once `/about`/`/privacy` exist: (1) a couple of duration-variant pages with real differentiated copy, (2) genuinely useful informational guides ("what's a good WPM for X job", "how to improve typing speed", touch-typing basics) to build topical authority + internal linking, (3) job/exam-context long-tail pages (recurring, lower-competition demand), (4) shareable/downloadable results certificate (Ratatype's certificate feature is a proven, useful pattern for résumé/job-application use), (5) non-English expansion — flagged as a strong future opportunity, especially Hindi + Indian government-exam typing-test queries (recurring, well-defined demand), but out of scope for the English MVP.
- Full research report (competitor breakdown, keyword clustering, sourcing) is preserved in this session's transcript; re-run this research periodically since the space evolves (SERP composition, AdSense policy, Core Web Vitals thresholds all shift).

### QA / Performance / Security
1. No automated tests exist yet (no test framework installed). Given the engine's reducer is pure functions + a thin hook, it's a good candidate for unit tests (word-generator punctuation/number injection rates, stats.ts formulas, reducer transitions) if/when a test framework is added — don't add one speculatively without deciding on Vitest/Jest first.
2. Lint and build are the only current automated gates (`npm run lint`, `npm run build`) — both clean as of this writing.
3. No security concerns identified (no user input reaches a backend, no secrets in the codebase, `dangerouslySetInnerHTML` usage is limited to the JSON-LD script and the theme-init script, both with fully controlled/serialized content, not user input).

### Growth / Retention / Monetization
- Deferred by design: accounts, leaderboards, multiplayer, typing games, achievements/streaks. Don't build these until the MVP has real usage data or the human explicitly asks — building retention features for zero users is premature.
- AdSense integration itself requires the human to create/verify the AdSense account — an agent cannot do this. The `AdSlot` component is ready to receive a real client ID via env var whenever that happens.

## Operating model notes (for whichever agent picks this up)

This project was set up under an ambitious "operate as an autonomous 5-lens product organization" instruction from the human (Product/Architecture, Frontend/UX, SEO, QA, Growth). Important honesty notes carried forward from that conversation, so you don't re-promise things that aren't real:

- **There is no standing, always-on scheduler running this project every N hours.** Any such cadence has to be explicitly configured via this platform's scheduled-task tooling and confirmed with the human first (it's a recurring background automation touching their account — that requires opt-in, not silent setup). Check whether one exists before claiming "the next cycle is scheduled."
- **A local dev process cannot run while the machine is off or the harness isn't open.** Don't imply otherwise.
- Treat "I built this" / "I verified this" / "I recommend this" / "this is blocked on the human" as distinct claims — don't blur them. This file tries to model that: the "Done and verified" section above was actually exercised in a browser, not just written and assumed correct.
- Prefer fixing a small number of real, high-value things well over generating a large volume of speculative work (pages, features, tests) to look productive. The SEO research above explicitly flags that this exact niche is a magnet for exactly that failure mode (thin programmatic content) — don't repeat it.

## How to resume work

1. Read this file.
2. `cd` into this directory, run `npm run lint && npm run build` to confirm nothing regressed.
3. Check `git log` for what's actually landed vs. what this file claims (this file can drift — trust git + the running app over stale prose if they disagree, and fix the drift here when you notice it).
4. Pick the next item from the backlog above based on what the human is asking for right now — this file is context, not a queue to blindly execute without checking in.
