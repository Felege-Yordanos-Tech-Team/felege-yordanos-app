import 'server-only';

interface Email {
  to: string;
  subject: string;
  text: string;
}

/**
 * Sends an email.
 *
 * Development (or EMAIL_TRANSPORT=console, e.g. on staging): prints the email
 * to the server log instead of sending it.
 * Production: an SMTP provider is added before cutover (Phase 3). Until then
 * this throws in production so a missing provider is never silent, and reset
 * links never end up in production logs.
 */
export async function sendEmail(email: Email): Promise<void> {
  const logOnly =
    process.env['NODE_ENV'] !== 'production' ||
    process.env['EMAIL_TRANSPORT'] === 'console';
  if (logOnly) {
    console.log(
      `\n──── Email (dev, not sent) ────\nTo: ${email.to}\nSubject: ${email.subject}\n\n${email.text}\n───────────────────────────────\n`,
    );
    return;
  }
  throw new Error(
    'Email sending is not configured yet (SMTP provider pending).',
  );
}
