/**
 * Server-only database client.
 *
 * Import from '@felege-yordanos/db/server' in server components, server
 * actions and route handlers. Never import this from a 'use client' file:
 * it would ship the database driver (and connection string) to the browser.
 */
import 'server-only';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const url = process.env['DATABASE_URL'];
if (!url) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env and fill it in.');
}

// Reuse one connection pool across hot reloads in development.
const globalForDb = globalThis as unknown as { pgClient?: ReturnType<typeof postgres> };
const client = globalForDb.pgClient ?? postgres(url, { max: 10 });
if (process.env['NODE_ENV'] !== 'production') globalForDb.pgClient = client;

export const db = drizzle(client, { schema });
export type Db = typeof db;
export * from './schema';
