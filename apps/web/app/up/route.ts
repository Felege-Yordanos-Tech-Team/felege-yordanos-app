import { sql } from 'drizzle-orm';
import { db } from '@felege-yordanos/db/server';

/**
 * Health check: 200 when the app runs and the database answers, 503 otherwise.
 * Used by Kamal before switching traffic to a new version, and by uptime
 * monitoring. Public, returns no data.
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return new Response('OK', {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return new Response('Database unavailable', {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}
