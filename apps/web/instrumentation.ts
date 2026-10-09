/**
 * Runs once when the server starts. Checks the storage settings so a missing
 * R2 variable stops the new version at startup (and Kamal keeps the old one
 * running) instead of failing on the first upload.
 */
export async function register() {
  if (process.env['NEXT_RUNTIME'] === 'nodejs') {
    const { storageConfig } = await import('./lib/storage-config');
    storageConfig();
  }
}
