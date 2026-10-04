import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { setCurrentUserId } from "@/lib/auth/current-user";
import { createGhostCourse, ghostTextKey } from "@/lib/games/racer/course";
import { GhostRecorder, GHOST_STORAGE_KEY, MAX_GHOST_COURSES, MAX_GHOST_SAMPLES, MAX_GHOST_STORAGE_BYTES, MAX_GHOSTS_PER_COURSE,
  ghostForRematch, ghostIndexAt, isPacer, isValidGhostRun, localGhostStore, pacerGhost, personalBestFor, readBestGhost, type GhostRun } from "@/lib/games/racer/ghost-store";
import { raceOutcome } from "@/lib/games/racer/progress";

const text = "hello world";
const textKey = ghostTextKey("practice:test", text);

function run(durationMs = 10_000, ownerId: string | null = null): GhostRun {
  const recorder = new GhostRecorder();
  recorder.start(0);
  recorder.mark(text.length, durationMs);
  const recorded = recorder.finish({ textKey, ownerId, totalChars: text.length, name: "You", accuracy: 100 }, durationMs);
  assert.ok(recorded);
  return recorded;
}

afterEach(() => { setCurrentUserId(null); window.localStorage.clear(); });

describe("Ghost Racer course identity", () => {
  it("generates the same UTC daily text independently of Math.random", (context) => {
    const random = context.mock.method(Math, "random", () => 0);
    const first = createGhostCourse("daily", "2026-10-04");
    random.mock.mockImplementation(() => 0.999);
    const second = createGhostCourse("daily", "2026-10-04");
    assert.deepEqual(first, second);
    assert.equal(first.words.length, 30);
    assert.notEqual(first.text, createGhostCourse("daily", "2026-10-05").text);
    assert.equal(random.mock.callCount(), 0);
  });

  it("keeps practice repeatable, with keys scoped to exact content and rules", () => {
    assert.deepEqual(createGhostCourse("practice", "2026-10-04"), createGhostCourse("practice", "2026-10-05"));
    assert.notEqual(ghostTextKey("same", "cat"), ghostTextKey("same", "dog"));
    assert.notEqual(ghostTextKey("same", "cat", "rules-1"), ghostTextKey("same", "cat", "rules-2"));
  });
});

describe("Ghost replay validation and ownership", () => {
  it("rejects malformed data, illegal times/positions and incomplete endpoints before playback", async () => {
    const valid = run();
    assert.equal(isValidGhostRun(valid), true);
    const invalid: unknown[] = [null, [], {}, { ...valid, version: 2 }, { ...valid, ownerId: undefined },
      { ...valid, durationMs: 1.5 }, { ...valid, durationMs: Infinity }, { ...valid, wpm: NaN },
      { ...valid, accuracy: 101 }, { ...valid, textKey: "legacy:length-only" }, { ...valid, samples: null },
      { ...valid, samples: [{ t: 0, i: 0 }, { t: 10000, i: 10 }] },
      { ...valid, samples: [{ t: 0, i: 1 }, { t: 10000, i: 11 }] },
      { ...valid, samples: [{ t: 0, i: 0 }, { t: 5000, i: 99 }, { t: 10000, i: 11 }] },
      { ...valid, samples: [{ t: 0, i: 0 }, { t: 5000, i: 1.5 }, { t: 10000, i: 11 }] },
      { ...valid, samples: [{ t: 0, i: 0 }, { t: 5000, i: 1 }, { t: 5000, i: 11 }] },
      { ...valid, samples: [{ t: 0, i: 0 }, { t: 5000, i: 1 }, { t: 4000, i: 11 }] },
      { ...valid, samples: Array.from({ length: MAX_GHOST_SAMPLES + 1 }, () => ({ t: 0, i: 0 })) }];
    for (const bad of invalid) assert.equal(isValidGhostRun(bad), false);
    window.localStorage.setItem(GHOST_STORAGE_KEY, JSON.stringify(invalid));
    assert.deepEqual(await localGhostStore.list(textKey), []);
    window.localStorage.setItem(GHOST_STORAGE_KEY, "{".repeat(MAX_GHOST_STORAGE_BYTES + 1));
    assert.equal(readBestGhost(textKey, text.length), null);
  });

  it("isolates guests and accounts, rejects a previous owner's delayed save, and clears only this owner", async () => {
    const guest = run();
    assert.equal(await localGhostStore.save(guest), true);
    setCurrentUserId("account-a");
    assert.equal(readBestGhost(textKey, text.length), null);
    const alice = run(9000, "account-a");
    await localGhostStore.save(alice);
    setCurrentUserId("account-b");
    assert.equal(readBestGhost(textKey, text.length), null);
    assert.equal(await localGhostStore.save(alice), false);
    await localGhostStore.save(run(8000, "account-b"));
    await localGhostStore.clear();
    assert.equal(readBestGhost(textKey, text.length), null);
    setCurrentUserId("account-a");
    assert.equal(readBestGhost(textKey, text.length)?.id, alice.id);
    setCurrentUserId(null);
    assert.equal(readBestGhost(textKey, text.length)?.id, guest.id);
    assert.equal(readBestGhost(textKey, text.length + 1), null);
  });

  it("bounds all courses and per-course runs and deduplicates finish ids", async () => {
    for (let i = 0; i < MAX_GHOST_COURSES + 5; i++) {
      const candidate = { ...run(), textKey: ghostTextKey(`practice:${i}`, text) };
      await localGhostStore.save(candidate);
    }
    for (let i = 0; i < MAX_GHOSTS_PER_COURSE + 5; i++) await localGhostStore.save(run(10_000 + i));
    const candidate = run(9000);
    await localGhostStore.save(candidate);
    await localGhostStore.save(candidate);
    const stored = await localGhostStore.list(textKey);
    assert.equal(stored.length, MAX_GHOSTS_PER_COURSE);
    assert.equal(stored.filter((r) => r.id === candidate.id).length, 1);
    assert.equal(readBestGhost(textKey, text.length)?.durationMs, 9000);
    const raw = window.localStorage.getItem(GHOST_STORAGE_KEY)!;
    const all = JSON.parse(raw) as GhostRun[];
    assert.ok(new Set(all.map((r) => r.textKey)).size <= MAX_GHOST_COURSES);
    assert.ok(raw.length <= MAX_GHOST_STORAGE_BYTES);
  });
});

