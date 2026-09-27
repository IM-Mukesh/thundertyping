# HeroTyping Analytics & GA4 Event Architecture

## Overview
HeroTyping uses Google Analytics 4 (GA4) loaded via `@next/third-parties/google` in production (`G-B2ERW6CCVL`). The analytics event layer is implemented in [`src/lib/analytics.ts`](file:///home/mukesh-kumar/Desktop/Mission%202026/thundertyping/src/lib/analytics.ts).

All events are type-safe, SSR-safe, and fail silently in development or when blocked by privacy tools.

---

## Product Funnels & Events

| Event Name | Trigger | Key Parameters | Recommended GA4 Key Event? |
|---|---|---|:---:|
| `typing_test_started` | User presses first character of a typing test (`running` status) | `test_mode`, `test_duration`, `word_count`, `punctuation`, `numbers` | No |
| `typing_test_completed` | Typing test reaches end boundary or time expires | `test_mode`, `wpm`, `accuracy`, `gross_wpm`, `correct_chars`, `incorrect_chars`, `duration_ms` | **YES** |
| `lesson_started` | User begins typing their first step in a lesson | `lesson_id`, `lesson_title`, `lesson_number`, `tier`, `stage` | No |
| `lesson_completed` | User successfully clears the final step of a lesson | `lesson_id`, `lesson_title`, `lesson_number`, `tier`, `stage`, `wpm`, `accuracy`, `duration_ms`, `steps` | **YES** |
| `practice_started` | User begins typing a weak-key practice session | `practice_type`, `target_keys_count` | No |
| `practice_completed` | User clears the practice word stream | `practice_type`, `wpm`, `accuracy`, `duration_ms` | **YES** |
| `game_started` | Player clicks "Start Game" / "Begin Race" / selects deck | `game_id`, `game_name` | No |
| `game_completed` | Game over or victory screen is reached | `game_id`, `game_name`, `score`, `duration_ms`, `result` | **YES** |
| `placement_started` | User begins typing in the skill placement modal | `assessment_type` | No |
| `placement_completed` | 16-word assessment completes and recommendation is shown | `assessment_type`, `wpm`, `accuracy`, `suggested_lesson_id`, `suggested_stage` | No |

---

## Recommended GA4 Key Event Configuration

In Google Analytics 4:
1. Navigate to **Admin** $\rightarrow$ **Data display** $\rightarrow$ **Events**.
2. Locate or create the following events once data begins flowing:
   - `lesson_completed`
   - `typing_test_completed`
   - `practice_completed`
   - `game_completed`
3. Toggle the **Mark as key event** switch for these 4 completion events.
4. *Note:* Start events (`*_started`) represent the top of the funnel and should remain standard events rather than Key events.

---

## Privacy & Safety Disclosures
- **No PII:** No names, emails, IPs, account IDs, or locations are collected.
- **No Keystroke Logging:** Neither raw keystrokes nor typed text are ever transmitted to GA4. Only aggregate numerical metrics (`wpm`, `accuracy`, `score`, `duration_ms`) are included in event parameters.
- **Production Isolation:** In development (`NODE_ENV !== "production"`), `@next/third-parties/google` is not mounted, preventing dev traffic from polluting real visitor statistics.
