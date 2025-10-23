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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      fitment_criteria: {
        Row: {
          average_fit: number
          best_fit: number
          created_at: string | null
          created_by: string | null
          id: string
          not_fit: number
          updated_at: string | null
        }
        Insert: {
          average_fit: number
          best_fit: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          not_fit: number
          updated_at?: string | null
        }
        Update: {
          average_fit?: number
          best_fit?: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          not_fit?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      interviews: {
        Row: {
          actual_end_time: string | null
          actual_start_time: string | null
          candidate_email: string
          candidate_feedback: string | null
          candidate_id: string | null
          candidate_name: string
          created_at: string | null
          created_by: string | null
          date: string
          description: string | null
          id: string
          interview_type: string | null
          interviewer_email: string | null
          interviewer_id: string | null
          interviewer_name: string | null
          interviewer_notes: string | null
          job_description: string | null
          job_title: string | null
          meeting_link: string | null
          meeting_platform: string | null
          overall_rating: number | null
          scheduled_end_time: string | null
          scheduled_start_time: string | null
          status: string
          technical_assessment: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          candidate_email: string
          candidate_feedback?: string | null
          candidate_id?: string | null
          candidate_name: string
          created_at?: string | null
          created_by?: string | null
          date: string
          description?: string | null
          id?: string
          interview_type?: string | null
          interviewer_email?: string | null
          interviewer_id?: string | null
          interviewer_name?: string | null
          interviewer_notes?: string | null
          job_description?: string | null
          job_title?: string | null
          meeting_link?: string | null
          meeting_platform?: string | null
          overall_rating?: number | null
          scheduled_end_time?: string | null
          scheduled_start_time?: string | null
          status?: string
          technical_assessment?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          candidate_email?: string
          candidate_feedback?: string | null
          candidate_id?: string | null
          candidate_name?: string
          created_at?: string | null
          created_by?: string | null
          date?: string
          description?: string | null
          id?: string
          interview_type?: string | null
          interviewer_email?: string | null
          interviewer_id?: string | null
          interviewer_name?: string | null
          interviewer_notes?: string | null
          job_description?: string | null
          job_title?: string | null
          meeting_link?: string | null
          meeting_platform?: string | null
          overall_rating?: number | null
          scheduled_end_time?: string | null
          scheduled_start_time?: string | null
          status?: string
          technical_assessment?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interviews_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      resumes: {
        Row: {
          achievements: Json | null
          achievements_count: number | null
          address: string | null
          average_experience: number | null
          best_fit_for: string | null
          books: Json | null
          books_count: number | null
          created_at: string | null
          education: Json | null
          email: string
          experience: Json | null
          file_path: string | null
          file_size: number | null
          file_url: string | null
          id: string
          is_jk: boolean | null
          longevity_years: number | null
          mime_type: string | null
          name: string
          number_of_jobs: number | null
          original_filename: string | null
          patents: Json | null
          patents_count: number | null
          pg_institute: string | null
          phd_institute: string | null
          phone: string | null
          projects: Json | null
          projects_count: number | null
          research_papers: Json | null
          research_papers_count: number | null
          skills: Json | null
          skills_count: number | null
          summary: string | null
          trainings: Json | null
          trainings_count: number | null
          ug_institute: string | null
          updated_at: string | null
          workshops: Json | null
          workshops_count: number | null
        }
        Insert: {
          achievements?: Json | null
          achievements_count?: number | null
          address?: string | null
          average_experience?: number | null
          best_fit_for?: string | null
          books?: Json | null
          books_count?: number | null
          created_at?: string | null
          education?: Json | null
          email: string
          experience?: Json | null
          file_path?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_jk?: boolean | null
          longevity_years?: number | null
          mime_type?: string | null
          name: string
          number_of_jobs?: number | null
          original_filename?: string | null
          patents?: Json | null
          patents_count?: number | null
          pg_institute?: string | null
          phd_institute?: string | null
          phone?: string | null
          projects?: Json | null
          projects_count?: number | null
          research_papers?: Json | null
          research_papers_count?: number | null
          skills?: Json | null
          skills_count?: number | null
          summary?: string | null
          trainings?: Json | null
          trainings_count?: number | null
          ug_institute?: string | null
          updated_at?: string | null
          workshops?: Json | null
          workshops_count?: number | null
        }
        Update: {
          achievements?: Json | null
          achievements_count?: number | null
          address?: string | null
          average_experience?: number | null
          best_fit_for?: string | null
          books?: Json | null
          books_count?: number | null
          created_at?: string | null
          education?: Json | null
          email?: string
          experience?: Json | null
          file_path?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_jk?: boolean | null
          longevity_years?: number | null
          mime_type?: string | null
          name?: string
          number_of_jobs?: number | null
          original_filename?: string | null
          patents?: Json | null
          patents_count?: number | null
          pg_institute?: string | null
          phd_institute?: string | null
          phone?: string | null
          projects?: Json | null
          projects_count?: number | null
          research_papers?: Json | null
          research_papers_count?: number | null
          skills?: Json | null
          skills_count?: number | null
          summary?: string | null
          trainings?: Json | null
          trainings_count?: number | null
          ug_institute?: string | null
          updated_at?: string | null
          workshops?: Json | null
          workshops_count?: number | null
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
  public: {
    Enums: {},
  },
} as const
