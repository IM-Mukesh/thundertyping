"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Crown,
  Gamepad2,
  Heart,
  Layers,
  Play,
  Sparkles,
  Trophy,
} from "lucide-react";
import type { GameDefinition } from "@/lib/games/game-types";
import { GameBestBadge } from "@/components/games/game-best-badge";
import { cn } from "@/lib/utils/cn";

interface MobileGamesHubProps {
  games: GameDefinition[];
  art: Record<string, string | null>;
  characters: Record<string, string | null>;
  selectedCategory: string;
  onSelectCategory: (category: GameDefinition["category"] | "all") => void;
  counts: Record<string, number>;
  searchQuery?: string;
}

const CATEGORIES: { id: GameDefinition["category"] | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "RPG", label: "RPG" },
  { id: "Action", label: "Action" },
  { id: "Racing", label: "Racing" },
  { id: "Strategy", label: "Strategy" },
  { id: "Arcade", label: "Arcade" },
];

/**
 * Mobile-only 3D Game Hub with tactile Deck of Cards physics.
 *
 * Upgrades:
 * 1. Infinite Fluid Swiping:
 *    - Uses stable refs to prevent timer cancellation across renders.
 *    - Card exits smoothly in an arc; cards underneath step forward in real time.
 * 2. High Inner Card Visibility (12-18% visible):
 *    - Card 1 (+34px, +5.5deg) and Card 2 (-34px, -5.5deg) fan out prominently.
 *    - Card 3 peeks at the top (-38px) showing deck thickness.
 * 3. 35-40% Height Increase for authentic TCG proportions.
 */
