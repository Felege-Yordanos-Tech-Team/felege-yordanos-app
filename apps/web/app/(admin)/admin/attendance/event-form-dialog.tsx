'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { departments, events, Role } from '@felege-yordanos/db/schema';
import { CalendarClock, Repeat, Trash2, TriangleAlert } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  type Recurrence,
  cadencePhrase,
  generateOccurrences,
  maxRecurrenceUntil,
  parseYmd,
  toYmd,
  todayYmd,
} from '@/lib/events';
import {
  createEvent,
  deleteEvent,
  updateEvent,
  updateSeriesEnd,
} from './actions';

type EventRow = typeof events.$inferSelect;
type Department = typeof departments.$inferSelect;

type RepeatChoice = 'none' | Recurrence;

const REPEAT_OPTIONS: { value: RepeatChoice; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly' },
  { value: 'monthly', label: 'Monthly' },
];

interface EventFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  event: EventRow | null;
  defaultDate?: string | null;
  departments: Department[];
  userRole: Role;
  userDeptId: number | null;
  /** All occurrences sharing the edited event's recurrence_group. */
  seriesEvents: EventRow[];
  /** Event ids that already have attendance — never delete/regenerate these. */
  attendedIds: Set<string>;
}

const labelCls =
  'text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep dark:text-gold';

/** Add whole months, clamping the day. Used for the default Until. */
function addMonths(ymd: string, months: number): string {
  const d = parseYmd(ymd);
  const first = new Date(d.getFullYear(), d.getMonth() + months, 1);
  const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  return toYmd(
    new Date(
      first.getFullYear(),
      first.getMonth(),
      Math.min(d.getDate(), days),
    ),
  );
}

function formatLong(ymd: string): string {
  try {
    return parseYmd(ymd).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return ymd;
  }
}