describe("Ghost Racer finish, rematch and active elapsed time", () => {
  it("lets a losing player finish and stores a first baseline slower than 45 WPM", async () => {
    const course = createGhostCourse("practice");
    const pacer = pacerGhost(course.textKey, course.text.length, 45);
    assert.equal(raceOutcome(course.text.length - 1, course.text.length, pacer.durationMs * 2, pacer.durationMs), "racing");
    const recorder = new GhostRecorder();
    recorder.start(0);
    const duration = Math.round(course.text.length * 12_000 / 20);
    recorder.mark(course.text.length, duration);
    const baseline = recorder.finish({ textKey: course.textKey, ownerId: null, totalChars: course.text.length, name: "You", accuracy: 100 }, duration)!;
    assert.equal(raceOutcome(course.text.length, course.text.length, duration, pacer.durationMs), "lost");
    assert.equal(baseline.wpm, 20);
    assert.equal(await localGhostStore.save(baseline), true);
    assert.equal(readBestGhost(course.textKey, course.text.length)?.id, baseline.id);
    assert.equal(raceOutcome(11, 11, 1000, 1000), "tie");
  });

  it("uses the new PB immediately on rematch even when storage is stale or unavailable", () => {
    const stale = run(20_000);
    const fresh = run(10_000);
    const best = personalBestFor(stale, fresh);
    assert.equal(best, fresh);
    assert.equal(ghostForRematch(textKey, text.length, null, best, stale, 30), fresh);
    assert.equal(ghostForRematch(textKey, text.length, null, best, null, 30), fresh);
    assert.equal(ghostForRematch(textKey, text.length, null, best, run(30_000), 30), fresh);
    assert.ok(isPacer(ghostForRematch(textKey, text.length, "another-account", best, stale, 20)));
    assert.ok(isPacer(ghostForRematch(ghostTextKey("practice:other", text), text.length, null, best, stale, 20)));
  });

  it("reports a failed replay write rather than claiming browser persistence", async (context) => {
    context.mock.method(window.localStorage, "setItem", () => { throw new Error("quota"); });
    assert.equal(await localGhostStore.save(run()), false);
    assert.equal(readBestGhost(textKey, text.length), null);
  });

  it("freezes and rebases both clock and recorded sample time across repeated pauses", () => {
    const recorder = new GhostRecorder();
    recorder.start(100);
    recorder.mark(5, 1100);
    recorder.pause(1100);
    recorder.pause(2100); // repeated visibility/blur events cannot move pause origin
    assert.equal(recorder.elapsed(10_000), 1000);
    recorder.mark(8, 10_000); // input while paused is ignored
    recorder.resume(11_100);
    recorder.mark(8, 12_100);
    recorder.pause(12_100);
    recorder.resume(22_100);
    recorder.mark(11, 23_100);
    const finished = recorder.finish({ textKey, ownerId: null, totalChars: 11, name: "You", accuracy: 100 }, 23_100)!;
    assert.equal(finished.durationMs, 3000);
    assert.deepEqual(finished.samples, [{ t: 0, i: 0 }, { t: 1000, i: 5 }, { t: 2000, i: 8 }, { t: 3000, i: 11 }]);
    assert.equal(ghostIndexAt(finished, 1500), 6.5);
    assert.equal(isValidGhostRun(finished), true);
    assert.equal(recorder.elapsed(99_999), 3000);
  });

  it("finishes once, uses an integer event duration, and bounds correction-heavy recording", () => {
    const recorder = new GhostRecorder();
    recorder.start(0);
    for (let i = 1; i < 6000; i++) recorder.mark(i % 2, i);
    recorder.mark(text.length, 6000.4);
    const meta = { textKey, ownerId: null, totalChars: text.length, name: "You", accuracy: 98 };
    const first = recorder.finish(meta, 6000.4)!;
    assert.equal(first.durationMs, 6000);
    assert.ok(first.samples.length <= MAX_GHOST_SAMPLES);
    assert.equal(isValidGhostRun(first), true);
    assert.equal(recorder.finish(meta, 7000), null);
  });
});
