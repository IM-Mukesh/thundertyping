/** Keep faster trailing targets behind the one ahead; never draw crossed labels. */
export function advanceLaneTargets<T extends { lane: number; progress: number }>(
  targets: readonly T[], advance: (target: T) => number, gap: number,
): T[] {
  const positions = new Map<T, number>();
  const frontByLane = new Map<number, number>();
  for (const target of [...targets].sort((a, b) => b.progress - a.progress)) {
    const ahead = frontByLane.get(target.lane);
    const desired = advance(target);
    const progress = ahead === undefined ? desired : Math.max(target.progress, Math.min(desired, ahead - gap));
    positions.set(target, progress);
    frontByLane.set(target.lane, progress);
  }
  return targets.map((target) => ({ ...target, progress: positions.get(target)! }));
}

export function availableWord(candidates: readonly string[], used: ReadonlySet<string>): string | undefined {
  return candidates.find((word) => !used.has(word));
}

/** Reserve space for HUD/input instead of forcing a 260px board above the keyboard. */
export function safeGameBoardHeight(visibleHeight: number, keyboardOpen: boolean, mobile: boolean): number {
  if (keyboardOpen) return Math.max(96, Math.min(visibleHeight - 180, 420));
  return mobile ? Math.min(Math.max(visibleHeight * 0.65, 260), 560) : 540;
}
