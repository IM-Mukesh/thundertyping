import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createFallingWordsAudio,
  FALLING_WORDS_AUDIO,
  selectFallingWordsCues,
  type FallingWordsAudioState,
} from "@/lib/games/falling-words/audio";

function audioState(overrides: Partial<FallingWordsAudioState> = {}): FallingWordsAudioState {
  return {
    status: "running",
    words: [],
    cleared: 0,
    combo: 0,
    missed: 0,
    phase: 1,
    overdriveMs: 0,
    ...overrides,
  };
}

describe("Falling Words audio transition model", () => {
  it("selects distinct cues for a compound gameplay transition", () => {
    const before = audioState({ words: [{ id: 4 }] });
    const after = audioState({
      words: [{ id: 4 }, { id: 5 }],
      cleared: 1,
      combo: 1,
      phase: 2,
      missed: 1,
      overdriveMs: 7000,
    });

    assert.deepEqual(selectFallingWordsCues(before, after), [
      "spawn",
      "clear",
      "phase",
      "miss",
      "overdrive",
    ]);
  });

  it("announces combos only at five-word boundaries, not on every clear", () => {
    assert.deepEqual(
      selectFallingWordsCues(audioState({ combo: 4 }), audioState({ combo: 5 })),
      ["combo"],
    );
    assert.deepEqual(
      selectFallingWordsCues(audioState({ combo: 5 }), audioState({ combo: 6 })),
      [],
    );
    assert.deepEqual(
      selectFallingWordsCues(audioState({ combo: 9 }), audioState({ combo: 12 })),
      ["combo"],
    );
  });

  it("does not announce a phase regression, re-enter a live overdrive, or replay an ending", () => {
    assert.deepEqual(
      selectFallingWordsCues(
        audioState({ phase: 3, overdriveMs: 2000, status: "running" }),
        audioState({ phase: 1, overdriveMs: 1000, status: "running" }),
      ),
      [],
    );

    const running = audioState();
    const over = audioState({ status: "over", outcome: "defeat" });
    assert.deepEqual(selectFallingWordsCues(running, over), ["defeat"]);
    assert.deepEqual(selectFallingWordsCues(over, over), []);
  });

  it("supports explicit non-combo milestones and a victory outcome", () => {
    assert.deepEqual(
      selectFallingWordsCues(
        audioState({ milestone: 2 }),
        audioState({ status: "victory", outcome: "victory", milestone: 3 }),
      ),
      ["milestone", "victory"],
    );
  });

  it("bounds new-word scanning and ignores a duplicate controller snapshot", () => {
    const before = audioState({ words: Array.from({ length: 64 }, (_, id) => ({ id })) });
    const after = audioState({
      words: Array.from({ length: 64 }, (_, id) => ({ id: id + 1 })),
      cleared: 1,
      combo: 5,
      phase: 2,
      missed: 1,
      overdriveMs: 1,
      status: "over",
    });
    const controller = createFallingWordsAudio();
    try {
      const first = controller.transition(before, after, false);
      assert.ok(first.length <= 9);
      assert.deepEqual(controller.transition(before, after, false), []);
    } finally {
      controller.stop();
    }
  });

  it("uses distinct original files for the music beds and cues", () => {
    const urls = [FALLING_WORDS_AUDIO.music, FALLING_WORDS_AUDIO.storm, FALLING_WORDS_AUDIO.overdrive, ...Object.values(FALLING_WORDS_AUDIO.cues)];
    assert.equal(new Set(urls).size, urls.length);
    assert.ok(urls.every((url) => url.startsWith("/audio/") && url.endsWith(".opus")));
  });
});
