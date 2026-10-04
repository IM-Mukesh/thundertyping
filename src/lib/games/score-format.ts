import type { GameDefinition } from "@/lib/games/game-types";

export function gameScoreUnit(game: Pick<GameDefinition, "scoreBy">): string {
  return game.scoreBy === "time" ? "s" : game.scoreBy === "wpm" ? " WPM" : "";
}

export function formatGameScore(game: Pick<GameDefinition, "scoreBy">, score: number): string {
  return `${score.toLocaleString()}${gameScoreUnit(game)}`;
}
