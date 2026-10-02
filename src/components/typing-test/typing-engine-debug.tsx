"use client";

import { useEffect, useMemo, useState } from "react";
import { useTypingEngine } from "@/lib/typing-engine/use-typing-engine";
import type { TestConfig } from "@/lib/typing-engine/engine-types";
import {
  calculateAccuracy,
  calculateConsistency,
  calculateNetWpm,
  calculateRawWpm,
} from "@/lib/typing-engine/stats";
import { HiddenInput } from "@/components/typing-test/hidden-input";
import { WordStream } from "@/components/typing-test/word-stream";

let commitCount = 0;

/**
 * Same-text benchmark harness.
 *
 * The point of this page is to remove the variable that makes a cross-site
 * comparison meaningless: two tests on different random words are not the same
 * test, and no conclusion about the engine can be drawn from them. Paste the
 * exact prompt another site gave you, run it here at the same duration, and
 * the two results become comparable.
 *
 * Everything below is raw engine state. Nothing is rounded except where
 * labelled, so a disagreement between this page and the results screen is
 * itself a bug worth reporting.
 */
export function TypingEngineDebug() {
  const [text, setText] = useState(
    "the quick brown fox jumps over the lazy dog and keeps on running",
  );
  const [duration, setDuration] = useState(15);
  const [applied, setApplied] = useState<{ text: string; duration: number } | null>(null);
  const [focusToken, setFocusToken] = useState(0);

  const config = useMemo<TestConfig>(
    () => ({
      mode: "custom",
      timeDuration: applied?.duration ?? duration,
      wordCount: 25,
      quoteLength: "medium",
      vocabDifficulty: "easy",
      wordDifficulty: "all",
      customText: applied?.text ?? "",
      punctuation: false,
      numbers: false,
    }),
    [applied, duration],
  );

  const engine = useTypingEngine(config);
  const s = engine.state;

  // Counts committed renders of this subtree. Kept in a module-scope counter
  // rather than state so reading it cannot itself trigger another render.
  useEffect(() => {
    commitCount += 1;
  });
  const active = s.wordStates[s.activeWordIndex];

  const netWpm = calculateNetWpm(s.netWpmCharacters, s.elapsedMs);
  const rawWpm = calculateRawWpm(s.correctKeystrokes, s.incorrectKeystrokes, s.elapsedMs);
  const accuracy = calculateAccuracy(s.correctKeystrokes, s.incorrectKeystrokes, s.charTally.missed);
  const consistency = calculateConsistency(s.wpmSamples);

  const targetChars = applied ? applied.text.trim().split(/\s+/).join(" ").length : 0;

  const start = () => {
    setApplied({ text, duration });
    engine.applyConfig({ ...config, customText: text, timeDuration: duration });
    setFocusToken((t) => t + 1);
  };

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-6 font-mono text-sm">
      <header>
        <h1 className="font-display text-xl uppercase tracking-wider text-foreground">
          Typing engine &mdash; same-text benchmark
        </h1>
        <p className="mt-1 text-sub">
          Paste the exact prompt from another typing test, match the duration,
          and run it here. Different random words are not a comparison.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          spellCheck={false}
          aria-label="Benchmark text"
          className="w-full rounded-md border border-border bg-sub-alt p-3 text-foreground"
        />
        <div className="flex items-center gap-3">
          <label htmlFor="dbg-duration" className="text-sub">
            Duration (s)
          </label>
          <input
            id="dbg-duration"
            type="number"
            min={1}
            max={600}
            value={duration}
            onChange={(e) => setDuration(Math.max(1, Number(e.target.value) || 1))}
            className="w-24 rounded-md border border-border bg-sub-alt px-2 py-1 text-foreground"
          />
          <button
            type="button"
            onClick={start}
            className="rounded-md border border-accent px-4 py-1.5 text-accent"
          >
            Load &amp; restart
          </button>
          <span className="text-sub">
            target chars: {targetChars || "—"}
          </span>
        </div>
      </section>

      {applied && s.status !== "finished" && (
        <section
          className="relative cursor-pointer"
          onClick={() => setFocusToken((t) => t + 1)}
        >
          <WordStream wordStates={s.wordStates} activeWordIndex={s.activeWordIndex} />
          <HiddenInput
            value={active?.typed ?? ""}
            status={s.status}
            onChange={engine.setTyped}
            onCommitWord={engine.commitWord}
            onRestart={start}
            onEscape={() => {}}
            onFocusChange={() => {}}
            focusToken={focusToken}
          />
        </section>
      )}

      <section className="grid grid-cols-2 gap-x-8 gap-y-1 rounded-md border border-border p-4 sm:grid-cols-3">
        <Row k="status" v={s.status} />
        <Row k="startedAt" v={s.startedAt === null ? "null" : s.startedAt.toFixed(2)} />
        <Row k="elapsedMs" v={s.elapsedMs.toFixed(2)} />
        <Row k="activeWordIndex" v={s.activeWordIndex} />
        <Row k="words generated" v={s.words.length} />
        <Row k="wpmSamples" v={s.wpmSamples.length} />

        <Row k="correctKeystrokes" v={s.correctKeystrokes} />
        <Row k="incorrectKeystrokes" v={s.incorrectKeystrokes} />
        <Row k="extra" v={s.charTally.extra} />
        <Row k="missed" v={s.charTally.missed} />
        <Row k="totalTyped" v={s.totalTyped} />
        <Row k="totalKeypresses" v={s.totalKeypresses} />
        <Row k="correctedErrors" v={s.correctedErrors} />

        <Row k="netWpm (raw)" v={netWpm.toFixed(4)} />
        <Row k="rawWpm (raw)" v={rawWpm.toFixed(4)} />
        <Row k="accuracy (raw)" v={accuracy.toFixed(4)} />
        <Row k="consistency (raw)" v={consistency.toFixed(4)} />
        <Row k="commits (this mount)" v={commitCount} />
      </section>

      <section className="rounded-md border border-border p-4">
        <p className="text-sub">
          Invariant check &mdash; totalTyped must equal correct + incorrect:{" "}
          <strong
            className={
              s.totalTyped === s.correctKeystrokes + s.incorrectKeystrokes
                ? "text-correct"
                : "text-error"
            }
          >
            {s.totalTyped} vs {s.correctKeystrokes + s.incorrectKeystrokes}
          </strong>
        </p>
      </section>
    </main>
  );
}

function Row({ k, v }: { k: string; v: string | number }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/40 py-0.5">
      <span className="text-sub">{k}</span>
      <span className="text-foreground">{v}</span>
    </div>
  );
}
