# HeroTyping

> **Type · Play · Improve** — Fast, distraction-free typing speed test, retro arcade games, structured touch-typing curriculum, and comprehensive keyboarding guides.

Live: [https://herotyping.com](https://herotyping.com)

---

## Features

- **Typing Engine**: Zero-lag, client-side scoring engine with Monkeytype-parity mechanics (Net WPM, Raw WPM, Accuracy, Consistency, and full character audit breakdown).
- **9 Arcade Typing Games**: Retro arcade typing games including *Typebound: The Last Dawn*, *Type Before Death*, *Ghost Racer*, *Fruit Fury*, *Falling Words*, *Word Rain*, *Word Blaster*, *Boss Battle*, and *Combo Rush*.
- **Structured Curriculum**: 28 interactive touch-typing lessons with visual keyboard and real-time finger mapping.
- **Adaptive Vocabulary Practice**: 1,300 curated words across Easy, Medium, and Hard tiers with built-in speech synthesis pronunciation.
- **Comprehensive Guides**: 50 research-backed guides covering ergonomics, layouts, typing tests, benchmarks, and accessibility.
- **Player Profile & Achievements**: XP progression, level milestones, daily streaks, and arcade achievements stored locally for guests, with optional cloud sync for signed-in accounts.
- **Multi-Theme Support**: Dark, Light, Midnight, Forest, and Sunset themes built with CSS color variables and high contrast.
- **Zero Distraction & Privacy-First**: Instant guest mode with no mandatory sign-up required (stored locally in `localStorage`). Optional authenticated account allows multi-device progress sync. Anti-distraction layout fades away while actively typing.

---

## Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **UI Library**: [React 19](https://react.dev/)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Motion](https://motion.dev/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Test Runner**: Node.js built-in `node:test` (`--experimental-strip-types`)

---

## Prerequisites

- **Node.js**: `22.x` or higher (required for Node test runner and TypeScript type-stripping)
- **npm**: `10.x` or higher

---

## Getting Started

1. **Clone and install dependencies**:
   ```bash
   git clone https://github.com/IM-Mukesh/thundertyping.git
   cd thundertyping
   npm ci
   ```

2. **Run development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## Quality & Verification Commands

All checks must pass clean before production deployment:

```bash
# Run unit tests (scoring, anti-exploit, vocabulary, sitemap, persistence)
npm test

# Check linting rules
npm run lint

# TypeScript static type check
npm run typecheck

# Production build and static page prerender
npm run build
```

---

## Environment Variables

Copy `.env.example` to `.env.local` to override environment settings:

| Variable | Description | Default |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical public URL used for SEO, OpenGraph, sitemap.xml | `https://herotyping.com` |
| `NEXT_PUBLIC_ADSENSE_CLIENT_ID` | Google AdSense publisher ID (`ca-pub-XXXXXXXX`). Ads remain disabled if unset. | _(empty)_ |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Contact email displayed on Privacy and Terms pages | `hello@herotyping.com` |

> **Note**: Public variables prefixed with `NEXT_PUBLIC_` are evaluated and embedded at build time by Next.js.

---

## Architecture Overview

- `src/app/`: Next.js App Router pages, metadata routes (`sitemap.ts`, `robots.ts`, `manifest.ts`), and static route definitions.
- `src/components/typing-test/`: Live typing test client, countdown timers, results graphs, and modal controls.
- `src/components/games/`: Canvas and DOM-based arcade games client and individual game mechanics.
- `src/components/layout/`: Responsive header, mobile navigation drawer, theme switchers, and layout containers.
- `src/lib/typing-engine/`: Core pure typing reducer, keystroke auditing, WPM statistics, and countdown formatters.
- `src/lib/persistence/`: Defensive browser `localStorage` stores with strict validation against corrupted data.
- `src/lib/profile/`: XP, streaks, level calculation, and cross-game achievement verification.

---

## License

Private and proprietary. All rights reserved.
