import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { play, playMusic, stopMusic } from "@/lib/audio/audio-bus";

/** Explicit Web Audio/fetch doubles; no private env or network input. */
function audioHarness() {
  const originalFetch = globalThis.fetch;
  const originalWindow = globalThis.window;
  let starts = 0, stops = 0, sourceDisconnects = 0, gainDisconnects = 0;
  const sources: { onended?: () => void }[] = [];
  const gain = () => ({ gain: { value: 0, setTargetAtTime() {} }, connect() {}, disconnect() { gainDisconnects++; } });
  class Context {
    currentTime = 1;
    state = "running";
    destination = {};
    createGain = gain;
    decodeAudioData = async () => ({});
    createBufferSource() {
      const source = { buffer: null, loop: false, detune: { value: 0 }, onended: undefined as (() => void) | undefined,
        connect() {}, start() { starts++; }, stop() { stops++; source.onended?.(); }, disconnect() { sourceDisconnects++; } };
      sources.push(source); return source;
    }
  }
  globalThis.window = { AudioContext: Context } as unknown as Window & typeof globalThis;
  globalThis.fetch = async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) }) as Response;
  return { sources, counts: () => ({ starts, stops, sourceDisconnects, gainDisconnects }), restore: () => { globalThis.fetch = originalFetch; globalThis.window = originalWindow; } };
}

describe("shared audio bus owner cancellation (opt-in)", () => {
  it("continues silently when the browser rejects AudioContext creation", async () => {
    const h = audioHarness();
    try {
      window.AudioContext = class { constructor() { throw new Error("Audio is unavailable"); } } as unknown as typeof AudioContext;
      await play("/silent.opus");
      await playMusic("/silent-music.opus");
      assert.equal(h.counts().starts, 0);
    } finally { h.restore(); }
  });
  it("keeps legacy one-shot calls unchanged and disconnects natural endings", async () => {
    const h = audioHarness();
    try {
      await play("/legacy.opus");
      assert.equal(h.counts().starts, 1);
      h.sources[0].onended?.();
      assert.equal(h.counts().sourceDisconnects, 1);
      assert.equal(h.counts().gainDisconnects, 1);
    } finally { h.restore(); }
  });
  it("does not fetch or start an already-aborted owner cue", async () => {
    const h = audioHarness();
    try {
      const controller = new AbortController(); controller.abort();
      let fetches = 0;
      globalThis.fetch = async () => { fetches++; throw new Error("should not fetch"); };
      await play("/cancelled.opus", { signal: controller.signal });
      assert.equal(fetches, 0);
      assert.equal(h.counts().starts, 0);
    } finally { h.restore(); }
  });
  it("does not start a pending decode after the owning game exits", async () => {
    const h = audioHarness();
    try {
      let finish!: (response: Response) => void;
      globalThis.fetch = () => new Promise<Response>((resolve) => { finish = resolve; });
      const controller = new AbortController();
      const pending = play("/pending.opus", { signal: controller.signal });
      controller.abort();
      finish({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) } as Response);
      await pending;
      assert.equal(h.counts().starts, 0);
    } finally { h.restore(); }
  });
  it("stops and disconnects active owner cues once, even after natural ending", async () => {
    const h = audioHarness();
    try {
      const controller = new AbortController();
      await play("/active.opus", { signal: controller.signal });
      controller.abort(); controller.abort();
      h.sources[0].onended?.();
      assert.deepEqual(h.counts(), { starts: 1, stops: 1, sourceDisconnects: 1, gainDisconnects: 1 });
    } finally { h.restore(); }
  });
  it("cleans crossfaded music nodes and ignores cancelled pending music loads", async () => {
    const h = audioHarness();
    try {
      await playMusic("/music.opus");
      stopMusic();
      assert.equal(h.counts().sourceDisconnects, 1);
      assert.equal(h.counts().gainDisconnects, 1);
      let finish!: (response: Response) => void;
      globalThis.fetch = () => new Promise<Response>((resolve) => { finish = resolve; });
      const pending = playMusic("/slow-music.opus");
      stopMusic();
      finish({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) } as Response);
      await pending;
      assert.equal(h.counts().starts, 1);
    } finally { h.restore(); }
  });
});
