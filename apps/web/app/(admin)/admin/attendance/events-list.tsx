'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@felege-yordanos/db';
import type { UserRole, Department } from '@felege-yordanos/db';
import { ChevronRight, Pencil, Plus, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface EventRow {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  department_id: number | null;
  created_by: string | null;
  created_at: string;
}

interface EventsListProps {
  events: EventRow[];
  departments: Department[];
  attendanceCounts: Record<string, number>;
  userRole: UserRole;
  userDeptId: number | null;
  userId: string;
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function splitDate(d: string): { day: string; month: string } {
  try {
    const date = new Date(d);
    return {
      day: String(date.getDate()).padStart(2, '0'),
      month: MONTH_SHORT[date.getMonth()] ?? '',
    };
  } catch {
    return { day: d.slice(-2), month: '' };
  }
}

export function EventsList({
  events,
  departments,
  attendanceCounts,
  userRole,
  userDeptId,
  userId,
}: EventsListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [deptId, setDeptId] = useState<string>(userDeptId ? String(userDeptId) : '');
  const [creating, setCreating] = useState(false);

  const [editEvent, setEditEvent] = useState<EventRow | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editDeptId, setEditDeptId] = useState('');
  const [saving, setSaving] = useState(false);

  const { toast } = useToast();
  const router = useRouter();

  const isDeptHead = userRole === 'dept_head';
  const today = new Date().toISOString().split('T')[0];

  function getDeptName(id: number | null): string {
    if (!id) return 'General';
    return departments.find((d) => d.id === id)?.name_am ?? 'Unknown';
  }

  function formatTime(time: string | null): string {
    if (!time) return '';
    return time.slice(0, 5);
  }

  const isUpcoming = (d: string) => d >= today;
  const upcoming = events.filter((e) => isUpcoming(e.event_date));
  const past = events.filter((e) => !isUpcoming(e.event_date));

  function openEdit(event: EventRow) {
    setEditEvent(event);
    setEditTitle(event.title);
    setEditDescription(event.description ?? '');
    setEditDate(event.event_date);
    setEditStartTime(event.start_time?.slice(0, 5) ?? '');
    setEditEndTime(event.end_time?.slice(0, 5) ?? '');
    setEditDeptId(event.department_id ? String(event.department_id) : '');
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);

    const supabase = createClient();
    const { error } = await supabase.from('events').insert({
      title,
      description: description || null,
      event_date: eventDate,
      start_time: startTime || null,
      end_time: endTime || null,
      department_id: deptId ? Number(deptId) : null,
      created_by: userId,
    } as never);

    setCreating(false);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Event created', description: title });
      setDialogOpen(false);
      setTitle('');
      setDescription('');
      setEventDate('');
      setStartTime('');
      setEndTime('');
      if (!isDeptHead) setDeptId('');
      router.refresh();
    }
  }

  async function handleUpdate() {
    if (!editEvent) return;
    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase
      .from('events')
      .update({
        title: editTitle,
        description: editDescription || null,
        event_date: editDate,
        start_time: editStartTime || null,
        end_time: editEndTime || null,
        department_id: editDeptId ? Number(editDeptId) : null,
      } as never)
      .eq('id', editEvent.id);

    setSaving(false);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Event updated', description: editTitle });
      setEditEvent(null);
      router.refresh();
    }
  }

  return (
    <>
      {/* Create button + ornament rule */}
      <div className="mt-3 flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="sacred-gradient inline-flex items-center gap-1.5 rounded-full border border-gold/40 px-3.5 py-1.5 text-xs font-semibold text-cream shadow-fy-md hover:opacity-95"
            >
              <Plus className="h-3.5 w-3.5 text-gold" />
              <span>Event</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display text-xl">Create event</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="event-title" className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep dark:text-gold">
                  Title
                </Label>
                <Input
                  id="event-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Sunday Service"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="event-description" className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep dark:text-gold">
                  Description
                </Label>
                <Textarea
                  id="event-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional details"
                  rows={2}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="event-date" className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep dark:text-gold">
                  Date
                </Label>
                <Input
                  id="event-date"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="start-time" className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep dark:text-gold">
                    Start
                  </Label>
                  <Input id="start-time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="end-time" className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep dark:text-gold">
                    End
                  </Label>
                  <Input id="end-time" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep dark:text-gold">
                  Department
                </Label>
                {isDeptHead ? (
                  <p className="text-sm text-muted-foreground">{getDeptName(userDeptId)}</p>
                ) : (
                  <Select value={deptId} onValueChange={setDeptId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>
                          {d.name_am}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <Button
                type="submit"
                disabled={creating}
                className="sacred-gradient mt-1 flex w-full items-center justify-center gap-2 rounded-xl border border-gold/40 py-3 text-sm font-semibold text-cream shadow-fy-md hover:opacity-95"
              >
                {creating ? 'Creating…' : 'Create event'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Ornament rule */}
      <div className="my-4 flex items-center gap-2.5">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-parchment-edge dark:to-ink-muted/40" />
        <span className="flex items-center gap-1">
          <span className="h-1 w-1 rounded-full bg-gold opacity-40" />
          <span className="h-1 w-1 rounded-full bg-gold" />
          <span className="h-1 w-1 rounded-full bg-gold opacity-40" />
        </span>
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-parchment-edge dark:to-ink-muted/40" />
      </div>

      {events.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No events yet. Create one to get started.
        </p>
      ) : (
        <>
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <>
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-deep dark:text-gold">
                Upcoming
              </div>
              <div className="flex flex-col gap-1.5">
                {upcoming.map((event) => {
                  const { day, month } = splitDate(event.event_date);
                  return (
                    <div
                      key={event.id}
                      className="gold-accent-l relative flex items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-3 pl-[18px]"
                    >
                      <div className="w-11 shrink-0 border-r border-border pr-2.5 text-center">
                        <div className="font-display text-lg font-medium leading-none tabular-nums text-burgundy dark:text-gold-light">
                          {day}
                        </div>
                        <div className="mt-0.5 text-[8.5px] uppercase tracking-[0.16em] text-muted-foreground">
                          {month}
                        </div>
                      </div>
                      <Link
                        href={`/admin/attendance/${event.id}`}
                        className="min-w-0 flex-1"
                      >
                        <div className="font-display text-[17px] font-medium leading-tight text-burgundy-ink dark:text-cream">
                          {event.title}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <span className="font-ethiopic text-[10px] text-gold-deep dark:text-gold">
                            {getDeptName(event.department_id)}
                          </span>
                          {event.start_time && (
                            <>
                              <span className="h-0.5 w-0.5 rounded-full bg-ink-faint" />
                              <span className="font-mono text-[10px] text-muted-foreground">
                                {formatTime(event.start_time)}
                              </span>
                            </>
                          )}
                        </div>
                      </Link>
                      <button
                        type="button"
                        onClick={() => openEdit(event)}
                        className="rounded-md p-1 text-muted-foreground hover:bg-card hover:text-foreground"
                        aria-label="Edit event"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <Link
                        href={`/admin/attendance/${event.id}`}
                        className="text-ink-faint"
                        aria-label="Open event"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Past */}
          {past.length > 0 && (
            <>
              <div className="mb-2 mt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-deep dark:text-gold">
                Past
              </div>
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                {past.map((event, i) => (
                  <Link
                    key={event.id}
                    href={`/admin/attendance/${event.id}`}
                    className={`flex items-center gap-2.5 px-3.5 py-3 hover:bg-card/80 ${
                      i < past.length - 1 ? 'border-b border-border' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-display text-[15px] font-medium leading-tight text-burgundy-ink dark:text-cream">
                        {event.title}
                      </div>
                      <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                        {event.event_date}
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-md bg-gold/[0.14] px-2 py-1">
                      <Users className="h-2.5 w-2.5 text-gold-deep dark:text-gold" />
                      <span className="font-mono text-[11px] font-semibold text-gold-deep dark:text-gold">
                        {attendanceCounts[event.id] ?? 0}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Edit Event Sheet */}
      <Sheet open={!!editEvent} onOpenChange={(open) => !open && setEditEvent(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="font-display text-xl">Edit event</SheetTitle>
            <SheetDescription>Update event details before it takes place</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="edit-title" className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep dark:text-gold">
                Title
              </Label>
              <Input id="edit-title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-description" className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep dark:text-gold">
                Description
              </Label>
              <Textarea id="edit-description" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-date" className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep dark:text-gold">
                Date
              </Label>
              <Input id="edit-date" type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-start" className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep dark:text-gold">
                  Start
                </Label>
                <Input id="edit-start" type="time" value={editStartTime} onChange={(e) => setEditStartTime(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-end" className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep dark:text-gold">
                  End
                </Label>
                <Input id="edit-end" type="time" value={editEndTime} onChange={(e) => setEditEndTime(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep dark:text-gold">
                Department
              </Label>
              {isDeptHead ? (
                <p className="text-sm text-muted-foreground">{getDeptName(userDeptId)}</p>
              ) : (
                <Select value={editDeptId} onValueChange={setEditDeptId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.name_am}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <Button
              onClick={handleUpdate}
              disabled={saving}
              className="sacred-gradient mt-1 flex w-full items-center justify-center gap-2 rounded-xl border border-gold/40 py-3 text-sm font-semibold text-cream shadow-fy-md hover:opacity-95"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
