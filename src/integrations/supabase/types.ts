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
      business_days: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          date: string
          id: string
          opened_at: string | null
          opened_by: string | null
          status: string
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          date: string
          id?: string
          opened_at?: string | null
          opened_by?: string | null
          status?: string
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          date?: string
          id?: string
          opened_at?: string | null
          opened_by?: string | null
          status?: string
        }
        Relationships: []
      }
      closing_reports: {
        Row: {
          card: number
          cash: number
          cashier_id: string
          cashier_name: string
          created_at: string
          id: string
          item_count: number
          other: number
          total: number
          transaction_count: number
          type: string
        }
        Insert: {
          card?: number
          cash?: number
          cashier_id: string
          cashier_name: string
          created_at?: string
          id?: string
          item_count?: number
          other?: number
          total?: number
          transaction_count?: number
          type: string
        }
        Update: {
          card?: number
          cash?: number
          cashier_id?: string
          cashier_name?: string
          created_at?: string
          id?: string
          item_count?: number
          other?: number
          total?: number
          transaction_count?: number
          type?: string
        }
        Relationships: []
      }
      gift_vouchers: {
        Row: {
          amount: number
          code: string
          created_at: string
          created_by: string
          id: string
          is_used: boolean
          remaining_amount: number
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          amount?: number
          code: string
          created_at?: string
          created_by: string
          id?: string
          is_used?: boolean
          remaining_amount?: number
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          amount?: number
          code?: string
          created_at?: string
          created_by?: string
          id?: string
          is_used?: boolean
          remaining_amount?: number
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      partners: {
        Row: {
          address: string
          city: string
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          postal_code: string
          tax_number: string
          updated_at: string
        }
        Insert: {
          address: string
          city?: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          postal_code?: string
          tax_number: string
          updated_at?: string
        }
        Update: {
          address?: string
          city?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          postal_code?: string
          tax_number?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          created_at: string
          ean: string
          id: string
          min_stock: number
          name: string
          price: number
          stock: number
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          ean: string
          id?: string
          min_stock?: number
          name: string
          price?: number
          stock?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          ean?: string
          id?: string
          min_stock?: number
          name?: string
          price?: number
          stock?: number
          updated_at?: string
        }
        Relationships: []
      }
      receipt_counters: {
        Row: {
          id: string
          last_number: number
          updated_at: string
          year: number
        }
        Insert: {
          id?: string
          last_number?: number
          updated_at?: string
          year: number
        }
        Update: {
          id?: string
          last_number?: number
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount_paid: number
          cashier_id: string
          cashier_name: string
          change_amount: number
          created_at: string
          discount: number
          id: string
          invoice_data: Json | null
          items: Json
          payment_method: string
          receipt_number: string
          subtotal: number
          total: number
          void_reason: string | null
          voided: boolean
        }
        Insert: {
          amount_paid?: number
          cashier_id: string
          cashier_name: string
          change_amount?: number
          created_at?: string
          discount?: number
          id?: string
          invoice_data?: Json | null
          items?: Json
          payment_method?: string
          receipt_number: string
          subtotal?: number
          total?: number
          void_reason?: string | null
          voided?: boolean
        }
        Update: {
          amount_paid?: number
          cashier_id?: string
          cashier_name?: string
          change_amount?: number
          created_at?: string
          discount?: number
          id?: string
          invoice_data?: Json | null
          items?: Json
          payment_method?: string
          receipt_number?: string
          subtotal?: number
          total?: number
          void_reason?: string | null
          voided?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_next_receipt_number: { Args: never; Returns: string }
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
