// Auto-generated types placeholder.
// Replace with: npx supabase gen types typescript --project-id uoaigpdabiswykfjyznv > libs/db/src/types.ts

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          role: 'member' | 'dept_head' | 'admin' | 'super_admin';
          department_id: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          role?: 'member' | 'dept_head' | 'admin' | 'super_admin';
          department_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          role?: 'member' | 'dept_head' | 'admin' | 'super_admin';
          department_id?: string | null;
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
