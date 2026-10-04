"use client";

/** The race owns timing/results; the chase-camera scene is presentation only. */
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { GameComponentProps } from "@/components/games/game-client";
import { GhostRacerScene } from "@/components/games/racer/ghost-racer-scene";
import { GhostRaceInterface, type GhostRacePhase as Phase, type GhostRaceResult } from "@/components/games/racer/ghost-race-interface";
import { useSettingsStore } from "@/lib/persistence/settings-store";
import { useRacerMotion } from "@/lib/games/racer/use-racer-motion";
import { sound } from "@/lib/audio/game-sounds";
import { playMusic, preload, resumeAudio, stopMusic } from "@/lib/audio/audio-bus";
import { awardXp, checkSiteAchievements, bumpStat, grantAchievement } from "@/lib/profile/player-profile";
import { recordGameResult, recordGameStart } from "@/lib/games/game-scores";
import { getCurrentUserId, subscribeCurrentUser } from "@/lib/auth/current-user";
import { createGhostCourse, GHOST_WORD_COUNT as WORD_COUNT, type GhostDifficulty } from "@/lib/games/racer/course";
import { createGhostRivals, type GhostRival } from "@/lib/games/racer/rivals";
import { RACER_RIVAL_PROFILES } from "@/lib/games/racer/presentation";
import { calculateAccuracy, calculateNetWpm, round } from "@/lib/typing-engine/stats";
import { GhostRecorder, ghostIndexAt, localGhostStore, personalBestFor, readBestGhost, rankFor, type GhostRun } from "@/lib/games/racer/ghost-store";
import { playSound } from "@/lib/games/game-audio";
import { useGameViewport } from "@/lib/games/use-game-viewport";
import { GAME_LIST } from "@/lib/games/game-types";
import { rankPlayerAgainstRivals, rankRaceParticipants, racePositionOf, wordStartAt } from "@/lib/games/racer/progress";

const TICK_MS = 50;
const MUSIC = { menu: "/audio/music/racer-menu.opus", race: "/audio/music/racer-combat.opus" };
const LIVE_PACE_FLOOR_WPM = 8;

export default function GhostRacerGame(props: GameComponentProps) {
  const ownerId = useSyncExternalStore(subscribeCurrentUser, getCurrentUserId, () => null);
  // Account changes reset refs, recordings and the visual race together.
  return <GhostRace key={ownerId ?? "guest"} {...props} ownerId={ownerId} />;
}

