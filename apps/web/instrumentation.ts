/**
 * Runs once when the server starts. Checks the storage settings so a missing
 * R2 variable stops the new version at startup (and Kamal keeps the old one
 * running) instead of failing on the first upload. Then starts the SMS
 * worker (lib/sms/worker.ts), which sends queued messages and event
 * reminders in the background. SMS_WORKER=off keeps it from starting.
 */
export async function register() {
  if (process.env['NEXT_RUNTIME'] === 'nodejs') {
    const { storageConfig } = await import('./lib/storage-config');
    storageConfig();

    const building = process.env['NEXT_PHASE'] === 'phase-production-build';
    if (!building && process.env['SMS_WORKER'] !== 'off') {
      const { startSmsWorker } = await import('./lib/sms/worker');
      startSmsWorker();
    }
  }
}
