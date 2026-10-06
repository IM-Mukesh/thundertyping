# Skyfall Protocol — original sound design

These files are original deterministic synthesis created for HeroTyping's Falling Words redesign. No external recordings, samples, voices, downloaded music, or generated-service assets were used.

Reproduce from the repository root with `node scripts/generate-skyfall-audio.mjs` (requires an existing `ffmpeg` with `libopus`). This is optional asset authoring tooling, not a build/runtime dependency. It overwrites only this pack's conventional filenames.

- Three 32-second stereo beds: calm, storm, and Overdrive, with harmonic pads, plucked patterns, a melodic counterline, and increasing percussion.
- Twelve short event cues, including subdued key/error feedback, crystal breaks, frost, shield impact, clean streaks, phase transitions, and endings.
- Encoding: 56 kbps target music / 40 kbps target effects, stereo Opus. Actual file sizes vary by content.
- Shared HeroTyping audio mixer, gesture-gated playback, original volume controls, owner-cancelled effects; no extra runtime AudioContext.
- Music variations load only when the game selects them. No audio is fetched on the homepage or hub by this game.

Speaker/headphone/device listening and perceptual balance still require human QA. Asset integrity and playback doubles do not establish sound quality on a real device.
