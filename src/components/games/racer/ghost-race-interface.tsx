"use client";

import Image from "next/image";
import { useEffect, useId, useRef, type CSSProperties, type ReactNode } from "react";
import { racerSectorForProgress } from "@/lib/games/racer/presentation";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Check,
  Flag,
  Gauge,
  Ghost,
  Keyboard,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  Timer,
  Trophy,
  Volume2,
  VolumeX,
} from "lucide-react";
import styles from "./ghost-race-interface.module.css";

export type GhostRacePhase = "idle" | "countdown" | "racing" | "paused" | "done";
export type GhostRaceDifficulty = "easy" | "medium" | "hard" | "legend";

/** A rival is display data only. Race timing and placement remain owned by the game. */
export interface GhostRaceRival {
  readonly id: string;
  readonly name: string;
  readonly progress: number;
  readonly color: string;
  readonly finished: boolean;
  readonly placement?: number | null;
}

export interface GhostRaceResult {
  won: boolean;
  tied: boolean;
  placement?: number | null;
  wpm: number;
  acc: number;
  record: boolean;
  durationMs: number;
}

export interface GhostRaceInterfaceProps {
  /** Decorative scene only; the shell exposes race information as real text. */
  scene: ReactNode;
  /** The controlled, labelled race input. It stays mounted through a pit stop. */
  input: ReactNode;
  phase: GhostRacePhase;
  difficulty: GhostRaceDifficulty;
  onDifficultyChange: (difficulty: GhostRaceDifficulty) => void;
  /** Four read-only rivals, supplied in any stable order by the race owner. */
  rivals: readonly GhostRaceRival[];
  /** Current player position in the five-rider field (1 is first). */
  playerPosition: number;
  totalRacers: number;
  /** Final placement is optional while a result is being persisted. */
  resultPlacement?: number | null;
  bestWpm: number | null;
  bestAccuracy: number | null;
  rankName: string;
  countdown: number;
  progress: number;
  elapsedMs: number;
  wpm: number;
  accuracy: number;
  currentWord: string;
  typedInWord: string;
  upcomingWords: string[];
  needsSpace: boolean;
  hasError: boolean;
  reducedMotion: boolean;
  compact?: boolean;
  onToggleMotion: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  /** Called only by the finished garage action or explicit abandon action. */
  onMenu: () => void;
  result: GhostRaceResult | null;
  replaySaved: boolean | null;
}

const PHASE_LABELS: Record<GhostRacePhase, string> = {
  idle: "Garage",
  countdown: "On the grid",
  racing: "Race live",
  paused: "Pit stop",
  done: "Finished",
};

const DIFFICULTIES: readonly {
  value: GhostRaceDifficulty;
  label: string;
  description: string;
}[] = [
  { value: "easy", label: "Easy", description: "Softer, steady rivals for a confident start." },
  { value: "medium", label: "Medium", description: "A balanced pace with close, readable racing." },
  { value: "hard", label: "Hard", description: "Fast rivals leave less room for hesitation." },
  { value: "legend", label: "Legend", description: "The sharpest fixed pace. Every character counts." },
];

function fraction(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}

function clock(ms: number, precise = false): string {
  const safeMs = Number.isFinite(ms) ? Math.max(0, ms) : 0;
  const unit = precise ? 10 : 100;
  const displayedMs = Math.floor(safeMs / unit) * unit;
  const minutes = Math.floor(displayedMs / 60_000).toString().padStart(2, "0");
  const seconds = ((displayedMs % 60_000) / 1000).toFixed(precise ? 2 : 1);
  return `${minutes}:${seconds.padStart(precise ? 5 : 4, "0")}`;
}

function metric(value: number): string {
  return Number.isFinite(value) ? String(Math.round(Math.max(0, value))) : "0";
}

function safePlacement(value: number | null | undefined, totalRacers: number): number | null {
  if (!Number.isFinite(value)) return null;
  return Math.max(1, Math.min(Math.max(1, totalRacers), Math.round(value as number)));
}

