"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Crosshair,
  Flame,
  HeartPulse,
  Keyboard,
  Pause,
  Play,
  Radio,
  RotateCcw,
  Share2,
  Shield,
  Skull,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import type { ChangeEvent, KeyboardEvent, ReactNode, RefObject } from "react";
import type { GameDefinition } from "@/lib/games/game-types";
import type { GameBest } from "@/lib/games/game-scores";
import { DEATH_MISSIONS, DEATH_SURVIVOR_REGISTRY, DEATH_UPGRADE_REGISTRY, DEATH_WEAPONS } from "@/lib/games/type-before-death/content";
import { getDailyChallenge } from "@/lib/games/type-before-death/engine";
import { unlockedDeathMission } from "@/lib/games/type-before-death/progress";
import type { DeathDifficulty, DeathMode, DeathProgress, DeathState, DeathSurvivorId, DeathUpgradeId, DeathWeaponId } from "@/lib/games/type-before-death/types";
import { deathStats } from "@/lib/games/type-before-death/engine";
import type { TypeBeforeDeathRenderMode, TypeBeforeDeathRenderQuality } from "@/lib/games/type-before-death/scene-contract";
import styles from "./game.module.css";

export interface TypeBeforeDeathInterfaceProps {
  definition: GameDefinition;
  state: DeathState;
  progress: DeathProgress;
  best: GameBest | null;
  newBest: boolean;
  storageOk: boolean;
  renderMode: TypeBeforeDeathRenderMode | "loading";
  reducedMotion: boolean;
  soundEnabled: boolean;
  announcement: string;
  scene: ReactNode;
  rootRef: RefObject<HTMLDivElement | null>;
  inputRef: RefObject<HTMLInputElement | null>;
  overlayRef: RefObject<HTMLDivElement | null>;
  selectedMode: DeathMode;
  selectedMission: number;
  selectedDifficulty: DeathDifficulty;
  selectedWeapon: DeathWeaponId;
  selectedSurvivor: DeathSurvivorId;
  onSelectMode: (mode: DeathMode) => void;
  onSelectMission: (mission: number) => void;
  onSelectDifficulty: (difficulty: DeathDifficulty) => void;
  onSelectWeapon: (weapon: DeathWeaponId) => void;
  onSelectSurvivor: (survivor: DeathSurvivorId) => void;
  onBegin: (mode: DeathMode, mission: number, difficulty: DeathDifficulty) => void;
  onPause: () => void;
  onResume: () => void;
  onRestart: () => void;
  onMenu: () => void;
  onQuit: () => void;
  onUpgrade: (id: DeathUpgradeId) => void;
  onShare: () => void;
  onSound: () => void;
  onPreferences: (changes: Partial<Pick<DeathProgress, "quality" | "reducedMotion">>) => void;
  onInputKey: (event: KeyboardEvent<HTMLInputElement>) => void;
  onInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onContinueWave: () => void;
}

