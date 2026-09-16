"use client";

/**
 * Volume controls, and the bridge that pushes them into the mixer.
 *
 * The audio bus is a plain module, not React state, so somebody has to carry
 * the stored preference into it. That happens here in one place rather than in
 * each game, because four copies of the same effect would drift and a slider
 * that only reached one game's audio would read as broken.
 */

import { useEffect } from "react";
import { Music, Volume2, VolumeX } from "lucide-react";
import { setVolume } from "@/lib/audio/audio-bus";
import { useSettingsStore } from "@/lib/persistence/settings-store";

/**
 * Applies stored volumes to the mixer. Render once, high in the tree.
 * Renders nothing.
 */
export function AudioVolumeBridge() {
  const musicVolume = useSettingsStore((s) => s.musicVolume);
  const sfxVolume = useSettingsStore((s) => s.sfxVolume);
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);

  useEffect(() => {
    // Muting zeroes the master rather than the individual buses, so unmuting
    // restores both at their own levels instead of a remembered blend.
    setVolume("master", soundEnabled ? 1 : 0);
    setVolume("music", musicVolume);
    setVolume("sfx", sfxVolume);
  }, [musicVolume, sfxVolume, soundEnabled]);

  return null;
}

export function AudioSettings({ compact }: { compact?: boolean }) {
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const toggleSound = useSettingsStore((s) => s.toggleSound);
  const musicVolume = useSettingsStore((s) => s.musicVolume);
  const sfxVolume = useSettingsStore((s) => s.sfxVolume);
  const setMusicVolume = useSettingsStore((s) => s.setMusicVolume);
  const setSfxVolume = useSettingsStore((s) => s.setSfxVolume);

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={toggleSound}
        aria-pressed={soundEnabled}
        className="flex min-h-11 w-fit items-center gap-2 rounded-lg border border-border px-3 font-mono text-xs text-sub transition-colors hover:border-accent hover:text-foreground"
      >
        {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
        {soundEnabled ? "Sound on" : "Sound off"}
      </button>

      <Slider
        icon={<Music size={13} />}
        label="Music"
        value={musicVolume}
        onChange={setMusicVolume}
        disabled={!soundEnabled}
        compact={compact}
      />
      <Slider
        icon={<Volume2 size={13} />}
        label="Effects"
        value={sfxVolume}
        onChange={setSfxVolume}
        disabled={!soundEnabled}
        compact={compact}
      />
    </div>
  );
}

function Slider({
  icon,
  label,
  value,
  onChange,
  disabled,
  compact,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  const pct = Math.round(value * 100);
  return (
    <label
      className={`flex items-center gap-3 font-mono text-xs ${disabled ? "opacity-50" : ""}`}
    >
      <span className="flex w-20 shrink-0 items-center gap-1.5 text-sub">
        <span className="text-accent">{icon}</span>
        {label}
      </span>
      <input
        type="range"
        min={0}
        max={100}
        value={pct}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        // A range input is already a 44px-tall target on touch; the accent
        // colour comes from the theme rather than a custom track so it stays
        // correct in all five.
        className={`h-11 flex-1 accent-[var(--accent)] ${compact ? "max-w-[180px]" : "max-w-xs"}`}
        aria-label={`${label} volume`}
      />
      <span className="w-9 shrink-0 text-right tabular-nums text-sub">{pct}%</span>
    </label>
  );
}
