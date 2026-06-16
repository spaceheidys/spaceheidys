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
      admin_notes: {
        Row: {
          content: string
          created_at: string
          folder: number
          id: string
          image_url: string | null
          is_deleted: boolean
          is_divider: boolean
          is_done: boolean
          is_starred: boolean
          sort_order: number
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          folder?: number
          id?: string
          image_url?: string | null
          is_deleted?: boolean
          is_divider?: boolean
          is_done?: boolean
          is_starred?: boolean
          sort_order?: number
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          folder?: number
          id?: string
          image_url?: string | null
          is_deleted?: boolean
          is_divider?: boolean
          is_done?: boolean
          is_starred?: boolean
          sort_order?: number
          user_id?: string
        }
        Relationships: []
      }
      cube_faces: {
        Row: {
          icon: string
          id: number
          image_scale: number
          image_url: string | null
          image_x: number
          image_y: number
          text: string
          title: string
          updated_at: string
        }
        Insert: {
          icon?: string
          id: number
          image_scale?: number
          image_url?: string | null
          image_x?: number
          image_y?: number
          text?: string
          title?: string
          updated_at?: string
        }
        Update: {
          icon?: string
          id?: number
          image_scale?: number
          image_url?: string | null
          image_x?: number
          image_y?: number
          text?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      nav_buttons: {
        Row: {
          id: string
          is_visible: boolean
          key: string
          label: string
          label_jp: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          id?: string
          is_visible?: boolean
          key: string
          label: string
          label_jp?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          id?: string
          is_visible?: boolean
          key?: string
          label?: string
          label_jp?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      page_backgrounds: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_active: boolean
          section: string
          sort_order: number
          time_of_day: string
          time_of_days: string[]
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_active?: boolean
          section: string
          sort_order?: number
          time_of_day?: string
          time_of_days?: string[]
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean
          section?: string
          sort_order?: number
          time_of_day?: string
          time_of_days?: string[]
        }
        Relationships: []
      }
      portfolio_items: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          group_id: string | null
          id: string
          image_offset_x: number
          image_offset_y: number
          image_url: string
          image_zoom: number
          is_visible: boolean
          project_date: string
          project_url: string | null
          section: string
          sort_order: number
          subsection: string | null
          tags: string[]
          text_align: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string
          group_id?: string | null
          id?: string
          image_offset_x?: number
          image_offset_y?: number
          image_url: string
          image_zoom?: number
          is_visible?: boolean
          project_date?: string
          project_url?: string | null
          section: string
          sort_order?: number
          subsection?: string | null
          tags?: string[]
          text_align?: string
          title?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          group_id?: string | null
          id?: string
          image_offset_x?: number
          image_offset_y?: number
          image_url?: string
          image_zoom?: number
          is_visible?: boolean
          project_date?: string
          project_url?: string | null
          section?: string
          sort_order?: number
          subsection?: string | null
          tags?: string[]
          text_align?: string
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          username: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          username?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          username?: string | null
        }
        Relationships: []
      }
      secret_door_files: {
        Row: {
          created_at: string
          file_name: string
          file_size: number
          file_url: string
          id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          file_name?: string
          file_size?: number
          file_url: string
          id?: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number
          file_url?: string
          id?: string
          sort_order?: number
        }
        Relationships: []
      }
      secret_door_settings: {
        Row: {
          background_url: string | null
          id: string
          impulse_color: string
          impulse_enabled: boolean
          impulse_mode: string
          impulse_speed: number
          music_enabled: boolean
          secret_code_hash: string | null
          timer_seconds: number
          updated_at: string
        }
        Insert: {
          background_url?: string | null
          id?: string
          impulse_color?: string
          impulse_enabled?: boolean
          impulse_mode?: string
          impulse_speed?: number
          music_enabled?: boolean
          secret_code_hash?: string | null
          timer_seconds?: number
          updated_at?: string
        }
        Update: {
          background_url?: string | null
          id?: string
          impulse_color?: string
          impulse_enabled?: boolean
          impulse_mode?: string
          impulse_speed?: number
          music_enabled?: boolean
          secret_code_hash?: string | null
          timer_seconds?: number
          updated_at?: string
        }
        Relationships: []
      }
      section_content: {
        Row: {
          content: string
          display_duration: number | null
          id: string
          key: string
          updated_at: string
        }
        Insert: {
          content?: string
          display_duration?: number | null
          id?: string
          key: string
          updated_at?: string
        }
        Update: {
          content?: string
          display_duration?: number | null
          id?: string
          key?: string
          updated_at?: string
        }
        Relationships: []
      }
      section_settings: {
        Row: {
          id: string
          is_visible: boolean
          label: string
          label_jp: string
          section: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          id?: string
          is_visible?: boolean
          label?: string
          label_jp?: string
          section: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          id?: string
          is_visible?: boolean
          label?: string
          label_jp?: string
          section?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      seo_settings: {
        Row: {
          description: string
          id: string
          og_image_url: string
          page_key: string
          title: string
          updated_at: string
        }
        Insert: {
          description?: string
          id?: string
          og_image_url?: string
          page_key: string
          title?: string
          updated_at?: string
        }
        Update: {
          description?: string
          id?: string
          og_image_url?: string
          page_key?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      shop_items: {
        Row: {
          category: Database["public"]["Enums"]["shop_category"]
          created_at: string
          currency: string
          description: string | null
          id: string
          images: string[]
          main_image: string | null
          price: number | null
          sort_order: number
          title: string
          updated_at: string
          variants: Json
          visible: boolean
        }
        Insert: {
          category: Database["public"]["Enums"]["shop_category"]
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          images?: string[]
          main_image?: string | null
          price?: number | null
          sort_order?: number
          title: string
          updated_at?: string
          variants?: Json
          visible?: boolean
        }
        Update: {
          category?: Database["public"]["Enums"]["shop_category"]
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          images?: string[]
          main_image?: string | null
          price?: number | null
          sort_order?: number
          title?: string
          updated_at?: string
          variants?: Json
          visible?: boolean
        }
        Relationships: []
      }
      site_visits: {
        Row: {
          count: number
          id: number
          updated_at: string
        }
        Insert: {
          count?: number
          id?: number
          updated_at?: string
        }
        Update: {
          count?: number
          id?: number
          updated_at?: string
        }
        Relationships: []
      }
      skills: {
        Row: {
          created_at: string
          icon_url: string
          id: string
          is_visible: boolean
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          icon_url?: string
          id?: string
          is_visible?: boolean
          name?: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          icon_url?: string
          id?: string
          is_visible?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      social_links: {
        Row: {
          icon_url: string
          id: string
          is_visible: boolean
          label: string
          link_type: string
          share_url_template: string
          sort_order: number
          updated_at: string
          url: string
        }
        Insert: {
          icon_url?: string
          id?: string
          is_visible?: boolean
          label: string
          link_type?: string
          share_url_template?: string
          sort_order?: number
          updated_at?: string
          url?: string
        }
        Update: {
          icon_url?: string
          id?: string
          is_visible?: boolean
          label?: string
          link_type?: string
          share_url_template?: string
          sort_order?: number
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visit_logs: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          country_name: string | null
          created_at: string
          device: string | null
          id: string
          os: string | null
          path: string | null
          referrer: string | null
          region: string | null
          visitor_hash: string
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          country_name?: string | null
          created_at?: string
          device?: string | null
          id?: string
          os?: string | null
          path?: string | null
          referrer?: string | null
          region?: string | null
          visitor_hash: string
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          country_name?: string | null
          created_at?: string
          device?: string | null
          id?: string
          os?: string | null
          path?: string | null
          referrer?: string | null
          region?: string | null
          visitor_hash?: string
        }
        Relationships: []
      }
    }
    Views: {
      secret_door_public_settings: {
        Row: {
          background_url: string | null
          id: string | null
          impulse_color: string | null
          impulse_enabled: boolean | null
          impulse_mode: string | null
          impulse_speed: number | null
          music_enabled: boolean | null
          timer_seconds: number | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_secret_door_public_settings: {
        Args: never
        Returns: {
          background_url: string
          id: string
          impulse_color: string
          impulse_enabled: boolean
          impulse_mode: string
          impulse_speed: number
          music_enabled: boolean
          timer_seconds: number
          updated_at: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_site_visits: { Args: never; Returns: number }
      reset_site_visits: { Args: never; Returns: number }
      set_secret_door_code: { Args: { _new_code: string }; Returns: undefined }
      verify_secret_door_code: { Args: { _code: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
      shop_category: "prints" | "merch"
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
    Enums: {
      app_role: ["admin", "user"],
      shop_category: ["prints", "merch"],
    },
  },
} as const
