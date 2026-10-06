"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, ChevronRight, Diamond, Heart, Keyboard, Leaf, LockKeyhole, Pause, Play, Radio, RotateCcw, Settings2, Shield, Snowflake, Sparkles, Trophy, Volume2, VolumeX, Zap } from "lucide-react";
import type { CSSProperties, ReactNode, RefObject, KeyboardEvent, ChangeEvent, CompositionEvent, FormEvent } from "react";
import type { GameBest } from "@/lib/games/game-scores";
import { DESTROY_EFFECT_MS, skyfallStats, type SkyfallMode, type SkyfallState } from "@/lib/games/falling-words/engine";
import { SKYFALL_SIGNALS, type SkyfallProgress } from "@/lib/games/falling-words/progress";
import { fallingWordScreenPosition, type FallingWordsRenderMode } from "@/lib/games/falling-words/visual-model";
import styles from "./skyfall.module.css";

export interface SkyfallInterfaceProps {
  state: SkyfallState;
  progress: SkyfallProgress;
  best: GameBest | null;
  newBest: boolean;
  renderMode: FallingWordsRenderMode | "loading";
  reducedMotion: boolean;
  soundEnabled: boolean;
  storageOk: boolean;
  focused: boolean;
  announcement: string;
  scene: ReactNode;
  rootRef: RefObject<HTMLDivElement | null>;
  inputRef: RefObject<HTMLInputElement | null>;
  overlayRef: RefObject<HTMLDivElement | null>;
  onStart: (mode: SkyfallMode) => void;
  onPause: () => void;
  onResume: () => void;
  onMenu: () => void;
  onFinishPractice: () => void;
  onFocus: () => void;
  onFocused: (focused: boolean) => void;
  onSound: () => void;
  onPreferences: (changes: Partial<Pick<SkyfallProgress, "quality" | "reducedMotion" | "touchKeys">>) => void;
  onInputKey: (event: KeyboardEvent<HTMLInputElement>) => void;
  onInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onBeforeInput: (event: FormEvent<HTMLInputElement>) => void;
  onCompositionStart: (event: CompositionEvent<HTMLInputElement>) => void;
  onCompositionEnd: (event: CompositionEvent<HTMLInputElement>) => void;
  onInputBlur: () => void;
  onTouchKey: (key: string) => void;
}

