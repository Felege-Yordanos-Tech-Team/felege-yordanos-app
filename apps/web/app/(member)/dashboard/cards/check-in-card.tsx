import { Card, Eyebrow } from '@/components/ds';
import { MemberQR } from '@/components/member-qr';
import { getT } from '@/lib/i18n/server';

/** Right-column compact check-in card: QR + code. Only shown for linked members. */
export async function CheckInCard({ memberId }: { memberId: string }) {
  const t = await getT();
  return (
    <Card className="flex items-center gap-4">
      <div className="shrink-0 rounded-xl border border-gold/30 bg-parchment p-2">
        <MemberQR value={memberId} size={96} />
      </div>
      <div className="min-w-0">
        <Eyebrow>{t('Check-in code')}</Eyebrow>
        <div className="mt-1 font-mono text-lg font-semibold tracking-[0.05em] text-brand-ink">
          {memberId}
        </div>
        <p className="mt-1 text-[11.5px] leading-snug text-ink-muted">
          {t('Show this code at the door to check in.')}
        </p>
      </div>
    </Card>
  );
}
