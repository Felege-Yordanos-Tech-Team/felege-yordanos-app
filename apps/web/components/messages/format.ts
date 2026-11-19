import type { BroadcastAudience } from '@felege-yordanos/db/schema';
import type { SkipReason } from '@/lib/sms/message-audience';
import { intlLocale, type Locale } from '@/lib/i18n/config';

/** English labels (translated in the UI). */
export const MESSAGE_AUDIENCE_LABEL: Record<BroadcastAudience, string> = {
  members: 'Members',
  pre_members: 'Pre-members',
  everyone: 'Members & pre-members',
  event: 'Expected at an event',
};

/** "Nov 19, 14:05" in Addis Ababa time. */
export function formatSentAt(d: Date | string, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: 'Africa/Addis_Ababa',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(typeof d === 'string' ? new Date(d) : d);
}

/** Why a person was skipped (English, translated in the UI). */
export const SKIP_LABEL: Record<SkipReason, string> = {
  no_phone: 'No phone number',
  invalid_phone: 'Not a mobile number',
  opted_out: 'Turned off SMS',
  duplicate_phone: 'Same number as someone else',
};
