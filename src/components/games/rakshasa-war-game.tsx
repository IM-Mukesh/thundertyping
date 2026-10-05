"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { GameComponentProps } from "@/components/games/game-client";
import { WarInterface } from "@/components/games/rakshasa/war-interface";
import { WarSceneBoundary } from "@/components/games/rakshasa/scene-boundary";
import { WAR_STAGES } from "@/lib/games/rakshasa/content";
import { createWarState, startWar, tickWar, typeWarKey, pauseWar, resumeWar, warStats } from "@/lib/games/rakshasa/engine";
import { warInputKey } from "@/lib/games/rakshasa/input";
import { advanceWarProgress, readWarProgress, saveWarProgress, unlockedWarSpecials, unlockedWarStage, type WarProgress } from "@/lib/games/rakshasa/progress";
import { warAudioGesture, warAudioStop, warAudioTrack, warAudioTransition } from "@/lib/games/rakshasa/audio";
import type { WarState } from "@/lib/games/rakshasa/types";
import { getAuthGeneration, getCurrentUserId, subscribeCurrentUser } from "@/lib/auth/current-user";
import { recordGameResult, recordGameStart } from "@/lib/games/game-scores";
import { awardXp, bumpStat, checkSiteAchievements } from "@/lib/profile/player-profile";
import { GAME_LIST } from "@/lib/games/game-types";
import { useSettingsStore } from "@/lib/persistence/settings-store";
import styles from "@/components/games/rakshasa/war.module.css";

const Scene = dynamic(() => import("@/components/games/rakshasa/rakshasa-scene"), {
  ssr: false,
  loading: () => <div className={styles.loading} role="status">Preparing the battlefield…</div>,
});
const isEnd = (state: WarState) => state.phase === "victory" || state.phase === "defeat";
const osMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const subscribeMotion = (fn: () => void) => {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", fn);
  return () => query.removeEventListener("change", fn);
};

/** Remount on identity/generation change: never settle an old owner's run. */
export default function TypeboundLastDawnGame(props: GameComponentProps) {
  const generation = useSyncExternalStore(subscribeCurrentUser, getAuthGeneration, () => 0);
  return <WarCampaign key={generation} {...props} owner={getCurrentUserId()} generation={generation} />;
}

