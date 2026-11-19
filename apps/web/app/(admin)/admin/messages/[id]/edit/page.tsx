import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageHead } from '@/components/ds';
import { eatDate, eatTime } from '@/lib/check-in-window';
import { todayYmd } from '@/lib/events';
import { getT } from '@/lib/i18n/server';
import { canEditBroadcast, canSendMessages } from '@/lib/permissions';
import { requireUser } from '@/lib/session';
import { loadBroadcast, loadComposeEvents, ownPhone } from '@/lib/sms/message-queries';
import { maskPhone } from '@/lib/sms/phone';
import { smsStatus } from '@/lib/sms/transport';
import { ComposeForm } from '../../new/compose-form';

/**
 * Edit a scheduled broadcast (text, audience, time) with the compose form.
 * Permission: canSendMessages and canEditBroadcast; status 'scheduled'.
 */
export default async function EditMessagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  if (!canSendMessages(user)) redirect('/admin');
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const b = await loadBroadcast(id);
  if (!b || !canEditBroadcast(user, b)) notFound();
  if (b.status !== 'scheduled' || !b.scheduledAt) redirect(`/admin/messages/${b.id}`);
  const t = await getT();
  const [eventRows, phone] = await Promise.all([loadComposeEvents(), ownPhone(user)]);
  // A scheduled message to an older event keeps it in the list.
  if (b.eventId && !eventRows.some((e) => e.id === b.eventId) && b.eventTitle && b.eventDate)
    eventRows.push({
      id: b.eventId,
      title: b.eventTitle,
      eventDate: b.eventDate,
      audience: 'members',
    });

  return (
    <div className="mx-auto max-w-2xl px-[22px] pb-6 pt-4 md:mx-0 md:max-w-[1040px] md:px-7 md:py-7">
      <Link
        href={`/admin/messages/${b.id}`}
        className="mb-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-gold-deep transition-colors hover:text-brand dark:hover:text-gold-light"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t('SMS message')}
      </Link>
      <PageHead
        en="Edit scheduled message"
        am="የታቀደ መልዕክት ማስተካከያ"
        sub="Change the text, who gets it or when it goes out."
      />
      <ComposeForm
        status={smsStatus()}
        events={eventRows}
        ownPhoneMasked={phone ? maskPhone(phone) : null}
        today={todayYmd()}
        editing={{
          id: b.id,
          audience: b.audience,
          eventId: b.eventId,
          text: b.text,
          date: eatDate(b.scheduledAt),
          time: eatTime(b.scheduledAt),
        }}
      />
    </div>
  );
}
