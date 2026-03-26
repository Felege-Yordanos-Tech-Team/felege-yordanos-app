'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@felege-yordanos/db';
import type { UserRole, Department } from '@felege-yordanos/db';
import { Plus, CalendarDays, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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

export function EventsList({
  events,
  departments,
  attendanceCounts,
  userRole,
  userDeptId,
  userId,
}: EventsListProps) {
  const [filterDept, setFilterDept] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [deptId, setDeptId] = useState<string>(userDeptId ? String(userDeptId) : '');
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const isDeptHead = userRole === 'dept_head';

  const filtered = events.filter((e) => {
    if (filterDept === 'all') return true;
    if (filterDept === 'none') return e.department_id === null;
    return String(e.department_id) === filterDept;
  });

  function getDeptName(id: number | null): string {
    if (!id) return 'General';
    return departments.find((d) => d.id === id)?.name_am ?? 'Unknown';
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);

    const supabase = createClient();
    const { error } = await supabase.from('events').insert({
      title,
      event_date: eventDate,
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
      setEventDate('');
      if (!isDeptHead) setDeptId('');
      router.refresh();
    }
  }

  return (
    <>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select value={filterDept} onValueChange={setFilterDept}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="Filter by department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            <SelectItem value="none">General (no dept)</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d.id} value={String(d.id)}>
                {d.name_am}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Event</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="event-title">Title</Label>
                <Input
                  id="event-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Sunday Service"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-date">Date</Label>
                <Input
                  id="event-date"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
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
                          {d.name_am}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? 'Creating...' : 'Create Event'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-4 rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="hidden sm:table-cell">Department</TableHead>
              <TableHead className="text-right">Attended</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  No events found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((event) => (
                <TableRow key={event.id} className="cursor-pointer">
                  <TableCell>
                    <Link href={`/admin/attendance/${event.id}`} className="font-medium hover:underline">
                      {event.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {event.event_date}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="secondary" className="text-xs">
                      {getDeptName(event.department_id)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1 text-sm">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      {attendanceCounts[event.id] ?? 0}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
