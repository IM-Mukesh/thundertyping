/**
 * Mirrors the signed-in user id outside React, so plain persistence modules
 * (results-store, game-scores, lesson-progress-store) can decide "local vs
 * cloud" synchronously without needing a hook. Kept in sync by AuthProvider.
 */
let currentUserId: string | null = null;
let authGeneration = 0;
const listeners = new Set<() => void>();

export function setCurrentUserId(id: string | null): void {
  const changed = id !== currentUserId;
  if (changed) authGeneration += 1;
  currentUserId = id;
  if (changed) for (const listener of listeners) listener();
}

export function subscribeCurrentUser(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function accountStorageKey(key: string): string {
  return currentUserId ? `${key}:account:${currentUserId}` : key;
}

export function getCurrentUserId(): string | null {
  return currentUserId;
}

export function getAuthGeneration(): number {
  return authGeneration;
}
