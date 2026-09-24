/**
 * The shared audio mixer: one AudioContext, three gain buses, lazy buffer
 * loading, and crossfaded music.
 *
 * Why a module-level singleton anchored on `window` rather than a plain `let`:
 * the games are loaded through `next/dynamic`, which puts each one in its own
 * chunk. A plain module-level value gets duplicated across those chunks, so two
 * games would each hold a different AudioContext and the volume slider would
 * only reach one of them. This project has already been bitten by exactly that
 * bug once, in the test-status store.
 *
 * Buses: master -> { music, sfx }. Volume is stored on the settings store and
 * pushed in, so it survives a reload and applies everywhere at once.
 */

const STATE_KEY = "__herotyping_audio__";

export type Bus = "music" | "sfx";

interface AudioState {
  ctx: AudioContext;
  master: GainNode;
  music: GainNode;
  sfx: GainNode;
  buffers: Map<string, AudioBuffer>;
  pending: Map<string, Promise<AudioBuffer | null>>;
  nowPlaying: { src: AudioBufferSourceNode; gain: GainNode; url: string } | null;
  duckDepth: number;
  /**
   * Increments on every playMusic call, including stopMusic.
   *
   * playMusic has to await the file decode, and during that gap `nowPlaying`
   * is still null -- so an unmount calling stopMusic found nothing to stop and
   * returned, then the pending decode resolved and started a track with no
   * component left to stop it. That is how music kept playing after leaving a
   * game. Any call that finds the epoch moved on while it was awaiting has
   * been superseded and must not start anything.
   */
  musicEpoch: number;
}

type WindowWithAudio = Window & { [STATE_KEY]?: AudioState };

/**
 * Browsers refuse to start an AudioContext until the user has interacted, so
 * this returns null rather than constructing one on import. Every entry point
 * is called from a click or a keystroke, by which time it succeeds.
 */
function state(): AudioState | null {
  if (typeof window === "undefined") return null;
  const w = window as WindowWithAudio;
  if (w[STATE_KEY]) return w[STATE_KEY]!;

  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;

  const ctx = new Ctor();
  const master = ctx.createGain();
  const music = ctx.createGain();
  const sfx = ctx.createGain();
  music.connect(master);
  sfx.connect(master);
  master.connect(ctx.destination);

  w[STATE_KEY] = {
    ctx,
    master,
    music,
    sfx,
    buffers: new Map(),
    pending: new Map(),
    nowPlaying: null,
    duckDepth: 0,
    musicEpoch: 0,
  };
  return w[STATE_KEY]!;
}

/** Call from any user gesture. Safe to call repeatedly. */
export function resumeAudio(): void {
  const s = state();
  if (s && s.ctx.state === "suspended") void s.ctx.resume();
}

export function setVolume(bus: Bus | "master", value: number): void {
  const s = state();
  if (!s) return;
  const node = bus === "master" ? s.master : s[bus];
  const v = Math.max(0, Math.min(1, value));
  // Ramp rather than assign: a step change in gain is an audible click.
  node.gain.setTargetAtTime(v, s.ctx.currentTime, 0.015);
}

/**
 * Fetch and decode once, then reuse. Concurrent callers share one request --
 * a wave of enemies dying on the same frame must not fire twenty fetches for
 * the same file.
 */
async function load(url: string): Promise<AudioBuffer | null> {
  const s = state();
  if (!s) return null;
  const hit = s.buffers.get(url);
  if (hit) return hit;
  const inflight = s.pending.get(url);
  if (inflight) return inflight;

  const p = (async () => {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const buf = await s.ctx.decodeAudioData(await res.arrayBuffer());
      s.buffers.set(url, buf);
      return buf;
    } catch {
      // A missing or undecodable asset must never break gameplay; the game
      // simply runs quieter.
      return null;
    } finally {
      s.pending.delete(url);
    }
  })();
  s.pending.set(url, p);
  return p;
}

/** Warm the cache ahead of time, e.g. when a game's start screen mounts. */
export function preload(urls: string[]): void {
  for (const u of urls) void load(u);
}

export interface PlayOptions {
  bus?: Bus;
  volume?: number;
  /** Semitone-ish detune in cents; randomise slightly to avoid machine-gunning. */
  detune?: number;
  loop?: boolean;
}

export async function play(url: string, opts: PlayOptions = {}): Promise<void> {
  const s = state();
  if (!s) return;
  const buf = await load(url);
  if (!buf) return;

  const src = s.ctx.createBufferSource();
  src.buffer = buf;
  src.loop = opts.loop ?? false;
  if (opts.detune) src.detune.value = opts.detune;

  const gain = s.ctx.createGain();
  gain.gain.value = opts.volume ?? 1;
  src.connect(gain);
  gain.connect(s[opts.bus ?? "sfx"]);
  src.start();
  src.onended = () => {
    src.disconnect();
    gain.disconnect();
  };
}

const MUSIC_FADE = 1.2;

/**
 * Swap the music bed, crossfading out whatever is playing. Calling it with the
 * track already playing is a no-op, so a component can call it on every render
 * without restarting the music.
 */
export async function playMusic(url: string | null): Promise<void> {
  const s = state();
  if (!s) return;
  if (s.nowPlaying?.url === url) return;

  // Claim this call as the current intent before anything can await.
  const epoch = ++s.musicEpoch;

  const previous = s.nowPlaying;
  if (previous) {
    const end = s.ctx.currentTime + MUSIC_FADE;
    previous.gain.gain.setTargetAtTime(0, s.ctx.currentTime, MUSIC_FADE / 3);
    previous.src.stop(end);
    s.nowPlaying = null;
  }
  if (!url) return;

  const buf = await load(url);
  // Superseded while the file was decoding -- by a track swap, or by the
  // stopMusic that runs when the game unmounts. Starting now would leave an
  // orphan source playing that nothing holds a reference to.
  if (!buf || epoch !== s.musicEpoch) return;

  const src = s.ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const gain = s.ctx.createGain();
  gain.gain.value = 0;
  gain.gain.setTargetAtTime(1, s.ctx.currentTime, MUSIC_FADE / 3);
  src.connect(gain);
  gain.connect(s.music);
  src.start();
  s.nowPlaying = { src, gain, url };
}

export function stopMusic(): void {
  void playMusic(null);
}

/**
 * Pull the music down while something loud happens, then let it back up.
 * Reference-counted, so overlapping ducks do not fight each other and the
 * music cannot be left permanently quiet by two effects ending out of order.
 */
export function duck(depth = 0.35, seconds = 0.6): void {
  const s = state();
  if (!s) return;
  s.duckDepth += 1;
  s.music.gain.setTargetAtTime(depth, s.ctx.currentTime, 0.05);
  window.setTimeout(() => {
    s.duckDepth -= 1;
    if (s.duckDepth <= 0) {
      s.duckDepth = 0;
      s.music.gain.setTargetAtTime(1, s.ctx.currentTime, 0.25);
    }
  }, seconds * 1000);
}

/** Frees decoded buffers. Call when leaving a game, not between runs. */
export function releaseBuffers(prefix?: string): void {
  const s = state();
  if (!s) return;
  if (!prefix) {
    s.buffers.clear();
    return;
  }
  for (const key of [...s.buffers.keys()]) {
    if (key.startsWith(prefix)) s.buffers.delete(key);
  }
}