const number = (value: number) => Math.round(value).toLocaleString("en-US");
const clock = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}`;
const titleCase = (value: string) => value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export function TypeBeforeDeathInterface({
  rootRef,
  inputRef,
  overlayRef,
  ...props
}: TypeBeforeDeathInterfaceProps) {
  const { state, progress } = props;
  const menu = state.phase === "menu";
  const active = state.phase === "briefing" || state.phase === "combat" || state.phase === "boss" || state.phase === "wave";
  const ended = state.phase === "results";
  const paused = state.phase === "paused";
  const target = state.boss && state.phase === "boss"
    ? state.boss
    : state.enemies.find((enemy) => enemy.visible && enemy.id === state.targetId)
      ?? state.enemies.filter((enemy) => enemy.visible).sort((a, b) => b.progress - a.progress || a.id - b.id)[0];
  const stats = deathStats(state);
  const challenge = getDailyChallenge();
  const unlocked = unlockedDeathMission(progress);
  const healthRatio = state.maxHealth > 0 ? state.health / state.maxHealth : 0;
  const barricadeRatio = state.maxBarricade > 0 ? state.barricade / state.maxBarricade : 0;

  return (
    <div ref={rootRef} className={styles.shell} data-phase={state.phase} data-danger={healthRatio < 0.35 || barricadeRatio < 0.25}>
      <header className={styles.topbar}>
        <Link href="/games" className={styles.back}><ArrowLeft size={15} aria-hidden="true" /> <span>Arcade</span></Link>
        <div className={styles.identity}>
          <Skull size={19} aria-hidden="true" />
          <div><b>TYPE BEFORE DEATH</b><span>TYPE FAST. STAY ALIVE.</span></div>
        </div>
        <div className={styles.tools}>
          <span className={styles.renderMode}>{props.renderMode === "webgl" ? "3D CITY" : props.renderMode === "fallback" ? "TACTICAL 2D" : "LOADING"}</span>
          <button type="button" className={styles.iconButton} onClick={props.onSound} aria-label={props.soundEnabled ? "Mute Type Before Death audio" : "Enable Type Before Death audio"} aria-pressed={props.soundEnabled}>
            {props.soundEnabled ? <Volume2 size={18} aria-hidden="true" /> : <VolumeX size={18} aria-hidden="true" />}
          </button>
          {!menu && !ended && (active || paused) && <button type="button" className={styles.iconButton} onClick={paused ? props.onResume : props.onPause} aria-label={paused ? "Resume run" : "Pause run"}>
            {paused ? <Play size={18} aria-hidden="true" /> : <Pause size={18} aria-hidden="true" />}
          </button>}
        </div>
      </header>

      {!menu && <div className={styles.hud} aria-label="Survival HUD">
        <HudMeter icon={<HeartPulse size={13} />} label="HEALTH" value={`${Math.ceil(state.health)} / ${Math.ceil(state.maxHealth)}`} ratio={healthRatio} danger={healthRatio < 0.35} />
        <HudMeter icon={<Shield size={13} />} label="BARRICADE" value={`${Math.ceil(state.barricade)} / ${Math.ceil(state.maxBarricade)}`} ratio={barricadeRatio} danger={barricadeRatio < 0.25} />
        <div className={styles.hudStat}><span>{state.mode === "daily" ? "DAILY" : state.mode === "endless" ? "ENDLESS" : `WAVE ${state.wave}`}</span><b>{state.mode === "daily" ? challenge.day : state.phase === "boss" ? "BOSS" : `x${Math.max(1, state.combo)}`}</b></div>
        <div className={styles.hudStat}><span>SCORE</span><b>{number(state.score)}</b></div>
        <div className={styles.hudStat}><span>WPM · ACC</span><b>{stats.wpm.toFixed(0)} · {stats.accuracy.toFixed(0)}%</b></div>
      </div>}

      <div className={styles.arena} onClick={(event) => { if (!(event.target as Element).closest("button,a,input,select,details,summary")) inputRef.current?.focus({ preventScroll: true }); }}>
        {props.scene}
        <div className={styles.scanlines} aria-hidden="true" />
        {!menu && <div className={styles.arenaHeader}><span><i /> {state.phase === "boss" ? "COMMANDER CONTACT" : state.message}</span><span>{state.phase === "boss" && state.boss ? `PHASE ${state.boss.bossPhase} / 3` : `${state.cleared} neutralized · ${clock(state.elapsedMs)} active`}</span></div>}

        {state.phase === "boss" && state.boss && <div className={styles.bossBar} role="status" aria-label={`${state.boss.name} boss health`}>
          <div><Skull size={15} aria-hidden="true" /><b>{state.boss.name}</b><span>PHASE {state.boss.bossPhase} / 3</span></div>
          <div className={styles.bar}><span style={{ width: `${Math.max(0, state.boss.hp / state.boss.maxHp * 100)}%` }} /></div>
          <small>CHARGED STRIKE · {Math.max(0, (state.boss.chargeLimitMs - state.boss.chargeMs) / 1000).toFixed(1)}s</small>
          <progress value={state.boss.chargeMs} max={state.boss.chargeLimitMs} aria-label="Commander charge" />
        </div>}

        {active && !paused && !ended && !menu && <div className={styles.targetConsole}>
          <span className={styles.consoleLabel}><Crosshair size={13} aria-hidden="true" /> {state.phase === "boss" ? "TYPE TO DAMAGE THE COMMANDER" : target ? "TARGET LOCKED" : "TYPE A FIRST LETTER TO LOCK A THREAT"}</span>
          <div className={styles.targetWord} aria-live="polite">
            {target ? <><em>{target.word.slice(0, target.typed)}</em><b>{target.word.slice(target.typed, target.typed + 1)}</b>{target.word.slice(target.typed + 1)}</> : "Scanning the street…"}
          </div>
          <small>{target ? `${titleCase(target.kind)} · ${target.word.length} letter weapon · ${target.wordMistakes ?? 0} mistakes` : "The closest matching prefix is selected automatically."}</small>
        </div>}

        {menu && <Menu progress={progress} best={props.best} selectedMode={props.selectedMode} selectedMission={props.selectedMission} selectedDifficulty={props.selectedDifficulty} selectedWeapon={props.selectedWeapon} selectedSurvivor={props.selectedSurvivor} unlocked={unlocked} challenge={challenge} onSelectMode={props.onSelectMode} onSelectMission={props.onSelectMission} onSelectDifficulty={props.onSelectDifficulty} onSelectWeapon={props.onSelectWeapon} onSelectSurvivor={props.onSelectSurvivor} onBegin={props.onBegin} onPreferences={props.onPreferences} />}

        {(paused || ended || state.phase === "upgrade" || state.phase === "wave") && <div ref={overlayRef} className={styles.overlay}>
          {paused && <PausePanel onResume={props.onResume} onRestart={props.onRestart} onQuit={props.onQuit} />}
          {state.phase === "upgrade" && <UpgradePanel state={state} onUpgrade={props.onUpgrade} />}
          {state.phase === "wave" && <WavePanel state={state} onContinue={props.onContinueWave} />}
          {ended && <ResultsPanel state={state} best={props.best} newBest={props.newBest} onRestart={props.onRestart} onMenu={props.onMenu} onShare={props.onShare} />}
        </div>}

        {!menu && !paused && !ended && <div className={styles.inputDock}>
          <label htmlFor="type-before-death-input"><Keyboard size={14} aria-hidden="true" /> TYPE TO FIRE</label>
          <input ref={inputRef} id="type-before-death-input" onKeyDown={props.onInputKey} onChange={props.onInputChange} onPaste={(event) => event.preventDefault()} onDrop={(event) => event.preventDefault()} autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false} inputMode="text" aria-describedby="type-before-death-help" placeholder="First letter locks a target" />
          <div className={styles.inputStats}><span><Zap size={13} aria-hidden="true" /> HEAT {Math.round(state.heat)}%</span><progress max={100} value={state.heat} aria-label="Weapon heat" /><span>{state.jamMs > 0 ? `JAM ${(state.jamMs / 1000).toFixed(1)}s` : `ENERGY ${Math.round(state.energy)}%`}</span></div>
        </div>}
      </div>

      {!menu && <div className={styles.threatStrip} aria-label="Approaching threats">
        <span className={styles.stripTitle}>THREAT BOARD</span>
        {[...state.enemies].filter((enemy) => enemy.visible).sort((a, b) => b.progress - a.progress || a.id - b.id).map((enemy) => <div key={enemy.id} className={enemy.id === state.targetId ? styles.threatActive : styles.threat}>
          <b>{enemy.word}</b><small>{titleCase(enemy.kind)}</small><progress max={1} value={enemy.progress} aria-label={`${enemy.kind} approach`} />
        </div>)}
        {!state.enemies.length && state.phase !== "boss" && <span className={styles.clear}>Street clear. Listen for the next breach.</span>}
      </div>}

      <p id="type-before-death-help" className={styles.announcement} role="status" aria-live="polite">{props.announcement || (menu ? "The city is waiting for its last typist." : state.phase === "combat" ? "Correct letters fire. Wrong keys break combo and add heat." : state.message)}</p>
      {!props.storageOk && <p className={styles.storageWarning} role="alert">Device storage is unavailable. The run remains playable, but safehouse progress may not survive reload.</p>}
      {!menu && <details className={styles.fieldGuide}><summary><Radio size={14} aria-hidden="true" /> Field guide</summary><div><p><b>Priority:</b> first letters lock the most urgent visible match. Finish the word to fire; longer words deal more damage.</p><p><b>Pressure:</b> runners accelerate, spitters attack from range, bombers explode near the line, stalkers emerge from the mist, and elites enrage below half health.</p><p><b>Mastery:</b> clean words build combo and Overdrive. Heat cools over time; repeated mistakes can jam the weapon. Escape pauses and Tab pauses before moving focus.</p></div></details>}
    </div>
  );
}

function HudMeter({ icon, label, value, ratio, danger }: { icon: ReactNode; label: string; value: string; ratio: number; danger: boolean }) {
  return <div className={`${styles.hudMeter} ${danger ? styles.danger : ""}`}><span>{icon} {label}</span><b>{value}</b><div className={styles.meter}><span style={{ width: `${Math.max(0, Math.min(100, ratio * 100))}%` }} /></div></div>;
}

function Menu({ progress, best, selectedMode, selectedMission, selectedDifficulty, selectedWeapon, selectedSurvivor, unlocked, challenge, onSelectMode, onSelectMission, onSelectDifficulty, onSelectWeapon, onSelectSurvivor, onBegin, onPreferences }: {
  progress: DeathProgress;
  best: GameBest | null;
  selectedMode: DeathMode;
  selectedMission: number;
  selectedDifficulty: DeathDifficulty;
  selectedWeapon: DeathWeaponId;
  selectedSurvivor: DeathSurvivorId;
  unlocked: number;
  challenge: ReturnType<typeof getDailyChallenge>;
  onSelectMode: (mode: DeathMode) => void;
  onSelectMission: (mission: number) => void;
  onSelectDifficulty: (difficulty: DeathDifficulty) => void;
  onSelectWeapon: (weapon: DeathWeaponId) => void;
  onSelectSurvivor: (survivor: DeathSurvivorId) => void;
  onBegin: (mode: DeathMode, mission: number, difficulty: DeathDifficulty) => void;
  onPreferences: (changes: Partial<Pick<DeathProgress, "quality" | "reducedMotion">>) => void;
}) {
  const selected = DEATH_MISSIONS[selectedMission] ?? DEATH_MISSIONS[0];
  return <div className={styles.menu}>
    <div className={styles.menuCopy}>
      <span className={styles.kicker}><Skull size={14} aria-hidden="true" /> A HEROTYPING ORIGINAL</span>
      <h1>TYPE BEFORE <em>DEATH</em></h1>
      <p className={styles.tagline}>TYPE FAST. STAY ALIVE.</p>
      <p className={styles.story}>The city is gone quiet. Your keyboard is the last weapon between the safehouse and the outbreak.</p>
      <div className={styles.modeTabs} role="tablist" aria-label="Game modes">
        <ModeButton active={selectedMode === "campaign"} label="STORY" detail="Six missions" onClick={() => onSelectMode("campaign")} />
        <ModeButton active={selectedMode === "endless"} label="ENDLESS" detail="No final wave" onClick={() => onSelectMode("endless")} />
        <ModeButton active={selectedMode === "daily"} label="DAILY" detail={`Seed ${challenge.day}`} onClick={() => onSelectMode("daily")} />
      </div>
      {selectedMode === "campaign" && <div className={styles.missionList} aria-label="Campaign missions">{DEATH_MISSIONS.map((mission) => {
        const locked = mission.id > unlocked;
        return <button key={mission.id} type="button" className={mission.id === selectedMission ? styles.missionActive : styles.mission} disabled={locked} onClick={() => onSelectMission(mission.id)}><span>{locked ? "—" : String(mission.id + 1).padStart(2, "0")}</span><b>{mission.name}</b><small>{locked ? "Clear the previous mission" : mission.subtitle}</small>{progress.missionBests[mission.id] ? <i>{number(progress.missionBests[mission.id])}</i> : null}</button>;
      })}</div>}
      <div className={styles.startRow}>
        <button type="button" className={styles.primary} onClick={() => onBegin(selectedMode, selectedMode === "daily" ? challenge.mission : selectedMission, selectedMode === "daily" ? "normal" : selectedDifficulty)}><Play size={17} fill="currentColor" aria-hidden="true" /> {selectedMode === "daily" ? "Enter today's challenge" : selectedMode === "endless" ? "Defend without end" : `Deploy · ${selected.name}`}</button>
        <span className={styles.keyboardHint}><Keyboard size={14} aria-hidden="true" /> Keyboard combat · no sign-up</span>
      </div>
      <div className={styles.preferences}>
        <label>Difficulty<select value={selectedDifficulty} onChange={(event) => onSelectDifficulty(event.target.value as DeathDifficulty)} disabled={selectedMode === "daily"}><option value="easy">Easy · learn the line</option><option value="normal">Normal · hold the line</option><option value="hard">Hard · relentless</option></select></label>
        <label>Visual quality<select value={progress.quality} onChange={(event) => onPreferences({ quality: event.target.value as TypeBeforeDeathRenderQuality })}><option value="auto">Auto</option><option value="low">Low · conserve device</option><option value="high">High · full city</option></select></label>
        <label>Weapon<select value={selectedWeapon} disabled={selectedMode === "daily"} onChange={(event) => onSelectWeapon(event.target.value as DeathWeaponId)}>{Object.values(DEATH_WEAPONS).map((weapon) => <option key={weapon.id} value={weapon.id}>{weapon.name}</option>)}</select></label>
        <label>Survivor<select value={selectedSurvivor} disabled={selectedMode === "daily"} onChange={(event) => onSelectSurvivor(event.target.value as DeathSurvivorId)}>{Object.values(DEATH_SURVIVOR_REGISTRY).map((survivor) => <option key={survivor.id} value={survivor.id}>{survivor.name}</option>)}</select></label>
        <label className={styles.check}><input type="checkbox" checked={progress.reducedMotion} onChange={(event) => onPreferences({ reducedMotion: event.target.checked })} /> Reduced effects</label>
      </div>
      <p className={styles.loadoutNote}>{selectedMode === "daily" ? "Daily loadout is fixed to Pistol + Soldier for a fair shared challenge." : <><b>{DEATH_WEAPONS[selectedWeapon].name}:</b> {DEATH_WEAPONS[selectedWeapon].description} <b>{DEATH_SURVIVOR_REGISTRY[selectedSurvivor].name}:</b> {DEATH_SURVIVOR_REGISTRY[selectedSurvivor].description}</>}</p>
    </div>
    <aside className={styles.safehouse}>
      <span className={styles.kicker}><Shield size={14} aria-hidden="true" /> SAFEHOUSE // STATUS</span>
      <h2>{selectedMode === "daily" ? "Same outbreak. One seed." : "Your line holds."}</h2>
      <p>{selectedMode === "daily" ? "Every player receives the same deterministic waves and boss behavior. Only your typing decides the score." : selected.briefing}</p>
      <div className={styles.safeStats}><div><span>PERSONAL BEST</span><b>{best ? number(best.score) : "—"}</b></div><div><span>MISSIONS</span><b>{progress.completed.length} / {DEATH_MISSIONS.length}</b></div><div><span>INFECTED</span><b>{number(progress.defeated)}</b></div></div>
      <div className={styles.systems}><span><i className={styles.online} /> ARMORY <b>ONLINE</b></span><span><i className={styles.online} /> MEDBAY <b>{progress.runs ? "READY" : "STANDBY"}</b></span><span><i className={styles.online} /> COMMS <b>{selectedMode === "daily" ? "SYNCED" : "LOCAL"}</b></span></div>
      <p className={styles.safeNote}>Scores use the existing HeroTyping personal-best system. No fake global rank is shown when a leaderboard service is unavailable.</p>
    </aside>
  </div>;
}

function ModeButton({ active, label, detail, onClick }: { active: boolean; label: string; detail: string; onClick: () => void }) {
  return <button type="button" role="tab" aria-selected={active} className={active ? styles.modeActive : styles.mode} onClick={onClick}><b>{label}</b><small>{detail}</small></button>;
}

function PausePanel({ onResume, onRestart, onQuit }: { onResume: () => void; onRestart: () => void; onQuit: () => void }) {
  return <section className={styles.resultPanel} aria-label="Run paused"><span className={styles.kicker}><Pause size={14} aria-hidden="true" /> TRANSMISSION HELD</span><h2>The city can wait.</h2><p>Enemies, timers and audio are frozen. Your next letter remains exactly where you left it.</p><button type="button" className={styles.primary} onClick={onResume}><Play size={16} aria-hidden="true" /> Resume run</button><button type="button" className={styles.secondary} onClick={onRestart}><RotateCcw size={16} aria-hidden="true" /> Restart run</button><button type="button" className={styles.textButton} onClick={onQuit}>Exit without saving</button></section>;
}

function UpgradePanel({ state, onUpgrade }: { state: DeathState; onUpgrade: (id: DeathUpgradeId) => void }) {
  return <section className={styles.resultPanel} aria-label="Choose a field upgrade"><span className={styles.kicker}><Sparkles size={14} aria-hidden="true" /> SAFEHOUSE ARMORY</span><h2>Choose your edge.</h2><p>Wave {Math.max(1, state.wave - 1)} is clear. Make one meaningful change before the next pressure spike.</p><div className={styles.upgrades}>{state.upgradeChoices.map((id) => { const upgrade = DEATH_UPGRADE_REGISTRY[id]; return <button key={id} type="button" className={styles.upgrade} onClick={() => onUpgrade(id)}><span><Zap size={16} aria-hidden="true" /><b>{upgrade.name}</b><small>Rank {state.upgrades[id]} → {state.upgrades[id] + 1}</small></span><p>{upgrade.description}</p></button>; })}</div></section>;
}

function WavePanel({ state, onContinue }: { state: DeathState; onContinue: () => void }) {
  return <section className={styles.resultPanel} aria-label="Wave briefing"><span className={styles.kicker}><Radio size={14} aria-hidden="true" /> INCOMING WAVE</span><h2>{state.message}</h2><p>Read the battlefield. The first letter of a visible word locks the best target; clean words are worth more than panic.</p><button type="button" className={styles.primary} onClick={onContinue}><Play size={16} aria-hidden="true" /> Continue defense</button></section>;
}

function ResultsPanel({ state, best, newBest, onRestart, onMenu, onShare }: { state: DeathState; best: GameBest | null; newBest: boolean; onRestart: () => void; onMenu: () => void; onShare: () => void }) {
  const stats = deathStats(state);
  const victory = state.outcome === "victory";
  return <section className={styles.resultPanel} aria-label="Run results"><span className={styles.kicker}>{victory ? <Trophy size={14} aria-hidden="true" /> : <Flame size={14} aria-hidden="true" />} {victory ? "OUTBREAK CONTAINED" : "THE LINE HAS FALLEN"}</span><h2>{victory ? "Dawn gets one more chance." : "You were almost clear."}</h2><p>{state.resultReason === "health-depleted" ? "The barricade broke and the remaining health was exposed." : victory ? "The commander is down. The safehouse lights are still on." : "Your run ended. The next word can change the outcome."}</p><div className={styles.resultScore}>{number(stats.score)}<span>FINAL SCORE {newBest ? "· NEW PERSONAL BEST" : ""}</span></div><dl className={styles.results}><Result label="Active survival" value={clock(stats.survivedMs)} /><Result label="Output WPM" value={stats.wpm.toFixed(1)} /><Result label="Accuracy" value={`${stats.accuracy.toFixed(1)}%`} /><Result label="Best combo" value={number(stats.bestCombo)} /><Result label="Threats cleared" value={number(stats.cleared)} /><Result label="Bosses defeated" value={victory ? "1" : "0"} /><Result label="Damage dealt" value={number(stats.damageDealt)} /><Result label="Overdrives" value={number(stats.overdrives)} /></dl>{best && !newBest && <p className={styles.bestCompare}>Personal best: <b>{number(best.score)}</b> · {Math.max(0, stats.score - best.score).toLocaleString("en-US", { signDisplay: "always" })} this run</p>}<div className={styles.startRow}><button type="button" className={styles.primary} onClick={onRestart}><RotateCcw size={16} aria-hidden="true" /> One more run</button><button type="button" className={styles.secondary} onClick={onShare}><Share2 size={16} aria-hidden="true" /> Share result</button></div><button type="button" className={styles.textButton} onClick={onMenu}>Return to safehouse</button><small>{stats.outputChars} unique output characters. Retyping cannot inflate WPM; pauses are excluded from active time.</small></section>;
}

function Result({ label, value }: { label: string; value: string }) {
  return <div><dt>{label}</dt><dd>{value}</dd></div>;
}
