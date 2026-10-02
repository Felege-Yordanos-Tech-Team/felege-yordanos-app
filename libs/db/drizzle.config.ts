import './scripts/load-env';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema/index.ts',
  out: './migrations',
  dbCredentials: {
    url: process.env['DATABASE_URL'] ?? 'postgres://felege:felege@localhost:5432/felege',
  },
  strict: true,
  verbose: true,
});
