"use client";

import dynamic from "next/dynamic";
import { flushSync } from "react-dom";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type ChangeEvent, type CompositionEvent, type FormEvent, type KeyboardEvent } from "react";
import type { GameComponentProps } from "@/components/games/game-client";
import { SkyfallInterface } from "@/components/games/falling-words/skyfall-interface";
import { SkyfallSceneBoundary } from "@/components/games/falling-words/scene-boundary";
import { createSkyfallState, startSkyfall, tickSkyfall, typeSkyfallKey, pauseSkyfall, resumeSkyfall, skyfallStats, type SkyfallMode, type SkyfallState } from "@/lib/games/falling-words/engine";
import { skyfallKeyboardKey } from "@/lib/games/falling-words/input";
import { createSkyfallNativeInput } from "@/components/games/falling-words/native-input";
import { completeSkyfallProgress, readSkyfallProgress, saveSkyfallProgress, type SkyfallProgress } from "@/lib/games/falling-words/progress";
import { createFallingWordsAudio } from "@/lib/games/falling-words/audio";
import type { FallingWordsRenderMode } from "@/lib/games/falling-words/visual-model";
import { getAuthGeneration, getCurrentUserId, subscribeCurrentUser } from "@/lib/auth/current-user";
import { recordGameResult, recordGameStart } from "@/lib/games/game-scores";
import { useGameBest } from "@/lib/games/use-game-best";
import { GAME_LIST } from "@/lib/games/game-types";
import { awardXp, bumpStat, checkSiteAchievements } from "@/lib/profile/player-profile";
import { useSettingsStore } from "@/lib/persistence/settings-store";
import { useGameViewport } from "@/lib/games/use-game-viewport";

const Scene = dynamic(() => import("@/components/games/falling-words/falling-words-visual-layer").then(m => m.FallingWordsVisualLayer), { ssr: false, loading: () => null });
const motionSnapshot = () => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const subscribeMotion = (fn: () => void) => {
  const query = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  query?.addEventListener("change", fn);
  return () => query?.removeEventListener("change", fn);
};

/** Account changes discard the attempt rather than crediting a previous owner. */
export function FallingWordsGame(props: GameComponentProps) {
  const generation = useSyncExternalStore(subscribeCurrentUser, getAuthGeneration, () => 0);
  return <SkyfallSession key={generation} {...props} owner={getCurrentUserId()} generation={generation} />;
}

