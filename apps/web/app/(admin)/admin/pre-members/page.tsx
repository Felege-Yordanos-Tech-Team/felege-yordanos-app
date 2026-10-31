import Link from 'next/link';
import { redirect } from 'next/navigation';
import { and, desc, ilike, inArray, or, sql, type SQL } from 'drizzle-orm';
import { ArrowLeft, Plus, Search } from 'lucide-react';
import {
  db,
  preMembers,
  type PreMemberStatus,
} from '@felege-yordanos/db/server';
import { Card, PageHead } from '@/components/ds';
import { primaryBtn } from '@/components/events/button-classes';
import { getLocale, getT } from '@/lib/i18n/server';
import { canManagePreMembers } from '@/lib/permissions';
import { preMemberFullName } from '@/lib/pre-members';
import { requireUser } from '@/lib/session';
import { cn } from '@/lib/utils';
import { PreMemberStatusPill } from './status-pill';
import { formatShortDate } from './format';

/** Tabs of the list: one or more statuses each. */
const TABS = {
  pending: { label: 'Pending', statuses: ['pending'] },
  active: { label: 'Active', statuses: ['active'] },
  promoted: { label: 'Promoted', statuses: ['promoted'] },
  closed: {
    label: 'Withdrawn / Rejected',
    statuses: ['withdrawn', 'rejected'],
  },
} as const satisfies Record<
  string,
  { label: string; statuses: readonly PreMemberStatus[] }
>;
type Tab = keyof typeof TABS;
const isTab = (v: string | undefined): v is Tab => !!v && v in TABS;

const PAGE_LIMIT = 200;