function placeLabel(value: number | null | undefined, totalRacers: number): string {
  const place = safePlacement(value, totalRacers);
  if (place === null) return "—";
  const suffix = place % 100 >= 11 && place % 100 <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" }[place % 10] ?? "th");
  return `${place}${suffix}`;
}

function difficultyDescription(difficulty: GhostRaceDifficulty): string {
  return DIFFICULTIES.find((option) => option.value === difficulty)?.description ?? DIFFICULTIES[1].description;
}

interface StandingRow extends GhostRaceRival {
  readonly isPlayer?: boolean;
}

function sortStandings(rows: readonly StandingRow[], totalRacers: number): StandingRow[] {
  const hasCompletePlacements = rows.every((row) => safePlacement(row.placement, totalRacers) !== null);
  return [...rows].sort((a, b) => {
    const aPlacement = safePlacement(a.placement, totalRacers);
    const bPlacement = safePlacement(b.placement, totalRacers);
    if (hasCompletePlacements && aPlacement !== null && bPlacement !== null && aPlacement !== bPlacement) return aPlacement - bPlacement;
    if (a.progress !== b.progress) return fraction(b.progress) - fraction(a.progress);
    return a.isPlayer ? -1 : b.isPlayer ? 1 : a.name.localeCompare(b.name);
  });
}