function SkyfallSession({ definition, owner, generation }: GameComponentProps & { owner: string | null; generation: number }) {
  const [state, setState] = useState(() => createSkyfallState(definition));
  const stateRef = useRef(state);
  const [progress, setProgress] = useState(() => readSkyfallProgress(owner));
  const progressRef = useRef(progress);
  const [storageOk, setStorageOk] = useState(true);
  const [newBest, setNewBest] = useState(false);
  const [renderMode, setRenderMode] = useState<FallingWordsRenderMode | "loading">("loading");
  const [focused, setFocused] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const { containerRef: rootRef, metrics } = useGameViewport<HTMLDivElement>();
  const inputRef = useRef<HTMLInputElement>(null);
  const [nativeInput] = useState(createSkyfallNativeInput);
  const overlayRef = useRef<HTMLDivElement>(null);
  const lastClock = useRef<number | null>(null);
  const recorded = useRef(false);
  const [audio] = useState(createFallingWordsAudio);
  const best = useGameBest(definition.id);
  const soundEnabled = useSettingsStore(s => s.soundEnabled);
  const toggleSound = useSettingsStore(s => s.toggleSound);
  const enabledRef = useRef(soundEnabled);
  useLayoutEffect(() => { enabledRef.current = soundEnabled; if (!soundEnabled) audio.stop(); }, [audio, soundEnabled]);
  const systemReduced = useSyncExternalStore(subscribeMotion, motionSnapshot, () => false);
  const reducedMotion = systemReduced || progress.reducedMotion;
  const ownsRun = useCallback(() => owner === getCurrentUserId() && generation === getAuthGeneration(), [owner, generation]);

  const persist = useCallback((next: SkyfallProgress) => {
    if (!ownsRun()) return;
    progressRef.current = next; setProgress(next);
    setStorageOk(saveSkyfallProgress(owner, next));
  }, [owner, ownsRun]);

  const writeInput = useCallback((value: string | null, input = inputRef.current) => {
    if (value !== null && input && input.value !== value) input.value = value;
  }, []);
  const cancelInput = useCallback((next = stateRef.current) => { writeInput(nativeInput.cancel(next)); }, [nativeInput, writeInput]);
  const publish = useCallback((next: SkyfallState, nativeEdit = false) => {
    if (!ownsRun() || next === stateRef.current) return;
    const before = stateRef.current;
    stateRef.current = next; setState(next);
    if (next.status !== "running") cancelInput(next);
    else if (!nativeEdit && (next.typed !== before.typed || next.lockedId !== before.lockedId)) writeInput(nativeInput.reconcile(next));
    audio.transition(before, next, enabledRef.current);
    if (next.phase > before.phase) setAnnouncement(`${next.phaseName}. A new sky, a new challenge.`);
    else if (next.overdriveMs > 0 && before.overdriveMs === 0) setAnnouncement("Overdrive awakened. The city burns brighter.");
    else if (next.slowdownMs > before.slowdownMs) setAnnouncement("Frost field. Breathe. You have time.");
    else if (next.incorrectKeystrokes > before.incorrectKeystrokes) setAnnouncement("Wrong letter. Progress kept; clean streak reset.");
    else if (next.missed > before.missed) setAnnouncement(next.mode === "zen" ? "A signal passed. Zen continues; no lives lost." : "City shield breached. Watch the lowest crystal.");
    else if (next.cleared > before.cleared) setAnnouncement(next.combo % 5 === 0 ? `${next.combo} clean rescues. Keep that rhythm.` : "Signal rescued.");
    if (next.status === "over" && !recorded.current) {
      recorded.current = true;
      if (next.mode === "zen") return;
      persist(completeSkyfallProgress(progressRef.current, next));
      const stats = skyfallStats(next);
      const result = recordGameResult(definition.id, { score: next.score, cleared: next.cleared, bestCombo: next.bestCombo, survivedMs: next.elapsedMs, wpm: stats.wpm, accuracy: stats.accuracy });
      setNewBest(result.isNewBest);
      bumpStat(definition.id, "runs");
      awardXp(Math.round(next.score / 10) + next.cleared * 3);
      checkSiteAchievements(GAME_LIST.map(game => game.id));
    }
  }, [audio, cancelInput, definition.id, nativeInput, ownsRun, persist, writeInput]);

  const advanceClock = useCallback((nativeEdit = false) => {
    if (!ownsRun()) return;
    const now = performance.now(), previous = lastClock.current;
    lastClock.current = now;
    if (previous !== null) publish(tickSkyfall(stateRef.current, Math.max(0, now - previous)), nativeEdit);
  }, [ownsRun, publish]);
  const pause = useCallback(() => {
    if (stateRef.current.status !== "running") return;
    advanceClock(); publish(pauseSkyfall(stateRef.current));
    lastClock.current = null; audio.stop();
  }, [advanceClock, audio, publish]);
  const focusInput = useCallback(() => {
    if (inputRef.current && inputRef.current !== document.activeElement) inputRef.current.focus({ preventScroll: true });
  }, []);
  const resume = useCallback(() => {
    if (document.hidden || !ownsRun() || stateRef.current.status !== "paused") return;
    if (enabledRef.current) audio.warm();
    // Enabling the field must also happen inside the iOS resume gesture.
    lastClock.current = performance.now();
    flushSync(() => publish(resumeSkyfall(stateRef.current)));
    if (inputRef.current) inputRef.current.disabled = false;
    focusInput();
  }, [audio, focusInput, ownsRun, publish]);

  const running = state.status === "running";
  useEffect(() => {
    if (metrics.isKeyboardOpen && running) inputRef.current?.scrollIntoView({ block: "nearest", behavior: "instant" });
  }, [metrics.isKeyboardOpen, running]);
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(advanceClock, 50);
    return () => window.clearInterval(timer);
  }, [running, advanceClock]);
  useEffect(() => {
    const visibility = () => { if (document.hidden) pause(); };
    const escape = (event: globalThis.KeyboardEvent) => {
      if (event.defaultPrevented || skyfallKeyboardKey(event) !== "Escape" || !rootRef.current?.contains(event.target as Node | null)) return;
      if (stateRef.current.status === "paused") { event.preventDefault(); resume(); }
      else if (stateRef.current.status === "running") { event.preventDefault(); pause(); }
    };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("blur", pause);
    window.addEventListener("keydown", escape);
    return () => { document.removeEventListener("visibilitychange", visibility); window.removeEventListener("blur", pause); window.removeEventListener("keydown", escape); };
  }, [pause, resume, rootRef]);
  const overdriveActive = state.overdriveMs > 0;
  useEffect(() => {
    // A pending effect must not restart audio after a synchronous mute gesture.
    audio.reconcileMusic(state.status, enabledRef.current, state.phase, overdriveActive);
  }, [audio, state.status, state.phase, overdriveActive, soundEnabled]);
  useEffect(() => () => { lastClock.current = null; cancelInput(); audio.stop(); }, [audio, cancelInput]);
  useEffect(() => {
    if (state.status === "paused" || state.status === "over") overlayRef.current?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
    else if (state.status === "running") focusInput();
  }, [state.status, focusInput]);

  const begin = (mode: SkyfallMode) => {
    if (!ownsRun()) return;
    audio.stop(); recorded.current = false; setNewBest(false);
    const width = rootRef.current?.getBoundingClientRect().width || window.innerWidth;
    const lanes = width < 360 ? 2 : width < 640 ? 3 : width < 960 ? 4 : 6;
    const next = startSkyfall(definition, { mode, laneCount: lanes, seed: `skyfall-${Date.now().toString(36)}` });
    if (stateRef.current.status !== "idle") cancelInput(next);
    stateRef.current = next;
    // iOS opens its keyboard only when the newly mounted input is focused in
    // the original click gesture, not in a later passive effect.
    flushSync(() => setState(next));
    lastClock.current = performance.now();
    setAnnouncement(mode === "zen" ? "A calm sky. No lives, no records, no pressure." : "Transmission live. Protect the last light.");
    if (mode === "standard") recordGameStart(definition.id);
    if (enabledRef.current) { audio.warm(); audio.startMusic(true); }
    // Focus synchronously from the gesture; a second status effect handles desktop.
    if (inputRef.current) { inputRef.current.disabled = false; focusInput(); }
    rootRef.current?.scrollIntoView({ block: "start", behavior: "instant" });
  };
  const menu = () => {
    if (!ownsRun()) return;
    audio.stop(); lastClock.current = null;
    stateRef.current = createSkyfallState(definition);
    cancelInput();
    flushSync(() => setState(stateRef.current));
    rootRef.current?.querySelector?.<HTMLButtonElement>("[data-skyfall-start]")?.focus({ preventScroll: true });
    setAnnouncement("");
  };
  const finishPractice = () => {
    if (stateRef.current.mode !== "zen" || !["running", "paused"].includes(stateRef.current.status)) return;
    advanceClock(); publish({ ...stateRef.current, status: "over" });
    lastClock.current = null; audio.stop();
  };
  const typeKey = useCallback((key: string) => {
    if (stateRef.current.status !== "running" || !ownsRun()) return;
    advanceClock();
    if (stateRef.current.status !== "running") return;
    writeInput(nativeInput.physical(key, stateRef.current, letter => {
      publish(typeSkyfallKey(stateRef.current, letter), true);
      return stateRef.current;
    }));
  }, [advanceClock, nativeInput, ownsRun, publish, writeInput]);
  const onInputKey = (event: KeyboardEvent<HTMLInputElement>) => {
    const key = skyfallKeyboardKey(event.nativeEvent);
    if (key === "Escape") { event.preventDefault(); pause(); return; }
    if (key === "Tab") { pause(); return; }
    if (event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229 || event.key === "Process" || nativeInput.isComposing()) return;
    if (key) { event.preventDefault(); typeKey(key); }
    else if (event.nativeEvent.repeat || event.key === " " || event.key === "Enter") event.preventDefault();
  };
  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const native = event.nativeEvent as InputEvent;
    if (!ownsRun() || stateRef.current.status !== "running") { writeInput(nativeInput.cancel(stateRef.current), event.currentTarget); return; }
    const raw = event.currentTarget.value;
    advanceClock(true);
    if (stateRef.current.status !== "running") { writeInput(nativeInput.cancel(stateRef.current), event.currentTarget); return; }
    writeInput(nativeInput.change(raw, native, stateRef.current, key => {
      publish(typeSkyfallKey(stateRef.current, key), true);
      return stateRef.current;
    }), event.currentTarget);
  };
  const beforeNativeInput = useCallback((native: InputEvent) => {
    if (!ownsRun() || stateRef.current.status !== "running" || !nativeInput.before(native)) native.preventDefault();
  }, [nativeInput, ownsRun]);
  const hasInput = state.status !== "idle";
  useEffect(() => {
    const input = inputRef.current;
    if (!hasInput || !input) return;
    // React's beforeinput can be a textInput/compositionend polyfill. The real
    // native event distinguishes a fresh phone edit from a completion echo.
    input.addEventListener("beforeinput", beforeNativeInput);
    return () => input.removeEventListener("beforeinput", beforeNativeInput);
  }, [hasInput, beforeNativeInput]);
  const onBeforeInput = (event: FormEvent<HTMLInputElement>) => {
    const native = event.nativeEvent as InputEvent;
    if (!ownsRun() || stateRef.current.status !== "running" || !nativeInput.before(native)) event.preventDefault();
  };
  const onCompositionStart = (event: CompositionEvent<HTMLInputElement>) => {
    if (!ownsRun() || stateRef.current.status !== "running") { writeInput(nativeInput.cancel(stateRef.current), event.currentTarget); return; }
    writeInput(nativeInput.start(event.currentTarget.value, stateRef.current), event.currentTarget);
  };
  const onCompositionEnd = (event: CompositionEvent<HTMLInputElement>) => {
    if (!ownsRun() || stateRef.current.status !== "running") { writeInput(nativeInput.cancel(stateRef.current), event.currentTarget); return; }
    // Completion itself is not another keystroke, even if the candidate differs.
    writeInput(nativeInput.end(event.currentTarget.value, stateRef.current), event.currentTarget);
  };
  const onSound = () => {
    const enabled = !enabledRef.current;
    enabledRef.current = enabled;
    if (enabled) audio.warm(); else audio.stop();
    toggleSound();
    const current = stateRef.current;
    audio.reconcileMusic(current.status, enabled, current.phase, current.overdriveMs > 0);
  };
  const preferences = (changes: Partial<Pick<SkyfallProgress, "quality" | "reducedMotion" | "touchKeys">>) => {
    persist({ ...progressRef.current, ...changes });
    if (changes.touchKeys) { cancelInput(); inputRef.current?.blur(); }
  };
  const preview = state.status === "idle" ? { ...state, words: [
    { id: -1, lane: 0, text: "orbit", kind: "normal" as const, progress: .20, fallMs: 9000, highWater: 0 },
    { id: -2, lane: 1, text: "light", kind: "golden" as const, progress: .44, fallMs: 9000, highWater: 0 },
    { id: -3, lane: 2, text: "bloom", kind: "freeze" as const, progress: .11, fallMs: 9000, highWater: 0 },
  ], laneCount: 3, fever: 35 } : state;

  return <SkyfallInterface state={state} progress={progress} best={best} newBest={newBest} renderMode={renderMode} reducedMotion={reducedMotion} soundEnabled={soundEnabled} storageOk={storageOk} focused={focused} announcement={announcement} rootRef={rootRef} inputRef={inputRef} overlayRef={overlayRef}
    onStart={begin} onPause={pause} onResume={resume} onMenu={menu} onFinishPractice={finishPractice} onFocus={focusInput} onFocused={setFocused} onSound={onSound} onPreferences={preferences} onInputKey={onInputKey} onInputChange={onInputChange} onBeforeInput={onBeforeInput} onCompositionStart={onCompositionStart} onCompositionEnd={onCompositionEnd} onInputBlur={() => cancelInput()} onTouchKey={typeKey}
    scene={<SkyfallSceneBoundary onFallback={() => setRenderMode("static")}><Scene state={preview} laneCount={preview.laneCount} quality={progress.quality} reducedMotion={reducedMotion} onMode={setRenderMode} /></SkyfallSceneBoundary>} />;
}
