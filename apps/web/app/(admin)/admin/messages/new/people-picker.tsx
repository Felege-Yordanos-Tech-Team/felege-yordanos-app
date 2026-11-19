'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { searchPeopleForSms } from '../actions';
import { Input } from '@/components/ui/input';
import { useT } from '@/lib/i18n/client';
import type { PersonKind } from '@/lib/audience';
import {
  MAX_SELECTED,
  searchText,
  targetKey,
  type PersonOption,
} from '@/lib/sms/selected-people';
import { cn } from '@/lib/utils';
import { memberTypeLabel, SKIP_LABEL } from '@/components/messages/format';

const fieldCls =
  'h-auto rounded-[10px] border border-parchment-edge bg-parchment-soft px-[13px] py-2.5 text-[13px] text-ink placeholder:text-ink-faint focus-visible:ring-2 focus-visible:ring-gold/30 dark:bg-parchment-deep';

const KINDS: { value: PersonKind | null; label: string }[] = [
  { value: null, label: 'All' },
  { value: 'member', label: 'Members' },
  { value: 'pre_member', label: 'Pre-members' },
];

/**
 * "Selected people" on the compose page: search (on the server, at most 20
 * results, masked numbers), tick up to MAX_SELECTED people, remove them
 * again. People who cannot get SMS are shown but cannot be ticked.
 */
