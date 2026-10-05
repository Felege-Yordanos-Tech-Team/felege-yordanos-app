/**
 * Applies pending migrations from libs/db/migrations.
 *
 * Plain JavaScript on purpose: it runs inside the production image, where
 * drizzle-kit and TypeScript tooling are not installed.
 *
 *   docker run --rm -e DATABASE_URL=... <image> node db/scripts/migrate.mjs
 *
 * Uses the same migrations table as `pnpm db:migrate` (drizzle-kit), so
 * both can be used on the same database.
 */
import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const url = process.env['DATABASE_URL'];
if (!url) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

const client = postgres(url, { max: 1, onnotice: () => undefined });
try {
  await migrate(drizzle(client), {
    migrationsFolder: fileURLToPath(new URL('../migrations', import.meta.url)),
  });
  console.log('Migrations applied.');
} catch (err) {
  console.error('Migration failed:', err);
  process.exitCode = 1;
} finally {
  await client.end();
}
