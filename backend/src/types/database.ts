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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          display_title: string
          duration_ms: number | null
          entity_id: string | null
          entity_type: string
          id: string
          related_company_id: string | null
          related_job_id: string | null
          source_type: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          display_title: string
          duration_ms?: number | null
          entity_id?: string | null
          entity_type: string
          id?: string
          related_company_id?: string | null
          related_job_id?: string | null
          source_type?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          display_title?: string
          duration_ms?: number | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          related_company_id?: string | null
          related_job_id?: string | null
          source_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      analyses: {
        Row: {
          analysis_type: string
          categories: Json | null
          company_id: string | null
          created_at: string | null
          duration_ms: number | null
          fit_rating: string | null
          id: string
          improvements: Json | null
          job_id: string | null
          missing_keywords: Json | null
          score: number | null
          source_resume_id: string | null
          source_type: string
          strengths: Json | null
          summary: string | null
          targeted_suggestions: Json | null
          transferable_skills: Json | null
          user_id: string
        }
        Insert: {
          analysis_type: string
          categories?: Json | null
          company_id?: string | null
          created_at?: string | null
          duration_ms?: number | null
          fit_rating?: string | null
          id?: string
          improvements?: Json | null
          job_id?: string | null
          missing_keywords?: Json | null
          score?: number | null
          source_resume_id?: string | null
          source_type: string
          strengths?: Json | null
          summary?: string | null
          targeted_suggestions?: Json | null
          transferable_skills?: Json | null
          user_id: string
        }
        Update: {
          analysis_type?: string
          categories?: Json | null
          company_id?: string | null
          created_at?: string | null
          duration_ms?: number | null
          fit_rating?: string | null
          id?: string
          improvements?: Json | null
          job_id?: string | null
          missing_keywords?: Json | null
          score?: number | null
          source_resume_id?: string | null
          source_type?: string
          strengths?: Json | null
          summary?: string | null
          targeted_suggestions?: Json | null
          transferable_skills?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analyses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analyses_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analyses_source_resume_id_fkey"
            columns: ["source_resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          name: string
          slug: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          company_id: string | null
          content: string | null
          created_at: string | null
          id: string
          slug: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          slug: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          slug?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          content: string | null
          created_at: string | null
          display_name: string
          id: string
          theme_id: string
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          display_name: string
          id: string
          theme_id?: string
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          display_name?: string
          id?: string
          theme_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      resumes: {
        Row: {
          company_id: string | null
          content: string
          created_at: string | null
          emphasized_skills: Json | null
          generation_duration_ms: number | null
          generation_summary: string | null
          id: string
          is_edited: boolean | null
          is_primary: boolean | null
          job_id: string | null
          origin: string
          selected_experiences: Json | null
          source_resume_id: string | null
          source_type: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          content: string
          created_at?: string | null
          emphasized_skills?: Json | null
          generation_duration_ms?: number | null
          generation_summary?: string | null
          id?: string
          is_edited?: boolean | null
          is_primary?: boolean | null
          job_id?: string | null
          origin?: string
          selected_experiences?: Json | null
          source_resume_id?: string | null
          source_type?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string | null
          content?: string
          created_at?: string | null
          emphasized_skills?: Json | null
          generation_duration_ms?: number | null
          generation_summary?: string | null
          id?: string
          is_edited?: boolean | null
          is_primary?: boolean | null
          job_id?: string | null
          origin?: string
          selected_experiences?: Json | null
          source_resume_id?: string | null
          source_type?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resumes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resumes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resumes_source_resume_id_fkey"
            columns: ["source_resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
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