export function PeoplePicker({
  chosen,
  onChange,
  memberTypes,
}: {
  chosen: PersonOption[];
  onChange: (next: PersonOption[]) => void;
  memberTypes: { id: number; name: string }[];
}) {
  const t = useT();
  const ids = useId();
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<PersonKind | null>(null);
  const [typeId, setTypeId] = useState<number | null>(null);
  const [results, setResults] = useState<PersonOption[]>([]);
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  const request = useRef(0);

  // Debounced search; only the newest answer is shown.
  useEffect(() => {
    const text = searchText(q);
    const id = ++request.current;
    if (!text) {
      setResults([]);
      setState('idle');
      return;
    }
    setState('loading');
    const timer = setTimeout(async () => {
      const res = await searchPeopleForSms({
        q: text,
        kind,
        memberTypeId: kind === 'pre_member' ? null : typeId,
      });
      if (id !== request.current) return;
      if (res.ok) {
        setResults(res.data);
        setState('done');
      } else {
        setResults([]);
        setError(res.error);
        setState('error');
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [q, kind, typeId]);

  const chosenKeys = new Set(chosen.map(targetKey));
  const full = chosen.length >= MAX_SELECTED;

  function toggle(p: PersonOption) {
    const key = targetKey(p);
    if (chosenKeys.has(key)) onChange(chosen.filter((c) => targetKey(c) !== key));
    else if (!p.reason && !full) onChange([...chosen, p]);
  }

  const status =
    state === 'idle'
      ? t('Type at least 2 letters of a name, a father’s name or an ID.')
      : state === 'loading'
        ? t('Searching…')
        : state === 'error'
          ? t(error)
          : results.length === 0
            ? t('Nobody found.')
            : results.length >= 20
              ? t('The first 20. Type more to narrow it down.')
              : t('{n} found', { n: results.length });

  return (
    <div className="mt-3 space-y-2.5">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 z-[1] h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
        <Input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('Name, father’s name or ID…')}
          aria-label={t('Search people')}
          aria-describedby={`${ids}-status`}
          autoComplete="off"
          className={cn(fieldCls, 'pl-[34px]')}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div role="radiogroup" aria-label={t('Kind')} className="flex gap-1">
          {KINDS.map((k) => (
            <button
              key={String(k.value)}
              type="button"
              role="radio"
              aria-checked={kind === k.value}
              onClick={() => setKind(k.value)}
              className={cn(
                'rounded-full px-2.5 py-[5px] text-[11.5px] transition-colors',
                kind === k.value
                  ? 'bg-brand-ink font-semibold text-cream dark:bg-gold dark:text-ink'
                  : 'border border-parchment-edge bg-parchment-soft font-medium text-ink hover:bg-parchment-deep',
              )}
            >
              {t(k.label)}
            </button>
          ))}
        </div>
        <label htmlFor={`${ids}-type`} className="sr-only">
          {t('Member type')}
        </label>
        <select
          id={`${ids}-type`}
          value={kind === 'pre_member' ? '' : (typeId ?? '')}
          disabled={kind === 'pre_member'}
          onChange={(e) => setTypeId(e.target.value ? Number(e.target.value) : null)}
          className="w-full rounded-[10px] border border-parchment-edge bg-parchment-soft px-2.5 py-[6px] text-[12px] text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/30 disabled:opacity-50 dark:bg-parchment-deep sm:w-auto"
        >
          <option value="">{t('All member types')}</option>
          {memberTypes.map((mt) => (
            <option key={mt.id} value={mt.id}>
              {t(memberTypeLabel(mt.name))}
            </option>
          ))}
        </select>
      </div>

      <p id={`${ids}-status`} aria-live="polite" className="text-[11px] text-ink-muted">
        {status}
      </p>

      {results.length > 0 && (
        <ul
          aria-label={t('Search results')}
          className="max-h-64 overflow-y-auto rounded-[10px] border border-parchment-edge"
        >
          {results.map((p) => {
            const key = targetKey(p);
            const checked = chosenKeys.has(key);
            const disabled = !checked && (!!p.reason || full);
            return (
              <li key={key} className="border-b border-parchment-edge last:border-b-0">
                <label
                  className={cn(
                    'flex items-center gap-3 px-3 py-2',
                    disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-parchment-deep/60',
                    checked && 'bg-brand/10 dark:bg-gold/10',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => toggle(p)}
                    className="h-4 w-4 shrink-0 cursor-pointer accent-[rgb(var(--fy-brand))] disabled:cursor-not-allowed"
                  />
                  <PersonLine p={p} muted={!!p.reason} />
                  {p.reason && (
                    <span className="shrink-0 text-right text-[10.5px] font-medium text-status-absent">
                      {t(SKIP_LABEL[p.reason])}
                    </span>
                  )}
                </label>
              </li>
            );
          })}
        </ul>
      )}

      <section aria-label={t('Chosen people')} className="rounded-[10px] border border-parchment-edge">
        <div className="flex items-center justify-between gap-2 border-b border-parchment-edge px-3 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gold-deep">
            {t('Chosen')} ·{' '}
            <span className="font-mono">
              {chosen.length}/{MAX_SELECTED}
            </span>
          </span>
          {chosen.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-[11.5px] font-medium text-gold-deep hover:text-brand dark:hover:text-gold-light"
            >
              {t('Clear all')}
            </button>
          )}
        </div>
        {chosen.length === 0 ? (
          <p className="px-3 py-3 text-[12px] text-ink-muted">{t('Nobody chosen yet.')}</p>
        ) : (
          <ul className="max-h-64 divide-y divide-parchment-edge overflow-y-auto">
            {chosen.map((p) => (
              <li key={targetKey(p)} className="flex items-center gap-3 px-3 py-2">
                <PersonLine p={p} muted={false} />
                {p.reason && (
                  <span className="shrink-0 text-[10.5px] font-medium text-status-absent">
                    {t(SKIP_LABEL[p.reason])}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => toggle(p)}
                  aria-label={t('Remove {name}', { name: `${p.name} ${p.fatherName}` })}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-ink-muted hover:bg-parchment-deep hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
        {full && (
          <p className="border-t border-parchment-edge px-3 py-2 text-[11px] text-status-late">
            {t('At most 200 people per message.')}
          </p>
        )}
      </section>
    </div>
  );
}

function PersonLine({ p, muted }: { p: PersonOption; muted: boolean }) {
  const t = useT();
  return (
    <span className={cn('min-w-0 flex-1', muted && 'opacity-60')}>
      <span className="block truncate text-[12.5px] font-medium text-ink">
        {p.name} {p.fatherName}
      </span>
      <span className="mt-0.5 flex flex-wrap gap-x-2 font-mono text-[10.5px] text-ink-muted">
        <span>{p.code}</span>
        {p.phone && <span>{p.phone}</span>}
        {p.kind === 'pre_member' ? (
          <span className="font-body text-pre">{t('Pre-member')}</span>
        ) : (
          p.memberType && <span className="font-body">{t(memberTypeLabel(p.memberType))}</span>
        )}
      </span>
    </span>
  );
}
