"use client";

/**
 * Ghost Racer — race a recorded run.
 *
 * The opponent is a real previous run replayed keystroke by keystroke, so it
 * speeds up and hesitates exactly where a person did. Playback interpolates
 * between samples rather than smoothing them, because the unevenness is the
 * mode.
 *
 * The clock is a setInterval, not requestAnimationFrame: rAF stops firing when
 * the tab or pane is hidden, which would freeze the ghost mid-race while the
 * player kept typing.
 */

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Flag,
  Gauge,
  Ghost,
  Keyboard,
  Target,
  Timer,
  Trophy,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { GameComponentProps } from "@/components/games/game-client";
import { useSettingsStore } from "@/lib/persistence/settings-store";
import { sound } from "@/lib/audio/game-sounds";
import { playMusic, preload, resumeAudio, stopMusic } from "@/lib/audio/audio-bus";
import { awardXp,
  checkSiteAchievements, bumpStat, grantAchievement, recordDaily } from "@/lib/profile/player-profile";
import { recordGameResult } from "@/lib/games/game-scores";
import { createRng, dailySeed, dailySeedFor, msUntilNextDaily } from "@/lib/rng/seeded-rng";
import { generateWords } from "@/lib/typing-engine/word-generator";
import { calculateAccuracy, calculateNetWpm, round } from "@/lib/typing-engine/stats";
import {
  GhostRecorder,
  ghostIndexAt,
  isPacer,
  localGhostStore,
  pacerGhost,
  rankFor,
  type GhostRun,
} from "@/lib/games/racer/ghost-store";
import {
  GameStage,
  RuleCard,
  StartButton,
  StatTile,
  WordDisplay,
} from "@/components/games/ui/game-chrome";
import { GAME_LIST } from "@/lib/games/game-types";
import { cn } from "@/lib/utils/cn";
import { racePositionOf, wordStartAt } from "@/lib/games/racer/progress";

const ACCENT = "#22d3ee";
const TICK_MS = 50;
const WORD_COUNT = 30;

const ART = {
  neoncity: "/games/ghost-racer/bg-neoncity.webp",
  start: "/games/ghost-racer/start.webp",
  finish: "/games/ghost-racer/finish.webp",
  victory: "/games/ghost-racer/victory.webp",
  defeat: "/games/ghost-racer/defeat.webp",
  bike: "/games/ghost-racer/bike-standard.webp",
  bikeGhost: "/games/ghost-racer/bike-phantom.webp",
};
const MUSIC = {
  menu: "/audio/music/racer-menu.opus",
  race: "/audio/music/racer-combat.opus",
};

type Phase = "idle" | "countdown" | "racing" | "done";
type Mode = "practice" | "daily";

