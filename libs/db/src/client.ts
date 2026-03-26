import { createBrowserClient, createServerClient } from '@supabase/ssr';
import type { Database } from './types';

type BrowserClient = ReturnType<typeof createBrowserClient<Database>>;
type ServerClient = ReturnType<typeof createServerClient<Database>>;

export function createClient(): BrowserClient {
  return createBrowserClient<Database>(
    process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? '',
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ?? ''
  );
}

export function createServerComponentClient(cookieStore: {
  getAll: () => { name: string; value: string }[];
  set: (
    name: string,
    value: string,
    options: Record<string, unknown>
  ) => void;
}): ServerClient {
  return createServerClient<Database>(
    process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? '',
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ?? '',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  );
}
