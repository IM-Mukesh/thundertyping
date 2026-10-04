import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActiveFruit,
  AmbientMote,
  BladeSlash,
  DIFFICULTY_CONFIGS,
  FloatingText,
  FRUIT_CONFIGS,
  FruitFuryState,
  FruitHalf,
  FruitType,
  FruitInputMode,
  FruitRunMode,
  GameDifficulty,
  JuiceSplat,
  Particle,
  SLICE_ANIM_DURATION_MS,
  STANDARD_FRUIT_TYPES,
  TypingMode,
  TYPING_MODES,
} from "./fruit-fury-types";
import {
  musicPlayer,
  playBombExplosionSound,
  playBombWarningSound,
  playComboSound,
  playFeverStartSound,
  playFruitBurstSound,
  playFrozenFruitSound,
  playGoldenFruitSound,
  playLevelUpSound,
  playMissSound,
  playSliceSound,
} from "./fruit-fury-audio";
import { renderFruit, renderSlicedHalf } from "./fruit-renderers";
import {
  acceptsFruitInput, advanceFruitState, createFruitState, missFruitKey,
  pickAvailableFruitKey, sliceFruitState, tutorialTarget,
} from "./fruit-fury-engine";

export const VIRTUAL_WIDTH = 800;
export const VIRTUAL_HEIGHT = 560;