export default function GhostRacerGame({ definition }: GameComponentProps) {
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const toggleSound = useSettingsStore((s) => s.toggleSound);

  const [mode, setMode] = useState<Mode>("practice");
  const [phase, setPhase] = useState<Phase>("idle");
  const [countdown, setCountdown] = useState(3);
  const [typed, setTyped] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [ghost, setGhost] = useState<GhostRun | null>(null);
  const [bestRun, setBestRun] = useState<GhostRun | null>(null);
  const [result, setResult] = useState<{ won: boolean; wpm: number; acc: number; record: boolean } | null>(null);
  const [errors, setErrors] = useState(0);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const recorder = useRef(new GhostRecorder());
  const startedAt = useRef(0);
  const focusTimeoutRef = useRef<number | null>(null);

  // The daily uses a UTC-seeded word list so every player races the same text.
  const textKey = mode === "daily" ? dailySeedFor("ghost-racer") : "practice:english";
  const words = useMemo(() => {
    if (mode === "daily") {
      const rng = createRng(textKey);
      const pool = generateWords(WORD_COUNT * 3, { punctuation: false, numbers: false });
      return Array.from({ length: WORD_COUNT }, () => rng.pick(pool));
    }
    return generateWords(WORD_COUNT, { punctuation: false, numbers: false });
    // practice re-rolls only on an explicit restart, handled by restartKey
  }, [mode, textKey]);

  const text = useMemo(() => words.join(" "), [words]);
  const totalChars = text.length;

  // Was its own positional-match loop (counting any index where typed[i] ===
  // text[i], not stopping at the first miss) -- a looser definition of
  // "correct" than racePositionOf's strict prefix match, which is what
  // actually gates the win condition and the saved ghost. The two happened
  // to always agree given how input is gated elsewhere, but that made this a
  // latent trap: change the gating and WPM/accuracy could silently diverge
  // from what actually won the race. One definition of "correct" now.
  const racePosition = useMemo(() => racePositionOf(typed, text), [typed, text]);
  const correctChars = racePosition;

  const ghostIndex = ghost && phase === "racing" ? ghostIndexAt(ghost, elapsed) : 0;
  const playerPct = (racePosition / totalChars) * 100;
  const ghostPct = (ghostIndex / totalChars) * 100;

  const wpm = elapsed > 0 ? round(calculateNetWpm(correctChars, elapsed)) : 0;
  const accuracy = round(calculateAccuracy(correctChars, errors));

  // Load the ghost to race whenever the mode changes.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const best = await localGhostStore.best(textKey);
      if (cancelled) return;
      setBestRun(best);
      setGhost(best ?? pacerGhost(textKey, text.length, 45));
    })();
    return () => {
      cancelled = true;
    };
  }, [textKey, text.length]);

  useEffect(() => {
    preload([MUSIC.menu, MUSIC.race]);
    return () => stopMusic();
  }, []);

  // Countdown, then the race clock. One interval drives both.
  useEffect(() => {
    if (phase === "countdown") {
      const id = window.setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            window.clearInterval(id);
            startedAt.current = performance.now();
            recorder.current.start(startedAt.current);
            setPhase("racing");
            void playMusic(MUSIC.race);
            sound("race-start", soundEnabled);
            focusTimeoutRef.current = window.setTimeout(() => inputRef.current?.focus(), 0);
            return 0;
          }
          sound("tick", soundEnabled);
          return c - 1;
        });
      }, 700);
      return () => {
        window.clearInterval(id);
        if (focusTimeoutRef.current !== null) {
          window.clearTimeout(focusTimeoutRef.current);
          focusTimeoutRef.current = null;
        }
      };
    }

    if (phase === "racing") {
      const id = window.setInterval(() => {
        setElapsed(performance.now() - startedAt.current);
      }, TICK_MS);
      return () => window.clearInterval(id);
    }
  }, [phase, soundEnabled]);

  const finish = useCallback(
    (playerFinished: boolean) => {
      const ms = performance.now() - startedAt.current;
      const finalWpm = round(calculateNetWpm(correctChars, ms));
      const finalAcc = round(calculateAccuracy(correctChars, errors));
      const ghostMs = ghost?.durationMs ?? Infinity;
      const won = playerFinished && ms < ghostMs;

      let record = false;
      if (playerFinished) {
        const run = recorder.current.finish({
          textKey,
          name: "You",
          wpm: finalWpm,
          accuracy: finalAcc,
        });
        record = !bestRun || run.durationMs < bestRun.durationMs;
        void localGhostStore.save(run);

        recordGameResult("ghost-racer", {
          score: Math.round(finalWpm),
          cleared: won ? 1 : 0,
          bestCombo: Math.round(finalAcc),
          survivedMs: 0,
        });

        // "runs" as well as "races": the profile totals runs across games, and
        // a race that did not count there read as a bug rather than a naming
        // detail.
        bumpStat("ghost-racer", "runs");
        bumpStat("ghost-racer", "races");
        if (won) bumpStat("ghost-racer", "wins");
        awardXp(Math.round(finalWpm) + (won ? 40 : 10));
        grantAchievement("ghost-racer:first-race");
        if (won) grantAchievement("ghost-racer:first-win");
        if (finalAcc === 100) grantAchievement("ghost-racer:flawless");
        if (finalWpm >= 100) grantAchievement("ghost-racer:legend");
        if (won && ghost && ghost.wpm > (bestRun?.wpm ?? 0)) grantAchievement("ghost-racer:revenge");
        if (mode === "daily") recordDaily(dailySeed(), Math.round(finalWpm));
        checkSiteAchievements(GAME_LIST.map((g) => g.id));
      }

      setResult({ won, wpm: finalWpm, acc: finalAcc, record });
      setPhase("done");
      void playMusic(null);
      sound(record ? "new-record" : won ? "new-record" : "key-wrong", soundEnabled);
    },
    [correctChars, errors, ghost, bestRun, textKey, mode, soundEnabled],
  );

  // End conditions, checked off the same state the clock updates.
  useEffect(() => {
    if (phase !== "racing") return;
    if (racePosition >= totalChars) finish(true);
    else if (ghost && elapsed >= ghost.durationMs) finish(false);
  }, [phase, racePosition, totalChars, elapsed, ghost, finish]);

  const handleInput = (value: string) => {
    if (phase !== "racing") return;
    if (value.length > typed.length) {
      // One wrong character is accepted so the player can see it in red; input
      // is then held until it is removed. Without this the buffer keeps
      // growing while the car stays stalled, and the word on screen drifts
      // away from where the car actually is.
      if (racePosition < typed.length) return;
      const i = value.length - 1;
      if (value[i] !== text[i]) {
        setErrors((e) => e + 1);
        sound("key-wrong", soundEnabled);
      } else {
        sound("key-correct", soundEnabled, { volume: 0.35 });
      }
    }
    const clipped = value.slice(0, totalChars);
    setTyped(clipped);
    // Record the honest position, not the keystroke count -- a ghost is
    // replayed as a position in this text, so a recording of raw length would
    // replay a mash as though it were a fast, accurate run.
    recorder.current.mark(racePositionOf(clipped, text));
  };

  const begin = () => {
    resumeAudio();
    setTyped("");
    setErrors(0);
    setElapsed(0);
    setResult(null);
    setCountdown(3);
    setPhase("countdown");
  };

  const rank = rankFor(bestRun?.wpm ?? 0);
  // Anchored to the car's position rather than the buffer's spaces, so the
  // word on screen is always the word the car is standing on.
  const wordStart = wordStartAt(text, racePosition);
  const currentWord = text.slice(wordStart).split(" ")[0] ?? "";
  const typedInWord = typed.slice(wordStart);

  return (
    <div
      className="flex w-full max-w-3xl flex-col gap-3"
      style={{ ["--accent" as string]: ACCENT }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" aria-label="Race mode" className="flex gap-1.5">
          {(["practice", "daily"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              disabled={phase === "racing" || phase === "countdown"}
              onClick={() => {
                setMode(m);
                setPhase("idle");
                setTyped("");
              }}
              className={cn(
                "min-h-11 rounded-lg px-3 font-mono text-xs uppercase tracking-wider transition-colors sm:min-h-9",
                mode === m ? "bg-accent text-background" : "bg-sub-alt text-sub hover:text-foreground",
                (phase === "racing" || phase === "countdown") && "opacity-50",
              )}
            >
              {m === "practice" ? "Practice" : "Daily race"}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={toggleSound}
          aria-label={soundEnabled ? "Mute sound" : "Unmute sound"}
          className="-m-2 ml-auto flex min-h-11 min-w-11 items-center justify-center p-2 text-sub/60 transition-colors hover:text-foreground sm:m-0 sm:ml-auto sm:min-h-0 sm:min-w-0 sm:p-0"
        >
          {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
        </button>
      </div>

      <GameStage art={phase === "done" ? (result?.won ? ART.victory : ART.defeat) : ART.neoncity}>
        {phase === "idle" && (
          <div className="flex h-full flex-col justify-between gap-3 overflow-y-auto p-4">
            <div className="flex items-start gap-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-accent/40 sm:h-16 sm:w-16">
                <Image src={rank.art} alt="" fill sizes="64px" className="object-cover" />
              </div>
              <div className="min-w-0">
                <p className="font-mono text-lg font-bold uppercase tracking-tight text-foreground sm:text-2xl">
                  {rank.name} <span className="text-accent">rank</span>
                </p>
                <p className="text-xs text-sub">
                  {mode === "daily"
                    ? "Everyone races the same text today. Resets in " +
                      Math.round(msUntilNextDaily() / 3_600_000) +
                      "h."
                    : "Race your fastest recorded run on a fresh word list."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <StatTile icon={<Trophy size={13} />} label="Best WPM" value={bestRun?.wpm ?? "—"} tone="accent" />
              <StatTile icon={<Target size={13} />} label="Best acc" value={bestRun ? `${bestRun.accuracy}%` : "—"} />
              <StatTile icon={<Ghost size={13} />} label="Opponent" value={ghost ? (isPacer(ghost) ? "Pacer" : "Your ghost") : "—"} />
              <StatTile icon={<Keyboard size={13} />} label="Words" value={WORD_COUNT} />
            </div>

            {ghost && isPacer(ghost) && (
              <p className="rounded-lg border border-border bg-background/60 px-3 py-2 text-[11px] text-sub">
                No recorded run for this text yet, so you are racing a steady{" "}
                {ghost.wpm} WPM pacer rather than a real player. Finish once and
                your own run becomes the ghost.
              </p>
            )}

            <div className="grid gap-2 sm:grid-cols-3">
              <RuleCard icon={<Keyboard size={13} />} title="Type to move" body="Your racer advances with every correct character." />
              <RuleCard icon={<Ghost size={13} />} title="Real timing" body="The ghost replays a real run, hesitations and all." />
              <RuleCard icon={<Flag size={13} />} title="Beat the time" body="Cross first and your run becomes the next ghost." />
            </div>

            <StartButton onClick={begin} label={mode === "daily" ? "Start daily race" : "Start race"} />
          </div>
        )}

        {phase === "countdown" && (
          <div className="flex h-full items-center justify-center">
            <p
              key={countdown}
              className="font-mono text-7xl font-bold text-accent arcade-glow motion-safe:animate-ping"
              style={{ animationDuration: "0.6s", animationIterationCount: 1 }}
            >
              {countdown > 0 ? countdown : "GO"}
            </p>
          </div>
        )}

        {phase === "racing" && (
          <div className="flex h-full flex-col justify-between gap-3 p-3 sm:p-4">
            <div className="flex flex-col gap-2">
              <Lane label="You" pct={playerPct} art={ART.bike} tone="accent" />
              <Lane label={ghost && isPacer(ghost) ? "Pacer" : "Ghost"} pct={ghostPct} art={ART.bikeGhost} tone="ghost" />
            </div>

            <WordDisplay word={currentWord} typed={typedInWord} />

            <div className="grid grid-cols-3 gap-2">
              <StatTile icon={<Timer size={13} />} label="Time" value={(elapsed / 1000).toFixed(1) + "s"} />
              <StatTile icon={<Gauge size={13} />} label="WPM" value={wpm} tone="accent" />
              <StatTile icon={<Target size={13} />} label="Accuracy" value={`${accuracy}%`} tone={accuracy >= 95 ? "good" : "default"} />
            </div>
          </div>
        )}

        {phase === "done" && result && (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center">
            <p className="font-mono text-2xl font-bold uppercase text-foreground arcade-glow">
              {result.won ? "You win" : "Ghost wins"}
            </p>
            {result.record && (
              <p className="font-mono text-xs uppercase tracking-wider text-accent">
                New personal record
              </p>
            )}
            <div className="grid w-full max-w-sm grid-cols-3 gap-2">
              <StatTile icon={<Gauge size={13} />} label="WPM" value={result.wpm} tone="accent" />
              <StatTile icon={<Target size={13} />} label="Accuracy" value={`${result.acc}%`} />
              <StatTile icon={<Trophy size={13} />} label="Rank" value={rankFor(result.wpm).name} />
            </div>
            <StartButton onClick={begin} label="Race again" />
          </div>
        )}
      </GameStage>

      {(phase === "racing" || phase === "countdown") && (
        <input
          ref={inputRef}
          value={typed}
          onChange={(e) => handleInput(e.target.value)}
          // Every other typing surface on this site blocks paste (a whole
          // race pasted in one event finishes at a near-zero duration, and
          // that run then gets saved as the new ghost -- an unbeatable
          // phantom for everyone who races this text afterward). This was
          // the one game missing the guard.
          onPaste={(e) => e.preventDefault()}
          aria-label="Type the race text"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          // 16px minimum, or iOS zooms the page on focus.
          className="w-full rounded-lg border border-border bg-sub-alt px-3 py-3 text-center font-mono text-base text-foreground outline-none focus:border-accent"
          placeholder="type here…"
        />
      )}

      <p className="text-center text-xs text-sub">{definition.tagline}</p>
    </div>
  );
}

/** One racing lane: a progress track with a machine riding along it. */
function Lane({
  label,
  pct,
  art,
  tone,
}: {
  label: string;
  pct: number;
  art: string;
  tone: "accent" | "ghost";
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="flex items-center gap-2">
      <span className="w-12 shrink-0 font-mono text-[10px] uppercase tracking-wider text-sub sm:w-14">
        {label}
      </span>
      <div className="relative h-8 flex-1 overflow-hidden rounded-lg border border-border/60 bg-sub-alt/60 sm:h-10">
        <div
          className={cn(
            "absolute inset-y-0 left-0 transition-[width] duration-100",
            tone === "accent" ? "bg-accent/20" : "bg-foreground/10",
          )}
          style={{ width: `${clamped}%` }}
        />
        {/* The machine rides the track.
            The horizontal anchor interpolates with progress: at 0% it is
            left-aligned, at 100% it is pulled back by exactly its own width.
            Subtracting a fixed pixel amount instead only works for one sprite
            size -- it was tuned to the 48px mobile sprite and let the 64px
            desktop one overhang the finish by 16px, clipping the bike at the
            single most important moment of the race. */}
        <div
          className="absolute top-1/2 h-7 w-12 transition-[left,transform] duration-100 sm:h-9 sm:w-16"
          style={{
            left: `${clamped}%`,
            transform: `translate(-${clamped}%, -50%)`,
          }}
        >
          <Image
            src={art}
            alt=""
            fill
            sizes="64px"
            className={cn("object-contain", tone === "ghost" && "opacity-55")}
          />
        </div>
      </div>
      <span className="w-9 shrink-0 text-right font-mono text-[10px] tabular-nums text-sub">
        {Math.round(clamped)}%
      </span>
    </div>
  );
}
