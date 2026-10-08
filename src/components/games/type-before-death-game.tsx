"use client";

import dynamic from "next/dynamic";
import { flushSync } from "react-dom";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ChangeEvent, type KeyboardEvent } from "react";
import type { GameComponentProps } from "@/components/games/game-client";
import { TypeBeforeDeathInterface } from "@/components/games/type-before-death/type-before-death-interface";
import { TypeBeforeDeathSceneBoundary } from "@/components/games/type-before-death/scene-boundary";
import {
  abandonDeath,
  chooseDeathUpgrade,
  createDeathState,
  deathStats,
  deathRunStats,
  getDailyChallenge,
  pauseDeath,
  resumeDeath,
  startDeath,
  startDeathWave,
  tickDeath,
  typeDeathKey,
} from "@/lib/games/type-before-death/engine";
import { deathSceneView } from "@/lib/games/type-before-death/scene-view";
import {
  advanceDeathProgress,
  readDeathProgress,
  saveDeathProgress,
} from "@/lib/games/type-before-death/progress";
import { deathAudioGesture, deathAudioStop, deathAudioTrack, deathAudioTransition } from "@/lib/games/type-before-death/audio";
import type { DeathDifficulty, DeathMode, DeathProgress, DeathState, DeathSurvivorId, DeathUpgradeId, DeathWeaponId } from "@/lib/games/type-before-death/types";
import type { TypeBeforeDeathRenderMode } from "@/lib/games/type-before-death/scene-contract";
import { getAuthGeneration, getCurrentUserId, subscribeCurrentUser } from "@/lib/auth/current-user";
import { recordGameResult, recordGameStart } from "@/lib/games/game-scores";
import { useGameBest } from "@/lib/games/use-game-best";
import { awardXp, bumpStat, checkSiteAchievements, grantAchievement, recordDaily } from "@/lib/profile/player-profile";
import { GAME_LIST } from "@/lib/games/game-types";
import { useSettingsStore } from "@/lib/persistence/settings-store";
import { trackEvent } from "@/lib/analytics";

const Scene = dynamic(() => import("@/components/games/type-before-death/type-before-death-scene"), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center bg-[#070d21] text-xs text-slate-300" role="status">Building the last safehouse…</div>,
});

const isActive = (phase: DeathState["phase"]): boolean => phase === "briefing" || phase === "combat" || phase === "boss" || phase === "wave";
const systemMotionSnapshot = (): boolean => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const subscribeMotion = (listener: () => void): (() => void) => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => {};
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
};

/** Account changes remount the run controller so score/progress ownership never moves mid-run. */
export default function TypeBeforeDeathGame(props: GameComponentProps) {
  const generation = useSyncExternalStore(subscribeCurrentUser, getAuthGeneration, () => 0);
  return <TypeBeforeDeathSession key={generation} {...props} owner={getCurrentUserId()} generation={generation} />;
}

