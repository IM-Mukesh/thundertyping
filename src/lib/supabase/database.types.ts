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
        Row: {
          id: string;
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
          updated_at: string;
        };
        Insert: {
          id?: string;
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
          updated_at?: string;
        };
        Update: {
          id?: string;
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
          updated_at?: string;
        };
        Relationships: [];
      };
      lesson_attempts: {
        Row: {
          id: string;
          user_id: string;
          lesson_id: string;
          wpm: number;
          raw_wpm: number | null;
          accuracy: number;
          stars: number;
          completed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          lesson_id: string;
          wpm: number;
          raw_wpm?: number | null;
          accuracy: number;
          stars: number;
          completed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          lesson_id?: string;
          wpm?: number;
          raw_wpm?: number | null;
          accuracy?: number;
          stars?: number;
          completed?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      typing_results: {
        Row: {
          id: string;
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
          created_at: string;
        };
        Insert: {
          id?: string;
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
          created_at?: string;
        };
        Update: {
          id?: string;
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
          created_at?: string;
        };
        Relationships: [];
      };
      game_scores: {
        Row: {
          id: string;
          user_id: string;
          game_id: string;
          score: number;
          cleared: number;
          best_combo: number;
          survived_ms: number;
          wpm: number | null;
          accuracy: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          game_id: string;
          score: number;
          cleared?: number;
          best_combo?: number;
          survived_ms?: number;
          wpm?: number | null;
          accuracy?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          game_id?: string;
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
