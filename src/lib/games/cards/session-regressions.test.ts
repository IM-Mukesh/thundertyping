import assert from "node:assert/strict";
import { test } from "node:test";
import { createGameSession } from "@/lib/games/cards/use-game-session";

test("active duration counts visible combat only, including final partial tick", () => {
  let time = 0;
  const run = createGameSession({ phase: "select", elapsedMs: 0 }, "combat", () => time, () => false);
  time = 1000;
  run.replace({ phase: "combat", elapsedMs: 0 });
  time = 2257;
  run.setPaused(true);
  assert.equal(run.getSnapshot().state.elapsedMs, 1257);
  time = 9000;
  run.setPaused(false);
  time = 9500;
  run.update((s) => ({ ...s, phase: "reward" }));
  time = 15000;
  run.update((s) => ({ ...s, phase: "combat" }));
  time = 15013;
  run.update((s) => ({ ...s, phase: "victory" }));
  assert.equal(run.getSnapshot().state.elapsedMs, 1770);
  time = 20000;
  run.update((s) => s);
  assert.equal(run.getSnapshot().state.elapsedMs, 1770);
});

test("pause and hidden-tab gates block commands, RNG and effects in every phase", () => {
  let hidden = false;
  let calls = 0;
  const run = createGameSession({ phase: "combat", elapsedMs: 0 }, "combat", () => 0, () => hidden);
  const command = (s: { phase: string; elapsedMs: number }) => { calls++; return s; };
  for (const phase of ["combat", "reward", "shop", "event", "draft"]) {
    run.replace({ phase, elapsedMs: 0 });
    run.setPaused(true);
    run.update(command);
    hidden = true;
    run.setPaused(false);
    assert.equal(run.getSnapshot().paused, true);
    run.update(command);
    hidden = false;
    run.setPaused(false);
    run.update(command);
    // Re-reading/subscribing (including Strict Mode's subscribe replay) cannot execute a command.
    run.getSnapshot(); run.getSnapshot();
    const unsubscribe = run.subscribe(() => {});
    unsubscribe();
  }
  assert.equal(calls, 5);
});

test("two same-turn commands see the latest snapshot rather than a stale render", () => {
  const run = createGameSession({ phase: "combat", elapsedMs: 0, energy: 1 }, "combat", () => 0, () => false);
  let effects = 0;
  const cast = (s: typeof run.current.current) => {
    if (!s.energy) return s;
    effects++;
    return { ...s, energy: s.energy - 1 };
  };
  run.update(cast);
  run.update(cast);
  assert.equal(effects, 1);
  assert.equal(run.current.current.energy, 0);
});

test("tab hide captures the active partial tick and requires explicit visible resume", () => {
  let hidden = false;
  let time = 0;
  const run = createGameSession({ phase: "playing", elapsedMs: 0 }, "playing", () => time, () => hidden);
  time = 127;
  hidden = true;
  let commands = 0;
  run.update((s) => { commands++; return s; });
  assert.equal(commands, 0, "hidden input is blocked even before the visibility handler runs");
  run.pauseWhenHidden();
  assert.equal(run.getSnapshot().paused, true);
  assert.equal(run.getSnapshot().state.elapsedMs, 127);
  time = 9999;
  hidden = false;
  run.pauseWhenHidden();
  assert.equal(run.getSnapshot().paused, true);
  run.setPaused(false);
  time = 10010;
  run.update((s) => ({ ...s, phase: "over" }));
  assert.equal(run.getSnapshot().state.elapsedMs, 138);
});