export function EventFormDialog({
  open,
  onOpenChange,
  mode,
  event,
  defaultDate,
  departments,
  userRole,
  userDeptId,
  seriesEvents,
  attendedIds,
}: EventFormDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
  const isDeptHead = userRole === 'dept_head';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [deptId, setDeptId] = useState('');
  const [repeat, setRepeat] = useState<RepeatChoice>('none');
  const [until, setUntil] = useState('');
  const [seriesUntil, setSeriesUntil] = useState('');
  const [busy, setBusy] = useState(false);

  const inSeries = mode === 'edit' && !!event?.recurrenceGroup;

  // Reset the form whenever the dialog opens for a new target.
  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && event) {
      setTitle(event.title);
      setDescription(event.description ?? '');
      setEventDate(event.eventDate);
      setStartTime(event.startTime?.slice(0, 5) ?? '');
      setEndTime(event.endTime?.slice(0, 5) ?? '');
      setDeptId(event.departmentId ? String(event.departmentId) : '');
      setRepeat('none');
      setUntil('');
      setSeriesUntil(event.recurrenceUntil ?? '');
    } else {
      setTitle('');
      setDescription('');
      setEventDate(defaultDate ?? '');
      setStartTime('');
      setEndTime('');
      setDeptId(userDeptId ? String(userDeptId) : '');
      setRepeat('none');
      setUntil('');
      setSeriesUntil('');
    }
  }, [open, mode, event, defaultDate, userDeptId]);

  function getDeptName(id: number | null): string {
    if (!id) return 'General';
    return departments.find((d) => d.id === id)?.nameAm ?? 'Unknown';
  }

  // ── Create: live recurrence preview ─────────────────────────────────────────
  const maxUntil = eventDate ? maxRecurrenceUntil(eventDate) : '';
  const cappedUntil = until && maxUntil && until > maxUntil ? maxUntil : until;
  const isCapped = !!until && !!maxUntil && until > maxUntil;
  const recurring = repeat !== 'none';
  const occurrences =
    recurring && eventDate && cappedUntil
      ? generateOccurrences(eventDate, repeat as Recurrence, cappedUntil)
      : [];
  const occCount = occurrences.length;

  function onRepeatChange(next: RepeatChoice) {
    setRepeat(next);
    if (next !== 'none' && eventDate && !until) {
      // Sensible default: 3 months out, clamped to the 12-month cap.
      const def = addMonths(eventDate, 3);
      setUntil(
        def > maxRecurrenceUntil(eventDate)
          ? maxRecurrenceUntil(eventDate)
          : def,
      );
    }
  }

  // ── Submit (create) ─────────────────────────────────────────────────────────
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await createEvent({
      title,
      description: description || null,
      eventDate,
      startTime: startTime || null,
      endTime: endTime || null,
      departmentId: deptId ? Number(deptId) : null,
      recurrence: recurring ? (repeat as Recurrence) : null,
      until: recurring ? cappedUntil || null : null,
    });

    setBusy(false);
    if (!res.ok) {
      toast({ title: 'Error', description: res.error, variant: 'destructive' });
      return;
    }
    toast({
      title: recurring ? `${res.data.count} events created` : 'Event created',
      description: title,
    });
    onOpenChange(false);
    router.refresh();
  }

  // ── Submit (edit one occurrence) ────────────────────────────────────────────
  async function handleUpdate() {
    if (!event) return;
    setBusy(true);
    const res = await updateEvent(event.id, {
      title,
      description: description || null,
      eventDate,
      startTime: startTime || null,
      endTime: endTime || null,
      departmentId: deptId ? Number(deptId) : null,
    });
    setBusy(false);
    if (!res.ok) {
      toast({ title: 'Error', description: res.error, variant: 'destructive' });
      return;
    }
    toast({ title: 'Event updated', description: title });
    onOpenChange(false);
    router.refresh();
  }

  // ── Series: extend / shorten the end date ───────────────────────────────────
  async function handleSeriesEnd() {
    if (!event?.recurrenceGroup || !event.recurrence) return;
    const newUntil = seriesUntil;
    if (!newUntil) return;

    setBusy(true);
    const res = await updateSeriesEnd({ eventId: event.id, until: newUntil });
    setBusy(false);
    if (!res.ok) {
      toast({ title: 'Error', description: res.error, variant: 'destructive' });
      return;
    }

    const { added, removed, kept } = res.data;
    if (added === 0 && removed === 0) {
      toast({ title: 'No change', description: 'Series already ends there.' });
      return;
    }

    toast({
      title: 'Series updated',
      description:
        (added ? `+${added} added. ` : '') +
        (removed ? `${removed} removed. ` : '') +
        (kept ? `${kept} kept (has attendance).` : ''),
    });
    onOpenChange(false);
    router.refresh();
  }

  // ── Delete a single occurrence (attendance-guarded) ─────────────────────────
  async function handleDelete() {
    if (!event) return;
    if (attendedIds.has(event.id)) {
      toast({
        title: 'Cannot delete',
        description: 'This event already has attendance recorded.',
        variant: 'destructive',
      });
      return;
    }
    setBusy(true);
    const res = await deleteEvent(event.id);
    setBusy(false);
    if (!res.ok) {
      toast({ title: 'Error', description: res.error, variant: 'destructive' });
      return;
    }
    toast({ title: 'Event deleted', description: event.title });
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 border-border bg-background p-0 max-sm:!left-0 max-sm:!right-0 max-sm:!top-auto max-sm:!bottom-0 max-sm:!w-full max-sm:!max-w-none max-sm:!translate-x-0 max-sm:!translate-y-0 max-sm:!rounded-3xl max-sm:!rounded-b-none sm:max-w-md">
        {/* Mobile drag handle */}
        <div className="mx-auto mt-2.5 h-1 w-9 rounded-full bg-ink-faint/30 sm:hidden" />

        <div className="max-h-[85vh] overflow-y-auto px-5 pb-5 pt-3 sm:px-6 sm:pt-5">
          {/* Header */}
          <div className="mb-4">
            <div className="font-ethiopic text-xs font-medium tracking-[0.06em] text-gold-deep dark:text-gold">
              {mode === 'create' ? 'አዲስ ስብሰባ' : 'ስብሰባ አርትዕ'}
            </div>
            <DialogTitle className="font-display text-2xl font-medium leading-tight text-burgundy-ink dark:text-cream">
              {mode === 'create' ? 'Create event' : 'Edit event'}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {mode === 'create'
                ? 'Create a new event, optionally recurring.'
                : 'Edit this event or manage its recurring series.'}
            </DialogDescription>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (mode === 'create') handleCreate(e);
              else handleUpdate();
            }}
            className="space-y-3.5"
          >
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="ev-title" className={labelCls}>
                Title
              </Label>
              <Input
                id="ev-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Sunday Service"
                required
              />
            </div>

            {/* Date / Start / End */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="space-y-1.5">
                <Label htmlFor="ev-date" className={labelCls}>
                  Date
                </Label>
                <Input
                  id="ev-date"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ev-start" className={labelCls}>
                  Start
                </Label>
                <Input
                  id="ev-start"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ev-end" className={labelCls}>
                  End
                </Label>
                <Input
                  id="ev-end"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            {/* Department */}
            <div className="space-y-1.5">
              <Label className={labelCls}>Department</Label>
              {isDeptHead ? (
                <p className="text-sm text-muted-foreground">
                  {getDeptName(userDeptId)}
                </p>
              ) : (
                <Select value={deptId} onValueChange={setDeptId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.nameAm}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="ev-desc" className={labelCls}>
                Description{' '}
                <span className="font-normal text-ink-faint">· optional</span>
              </Label>
              <Textarea
                id="ev-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional details"
                rows={2}
              />
            </div>

            {/* Repeat — create only */}
            {mode === 'create' && (
              <div className="rounded-xl border border-border bg-card/60 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep dark:text-gold">
                    <Repeat className="h-3 w-3" /> Repeat
                  </span>
                  <span className="font-ethiopic text-[10px] text-muted-foreground">
                    ድግግሞሽ
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {REPEAT_OPTIONS.map((o) => {
                    const active = repeat === o.value;
                    return (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => onRepeatChange(o.value)}
                        className={`rounded-lg py-1.5 text-[11px] font-semibold transition-colors ${
                          active
                            ? 'bg-burgundy text-cream dark:bg-gold dark:text-burgundy-ink'
                            : 'border border-border bg-background text-foreground hover:bg-card'
                        }`}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>

                {recurring && (
                  <div className="mt-3 space-y-1.5">
                    <Label htmlFor="ev-until" className={labelCls}>
                      Until
                    </Label>
                    <Input
                      id="ev-until"
                      type="date"
                      value={until}
                      min={eventDate || undefined}
                      max={maxUntil || undefined}
                      onChange={(e) => setUntil(e.target.value)}
                    />
                    {eventDate && cappedUntil && occCount > 0 && (
                      <div className="mt-1.5 flex items-start gap-2 rounded-lg bg-gold/[0.1] px-2.5 py-2 text-[11.5px] leading-snug text-burgundy-ink dark:text-cream">
                        <CalendarClock className="mt-px h-3.5 w-3.5 shrink-0 text-gold-deep dark:text-gold" />
                        <span>
                          Will create{' '}
                          <strong className="font-semibold">
                            {occCount} events
                          </strong>{' '}
                          {cadencePhrase(repeat as Recurrence, eventDate)} from{' '}
                          {formatLong(eventDate)} until{' '}
                          {formatLong(cappedUntil)}.
                          {isCapped && (
                            <span className="mt-0.5 block text-[10.5px] text-status-late">
                              Capped at 12 months from the start date.
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Series controls — edit of a recurring occurrence */}
            {inSeries && event && (
              <div className="rounded-xl border border-dashed border-gold bg-gold/[0.06] p-3">
                <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep dark:text-gold">
                  <Repeat className="h-3 w-3" /> Recurring series
                </div>
                <p className="mb-2.5 text-[11.5px] leading-snug text-muted-foreground">
                  This is one of {seriesEvents.length} occurrences. Editing
                  above changes only this one. To move where the series ends,
                  set a new end date — past and attended events are never
                  touched.
                </p>
                <Label htmlFor="ev-series-until" className={labelCls}>
                  Series ends
                </Label>
                <div className="mt-1.5 flex gap-2">
                  <Input
                    id="ev-series-until"
                    type="date"
                    value={seriesUntil}
                    min={todayYmd()}
                    onChange={(e) => setSeriesUntil(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy || !seriesUntil}
                    onClick={handleSeriesEnd}
                    className="shrink-0 border-gold/50 text-xs font-semibold text-gold-deep dark:text-gold"
                  >
                    Update end
                  </Button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2.5 pt-1">
              {mode === 'edit' && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={busy || attendedIds.has(event?.id ?? '')}
                  title={
                    attendedIds.has(event?.id ?? '')
                      ? 'Has attendance — cannot delete'
                      : 'Delete this event'
                  }
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-status-absent transition-colors hover:bg-status-absent-bg disabled:opacity-40"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <Button
                type="submit"
                disabled={busy}
                className="sacred-gradient flex flex-1 items-center justify-center gap-2 rounded-xl border border-gold/40 py-3 text-sm font-semibold text-cream shadow-fy-md hover:opacity-95"
              >
                {mode === 'create'
                  ? busy
                    ? 'Creating…'
                    : recurring
                      ? `Create ${occCount} events`
                      : 'Create event'
                  : busy
                    ? 'Saving…'
                    : 'Save changes'}
              </Button>
            </div>

            {mode === 'edit' && attendedIds.has(event?.id ?? '') && (
              <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <TriangleAlert className="h-3 w-3 text-status-late" />
                This event has attendance recorded and is protected from
                deletion.
              </p>
            )}
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
