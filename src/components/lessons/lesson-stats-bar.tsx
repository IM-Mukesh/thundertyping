"use client";

import { Clock, Star, Target, Zap } from "lucide-react";
import { useLessonProgressStore } from "@/lib/lessons/lesson-progress-store";
import { calculateAccuracy, calculateNetWpm, round } from "@/lib/typing-engine/stats";

function formatTotalTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${totalSeconds % 60}s`;
  return `${totalSeconds}s`;
}

/** Four aggregate tiles across every lesson attempt ever recorded -- speed, accuracy, stars, and time. */
export function LessonStatsBar() {
  const totals = useLessonProgressStore((s) => s.totals);
  const units = useLessonProgressStore((s) => s.units);

  const avgWpm = round(calculateNetWpm(totals.correctChars, totals.timeMs));
  const avgAccuracy = round(calculateAccuracy(totals.correctChars, totals.incorrectChars));
  const hasData = totals.timeMs > 0;
  const totalStars = Object.values(units).reduce((acc, u) => acc + (u.bestStars ?? (u.completed ? 3 : 0)), 0);
  const maxStars = 28 * 5;

  return (
    <div className="theme-transition grid w-full grid-cols-2 gap-2 rounded-xl border border-border/60 bg-sub-alt/20 p-3 sm:grid-cols-4 sm:gap-4 sm:p-4">
      <Tile icon={<Zap size={14} />} label="Aggregate speed" value={hasData ? `${avgWpm} wpm` : "—"} />
      <Tile icon={<Target size={14} />} label="Overall accuracy" value={hasData ? `${avgAccuracy}%` : "—"} />
      <Tile icon={<Star size={14} />} label="Stars earned" value={hasData || totalStars > 0 ? `${totalStars} / ${maxStars}` : "—"} />
      <Tile icon={<Clock size={14} />} label="Practice time" value={hasData ? formatTotalTime(totals.timeMs) : "—"} />
    </div>
  );
}

function Tile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 text-center sm:flex-row sm:items-center sm:gap-2 sm:text-left">
      <span className="text-accent">{icon}</span>
      <div className="min-w-0">
        <div className="font-display text-base font-bold text-foreground sm:text-lg">{value}</div>
        <div className="truncate font-display text-[9px] uppercase tracking-wider text-sub sm:text-[10px]">{label}</div>
      </div>
    </div>
  );
}
