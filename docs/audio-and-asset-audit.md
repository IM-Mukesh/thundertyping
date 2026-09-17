# Audio lifecycle and asset weight audit

Two reports: music surviving a game you left, and a suspicion that the images
were never compressed. The first was real and is fixed. The second was not what
it looked like, but produced two genuine wins anyway.

## 1. Music kept playing after leaving a game

**Root cause: a race in `playMusic`, not a missing cleanup.**

Every game that plays music already stopped it on unmount — all four had
`return () => stopMusic()`. The failure was in the bus underneath them:

```ts
const buf = await load(url);   // <- the gap
...
s.nowPlaying = { src, gain, url };
```

`nowPlaying` is only assigned *after* the decode resolves. Leave the game during
that gap and the sequence is:

1. the game requests a track; `playMusic` starts awaiting the decode
2. the component unmounts, `stopMusic()` runs, finds `nowPlaying === null`,
   decides there is nothing to stop, and returns
3. the decode finishes and starts the track anyway

Nothing holds a reference to that source, so it plays until the tab closes —
which is exactly "I come back to the typing page and the music is still going".

**Fix.** Each call claims an epoch on the shared state before it can await, and
abandons itself if a later call (a track swap, or the unmount's `stopMusic`)
superseded it while the file was decoding. The counter lives on the
`window`-anchored singleton, not in module scope, because `next/dynamic` gives
each game its own chunk and a module-level counter would be duplicated.

**Verified by mutation.** With the guard removed, navigating home mid-decode
left `spellbound-combat.opus` playing on `/`. With it restored, the identical
sequence reports `stopped`. Re-checked on Typing Survivor, which also swaps
tracks mid-run — the other race the epoch closes.

### Other leak candidates, checked

Every game clock and animation loop was audited for cleanup. All of them have
it: `setInterval` clocks in the engine hooks clear on unmount, and the particle
canvases cancel their `requestAnimationFrame`. Two apparent misses in a raw grep
were the words "setInterval" inside comments.

The home page loads **no audio and no images at all** — 16KB of total transfer.
Nothing about the typing test can be slowed by game assets.

## 2. Image weight

The impression was that the images had never been compressed. They had:

- 141 WebP files, 13.8MB of source, median **0.097 bytes/pixel**
- every `<Image>` already carried a correct `sizes` prop
- nothing bypassed the optimizer (the only `background-image` rules are CSS
  gradients, no files)

Re-encoding the fifteen largest was tested and rejected: it recovers 5-30% while
compounding lossy artefacts on an already-lossy source (a second-generation
encode measured 28-31 dB PSNR on the alpha cut-outs, which is visible).

Delivered weight was already reasonable — game cards arrive at 18-25KB each.

### What was actually wrong

**Decorative backdrops were served at full quality.** Several large images sit
at 25-70% opacity under gradient overlays, where compression artefacts cannot be
seen. They now request `quality={45}` (with a `qualities: [45, 75]` allowlist in
`next.config.ts`, which Next 16 requires). Everything a reader actually looks at
stays at the default 75.

**One image was downloaded twice.** On a game page the blurred backdrop and the
marquee render the *same* hero file, but asked for different variants, so the
optimizer produced two. Giving the backdrop the marquee's exact `sizes` and
quality collapses them to one URL and the backdrop becomes free.

This one is worth stating plainly because the obvious move is the wrong one:
asking for a smaller, cheaper variant for a blurred backdrop *sounds* thriftier
and is strictly worse, because it downloads a second copy instead of reusing the
first.

### Result, measured on a production build

| page | before | after | |
|---|---|---|---|
| `/games` | 209 KB | **171 KB** | −18% |
| `/games/spellbound` | 100 KB | **79 KB** | −21% |
| `/` (typing test) | 16 KB | 16 KB | no images at all |

The hub hero, previously 57% of its page's image weight, went 120KB → 82KB.
The game page now makes one hero request instead of two.

## 3. Audio weight — checked, left alone

13MB of music across 26 files, but no game loads more than its own two or three
tracks. Already Opus at ~64 kbps, which is the right codec and a sensible
bitrate for looping background music; dropping to 48 kbps would save ~25% at
audible cost on sustained tones. Not changed.

`assets-raw/` is 596MB of uncompressed source art on disk. It is gitignored and
excluded from build tracing, so it never deploys — it costs disk, not bandwidth.

## Verification

```bash
npm test          # 49 passed
npm run lint      # clean
npx tsc --noEmit  # clean
npm run build     # passes
```
