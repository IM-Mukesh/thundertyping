/**
 * Mirrors the signed-in user id outside React, so plain persistence modules
 * (results-store, game-scores, lesson-progress-store) can decide "local vs
 * cloud" synchronously without needing a hook. Kept in sync by AuthProvider.
 */
let currentUserId: string | null = null;
let authGeneration = 0;

export function setCurrentUserId(id: string | null): void {
  if (id !== currentUserId) authGeneration += 1;
  currentUserId = id;
}

export function getCurrentUserId(): string | null {
  return currentUserId;
}

export function getAuthGeneration(): number {
  return authGeneration;
}
