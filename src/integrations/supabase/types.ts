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
      auth_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
        }
        Insert: {
          code: string
          created_at?: string
          expires_at: string
          id?: string
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
        }
        Relationships: []
      }
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
      card_holders: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          phone: string
          pin: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string
          first_name: string
          id?: string
          last_name: string
          phone?: string
          pin?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string
          pin?: string
          updated_at?: string
        }
        Relationships: []
      }
      cashier_closings_detail: {
        Row: {
          amex: number
          cash: number
          created_at: string
          date: string
          diners: number
          id: string
          master: number
          note: string
          operator: string
          other: number
          register_id: number
          total: number
          visa: number
        }
        Insert: {
          amex?: number
          cash?: number
          created_at?: string
          date?: string
          diners?: number
          id?: string
          master?: number
          note?: string
          operator?: string
          other?: number
          register_id: number
          total?: number
          visa?: number
        }
        Update: {
          amex?: number
          cash?: number
          created_at?: string
          date?: string
          diners?: number
          id?: string
          master?: number
          note?: string
          operator?: string
          other?: number
          register_id?: number
          total?: number
          visa?: number
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
      dispatches: {
        Row: {
          created_at: string
          from_location: string | null
          id: string
          items: Json
          note: string
          related_order_id: string | null
          status: string
          to_location: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          from_location?: string | null
          id?: string
          items?: Json
          note?: string
          related_order_id?: string | null
          status?: string
          to_location?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          from_location?: string | null
          id?: string
          items?: Json
          note?: string
          related_order_id?: string | null
          status?: string
          to_location?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispatches_from_location_fkey"
            columns: ["from_location"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatches_related_order_id_fkey"
            columns: ["related_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatches_to_location_fkey"
            columns: ["to_location"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      dynamic_auth_codes: {
        Row: {
          active: boolean
          code: string
          created_at: string
          created_by: string
          id: string
          reason: string
          valid_from: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          created_by?: string
          id?: string
          reason?: string
          valid_from?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          created_by?: string
          id?: string
          reason?: string
          valid_from?: string
        }
        Relationships: []
      }
      employee_documents: {
        Row: {
          created_at: string
          description: string
          employee_id: string
          file_url: string
          id: string
          type: string
        }
        Insert: {
          created_at?: string
          description?: string
          employee_id: string
          file_url: string
          id?: string
          type?: string
        }
        Update: {
          created_at?: string
          description?: string
          employee_id?: string
          file_url?: string
          id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address: string
          birth_date: string
          birth_place: string
          city: string
          code: string
          country: string
          created_at: string
          email: string
          emso: string
          first_name: string
          hire_date: string
          iban: string
          id: string
          last_name: string
          password: string
          phone: string
          position: string
          postal_code: string
          tax_number: string
          updated_at: string
          username: string
        }
        Insert: {
          address?: string
          birth_date?: string
          birth_place?: string
          city?: string
          code?: string
          country?: string
          created_at?: string
          email?: string
          emso?: string
          first_name: string
          hire_date?: string
          iban?: string
          id?: string
          last_name: string
          password?: string
          phone?: string
          position?: string
          postal_code?: string
          tax_number?: string
          updated_at?: string
          username?: string
        }
        Update: {
          address?: string
          birth_date?: string
          birth_place?: string
          city?: string
          code?: string
          country?: string
          created_at?: string
          email?: string
          emso?: string
          first_name?: string
          hire_date?: string
          iban?: string
          id?: string
          last_name?: string
          password?: string
          phone?: string
          position?: string
          postal_code?: string
          tax_number?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      equipment: {
        Row: {
          created_at: string
          id: string
          location_id: string | null
          name: string
          notes: string
          serial: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          location_id?: string | null
          name: string
          notes?: string
          serial?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          location_id?: string | null
          name?: string
          notes?: string
          serial?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_cards: {
        Row: {
          active: boolean
          balance: number
          code: string
          created_at: string
          created_by: string
          ean: string
          holder_id: string | null
          id: string
          pin: string
          points: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          balance?: number
          code: string
          created_at?: string
          created_by?: string
          ean?: string
          holder_id?: string | null
          id?: string
          pin?: string
          points?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          balance?: number
          code?: string
          created_at?: string
          created_by?: string
          ean?: string
          holder_id?: string | null
          id?: string
          pin?: string
          points?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_cards_holder_id_fkey"
            columns: ["holder_id"]
            isOneToOne: false
            referencedRelation: "card_holders"
            referencedColumns: ["id"]
          },
        ]
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
      inventure: {
        Row: {
          created_at: string
          date_inventure: string
          department: string | null
          document_number: string
          id: string
          inventory_number: string | null
          items: Json
          notes: string | null
          referent: string | null
          responsible_person: string | null
          status: string
          total: number
          updated_at: string
          warehouse: string | null
        }
        Insert: {
          created_at?: string
          date_inventure?: string
          department?: string | null
          document_number: string
          id?: string
          inventory_number?: string | null
          items?: Json
          notes?: string | null
          referent?: string | null
          responsible_person?: string | null
          status?: string
          total?: number
          updated_at?: string
          warehouse?: string | null
        }
        Update: {
          created_at?: string
          date_inventure?: string
          department?: string | null
          document_number?: string
          id?: string
          inventory_number?: string | null
          items?: Json
          notes?: string | null
          referent?: string | null
          responsible_person?: string | null
          status?: string
          total?: number
          updated_at?: string
          warehouse?: string | null
        }
        Relationships: []
      }
      leave_requests: {
        Row: {
          approver: string
          assigned_approver_id: string | null
          created_at: string
          description: string
          employee_name: string
          end_date: string
          id: string
          period: string
          requested_by_id: string | null
          start_date: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          approver?: string
          assigned_approver_id?: string | null
          created_at?: string
          description?: string
          employee_name: string
          end_date: string
          id?: string
          period?: string
          requested_by_id?: string | null
          start_date: string
          status?: string
          type?: string
          updated_at?: string
        }
        Update: {
          approver?: string
          assigned_approver_id?: string | null
          created_at?: string
          description?: string
          employee_name?: string
          end_date?: string
          id?: string
          period?: string
          requested_by_id?: string | null
          start_date?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_assigned_approver_id_fkey"
            columns: ["assigned_approver_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_requested_by_id_fkey"
            columns: ["requested_by_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      location_stock: {
        Row: {
          id: string
          location_id: string
          min_stock: number
          product_id: string
          stock: number
          updated_at: string
        }
        Insert: {
          id?: string
          location_id: string
          min_stock?: number
          product_id: string
          stock?: number
          updated_at?: string
        }
        Update: {
          id?: string
          location_id?: string
          min_stock?: number
          product_id?: string
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_stock_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_stock_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          active: boolean
          address: string
          created_at: string
          id: string
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string
          created_at?: string
          id?: string
          name: string
          type?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string
          created_at?: string
          id?: string
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          date: string
          from_profile: string
          id: string
          items: Json
          marked_ordered: boolean
          marked_shipped: boolean
          note: string
          received_confirmed: boolean
          status: string
          supplier: string
          to_profile: string
        }
        Insert: {
          created_at?: string
          date: string
          from_profile?: string
          id?: string
          items?: Json
          marked_ordered?: boolean
          marked_shipped?: boolean
          note?: string
          received_confirmed?: boolean
          status?: string
          supplier: string
          to_profile?: string
        }
        Update: {
          created_at?: string
          date?: string
          from_profile?: string
          id?: string
          items?: Json
          marked_ordered?: boolean
          marked_shipped?: boolean
          note?: string
          received_confirmed?: boolean
          status?: string
          supplier?: string
          to_profile?: string
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
      prevzemnice: {
        Row: {
          cost_center: string | null
          created_at: string
          created_by: string | null
          date_prevzem: string
          date_prevzemnice: string
          delivery_note_date: string | null
          delivery_note_number: string | null
          document_number: string
          exchange_rate: number | null
          id: string
          items: Json
          language_variant: string | null
          notes: string | null
          order_reference: string | null
          status: string
          supplier: string
          total: number
          updated_at: string
          warehouse: string | null
        }
        Insert: {
          cost_center?: string | null
          created_at?: string
          created_by?: string | null
          date_prevzem?: string
          date_prevzemnice?: string
          delivery_note_date?: string | null
          delivery_note_number?: string | null
          document_number: string
          exchange_rate?: number | null
          id?: string
          items?: Json
          language_variant?: string | null
          notes?: string | null
          order_reference?: string | null
          status?: string
          supplier?: string
          total?: number
          updated_at?: string
          warehouse?: string | null
        }
        Update: {
          cost_center?: string | null
          created_at?: string
          created_by?: string | null
          date_prevzem?: string
          date_prevzemnice?: string
          delivery_note_date?: string | null
          delivery_note_number?: string | null
          document_number?: string
          exchange_rate?: number | null
          id?: string
          items?: Json
          language_variant?: string | null
          notes?: string | null
          order_reference?: string | null
          status?: string
          supplier?: string
          total?: number
          updated_at?: string
          warehouse?: string | null
        }
        Relationships: []
      }
      product_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          product_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          product_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand: string | null
          catalog_number: string | null
          category: string
          country_of_origin: string | null
          created_at: string
          currency: string | null
          default_warehouse_location: string | null
          description: string | null
          ean: string
          id: string
          image_url: string | null
          internal_name: string | null
          min_stock: number
          name: string
          package_qty: number | null
          price: number
          primary_group: string | null
          product_type: string | null
          purchase_price: number | null
          secondary_group: string | null
          sku: string | null
          stock: number
          unit: string | null
          updated_at: string
          vat_rate: number | null
          warranty_months: number | null
          wholesale_price: number | null
        }
        Insert: {
          brand?: string | null
          catalog_number?: string | null
          category?: string
          country_of_origin?: string | null
          created_at?: string
          currency?: string | null
          default_warehouse_location?: string | null
          description?: string | null
          ean: string
          id?: string
          image_url?: string | null
          internal_name?: string | null
          min_stock?: number
          name: string
          package_qty?: number | null
          price?: number
          primary_group?: string | null
          product_type?: string | null
          purchase_price?: number | null
          secondary_group?: string | null
          sku?: string | null
          stock?: number
          unit?: string | null
          updated_at?: string
          vat_rate?: number | null
          warranty_months?: number | null
          wholesale_price?: number | null
        }
        Update: {
          brand?: string | null
          catalog_number?: string | null
          category?: string
          country_of_origin?: string | null
          created_at?: string
          currency?: string | null
          default_warehouse_location?: string | null
          description?: string | null
          ean?: string
          id?: string
          image_url?: string | null
          internal_name?: string | null
          min_stock?: number
          name?: string
          package_qty?: number | null
          price?: number
          primary_group?: string | null
          product_type?: string | null
          purchase_price?: number | null
          secondary_group?: string | null
          sku?: string | null
          stock?: number
          unit?: string | null
          updated_at?: string
          vat_rate?: number | null
          warranty_months?: number | null
          wholesale_price?: number | null
        }
        Relationships: []
      }
      promotions: {
        Row: {
          active: boolean
          created_at: string
          discount_percent: number | null
          end_date: string
          id: string
          product_ean: string
          product_name: string
          promo_price: number | null
          qty_free: number | null
          qty_required: number | null
          start_date: string
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          discount_percent?: number | null
          end_date: string
          id?: string
          product_ean: string
          product_name?: string
          promo_price?: number | null
          qty_free?: number | null
          qty_required?: number | null
          start_date: string
          type?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          discount_percent?: number | null
          end_date?: string
          id?: string
          product_ean?: string
          product_name?: string
          promo_price?: number | null
          qty_free?: number | null
          qty_required?: number | null
          start_date?: string
          type?: string
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
      register_closings: {
        Row: {
          card: number
          cash: number
          cashier_id: string
          cashier_name: string
          closed_at: string
          date: string
          id: string
          item_count: number
          other: number
          register_id: number
          total: number
          transaction_count: number
          type: string
        }
        Insert: {
          card?: number
          cash?: number
          cashier_id: string
          cashier_name: string
          closed_at?: string
          date?: string
          id?: string
          item_count?: number
          other?: number
          register_id: number
          total?: number
          transaction_count?: number
          type?: string
        }
        Update: {
          card?: number
          cash?: number
          cashier_id?: string
          cashier_name?: string
          closed_at?: string
          date?: string
          id?: string
          item_count?: number
          other?: number
          register_id?: number
          total?: number
          transaction_count?: number
          type?: string
        }
        Relationships: []
      }
      schedules: {
        Row: {
          created_at: string
          day: string
          employee: string
          end_time: string
          id: string
          start_time: string
        }
        Insert: {
          created_at?: string
          day: string
          employee: string
          end_time?: string
          id?: string
          start_time?: string
        }
        Update: {
          created_at?: string
          day?: string
          employee?: string
          end_time?: string
          id?: string
          start_time?: string
        }
        Relationships: []
      }
      self_checkout_config: {
        Row: {
          activated_at: string | null
          activated_by: string
          created_at: string
          enabled: boolean
          id: string
          label: string
          register_id: number
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          activated_by?: string
          created_at?: string
          enabled?: boolean
          id?: string
          label?: string
          register_id: number
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          activated_by?: string
          created_at?: string
          enabled?: boolean
          id?: string
          label?: string
          register_id?: number
          updated_at?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          active: boolean
          created_at: string
          email: string
          emso: string
          faculty: string
          first_name: string
          hourly_rate: number
          iban: string
          id: string
          last_name: string
          location_id: string | null
          phone: string
          tax_number: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email?: string
          emso?: string
          faculty?: string
          first_name: string
          hourly_rate?: number
          iban?: string
          id?: string
          last_name: string
          location_id?: string | null
          phone?: string
          tax_number?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string
          emso?: string
          faculty?: string
          first_name?: string
          hourly_rate?: number
          iban?: string
          id?: string
          last_name?: string
          location_id?: string | null
          phone?: string
          tax_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      terminal_requests: {
        Row: {
          amount: number
          created_at: string
          id: string
          metadata: Json | null
          register_id: number
          responded_at: string | null
          status: string
          type: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          metadata?: Json | null
          register_id: number
          responded_at?: string | null
          status?: string
          type?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          metadata?: Json | null
          register_id?: number
          responded_at?: string | null
          status?: string
          type?: string
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
          register_id: number
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
          register_id?: number
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
          register_id?: number
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