export function useFruitFury(
  initialDifficulty: GameDifficulty = "medium",
  initialTypingMode: TypingMode = "all",
) {
  const [difficulty, setDifficulty] = useState<GameDifficulty>(initialDifficulty);
  const [typingMode, setTypingMode] = useState<TypingMode>(initialTypingMode);
  const [gameState, setGameState] = useState<FruitFuryState>(() => createFruitState(initialDifficulty, initialTypingMode));

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const bgLoadedRef = useRef<boolean>(false);

  const fruitsRef = useRef<ActiveFruit[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const splatsRef = useRef<JuiceSplat[]>([]);
  const motesRef = useRef<AmbientMote[]>([]);
  const slashesRef = useRef<BladeSlash[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const animFrameIdRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const activeClockRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);

  const dimensionsRef = useRef<{ width: number; height: number }>({
    width: VIRTUAL_WIDTH,
    height: VIRTUAL_HEIGHT,
  });

  const stateRef = useRef<FruitFuryState>(gameState);
  // Publish from the authoritative ref immediately, before React batches renders.
  const publish = useCallback((next: FruitFuryState) => {
    stateRef.current = next;
    setGameState(next);
    if (next.status === "over") musicPlayer.stop();
  }, []);

  const syncClock = useCallback(() => {
    const now = performance.now();
    const next = advanceFruitState(stateRef.current, now - activeClockRef.current);
    if (stateRef.current.isFeverActive && !next.isFeverActive) musicPlayer.setFever(false);
    activeClockRef.current = now;
    publish(next);
    return next;
  }, [publish]);

  const soundEnabledRef = useRef<boolean>(true);
  const reducedEffectsRef = useRef(false);
  const lastTouchPosRef = useRef<{ x: number; y: number } | null>(null);

  // Responsive canvas resize observer to support any phone, tablet, and desktop aspect ratio
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const width = Math.round(rect.width);
        const height = Math.round(rect.height);
        dimensionsRef.current = { width, height };
        const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
      }
    };

    updateSize();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => {
        updateSize();
      });
      observer.observe(canvas);
      return () => {
        observer.disconnect();
      };
    }
  }, []);

  // Load arena background image
  useEffect(() => {
    if (typeof window === "undefined") return;
    const img = new Image();
    img.src = "/games/fruit-fury/bg-arena.webp";
    img.onload = () => {
      bgImageRef.current = img;
      bgLoadedRef.current = true;
    };
  }, []);

  // Initialize ambient motes
  useEffect(() => {
    const width = dimensionsRef.current.width;
    const height = dimensionsRef.current.height;
    motesRef.current = Array.from({ length: 18 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: -0.2 - Math.random() * 0.4,
      vy: 0.2 + Math.random() * 0.4,
      size: 2 + Math.random() * 3,
      alpha: 0.15 + Math.random() * 0.25,
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.02,
      color: Math.random() > 0.4 ? "#f43f5e" : "#fbbf24",
    }));
  }, []);

  // Helper to get active letters on screen
  const getActiveLetters = useCallback(() => {
    return new Set(
      fruitsRef.current
        .filter((f) => f.state === "flying")
        .map((f) => f.letter),
    );
  }, []);

  // Spawn a wave of objects
  const spawnFruitWave = useCallback(() => {
    const s = stateRef.current;
    if (s.status !== "running") return;

    const diffConfig = DIFFICULTY_CONFIGS[s.difficulty];
    const isFever = s.isFeverActive;
    const tutorial = s.runMode === "tutorial";
    if (tutorial && fruitsRef.current.some((fruit) => fruit.state === "flying")) return;

    // Calculate wave size based on level
    const baseWaveSize = 1 + Math.min(Math.floor((s.level - 1) / 3), diffConfig.simultaneousMax - 1);
    const waveSize = tutorial ? 1 : isFever ? Math.min(baseWaveSize + 2, diffConfig.simultaneousMax) : baseWaveSize;

    // Determine bomb probability
    const levelBombProgress = Math.min((s.level - 1) / 8, 1);
    const bombProb = isFever
      ? 0 // No bombs during Fever Mode!
      : diffConfig.bombChanceStart +
        (diffConfig.bombChanceMax - diffConfig.bombChanceStart) * levelBombProgress;

    const usedLetters = getActiveLetters();
    const { width: arenaWidth, height: arenaHeight } = dimensionsRef.current;

    // Calculate synchronized vertical launch velocity across entire wave
    // so fruits in a volley rise, peak at apex, and fall together harmoniously!
    const targetApexY = arenaHeight * 0.24;
    const deltaY = (arenaHeight + 35) - targetApexY;
    const nominalDeltaY = (560 + 35) - 560 * 0.24;
    const heightScale = Math.sqrt(deltaY / nominalDeltaY);
    const waveLaunchVy = diffConfig.initialSpeedY * heightScale;

    for (let i = 0; i < waveSize; i++) {
      if (fruitsRef.current.filter((f) => f.state === "flying").length >= diffConfig.simultaneousMax + 1) {
        break;
      }

      const letter = pickAvailableFruitKey(TYPING_MODES[s.typingMode].keys, usedLetters);
      if (!letter) break;
      usedLetters.add(letter);

      // Roll fruit type
      const isBomb = tutorial ? tutorialTarget(s) === "bomb" : Math.random() < bombProb && i === 0;
      let fruitType: FruitType;

      if (tutorial) {
        fruitType = tutorialTarget(s);
      } else if (isBomb) {
        fruitType = "bomb";
      } else {
        const specialRoll = Math.random();
        if (specialRoll < diffConfig.specialChance * 0.45) {
          fruitType = "golden";
        } else if (specialRoll < diffConfig.specialChance) {
          fruitType = "frozen";
        } else {
          const randomIndex = Math.floor(Math.random() * STANDARD_FRUIT_TYPES.length);
          fruitType = STANDARD_FRUIT_TYPES[randomIndex]!;
        }
      }

      const cfg = FRUIT_CONFIGS[fruitType];

      // Spawn positioning: evenly distributed across screen width
      const minX = Math.max(50, arenaWidth * 0.12);
      const maxX = arenaWidth - minX;
      const x = minX + (maxX - minX) * ((i + 0.5) / waveSize + (Math.random() - 0.5) * 0.12);
      const y = arenaHeight + 35;

      // Trajectory calculation: inward curve toward center
      const targetCenterX = arenaWidth * 0.5 + (Math.random() - 0.5) * (arenaWidth * 0.22);
      const launchVx = (targetCenterX - x) * 0.007 + (Math.random() - 0.5) * 1.1;

      fruitsRef.current.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: fruitType,
        letter,
        x: tutorial ? arenaWidth / 2 : x,
        y: tutorial ? arenaHeight * 0.48 : y,
        vx: tutorial ? 0 : launchVx,
        vy: tutorial ? 0 : waveLaunchVy,
        radius: cfg.radius,
        rotation: (Math.random() - 0.5) * 0.5,
        rotationSpeed: (Math.random() - 0.5) * 0.045,
        state: "flying",
        visibleAt: tutorial ? s.elapsedMs : undefined,
        fusePhase: 0,
      });

      if (isBomb) {
        playBombWarningSound(soundEnabledRef.current);
      }
    }
  }, [getActiveLetters]);

  // Trigger Slicing Action
  const sliceFruit = useCallback((fruit: ActiveFruit) => {
    const s = stateRef.current;
    if (s.status !== "running" || fruit.state !== "flying") return;

    const cfg = FRUIT_CONFIGS[fruit.type];
    const now = Date.now();
    const next = sliceFruitState(s, fruit);
    publish(next);

    // BOMB HIT = INSTANT GAME OVER
    if (cfg.isBomb) {
      fruit.state = "exploded";
      playBombExplosionSound(soundEnabledRef.current);

      // Massive shockwave particles
      for (let i = 0; i < (reducedEffectsRef.current ? 0 : 55); i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 4 + Math.random() * 11;
        particlesRef.current.push({
          x: fruit.x,
          y: fruit.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 3 + Math.random() * 6,
          color: i % 3 === 0 ? "#f97316" : i % 3 === 1 ? "#ef4444" : "#fbbf24",
          alpha: 1,
          decay: 0.018 + Math.random() * 0.025,
          shape: "spark",
        });
      }

      return;
    }

    // REGULAR OR SPECIAL FRUIT SLICED
    fruit.state = "sliced";
    fruit.slicedAt = now;

    // Slice angle: dynamic slash angle
    const sliceAngle = Math.PI / 4 + (Math.random() - 0.5) * 0.4;
    const cutNormal = sliceAngle + Math.PI / 2;
    const pushSpeed = 4.2;

    const leftHalf: FruitHalf = {
      x: fruit.x - Math.cos(cutNormal) * 10,
      y: fruit.y - Math.sin(cutNormal) * 10,
      vx: fruit.vx - Math.cos(cutNormal) * pushSpeed,
      vy: fruit.vy - Math.sin(cutNormal) * pushSpeed - 1.8,
      angle: fruit.rotation,
      va: -0.07 - Math.random() * 0.06,
      opacity: 1,
      sliceAngle,
      isLeft: true,
    };

    const rightHalf: FruitHalf = {
      x: fruit.x + Math.cos(cutNormal) * 10,
      y: fruit.y + Math.sin(cutNormal) * 10,
      vx: fruit.vx + Math.cos(cutNormal) * pushSpeed,
      vy: fruit.vy + Math.sin(cutNormal) * pushSpeed - 1.8,
      angle: fruit.rotation,
      va: 0.07 + Math.random() * 0.06,
      opacity: 1,
      sliceAngle,
      isLeft: false,
    };

    fruit.halves = [leftHalf, rightHalf];

    if (!reducedEffectsRef.current) {
    // Stamp a rich juice splatter decal onto the background wall with gravity drips
    const splatDroplets = Array.from({ length: 9 }, () => {
      const a = Math.random() * Math.PI * 2;
      const dist = 12 + Math.random() * 34;
      return { dx: Math.cos(a) * dist, dy: Math.sin(a) * dist, r: 2.2 + Math.random() * 4.2 };
    });

    const splatDrips = Array.from({ length: 2 + Math.floor(Math.random() * 3) }, () => ({
      dx: (Math.random() - 0.5) * (fruit.radius * 0.8),
      dy: Math.random() * 6,
      length: 16 + Math.random() * 30,
      width: 2.5 + Math.random() * 2.2,
    }));

    splatsRef.current.push({
      id: Math.random().toString(),
      x: fruit.x,
      y: fruit.y,
      radius: fruit.radius * 1.35,
      color: cfg.juiceColor,
      alpha: 0.5,
      createdAt: now,
      durationMs: 2600,
      droplets: splatDroplets,
      drips: splatDrips,
    });

    // 1. Splatter High-Velocity Liquid Juice Droplets
    const dropCount = fruit.type === "golden" ? 36 : 24;
    for (let i = 0; i < dropCount; i++) {
      const angle = sliceAngle + (Math.random() - 0.5) * 1.4 + (i % 2 === 0 ? 0 : Math.PI);
      const speed = 2.8 + Math.random() * 8.5;
      particlesRef.current.push({
        x: fruit.x,
        y: fruit.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.4,
        radius: 2.2 + Math.random() * 4.8,
        color: i % 3 === 0 ? cfg.primaryColor : cfg.juiceColor,
        alpha: 1,
        decay: 0.02 + Math.random() * 0.025,
        shape: fruit.type === "golden" ? "spark" : fruit.type === "frozen" ? "shard" : "drop",
      });
    }

    // 2. Translucent Organic Pulp Flecks
    if (fruit.type !== "bomb") {
      const pulpCount = 6 + Math.floor(Math.random() * 5);
      for (let i = 0; i < pulpCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.0 + Math.random() * 4.0;
        particlesRef.current.push({
          x: fruit.x + (Math.random() - 0.5) * 12,
          y: fruit.y + (Math.random() - 0.5) * 12,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.6,
          radius: 3.0 + Math.random() * 3.5,
          color: cfg.juiceColor,
          alpha: 0.85,
          decay: 0.025 + Math.random() * 0.02,
          shape: "pulp",
        });
      }
    }

    // 3. Real Botanical Seeds popping out from the fruit core
    if (fruit.type === "watermelon") {
      for (let i = 0; i < 6; i++) {
        const angle = sliceAngle + (Math.random() - 0.5) * 1.5 + (i % 2 === 0 ? 0 : Math.PI);
        const speed = 2.0 + Math.random() * 6.0;
        particlesRef.current.push({
          x: fruit.x,
          y: fruit.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.8,
          radius: 2.8,
          color: "#18181b",
          alpha: 1,
          decay: 0.016 + Math.random() * 0.015,
          shape: "seed",
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.2,
        });
      }
    } else if (fruit.type === "apple") {
      for (let i = 0; i < 3; i++) {
        const angle = sliceAngle + (Math.random() - 0.5) * 1.2;
        const speed = 2.5 + Math.random() * 5.0;
        particlesRef.current.push({
          x: fruit.x,
          y: fruit.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.6,
          radius: 3.0,
          color: "#292524",
          alpha: 1,
          decay: 0.018 + Math.random() * 0.015,
          shape: "seed",
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.15,
        });
      }
    } else if (fruit.type === "kiwi") {
      for (let i = 0; i < 10; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 5.5;
        particlesRef.current.push({
          x: fruit.x,
          y: fruit.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.0,
          radius: 1.8,
          color: "#1c1917",
          alpha: 1,
          decay: 0.02 + Math.random() * 0.02,
          shape: "seed",
        });
      }
    } else if (fruit.type === "strawberry") {
      for (let i = 0; i < 8; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.8 + Math.random() * 5.5;
        particlesRef.current.push({
          x: fruit.x,
          y: fruit.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.0,
          radius: 1.6,
          color: "#fef08a",
          alpha: 1,
          decay: 0.022 + Math.random() * 0.02,
          shape: "seed",
        });
      }
    } else if (fruit.type === "dragonfruit") {
      for (let i = 0; i < 12; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 6.0;
        particlesRef.current.push({
          x: fruit.x,
          y: fruit.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.0,
          radius: 1.8,
          color: "#111827",
          alpha: 1,
          decay: 0.02 + Math.random() * 0.02,
          shape: "seed",
        });
      }
    }

    // Blade Slash Trail
    const slashLength = fruit.radius * 3.2;
    slashesRef.current.push({
      id: Math.random().toString(),
      x1: fruit.x - Math.cos(sliceAngle) * slashLength,
      y1: fruit.y - Math.sin(sliceAngle) * slashLength,
      x2: fruit.x + Math.cos(sliceAngle) * slashLength,
      y2: fruit.y + Math.sin(sliceAngle) * slashLength,
      color: fruit.type === "golden" ? "#fef08a" : "#ffffff",
      createdAt: now,
      durationMs: 260,
    });
    }

    // Audio SFX
    playSliceSound(soundEnabledRef.current);
    playFruitBurstSound(soundEnabledRef.current);

    // Combo handling
    const newCombo = next.combo;

    if (newCombo > 1) {
      playComboSound(newCombo, soundEnabledRef.current);
    }

    // Special fruit rewards
    if (fruit.type === "golden") {
      playGoldenFruitSound(soundEnabledRef.current);
      floatingTextsRef.current.push({
        id: Math.random().toString(),
        text: `GOLDEN DRAGON! +${next.score - s.score}`,
        x: fruit.x,
        y: fruit.y - 25,
        color: "#fbbf24",
        size: 22,
        alpha: 1,
        createdAt: now,
        durationMs: 1300,
        vy: -1.2,
      });
    } else if (fruit.type === "frozen") {
      playFrozenFruitSound(soundEnabledRef.current);
      floatingTextsRef.current.push({
        id: Math.random().toString(),
        text: "❄️ DEEP FREEZE!",
        x: fruit.x,
        y: fruit.y - 25,
        color: "#38bdf8",
        size: 22,
        alpha: 1,
        createdAt: now,
        durationMs: 1300,
        vy: -1.2,
      });
    }

    // Trigger Fever Mode if meter filled
    if (next.isFeverActive && !s.isFeverActive) {
      playFeverStartSound(soundEnabledRef.current);
      musicPlayer.setFever(true);
      floatingTextsRef.current.push({
        id: Math.random().toString(),
        text: "🔥 FEVER FRENZY! 2X SCORE! 🔥",
        x: dimensionsRef.current.width / 2,
        y: 150,
        color: "#f43f5e",
        size: 26,
        alpha: 1,
        createdAt: now,
        durationMs: 1600,
        vy: -0.8,
      });
    }

    // Floating Combo Text
    if (newCombo >= 3) {
      const comboLabel =
        newCombo >= 10 ? "PERFECT! x10" : newCombo >= 5 ? "GREAT! x5" : `COMBO x${newCombo}`;
      floatingTextsRef.current.push({
        id: Math.random().toString(),
        text: comboLabel,
        x: fruit.x,
        y: fruit.y - (fruit.type === "golden" ? 50 : 25),
        color: newCombo >= 10 ? "#ec4899" : newCombo >= 5 ? "#eab308" : "#38bdf8",
        size: 20,
        alpha: 1,
        createdAt: now,
        durationMs: 950,
        vy: -1.0,
      });
    }

    // Level progression: level up every 8 cleared fruits
    const newLevel = next.level;
    const isLevelUp = newLevel > s.level;

    if (isLevelUp) {
      playLevelUpSound(soundEnabledRef.current);
      floatingTextsRef.current.push({
        id: Math.random().toString(),
        text: `LEVEL ${newLevel}!`,
        x: dimensionsRef.current.width / 2,
        y: 200,
        color: "#22c55e",
        size: 28,
        alpha: 1,
        createdAt: now,
        durationMs: 1400,
        vy: -0.6,
      });
    }

  }, [publish]);

  // Keyboard handler: accepts letters A-Z and digits 0-9
  const handleKeyInput = useCallback(
    (char: string) => {
      if (!acceptsFruitInput(stateRef.current, "keyboard")) return;
      const s = syncClock();
      if (!acceptsFruitInput(s, "keyboard")) return;

      const upper = char.toUpperCase();
      if (!/^[A-Z0-9]$/.test(upper)) return;

      // Find lowest flying object matching this letter (most urgent)
      const matchingFruits = fruitsRef.current
        .filter((f) => f.state === "flying" && f.letter === upper)
        .sort((a, b) => b.y - a.y);

      if (matchingFruits.length > 0) {
        sliceFruit(matchingFruits[0]!);
      } else {
        // Mistyped key: reset combo
        publish(missFruitKey(s, upper));
      }
    },
    [sliceFruit, syncClock, publish],
  );

  // Start / Restart game: spawn initial wave immediately!
  const startGame = useCallback(
    (chosenDifficulty?: GameDifficulty, chosenTypingMode?: TypingMode, inputMode: FruitInputMode = "keyboard", runMode: FruitRunMode = "classic") => {
      const diff = chosenDifficulty ?? difficulty;
      const mode = chosenTypingMode ?? typingMode;
      setDifficulty(diff);
      setTypingMode(mode);

      fruitsRef.current = [];
      particlesRef.current = [];
      splatsRef.current = [];
      slashesRef.current = [];
      floatingTextsRef.current = [];
      lastTouchPosRef.current = null;
      lastFrameTimeRef.current = performance.now();
      activeClockRef.current = lastFrameTimeRef.current;
      // Set spawn timer to trigger almost immediately (150ms)
      spawnTimerRef.current = DIFFICULTY_CONFIGS[diff].initialSpawnInterval - 150;

      const initial = { ...createFruitState(diff, mode, inputMode, runMode), status: "running" as const, startTime: Date.now() };
      publish(initial);
      if (runMode === "tutorial") spawnFruitWave();
      musicPlayer.setFever(false);
      musicPlayer.start(soundEnabledRef.current);
    },
    [difficulty, typingMode, publish, spawnFruitWave],
  );

  // Pause / Resume
  const pauseGame = useCallback(() => {
    if (stateRef.current.status !== "running") return;
    const current = syncClock();
    lastTouchPosRef.current = null;
    musicPlayer.stop();
    if (current.status === "running") publish({ ...current, status: "paused" });
  }, [publish, syncClock]);

  const togglePause = useCallback(() => {
    if (stateRef.current.status === "running") pauseGame();
    else if (stateRef.current.status === "paused" && !document.hidden) {
      lastFrameTimeRef.current = performance.now();
      activeClockRef.current = lastFrameTimeRef.current;
      publish({ ...stateRef.current, status: "running" });
      musicPlayer.start(soundEnabledRef.current);
      musicPlayer.setFever(stateRef.current.isFeverActive);
    }
  }, [pauseGame, publish]);

  const returnToMenu = useCallback(() => {
    musicPlayer.stop();
    fruitsRef.current = [];
    lastTouchPosRef.current = null;
    publish(createFruitState(difficulty, typingMode));
  }, [difficulty, typingMode, publish]);

  const setReducedEffects = useCallback((enabled: boolean) => {
    reducedEffectsRef.current = enabled;
    if (enabled) {
      particlesRef.current = [];
      splatsRef.current = [];
      slashesRef.current = [];
      floatingTextsRef.current = [];
    }
  }, []);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    soundEnabledRef.current = enabled;
    musicPlayer.setSoundEnabled(enabled);
  }, []);

  // Main Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let isSubscribed = true;

    const gameLoop = (timestamp: number) => {
      if (!isSubscribed) return;

      const deltaMs = Math.max(0, timestamp - lastFrameTimeRef.current);
      lastFrameTimeRef.current = timestamp;
      const dt = Math.min(deltaMs / 16.667, 2.0);

      const previous = stateRef.current;
      const s = advanceFruitState(previous, Math.max(0, timestamp - activeClockRef.current));
      activeClockRef.current = Math.max(activeClockRef.current, timestamp);
      if (previous.isFeverActive && !s.isFeverActive) musicPlayer.setFever(false);
      if (previous.status === "running") publish(s);
      const { width: arenaWidth, height: arenaHeight } = dimensionsRef.current;

      if (s.status === "running") {
        const diffConfig = DIFFICULTY_CONFIGS[s.difficulty];

        // 1. Spawning
        spawnTimerRef.current += deltaMs;
        const interval = Math.max(
          diffConfig.minSpawnInterval,
          diffConfig.initialSpawnInterval - (s.level - 1) * 75,
        );

        if (spawnTimerRef.current >= interval) {
          spawnTimerRef.current = 0;
          spawnFruitWave();
        }

        // 3. Harmonious Fruit Physics Update
        const baseGravity = diffConfig.gravity * (s.isFrozenActive ? 0.45 : 1.0);
        const missedKeysThisFrame: string[] = [];
        let bombsAvoidedThisFrame = 0;

        const nominalDeltaY = (560 + 35) - 560 * 0.24;
        const currentDeltaY = (arenaHeight + 35) - arenaHeight * 0.24;
        const currentHeightScale = Math.sqrt(currentDeltaY / nominalDeltaY);
        const maxFallSpeed = 14.5 * currentHeightScale;

        fruitsRef.current.forEach((fruit) => {
          if (fruit.state === "flying") {
            if (s.runMode === "tutorial" && fruit.type !== "bomb") return;
            const timeScale = (s.isFrozenActive ? 0.45 : 1.0) * dt;

            // Continuous apex float: float gracefully near apex without sudden stepwise speed jumps
            const apexDampener = Math.min(1.0, 0.72 + 0.28 * Math.min(Math.abs(fruit.vy) / 3.0, 1.0));
            const effectiveGravity = baseGravity * apexDampener;

            fruit.x += fruit.vx * timeScale;
            fruit.y += fruit.vy * timeScale;
            fruit.vy += effectiveGravity * dt;
            if (fruit.visibleAt === undefined && fruit.y - fruit.radius <= arenaHeight) fruit.visibleAt = s.elapsedMs;

            // Cap terminal downward velocity so fruits fall predictably and harmoniously
            if (fruit.vy > maxFallSpeed) {
              fruit.vy = maxFallSpeed;
            }

            if (!reducedEffectsRef.current) fruit.rotation += fruit.rotationSpeed * timeScale;

            // Bomb fuse spark pulse
            if (fruit.type === "bomb" && !reducedEffectsRef.current) {
              fruit.fusePhase = ((fruit.fusePhase ?? 0) + 0.16 * dt) % 1;
            }

            // Check if dropped below bottom edge
            if (fruit.y > arenaHeight + 70 && fruit.vy > 0) {
              fruit.state = "missed";
              if (fruit.type === "bomb") {
                bombsAvoidedThisFrame++;
              } else {
                missedKeysThisFrame.push(fruit.letter);
                playMissSound(soundEnabledRef.current);
              }
            }
          } else if (fruit.state === "sliced" && fruit.halves) {
            // Update split halves with normalized dt
            fruit.halves.forEach((half) => {
              const timeScale = (s.isFrozenActive ? 0.45 : 1.0) * dt;
              half.x += half.vx * timeScale;
              half.y += half.vy * timeScale;
              half.vy += baseGravity * 1.1 * dt;
              half.angle += half.va * timeScale;
              half.opacity = Math.max(
                0,
                1 - ((Date.now() - (fruit.slicedAt ?? 0)) / SLICE_ANIM_DURATION_MS),
              );
            });
          }
        });

        // Clean up finished fruits
        fruitsRef.current = fruitsRef.current.filter((fruit) => {
          if (fruit.state === "flying") return true;
          if (fruit.state === "sliced") {
            return Date.now() - (fruit.slicedAt ?? 0) < SLICE_ANIM_DURATION_MS;
          }
          return false;
        });

        // 4. Particle Update with normalized dt
        particlesRef.current.forEach((p) => {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy += 0.28 * dt; // particle gravity
          p.alpha -= p.decay * dt;
          if (p.rotation !== undefined && p.rotationSpeed !== undefined) {
            p.rotation += p.rotationSpeed * dt;
          }
        });
        particlesRef.current = particlesRef.current.filter((p) => p.alpha > 0);

        // 5. Splats decay
        const now = Date.now();
        splatsRef.current.forEach((splat) => {
          const age = now - splat.createdAt;
          splat.alpha = Math.max(0, 0.45 * (1 - age / splat.durationMs));
        });
        splatsRef.current = splatsRef.current.filter((splat) => splat.alpha > 0);

        // 6. Ambient Motes drift
        motesRef.current.forEach((mote) => {
          mote.x += mote.vx;
          mote.y += mote.vy;
          mote.rotation += mote.vRot;
          if (mote.x < -10) mote.x = arenaWidth + 10;
          if (mote.y > arenaHeight + 10) mote.y = -10;
        });

        // 7. Slash Trails Update
        slashesRef.current = slashesRef.current.filter(
          (slash) => now - slash.createdAt < slash.durationMs,
        );

        // 8. Floating Texts Update
        floatingTextsRef.current.forEach((txt) => {
          txt.y += txt.vy;
          txt.alpha = Math.max(0, 1 - (now - txt.createdAt) / txt.durationMs);
        });
        floatingTextsRef.current = floatingTextsRef.current.filter((txt) => txt.alpha > 0);

        // 9. Screen Shake decay
        let shake = s.screenShake;
        if (shake.intensity > 0.05) {
          const offsetX = (Math.random() - 0.5) * shake.intensity * 2;
          const offsetY = (Math.random() - 0.5) * shake.intensity * 2;
          shake = {
            ...shake,
            intensity: shake.intensity * shake.decay,
            offsetX,
            offsetY,
          };
        } else {
          shake = { intensity: 0, decay: 0.9, offsetX: 0, offsetY: 0 };
        }

        // 10. Flash decay
        let flashAlpha = s.flashAlpha;
        if (flashAlpha > 0.02) {
          flashAlpha *= 0.88;
        } else {
          flashAlpha = 0;
        }

        // 11. Check Lives & Game Over
        publish({
          ...advanceFruitState(stateRef.current, 0, missedKeysThisFrame, bombsAvoidedThisFrame),
          screenShake: shake,
          flashAlpha,
        });
      }

      // ==========================================
      // RENDER PASS
      // ==========================================
      const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

      ctx.save();
      ctx.scale(dpr, dpr);

      // Screen shake translation (disabled if prefers-reduced-motion)
      const prefersReducedMotion = reducedEffectsRef.current;
      if (!prefersReducedMotion && s.screenShake.intensity > 0) {
        ctx.translate(s.screenShake.offsetX, s.screenShake.offsetY);
      }

      // Clear Canvas
      ctx.clearRect(0, 0, arenaWidth, arenaHeight);

      // Background: draw Dojo image if loaded, else rich wood gradient
      if (bgLoadedRef.current && bgImageRef.current) {
        ctx.drawImage(bgImageRef.current, 0, 0, arenaWidth, arenaHeight);
        // Subtle dark vignette overlay
        ctx.fillStyle = s.isFeverActive
          ? "rgba(112, 10, 38, 0.45)"
          : s.isFrozenActive
            ? "rgba(8, 47, 73, 0.5)"
            : "rgba(10, 15, 26, 0.45)";
        ctx.fillRect(0, 0, arenaWidth, arenaHeight);
      } else {
        const bgGrad = ctx.createLinearGradient(0, 0, 0, arenaHeight);
        if (s.isFeverActive) {
          bgGrad.addColorStop(0, "#2e081d");
          bgGrad.addColorStop(0.5, "#4c0519");
          bgGrad.addColorStop(1, "#1c040d");
        } else if (s.isFrozenActive) {
          bgGrad.addColorStop(0, "#082f49");
          bgGrad.addColorStop(0.5, "#0c4a6e");
          bgGrad.addColorStop(1, "#082f49");
        } else {
          bgGrad.addColorStop(0, "#1c1917");
          bgGrad.addColorStop(0.6, "#292524");
          bgGrad.addColorStop(1, "#0c0a09");
        }
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, arenaWidth, arenaHeight);
      }

      // Render Ambient Drifting Motes (sakura / embers)
      if (!prefersReducedMotion) motesRef.current.forEach((mote) => {
        ctx.save();
        ctx.globalAlpha = mote.alpha;
        ctx.translate(mote.x, mote.y);
        ctx.rotate(mote.rotation);
        ctx.fillStyle = s.isFeverActive ? "#f43f5e" : mote.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, mote.size, mote.size * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Render Juice Splat Decals on Dojo Wall
      const renderNow = Date.now();
      if (!prefersReducedMotion) splatsRef.current.forEach((splat) => {
        const age = renderNow - splat.createdAt;
        ctx.save();
        ctx.globalAlpha = splat.alpha;
        ctx.fillStyle = splat.color;
        // Central splat pool
        ctx.beginPath();
        ctx.arc(splat.x, splat.y, splat.radius * 0.45, 0, Math.PI * 2);
        ctx.fill();
        // Droplets
        splat.droplets.forEach((d) => {
          ctx.beginPath();
          ctx.arc(splat.x + d.dx, splat.y + d.dy, d.r, 0, Math.PI * 2);
          ctx.fill();
        });
        // Gravity Wall Drips running down the arena
        if (splat.drips) {
          const dripProgress = Math.min(1, age / 700);
          splat.drips.forEach((drip) => {
            const curLen = drip.length * dripProgress;
            ctx.beginPath();
            ctx.roundRect(
              splat.x + drip.dx - drip.width / 2,
              splat.y + drip.dy,
              drip.width,
              curLen,
              drip.width / 2,
            );
            ctx.fill();
            // Fluid drop bead at the bottom of the drip
            ctx.beginPath();
            ctx.arc(
              splat.x + drip.dx,
              splat.y + drip.dy + curLen,
              drip.width * 0.8,
              0,
              Math.PI * 2,
            );
            ctx.fill();
          });
        }
        ctx.restore();
      });

      // Render Katana Blade Slash Trails
      if (!prefersReducedMotion) slashesRef.current.forEach((slash) => {
        const progress = (Date.now() - slash.createdAt) / slash.durationMs;
        const alpha = Math.max(0, 1 - progress);
        ctx.save();

        // 1. Wide glowing colored ribbon aura
        ctx.strokeStyle = slash.color;
        ctx.lineWidth = 12 * (1 - progress);
        ctx.shadowColor = slash.color;
        ctx.shadowBlur = 18;
        ctx.globalAlpha = alpha * 0.65;
        ctx.beginPath();
        ctx.moveTo(slash.x1, slash.y1);
        ctx.lineTo(slash.x2, slash.y2);
        ctx.stroke();

        // 2. Razor-thin brilliant white blade core
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3.5 * (1 - progress);
        ctx.shadowColor = "#ffffff";
        ctx.shadowBlur = 8;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.moveTo(slash.x1, slash.y1);
        ctx.lineTo(slash.x2, slash.y2);
        ctx.stroke();

        ctx.restore();
      });

      // Render Particles (drops, seeds, pulp, shards, sparks)
      if (!prefersReducedMotion) particlesRef.current.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = p.alpha;

        if (p.shape === "drop") {
          // Teardrop droplet aligned with velocity vector
          ctx.translate(p.x, p.y);
          const angle = Math.atan2(p.vy, p.vx);
          ctx.rotate(angle);
          const speed = Math.hypot(p.vx, p.vy);
          const stretch = Math.min(2.4, 1 + speed * 0.12);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.radius * stretch, p.radius * 0.65, 0, 0, Math.PI * 2);
          ctx.fill();
          // Specular glistening micro-highlight
          ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
          ctx.beginPath();
          ctx.ellipse(-p.radius * stretch * 0.25, -p.radius * 0.2, p.radius * 0.45, p.radius * 0.2, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === "seed") {
          // Authentic botanical seed (watermelon/apple/kiwi/strawberry seed)
          ctx.translate(p.x, p.y);
          if (p.rotation !== undefined) ctx.rotate(p.rotation);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.radius, p.radius * 0.55, 0, 0, Math.PI * 2);
          ctx.fill();
          // Seed gloss reflection
          ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
          ctx.beginPath();
          ctx.arc(-p.radius * 0.2, -p.radius * 0.2, p.radius * 0.25, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === "pulp") {
          // Soft organic fruit pulp speck
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === "shard") {
          // Crystalline fracture diamond for Frost Berry
          ctx.translate(p.x, p.y);
          if (p.rotation !== undefined) ctx.rotate(p.rotation);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.moveTo(0, -p.radius);
          ctx.lineTo(p.radius * 0.6, 0);
          ctx.lineTo(0, p.radius);
          ctx.lineTo(-p.radius * 0.6, 0);
          ctx.closePath();
          ctx.fill();
        } else {
          // Sparkle for Golden Dragon / Bomb detonation
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      // Render Active Fruits & Sliced Halves using Master Renderers
      const nowTime = prefersReducedMotion ? 0 : performance.now();
      fruitsRef.current.forEach((fruit) => {
        if (fruit.state === "flying") {
          renderFruit(ctx, fruit, nowTime);
        } else if (!prefersReducedMotion && fruit.state === "sliced" && fruit.halves) {
          fruit.halves.forEach((half) => {
            renderSlicedHalf(ctx, fruit, half);
          });
        }
      });

      // Render Floating Texts with glow
      if (!prefersReducedMotion) floatingTextsRef.current.forEach((txt) => {
        ctx.save();
        ctx.globalAlpha = txt.alpha;
        ctx.fillStyle = txt.color;
        ctx.shadowColor = txt.color;
        ctx.shadowBlur = 12;
        ctx.font = `900 ${txt.size}px 'Inter', system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(txt.text, txt.x, txt.y);
        ctx.restore();
      });

      // Render Screen Flash (Bombs / Damage)
      if (!prefersReducedMotion && s.flashAlpha > 0 && s.flashColor) {
        ctx.save();
        ctx.globalAlpha = s.flashAlpha;
        ctx.fillStyle = s.flashColor;
        ctx.fillRect(0, 0, arenaWidth, arenaHeight);
        ctx.restore();
      }

      ctx.restore();

      if (stateRef.current.status === "running" && typeof document !== "undefined" && !document.hidden) {
        animFrameIdRef.current = requestAnimationFrame(gameLoop);
      }
    };

    if (gameState.status === "running") {
      animFrameIdRef.current = requestAnimationFrame(gameLoop);
    } else {
      // Paint single frame when idle, paused, or over without burning a permanent 60fps loop
      gameLoop(performance.now());
    }

    const handleVisibility = () => {
      if (typeof document === "undefined") return;
      if (document.hidden) {
        if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
        pauseGame();
      }
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibility);
      window.addEventListener("blur", pauseGame);
    }

    return () => {
      isSubscribed = false;
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibility);
        window.removeEventListener("blur", pauseGame);
      }
    };
  }, [gameState.status, sliceFruit, spawnFruitWave, publish, pauseGame]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      musicPlayer.stop();
    };
  }, []);

  // Handle canvas click / tap for slice (1:1 direct pixel coordinate mapping)
  const handleCanvasClick = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas || !acceptsFruitInput(stateRef.current, "touch")) return;
      if (!acceptsFruitInput(syncClock(), "touch")) return;

      const rect = canvas.getBoundingClientRect();
      const clickX = clientX - rect.left;
      const clickY = clientY - rect.top;

      // Find fruit under touch with generous touch hitbox (+24px)
      const clicked = fruitsRef.current.find((f) => {
        if (f.state !== "flying") return false;
        const dx = f.x - clickX;
        const dy = f.y - clickY;
        return Math.sqrt(dx * dx + dy * dy) <= f.radius + 24;
      });

      if (clicked) {
        sliceFruit(clicked);
      }
    },
    [sliceFruit, syncClock],
  );

  // Mobile Touch Gestures (Swipe / Drag Slicing)
  const handleTouchStart = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas || !acceptsFruitInput(stateRef.current, "touch")) return;
      const rect = canvas.getBoundingClientRect();
      lastTouchPosRef.current = { x: clientX - rect.left, y: clientY - rect.top };
      handleCanvasClick(clientX, clientY);
    },
    [handleCanvasClick],
  );

  const handleTouchMove = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas || !acceptsFruitInput(stateRef.current, "touch")) return;
      if (!acceptsFruitInput(syncClock(), "touch")) return;
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const prev = lastTouchPosRef.current;
      lastTouchPosRef.current = { x, y };

      if (prev) {
        // Finger swipe blade slash trail
        if (!reducedEffectsRef.current) slashesRef.current.push({
          id: Math.random().toString(),
          x1: prev.x,
          y1: prev.y,
          x2: x,
          y2: y,
          color: "#ffffff",
          createdAt: Date.now(),
          durationMs: 220,
        });

        // Slice any flying fruit intersecting finger stroke
        fruitsRef.current.forEach((f) => {
          if (f.state !== "flying") return;
          const dist = distToSegment(prev, { x, y }, { x: f.x, y: f.y });
          if (dist <= f.radius + 24) {
            sliceFruit(f);
          }
        });
      } else {
        handleCanvasClick(clientX, clientY);
      }
    },
    [handleCanvasClick, sliceFruit, syncClock],
  );

  const handleTouchEnd = useCallback(() => {
    lastTouchPosRef.current = null;
  }, []);

  return {
    state: gameState,
    canvasRef,
    difficulty,
    typingMode,
    setTypingMode,
    startGame,
    togglePause,
    pauseGame,
    returnToMenu,
    handleKeyInput,
    handleCanvasClick,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    setSoundEnabled,
    setReducedEffects,
  };
}

function distToSegment(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p: { x: number; y: number },
): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) {
    const ex = p.x - p1.x;
    const ey = p.y - p1.y;
    return Math.sqrt(ex * ex + ey * ey);
  }
  let t = ((p.x - p1.x) * dx + (p.y - p1.y) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  const projX = p1.x + t * dx;
  const projY = p1.y + t * dy;
  const rx = p.x - projX;
  const ry = p.y - projY;
  return Math.sqrt(rx * rx + ry * ry);
}
