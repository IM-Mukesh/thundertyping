"use client";

import Link from "next/link";
import { Flame, Keyboard, LockKeyhole, Pause, Play, RotateCcw, Shield, Skull, Snowflake, Swords, Trophy, Volume2, VolumeX, Zap } from "lucide-react";
import type { KeyboardEvent, ReactNode, RefObject } from "react";
import { ENEMY_DEFINITIONS, SPECIALS, WAR_STAGES } from "@/lib/games/rakshasa/content";
import { warStats } from "@/lib/games/rakshasa/engine";
import { unlockedWarSpecials, unlockedWarStage, type WarProgress } from "@/lib/games/rakshasa/progress";
import type { WarStage, WarState } from "@/lib/games/rakshasa/types";
import styles from "./war.module.css";

interface Props {
  gameName: string;
  state: WarState; progress: WarProgress; stage: WarStage; selectedStage: number;
  onSelectStage: (stage: number) => void;
  onBegin: (tutorial?: boolean, stage?: number) => void;
  onPause: () => void; onResume: () => void; onMenu: () => void;
  onPreferences: (changes: Partial<Pick<WarProgress, "difficulty" | "quality" | "reducedMotion">>) => void;
  soundEnabled: boolean; onSound: () => void; mode: "loading" | "webgl" | "fallback";
  storageOk: boolean; newBest: boolean; reducedMotion: boolean;
  boardRef: RefObject<HTMLDivElement | null>; overlayRef: RefObject<HTMLDivElement | null>;
  onBoardKey: (event: KeyboardEvent<HTMLDivElement>) => void;
  scene: ReactNode;
}
const iconFor = [Zap, Snowflake, Flame];
const rounded = (n: number) => Math.round(n).toLocaleString("en-US");

