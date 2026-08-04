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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      franchise_applications: {
        Row: {
          applied_at: string
          business_name: string
          business_type: string
          city: string
          code: string
          country: string
          created_at: string
          email: string
          experience: string
          id: string
          investment_capacity: string
          kyc_status: string
          owner_name: string
          phone: string
          requested_territory: string
          review_notes: string | null
          state: string
          status: string
          updated_at: string
        }
        Insert: {
          applied_at?: string
          business_name: string
          business_type?: string
          city: string
          code: string
          country?: string
          created_at?: string
          email: string
          experience?: string
          id?: string
          investment_capacity?: string
          kyc_status?: string
          owner_name: string
          phone: string
          requested_territory: string
          review_notes?: string | null
          state: string
          status?: string
          updated_at?: string
        }
        Update: {
          applied_at?: string
          business_name?: string
          business_type?: string
          city?: string
          code?: string
          country?: string
          created_at?: string
          email?: string
          experience?: string
          id?: string
          investment_capacity?: string
          kyc_status?: string
          owner_name?: string
          phone?: string
          requested_territory?: string
          review_notes?: string | null
          state?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      franchise_audit_logs: {
        Row: {
          action: string
          actor: string
          created_at: string
          details: string | null
          entity_id: string | null
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          actor?: string
          created_at?: string
          details?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          actor?: string
          created_at?: string
          details?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
        }
        Relationships: []
      }
      franchise_compliance: {
        Row: {
          category: string
          created_at: string
          due_date: string | null
          franchise_id: string
          id: string
          last_checked: string
          notes: string | null
          requirement: string
          severity: string
          status: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          due_date?: string | null
          franchise_id: string
          id?: string
          last_checked?: string
          notes?: string | null
          requirement: string
          severity?: string
          status?: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          due_date?: string | null
          franchise_id?: string
          id?: string
          last_checked?: string
          notes?: string | null
          requirement?: string
          severity?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "franchise_compliance_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
        ]
      }
      franchise_contracts: {
        Row: {
          contract_no: string
          contract_type: string
          created_at: string
          end_date: string
          franchise_id: string
          id: string
          renewal_status: string
          signed_at: string | null
          start_date: string
          status: string
          updated_at: string
          value: number
        }
        Insert: {
          contract_no: string
          contract_type?: string
          created_at?: string
          end_date: string
          franchise_id: string
          id?: string
          renewal_status?: string
          signed_at?: string | null
          start_date: string
          status?: string
          updated_at?: string
          value?: number
        }
        Update: {
          contract_no?: string
          contract_type?: string
          created_at?: string
          end_date?: string
          franchise_id?: string
          id?: string
          renewal_status?: string
          signed_at?: string | null
          start_date?: string
          status?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "franchise_contracts_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
        ]
      }
      franchise_documents: {
        Row: {
          application_id: string | null
          created_at: string
          doc_type: string
          expires_at: string | null
          file_url: string | null
          franchise_id: string | null
          id: string
          name: string
          status: string
          updated_at: string
          uploaded_at: string
        }
        Insert: {
          application_id?: string | null
          created_at?: string
          doc_type?: string
          expires_at?: string | null
          file_url?: string | null
          franchise_id?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string
          uploaded_at?: string
        }
        Update: {
          application_id?: string | null
          created_at?: string
          doc_type?: string
          expires_at?: string | null
          file_url?: string | null
          franchise_id?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "franchise_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "franchise_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "franchise_documents_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
        ]
      }
      franchise_escalations: {
        Row: {
          assigned_to: string
          category: string
          created_at: string
          franchise_id: string | null
          id: string
          priority: string
          raised_by: string
          resolution: string | null
          sla_due: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string
          category?: string
          created_at?: string
          franchise_id?: string | null
          id?: string
          priority?: string
          raised_by?: string
          resolution?: string | null
          sla_due?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string
          category?: string
          created_at?: string
          franchise_id?: string | null
          id?: string
          priority?: string
          raised_by?: string
          resolution?: string | null
          sla_due?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "franchise_escalations_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
        ]
      }
      franchise_fraud_alerts: {
        Row: {
          alert_type: string
          created_at: string
          description: string
          detected_at: string
          franchise_id: string | null
          id: string
          risk_score: number
          severity: string
          status: string
          updated_at: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          description: string
          detected_at?: string
          franchise_id?: string | null
          id?: string
          risk_score?: number
          severity?: string
          status?: string
          updated_at?: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          description?: string
          detected_at?: string
          franchise_id?: string | null
          id?: string
          risk_score?: number
          severity?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "franchise_fraud_alerts_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
        ]
      }
      franchise_notifications: {
        Row: {
          created_at: string
          franchise_id: string | null
          id: string
          message: string
          read: boolean
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          franchise_id?: string | null
          id?: string
          message?: string
          read?: boolean
          title: string
          type?: string
        }
        Update: {
          created_at?: string
          franchise_id?: string | null
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "franchise_notifications_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
        ]
      }
      franchise_performance: {
        Row: {
          conversions: number
          created_at: string
          csat: number
          franchise_id: string
          id: string
          leads: number
          period: string
          revenue: number
          sla_percent: number
          tickets: number
        }
        Insert: {
          conversions?: number
          created_at?: string
          csat?: number
          franchise_id: string
          id?: string
          leads?: number
          period: string
          revenue?: number
          sla_percent?: number
          tickets?: number
        }
        Update: {
          conversions?: number
          created_at?: string
          csat?: number
          franchise_id?: string
          id?: string
          leads?: number
          period?: string
          revenue?: number
          sla_percent?: number
          tickets?: number
        }
        Relationships: [
          {
            foreignKeyName: "franchise_performance_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
        ]
      }
      franchise_royalties: {
        Row: {
          commission_due: number
          created_at: string
          due_date: string | null
          franchise_id: string
          gross_sales: number
          id: string
          paid_amount: number
          paid_at: string | null
          period: string
          royalty_due: number
          royalty_rate: number
          status: string
          updated_at: string
        }
        Insert: {
          commission_due?: number
          created_at?: string
          due_date?: string | null
          franchise_id: string
          gross_sales?: number
          id?: string
          paid_amount?: number
          paid_at?: string | null
          period: string
          royalty_due?: number
          royalty_rate?: number
          status?: string
          updated_at?: string
        }
        Update: {
          commission_due?: number
          created_at?: string
          due_date?: string | null
          franchise_id?: string
          gross_sales?: number
          id?: string
          paid_amount?: number
          paid_at?: string | null
          period?: string
          royalty_due?: number
          royalty_rate?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "franchise_royalties_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
        ]
      }
      franchise_settings: {
        Row: {
          description: string
          id: string
          key: string
          label: string
          updated_at: string
          value: Json
        }
        Insert: {
          description?: string
          id?: string
          key: string
          label: string
          updated_at?: string
          value?: Json
        }
        Update: {
          description?: string
          id?: string
          key?: string
          label?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      franchises: {
        Row: {
          city: string
          code: string
          commission_rate: number
          created_at: string
          email: string
          health: string
          id: string
          joined_date: string
          last_active: string
          lead_routing: boolean
          name: string
          owner_name: string
          performance_score: number
          phone: string
          pricing_variation: number
          royalty_rate: number
          state: string
          status: string
          territory: string
          territory_id: string | null
          total_sales: number
          updated_at: string
        }
        Insert: {
          city?: string
          code: string
          commission_rate?: number
          created_at?: string
          email: string
          health?: string
          id?: string
          joined_date?: string
          last_active?: string
          lead_routing?: boolean
          name: string
          owner_name: string
          performance_score?: number
          phone: string
          pricing_variation?: number
          royalty_rate?: number
          state?: string
          status?: string
          territory?: string
          territory_id?: string | null
          total_sales?: number
          updated_at?: string
        }
        Update: {
          city?: string
          code?: string
          commission_rate?: number
          created_at?: string
          email?: string
          health?: string
          id?: string
          joined_date?: string
          last_active?: string
          lead_routing?: boolean
          name?: string
          owner_name?: string
          performance_score?: number
          phone?: string
          pricing_variation?: number
          royalty_rate?: number
          state?: string
          status?: string
          territory?: string
          territory_id?: string | null
          total_sales?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "franchises_territory_id_fkey"
            columns: ["territory_id"]
            isOneToOne: false
            referencedRelation: "territories"
            referencedColumns: ["id"]
          },
        ]
      }
      territories: {
        Row: {
          city: string
          code: string
          country: string
          created_at: string
          exclusivity: string
          id: string
          lat: number
          lng: number
          name: string
          population: number
          potential_score: number
          region: string
          state: string
          status: string
          updated_at: string
        }
        Insert: {
          city: string
          code: string
          country?: string
          created_at?: string
          exclusivity?: string
          id?: string
          lat?: number
          lng?: number
          name: string
          population?: number
          potential_score?: number
          region: string
          state: string
          status?: string
          updated_at?: string
        }
        Update: {
          city?: string
          code?: string
          country?: string
          created_at?: string
          exclusivity?: string
          id?: string
          lat?: number
          lng?: number
          name?: string
          population?: number
          potential_score?: number
          region?: string
          state?: string
          status?: string
          updated_at?: string
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