function GhostRace({ ownerId }: GameComponentProps & { ownerId: string | null }) {
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const toggleSound = useSettingsStore((s) => s.toggleSound);
  const { reducedMotion, toggleMotion } = useRacerMotion();
  const { containerRef, metrics } = useGameViewport<HTMLDivElement>();
  const [difficulty, setDifficulty] = useState<GhostDifficulty>("medium");
  const [course, setCourse] = useState(() => createGhostCourse("medium"));
  const [rivalRuns, setRivalRuns] = useState<GhostRival[]>(() => createGhostRivals(course, "medium"));
  const [phase, setPhase] = useState<Phase>("idle");
  const [countdown, setCountdown] = useState(3);
  const [typed, setTyped] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [bestRun, setBestRun] = useState<GhostRun | null>(null);
  const [result, setResult] = useState<GhostRaceResult | null>(null);
  const [errors, setErrors] = useState(0);
  const [replaySaved, setReplaySaved] = useState<boolean | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const recorder = useRef(new GhostRecorder());
  const phaseRef = useRef<Phase>("idle");
  const pausedPhase = useRef<"countdown" | "racing">("racing");
  const runOwner = useRef<string | null>(ownerId);
  const bestRunRef = useRef<GhostRun | null>(null);
  const typedRef = useRef("");
  const errorsRef = useRef(0);
  const transition = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  // Pinned until the next start, including a race spanning UTC midnight.
  const { text, textKey } = course;
  const totalChars = text.length;
  const racePosition = useMemo(() => racePositionOf(typed, text), [typed, text]);
  const progress = racePosition / totalChars;
  const wpm = elapsed > 0 ? round(calculateNetWpm(racePosition, elapsed)) : 0;
  const liveWpm = phase === "racing" ? Math.max(LIVE_PACE_FLOOR_WPM, wpm) : wpm;
  const accuracy = round(calculateAccuracy(racePosition, errors));

  const liveStandings = useMemo(() => rankRaceParticipants([
    { id: "player", name: "You", isPlayer: true, run: { id: "player", name: "You", durationMs: elapsed } },
    ...rivalRuns,
  ]), [elapsed, rivalRuns]);

  const rivalViews = useMemo(() => rivalRuns.map((rival, index) => {
    const rivalProgress = Math.min(1, ghostIndexAt(rival.run, elapsed) / totalChars);
    const style = RACER_RIVAL_PROFILES[index % RACER_RIVAL_PROFILES.length];
    const standing = liveStandings.find((entry) => entry.id === rival.id);
    return {
      id: rival.id,
      name: rival.name,
      progress: rivalProgress,
      color: style.color,
      finished: rivalProgress >= 1,
      placement: standing?.placement ?? null,
    };
  }), [elapsed, liveStandings, rivalRuns, totalChars]);

  const livePlacement = liveStandings.find((entry) => entry.isPlayer)?.placement ?? 1;

  useEffect(() => {
    let cancelled = false;
    void localGhostStore.best(textKey, text.length).then((best) => {
      if (cancelled || phaseRef.current !== "idle" || ownerId !== getCurrentUserId()) return;
      bestRunRef.current = best;
      setBestRun(best);
    });
    return () => { cancelled = true; };
  }, [ownerId, textKey, text.length]);

  useEffect(() => {
    preload([MUSIC.menu, MUSIC.race]);
    return () => stopMusic();
  }, []);

  useEffect(() => {
    if (phase !== "countdown") return;
    const id = window.setTimeout(() => {
      if (phaseRef.current !== "countdown") return;
      if (countdown > 1) {
        setCountdown(countdown - 1);
        playSound("countdown", soundEnabled);
      } else {
        recorder.current.start();
        transition("racing");
        sound("race-start", soundEnabled);
        playSound("countdown-go", soundEnabled);
      }
    }, 700);
    return () => window.clearTimeout(id);
  }, [phase, countdown, soundEnabled, transition]);

  useEffect(() => {
    if (phase !== "racing") return;
    inputRef.current?.focus({ preventScroll: true });
    const id = window.setInterval(() => setElapsed(recorder.current.elapsed()), TICK_MS);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase === "racing" && soundEnabled) void playMusic(MUSIC.race);
    else stopMusic();
  }, [phase, soundEnabled]);

  const pause = useCallback(() => {
    const current = phaseRef.current;
    if (current !== "racing" && current !== "countdown") return;
    pausedPhase.current = current;
    if (current === "racing") {
      recorder.current.pause();
      setElapsed(recorder.current.elapsed());
    }
    transition("paused");
  }, [transition]);

  const resume = useCallback(() => {
    if (phaseRef.current !== "paused" || document.visibilityState === "hidden") return;
    if (pausedPhase.current === "racing") recorder.current.resume();
    transition(pausedPhase.current);
  }, [transition]);

  useEffect(() => {
    const onVisibility = () => { if (document.visibilityState === "hidden") pause(); };
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.key === "Escape") {
        event.preventDefault();
        if (phaseRef.current === "paused") resume();
        else pause();
      } else if (phaseRef.current === "paused" && (event.key === " " || event.key === "Enter")) {
        if (event.target instanceof HTMLElement && event.target.closest("button, a, input, select, textarea")) return;
        event.preventDefault();
        resume();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", pause);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", pause);
      window.removeEventListener("keydown", onKey);
    };
  }, [pause, resume]);

  const finish = (position: number, mistakes: number, now: number) => {
    if (phaseRef.current !== "racing" || runOwner.current !== getCurrentUserId()) return;
    const finalAcc = round(calculateAccuracy(position, mistakes));
    const run = recorder.current.finish({ textKey, ownerId: runOwner.current, totalChars, name: "You", accuracy: finalAcc }, now);
    if (!run) return; // One-shot before persistence and reward effects.
    const standings = rankPlayerAgainstRivals(run, rivalRuns);
    const outcome = standings.outcome;
    const won = outcome === "won";
    const newBest = personalBestFor(bestRunRef.current, run);
    const record = newBest === run;
    bestRunRef.current = newBest;
    setBestRun(newBest);
    transition("done");
    setElapsed(run.durationMs);
    setResult({ won, tied: outcome === "tie", placement: standings.placement, wpm: run.wpm, acc: finalAcc, record, durationMs: run.durationMs });
    const completedRecorder = recorder.current;
    void localGhostStore.save(run).then((saved) => {
      if (recorder.current === completedRecorder && phaseRef.current === "done" && run.ownerId === getCurrentUserId()) setReplaySaved(saved);
    });
    recordGameResult("ghost-racer", {
      score: run.wpm, cleared: WORD_COUNT, bestCombo: 0, survivedMs: run.durationMs,
      wpm: run.wpm, accuracy: finalAcc, variant: textKey,
    }, outcome);
    bumpStat("ghost-racer", "runs");
    bumpStat("ghost-racer", "races");
    if (won) bumpStat("ghost-racer", "wins");
    awardXp(run.wpm + (won ? 40 : 10));
    grantAchievement("ghost-racer:first-race");
    if (won) grantAchievement("ghost-racer:first-win");
    if (finalAcc === 100) grantAchievement("ghost-racer:flawless");
    if (run.wpm >= 100) grantAchievement("ghost-racer:legend");
    checkSiteAchievements(GAME_LIST.map((g) => g.id));
    sound(record || won ? "new-record" : "key-wrong", soundEnabled);
  };

  const handleInput = (value: string) => {
    if (phaseRef.current !== "racing" || runOwner.current !== getCurrentUserId()) return;
    const previous = typedRef.current;
    if (value.length > previous.length && racePositionOf(previous, text) < previous.length) return;
    const nextPosition = racePositionOf(value, text);
    const clipped = value.slice(0, Math.min(totalChars, nextPosition + 1));
    if (clipped === previous) return;
    let changedFrom = 0;
    while (changedFrom < previous.length && changedFrom < clipped.length && previous[changedFrom] === clipped[changedFrom]) changedFrom++;
    const mistake = nextPosition < clipped.length && changedFrom <= nextPosition;
    if (mistake) {
      errorsRef.current += 1;
      setErrors(errorsRef.current);
      sound("key-wrong", soundEnabled);
    } else if (clipped.length > changedFrom) sound("key-correct", soundEnabled, { volume: 0.35 });
    typedRef.current = clipped;
    setTyped(clipped);
    const now = performance.now();
    const position = racePositionOf(clipped, text);
    recorder.current.mark(position, now);
    if (position === totalChars) finish(position, errorsRef.current, now);
  };

  const begin = useCallback(() => {
    if (phaseRef.current !== "idle" && phaseRef.current !== "done") return;
    const nextCourse = createGhostCourse(difficulty);
    setCourse(nextCourse);
    const owner = getCurrentUserId();
    const stored = readBestGhost(nextCourse.textKey, nextCourse.text.length, owner);
    bestRunRef.current = stored;
    setBestRun(stored);
    setRivalRuns(createGhostRivals(nextCourse, difficulty));
    runOwner.current = owner;
    recorder.current = new GhostRecorder();
    typedRef.current = "";
    errorsRef.current = 0;
    recordGameStart("ghost-racer", nextCourse.textKey);
    resumeAudio();
    setTyped("");
    setErrors(0);
    setElapsed(0);
    setResult(null);
    setReplaySaved(null);
    setCountdown(3);
    transition("countdown");
    containerRef.current?.scrollIntoView({ block: "start", behavior: "instant" });
  }, [difficulty, transition, containerRef]);

  const changeDifficulty = (nextDifficulty: GhostDifficulty) => {
    if (phaseRef.current !== "idle") return;
    setDifficulty(nextDifficulty);
    const nextCourse = createGhostCourse(nextDifficulty);
    setCourse(nextCourse);
    const stored = readBestGhost(nextCourse.textKey, nextCourse.text.length, ownerId);
    bestRunRef.current = stored;
    setBestRun(stored);
    setRivalRuns(createGhostRivals(nextCourse, nextDifficulty));
  };

  const returnToGarage = () => {
    if (phaseRef.current !== "paused" && phaseRef.current !== "done") return;
    recorder.current = new GhostRecorder();
    typedRef.current = "";
    errorsRef.current = 0;
    setTyped("");
    setErrors(0);
    setElapsed(0);
    setResult(null);
    setReplaySaved(null);
    setRivalRuns(createGhostRivals(course, difficulty));
    transition("idle");
  };

  useEffect(() => {
    if (phase !== "done") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || event.ctrlKey || event.altKey || event.metaKey ||
        (event.target instanceof HTMLElement && event.target.closest("button, a, input, select, textarea"))) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        begin();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, begin]);

  const wordStart = wordStartAt(text, racePosition);
  const currentWord = text.slice(wordStart).split(" ")[0] ?? "";
  const typedInWord = typed.slice(wordStart);
  const upcomingWords = useMemo(() => {
    const remaining = text.slice(wordStart + currentWord.length).trim();
    return remaining ? remaining.split(" ").slice(0, 4) : [];
  }, [text, wordStart, currentWord]);
  const hasError = racePosition < typed.length;

  return (
    <div ref={containerRef} className="w-full max-w-6xl scroll-mt-3">
      <GhostRaceInterface
        phase={phase}
        difficulty={difficulty}
        onDifficultyChange={changeDifficulty}
        rivals={rivalViews}
        playerPosition={livePlacement}
        totalRacers={rivalRuns.length + 1}
        resultPlacement={result?.placement}
        bestWpm={bestRun?.wpm ?? null}
        bestAccuracy={bestRun?.accuracy ?? null}
        rankName={rankFor(result?.wpm ?? bestRun?.wpm ?? 0).name}
        countdown={countdown}
        progress={progress}
        elapsedMs={elapsed}
        wpm={liveWpm}
        accuracy={accuracy}
        currentWord={currentWord}
        typedInWord={typedInWord}
        upcomingWords={upcomingWords}
        needsSpace={!hasError && typedInWord === currentWord && racePosition < totalChars}
        hasError={hasError}
        reducedMotion={reducedMotion}
        onToggleMotion={toggleMotion}
        compact={metrics.isKeyboardOpen || (metrics.visibleHeight < 550 && metrics.visibleWidth < 950)}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        onStart={begin}
        onPause={pause}
        onResume={resume}
        onMenu={returnToGarage}
        result={result}
        replaySaved={replaySaved}
        scene={<GhostRacerScene phase={phase} progress={progress} rivals={rivalViews.map((rival, index) => ({
          ...rival,
          lane: RACER_RIVAL_PROFILES[index % RACER_RIVAL_PROFILES.length].lane,
          kind: "rival" as const,
        }))} elapsedMs={elapsed} wpm={liveWpm} errors={errors} reducedMotion={reducedMotion} />}
        input={
          <input
            ref={inputRef}
            value={typed}
            onChange={(event) => handleInput(event.target.value)}
            onBlur={pause}
            disabled={phase === "paused" || phase === "done"}
            readOnly={phase !== "racing"}
            onPaste={(event) => event.preventDefault()}
            onDrop={(event) => event.preventDefault()}
            aria-label="Race controls: type the highlighted word, then Space"
            aria-invalid={hasError}
            autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false}
            inputMode="text" placeholder={phase === "countdown" ? "Get ready…" : "Tap here · type to accelerate"}
          />
        }
      />
    </div>
  );
}