export function WarInterface({ gameName, state, progress, stage, selectedStage, onSelectStage, onBegin, onPause, onResume, onMenu,
  onPreferences, soundEnabled, onSound, mode, storageOk, newBest, reducedMotion, boardRef, overlayRef, onBoardKey, scene }: Props) {
  const titleSeparator = gameName.indexOf(": ");
  const mainTitle = titleSeparator === -1 ? gameName : gameName.slice(0, titleSeparator + 1);
  const subtitle = titleSeparator === -1 ? "" : gameName.slice(titleSeparator + 2);
  const menu = state.phase === "menu";
  const end = state.phase === "victory" || state.phase === "defeat";
  const active = ["tutorial", "playing", "boss", "finisher"].includes(state.phase);
  const stats = warStats(state);
  const target = state.enemies.find((enemy) => enemy.id === state.targetId);
  const hint = target ?? [...state.enemies].sort((a, b) => b.progress - a.progress || a.id - b.id)[0];
  const boss = state.boss;
  const cinematic = state.phase === "finisher" && boss && boss.typed === boss.text.length;
  const unlocked = unlockedWarSpecials(progress);

  return <>
    <header className={styles.brandBar}>
      <Link href="/games" className={styles.brand}>HeroTyping <span>/ {gameName}</span></Link>
      <div className={styles.utility}>
        <span className={styles.renderMode}>{mode === "webgl" ? "PROCEDURAL 3D" : mode === "fallback" ? "TACTICAL FALLBACK" : "LOADING SCENE"}</span>
        <button type="button" onClick={onSound} aria-label={soundEnabled ? "Mute game audio" : "Enable game audio"} aria-pressed={soundEnabled}>
          {soundEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
        </button>
        {!menu && !end && <button type="button" onClick={state.phase === "paused" ? onResume : onPause} aria-label={state.phase === "paused" ? "Resume combat" : "Pause combat"}>
          {state.phase === "paused" ? <Play size={17} /> : <Pause size={17} />}
        </button>}
      </div>
    </header>

    <div ref={boardRef} className={styles.board} tabIndex={0} onKeyDown={onBoardKey}
      onBlur={(event) => { if (active && !event.currentTarget.contains(event.relatedTarget as Node | null)) onPause(); }}
      onPointerDown={(event) => {
        if (event.target instanceof Element && !event.target.closest("button,a,select,input,details,summary")) event.currentTarget.focus({ preventScroll: true });
      }}
      role="region" aria-label={`${gameName} battlefield. Type enemy words with a physical keyboard. Escape pauses; Tab pauses and moves focus.`}
      aria-describedby="war-keyboard-help">
      <div className={styles.scene}>{scene}</div>
      {!menu && <div className={styles.hud}>
        <div className={styles.healthPanel}>
          <div><Shield size={14} /> <span>VITALITY</span><b>{rounded(state.health)} / 100</b></div>
          <meter min={0} max={100} value={state.health} aria-label="Warrior health" />
        </div>
        <div className={styles.stageHud}><span>{state.tutorialStep ? "TRAINING GROUNDS" : `CHAPTER ${state.stage + 1} / 8`}</span><b>{stage.name}</b>
          <small>{boss ? `COMMANDER · ${state.phase === "finisher" ? "FINAL EXECUTION" : `PHASE ${Math.min(3, boss.phase + 1)} / 3`}` : `WAVE ${Math.max(1, state.wave)} / 3`}</small></div>
        <div className={styles.scorePanel}><span>SCORE</span><b>{rounded(state.score)}</b><small>{state.combo}× streak · {state.bestCombo} best</small></div>
      </div>}

      {menu && <div className={styles.menuOverlay}>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}><Swords size={16} /> A HEROTYPING CAMPAIGN</p>
          <h2 className={styles.title} aria-label={gameName}>{mainTitle}{subtitle && <> <span>{subtitle}</span></>}</h2>
          <p className={styles.tagline}>TYPE. FIGHT. SURVIVE.</p>
          <p className={styles.story}>Eight fallen kingdoms. One unbroken blade.<br />Every correct letter strikes. Every word turns the tide.</p>
          <div className={styles.menuActions}>
            <button type="button" className={styles.primary} disabled={mode === "loading"} onClick={() => onBegin(false)}><Swords size={18} /> {mode === "loading" ? "Preparing battlefield…" : progress.completed.length ? "Enter battlefield" : "Begin the war"}</button>
            <button type="button" className={styles.secondary} disabled={mode === "loading"} onClick={() => onBegin(true, 0)}><Keyboard size={17} /> {progress.tutorialDone ? "Replay training" : "Learn to fight"}</button>
          </div>
          <p className={styles.mobileNotice} id="war-keyboard-help"><Keyboard size={15} /> Physical keyboard required for combat. Mobile menus work; use a laptop, desktop or connected keyboard to fight.</p>
          <div className={styles.preferences}>
            <label>Difficulty<select value={progress.difficulty} onChange={(event) => onPreferences({ difficulty: event.target.value as WarProgress["difficulty"] })}>
              <option value="easy">Easy · patient ranks</option><option value="normal">Normal · hold the line</option><option value="hard">Hard · relentless war</option>
            </select></label>
            <label>Render quality<select value={progress.quality} onChange={(event) => onPreferences({ quality: event.target.value as WarProgress["quality"] })}>
              <option value="auto">Auto</option><option value="low">Low · fewer effects</option><option value="high">High</option>
            </select></label>
            <label className={styles.checkbox}><input type="checkbox" checked={reducedMotion} onChange={(event) => onPreferences({ reducedMotion: event.target.checked })} /> Reduced effects <small>(OS preference respected)</small></label>
          </div>
        </div>
        <nav className={styles.campaign} aria-label="Campaign battlefields">
          <div className={styles.chapterHeading}><span>THE WAR MAP</span><b>{progress.completed.length} / 8 liberated</b></div>
          {WAR_STAGES.map((chapter) => {
            const locked = chapter.id > unlockedWarStage(progress);
            const completed = progress.completed.includes(chapter.id);
            return <button key={chapter.id} type="button" className={`${styles.chapter} ${chapter.id === selectedStage ? styles.selected : ""}`}
              disabled={locked} aria-pressed={chapter.id === selectedStage} onClick={() => onSelectStage(chapter.id)}>
              <span className={styles.chapterNumber}>{locked ? <LockKeyhole size={15} /> : completed ? <Trophy size={15} /> : String(chapter.id + 1).padStart(2, "0")}</span>
              <span><b>{chapter.name}</b><small>{locked ? "Liberate the previous battlefield" : chapter.subtitle}</small></span>
              {!locked && <span aria-hidden="true">›</span>}
            </button>;
          })}
          <p>Unlocks stay on this device, separated by account. Completed score saves use the existing HeroTyping save system.</p>
        </nav>
      </div>}

      {(state.phase === "intro" || state.phase === "boss-intro") && <div className={styles.cinematicOverlay}>
        <p className={styles.kicker}>{state.phase === "intro" ? `CHAPTER ${state.stage + 1}` : "THE COMMANDER ARRIVES"}</p>
        <h2>{state.phase === "intro" ? stage.name : boss?.name}</h2>
        <p>{state.phase === "intro" ? stage.intro : "Three sentences. One final oath. Complete each before the charged strike."}</p>
        <span className={styles.cinematicRule} />
      </div>}

      {active && !cinematic && boss && <div className={styles.bossHud}>
        <div><Skull size={16} /><b>{boss.name}</b><span>{state.phase === "finisher" ? "FINISHER" : `STANCE ${boss.phase + 1}`}</span></div>
        <meter min={0} max={boss.maxHp} value={boss.hp} aria-label="Commander vitality" />
        <div className={styles.chargeLabel}><span>CHARGED STRIKE</span><b>{Math.max(0, (boss.chargeLimitMs - boss.chargeMs) / 1000).toFixed(1)}s</b></div>
        <progress value={boss.chargeMs} max={boss.chargeLimitMs} aria-label="Commander attack charge" />
      </div>}

      {cinematic && <div className={styles.cinematicOverlay}>
        <p className={styles.kicker}>THE LAST WORD IS YOURS</p><h2>Shadow broken.</h2><p>Your blade follows your final oath.</p>
      </div>}

      {(state.phase === "paused" || end) && <div ref={overlayRef} className={styles.overlay}>
        <section className={styles.result} role="region" aria-label={state.phase === "paused" ? "Combat paused" : "Combat results"}>
          <p className={styles.kicker}>{state.phase === "paused" ? "A MOMENT TO RALLY" : state.tutorialStep ? "TRAINING COMPLETE" : state.phase === "victory" ? "BATTLEFIELD LIBERATED" : "THE LINE HAS FALLEN"}</p>
          <h2>{state.phase === "paused" ? "War can wait." : state.phase === "victory" ? "The dawn is yours." : "Rise. Fight again."}</h2>
          <p>{state.phase === "paused" ? "Enemies, cinematics and the combat clock are frozen. Escape or Resume returns to the same target." : state.message}</p>
          {end && <>
            <dl className={styles.resultsGrid}>
              <ResultStat name="Score" value={rounded(state.score)} /><ResultStat name="Unique-output WPM" value={stats.wpm.toFixed(1)} />
              <ResultStat name="Keystroke accuracy" value={`${stats.accuracy.toFixed(1)}%`} /><ResultStat name="Combat time" value={`${(state.elapsedMs / 1000).toFixed(1)}s`} />
              <ResultStat name="Enemies defeated" value={String(state.cleared)} /><ResultStat name="Best streak" value={String(state.bestCombo)} />
            </dl>
            <p className={styles.resultNote}>{state.outputChars} unique output characters · {state.correctKeys} correct presses · {state.incorrectKeys} mistakes · {state.specialUses} specials.<br />WPM excludes pauses, cinematics and automatic special kills; active waiting time is included. This combat course is not a standardized typing test.</p>
            {state.tutorialStep ? <p className={styles.reward}>Training awards no records, XP or campaign unlocks.</p> : newBest && <p className={styles.reward}>New personal best for this stage and difficulty.</p>}
            {state.phase === "victory" && !state.tutorialStep && <p className={styles.reward}>{state.stage === 7 ? "All eight battlefields liberated. Replay any chapter to master it." : `${WAR_STAGES[state.stage + 1].name} is now unlocked.`}</p>}
          </>}
          <div className={styles.menuActions}>
            {state.phase === "paused" ? <button type="button" className={styles.primary} onClick={onResume}><Play size={17} /> Resume</button>
              : state.tutorialStep ? <button type="button" className={styles.primary} onClick={() => onBegin(false, selectedStage)}>Enter the war</button>
              : state.phase === "victory" && state.stage < 7 ? <button type="button" className={styles.primary} onClick={() => onBegin(false, state.stage + 1)}>Next battlefield →</button>
              : <button type="button" className={styles.primary} onClick={() => onBegin(false, state.stage)}><RotateCcw size={17} /> Try again</button>}
            {end && !state.tutorialStep && state.phase === "victory" && state.stage < 7 && <button type="button" className={styles.secondary} onClick={() => onBegin(false, state.stage)}>Replay chapter</button>}
            <button type="button" className={styles.secondary} onClick={onMenu}>War map</button>
            <Link href="/games" className={styles.textLink}>Exit to games</Link>
          </div>
          {state.phase === "paused" && <p className={styles.resultNote}>War map ends this attempt without saving a completed score. Earned enemy unlocks remain.</p>}
        </section>
      </div>}

      {!menu && !end && state.phase !== "paused" && !["intro", "boss-intro"].includes(state.phase) && <div className={styles.console}>
        <div className={styles.consoleTop}><span>{boss ? state.phase === "finisher" ? "TYPE THE FINAL OATH" : "BREAK THE COMMANDER'S GUARD" : target ? "TARGET LOCKED" : "TYPE A FIRST LETTER TO TARGET"}</span>
          <small>{state.tutorialStep ? `TUTORIAL ${state.tutorialStep} / 3` : `${state.cleared} defeated · ${state.pressure.toFixed(2)}× wave pressure`}</small></div>
        {boss ? <p className={styles.sentence}><span className={styles.typed}>{boss.text.slice(0, boss.typed)}</span><span className={styles.cursor}>{boss.text[boss.typed]}</span>{boss.text.slice(boss.typed + 1)}</p>
          : hint ? <div className={styles.targetWord}><span className={styles.typed}>{hint.word.slice(0, hint.typed)}</span><span className={styles.cursor}>{hint.word[hint.typed]}</span>{hint.word.slice(hint.typed + 1)}<small>{ENEMY_DEFINITIONS[hint.kind].name}{hint.elite ? " · ELITE" : ""}{hint.maxHp > 100 ? ` · ${Math.ceil(hint.hp / 100)} word layers left` : ""}</small></div>
          : <p className={styles.waiting}>The next ranks are approaching…</p>}
        {!boss && state.enemies.length > 0 && <ul className={styles.threats} aria-label="All target words, nearest first">{[...state.enemies].sort((a, b) => b.progress - a.progress || a.id - b.id).map((enemy) =>
          <li key={enemy.id} className={enemy.id === state.targetId ? styles.threatActive : ""} title={ENEMY_DEFINITIONS[enemy.kind].description}>
            <span className={styles.typed}>{enemy.word.slice(0, enemy.typed)}</span>{enemy.word.slice(enemy.typed)}<small>{enemy.elite ? "elite" : ENEMY_DEFINITIONS[enemy.kind].name}</small>
          </li>)}</ul>}
        <p className={styles.message} role="status">{state.message}</p>
        <div className={styles.consoleBottom}>
          <span><b>{stats.wpm.toFixed(1)}</b> WPM</span><span><b>{stats.accuracy.toFixed(1)}%</b> accuracy</span><span><b>{state.incorrectKeys}</b> errors</span><span><b>{(state.elapsedMs / 1000).toFixed(1)}s</b> combat</span>
          <span className={styles.keyHelp}>Backspace retreats · Esc pauses · Tab pauses & moves focus</span>
        </div>
      </div>}
    </div>

    <div className={styles.specials} aria-label="Special attack unlocks and energy">
      <div className={styles.energy}><span>COMBAT ENERGY</span><b>{state.energy} / 100</b><progress max={100} value={state.energy} aria-label="Combat energy" /></div>
      {SPECIALS.map((special, index) => {
        const Icon = iconFor[index];
        const has = unlocked.includes(special.id);
        return <div key={special.id} className={`${styles.special} ${has ? styles.specialUnlocked : ""}`}>
          <Icon size={21} /><div><b><kbd>{special.key}</kbd> {special.name}</b><small>{has ? `${special.cost} energy · ${active && state.energy >= special.cost ? "ready" : "build energy by typing"}` : `Unlock at ${special.unlockAt} defeats · ${Math.min(progress.defeated, special.unlockAt)}/${special.unlockAt}`}</small></div>
        </div>;
      })}
    </div>
    {!storageOk && <p className={styles.warning} role="alert">Device storage is unavailable. This session still works, but campaign progress may not survive reload.</p>}
    {!menu && <p id="war-keyboard-help" className={styles.help}>Click the battlefield once to focus. Correct letters attack; wrong keys are ignored and break the streak. Full boss sentences include spaces and punctuation. A physical keyboard is expected.</p>}
    <details className={styles.fieldGuide}>
      <summary>Field guide · enemies, specials & asset notes</summary>
      <div className={styles.guideGrid}>{Object.entries(ENEMY_DEFINITIONS).map(([id, enemy]) => <div key={id}><b>{enemy.name}</b><p>{enemy.description}</p></div>)}</div>
      <div className={styles.guideGrid}>{SPECIALS.map((special) => <div key={special.id}><b>{special.name}</b><p>{special.description}</p></div>)}</div>
      <p>Original procedural, articulated low-poly humanoids and environments—not downloaded character models or motion-capture animations. Reuses repository combat music and effects. WebGL failure selects labelled tactical 2D mode; a scene download failure leaves text combat available. Neither changes the rules. No graphic gore. Reduced effects respects your OS preference. Campaign saves restore completed chapters, not mid-battle state.</p>
      <Link href="/games" className={styles.textLink}>Exit to all HeroTyping games →</Link>
    </details>
  </>;
}

function ResultStat({ name, value }: { name: string; value: string }) {
  return <div><dt>{name}</dt><dd>{value}</dd></div>;
}
