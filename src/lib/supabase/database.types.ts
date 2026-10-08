export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      languages: {
        Row: { id: string; code: string; name: string; native_name: string; direction: string | null; enabled: boolean | null; sort_order: number | null; created_at: string; updated_at: string; };
        Insert: { id?: string; code: string; name: string; native_name: string; direction?: string | null; enabled?: boolean | null; sort_order?: number | null; created_at?: string; updated_at?: string; };
        Update: { id?: string; code?: string; name?: string; native_name?: string; direction?: string | null; enabled?: boolean | null; sort_order?: number | null; created_at?: string; updated_at?: string; };
        Relationships: [];
      };
      vocabulary_items: {
        Row: { id: string; language_code: string; word: string; normalized_word: string; difficulty: string; category: string | null; frequency_rank: number | null; part_of_speech: string | null; meaning: string | null; example: string | null; status: string | null; content_version: number | null; created_at: string; updated_at: string; };
        Insert: { id?: string; language_code: string; word: string; normalized_word: string; difficulty: string; category?: string | null; frequency_rank?: number | null; part_of_speech?: string | null; meaning?: string | null; example?: string | null; status?: string | null; content_version?: number | null; created_at?: string; updated_at?: string; };
        Update: { id?: string; language_code?: string; word?: string; normalized_word?: string; difficulty?: string; category?: string | null; frequency_rank?: number | null; part_of_speech?: string | null; meaning?: string | null; example?: string | null; status?: string | null; content_version?: number | null; created_at?: string; updated_at?: string; };
        Relationships: [];
      };
      typing_texts: {
        Row: { id: string; language_code: string; content_type: string; difficulty: string | null; text: string; normalized_text: string; word_count: number; char_count: number; source: string | null; category: string | null; status: string | null; content_version: number | null; created_at: string; };
        Insert: { id?: string; language_code: string; content_type: string; difficulty?: string | null; text: string; normalized_text: string; word_count: number; char_count: number; source?: string | null; category?: string | null; status?: string | null; content_version?: number | null; created_at?: string; };
        Update: { id?: string; language_code?: string; content_type?: string; difficulty?: string | null; text?: string; normalized_text?: string; word_count?: number; char_count?: number; source?: string | null; category?: string | null; status?: string | null; content_version?: number | null; created_at?: string; };
        Relationships: [];
      };
      quotes: {
        Row: { id: string; language_code: string; text: string; author: string; source: string | null; difficulty: string | null; status: string | null; created_at: string; };
        Insert: { id?: string; language_code: string; text: string; author: string; source?: string | null; difficulty?: string | null; status?: string | null; created_at?: string; };
        Update: { id?: string; language_code?: string; text?: string; author?: string; source?: string | null; difficulty?: string | null; status?: string | null; created_at?: string; };
        Relationships: [];
      };
      guides: {
        Row: { id: string; guide_key: string; language_code: string; slug: string; title: string; description: string; content: string; excerpt: string | null; category: string | null; author: string | null; published_at: string | null; updated_at: string; status: string | null; };
        Insert: { id?: string; guide_key: string; language_code: string; slug: string; title: string; description: string; content: string; excerpt?: string | null; category?: string | null; author?: string | null; published_at?: string | null; updated_at?: string; status?: string | null; };
        Update: { id?: string; guide_key?: string; language_code?: string; slug?: string; title?: string; description?: string; content?: string; excerpt?: string | null; category?: string | null; author?: string | null; published_at?: string | null; updated_at?: string; status?: string | null; };
        Relationships: [];
      };
      lessons: {
        Row: { id: string; lesson_key: string; language_code: string; title: string; description: string | null; order_index: number; difficulty: string | null; tier: string | null; stage: string | null; new_keys: string[] | null; instructions: string[] | null; min_accuracy: number | null; status: string | null; content_version: number | null; };
        Insert: { id?: string; lesson_key: string; language_code: string; title: string; description?: string | null; order_index: number; difficulty?: string | null; tier?: string | null; stage?: string | null; new_keys?: string[] | null; instructions?: string[] | null; min_accuracy?: number | null; status?: string | null; content_version?: number | null; };
        Update: { id?: string; lesson_key?: string; language_code?: string; title?: string; description?: string | null; order_index?: number; difficulty?: string | null; tier?: string | null; stage?: string | null; new_keys?: string[] | null; instructions?: string[] | null; min_accuracy?: number | null; status?: string | null; content_version?: number | null; };
        Relationships: [];
      };
      lesson_steps: {
        Row: { id: string; lesson_id: string; step_order: number; practice_type: string; target_text: string | null; target_keys: string[] | null; word_count: number | null; numbers: boolean | null; advanced_mode: string | null; };
        Insert: { id?: string; lesson_id: string; step_order: number; practice_type: string; target_text?: string | null; target_keys?: string[] | null; word_count?: number | null; numbers?: boolean | null; advanced_mode?: string | null; };
        Update: { id?: string; lesson_id?: string; step_order?: number; practice_type?: string; target_text?: string | null; target_keys?: string[] | null; word_count?: number | null; numbers?: boolean | null; advanced_mode?: string | null; };
        Relationships: [];
      };

      profiles: {
        Row: {
          id: string;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_preferences: {
        Row: {
          user_id: string;
          theme: string;
          sound_enabled: boolean;
          sound_volume: number;
          keyboard_layout: string;
          confidence_mode: string;
          quick_restart: string;
          smooth_caret: string;
          font_size: string;
          font_family: string;
          default_test_mode: string;
          default_test_duration: number;
          punctuation: boolean;
          numbers: boolean;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          theme?: string;
          sound_enabled?: boolean;
          sound_volume?: number;
          keyboard_layout?: string;
          confidence_mode?: string;
          quick_restart?: string;
          smooth_caret?: string;
          font_size?: string;
          font_family?: string;
          default_test_mode?: string;
          default_test_duration?: number;
          punctuation?: boolean;
          numbers?: boolean;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          theme?: string;
          sound_enabled?: boolean;
          sound_volume?: number;
          keyboard_layout?: string;
          confidence_mode?: string;
          quick_restart?: string;
          smooth_caret?: string;
          font_size?: string;
          font_family?: string;
          default_test_mode?: string;
          default_test_duration?: number;
          punctuation?: boolean;
          numbers?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      player_streaks: {
        Row: {
          user_id: string;
          current_streak: number;
          longest_streak: number;
          last_active_date: string | null;
          total_xp: number;
          level: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          current_streak?: number;
          longest_streak?: number;
          last_active_date?: string | null;
          total_xp?: number;
          level?: number;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          current_streak?: number;
          longest_streak?: number;
          last_active_date?: string | null;
          total_xp?: number;
          level?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      lesson_progress: {
        Row: { language_code: string; id: string;
          user_id: string;
          lesson_id: string;
          completed: boolean;
          stars: number;
          best_wpm: number;
          best_accuracy: number;
          attempt_count: number;
          current_step: number;
          pass_count: number;
          avg_wpm: number;
          avg_accuracy: number;
          total_time_ms: number;
          completed_at: string | null;
          last_attempt_at: string | null;
          typed_chars: number;
          correct_chars: number;
          incorrect_chars: number;
          created_at: string;
          updated_at: string; };
        Insert: { language_code?: string; id?: string;
          user_id: string;
          lesson_id: string;
          completed?: boolean;
          stars?: number;
          best_wpm?: number;
          best_accuracy?: number;
          attempt_count?: number;
          current_step?: number;
          pass_count?: number;
          avg_wpm?: number;
          avg_accuracy?: number;
          total_time_ms?: number;
          completed_at?: string | null;
          last_attempt_at?: string | null;
          typed_chars?: number;
          correct_chars?: number;
          incorrect_chars?: number;
          created_at?: string;
          updated_at?: string; };
        Update: { language_code?: string; id?: string;
          user_id?: string;
          lesson_id?: string;
          completed?: boolean;
          stars?: number;
          best_wpm?: number;
          best_accuracy?: number;
          attempt_count?: number;
          current_step?: number;
          pass_count?: number;
          avg_wpm?: number;
          avg_accuracy?: number;
          total_time_ms?: number;
          completed_at?: string | null;
          last_attempt_at?: string | null;
          typed_chars?: number;
          correct_chars?: number;
          incorrect_chars?: number;
          created_at?: string;
          updated_at?: string; };
        Relationships: [];
      };
      lesson_attempts: {
        Row: { language_code: string; id: string;
          user_id: string;
          lesson_id: string;
          wpm: number;
          raw_wpm: number | null;
          accuracy: number;
          stars: number;
          completed: boolean;
          created_at: string; };
        Insert: { language_code?: string; id?: string;
          user_id: string;
          lesson_id: string;
          wpm: number;
          raw_wpm?: number | null;
          accuracy: number;
          stars: number;
          completed?: boolean;
          created_at?: string; };
        Update: { language_code?: string; id?: string;
          user_id?: string;
          lesson_id?: string;
          wpm?: number;
          raw_wpm?: number | null;
          accuracy?: number;
          stars?: number;
          completed?: boolean;
          created_at?: string; };
        Relationships: [];
      };
      typing_results: {
        Row: { language_code: string; id: string;
          user_id: string;
          mode: string;
          duration: number;
          wpm: number;
          raw_wpm: number | null;
          accuracy: number;
          consistency: number | null;
          correct_chars: number;
          incorrect_chars: number;
          extra_chars: number;
          missed_chars: number;
          param: string | null;
          punctuation: boolean;
          numbers: boolean;
          created_at: string; };
        Insert: { language_code?: string; id?: string;
          user_id: string;
          mode: string;
          duration: number;
          wpm: number;
          raw_wpm?: number | null;
          accuracy: number;
          consistency?: number | null;
          correct_chars?: number;
          incorrect_chars?: number;
          extra_chars?: number;
          missed_chars?: number;
          param?: string | null;
          punctuation?: boolean;
          numbers?: boolean;
          created_at?: string; };
        Update: { language_code?: string; id?: string;
          user_id?: string;
          mode?: string;
          duration?: number;
          wpm?: number;
          raw_wpm?: number | null;
          accuracy?: number;
          consistency?: number | null;
          correct_chars?: number;
          incorrect_chars?: number;
          extra_chars?: number;
          missed_chars?: number;
          param?: string | null;
          punctuation?: boolean;
          numbers?: boolean;
          created_at?: string; };
        Relationships: [];
      };
      game_scores: {
        Row: {
          metadata: Json;
          id: string;
          user_id: string;
          game_id: string;
          variant: string;
          settlement_version: number;
          earned_xp: number | null;
          score: number;
          cleared: number;
          best_combo: number;
          survived_ms: number;
          wpm: number | null;
          accuracy: number | null;
          created_at: string;
        };
        Insert: {
          metadata?: Json;
          id?: string;
          user_id: string;
          game_id: string;
          variant?: string;
          settlement_version?: number;
          earned_xp?: number | null;
          score: number;
          cleared?: number;
          best_combo?: number;
          survived_ms?: number;
          wpm?: number | null;
          accuracy?: number | null;
          created_at?: string;
        };
        Update: {
          metadata?: Json;
          id?: string;
          user_id?: string;
          game_id?: string;
          variant?: string;
          settlement_version?: number;
          earned_xp?: number | null;
          score?: number;
          cleared?: number;
          best_combo?: number;
          survived_ms?: number;
          wpm?: number | null;
          accuracy?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      daily_stats: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          tests_completed: number;
          games_played: number;
          lessons_completed: number;
          practice_minutes: number;
          average_wpm: number;
          best_wpm: number;
          average_accuracy: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date?: string;
          tests_completed?: number;
          games_played?: number;
          lessons_completed?: number;
          practice_minutes?: number;
          average_wpm?: number;
          best_wpm?: number;
          average_accuracy?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          tests_completed?: number;
          games_played?: number;
          lessons_completed?: number;
          practice_minutes?: number;
          average_wpm?: number;
          best_wpm?: number;
          average_accuracy?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_id: string;
          unlocked_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          achievement_id: string;
          unlocked_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          achievement_id?: string;
          unlocked_at?: string;
        };
        Relationships: [];
      };
      api_rate_limits: {
        Row: {
          key: string;
          count: number;
          reset_at: string;
          created_at: string;
        };
        Insert: {
          key: string;
          count?: number;
          reset_at: string;
          created_at?: string;
        };
        Update: {
          key?: string;
          count?: number;
          reset_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      settle_game_run: {
        Args: {
          p_user_id: string;
          p_run_id: string;
          p_game_id: string;
          p_variant: string;
          p_score: number;
          p_cleared: number;
          p_best_combo: number;
          p_survived_ms: number;
          p_wpm: number | null;
          p_accuracy: number | null;
        };
        Returns: Json;
      };
      get_game_bests: {
        Args: { p_user_id: string };
        Returns: Database["public"]["Tables"]["game_scores"]["Row"][];
      };
      rate_limit_increment: {
        Args: {
          p_key: string;
          p_window_seconds: number;
        };
        Returns: { count: number; reset_at: string }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