function WarCampaign({ definition, owner, generation }: GameComponentProps & { owner: string | null; generation: number }) {
  const [progress, setProgress] = useState(() => readWarProgress(owner));
  const progressRef = useRef(progress);
  const [state, setState] = useState(createWarState);
  const stateRef = useRef(state);
  const [selectedStage, setSelectedStage] = useState(() => unlockedWarStage(progress));
  const [mode, setMode] = useState<"webgl" | "fallback" | "loading">("loading");
  const [storageOk, setStorageOk] = useState(true);
  const [newBest, setNewBest] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const lastClock = useRef<number | null>(null);
  const recorded = useRef(false);
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const toggleSound = useSettingsStore((s) => s.toggleSound);
  const enabledRef = useRef(soundEnabled);
  useEffect(() => { enabledRef.current = soundEnabled; }, [soundEnabled]);
  const systemReduced = useSyncExternalStore(subscribeMotion, osMotion, () => false);
  const reducedMotion = progress.reducedMotion || systemReduced;
  const ownsRun = useCallback(() => owner === getCurrentUserId() && generation === getAuthGeneration(), [owner, generation]);

  const persist = useCallback((next: WarProgress) => {
    if (!ownsRun()) return;
    progressRef.current = next;
    setProgress(next);
    setStorageOk(saveWarProgress(owner, next));
  }, [owner, ownsRun]);

  const publish = useCallback((next: WarState) => {
    if (!ownsRun()) return;
    const before = stateRef.current;
    if (before === next) return;
    if (next.cleared !== before.cleared || (isEnd(next) && !isEnd(before))) {
      const updated = advanceWarProgress(progressRef.current, before, next);
      if (updated !== progressRef.current) persist(updated);
    }
    // Earned during play, immediately available; tutorials never unlock attacks.
    next = { ...next, specialUnlocks: unlockedWarSpecials(progressRef.current) };
    stateRef.current = next;
    setState(next);
    warAudioTransition(before, next, enabledRef.current);
    if (isEnd(next) && !recorded.current && next.tutorialStep === 0) {
      recorded.current = true; // Set before any persistence/reward callbacks.
      const stats = warStats(next);
      const result = recordGameResult("rakshasa-war", {
        score: next.score, cleared: next.cleared, bestCombo: next.bestCombo,
        survivedMs: next.elapsedMs, wpm: stats.wpm, accuracy: stats.accuracy,
        variant: `stage-${next.stage + 1}:${next.difficulty}`,
      }, next.phase);
      setNewBest(result.isNewBest);
      bumpStat("rakshasa-war", "runs");
      if (next.phase === "victory") bumpStat("rakshasa-war", "wins");
      awardXp(Math.round(next.score / 15) + (next.phase === "victory" ? 40 : 10));
      checkSiteAchievements(GAME_LIST.map((game) => game.id));
    }
  }, [ownsRun, persist]);

  // Flush wall time on every input as well as HUD ticks. No minimum duration,
  // physics-step cap or visual interpolation can change scored elapsed time.
  const advanceClock = useCallback(() => {
    const now = performance.now();
    const previous = lastClock.current;
    lastClock.current = now;
    if (previous !== null) publish(tickWar(stateRef.current, Math.max(0, now - previous)));
  }, [publish]);

  const pause = useCallback(() => {
    if (stateRef.current.phase === "menu" || stateRef.current.phase === "paused" || isEnd(stateRef.current)) return;
    advanceClock();
    publish(pauseWar(stateRef.current));
    lastClock.current = null;
  }, [advanceClock, publish]);
  const resume = useCallback(() => {
    if (document.hidden || !ownsRun()) return;
    lastClock.current = performance.now();
    warAudioGesture();
    publish(resumeWar(stateRef.current));
    boardRef.current?.focus({ preventScroll: true });
  }, [ownsRun, publish]);

  const ticking = !["menu", "paused", "victory", "defeat"].includes(state.phase);
  useEffect(() => {
    if (!ticking) return;
    const timer = window.setInterval(advanceClock, 100);
    return () => window.clearInterval(timer);
  }, [ticking, advanceClock]);

  useEffect(() => {
    const visibility = () => { if (document.hidden) pause(); };
    const escape = (event: KeyboardEvent) => {
      if (warInputKey(event) !== "Escape" || stateRef.current.phase === "menu" || isEnd(stateRef.current)) return;
      event.preventDefault();
      if (stateRef.current.phase === "paused") resume(); else pause();
    };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("blur", pause);
    window.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("blur", pause);
      window.removeEventListener("keydown", escape);
    };
  }, [pause, resume]);

  const bossTrack = Boolean(state.boss);
  useEffect(() => {
    warAudioTrack(stateRef.current, soundEnabled);
  }, [state.phase, bossTrack, soundEnabled]);
  useEffect(() => () => { lastClock.current = null; warAudioStop(); }, []);
  useEffect(() => {
    if (["paused", "victory", "defeat"].includes(state.phase)) overlayRef.current?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
  }, [state.phase]);

  const begin = (tutorial = false, stage = selectedStage) => {
    if (!ownsRun() || mode === "loading" || stage > unlockedWarStage(progressRef.current)) return;
    recorded.current = false;
    setNewBest(false);
    setSelectedStage(stage);
    warAudioStop();
    warAudioGesture();
    const next = startWar({ stage, difficulty: progressRef.current.difficulty, tutorial,
      seed: `war-${stage}-${progressRef.current.difficulty}-${Date.now().toString(36)}`,
      specialUnlocks: unlockedWarSpecials(progressRef.current) });
    if (!tutorial) recordGameStart("rakshasa-war", `stage-${stage + 1}:${next.difficulty}`);
    stateRef.current = next;
    setState(next);
    lastClock.current = performance.now();
    boardRef.current?.focus({ preventScroll: true });
    boardRef.current?.scrollIntoView({ block: "center", behavior: "instant" });
  };
  const menu = () => {
    stateRef.current = createWarState();
    setState(stateRef.current);
    lastClock.current = null;
    warAudioStop();
  };
  const preview = state.phase === "menu" ? { ...state, stage: selectedStage } : state;
  const setPreferences = (changes: Partial<Pick<WarProgress, "difficulty" | "quality" | "reducedMotion">>) => persist({ ...progressRef.current, ...changes });

  return <div className={styles.game}>
    <WarInterface gameName={definition.name} state={state} progress={progress} stage={WAR_STAGES[preview.stage]} selectedStage={selectedStage}
      onSelectStage={setSelectedStage} onBegin={begin} onPause={pause} onResume={resume} onMenu={menu}
      onPreferences={setPreferences} soundEnabled={soundEnabled} onSound={toggleSound} mode={mode}
      storageOk={storageOk} newBest={newBest} reducedMotion={reducedMotion} boardRef={boardRef} overlayRef={overlayRef}
      onBoardKey={(event) => {
        if (event.target !== event.currentTarget) return; // Native buttons/links keep their keys.
        const key = warInputKey(event.nativeEvent);
        if (key === "Escape") return; // Global pause handler also works from overlays.
        if (key === "Tab") { pause(); return; } // Leave native focus navigation intact.
        if (!key || stateRef.current.phase === "menu" || stateRef.current.phase === "paused" || isEnd(stateRef.current)) return;
        event.preventDefault();
        advanceClock();
        publish(typeWarKey(stateRef.current, key));
      }}
      scene={<WarSceneBoundary onFallback={() => setMode("fallback")}><Scene state={preview} stage={WAR_STAGES[preview.stage]} reducedMotion={reducedMotion} quality={progress.quality} onMode={setMode} /></WarSceneBoundary>}
    />
  </div>;
}
