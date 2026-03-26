// Auto-generated types placeholder.
// Replace with: npx supabase gen types typescript --project-id uoaigpdabiswykfjyznv > libs/db/src/types.ts

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          full_name: string | null;
          role: 'member' | 'dept_head' | 'admin' | 'super_admin';
          department_id: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          full_name?: string | null;
          role?: 'member' | 'dept_head' | 'admin' | 'super_admin';
          department_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          full_name?: string | null;
          role?: 'member' | 'dept_head' | 'admin' | 'super_admin';
          department_id?: string | null;
          created_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          emoji: string | null;
          color: string | null;
          sort_order: number;
        };
        Insert: {
          id?: string;
          name: string;
          emoji?: string | null;
          color?: string | null;
          sort_order?: number;
        };
        Update: {
          id?: string;
          name?: string;
          emoji?: string | null;
          color?: string | null;
          sort_order?: number;
        };
      };
      songs: {
        Row: {
          id: string;
          number: number;
          title: string;
          title_en: string | null;
          category: string;
          lyrics: string;
          audio_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          number: number;
          title: string;
          title_en?: string | null;
          category: string;
          lyrics: string;
          audio_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          number?: number;
          title?: string;
          title_en?: string | null;
          category?: string;
          lyrics?: string;
          audio_url?: string | null;
          created_at?: string;
        };
      };
      members: {
        Row: {
          id: number;
          member_id: string;
          sunday_school_id: number | null;
          member_type_id: number | null;
          member_state: string | null;
          status: string | null;
          registration_date: string | null;
          title: string | null;
          name: string;
          father_name: string | null;
          grandfather_name: string | null;
          mother_full_name: string | null;
          god_name: string | null;
          birth_date: string | null;
          gender: string | null;
          marital_status: string | null;
          address_city: string | null;
          address_sub_city: string | null;
          address_phone: string | null;
          address_email: string | null;
          auth_user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          member_id: string;
          name: string;
          father_name?: string | null;
          auth_user_id?: string | null;
          [key: string]: unknown;
        };
        Update: {
          auth_user_id?: string | null;
          [key: string]: unknown;
        };
      };
      events: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          event_date: string;
          start_time: string | null;
          end_time: string | null;
          department_id: number | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          event_date: string;
          start_time?: string | null;
          end_time?: string | null;
          department_id?: number | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          event_date?: string;
          start_time?: string | null;
          end_time?: string | null;
          department_id?: number | null;
          created_by?: string | null;
          created_at?: string;
        };
      };
      attendance: {
        Row: {
          id: string;
          event_id: string;
          member_id: number;
          status: 'present' | 'absent' | 'late';
          marked_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          member_id: number;
          status: 'present' | 'absent' | 'late';
          marked_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          member_id?: number;
          status?: 'present' | 'absent' | 'late';
          marked_by?: string | null;
          created_at?: string;
        };
      };
      departments: {
        Row: {
          id: number;
          name_en: string;
          name_am: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          name_en: string;
          name_am: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          name_en?: string;
          name_am?: string;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      role_type: 'member' | 'dept_head' | 'admin' | 'super_admin';
    };
  };
};

export type UserRole = Database['public']['Enums']['role_type'];
export type Member = Database['public']['Tables']['members']['Row'];
export type Department = Database['public']['Tables']['departments']['Row'];
