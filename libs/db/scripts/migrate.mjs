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

/**
 * Waits until the database accepts connections. On a first deploy the
 * database container starts at the same time as the app and needs a few
 * seconds to initialise; without this the first migration run fails.
 */
async function waitForDatabase(timeoutSeconds = 40) {
  const deadline = Date.now() + timeoutSeconds * 1000;
  for (let attempt = 1; ; attempt++) {
    const probe = postgres(url, {
      max: 1,
      connect_timeout: 5,
      onnotice: () => undefined,
    });
    try {
      await probe`select 1`;
      return;
    } catch (err) {
      if (Date.now() > deadline) throw err;
      const reason = err instanceof Error ? err.message : String(err);
      console.log(
        `Database not ready (attempt ${attempt}: ${reason}); retrying.`,
      );
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } finally {
      await probe.end({ timeout: 1 });
    }
  }
}

const client = postgres(url, { max: 1, onnotice: () => undefined });
try {
  await waitForDatabase();
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
