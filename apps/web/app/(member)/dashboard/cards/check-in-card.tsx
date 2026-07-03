import { MemberQR } from '@/components/member-qr';

/** Right-column compact check-in card: QR + code. Only shown for linked members. */
export function CheckInCard({ memberId }: { memberId: string }) {
  return (
    <section className="gold-accent-t flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-fy-sm">
      <div className="shrink-0 rounded-xl border border-gold/30 bg-parchment-soft p-2">
        <MemberQR value={memberId} size={104} />
      </div>
      <div className="min-w-0">
        <div className="font-label text-[10px] font-semibold uppercase tracking-[0.14em] text-gold-deep dark:text-gold">
          Check-in code
        </div>
        <div className="mt-0.5 font-mono text-lg font-semibold tracking-[0.05em] text-burgundy-ink dark:text-cream">
          {memberId}
        </div>
        <p className="mt-1 text-[12px] leading-snug text-muted-foreground">
          Show this code at the door to check in.
        </p>
      </div>
    </section>
  );
}
