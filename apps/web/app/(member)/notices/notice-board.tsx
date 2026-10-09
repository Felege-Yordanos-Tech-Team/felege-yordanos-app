'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CalendarDays,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  Pencil,
  Pin,
  Plus,
} from 'lucide-react';
import { Card, Chip, PageHead, StatusPill } from '@/components/ds';
import { useNoticeDepartment } from '@/components/notices/notice-card';
import {
  NoticeCategoryChip,
  UnreadDot,
} from '@/components/notices/notice-category';
import {
  NoticeFormDialog,
  type PostableDepartment,
} from '@/components/notices/notice-form-dialog';
import { hasEthiopic } from '@/lib/category-color';
import { useLocale, useT } from '@/lib/i18n/client';
import { intlLocale } from '@/lib/i18n/config';
import { mediaUrl } from '@/lib/media';
import type { NoticeView } from '@/lib/notices';
import { cn } from '@/lib/utils';
import { markNoticeRead } from './actions';

type Filter = 'all' | 'everyone' | number;

const NEW_BTN =
  'sacred-gradient inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border border-gold/40 text-[13px] font-semibold tracking-[0.04em] text-cream shadow-[0_6px_16px_-6px_rgba(10,60,54,0.4),inset_0_1px_0_rgba(212,168,67,0.25)] transition-opacity hover:opacity-95';

/** md and up: the split view; below: the carousel. */
function useIsDesktop() {
  const [desktop, setDesktop] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return desktop;
}

function useNoticeDates() {
  const locale = useLocale();
  const tz = 'Africa/Addis_Ababa';
  return useMemo(
    () => ({
      long: new Intl.DateTimeFormat(intlLocale(locale), {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: tz,
      }),
      short: new Intl.DateTimeFormat(intlLocale(locale), {
        day: '2-digit',
        month: 'short',
        timeZone: tz,
      }),
      day: new Intl.DateTimeFormat('en-US', { day: 'numeric', timeZone: tz }),
      month: new Intl.DateTimeFormat(intlLocale(locale), {
        month: 'short',
        timeZone: tz,
      }),
    }),
    [locale],
  );
}

/**
 * The notice board. Desktop: the selected notice large on the left, the
 * latest notices in a scrolling list on the right. Phones: one notice per
 * card, swipe or use the arrows under it. Long messages scroll inside the
 * card. Opening a notice marks it read.
 */
