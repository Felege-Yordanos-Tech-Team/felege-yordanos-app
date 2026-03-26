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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      role_type: 'member' | 'dept_head' | 'admin' | 'super_admin';
    };
  };
};

export type UserRole = Database['public']['Enums']['role_type'];
