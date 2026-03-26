import type { Member } from './types';

type SupabaseClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        single: () => Promise<{ data: Member | null; error: unknown }>;
        maybeSingle: () => Promise<{ data: Member | null; error: unknown }>;
      };
      is: (column: string, value: null) => {
        eq: (column: string, value: string) => {
          single: () => Promise<{ data: Member | null; error: unknown }>;
        };
      };
    };
    update: (values: Record<string, unknown>) => {
      eq: (column: string, value: unknown) => {
        is: (column: string, value: null) => Promise<{ error: unknown }>;
        select: (columns: string) => {
          single: () => Promise<{ data: Member | null; error: unknown }>;
        };
      };
    };
  };
};

/**
 * Get the linked member record for an authenticated user.
 * Returns the full member record or null if not linked.
 */
export async function getLinkedMember(
  supabase: SupabaseClient,
  authUserId: string
): Promise<Member | null> {
  const { data } = await supabase
    .from('members')
    .select('*')
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  return data;
}
