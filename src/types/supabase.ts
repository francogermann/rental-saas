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
  public: {
    Tables: {
      customers: {
        Row: {
          auth_user_id: string | null
          block_reason: string | null
          blocked_at: string | null
          blocked_by: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          id_document: string | null
          id_document_type: string | null
          is_blocked: boolean
          last_name: string
          loyalty_points: number
          notes: string | null
          organization_id: string
          phone: string | null
          pii_anonymized_at: string | null
          tags: string[]
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          block_reason?: string | null
          blocked_at?: string | null
          blocked_by?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          id_document?: string | null
          id_document_type?: string | null
          is_blocked?: boolean
          last_name: string
          loyalty_points?: number
          notes?: string | null
          organization_id: string
          phone?: string | null
          pii_anonymized_at?: string | null
          tags?: string[]
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          block_reason?: string | null
          blocked_at?: string | null
          blocked_by?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          id_document?: string | null
          id_document_type?: string | null
          is_blocked?: boolean
          last_name?: string
          loyalty_points?: number
          notes?: string | null
          organization_id?: string
          phone?: string | null
          pii_anonymized_at?: string | null
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      garment_blocks: {
        Row: {
          block_type: string
          created_at: string
          date_from: string
          date_to: string
          garment_id: string
          id: string
          notes: string | null
          organization_id: string
          release_reason: string | null
          released_at: string | null
          released_by: string | null
          source_id: string | null
          source_type: string | null
        }
        Insert: {
          block_type: string
          created_at?: string
          date_from: string
          date_to: string
          garment_id: string
          id?: string
          notes?: string | null
          organization_id: string
          release_reason?: string | null
          released_at?: string | null
          released_by?: string | null
          source_id?: string | null
          source_type?: string | null
        }
        Update: {
          block_type?: string
          created_at?: string
          date_from?: string
          date_to?: string
          garment_id?: string
          id?: string
          notes?: string | null
          organization_id?: string
          release_reason?: string | null
          released_at?: string | null
          released_by?: string | null
          source_id?: string | null
          source_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "garment_blocks_garment_id_fkey"
            columns: ["garment_id"]
            isOneToOne: false
            referencedRelation: "garments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "garment_blocks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address_line: string
          created_at: string
          id: string
          name: string
          organization_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          address_line: string
          created_at?: string
          id?: string
          name: string
          organization_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          address_line?: string
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      garments: {
        Row: {
          category: string | null
          chest_cm: number | null
          created_at: string
          deposit_amount: number
          description: string | null
          hip_cm: number | null
          id: string
          length_cm: number | null
          location_id: string | null
          name: string
          notes: string | null
          operative_status: string
          organization_id: string
          photos_urls: string[]
          rental_price: number | null
          sale_price: number | null
          size_label: string | null
          sku: string
          style_group_id: string | null
          tags: string[]
          updated_at: string
          waist_cm: number | null
        }
        Insert: {
          category?: string | null
          chest_cm?: number | null
          created_at?: string
          deposit_amount?: number
          description?: string | null
          hip_cm?: number | null
          id?: string
          length_cm?: number | null
          location_id?: string | null
          name: string
          notes?: string | null
          operative_status?: string
          organization_id: string
          photos_urls?: string[]
          rental_price?: number | null
          sale_price?: number | null
          size_label?: string | null
          sku: string
          style_group_id?: string | null
          tags?: string[]
          updated_at?: string
          waist_cm?: number | null
        }
        Update: {
          category?: string | null
          chest_cm?: number | null
          created_at?: string
          deposit_amount?: number
          description?: string | null
          hip_cm?: number | null
          id?: string
          length_cm?: number | null
          location_id?: string | null
          name?: string
          notes?: string | null
          operative_status?: string
          organization_id?: string
          photos_urls?: string[]
          rental_price?: number | null
          sale_price?: number | null
          size_label?: string | null
          sku?: string
          style_group_id?: string | null
          tags?: string[]
          updated_at?: string
          waist_cm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "garments_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "garments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          plan: string
          settings: Json
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          plan?: string
          settings?: Json
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          plan?: string
          settings?: Json
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          actual_return_date: string | null
          contingency_status: string
          created_at: string
          customer_id: string
          delivery_photos_urls: string[]
          deposit_amount: number
          discount_amount: number
          event_date: string | null
          garment_id: string
          id: string
          mp_payment_detail: Json | null
          mp_payment_id: string | null
          mp_payment_status: string | null
          mp_preference_id: string | null
          notes: string | null
          organization_id: string
          pickup_date: string
          rental_price: number
          return_date: string
          return_photos_urls: string[]
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          actual_return_date?: string | null
          contingency_status?: string
          created_at?: string
          customer_id: string
          delivery_photos_urls?: string[]
          deposit_amount?: number
          discount_amount?: number
          event_date?: string | null
          garment_id: string
          id?: string
          mp_payment_detail?: Json | null
          mp_payment_id?: string | null
          mp_payment_status?: string | null
          mp_preference_id?: string | null
          notes?: string | null
          organization_id: string
          pickup_date: string
          rental_price: number
          return_date: string
          return_photos_urls?: string[]
          status?: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          actual_return_date?: string | null
          contingency_status?: string
          created_at?: string
          customer_id?: string
          delivery_photos_urls?: string[]
          deposit_amount?: number
          discount_amount?: number
          event_date?: string | null
          garment_id?: string
          id?: string
          mp_payment_detail?: Json | null
          mp_payment_id?: string | null
          mp_payment_status?: string | null
          mp_preference_id?: string | null
          notes?: string | null
          organization_id?: string
          pickup_date?: string
          rental_price?: number
          return_date?: string
          return_photos_urls?: string[]
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_garment_id_fkey"
            columns: ["garment_id"]
            isOneToOne: false
            referencedRelation: "garments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auth_organization_id: { Args: never; Returns: string }
      create_reservation_with_block: {
        Args: {
          p_customer_id: string
          p_deposit_amount: number
          p_event_date: string
          p_garment_id: string
          p_pickup_date: string
          p_rental_price: number
          p_return_date: string
        }
        Returns: Json
      }
      get_available_garments: {
        Args: {
          p_category?: string
          p_chest_cm?: number
          p_limit?: number
          p_max_price?: number
          p_offset?: number
          p_organization_id?: string
          p_pickup_date: string
          p_return_date: string
          p_size_label?: string
          p_waist_cm?: number
        }
        Returns: {
          category: string
          chest_cm: number
          deposit_amount: number
          hip_cm: number
          id: string
          location_id: string | null
          location_name: string | null
          name: string
          photos_urls: string[]
          rental_price: number
          size_label: string
          sku: string
          style_group_id: string | null
          tags: string[]
          waist_cm: number
        }[]
      }
      get_blocked_dates_for_garment: {
        Args: {
          p_from_date?: string
          p_garment_id: string
          p_until_date?: string
        }
        Returns: {
          block_type: string
          date_from: string
          date_to: string
        }[]
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