export function MobileGamesHub({
  games,
  art,
  characters,
  selectedCategory,
  onSelectCategory,
  counts,
  searchQuery,
}: MobileGamesHubProps) {
  // Top showcase features marquee games with cut-out character art & signature mechanics
  const featuredGames = useMemo(() => {
    const marqueeIds = [
      "fruit-fury",
      "typing-survivor",
      "ghost-racer",
      "card-battle",
      "boss-battle",
      "combo-rush",
    ];
    const marquee = games.filter((g) => marqueeIds.includes(g.id) && !g.upcoming);
    return marquee.length > 0 ? marquee : games.filter((g) => !g.upcoming).slice(0, 6);
  }, [games]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [swipingCard, setSwipingCard] = useState<{
    index: number;
    direction: "left" | "right";
  } | null>(null);

  // Stable refs to preserve state without causing timer cancellations
  const activeIndexRef = useRef(0);
  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  const isAnimatingRef = useRef(false);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const autoplayRef = useRef<NodeJS.Timeout | null>(null);
  const animTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Bottom filtered games list
  const bottomGames = useMemo(() => {
    let list = selectedCategory === "all" ? games : games.filter((g) => g.category === selectedCategory);
    const q = (searchQuery ?? "").trim().toLowerCase();
    if (q) {
      list = list.filter((g) => g.name.toLowerCase().includes(q) || g.tagline.toLowerCase().includes(q));
    }
    const filtered = [...list];
    filtered.sort((a, b) => Number(Boolean(a.upcoming)) - Number(Boolean(b.upcoming)));
    return filtered;
  }, [games, selectedCategory, searchQuery]);

  // Clean trigger for complete swipe transition (left or right)
  const triggerSwipe = useCallback(
    (direction: "left" | "right") => {
      if (isAnimatingRef.current) return;
      isAnimatingRef.current = true;

      const total = featuredGames.length;
      const currentIndex = activeIndexRef.current;
      const nextIndex =
        direction === "left"
          ? (currentIndex + 1) % total
          : (currentIndex - 1 + total) % total;

      setSwipingCard({ index: currentIndex, direction });
      setDragOffset({ x: 0, y: 0 });

      if (animTimerRef.current) clearTimeout(animTimerRef.current);
      animTimerRef.current = setTimeout(() => {
        setActiveIndex(nextIndex);
        activeIndexRef.current = nextIndex;
        setSwipingCard(null);
        isAnimatingRef.current = false;
        animTimerRef.current = null;
      }, 320);
    },
    [featuredGames.length],
  );

  // Autoplay top deck every 7.5 seconds, paused when interacting
  const resetAutoplay = useCallback(() => {
    if (autoplayRef.current) clearInterval(autoplayRef.current);
    autoplayRef.current = setInterval(() => {
      triggerSwipe("left");
    }, 7500);
  }, [triggerSwipe]);

  useEffect(() => {
    resetAutoplay();
    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
    };
  }, [resetAutoplay]);

  const handlePrev = useCallback(() => {
    triggerSwipe("right");
    resetAutoplay();
  }, [triggerSwipe, resetAutoplay]);

  const handleNext = useCallback(() => {
    triggerSwipe("left");
    resetAutoplay();
  }, [triggerSwipe, resetAutoplay]);

  // Touch Drag Handlers with Velocity & Complete Swiping
  const onTouchStart = (e: React.TouchEvent) => {
    if (isAnimatingRef.current) return;
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
    };
    setIsDragging(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current || isAnimatingRef.current) return;
    const dx = e.touches[0].clientX - touchStartRef.current.x;
    const dy = e.touches[0].clientY - touchStartRef.current.y;

    // Track horizontal drag with a slight vertical dampening
    if (Math.abs(dx) > Math.abs(dy)) {
      setDragOffset({ x: dx, y: dy * 0.2 });
    }
  };

  const onTouchEnd = () => {
    if (!touchStartRef.current || isAnimatingRef.current) return;
    const dx = dragOffset.x;
    const dt = Date.now() - touchStartRef.current.time;
    const velocity = Math.abs(dx) / (dt || 1);

    // If dragged past threshold or flicked quickly
    if (Math.abs(dx) > 55 || (Math.abs(dx) > 25 && velocity > 0.35)) {
      if (dx < 0) {
        triggerSwipe("left");
      } else {
        triggerSwipe("right");
      }
    } else {
      // Snap back to deck center with spring
      setDragOffset({ x: 0, y: 0 });
    }

    setIsDragging(false);
    touchStartRef.current = null;
    resetAutoplay();
  };

  return (
    <div className="flex flex-col gap-7 w-full max-w-full overflow-hidden pb-4">
      {/* ============================================================== */}
      {/* 1. TOP 3D DECK OF CARDS ("looks like a real deck of cards")     */}
      {/* ============================================================== */}
      <section className="relative flex flex-col items-center w-full">
        {/* Deck Header & Status */}
        <div className="flex items-center justify-between w-full px-4 mb-1.5">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 font-display text-[10px] font-black uppercase tracking-[0.25em] text-accent">
              <Sparkles size={12} className="animate-pulse" />
              Featured Deck
            </span>
            <span className="flex items-center gap-1 rounded-full bg-accent/15 border border-accent/30 px-2 py-0.5 font-mono text-[9px] text-accent">
              <Layers size={10} />
              {featuredGames.length} Cards
            </span>
          </div>
          <span className="font-mono text-[10px] text-sub tracking-wider">
            Card {String(activeIndex + 1).padStart(2, "0")} / {String(featuredGames.length).padStart(2, "0")}
          </span>
        </div>

        {/* 3D Deck Stage with touch-pan-y */}
        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          className="relative w-full h-[420px] flex items-center justify-center overflow-hidden py-3 select-none touch-pan-y"
          style={{
            perspective: "1200px",
            perspectiveOrigin: "center 48%",
          }}
        >
          {featuredGames.map((game, i) => {
            const total = featuredGames.length;
            // Native stack position relative to active card
            let stackPos = (i - activeIndex + total) % total;

            const isExiting = swipingCard?.index === i;
            const isTop = stackPos === 0 && !isExiting;

            // When a card is exiting, cards underneath smoothly step into their target position
            if (swipingCard !== null && !isExiting) {
              if (swipingCard.direction === "left") {
                stackPos = (stackPos - 1 + total) % total;
              } else {
                stackPos = (stackPos + 1) % total;
              }
            }

            const isSecond = stackPos === 1;
            const isThird = stackPos === 2;
            const isFourth = stackPos === 3;
            const isVisible = stackPos <= 3 || isExiting;

            // Physical Deck Stacking Geometry (inner cards show >12-18%)
            let transform = "";
            let zIndex = 1;
            let opacity = 0;
            let filter = "brightness(0.65)";

            if (isExiting) {
              // Visible complete swipe exit animation
              const exitX = swipingCard.direction === "left" ? -480 : 480;
              const exitRotate = swipingCard.direction === "left" ? -28 : 28;
              transform = `translate3d(${exitX}px, 20px, 0px) rotate(${exitRotate}deg) scale(0.9)`;
              zIndex = 35;
              opacity = 0;
              filter = "brightness(0.9)";
            } else if (isTop) {
              // Active top card on the deck: responds to drag gestures with tilt
              const tilt = dragOffset.x * 0.08;
              transform = `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0px) rotate(${tilt}deg) scale(1)`;
              zIndex = 30;
              opacity = 1;
              filter = "brightness(1)";
            } else if (isSecond) {
              // Peeking out on the RIGHT (+34px, +5.5deg, >12-15% visible)
              transform = "translate3d(34px, -16px, -35px) rotate(5.5deg) scale(0.96)";
              zIndex = 20;
              opacity = 0.95;
              filter = "brightness(0.88)";
            } else if (isThird) {
              // Peeking out on the LEFT (-34px, -5.5deg, >12-15% visible)
              transform = "translate3d(-34px, -28px, -70px) rotate(-5.5deg) scale(0.92)";
              zIndex = 10;
              opacity = 0.85;
              filter = "brightness(0.75)";
            } else if (isFourth) {
              // Visible TOP base of the deck (-38px above)
              transform = "translate3d(0px, -38px, -105px) rotate(0deg) scale(0.88)";
              zIndex = 5;
              opacity = 0.6;
              filter = "brightness(0.6)";
            } else {
              // Concealed behind the deck
              transform = "translate3d(0px, -48px, -140px) scale(0.82)";
              zIndex = 2;
              opacity = 0;
            }

            const coverArt = art[game.id];
            const charSprite = characters[game.id];

            return (
              <div
                key={game.id}
                onClick={() => {
                  if (isSecond) handleNext();
                  if (isThird) handlePrev();
                }}
                className={cn(
                  "absolute w-[285px] max-w-[84vw] h-[375px] rounded-2xl cursor-pointer",
                  "flex flex-col border",
                  isDragging && isTop
                    ? "transition-none"
                    : isExiting
                      ? "transition-all duration-300 ease-out will-change-transform"
                      : "transition-all duration-350 ease-out will-change-transform",
                  isTop && "neon-frame-strong shadow-[0_20px_50px_-10px_rgba(0,0,0,0.85)]",
                  !isTop && "border-border/80 shadow-[0_12px_28px_-6px_rgba(0,0,0,0.7)]",
                )}
                style={
                  {
                    "--accent": game.accent,
                    transform,
                    zIndex,
                    opacity,
                    filter,
                    transformStyle: "preserve-3d",
                    pointerEvents: isVisible && !isExiting ? "auto" : "none",
                    background:
                      "linear-gradient(175deg, color-mix(in srgb, var(--accent) 18%, var(--background)) 0%, var(--background) 55%, color-mix(in srgb, var(--accent) 10%, var(--background)) 100%)",
                  } as React.CSSProperties
                }
              >
                {/* Physical Card Border & Top Deck Header */}
                <div className="relative flex items-center justify-between px-3 py-2 z-20 border-b border-border/40 bg-background/50 backdrop-blur-xs rounded-t-2xl">
                  {/* Category Gem / Badge */}
                  <span className="flex items-center gap-1.5 rounded-full bg-accent/20 border border-accent/50 px-2.5 py-0.5 font-display text-[9px] font-black uppercase tracking-wider text-accent shadow">
                    <Crown size={10} />
                    {game.category}
                  </span>

                  {/* Energy / Lives Indicator */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(game.lives, 3) }).map((_, idx) => (
                      <Heart
                        key={idx}
                        size={11}
                        className="text-accent fill-accent"
                      />
                    ))}
                    <span className="font-mono text-[9px] text-sub ml-1">
                      {game.duration}
                    </span>
                  </div>
                </div>

                {/* Card Artwork Window (Expanded ~40% for rich visuals) */}
                <div className="relative h-[195px] w-full overflow-hidden bg-background">
                  {coverArt && (
                    <Image
                      src={coverArt}
                      alt={game.name}
                      fill
                      priority={i < 2}
                      sizes="(max-width: 640px) 84vw, 300px"
                      className="object-cover"
                    />
                  )}
                  {/* Cinematic Depth Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/25 to-transparent" />
                  <div
                    className="absolute inset-0 opacity-45"
                    style={{
                      background:
                        "radial-gradient(circle at 50% 100%, var(--accent) 0%, transparent 65%)",
                    }}
                  />

                  {/* 3D Character Cutout: Breaks the artwork frame with dramatic pop-out */}
                  {charSprite && (
                    <div
                      aria-hidden="true"
                      className={cn(
                        "pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 z-20 h-[190px]",
                        "transition-transform duration-500",
                        isTop ? "scale-105" : "scale-90 opacity-75",
                      )}
                    >
                      <Image
                        src={charSprite}
                        alt=""
                        width={300}
                        height={600}
                        sizes="200px"
                        className="h-full w-auto object-contain object-bottom"
                        style={{
                          filter: isTop
                            ? "drop-shadow(0 14px 28px color-mix(in srgb, var(--accent) 70%, transparent))"
                            : "drop-shadow(0 4px 10px rgba(0,0,0,0.7))",
                        }}
                      />
                    </div>
                  )}

                  {/* Corner Sigil Accents */}
                  <div className="neon-corners absolute inset-0 pointer-events-none" />
                </div>

                {/* Card Body: Title, Pitch, Stats & CTA Button */}
                <div className="relative flex flex-1 flex-col justify-between p-3 z-20">
                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="font-display text-base font-black uppercase leading-tight tracking-wider text-foreground truncate">
                        {game.name}
                      </h3>
                      <GameBestBadge definition={game} />
                    </div>

                    {/* Card Description Plaque */}
                    <p className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-sub bg-background/60 border border-border/50 rounded-lg p-1.5 backdrop-blur-xs">
                      {game.pitch || game.tagline}
                    </p>
                  </div>

                  {/* Deal In / Play CTA */}
                  <div className="pt-2">
                    <Link
                      href={`/games/${game.id}`}
                      className={cn(
                        "btn-chevron flex h-10 w-full items-center justify-center gap-2",
                        "bg-accent font-display text-[11px] font-black uppercase tracking-[0.16em] text-background",
                        "transition-all duration-200 active:scale-95 shadow-lg",
                      )}
                      style={{
                        filter:
                          "drop-shadow(0 0 14px color-mix(in srgb, var(--accent) 75%, transparent))",
                      }}
                    >
                      <Play size={11} aria-hidden="true" className="fill-current" />
                      Play Adventure
                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Quick Chevrons for Deck Flipping */}
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous card in deck"
            className="absolute left-1.5 z-40 p-2 rounded-full bg-background/85 border border-border/80 text-sub shadow-lg backdrop-blur-sm active:scale-90 transition-transform"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next card in deck"
            className="absolute right-1.5 z-40 p-2 rounded-full bg-background/85 border border-border/80 text-sub shadow-lg backdrop-blur-sm active:scale-90 transition-transform"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Deck Navigation Indicator Pills */}
        <div className="flex items-center justify-center gap-1.5 pt-1">
          {featuredGames.map((g, idx) => (
            <button
              key={g.id}
              type="button"
              onClick={() => {
                if (idx > activeIndex) {
                  triggerSwipe("left");
                } else if (idx < activeIndex) {
                  triggerSwipe("right");
                }
                resetAutoplay();
              }}
              aria-label={`Go to ${g.name}`}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                idx === activeIndex
                  ? "w-7 bg-accent shadow-[0_0_10px_var(--accent)]"
                  : "w-1.5 bg-border/80 hover:bg-sub",
              )}
            />
          ))}
        </div>
      </section>

      {/* ============================================================== */}
      {/* 2. BOTTOM HORIZONTAL RAIL ("cards height increased ~35%")       */}
      {/* ============================================================== */}
      <section className="flex flex-col w-full gap-3">
        {/* Section Heading & Category Filter Strip */}
        <div className="flex flex-col gap-2 px-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 font-display text-xs font-black uppercase tracking-[0.2em] text-foreground">
              <Gamepad2 size={13} className="text-accent" />
              Explore All Games
            </h2>
            <span className="font-mono text-[10px] uppercase text-sub tracking-wider">
              {bottomGames.length} Available
            </span>
          </div>

          {/* Category Filter Pills (Horizontal Scroll) */}
          <div
            role="tablist"
            aria-label="Filter games by category"
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-4 px-4"
          >
            {CATEGORIES.filter((t) => t.id === "all" || counts[t.id]).map((tab) => {
              const active = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onSelectCategory(tab.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5",
                    "font-display text-[10px] uppercase tracking-wider transition-all duration-200 active:scale-95",
                    active
                      ? "border-accent bg-accent/20 text-accent shadow-[0_0_12px_-3px_var(--accent)]"
                      : "border-border/70 bg-sub-alt/50 text-sub",
                  )}
                >
                  {tab.label}
                  <span
                    className={cn(
                      "rounded px-1.5 font-mono text-[9px]",
                      active ? "bg-accent/30 text-accent" : "bg-border/50 text-sub",
                    )}
                  >
                    {counts[tab.id] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Horizontal Scrolling Card Track (Cards ~35% taller: 320px high) */}
        <div
          className="flex gap-3.5 overflow-x-auto snap-x snap-mandatory px-4 pb-4 pt-1 no-scrollbar"
          style={{
            WebkitOverflowScrolling: "touch",
            scrollSnapType: "x mandatory",
          }}
        >
          {bottomGames.map((game, i) => {
            const coverArt = art[game.id];
            const charSprite = characters[game.id];

            return (
              <div
                key={game.id}
                className={cn(
                  "group/mini snap-start shrink-0 w-[195px] h-[320px] relative flex flex-col rounded-2xl overflow-hidden",
                  "border border-border/80 bg-sub-alt/45 transition-all duration-200",
                  "active:scale-[0.98] hover:border-accent/70 shadow-xl",
                )}
                style={
                  {
                    "--accent": game.accent,
                    boxShadow: "0 8px 24px -5px rgba(0,0,0,0.6)",
                  } as React.CSSProperties
                }
              >
                {/* Artwork Top Half (165px tall) */}
                <div className="relative h-[165px] w-full shrink-0 overflow-hidden bg-background">
                  {coverArt && (
                    <Image
                      src={coverArt}
                      alt={game.name}
                      fill
                      priority={i < 3}
                      sizes="195px"
                      className="object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/25 to-transparent" />

                  {/* Character sprite overlay if available */}
                  {charSprite && (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 h-[140px] z-10"
                    >
                      <Image
                        src={charSprite}
                        alt=""
                        width={200}
                        height={400}
                        sizes="140px"
                        className="h-full w-auto object-contain object-bottom"
                        style={{
                          filter:
                            "drop-shadow(0 6px 14px color-mix(in srgb, var(--accent) 55%, transparent))",
                        }}
                      />
                    </div>
                  )}

                  {/* Category Pill */}
                  {game.upcoming ? (
                    <span className="absolute top-2.5 left-2.5 z-20 rounded bg-amber-500/20 border border-amber-500/50 px-2 py-0.5 font-display text-[8px] font-bold uppercase tracking-wider text-amber-300 backdrop-blur-xs shadow">
                      Upcoming
                    </span>
                  ) : (
                    <span className="absolute top-2.5 left-2.5 z-20 rounded bg-background/85 border border-border/70 px-2 py-0.5 font-display text-[8px] font-bold uppercase tracking-wider text-accent backdrop-blur-xs">
                      {game.category}
                    </span>
                  )}

                  {/* Duration */}
                  <span className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1 rounded bg-background/85 px-1.5 py-0.5 font-mono text-[8px] text-sub backdrop-blur-xs">
                    <Clock size={9} />
                    {game.duration}
                  </span>
                </div>

                {/* Content Bottom Half (155px) */}
                <div className="flex flex-1 flex-col justify-between p-3 z-20">
                  <div className="min-w-0">
                    <h3 className="font-display text-sm font-black uppercase tracking-tight text-foreground truncate group-hover/mini:text-accent transition-colors">
                      {game.name}
                    </h3>
                    <p className="mt-1 line-clamp-2 font-sans text-[11px] text-sub leading-snug">
                      {game.tagline}
                    </p>
                  </div>

                  {/* Bottom Stats & Play CTA */}
                  <div className="flex flex-col gap-2 pt-2 border-t border-border/40">
                    <div className="flex items-center justify-between text-[9px] font-mono text-sub">
                      <span className="flex items-center gap-1 text-accent truncate">
                        <Trophy size={10} />
                        <span className="text-foreground font-bold">
                          {game.scoreBy === "time" ? "Survive" : game.scoreBy === "wpm" ? "WPM" : "Points"}
                        </span>
                      </span>
                      <GameBestBadge definition={game} />
                    </div>

                    {game.upcoming ? (
                      <div
                        className={cn(
                          "flex h-8 w-full items-center justify-center gap-1.5 rounded-lg select-none",
                          "bg-sub-alt/40 border border-border/60 font-display text-[10px] font-bold uppercase tracking-wider text-sub cursor-not-allowed",
                        )}
                      >
                        <Clock size={10} />
                        Upcoming
                      </div>
                    ) : (
                      <Link
                        href={`/games/${game.id}`}
                        className={cn(
                          "flex h-8 w-full items-center justify-center gap-1.5 rounded-lg",
                          "bg-accent/20 border border-accent/40 font-display text-[10px] font-bold uppercase tracking-wider text-accent",
                          "transition-all duration-200 active:scale-95 hover:bg-accent hover:text-background",
                        )}
                      >
                        <Play size={10} className="fill-current" />
                        Play Game
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty Search Fallback */}
        {bottomGames.length === 0 && (
          <div className="py-8 text-center px-4">
            <p className="font-mono text-xs text-sub">
              No games found in {selectedCategory}.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