export function NoticeBoard({
  notices,
  canManage,
  departments,
  canPostToEveryone,
}: {
  notices: NoticeView[];
  canManage: boolean;
  departments: PostableDepartment[];
  canPostToEveryone: boolean;
}) {
  const t = useT();
  const locale = useLocale();
  const department = useNoticeDepartment();
  const desktop = useIsDesktop();
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [slide, setSlide] = useState(0);
  const [readIds, setReadIds] = useState(
    () => new Set(notices.filter((n) => n.read).map((n) => n.id)),
  );
  const [dialog, setDialog] = useState<{ notice: NoticeView | null } | null>(
    null,
  );
  const carousel = useRef<HTMLDivElement>(null);

  // Keep notices the server reports as read (after a refresh) marked read.
  useEffect(() => {
    setReadIds((prev) => {
      const next = new Set(prev);
      for (const n of notices) if (n.read) next.add(n.id);
      return next;
    });
  }, [notices]);

  const chips = useMemo(() => {
    const seen = new Map<number, NoticeView>();
    let everyone = false;
    for (const n of notices) {
      if (n.departmentId === null) everyone = true;
      else if (!seen.has(n.departmentId)) seen.set(n.departmentId, n);
    }
    return { everyone, departments: [...seen.entries()] };
  }, [notices]);

  const shown = notices.filter((n) =>
    filter === 'all'
      ? true
      : filter === 'everyone'
        ? n.departmentId === null
        : n.departmentId === filter,
  );
  // Default: the newest pinned active notice, else the newest.
  const fallback = shown.find((n) => n.pinned && !n.expired) ?? shown[0] ?? null;
  const selected = shown.find((n) => n.id === selectedId) ?? fallback;
  const current = desktop ? selected : (shown[slide] ?? null);
  const unread = notices.filter((n) => !n.expired && !readIds.has(n.id)).length;

  // Mark the notice on screen as read (once).
  useEffect(() => {
    if (desktop === null || !current || readIds.has(current.id)) return;
    const id = current.id;
    setReadIds((prev) => new Set(prev).add(id));
    void markNoticeRead(id);
  }, [desktop, current, readIds]);

  // New filter: back to the first card.
  useEffect(() => {
    setSlide(0);
    carousel.current?.scrollTo({ left: 0 });
  }, [filter]);

  function goTo(index: number) {
    const el = carousel.current;
    const card = el?.children[index] as HTMLElement | undefined;
    if (el && card) el.scrollTo({ left: card.offsetLeft - el.offsetLeft - 22, behavior: 'smooth' });
  }

  function onCarouselScroll() {
    const el = carousel.current;
    const first = el?.children[0] as HTMLElement | undefined;
    if (!el || !first) return;
    const step = first.offsetWidth + 12; // card + gap-3
    setSlide(Math.max(0, Math.min(shown.length - 1, Math.round(el.scrollLeft / step))));
  }

  const head = (
    <PageHead
      en="Notice board"
      am="የማስታወቂያ ሰሌዳ"
      sub="Announcements from the parish council and departments"
      className="max-md:[&_p]:hidden"
      actions={
        <>
          {unread > 0 && (
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/[0.16] px-3 py-1.5 text-[12px] font-semibold text-gold-deep md:px-4 md:py-2 md:text-[13px]">
              <span className="h-[7px] w-[7px] rounded-full bg-gold" />
              <span className="font-mono">{unread}</span>
              <span className={cn('hidden md:inline', locale === 'am' && 'font-ethiopic')}>
                {t('unread')}
              </span>
            </span>
          )}
          {canManage && (
            <button
              type="button"
              onClick={() => setDialog({ notice: null })}
              className={cn(NEW_BTN, 'h-11 w-11 rounded-full md:h-auto md:w-auto md:rounded-md md:px-4 md:py-[10px]')}
              aria-label={t('New notice')}
            >
              <Plus className="h-4 w-4 text-gold" />
              <span className="hidden md:inline">{t('New notice')}</span>
            </button>
          )}
        </>
      }
    />
  );

  const dialogEl = canManage && (
    <NoticeFormDialog
      open={!!dialog}
      onOpenChange={(open) => !open && setDialog(null)}
      notice={dialog?.notice ?? null}
      departments={departments}
      canPostToEveryone={canPostToEveryone}
    />
  );

  if (notices.length === 0) {
    return (
      <>
        {head}
        <EmptyBoard />
        {dialogEl}
      </>
    );
  }

  return (
    <>
      {head}

      {(chips.departments.length > 0 || chips.everyone) && (
        <div className="-mx-[22px] mb-4 flex gap-1.5 overflow-x-auto px-[22px] pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0 [&::-webkit-scrollbar]:hidden">
          <Chip active={filter === 'all'} onClick={() => setFilter('all')} amharic={locale === 'am'}>
            {t('All')}
          </Chip>
          {chips.everyone && (
            <Chip
              active={filter === 'everyone'}
              onClick={() => setFilter('everyone')}
              amharic={locale === 'am'}
            >
              {t('Everyone')}
            </Chip>
          )}
          {chips.departments.map(([id, n]) => (
            <Chip
              key={id}
              active={filter === id}
              onClick={() => setFilter(id)}
              amharic={locale === 'am'}
            >
              {department(n)}
            </Chip>
          ))}
        </div>
      )}

      {shown.length === 0 ? (
        <p className="py-10 text-center text-[12.5px] text-ink-muted">
          {t('No notices for this department.')}
        </p>
      ) : (
        <>
          {/* ─── Desktop: featured + latest list ─── */}
          <div className="hidden h-[calc(100dvh-250px)] min-h-[560px] grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] gap-5 md:grid">
            {selected && (
              <FeaturedNotice
                notice={selected}
                variant="desktop"
                onEdit={() => setDialog({ notice: selected })}
              />
            )}
            <div className="flex min-h-0 flex-col">
              <div className="mb-3 flex items-center gap-3">
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-gold-deep">
                  {t('Latest')}
                </span>
                <span className="h-px flex-1 bg-parchment-edge" />
                <span className="font-mono text-[11px] text-ink-muted">{shown.length}</span>
              </div>
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pb-1 pr-1">
                {shown.map((n) => (
                  <NoticeListItem
                    key={n.id}
                    notice={n}
                    unread={!n.expired && !readIds.has(n.id)}
                    active={n.id === selected?.id}
                    onSelect={() => setSelectedId(n.id)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ─── Phone: carousel + pager ─── */}
          <div className="md:hidden">
            <div
              ref={carousel}
              onScroll={onCarouselScroll}
              className="-mx-[22px] flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-[22px] px-[22px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {shown.map((n) => (
                <FeaturedNotice
                  key={n.id}
                  notice={n}
                  variant="mobile"
                  unread={!n.expired && !readIds.has(n.id)}
                  onEdit={() => setDialog({ notice: n })}
                  className="w-full shrink-0 snap-center"
                />
              ))}
            </div>
            <div className="mt-3.5 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => goTo(slide - 1)}
                disabled={slide === 0}
                aria-label={t('Previous')}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-parchment-edge bg-parchment-soft text-brand transition-opacity disabled:opacity-35 dark:text-gold"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {shown.length <= 10 && (
                <div className="flex items-center gap-1.5">
                  {shown.map((n, i) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => goTo(i)}
                      aria-label={`${i + 1}`}
                      className={cn(
                        'h-[7px] rounded-full transition-all',
                        i === slide ? 'w-6 bg-status-absent' : 'w-[7px] bg-parchment-edge-strong',
                      )}
                    />
                  ))}
                </div>
              )}
              <span className="font-mono text-[12px] text-ink-muted">
                {String(slide + 1).padStart(2, '0')} / {String(shown.length).padStart(2, '0')}
              </span>
              <button
                type="button"
                onClick={() => goTo(slide + 1)}
                disabled={slide >= shown.length - 1}
                aria-label={t('Next')}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-parchment-edge bg-parchment-soft text-brand transition-opacity disabled:opacity-35 dark:text-gold"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
      {dialogEl}
    </>
  );
}

