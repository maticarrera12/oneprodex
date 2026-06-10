export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          id: string
          name: string
          description: string | null
          type: 'progressive' | 'one_shot'
          tiers: { bronze: number; silver: number; gold: number } | null
          points: { bronze?: number; silver?: number; gold?: number; value?: number }
        }
        Insert: {
          id: string
          name: string
          description?: string | null
          type: 'progressive' | 'one_shot'
          tiers?: { bronze: number; silver: number; gold: number } | null
          points: { bronze?: number; silver?: number; gold?: number; value?: number }
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          type?: 'progressive' | 'one_shot'
          tiers?: { bronze: number; silver: number; gold: number } | null
          points?: { bronze?: number; silver?: number; gold?: number; value?: number }
        }
        Relationships: []
      }
      bracket_picks: {
        Row: {
          points: number | null
          slot: string
          team_code: string
          user_id: string
        }
        Insert: {
          points?: number | null
          slot: string
          team_code: string
          user_id: string
        }
        Update: {
          points?: number | null
          slot?: string
          team_code?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bracket_picks_team_code_fkey"
            columns: ["team_code"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "bracket_picks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      group_picks: {
        Row: {
          advances_as_third: boolean
          group_code: string
          position: number
          team_code: string
          user_id: string
        }
        Insert: {
          advances_as_third?: boolean
          group_code: string
          position: number
          team_code: string
          user_id: string
        }
        Update: {
          advances_as_third?: boolean
          group_code?: string
          position?: number
          team_code?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_picks_team_code_fkey"
            columns: ["team_code"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "group_picks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          joined_at: string | null
          user_id: string
          invited_by: string | null
        }
        Insert: {
          group_id: string
          joined_at?: string | null
          user_id: string
          invited_by?: string | null
        }
        Update: {
          group_id?: string
          joined_at?: string | null
          user_id?: string
          invited_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          invite_code: string
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          invite_code?: string
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          invite_code?: string
          name?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      match_events: {
        Row: {
          id: string
          match_id: string
          minute: number | null
          player_api_id: number | null
          team_code: string | null
          type: string
        }
        Insert: {
          id: string
          match_id: string
          minute?: number | null
          player_api_id?: number | null
          team_code?: string | null
          type: string
        }
        Update: {
          id?: string
          match_id?: string
          minute?: number | null
          player_api_id?: number | null
          team_code?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_events_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          away_score: number | null
          away_team_code: string
          group_code: string | null
          home_score: number | null
          home_team_code: string
          id: string
          kickoff: string
          minute: number | null
          stage: string
          status: string
          synced_at: string | null
        }
        Insert: {
          away_score?: number | null
          away_team_code: string
          group_code?: string | null
          home_score?: number | null
          home_team_code: string
          id: string
          kickoff: string
          minute?: number | null
          stage: string
          status?: string
          synced_at?: string | null
        }
        Update: {
          away_score?: number | null
          away_team_code?: string
          group_code?: string | null
          home_score?: number | null
          home_team_code?: string
          id?: string
          kickoff?: string
          minute?: number | null
          stage?: string
          status?: string
          synced_at?: string | null
        }
        Relationships: []
      }
      players: {
        Row: {
          api_id: number
          date_of_birth: string | null
          id: string
          name: string
          photo_url: string | null
          position: string | null
          team_code: string | null
        }
        Insert: {
          api_id: number
          date_of_birth?: string | null
          id?: string
          name: string
          photo_url?: string | null
          position?: string | null
          team_code?: string | null
        }
        Update: {
          api_id?: number
          date_of_birth?: string | null
          id?: string
          name?: string
          photo_url?: string | null
          position?: string | null
          team_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "players_team_code_fkey"
            columns: ["team_code"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["code"]
          },
        ]
      }
      prediction_clean_sheets: {
        Row: {
          match_id: string
          team_code: string
          user_id: string
        }
        Insert: {
          match_id: string
          team_code: string
          user_id: string
        }
        Update: {
          match_id?: string
          team_code?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prediction_clean_sheets_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prediction_clean_sheets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      prediction_players: {
        Row: {
          id: string
          match_id: string
          player_api_id: number
          type: string
          user_id: string
        }
        Insert: {
          id?: string
          match_id: string
          player_api_id: number
          type: string
          user_id: string
        }
        Update: {
          id?: string
          match_id?: string
          player_api_id?: number
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prediction_players_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prediction_players_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      predictions: {
        Row: {
          away_score: number
          created_at: string | null
          edit_locked: boolean
          home_score: number
          id: string
          locked: boolean
          match_id: string
          points: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          away_score: number
          created_at?: string | null
          edit_locked?: boolean
          home_score: number
          id?: string
          locked?: boolean
          match_id: string
          points?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          away_score?: number
          created_at?: string | null
          edit_locked?: boolean
          home_score?: number
          id?: string
          locked?: boolean
          match_id?: string
          points?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "predictions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      standings: {
        Row: {
          drawn: number
          goals_against: number
          goals_for: number
          group_code: string
          lost: number
          played: number
          points: number
          synced_at: string | null
          team_code: string
          won: number
        }
        Insert: {
          drawn?: number
          goals_against?: number
          goals_for?: number
          group_code: string
          lost?: number
          played?: number
          points?: number
          synced_at?: string | null
          team_code: string
          won?: number
        }
        Update: {
          drawn?: number
          goals_against?: number
          goals_for?: number
          group_code?: string
          lost?: number
          played?: number
          points?: number
          synced_at?: string | null
          team_code?: string
          won?: number
        }
        Relationships: []
      }
      teams: {
        Row: {
          api_id: number | null
          c1: string | null
          c2: string | null
          c3: string | null
          code: string
          logo: string | null
          name: string
        }
        Insert: {
          api_id?: number | null
          c1?: string | null
          c2?: string | null
          c3?: string | null
          code: string
          logo?: string | null
          name: string
        }
        Update: {
          api_id?: number | null
          c1?: string | null
          c2?: string | null
          c3?: string | null
          code?: string
          logo?: string | null
          name?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          user_id: string
          achievement_id: string
          tier: 'bronze' | 'silver' | 'gold' | null
          earned_at: string
          progress_json: Record<string, unknown> | null
        }
        Insert: {
          user_id: string
          achievement_id: string
          tier?: 'bronze' | 'silver' | 'gold' | null
          earned_at?: string
          progress_json?: Record<string, unknown> | null
        }
        Update: {
          user_id?: string
          achievement_id?: string
          tier?: 'bronze' | 'silver' | 'gold' | null
          earned_at?: string
          progress_json?: Record<string, unknown> | null
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_predictions: {
        Row: {
          best_player_api_id: number | null
          best_young_player_api_id: number | null
          champion_code: string | null
          top_scorer_api_id: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          best_player_api_id?: number | null
          best_young_player_api_id?: number | null
          champion_code?: string | null
          top_scorer_api_id?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          best_player_api_id?: number | null
          best_young_player_api_id?: number | null
          champion_code?: string | null
          top_scorer_api_id?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_predictions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          awards_at: string | null
          avatar_url: string | null
          bracket_submitted_at: string | null
          created_at: string | null
          display_name: string
          handle: string
          id: string
          achievement_points: number
          onboarding_mode: string
          prode_picks_submitted_at: string | null
        }
        Insert: {
          awards_at?: string | null
          avatar_url?: string | null
          bracket_submitted_at?: string | null
          created_at?: string | null
          display_name: string
          handle: string
          id: string
          achievement_points?: number
          onboarding_mode?: string
          prode_picks_submitted_at?: string | null
        }
        Update: {
          awards_at?: string | null
          avatar_url?: string | null
          bracket_submitted_at?: string | null
          created_at?: string | null
          display_name?: string
          handle?: string
          id?: string
          achievement_points?: number
          onboarding_mode?: string
          prode_picks_submitted_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_group_leaderboard: {
        Args: { p_group_id: string }
        Returns: {
          avatar_url: string
          correct_count: number
          display_name: string
          handle: string
          total_pts: number
          user_id: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      user_is_group_member: { Args: { gid: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
