/**
 * Formats countdown seconds for live test display:
 * - under 60 seconds: "0s", "1s", "59s"
 * - 60 seconds to 3599 seconds: "1:00", "1:05", "9:59", "10:00"
 * - 3600 seconds (1 hour) and above: "1:00:00", "1:02:03", "24:00:00"
 */
export function formatCountdown(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));

  if (safeSeconds < 60) {
    return `${safeSeconds}s`;
  }

  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;

  const paddedSeconds = remainingSeconds.toString().padStart(2, "0");

  if (hours > 0) {
    const paddedMinutes = minutes.toString().padStart(2, "0");
    return `${hours}:${paddedMinutes}:${paddedSeconds}`;
  }

  return `${minutes}:${paddedSeconds}`;
}
