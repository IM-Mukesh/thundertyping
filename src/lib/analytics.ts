import { GA_MEASUREMENT_ID } from "@/lib/analytics/constants";

export { GA_MEASUREMENT_ID };

export type AnalyticsEventName =
  | "typing_test_started"
  | "typing_test_completed"
  | "lesson_started"
  | "lesson_completed"
  | "practice_started"
  | "practice_completed"
  | "game_started"
  | "game_completed"
  | "placement_started"
  | "placement_completed";

export interface TypingTestStartedParams {
  test_mode: string;
  test_duration?: number;
  word_count?: number;
  quote_length?: string;
  difficulty?: string;
  punctuation: boolean;
  numbers: boolean;
}

export interface TypingTestCompletedParams {
  test_mode: string;
  test_duration?: number;
  wpm: number;
  accuracy: number;
  gross_wpm: number;
  correct_chars: number;
  incorrect_chars: number;
  duration_ms: number;
}

export interface LessonStartedParams {
  lesson_id: string;
  lesson_title: string;
  lesson_number: number;
  tier: string;
  stage: string;
}

export interface LessonCompletedParams {
  lesson_id: string;
  lesson_title: string;
  lesson_number: number;
  tier: string;
  stage: string;
  wpm: number;
  accuracy: number;
  duration_ms: number;
  steps: number;
}

export interface PracticeStartedParams {
  practice_type: "weak_keys" | "general";
  target_keys_count: number;
}

export interface PracticeCompletedParams {
  practice_type: "weak_keys" | "general";
  wpm: number;
  accuracy: number;
  duration_ms: number;
}

export interface GameStartedParams {
  game_id: string;
  game_name: string;
}

export interface GameCompletedParams {
  game_id: string;
  game_name: string;
  score: number;
  duration_ms: number;
  result?: string;
}

export interface PlacementStartedParams {
  assessment_type: "typing_placement";
}

export interface PlacementCompletedParams {
  assessment_type: "typing_placement";
  wpm: number;
  accuracy: number;
  suggested_lesson_id: string;
  suggested_stage: string;
}

export interface AnalyticsEventParamsMap {
  typing_test_started: TypingTestStartedParams;
  typing_test_completed: TypingTestCompletedParams;
  lesson_started: LessonStartedParams;
  lesson_completed: LessonCompletedParams;
  practice_started: PracticeStartedParams;
  practice_completed: PracticeCompletedParams;
  game_started: GameStartedParams;
  game_completed: GameCompletedParams;
  placement_started: PlacementStartedParams;
  placement_completed: PlacementCompletedParams;
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/**
 * Dispatches an event to GA4 via window.gtag if available.
 * Fails safely on SSR, during static export, when adblockers block GA4,
 * or in non-production environments where GA4 is not mounted.
 */
export function trackEvent<K extends AnalyticsEventName>(
  name: K,
  params: AnalyticsEventParamsMap[K],
): void {
  if (typeof window === "undefined") return;

  try {
    if (typeof window.gtag === "function") {
      window.gtag("event", name, params);
    } else if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push(["event", name, params]);
    }
  } catch {
    // Fail silently so analytics operations never disrupt core typing or learning flows
  }
}
