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
    PostgrestVersion: "17.1"
  }
  public: {
    Tables: {
      arrangement_usage: {
        Row: {
          created_at: string
          id: string
          score_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          score_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          score_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "arrangement_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      paddle_catalog: {
        Row: {
          environment: string
          lease_token: string | null
          lease_until: string | null
          plan: string
          price_id: string | null
          product_id: string | null
        }
        Insert: {
          environment: string
          lease_token?: string | null
          lease_until?: string | null
          plan: string
          price_id?: string | null
          product_id?: string | null
        }
        Update: {
          environment?: string
          lease_token?: string | null
          lease_until?: string | null
          plan?: string
          price_id?: string | null
          product_id?: string | null
        }
        Relationships: []
      }
      paddle_events: {
        Row: {
          event_id: string
          occurred_at: string
          received_at: string
        }
        Insert: {
          event_id: string
          occurred_at: string
          received_at?: string
        }
        Update: {
          event_id?: string
          occurred_at?: string
          received_at?: string
        }
        Relationships: []
      }
      paddle_subscriptions: {
        Row: {
          customer_id: string
          environment: string
          event_at: string
          id: string
          next_billed_at: string | null
          plan: string
          status: string
          user_id: string
        }
        Insert: {
          customer_id: string
          environment: string
          event_at: string
          id: string
          next_billed_at?: string | null
          plan: string
          status: string
          user_id: string
        }
        Update: {
          customer_id?: string
          environment?: string
          event_at?: string
          id?: string
          next_billed_at?: string | null
          plan?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "paddle_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          paddle_customer_id: string | null
          paddle_environment: string | null
          paddle_subscription_id: string | null
          plan: string
          plan_renews_at: string | null
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          paddle_customer_id?: string | null
          paddle_environment?: string | null
          paddle_subscription_id?: string | null
          plan?: string
          plan_renews_at?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          paddle_customer_id?: string | null
          paddle_environment?: string | null
          paddle_subscription_id?: string | null
          plan?: string
          plan_renews_at?: string | null
        }
        Relationships: []
      }
      scores: {
        Row: {
          abc: string
          bars: number
          created_at: string
          ensemble: string
          id: string
          key: string
          level: string
          meter: string
          notes: Json
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          abc: string
          bars: number
          created_at?: string
          ensemble: string
          id: string
          key: string
          level: string
          meter: string
          notes?: Json
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          abc?: string
          bars?: number
          created_at?: string
          ensemble?: string
          id?: string
          key?: string
          level?: string
          meter?: string
          notes?: Json
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_paddle_billing: { Args: { p_payload: Json }; Returns: string }
      apply_paddle_subscription: {
        Args: {
          p_customer_id: string
          p_environment: string
          p_event_id: string
          p_next_billed_at: string
          p_occurred_at: string
          p_plan: string
          p_status: string
          p_subscription_id: string
          p_user_id: string
        }
        Returns: string
      }
      claim_paddle_catalog: {
        Args: { p_environment: string; p_plan: string; p_token: string }
        Returns: boolean
      }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
