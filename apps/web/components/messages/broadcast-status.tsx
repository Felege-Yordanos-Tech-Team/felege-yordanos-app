import type { BroadcastStatus } from '@felege-yordanos/db/schema';
import { StatusPill, type StatusTone } from '@/components/ds';

const TONE: Record<BroadcastStatus, StatusTone> = {
  scheduled: 'upcoming',
  missed: 'rejected',
  queued: 'upcoming',
  sending: 'upcoming',
  paused: 'late',
  done: 'verified',
  cancelled: 'neutral',
};

export const BROADCAST_STATUS_LABEL: Record<BroadcastStatus, string> = {
  scheduled: 'Scheduled',
  missed: 'Not sent (too late)',
  queued: 'Starting',
  sending: 'Sending',
  paused: 'Paused',
  done: 'Done',
  cancelled: 'Cancelled',
};

/** Status of a broadcast as a pill. `t` translates the label. */
export function BroadcastStatusPill({
  status,
  t,
}: {
  status: BroadcastStatus;
  t: (s: string) => string;
}) {
  return <StatusPill tone={TONE[status]}>{t(BROADCAST_STATUS_LABEL[status])}</StatusPill>;
}