/** The big green card: desktop's selected notice, one carousel card on phones. */
function FeaturedNotice({
  notice,
  variant,
  unread,
  onEdit,
  className,
}: {
  notice: NoticeView;
  variant: 'desktop' | 'mobile';
  unread?: boolean;
  onEdit: () => void;
  className?: string;
}) {
  const t = useT();
  const locale = useLocale();
  const department = useNoticeDepartment();
  const dates = useNoticeDates();
  const desktop = variant === 'desktop';
  const am = hasEthiopic(notice.title);

  const image = notice.imageKey && (
    <img
      src={mediaUrl(notice.imageKey)}
      alt=""
      loading="lazy"
      className={cn(
        'w-full shrink-0 rounded-lg border border-gold/20 object-cover',
        desktop ? 'aspect-[21/8] max-h-[36%]' : 'aspect-[16/9]',
      )}
    />
  );

  return (
    <article
      className={cn(
        'sacred-gradient relative flex flex-col overflow-hidden rounded-xl border border-gold/30 text-cream shadow-[0_14px_36px_-16px_rgba(10,60,54,0.55)]',
        desktop ? 'min-h-0' : 'h-[calc(100dvh-330px)] min-h-[440px]',
        notice.expired && 'opacity-80',
        className,
      )}
    >
      <div className="tibeb-gold pointer-events-none absolute inset-0 opacity-40" aria-hidden />
      <div className={cn('relative flex min-h-0 flex-1 flex-col', desktop ? 'gap-5 p-7' : 'p-5')}>
        {desktop && image}

        {/* Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <NoticeCategoryChip category={notice.category} onDark />
          {notice.pinned && (
            <span className={cn('inline-flex items-center gap-1 text-[11.5px] font-semibold text-gold-light', locale === 'am' && 'font-ethiopic')}>
              <Pin className="h-3 w-3" />
              {desktop ? t('Pinned') : t('Pinned notice')}
            </span>
          )}
          {notice.expired && <StatusPill tone="neutral">{t('Expired')}</StatusPill>}
          {!desktop && (
            <span className="ml-auto flex items-center gap-1.5">
              {unread && <UnreadDot />}
              <span className="font-mono text-[11.5px] text-cream/75">
                {dates.short.format(new Date(notice.createdAt))}
              </span>
            </span>
          )}
        </div>

        {/* Title */}
        <h2
          className={cn(
            'break-words leading-[1.12] text-cream',
            am ? 'font-ethiopic font-semibold' : 'font-display font-medium',
            desktop
              ? am ? 'text-[30px]' : 'text-[34px]'
              : am ? 'mt-3 text-[24px]' : 'mt-3 text-[28px]',
          )}
        >
          {notice.title}
        </h2>

        {/* Summary, image (phones) and message: scrolls when long */}
        <div
          className={cn(
            'min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 [scrollbar-color:rgb(var(--fy-gold)/0.4)_transparent]',
            !desktop && 'mt-3 border-t border-gold/25 pt-4',
          )}
        >
          {!desktop && image && <div className="mb-4">{image}</div>}
          {notice.summary && (
            <p
              className={cn(
                'mb-3 whitespace-pre-line break-words font-semibold leading-relaxed text-cream',
                hasEthiopic(notice.summary) && 'font-ethiopic',
                desktop ? 'text-[17px]' : 'text-[16px]',
              )}
            >
              {notice.summary}
            </p>
          )}
          <p
            className={cn(
              'whitespace-pre-line break-words leading-[1.8] text-cream/85',
              hasEthiopic(notice.body) && 'font-ethiopic',
              desktop ? 'text-[14.5px]' : 'text-[14px]',
            )}
          >
            {notice.body}
          </p>
        </div>

        {/* Footer */}
        <div
          className={cn(
            'flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-gold/25 text-[12px] text-cream/70',
            desktop ? 'pt-4' : 'mt-3 pt-3.5',
          )}
        >
          {desktop && (
            <span className="inline-flex items-center gap-1.5 font-mono">
              <CalendarDays className="h-3.5 w-3.5 text-gold-light" />
              {dates.long.format(new Date(notice.createdAt))}
            </span>
          )}
          <span className={cn(locale === 'am' && 'font-ethiopic')}>{department(notice)}</span>
          {notice.authorName && desktop && (
            <span>
              {t('Posted by')} <span className="text-cream">{notice.authorName}</span>
            </span>
          )}
          {notice.expiresAt && (
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="h-3.5 w-3.5 text-gold-light" />
              {t('Until')} {dates.long.format(new Date(notice.expiresAt))}
            </span>
          )}
          {notice.canEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="ml-auto inline-flex items-center gap-1.5 font-semibold text-gold hover:underline"
            >
              <Pencil className="h-3.5 w-3.5" />
              {t('Edit')}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

/** One row of the desktop "Latest" list. */
function NoticeListItem({
  notice,
  unread,
  active,
  onSelect,
}: {
  notice: NoticeView;
  unread: boolean;
  active: boolean;
  onSelect: () => void;
}) {
  const t = useT();
  const locale = useLocale();
  const department = useNoticeDepartment();
  const dates = useNoticeDates();
  const created = new Date(notice.createdAt);
  const preview = notice.summary || notice.body;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active || undefined}
      className={cn(
        'grid w-full grid-cols-[34%_1fr] overflow-hidden rounded-lg border bg-parchment-soft text-left shadow-[0_1px_0_rgba(10,60,54,0.04),0_4px_14px_-8px_rgba(10,60,54,0.12)] transition-colors hover:bg-parchment-soft/70 dark:bg-parchment-deep',
        active ? 'border-gold ring-1 ring-gold/50' : 'border-parchment-edge',
        notice.expired && 'opacity-70',
      )}
    >
      {notice.imageKey ? (
        <img src={mediaUrl(notice.imageKey)} alt="" loading="lazy" className="h-full min-h-[120px] w-full object-cover" />
      ) : (
        <span className="flex h-full min-h-[120px] flex-col items-center justify-center border-r border-parchment-edge bg-parchment-deep/60">
          <span className="font-display text-[32px] font-medium leading-none text-brand dark:text-gold">
            {dates.day.format(created)}
          </span>
          <span className={cn('mt-1 text-[11px] text-gold-deep', locale === 'am' && 'font-ethiopic')}>
            {dates.month.format(created)}
          </span>
        </span>
      )}
      <span className="min-w-0 p-4">
        <span className="flex items-center gap-2">
          <NoticeCategoryChip category={notice.category} />
          {unread && <UnreadDot />}
          {notice.pinned && <Pin className="h-3 w-3 text-gold-deep" />}
          {notice.expired && <StatusPill tone="neutral">{t('Expired')}</StatusPill>}
          <span className="ml-auto shrink-0 font-mono text-[11px] text-ink-muted">
            {dates.short.format(created)}
          </span>
        </span>
        <span
          className={cn(
            'mt-2 line-clamp-2 break-words leading-snug text-brand-ink',
            hasEthiopic(notice.title) ? 'font-ethiopic text-[16px] font-semibold' : 'font-display text-[18px] font-medium',
          )}
        >
          {notice.title}
        </span>
        <span
          className={cn(
            'mt-1 line-clamp-2 break-words text-[12.5px] leading-relaxed text-ink-muted',
            hasEthiopic(preview) && 'font-ethiopic',
          )}
        >
          {preview}
        </span>
        <span className={cn('mt-1.5 block truncate text-[11px] text-ink-faint', locale === 'am' && 'font-ethiopic')}>
          {department(notice)}
        </span>
      </span>
    </button>
  );
}

function EmptyBoard() {
  const t = useT();
  const locale = useLocale();
  return (
    <Card className="relative flex flex-col items-center overflow-hidden px-6 py-16 text-center md:py-20">
      <div className="tibeb-gold pointer-events-none absolute inset-0 opacity-40" aria-hidden />
      <div className="relative mb-4 rounded-full border border-gold/30 bg-gold/10 p-3.5 text-gold-deep">
        <Megaphone className="h-6 w-6" />
      </div>
      <p
        className={cn(
          'relative leading-tight text-brand-ink',
          locale === 'am' ? 'font-ethiopic text-[19px] font-semibold' : 'font-display text-[22px] font-medium',
        )}
      >
        {t('No notices yet')}
      </p>
      <p className="relative mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-ink-muted">
        {t('Announcements from the parish council and departments will appear here.')}
      </p>
    </Card>
  );
}