function RaceStandings({
  rivals,
  playerProgress,
  playerPosition,
  totalRacers,
  finished,
}: {
  rivals: readonly GhostRaceRival[];
  playerProgress: number;
  playerPosition: number;
  totalRacers: number;
  finished?: boolean;
}) {
  const rows = sortStandings([
    {
      id: "player",
      name: "You",
      progress: playerProgress,
      color: "var(--race-cyan)",
      finished: finished ?? false,
      placement: playerPosition,
      isPlayer: true,
    },
    ...rivals,
  ], totalRacers);

  return (
    <section className={styles.standingsPanel} aria-label="Live race standings" aria-live="polite">
      <div className={styles.standingsHeading}>
        <span><Flag size={12} aria-hidden="true" /> Live standings</span>
        <small>{totalRacers} riders</small>
      </div>
      <ol className={styles.standingsList}>
        {rows.map((row, index) => {
          const place = safePlacement(row.placement, totalRacers) ?? index + 1;
          const progress = fraction(row.progress);
          const rowStyle = { "--rival-color": row.color } as CSSProperties;
          return (
            <li
              key={row.id}
              className={row.isPlayer ? styles.standingPlayer : styles.standingRow}
              style={rowStyle}
              aria-current={row.isPlayer ? "true" : undefined}
            >
              <span className={styles.standingPlace}>{placeLabel(place, totalRacers)}</span>
              <span className={styles.standingSwatch} aria-hidden="true" />
              <span className={styles.standingName}>{row.name}</span>
              <span className={styles.standingProgress} aria-hidden="true"><i style={{ width: `${progress * 100}%` }} /></span>
              <span className={styles.standingStatus}>{row.finished ? "FIN" : `${Math.floor(progress * 100)}%`}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function WordReadout({ word, typed, hasError }: { word: string; typed: string; hasError: boolean }) {
  let correctLength = 0;
  while (correctLength < typed.length && correctLength < word.length && typed[correctLength] === word[correctLength]) {
    correctLength++;
  }
  return (
    <div className={styles.wordReadout} aria-label={`Current word: ${word || "Course complete"}`} role="status" aria-live="polite" aria-atomic="true">
      <span aria-hidden="true">
        {word ? Array.from(word).map((character, index) => (
          <span
            key={index}
            className={index < correctLength ? styles.correctChar : index === correctLength ? (hasError ? styles.errorChar : styles.activeChar) : styles.futureChar}
          >
            {character}
          </span>
        )) : <span className={styles.correctChar}>Finish line</span>}
      </span>
    </div>
  );
}

/** Presentation only: movement, timing, replay persistence and input belong to the race owner. */
export function GhostRaceInterface(props: GhostRaceInterfaceProps) {
  const {
    scene, input, phase, difficulty, onDifficultyChange, rivals, playerPosition, totalRacers, resultPlacement,
    bestWpm, bestAccuracy, rankName, countdown, progress, elapsedMs, wpm, accuracy,
    currentWord, typedInWord, upcomingWords, needsSpace, hasError, reducedMotion, compact = false,
    onToggleMotion, soundEnabled, onToggleSound, onStart, onPause, onResume, onMenu, result, replaySaved,
  } = props;
  const id = useId();
  const resumeRef = useRef<HTMLButtonElement>(null);
  const finishRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (phase === "paused") resumeRef.current?.focus({ preventScroll: true });
    if (phase === "done") finishRef.current?.focus({ preventScroll: true });
  }, [phase]);

  const player = fraction(progress);
  const safeTotal = Math.max(1, Math.round(totalRacers) || rivals.length + 1);
  const safePlayerPosition = safePlacement(playerPosition, safeTotal) ?? 1;
  const finalPlacement = safePlacement(resultPlacement ?? result?.placement ?? safePlayerPosition, safeTotal);
  const sector = racerSectorForProgress(player);
  const inactive = phase === "paused" || phase === "done";
  const prompt = phase === "countdown" ? "Wait for the lights" : hasError ? "Backspace to correct" : needsSpace ? "Space to shift to the next word" : "Correct characters move your bike";
  const beatenRivals = rivals.filter((rival) => {
    const rivalPlacement = safePlacement(rival.placement, safeTotal);
    if (finalPlacement === null) return false;
    if (rivalPlacement !== null) return rivalPlacement > finalPlacement;
    return fraction(rival.progress) < player;
  });
  const finishTitle = result?.tied ? "DEAD HEAT." : finalPlacement === 1 ? "GRID LEADER." : "FINISHER.";
  const finishDescription = !result
    ? "Your run is complete."
    : result.tied
      ? `A shared ${placeLabel(finalPlacement, safeTotal)} finish. Neither rider gets a free win.`
      : `You finished ${placeLabel(finalPlacement, safeTotal)} of ${safeTotal}. ${beatenRivals.length} rival${beatenRivals.length === 1 ? "" : "s"} beaten.`;

  return (
    <section className={styles.shell} data-phase={phase} data-reduced-motion={reducedMotion} data-compact={compact} aria-label="Ghost Racer">
      <header className={styles.eventBar}>
        <div className={styles.wordmark}>
          <Ghost size={21} strokeWidth={1.5} aria-hidden="true" />
          <span>GHOST<span className={styles.wordmarkAccent}>RACER</span></span>
        </div>
        <div className={styles.eventName}>
          <span>Night grid / four rivals</span>
          <span>Fixed pace profiles · one finish line</span>
        </div>
        <span className={styles.phaseTag}><i aria-hidden="true" />{PHASE_LABELS[phase]}</span>
        <div className={styles.eventControls}>
          <button type="button" className={styles.iconButton} onClick={onToggleMotion} aria-label="Reduced motion" aria-pressed={reducedMotion} title={reducedMotion ? "Reduced motion on" : "Reduce motion"}>
            <Activity size={17} aria-hidden="true" /><span className={styles.controlText}>Low motion</span>
          </button>
          <button type="button" className={styles.iconButton} onClick={onToggleSound} aria-label="Race sound" aria-pressed={soundEnabled} title={soundEnabled ? "Mute sound" : "Enable sound"}>
            {soundEnabled ? <Volume2 size={17} aria-hidden="true" /> : <VolumeX size={17} aria-hidden="true" />}
          </button>
          {(phase === "racing" || phase === "countdown") && (
            <button type="button" className={styles.pauseButton} onClick={onPause} aria-label="Pause race">
              <Pause size={15} aria-hidden="true" /><span>Pause</span>
            </button>
          )}
        </div>
      </header>

      <div className={styles.stage}>
        <div className={styles.scene} aria-hidden="true" inert>{scene}</div>
        <div className={styles.sceneShade} aria-hidden="true" />

        {phase === "idle" ? (
          <div className={styles.garage}>
            <div className={styles.garageShowcase}>
              <div className={styles.garageHeading}>
                <p className={styles.eyebrow}><span className={styles.statusDot} /> Neon nights / time attack</p>
                <h2>YOUR NEXT<br /><span>FASTEST SELF.</span></h2>
                <p>Your bike. Four rivals.<br />City streets, a skyline bridge, then the midnight tunnel.</p>
              </div>
              <div className={styles.bikeShowcase}>
                <span className={styles.bikeNumber} aria-hidden="true">01</span>
                <Image src="/games/ghost-racer/bike-standard.webp" alt="A weathered racing motorcycle with illuminated cyan wheels" fill sizes="(max-width: 760px) 100vw, 55vw" className={styles.garageBike} loading="eager" />
                <div className={styles.bikeCaption}><span><i /> Your ride</span><span>Keystroke driven</span></div>
              </div>
              <dl className={styles.garageStats}>
                <div><dt>Course best</dt><dd>{bestWpm === null ? "—" : metric(bestWpm)}<small>WPM</small></dd></div>
                <div><dt>Best-run accuracy</dt><dd>{bestAccuracy === null ? "—" : `${metric(bestAccuracy)}%`}</dd></div>
                <div><dt>Your rank</dt><dd className={styles.rankValue}>{rankName}</dd></div>
              </dl>
            </div>

            <div className={styles.briefing}>
              <div className={styles.briefingHeading}><span className={styles.eyebrow}>Race briefing</span><span className={styles.briefingIndex}>01 / GRID</span></div>
              <fieldset className={styles.modeFieldset}>
                <legend>Choose rival difficulty</legend>
                <div className={styles.modeSelector}>
                  {DIFFICULTIES.map((option) => (
                    <button key={option.value} type="button" onClick={() => onDifficultyChange(option.value)} aria-pressed={difficulty === option.value}>
                      <Gauge size={17} aria-hidden="true" /><span>{option.label}<small>{option.description}</small></span>
                      {difficulty === option.value && <Check size={14} aria-hidden="true" />}
                    </button>
                  ))}
                </div>
                <p className={styles.modeDescription}>{difficultyDescription(difficulty)} Rival speed is fixed by difficulty; there are no manual speed controls.</p>
              </fieldset>

              <div className={styles.rivalBrief}>
                <div className={styles.rivalIcon}><Ghost size={22} strokeWidth={1.5} aria-hidden="true" /></div>
                <div><p>Rival grid</p><h3>{rivals.length || 4} AI rivals</h3><span>Every rider follows the selected fixed pace.</span></div>
              </div>

              <ol className={styles.drivingRules}>
                <li><Keyboard size={15} aria-hidden="true" /><span>Type the highlighted word. <strong>Space</strong> moves to the next.</span></li>
                <li><RotateCcw size={15} aria-hidden="true" /><span>Correct mistakes with <strong>Backspace</strong> to keep moving.</span></li>
                <li><Flag size={15} aria-hidden="true" /><span>Finish your run and see where you land among all five riders.</span></li>
              </ol>
              <button type="button" className={styles.primaryButton} onClick={onStart}><span>Take the starting line</span><ArrowRight size={19} aria-hidden="true" /></button>
              <p className={styles.storageNote}>Replays stay in this browser, separately for each account and guest.</p>
            </div>
          </div>
        ) : (
          <div className={styles.driveLayout} inert={inactive} aria-hidden={inactive || undefined}>
            <div className={styles.raceHud}>
              <div className={styles.positionHud}>
                <span className={styles.hudLabel}>Race position</span>
                <strong>{phase === "countdown" ? "On the grid" : `${placeLabel(safePlayerPosition, safeTotal)} / ${safeTotal}`}</strong>
                <span className={styles.gapReadout}>{phase === "countdown" ? `${safeTotal - 1} rivals ready` : `${safeTotal - 1} AI rivals on course`}</span>
              </div>
              <div className={styles.timerHud}><span className={styles.hudLabel}><Timer size={12} aria-hidden="true" /> Race time</span><span>{clock(elapsedMs)}</span><small className={styles.sectorLabel}>{String(sector.index + 1).padStart(2, "0")} / {sector.name}</small></div>
            </div>

            <div className={styles.roadWindow}>
              {phase === "countdown" && (
                <div className={styles.startGrid} role="status" aria-live="polite" aria-atomic="true">
                  <span className={styles.eyebrow}>On the starting grid</span>
                  <div className={styles.startLights} aria-hidden="true">{[3, 2, 1].map((light) => <i key={light} data-on={countdown <= light} data-go={countdown <= 0} />)}</div>
                  <strong>{countdown > 0 ? countdown : "GO"}</strong>
                  <span>Hands ready. Find your place.</span>
                </div>
              )}
              {phase === "racing" && rivals.some((rival) => rival.finished) && (
                <div className={styles.finishNotice} role="status"><Flag size={16} aria-hidden="true" /><span><strong>A rival reached the finish.</strong> Your run is still live — keep typing.</span></div>
              )}
            </div>

            <div className={styles.dashboard}>
              <div className={styles.speedGauge}>
                <div className={styles.gaugeArc} aria-hidden="true"><svg viewBox="0 0 160 95"><path className={styles.gaugeTrack} d="M 12 82 A 68 68 0 0 1 148 82" pathLength="100" /><path className={styles.gaugeValue} d="M 12 82 A 68 68 0 0 1 148 82" pathLength="100" strokeDasharray={`${Math.min(100, Math.max(0, wpm / 150 * 100))} 100`} /><path className={styles.gaugeTicks} d="M 20 80 L 26 80 M 38 36 L 42 41 M 80 20 L 80 26 M 122 36 L 118 41 M 140 80 L 134 80" /></svg></div>
                <span className={styles.hudLabel}>Typing speed</span><strong>{metric(wpm)}</strong><span className={styles.speedUnit}>WPM</span>
              </div>

              <div className={styles.typingConsole} data-error={hasError}>
                <div className={styles.consoleHeading}><span><Keyboard size={13} aria-hidden="true" /> Rider input</span><span>{phase === "countdown" ? "Stand by" : hasError ? "Correction needed" : needsSpace ? "Word complete" : "Type to move"}</span></div>
                <WordReadout word={currentWord} typed={typedInWord} hasError={hasError} />
                <div className={styles.nextWords}><span>Next</span><p>{upcomingWords.length ? upcomingWords.slice(0, 3).join("  ·  ") : "Finish line ahead"}</p></div>
                <div className={styles.inputSlot}>{input}</div>
                <p className={styles.inputHint} role="status" aria-live="polite">{hasError ? <RotateCcw size={12} aria-hidden="true" /> : needsSpace ? <span className={styles.spaceKey} aria-hidden="true">␣</span> : <span className={styles.inputSignal} aria-hidden="true" />}{prompt}</p>
              </div>

              <div className={styles.telemetry}>
                <div className={styles.accuracyReadout}><span className={styles.hudLabel}><ShieldCheck size={13} aria-hidden="true" /> Accuracy</span><strong>{metric(accuracy)}<small>%</small></strong></div>
                <RaceStandings rivals={rivals} playerProgress={player} playerPosition={safePlayerPosition} totalRacers={safeTotal} />
              </div>
            </div>
          </div>
        )}

        {phase === "paused" && (
          <div className={styles.overlay}>
            <section className={styles.pitPanel} aria-labelledby={`${id}-paused`}>
              <div className={styles.panelIcon}><Pause size={25} aria-hidden="true" /></div>
              <p className={styles.eyebrow}>Race on hold</p>
              <h2 id={`${id}-paused`}>PIT STOP.</h2>
              <p className={styles.panelDescription}>Take a breath. All riders and the clock are paused.</p>
              <dl className={styles.pauseMetrics}><div><dt>Your progress</dt><dd>{Math.floor(player * 100)}%</dd></div><div><dt>Race time</dt><dd>{clock(elapsedMs)}</dd></div></dl>
              <button ref={resumeRef} type="button" className={styles.primaryButton} onClick={onResume}><Play size={17} aria-hidden="true" /><span>Back to the race</span><ArrowRight size={17} aria-hidden="true" /></button>
              <button type="button" className={styles.secondaryButton} onClick={onMenu}><ArrowLeft size={15} aria-hidden="true" />Abandon run & return to garage</button>
              <p className={styles.storageNote}>Abandoning does not save this unfinished replay.</p>
            </section>
          </div>
        )}

        {phase === "done" && (
          <div className={`${styles.overlay} ${styles.finishOverlay}`}>
            <section className={styles.finishPanel} aria-labelledby={`${id}-finished`}>
              <div className={styles.finishStripe} aria-hidden="true" />
              <p className={styles.eyebrow}><Flag size={14} aria-hidden="true" /> Course complete</p>
              <div className={styles.finishTitle} role="status"><h2 ref={finishRef} tabIndex={-1} id={`${id}-finished`}>{finishTitle}</h2><p>{finishDescription}</p></div>
              {result?.record && <div className={styles.recordBadge}><Trophy size={14} aria-hidden="true" /> New session best{replaySaved === true ? " · replay saved" : ""}</div>}
              <div className={styles.podium}>
                <div className={styles.finishField}><Ghost size={21} aria-hidden="true" /><span>Field result</span><strong>{result?.tied ? "Shared finish" : `${placeLabel(finalPlacement, safeTotal)} place`}</strong><small>{beatenRivals.length} of {rivals.length} rivals beaten</small></div>
                <div className={styles.finishPlayer}><span className={styles.podiumPlace}>{placeLabel(finalPlacement, safeTotal)}</span><span>You / finish speed</span><strong>{metric(result?.wpm ?? wpm)}<small>WPM</small></strong><span className={styles.finishRank}>{rankName}</span></div>
              </div>
              <dl className={styles.finishMetrics}><div><dt><ShieldCheck size={13} aria-hidden="true" /> Accuracy</dt><dd>{metric(result?.acc ?? accuracy)}%</dd></div><div><dt><Timer size={13} aria-hidden="true" /> Finish time</dt><dd>{clock(result?.durationMs ?? elapsedMs, true)}</dd></div></dl>
              <div className={styles.beatenSummary} aria-label="Rivals beaten"><span>Rivals beaten</span><p>{result?.tied ? "None — this was a tie." : beatenRivals.length ? beatenRivals.map((rival) => rival.name).join(" · ") : "None"}</p></div>
              <div className={styles.finishStandings}><RaceStandings rivals={rivals} playerProgress={player} playerPosition={finalPlacement ?? safePlayerPosition} totalRacers={safeTotal} finished /></div>
              <p className={styles.replayStatus} role="status">{replaySaved === true ? <><Check size={14} aria-hidden="true" /> Best replay saved in this browser.</> : replaySaved === false ? "Replay is available for this rematch; browser storage could not save it." : "Saving your replay…"}</p>
              <div className={styles.finishActions}><button type="button" className={styles.primaryButton} onClick={onStart}><RotateCcw size={17} aria-hidden="true" /><span>Race again</span><ArrowRight size={17} aria-hidden="true" /></button><button type="button" className={styles.secondaryButton} onClick={onMenu}><ArrowLeft size={15} aria-hidden="true" />Garage</button></div>
            </section>
          </div>
        )}
      </div>

      <footer className={styles.bottomRail}><span><Gauge size={12} aria-hidden="true" />Four rivals · fixed pace profile: {DIFFICULTIES.find((option) => option.value === difficulty)?.label}</span><span><kbd>Esc</kbd> Pause <i /> Correct keys drive. No shortcuts.</span></footer>
    </section>
  );
}
