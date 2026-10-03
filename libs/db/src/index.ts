/**
 * Safe-anywhere entry point: table definitions and types only (no database
 * connection). Server code that queries the database imports
 * '@felege-yordanos/db/server' instead.
 */
export * from './schema';