function TypeBeforeDeathSession({ definition, owner, generation }: GameComponentProps & { owner: string | null; generation: number }) {
  const [state, setState] = useState<DeathState>(() => createDeathState());
  const stateRef = useRef(state);
  const [progress, setProgress] = useState<DeathProgress>(() => readDeathProgress(owner));
  const progressRef = useRef(progress);
  const [renderMode, setRenderMode] = useState<TypeBeforeDeathRenderMode | "loading">("loading");
  const [newBest, setNewBest] = useState(false);
  const [storageOk, setStorageOk] = useState(true);
  const [announcement, setAnnouncement] = useState("");
  const [selectedMode, setSelectedMode] = useState<DeathMode>("campaign");
  const [selectedMission, setSelectedMission] = useState(0);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DeathDifficulty>("normal");
  const boardRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const lastClock = useRef<number | null>(null);
  const recorded = useRef(false);
  const soundEnabled = useSettingsStore((settings) => settings.soundEnabled);
  const toggleSound = useSettingsStore((settings) => settings.toggleSound);
  const enabledRef = useRef(soundEnabled);
  const systemReducedMotion = useSyncExternalStore(subscribeMotion, systemMotionSnapshot, () => false);
  const reducedMotion = systemReducedMotion || progress.reducedMotion;
  const today = new Date().toISOString().slice(0, 10);
  const daily = getDailyChallenge(today);
  const variant = selectedMode === "daily" ? `daily:normal:mission-${daily.mission}:pistol:soldier:${today}` : `${selectedMode}:${selectedDifficulty}:mission-${selectedMission}:${progress.weapon}:${progress.survivor}`;
  const best = useGameBest(definition.id, variant);

  const trackGameEvent = useCallback((event: string, snapshot = stateRef.current): void => {
    const stats = deathStats(snapshot);
    trackEvent("game_event", {
      game_id: definition.id,
      game_name: definition.name,
      event,
      mode: snapshot.mode,
      wave: snapshot.wave,
      score: stats.score,
      duration_ms: stats.survivedMs,
      wpm: stats.wpm,
      accuracy: stats.accuracy,
    });
  }, [definition.id, definition.name]);

  useEffect(() => { enabledRef.current = soundEnabled; if (!soundEnabled) deathAudioStop(); }, [soundEnabled]);
  useEffect(() => { progressRef.current = progress; }, [progress]);

  const ownsRun = useCallback(() => owner === getCurrentUserId() && generation === getAuthGeneration(), [generation, owner]);
  const persist = useCallback((next: DeathProgress): void => {
    if (!ownsRun()) return;
    progressRef.current = next;
    setProgress(next);
    setStorageOk(saveDeathProgress(owner, next));
  }, [ownsRun, owner]);

  const publish = useCallback((next: DeathState): void => {
    if (!ownsRun() || next === stateRef.current) return;
    const before = stateRef.current;
    stateRef.current = next;
    setState(next);
    deathAudioTransition(before, next, enabledRef.current);
    if (next.phase !== before.phase) {
      if (next.phase === "boss") { trackGameEvent("boss_started", next); setAnnouncement("Commander contact. Keep the prefix clean and watch the charge."); }
      else if (next.phase === "upgrade") { trackGameEvent("wave_completed", next); setAnnouncement("Wave clear. Choose one field upgrade."); }
      else if (next.phase === "results") { trackGameEvent(next.outcome === "victory" ? "run_completed" : "game_over", next); setAnnouncement(next.outcome === "victory" ? "Outbreak contained. Result ready." : "The line has fallen. Result ready."); }
      else if (next.phase === "combat" && before.phase === "briefing") setAnnouncement("They are coming. Type the first letter to lock a threat.");
    } else if (next.overdriveMs > 0 && before.overdriveMs <= 0) {
      trackGameEvent("overdrive_activated", next);
      setAnnouncement("OVERDRIVE READY. The city is yours for a few seconds.");
    } else if (next.jams > before.jams) {
      setAnnouncement("Weapon jammed. Let the heat bleed off.");
    } else if (next.cleared > before.cleared) {
      setAnnouncement(next.combo > 0 && next.combo % 10 === 0 ? `${next.combo} combo. Keep the line moving.` : "Target neutralized.");
    } else if (next.incorrectKeys > before.incorrectKeys) {
      setAnnouncement("Wrong key. Progress is fair; the streak is gone.");
    }

    if (next.phase === "results" && before.phase !== "results" && !recorded.current) {
      recorded.current = true;
      if (next.outcome === "abandoned") return;
      const stats = deathStats(next);
      const run = {
        score: stats.score,
        cleared: stats.cleared,
        bestCombo: stats.bestCombo,
        survivedMs: stats.survivedMs,
        wpm: stats.wpm,
        accuracy: stats.accuracy,
        variant: deathRunStats(next).variant,
      } as const;
      const result = recordGameResult(definition.id, run, next.outcome ?? undefined);
      setNewBest(result.isNewBest);
      const updated = advanceDeathProgress(progressRef.current, before, next);
      persist(updated);
      bumpStat(definition.id, "runs");
      if (next.outcome === "victory") bumpStat(definition.id, "wins");
      awardXp(Math.round(stats.score / 18) + stats.cleared * 2 + (next.outcome === "victory" ? 50 : 8));
      grantAchievement("type-before-death:first-run");
      if (stats.bestCombo >= 25) grantAchievement("type-before-death:combo-25");
      if (stats.overdrives > 0) grantAchievement("type-before-death:overdrive");
      if (next.outcome === "victory") grantAchievement("type-before-death:boss");
      if (stats.wpm >= 100) grantAchievement("type-before-death:100-wpm");
      if (next.mode === "daily" && next.dailyDay) {
        recordDaily(next.dailyDay, stats.score);
        grantAchievement("type-before-death:daily");
      }
      checkSiteAchievements(GAME_LIST.map((game) => game.id));
    }
  }, [definition.id, ownsRun, persist, trackGameEvent]);

  const advanceClock = useCallback((): void => {
    if (!ownsRun()) return;
    const now = performance.now();
    const previous = lastClock.current;
    lastClock.current = now;
    if (previous !== null) publish(tickDeath(stateRef.current, Math.max(0, now - previous)));
  }, [ownsRun, publish]);

  const pause = useCallback((): void => {
    if (!isActive(stateRef.current.phase)) return;
    advanceClock();
    publish(pauseDeath(stateRef.current));
    lastClock.current = null;
    deathAudioStop();
  }, [advanceClock, publish]);

  const resume = useCallback((): void => {
    if (document.hidden || !ownsRun() || stateRef.current.phase !== "paused") return;
    if (enabledRef.current) deathAudioGesture();
    lastClock.current = performance.now();
    publish(resumeDeath(stateRef.current));
    inputRef.current?.focus({ preventScroll: true });
  }, [ownsRun, publish]);

  useEffect(() => {
    if (!isActive(state.phase)) return;
    const timer = window.setInterval(advanceClock, 80);
    return () => window.clearInterval(timer);
  }, [advanceClock, state.phase]);

  useEffect(() => {
    const visibility = (): void => { if (document.hidden) pause(); };
    const onBlur = (): void => pause();
    const escape = (event: globalThis.KeyboardEvent): void => {
      if (event.defaultPrevented || event.key !== "Escape") return;
      if (stateRef.current.phase === "paused") { event.preventDefault(); resume(); }
      else if (isActive(stateRef.current.phase)) { event.preventDefault(); pause(); }
    };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("keydown", escape);
    return () => { document.removeEventListener("visibilitychange", visibility); window.removeEventListener("blur", onBlur); window.removeEventListener("keydown", escape); };
  }, [pause, resume]);

  useEffect(() => {
    deathAudioTrack(stateRef.current, soundEnabled);
  }, [soundEnabled, state.phase, state.boss]);
  useEffect(() => () => { lastClock.current = null; deathAudioStop(); }, []);
  useEffect(() => {
    if (state.phase === "paused" || state.phase === "results" || state.phase === "upgrade" || state.phase === "wave") overlayRef.current?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
    if (isActive(state.phase)) inputRef.current?.focus({ preventScroll: true });
  }, [state.phase]);

  const begin = useCallback((mode: DeathMode, mission: number, difficulty: DeathDifficulty, dailyDay?: string): void => {
    if (!ownsRun()) return;
    const day = dailyDay ?? (mode === "daily" ? new Date().toISOString().slice(0, 10) : undefined);
    const seed = mode === "daily" ? undefined : `run:${mode}:${mission}:${Date.now().toString(36)}`;
    const next = startDeath({ mode, mission, difficulty, day, seed, weapon: progressRef.current.weapon, survivor: progressRef.current.survivor, runId: `run:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}` });
    recorded.current = false;
    setNewBest(false);
    setSelectedMode(mode);
    setSelectedMission(next.mission);
    setSelectedDifficulty(next.difficulty);
    stateRef.current = next;
    flushSync(() => setState(next));
    lastClock.current = performance.now();
    setAnnouncement(mode === "daily" ? "Daily seed synchronized. Same outbreak for everyone." : mode === "endless" ? "No final wave. Survive until the line breaks." : next.message);
    if (mode !== "daily" || next.dailyDay) recordGameStart(definition.id, deathRunStats(next).variant);
    trackGameEvent(mode === "daily" ? "daily_challenge_started" : "run_started", next);
    if (enabledRef.current) { deathAudioGesture(); deathAudioTrack(next, true); }
    inputRef.current?.focus({ preventScroll: true });
    boardRef.current?.scrollIntoView({ block: "start", behavior: "instant" });
  }, [definition.id, ownsRun, trackGameEvent]);

  const menu = useCallback((): void => {
    if (!ownsRun()) return;
    deathAudioStop();
    lastClock.current = null;
    const next = createDeathState();
    stateRef.current = next;
    recorded.current = false;
    setNewBest(false);
    flushSync(() => setState(next));
    boardRef.current?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
  }, [ownsRun]);

  const restart = useCallback((): void => {
    const current = stateRef.current;
    trackGameEvent("rematch_clicked", current);
    begin(current.mode, current.mission, current.difficulty, current.dailyDay ?? undefined);
  }, [begin, trackGameEvent]);

  const quit = useCallback((): void => {
    trackGameEvent("game_exit");
    if (isActive(stateRef.current.phase) || stateRef.current.phase === "paused") publish(abandonDeath(stateRef.current));
    menu();
  }, [menu, publish, trackGameEvent]);

  const typeKey = useCallback((key: string): void => {
    if (!isActive(stateRef.current.phase) || !ownsRun()) return;
    advanceClock();
    if (!isActive(stateRef.current.phase)) return;
    publish(typeDeathKey(stateRef.current, key));
  }, [advanceClock, ownsRun, publish]);

  const onInputKey = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "Escape") { event.preventDefault(); pause(); return; }
    if (event.key === "Tab") { pause(); return; }
    if (event.key === "Backspace") { event.preventDefault(); typeKey("Backspace"); return; }
    if (event.repeat || event.ctrlKey || event.altKey || event.metaKey || event.nativeEvent.isComposing) return;
    if (event.key.length === 1 && /^[a-zA-Z]$/.test(event.key)) { event.preventDefault(); typeKey(event.key.toLowerCase()); }
  };

  const onInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const value = event.currentTarget.value;
    if (value.length > 0) {
      for (const character of value.slice(0, 24)) if (/^[a-zA-Z]$/.test(character)) typeKey(character.toLowerCase());
      event.currentTarget.value = "";
    }
  };

  const sceneView = deathSceneView(state, reducedMotion, progress.quality);
  return <div ref={boardRef} className="w-full" tabIndex={-1}>
    <TypeBeforeDeathInterface
      definition={definition}
      rootRef={boardRef}
      inputRef={inputRef}
      overlayRef={overlayRef}
      state={state}
      progress={progress}
      best={best}
      newBest={newBest}
      storageOk={storageOk}
      renderMode={renderMode}
      reducedMotion={reducedMotion}
      soundEnabled={soundEnabled}
      announcement={announcement}
      selectedMode={selectedMode}
      selectedMission={selectedMission}
      selectedDifficulty={selectedDifficulty}
      selectedWeapon={progress.weapon}
      selectedSurvivor={progress.survivor}
      onSelectMode={setSelectedMode}
      onSelectMission={setSelectedMission}
      onSelectDifficulty={setSelectedDifficulty}
      onSelectWeapon={(weapon: DeathWeaponId) => persist({ ...progressRef.current, weapon })}
      onSelectSurvivor={(survivor: DeathSurvivorId) => persist({ ...progressRef.current, survivor })}
      onBegin={begin}
      onPause={pause}
      onResume={resume}
      onRestart={restart}
      onMenu={menu}
      onQuit={quit}
      onUpgrade={(id: DeathUpgradeId) => { trackGameEvent("upgrade_purchased"); publish(chooseDeathUpgrade(stateRef.current, id)); }}
      onContinueWave={() => publish(startDeathWave(stateRef.current))}
      onShare={() => {
        const stats = deathStats(stateRef.current);
        trackGameEvent("share_clicked");
        const text = `TYPE BEFORE DEATH\n${stats.score.toLocaleString("en-US")} score · ${stats.wpm.toFixed(0)} WPM · ${stats.accuracy.toFixed(1)}% accuracy · ${stats.cleared} threats cleared\nPlay at www.herotyping.com/games/type-before-death`;
        void (async () => {
          try {
            if (navigator.share) await navigator.share({ title: "TYPE BEFORE DEATH", text, url: "/games/type-before-death" });
            else {
              if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
              else {
                const copy = document.createElement("textarea");
                copy.value = text;
                copy.setAttribute("readonly", "true");
                copy.style.position = "fixed";
                copy.style.opacity = "0";
                document.body.append(copy);
                try {
                  copy.select();
                  if (!document.execCommand("copy")) throw new Error("Clipboard unavailable");
                } finally {
                  copy.remove();
                }
              }
              setAnnouncement("Result copied to clipboard.");
            }
          } catch { setAnnouncement("Share cancelled. Your result is still saved locally."); }
        })();
      }}
      onSound={() => { const next = !enabledRef.current; enabledRef.current = next; if (next) deathAudioGesture(); else deathAudioStop(); toggleSound(); }}
      onPreferences={(changes) => persist({ ...progressRef.current, ...changes })}
      onInputKey={onInputKey}
      onInputChange={onInputChange}
      scene={<TypeBeforeDeathSceneBoundary onFallback={() => setRenderMode("fallback")}><Scene view={sceneView} reducedMotion={reducedMotion} quality={progress.quality} onMode={setRenderMode} /></TypeBeforeDeathSceneBoundary>}
    />
  </div>;
}
