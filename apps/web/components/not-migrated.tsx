import { Construction } from 'lucide-react';

interface NotMigratedProps {
  /** Screen name shown to the user, e.g. "Dashboard". */
  feature: string;
  /** Path of the old Supabase implementation, relative to apps/web. */
  legacyFile: string;
}

/**
 * Placeholder for screens that still use Supabase and have not been moved to
 * the new backend yet. The old implementation is kept next to this page as
 * page.legacy.tsx (Next.js does not route it) for reference while porting.
 *
 * Porting a screen = rewrite page.tsx with server-side data access
 * (@felege-yordanos/db/server + lib/session.ts), then delete page.legacy.tsx.
 */
export function NotMigrated({ feature, legacyFile }: NotMigratedProps) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-16 text-center">
      <div className="mb-4 rounded-full border border-gold/30 bg-gold/10 p-3 text-gold-deep dark:text-gold">
        <Construction className="h-6 w-6" />
      </div>
      <h1 className="font-display text-2xl text-burgundy-ink dark:text-cream">
        {feature}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This screen is being moved to the new backend and is not available yet.
      </p>
      {process.env.NODE_ENV !== 'production' && (
        <p className="mt-6 rounded-md bg-muted px-3 py-2 font-mono text-[11px] text-muted-foreground">
          Old version: {legacyFile}
        </p>
      )}
    </div>
  );
}
