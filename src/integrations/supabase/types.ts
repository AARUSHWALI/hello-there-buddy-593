export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      candidate_resume: {
        Row: {
          achievements: string | null
          achievements_no: number | null
          best_fit_for: string | null
          books: number | null
          created_at: string | null
          education: Json | null
          email: string | null
          experience: Json | null
          experience_average: number | null
          id: string
          longevity_years: number | null
          number_of_jobs: number | null
          personal_info: Json | null
          pg_institute_name: string | null
          phd_institute: number | null
          projects: string | null
          projects_no: number | null
          skills: string | null
          skills_no: number | null
          state_jk: boolean | null
          total_papers: number | null
          total_patents: number | null
          trainings: number | null
          ug_institute_name: string | null
          workshops: number | null
        }
        Insert: {
          achievements?: string | null
          achievements_no?: number | null
          best_fit_for?: string | null
          books?: number | null
          created_at?: string | null
          education?: Json | null
          email?: string | null
          experience?: Json | null
          experience_average?: number | null
          id?: string
          longevity_years?: number | null
          number_of_jobs?: number | null
          personal_info?: Json | null
          pg_institute_name?: string | null
          phd_institute?: number | null
          projects?: string | null
          projects_no?: number | null
          skills?: string | null
          skills_no?: number | null
          state_jk?: boolean | null
          total_papers?: number | null
          total_patents?: number | null
          trainings?: number | null
          ug_institute_name?: string | null
          workshops?: number | null
        }
        Update: {
          achievements?: string | null
          achievements_no?: number | null
          best_fit_for?: string | null
          books?: number | null
          created_at?: string | null
          education?: Json | null
          email?: string | null
          experience?: Json | null
          experience_average?: number | null
          id?: string
          longevity_years?: number | null
          number_of_jobs?: number | null
          personal_info?: Json | null
          pg_institute_name?: string | null
          phd_institute?: number | null
          projects?: string | null
          projects_no?: number | null
          skills?: string | null
          skills_no?: number | null
          state_jk?: boolean | null
          total_papers?: number | null
          total_patents?: number | null
          trainings?: number | null
          ug_institute_name?: string | null
          workshops?: number | null
        }
        Relationships: []
      }
      fitment_score: {
        Row: {
          agreeableness_score: number | null
          conscientiousness_score: number | null
          extroversion_score: number | null
          fitment_score: number | null
          id: string
          name: string | null
          neuroticism_score: number | null
          openness_score: number | null
        }
        Insert: {
          agreeableness_score?: number | null
          conscientiousness_score?: number | null
          extroversion_score?: number | null
          fitment_score?: number | null
          id?: string
          name?: string | null
          neuroticism_score?: number | null
          openness_score?: number | null
        }
        Update: {
          agreeableness_score?: number | null
          conscientiousness_score?: number | null
          extroversion_score?: number | null
          fitment_score?: number | null
          id?: string
          name?: string | null
          neuroticism_score?: number | null
          openness_score?: number | null
        }
        Relationships: []
      }
      jobs: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          title: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          title: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          title?: string
        }
        Relationships: []
      }
      personality_test_invitations: {
        Row: {
          candidate_email: string
          created_at: string | null
          id: string
          is_completed: boolean | null
          token: string
        }
        Insert: {
          candidate_email: string
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          token: string
        }
        Update: {
          candidate_email?: string
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          token?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
          score: number | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name: string
          score?: number | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          score?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