export default async function PreMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  const user = await requireUser();
  if (!canManagePreMembers(user)) redirect('/admin');
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const params = await searchParams;
  const tab: Tab = isTab(params.tab) ? params.tab : 'pending';
  const q = (params.q ?? '').trim().slice(0, 100);

  // Search by name (any of the three), ID, phone or email.
  const search: SQL | undefined = q
    ? or(
        ilike(
          sql`${preMembers.name} || ' ' || ${preMembers.fatherName} || ' ' || ${preMembers.grandfatherName}`,
          `%${q}%`,
        ),
        ilike(preMembers.code, `%${q}%`),
        ilike(preMembers.email, `%${q}%`),
        q.replace(/\D/g, '').length >= 3
          ? sql`regexp_replace(coalesce(${preMembers.phone}, ''), '[^0-9]', '', 'g') LIKE ${`%${q.replace(/\D/g, '')}%`}`
          : undefined,
      )
    : undefined;

  const [countRows, rows] = await Promise.all([
    db
      .select({ status: preMembers.status, n: sql<number>`count(*)::int` })
      .from(preMembers)
      .where(search)
      .groupBy(preMembers.status),
    db
      .select({
        id: preMembers.id,
        code: preMembers.code,
        status: preMembers.status,
        source: preMembers.source,
        name: preMembers.name,
        fatherName: preMembers.fatherName,
        grandfatherName: preMembers.grandfatherName,
        phone: preMembers.phone,
        email: preMembers.email,
        createdAt: preMembers.createdAt,
        linked: sql<boolean>`${preMembers.authUserId} IS NOT NULL`,
      })
      .from(preMembers)
      .where(and(inArray(preMembers.status, [...TABS[tab].statuses]), search))
      .orderBy(
        tab === 'pending' ? preMembers.createdAt : desc(preMembers.updatedAt),
      )
      .limit(PAGE_LIMIT),
  ]);

  const countOf = (statuses: readonly PreMemberStatus[]) =>
    countRows
      .filter((r) => statuses.includes(r.status))
      .reduce((n, r) => n + r.n, 0);

  const href = (next: Tab) => {
    const p = new URLSearchParams({ tab: next });
    if (q) p.set('q', q);
    return `/admin/pre-members?${p}`;
  };

  return (
    <div className="mx-auto max-w-2xl px-[22px] pb-6 pt-4 md:mx-0 md:max-w-none md:px-7 md:py-7">
      <Link
        href="/admin"
        className="mb-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-gold-deep transition-colors hover:text-brand md:hidden"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t('Admin panel')}
      </Link>
      <PageHead
        en="Pre-members"
        am="ቅድመ አባላት"
        sub="People learning at the school who are not registered members yet"
        actions={
          <Link
            href="/admin/pre-members/new"
            aria-label={t('Register')}
            className={cn(primaryBtn, 'px-3.5 py-2 text-[12.5px]')}
          >
            <Plus className="h-3.5 w-3.5 text-gold" />
            <span className="hidden sm:inline">{t('Register')}</span>
          </Link>
        }
      />

      {/* Search (GET, keeps the tab) */}
      <form action="/admin/pre-members" className="relative mb-3 md:max-w-sm">
        <input type="hidden" name="tab" value={tab} />
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
        <input
          name="q"
          defaultValue={q}
          placeholder={t('Name, ID, phone or email…')}
          aria-label={t('Search pre-members')}
          className="w-full rounded-[10px] border border-parchment-edge bg-parchment-soft py-[9px] pl-9 pr-3 text-[13px] text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-gold/30 dark:bg-parchment-deep"
        />
      </form>

      {/* Tabs */}
      <nav
        aria-label={t('Status')}
        className="-mx-[22px] mb-4 flex gap-1.5 overflow-x-auto px-[22px] [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {(Object.keys(TABS) as Tab[]).map((key) => {
          const active = key === tab;
          return (
            <Link
              key={key}
              href={href(key)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-[6px] text-[11.5px] transition-colors',
                locale === 'am' ? 'font-ethiopic' : 'font-body',
                active
                  ? 'bg-brand font-semibold text-cream'
                  : 'border border-parchment-edge bg-parchment-soft font-medium text-ink hover:bg-parchment-deep',
              )}
            >
              {t(TABS[key].label)}
              <span
                className={cn(
                  'font-mono text-[10px] tabular-nums',
                  active ? 'text-cream/75' : 'text-ink-muted',
                )}
              >
                {countOf(TABS[key].statuses)}
              </span>
            </Link>
          );
        })}
      </nav>

      {rows.length === 0 ? (
        <Card className="py-12 text-center text-sm text-ink-muted">
          {q
            ? t('No pre-members match your search.')
            : t('No pre-members here yet.')}
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden p-0 md:block">
            <div className="grid grid-cols-[150px_minmax(0,1.4fr)_minmax(0,1fr)_120px_110px] gap-3 border-b border-parchment-edge-strong px-5 py-3">
              {[
                t('ID'),
                t('Name'),
                t('Phone / email'),
                t('Registered'),
                t('Status'),
              ].map((h) => (
                <span
                  key={h}
                  className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-gold-deep"
                >
                  {h}
                </span>
              ))}
            </div>
            {rows.map((r) => (
              <Link
                key={r.id}
                href={`/admin/pre-members/${r.id}`}
                className="grid grid-cols-[150px_minmax(0,1.4fr)_minmax(0,1fr)_120px_110px] items-center gap-3 border-b border-parchment-edge px-5 py-3 transition-colors last:border-0 hover:bg-parchment-deep/60"
              >
                <span className="font-mono text-[11.5px] font-semibold text-ink">
                  {r.code ?? '—'}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-ethiopic text-[13px] font-medium text-ink">
                    {preMemberFullName(r)}
                  </span>
                  <span className="text-[10.5px] text-ink-muted">
                    {t(
                      r.source === 'self'
                        ? 'Self-registered'
                        : 'Registered by an admin',
                    )}
                    {r.linked && ` · ${t('Account linked')}`}
                  </span>
                </span>
                <span className="min-w-0 text-[11.5px] text-ink-muted">
                  <span className="block truncate font-mono">
                    {r.phone ?? '—'}
                  </span>
                  <span className="block truncate">{r.email ?? ''}</span>
                </span>
                <span className="font-mono text-[11px] text-ink-muted">
                  {formatShortDate(r.createdAt, locale)}
                </span>
                <PreMemberStatusPill status={r.status} />
              </Link>
            ))}
          </Card>

          {/* Phone cards */}
          <div className="flex flex-col gap-1.5 md:hidden">
            {rows.map((r) => (
              <Link
                key={r.id}
                href={`/admin/pre-members/${r.id}`}
                className="rounded-[12px] border border-parchment-edge bg-parchment-soft px-3.5 py-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-ethiopic text-[14px] font-semibold text-brand-ink">
                      {preMemberFullName(r)}
                    </div>
                    <div className="mt-0.5 font-mono text-[10.5px] text-ink-muted">
                      {r.code ?? t('No ID yet')} · {r.phone ?? '—'}
                    </div>
                  </div>
                  <PreMemberStatusPill status={r.status} />
                </div>
                <div className="mt-1.5 text-[10.5px] text-ink-muted">
                  {formatShortDate(r.createdAt, locale)} ·{' '}
                  {t(
                    r.source === 'self'
                      ? 'Self-registered'
                      : 'Registered by an admin',
                  )}
                </div>
              </Link>
            ))}
          </div>
          {rows.length === PAGE_LIMIT && (
            <p className="mt-3 text-center text-[11px] text-ink-muted">
              {t('Showing the first {n}. Search to narrow the list.', {
                n: PAGE_LIMIT,
              })}
            </p>
          )}
        </>
      )}
    </div>
  );
}
