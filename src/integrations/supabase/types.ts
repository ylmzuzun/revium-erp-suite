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
      departments: {
        Row: {
          created_at: string
          description: string | null
          id: string
          manager_id: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          manager_id?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          manager_id?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      production_orders: {
        Row: {
          completed_date: string | null
          created_at: string
          created_by: string
          customer_name: string | null
          due_date: string
          id: string
          notes: string | null
          order_number: string
          priority: number | null
          product_name: string
          quantity: number
          start_date: string | null
          status: Database["public"]["Enums"]["production_status"]
          unit: string
          updated_at: string
        }
        Insert: {
          completed_date?: string | null
          created_at?: string
          created_by: string
          customer_name?: string | null
          due_date: string
          id?: string
          notes?: string | null
          order_number: string
          priority?: number | null
          product_name: string
          quantity: number
          start_date?: string | null
          status?: Database["public"]["Enums"]["production_status"]
          unit: string
          updated_at?: string
        }
        Update: {
          completed_date?: string | null
          created_at?: string
          created_by?: string
          customer_name?: string | null
          due_date?: string
          id?: string
          notes?: string | null
          order_number?: string
          priority?: number | null
          product_name?: string
          quantity?: number
          start_date?: string | null
          status?: Database["public"]["Enums"]["production_status"]
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      production_processes: {
        Row: {
          assigned_department: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          notes: string | null
          order_id: string
          process_name: string
          sequence_order: number
          started_at: string | null
          status: Database["public"]["Enums"]["task_status"]
          updated_at: string
        }
        Insert: {
          assigned_department?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          order_id: string
          process_name: string
          sequence_order: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          updated_at?: string
        }
        Update: {
          assigned_department?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          process_name?: string
          sequence_order?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_processes_assigned_department_fkey"
            columns: ["assigned_department"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_processes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "production_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department_id: string | null
          email: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department_id?: string | null
          email: string
          full_name: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department_id?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_department"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_files: {
        Row: {
          created_at: string
          description: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          production_order_id: string | null
          task_id: string | null
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          production_order_id?: string | null
          task_id?: string | null
          uploaded_by: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          production_order_id?: string | null
          task_id?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_files_production_order_id_fkey"
            columns: ["production_order_id"]
            isOneToOne: false
            referencedRelation: "production_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_files_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_assignments: {
        Row: {
          accepted_at: string | null
          assigned_at: string
          assigned_by: string
          assigned_to: string
          completed_at: string | null
          id: string
          notes: string | null
          task_id: string
        }
        Insert: {
          accepted_at?: string | null
          assigned_at?: string
          assigned_by: string
          assigned_to: string
          completed_at?: string | null
          id?: string
          notes?: string | null
          task_id: string
        }
        Update: {
          accepted_at?: string | null
          assigned_at?: string
          assigned_by?: string
          assigned_to?: string
          completed_at?: string | null
          id?: string
          notes?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assignments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          priority: number | null
          production_order_id: string | null
          production_process_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: number | null
          production_order_id?: string | null
          production_process_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: number | null
          production_order_id?: string | null
          production_process_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_production_order_id_fkey"
            columns: ["production_order_id"]
            isOneToOne: false
            referencedRelation: "production_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_production_process_id_fkey"
            columns: ["production_process_id"]
            isOneToOne: false
            referencedRelation: "production_processes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      production_status:
        | "planned"
        | "in_production"
        | "quality_check"
        | "completed"
        | "on_hold"
      task_status: "pending" | "in_progress" | "completed" | "cancelled"
      user_role: "admin" | "manager" | "operator" | "viewer"
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
      production_status: [
        "planned",
        "in_production",
        "quality_check",
        "completed",
        "on_hold",
      ],
      task_status: ["pending", "in_progress", "completed", "cancelled"],
      user_role: ["admin", "manager", "operator", "viewer"],
    },
  },
} as const
