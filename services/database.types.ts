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
            assets: {
                Row: {
                    created_at: string | null
                    description: string | null
                    id: string
                    image_url: string | null
                    last_inspection: string | null
                    location_lat: number | null
                    location_lng: number | null
                    name: string | null
                    status: string | null
                    type: string | null
                    client_id: string | null
                }
                Insert: {
                    created_at?: string | null
                    description?: string | null
                    id: string
                    image_url?: string | null
                    last_inspection?: string | null
                    location_lat?: number | null
                    location_lng?: number | null
                    name?: string | null
                    status?: string | null
                    type?: string | null
                    client_id?: string | null
                }
                Update: {
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    image_url?: string | null
                    last_inspection?: string | null
                    location_lat?: number | null
                    location_lng?: number | null
                    name?: string | null
                    status?: string | null
                    type?: string | null
                    client_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "public_assets_client_id_fkey"
                        columns: ["client_id"]
                        isOneToOne: false
                        referencedRelation: "clients"
                        referencedColumns: ["id"]
                    }
                ]
            }
            clients: {
                Row: {
                    address: string | null
                    contact_email: string | null
                    created_at: string | null
                    id: string
                    name: string
                }
                Insert: {
                    address?: string | null
                    contact_email?: string | null
                    created_at?: string | null
                    id?: string
                    name: string
                }
                Update: {
                    address?: string | null
                    contact_email?: string | null
                    created_at?: string | null
                    id?: string
                    name?: string
                }
                Relationships: []
            }
            inspections: {
                Row: {
                    asset_id: string
                    created_at: string | null
                    date: string | null
                    id: string
                    inspector_id: string | null
                    notes: string | null
                    result: string | null
                    status: string | null
                }
                Insert: {
                    asset_id: string
                    created_at?: string | null
                    date?: string | null
                    id?: string
                    inspector_id?: string | null
                    notes?: string | null
                    result?: string | null
                    status?: string | null
                }
                Update: {
                    asset_id?: string
                    created_at?: string | null
                    date?: string | null
                    id?: string
                    inspector_id?: string | null
                    notes?: string | null
                    result?: string | null
                    status?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "inspections_asset_id_fkey"
                        columns: ["asset_id"]
                        isOneToOne: false
                        referencedRelation: "assets"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "inspections_inspector_id_fkey"
                        columns: ["inspector_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            profiles: {
                Row: {
                    avatar_url: string | null
                    created_at: string | null
                    email: string | null
                    full_name: string | null
                    id: string
                    role: string | null
                    company_id: string | null
                }
                Insert: {
                    avatar_url?: string | null
                    created_at?: string | null
                    email?: string | null
                    full_name?: string | null
                    id: string
                    role?: string | null
                    company_id?: string | null
                }
                Update: {
                    avatar_url?: string | null
                    created_at?: string | null
                    email?: string | null
                    full_name?: string | null
                    id?: string
                    role?: string | null
                    company_id?: string | null
                }
                Relationships: []
            }
            activity_logs: {
                Row: {
                    id: string
                    user_id: string | null
                    action: string
                    entity_type: string
                    entity_id: string | null
                    entity_name: string | null
                    details: Json | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    action: string
                    entity_type: string
                    entity_id?: string | null
                    entity_name?: string | null
                    details?: Json | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    action?: string
                    entity_type?: string
                    entity_id?: string | null
                    entity_name?: string | null
                    details?: Json | null
                    created_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "activity_logs_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            invoices: {
                Row: {
                    id: string
                    client_id: string
                    amount: number
                    status: string
                    invoice_date: string
                    due_date: string
                    items: Json
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    client_id: string
                    amount: number
                    status: string
                    invoice_date?: string
                    due_date: string
                    items?: Json
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    client_id?: string
                    amount?: number
                    status?: string
                    invoice_date?: string
                    due_date?: string
                    items?: Json
                    created_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "invoices_client_id_fkey"
                        columns: ["client_id"]
                        isOneToOne: false
                        referencedRelation: "clients"
                        referencedColumns: ["id"]
                    }
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
    PublicTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends PublicTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof (DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? (DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : PublicTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[PublicTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    PublicTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends PublicTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : PublicTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    PublicTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends PublicTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : PublicTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    PublicEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
    EnumName extends PublicEnumNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : PublicEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][PublicEnumNameOrOptions]
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
