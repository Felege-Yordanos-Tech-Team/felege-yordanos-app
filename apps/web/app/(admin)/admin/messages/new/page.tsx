import Link from 'next/link';
import { redirect } from 'next/navigation';
import { desc, gte } from 'drizzle-orm';
import { ArrowLeft } from 'lucide-react';
import { db, events } from '@felege-yordanos/db/server';
import { PageHead } from '@/components/ds';
import { todayYmd } from '@/lib/events';
import { getT } from '@/lib/i18n/server';
import { canSendMessages } from '@/lib/permissions';
import { requireUser } from '@/lib/session';
import { ownPhone } from '@/lib/sms/message-queries';
import { maskPhone } from '@/lib/sms/phone';
import { smsStatus } from '@/lib/sms/transport';
import { ComposeForm } from './compose-form';

/** Compose an SMS broadcast. Permission: canSendMessages. */
export default async function NewMessagePage() {
  const user = await requireUser();
  if (!canSendMessages(user)) redirect('/admin');
  const t = await getT();

  // Events from a month ago on, for "people expected at an event".
  const from = new Date(Date.now() - 31 * 24 * 3600 * 1000);
  const [eventRows, phone] = await Promise.all([
    db
      .select({
        id: events.id,
        title: events.title,
        eventDate: events.eventDate,
        audience: events.audience,
      })
      .from(events)
      .where(gte(events.eventDate, todayYmd(from)))
      .orderBy(desc(events.eventDate))
      .limit(300),
    ownPhone(user),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-[22px] pb-6 pt-4 md:mx-0 md:max-w-[1040px] md:px-7 md:py-7">
      <Link
        href="/admin/messages"
        className="mb-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-gold-deep transition-colors hover:text-brand dark:hover:text-gold-light"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t('Messages')}
      </Link>
      <PageHead
        en="New message"
        am="አዲስ መልዕክት"
        sub="Sent as SMS from SMSHub’s shared sender name, signed FYSS."
      />
      <ComposeForm
        status={smsStatus()}
        events={eventRows}
        ownPhoneMasked={phone ? maskPhone(phone) : null}
        today={todayYmd()}
      />
    </div>
  );
}
