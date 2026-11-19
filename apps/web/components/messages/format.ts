import type { BroadcastAudience } from '@felege-yordanos/db/schema';
import type { SkipReason } from '@/lib/sms/message-audience';
import { eatTime } from '@/lib/check-in-window';
import { intlLocale, type Locale } from '@/lib/i18n/config';
import { ethiopianClock } from '@/lib/sms/reminder-time';

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

/** "Nov 20, 16:30 (ከቀኑ 10:30 ሰዓት)": Addis Ababa time and the Ethiopian clock. */
export function formatScheduled(d: Date | string, locale: Locale): string {
  const at = typeof d === 'string' ? new Date(d) : d;
  return `${formatSentAt(at, locale)} (${ethiopianClock(eatTime(at))})`;
}

/** Why a person was skipped (English, translated in the UI). */
export const SKIP_LABEL: Record<SkipReason, string> = {
  child_member: 'Child member',
  no_phone: 'No phone number',
  invalid_phone: 'Not a mobile number',
  opted_out: 'Turned off SMS',
  duplicate_phone: 'Same number as someone else',
};