const KIND_LABEL = { normal: "signal", golden: "gold", freeze: "frost", elite: "elite", hazard: "hazard" };
const phases = ["Scout", "Surge", "Threats", "Swarm", "Frenzy"];
const clock = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}`;
const number = (n: number) => Math.round(n).toLocaleString("en-US");
const keyRows = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

export function SkyfallInterface({ rootRef, inputRef, overlayRef, ...p }: SkyfallInterfaceProps) {
  const { state, progress } = p;
  const menu = state.status === "idle", running = state.status === "running", ended = state.status === "over", zen = state.mode === "zen";
  const stats = skyfallStats(state);
  const target = state.words.find(word => word.id === state.lockedId);
  const nearest = target ?? [...state.words].sort((a, b) => b.progress - a.progress || a.id - b.id)[0];
  const urgent = state.words.some(word => word.progress > .78);
  const signal = SKYFALL_SIGNALS.find(s => progress.totalCleared < s.at);
  const signalName = [...SKYFALL_SIGNALS].reverse().find(s => progress.totalCleared >= s.at)?.name ?? "New guardian";
  const currentPhaseEnd = [10, 25, 45, 70, 100][state.phase - 1];
  const overdrive = state.overdriveMs > 0;

  return <div ref={rootRef} className={styles.shell} data-status={state.status} data-calm={p.reducedMotion} data-touch={progress.touchKeys && running}>
    <header className={styles.topbar}>
      <Link href="/games" className={styles.back}><ArrowLeft size={15} /><span>Arcade</span></Link>
      <div className={styles.identity}><Diamond size={19} /><div><b>Falling Words</b><span>SKYFALL PROTOCOL</span></div></div>
      <div className={styles.tools}>
        <span className={styles.renderMode}>{p.renderMode === "webgl" ? "3D ONLINE" : p.renderMode === "loading" ? "CONNECTING" : "SAFE RENDER"}</span>
        <button type="button" className={styles.iconButton} onClick={p.onSound} aria-label={p.soundEnabled ? "Mute Skyfall audio" : "Enable Skyfall audio"} aria-pressed={p.soundEnabled}>{p.soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}</button>
        {!menu && !ended && <button type="button" className={styles.iconButton} onClick={running ? p.onPause : p.onResume} aria-label={running ? "Pause storm" : "Resume storm"}>{running ? <Pause size={18} /> : <Play size={18} />}</button>}
        <details className={styles.settings} onToggle={e => { if (e.currentTarget.open && running) p.onPause(); }}>
          <summary className={styles.iconButton} aria-label="Scene and input settings"><Settings2 size={18} /></summary>
          <div className={styles.settingsPanel}>
            <b>Make it your sky</b>
            <label>Visual quality<select value={progress.quality} onChange={e => p.onPreferences({ quality: e.target.value as SkyfallProgress["quality"] })}><option value="auto">Auto · device aware</option><option value="low">Low · conserve energy</option><option value="high">High · full atmosphere</option></select></label>
            <label className={styles.check}><input type="checkbox" checked={progress.reducedMotion} onChange={e => p.onPreferences({ reducedMotion: e.target.checked })} />Reduced effects <small>OS preference always respected</small></label>
            <label className={styles.check}><input type="checkbox" checked={progress.touchKeys} onChange={e => p.onPreferences({ touchKeys: e.target.checked })} />Built-in touch keyboard <small>Or use your device keyboard</small></label>
            <p>Only visuals change. Scoring and the storm clock stay honest.</p>
          </div>
        </details>
      </div>
    </header>

    {!menu && <div className={styles.hud}>
      <div className={styles.score}><span>{zen ? "PRACTICE SCORE" : "RESCUE SCORE"}</span><b>{number(state.score)}</b></div>
      <div className={styles.integrity}><span><Shield size={12} />{zen ? "CALM SKY · NO LIFE LOSS" : "CITY INTEGRITY"}</span><div aria-label={zen ? "Practice is nonfatal" : `${state.lives} of 3 lives remain`}>{[0, 1, 2].map(i => <Heart key={i} size={17} className={i < state.lives ? styles.heart : styles.emptyHeart} fill={i < state.lives ? "currentColor" : "none"} />)}</div></div>
      <div className={styles.metric}><b>{stats.wpm.toFixed(0)}</b><span>OUTPUT WPM</span></div>
      <div className={styles.metric}><b>{stats.accuracy.toFixed(0)}<small>%</small></b><span>ACCURACY</span></div>
      <div className={styles.metric}><b>{clock(state.elapsedMs)}</b><span>ACTIVE TIME</span></div>
    </div>}

    <div className={styles.arena} onClick={e => { if (!(e.target as Element).closest("button,a,input,select,details,summary")) p.onFocus(); }} aria-label="Skyfall crystal arena">
      {p.scene}
      <div className={styles.vignette} aria-hidden="true" />
      <div className={styles.coordinates} aria-hidden="true"><span>SECTOR 07 · THE LAST SKYLINE</span><span>35° N / 139° E</span></div>
      {!menu && <>
        <div className={styles.arenaStatus}><span><i />{zen ? "ZEN TRANSMISSION" : `PHASE 0${state.phase} · ${state.phaseName.toUpperCase()}`}</span><span className={urgent ? styles.warningText : ""}>{state.slowdownMs > 0 ? `FROST FIELD · ${(state.slowdownMs / 1000).toFixed(1)}s` : urgent ? "BREACH APPROACHING" : "SIGNALS DESCENDING"}</span></div>
        <ul className={styles.words} aria-label="Falling target words">
          {state.words.map(word => {
            const pos = fallingWordScreenPosition(word.lane, word.progress, state.laneCount);
            const locked = word.id === state.lockedId;
            return <li key={word.id} className={`${styles.word} ${styles[word.kind]} ${locked ? styles.locked : ""} ${word.progress > .78 ? styles.dangerWord : ""}`} style={{ left: `${pos.x * 100}%`, top: `${pos.y * 100}%`, "--drop-scale": .88 + word.progress * .15 } as CSSProperties}>
              <small>{locked ? "LOCKED" : KIND_LABEL[word.kind]}</small>
              <span><em>{locked ? word.text.slice(0, state.typed.length) : ""}</em>{word.text.slice(locked ? state.typed.length : 0)}</span>
            </li>;
          })}
        </ul>
        {state.destroyed.map(effect => {
          const pos = fallingWordScreenPosition(effect.lane, effect.progress, state.laneCount);
          const t = Math.min(1, (state.elapsedMs - effect.bornMs) / DESTROY_EFFECT_MS);
          return <span aria-hidden="true" key={effect.seq} className={styles.points} style={{ left: `${pos.x * 100}%`, top: `${pos.y * 100}%`, opacity: p.reducedMotion ? 1 : 1 - t, transform: `translate(-50%, ${p.reducedMotion ? -18 : -18 - t * 20}px)` }}>+{effect.points}</span>;
        })}
        <div className={styles.defense} aria-hidden="true"><span>DEFENSE LINE</span><div /><span>CORE {zen ? "∞" : `${Math.round(state.lives / 3 * 100)}%`}</span></div>
        {running && !p.focused && !progress.touchKeys && <button className={styles.focusPrompt} type="button" onClick={p.onFocus}><Keyboard size={16} /> Tap to reconnect keyboard</button>}
      </>}

      {menu && <Intro progress={progress} best={p.best} signalName={signalName} onStart={p.onStart} />}
      {(state.status === "paused" || ended) && <div ref={overlayRef} className={styles.overlay}>
        {state.status === "paused" ? <div className={styles.resultPanel}>
          <span className={styles.eyebrow}><Pause size={13} /> TRANSMISSION HELD</span><h2>The city can wait.</h2><p>The storm, words and clock are frozen. Your next letter is exactly where you left it.</p>
          <button type="button" className={styles.primary} onClick={p.onResume}><Play size={16} />Resume transmission</button>
          <button type="button" className={styles.secondary} onClick={p.onMenu}>Return to observatory</button>
          {zen && <button type="button" className={styles.textButton} onClick={p.onFinishPractice}>Finish practice</button>}
          <Link href="/games" className={styles.textButton}>Exit to arcade</Link>
          <small>Leaving an unfinished standard run does not save a score.</small>
        </div> : <div className={styles.resultPanel} role="region" aria-label="Skyfall run results">
          <span className={styles.eyebrow}>{zen ? <Leaf size={14} /> : <Trophy size={14} />}{zen ? "PRACTICE COMPLETE" : p.newBest ? "A NEW LIGHT ON THE HORIZON" : "THE STORM PASSED"}</span>
          <h2>{zen ? "Find your rhythm." : p.newBest ? "Your best night yet." : "Every word mattered."}</h2><p>{zen ? "No lives, records or XP. Just you, the sky, and a little more confidence." : `${state.cleared} words rescued. ${state.phaseName} reached. The skyline is ready for another watch.`}</p>
          <div className={styles.resultScore}>{number(state.score)}<span>{zen ? "PRACTICE POINTS" : "RESCUE SCORE"}</span></div>
          <dl className={styles.results}><Result label="Unique-output WPM" value={stats.wpm.toFixed(1)} /><Result label="Keystroke accuracy" value={`${stats.accuracy.toFixed(1)}%`} /><Result label="Words rescued" value={String(state.cleared)} /><Result label="Best clean streak" value={String(state.bestCombo)} /><Result label="Storm time" value={clock(state.elapsedMs)} /><Result label="Phase reached" value={`${state.phase} / 5`} /></dl>
          {!zen && <div className={styles.signalResult}><Radio size={15} /> {signal ? `Next signal: ${signal.name} · ${progress.totalCleared}/${signal.at} total rescues` : "All four skyline signals restored."}</div>}
          <button type="button" className={styles.primary} onClick={() => p.onStart(state.mode)}><RotateCcw size={16} />One more night</button>
          <button type="button" className={styles.secondary} onClick={p.onMenu}>Return to observatory</button>
          <small>{state.outputChars} unique letters · retyping cannot inflate WPM. This is a combat course, not a standardized typing test.</small>
        </div>}
      </div>}
    </div>

    {!menu && <>
      <div className={styles.powerStrip}>
        <div className={styles.phaseTrack} aria-label={`Phase ${state.phase} of 5`}>{phases.map((phase, i) => <span key={phase} className={i < state.phase ? styles.phaseActive : ""}><i />{phase}</span>)}</div>
        <div className={styles.charge}><span><Zap size={13} />{overdrive ? `OVERDRIVE · ${(state.overdriveMs / 1000).toFixed(1)}s` : "OVERDRIVE CHARGE"}</span><progress aria-label="Overdrive charge" max={100} value={overdrive ? 100 : state.fever} /><b>{overdrive ? "1.5×" : `${Math.round(state.fever)}%`}</b></div>
      </div>
      <ul className={styles.threats} aria-label="All target words, most urgent first">{[...state.words].sort((a, b) => b.progress - a.progress || a.id - b.id).map(word => <li key={word.id} className={`${styles[word.kind]} ${word.id === state.lockedId ? styles.threatLocked : ""}`}><span>{word.text}</span><progress max={1} value={word.progress} aria-label={`${word.text} approach to defense line`} /></li>)}</ul>
      <div className={styles.console}>
        <div className={styles.targetReadout}><span>{target ? "TARGET ACQUIRED" : "PRIORITY SIGNAL"}</span><b>{nearest ? <><em>{target ? state.typed : ""}</em>{nearest.text.slice(target ? state.typed.length : 0)}</> : "Reading the sky…"}</b><small>{state.combo > 1 ? `${state.combo} clean words · ` : ""}{state.phase < 5 ? `${state.cleared}/${currentPhaseEnd} toward next phase` : `${state.cleared} rescued · final phase`}</small></div>
        <div className={styles.inputBlock}>
          <label htmlFor="skyfall-input"><Keyboard size={13} />{progress.touchKeys ? "TOUCH TRANSMISSION" : "TYPE TO RESCUE"}</label>
          {/* Uncontrolled deliberately: game ticks must not reset an active IME
              range. The controller projects the field at edit/session boundaries. */}
          <input ref={inputRef} id="skyfall-input" defaultValue="" onChange={p.onInputChange} onBeforeInput={p.onBeforeInput} onKeyDown={p.onInputKey} onFocus={() => p.onFocused(true)} onBlur={e => { p.onInputBlur(); p.onFocused(false); if (running && !rootRef.current?.contains(e.relatedTarget as Node | null)) p.onPause(); }} onPaste={e => e.preventDefault()} onDrop={e => e.preventDefault()} onCompositionStart={p.onCompositionStart} onCompositionEnd={p.onCompositionEnd} disabled={!running} autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false} inputMode={progress.touchKeys ? "none" : "text"} enterKeyHint="done" data-gramm="false" placeholder="First letter locks a word…" aria-label="Falling Words typing input" aria-describedby="skyfall-input-help" />
        </div>
        <button type="button" className={styles.touchToggle} aria-pressed={progress.touchKeys} onClick={() => p.onPreferences({ touchKeys: !progress.touchKeys })}><Keyboard size={17} /><span>Touch keys</span></button>
      </div>
      {progress.touchKeys && running && <div className={styles.touchKeyboard} aria-label="Built-in typing keyboard">{keyRows.map(row => <div key={row}>{row.split("").map(key => <button key={key} type="button" aria-label={`Type ${key}`} onPointerDown={e => e.preventDefault()} onClick={() => p.onTouchKey(key)}>{key}</button>)}{row === "zxcvbnm" && <button type="button" aria-label="Delete last character" onPointerDown={e => e.preventDefault()} onClick={() => p.onTouchKey("Backspace")}><ArrowLeft size={16} /></button>}</div>)}</div>}
      <p id="skyfall-input-help" className={styles.inputHelp}>Complete words fire automatically. Backspace corrects · Esc pauses · Tab pauses and moves focus. Device and built-in touch keyboards supported.</p>
      {zen && running && <button type="button" className={styles.finishPractice} onClick={p.onFinishPractice}>Finish practice <Check size={14} /></button>}
    </>}
    <p className={styles.announcement} role="status" aria-live="polite">{p.announcement || (menu ? "The skyline is waiting for you." : state.slowdownMs > 0 ? "Frost field active. A little room to breathe." : "Read the lowest threat. Keep the light alive.")}</p>
    {!p.storageOk && <p className={styles.storageWarning} role="alert">Device storage is unavailable. Play still works; local skyline signals may not survive reload.</p>}
    <details className={styles.fieldGuide}><summary>Field notes <ChevronRight size={13} /></summary><div><p><Diamond size={14} />Signals: complete a word to shatter its crystal. First letters lock a target; wrong letters keep your progress but break the streak.</p><p><Sparkles size={14} />Gold: 3× word value. Elite: longer words. Hazards: faster falling, higher rewards.</p><p><Snowflake size={14} />Frost: slows every active crystal for 3.5 seconds. Overdrive: earned from clean clears; 1.5× scoring and gentler new arrivals for 7 seconds.</p><p><Leaf size={14} />Zen is nonfatal practice, not a record mode. Skyline signals are stored on this device, separated by account. Interrupted runs do not resume.</p><p>Original low-poly procedural visuals and synthesized soundtrack. Canvas/text fallback keeps the same game playable when graphics or audio are unavailable.</p></div></details>
  </div>;
}

function Intro({ progress, best, signalName, onStart }: { progress: SkyfallProgress; best: GameBest | null; signalName: string; onStart: (mode: SkyfallMode) => void }) {
  return <div className={styles.intro}>
    <div className={styles.introCopy}>
      <span className={styles.eyebrow}><Radio size={13} /> A HEROTYPING ORIGINAL</span>
      <h2>Falling<br /><em>Words.</em></h2>
      <span className={styles.protocol}>S K Y F A L L &nbsp; P R O T O C O L</span>
      <p className={styles.story}>One city. One last light.<br />The sky is falling. Your words hold it up.</p>
      <p className={styles.introHint}>Type the falling signals. Shatter the crystals. Protect the core long enough to turn the night into dawn.</p>
      <div className={styles.startActions}><button type="button" data-skyfall-start className={styles.primary} onClick={() => onStart("standard")}><Play size={16} fill="currentColor" />Enter the storm<ArrowRight size={16} /></button><button type="button" className={styles.zenButton} onClick={() => onStart("zen")}><Leaf size={16} />Find your rhythm<span>Zen practice</span></button></div>
      <p className={styles.startHelp}><Keyboard size={13} />Desktop · tablet · phone. Physical, device or touch keyboard.</p>
      <div className={styles.personal}><div><span>YOUR CALLSIGN</span><b>{signalName}</b></div><div><span>PERSONAL BEST</span><b>{best ? number(best.score) : "—"}</b></div></div>
    </div>
    <aside className={styles.missionCard}><span className={styles.missionIndex}>01 / 05</span><h3>Keep the<br />light alive.</h3><div className={styles.missionRule} /><p>Three lives. Five phases.<br />Every clear is a small rescue.</p><div className={styles.signals}>{SKYFALL_SIGNALS.map(signal => <span key={signal.name} className={progress.totalCleared >= signal.at ? styles.signalUnlocked : ""}>{progress.totalCleared >= signal.at ? <Check size={12} /> : <LockKeyhole size={11} />}<b>{signal.name}</b><small>{signal.at} rescues</small></span>)}</div><small className={styles.localNote}>{progress.totalCleared} words rescued across {progress.runs} finished nights.<br />Your constellation stays on this device.</small></aside>
  </div>;
}
function Result({ label, value }: { label: string; value: string }) { return <div><dt>{label}</dt><dd>{value}</dd></div>; }
