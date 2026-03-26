'use client';

import { useState, useRef, useCallback } from 'react';
import { createClient } from '@felege-yordanos/db';
import type { Member } from '@felege-yordanos/db';
import { Search, Zap, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

type AttendanceStatus = 'present' | 'absent' | 'late';

interface AttendanceRow {
  id: string;
  event_id: string;
  member_id: number;
  status: AttendanceStatus;
  marked_by: string | null;
  created_at: string;
}

interface CheckInTabsProps {
  eventId: string;
  members: Member[];
  attendance: AttendanceRow[];
  userId: string;
}

interface CheckInLog {
  name: string;
  memberId: string;
  time: string;
}

const statusColors: Record<AttendanceStatus, string> = {
  present: 'bg-green-600 hover:bg-green-700',
  absent: 'bg-red-600 hover:bg-red-700',
  late: 'bg-yellow-600 hover:bg-yellow-700',
};

export function CheckInTabs({ eventId, members, attendance, userId }: CheckInTabsProps) {
  const [records, setRecords] = useState<Record<number, AttendanceStatus>>(() => {
    const map: Record<number, AttendanceStatus> = {};
    for (const a of attendance) {
      map[a.member_id] = a.status;
    }
    return map;
  });
  const [search, setSearch] = useState('');
  const [quickInput, setQuickInput] = useState('');
  const [checkInLogs, setCheckInLogs] = useState<CheckInLog[]>([]);
  const quickInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const presentCount = Object.values(records).filter(
    (s) => s === 'present' || s === 'late'
  ).length;

  const upsertAttendance = useCallback(async (memberId: number, status: AttendanceStatus) => {
    const supabase = createClient();
    const { error } = await supabase.from('attendance').upsert(
      {
        event_id: eventId,
        member_id: memberId,
        status,
        marked_by: userId,
      } as never,
      { onConflict: 'event_id,member_id' }
    );

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return false;
    }

    setRecords((prev) => ({ ...prev, [memberId]: status }));
    return true;
  }, [eventId, userId, toast]);

  const filteredMembers = members.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.father_name?.toLowerCase().includes(q) ||
      m.member_id.toLowerCase().includes(q)
    );
  });

  async function handleQuickCheckIn(e: React.FormEvent) {
    e.preventDefault();
    const id = quickInput.trim();
    if (!id) return;

    const member = members.find((m) => m.member_id === id);
    if (!member) {
      toast({ title: 'Not found', description: 'Member ID not found', variant: 'destructive' });
      setQuickInput('');
      quickInputRef.current?.focus();
      return;
    }

    const fullName = [member.name, member.father_name].filter(Boolean).join(' ');

    if (records[member.id] === 'present' || records[member.id] === 'late') {
      toast({ title: `${fullName}`, description: 'Already checked in' });
      setQuickInput('');
      quickInputRef.current?.focus();
      return;
    }

    const ok = await upsertAttendance(member.id, 'present');
    if (ok) {
      toast({ title: `${fullName}`, description: 'Checked in' });
      setCheckInLogs((prev) => [
        {
          name: fullName,
          memberId: member.member_id,
          time: new Date().toLocaleTimeString(),
        },
        ...prev.slice(0, 9),
      ]);
    }

    setQuickInput('');
    quickInputRef.current?.focus();
  }

  return (
    <Tabs defaultValue="member-list" className="mt-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="member-list" className="gap-2">
          <List className="h-4 w-4" />
          Member List
        </TabsTrigger>
        <TabsTrigger value="quick-checkin" className="gap-2">
          <Zap className="h-4 w-4" />
          Quick Check-in
        </TabsTrigger>
      </TabsList>

      {/* Tab 1: Member List */}
      <TabsContent value="member-list" className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Badge variant="secondary">
            {presentCount}/{members.length} present
          </Badge>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                    No members found
                  </TableCell>
                </TableRow>
              ) : (
                filteredMembers.map((m) => {
                  const current = records[m.id];
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="text-xs text-muted-foreground">
                        {m.member_id}
                      </TableCell>
                      <TableCell className="font-medium">
                        {m.name} {m.father_name}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {(['present', 'absent', 'late'] as AttendanceStatus[]).map((status) => (
                            <Button
                              key={status}
                              size="sm"
                              variant={current === status ? 'default' : 'outline'}
                              className={current === status ? `text-white text-xs ${statusColors[status]}` : 'text-xs'}
                              onClick={() => upsertAttendance(m.id, status)}
                            >
                              {status === 'present' ? 'P' : status === 'absent' ? 'A' : 'L'}
                            </Button>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </TabsContent>

      {/* Tab 2: Quick Check-in */}
      <TabsContent value="quick-checkin" className="space-y-4">
        <div className="flex items-center gap-3">
          <form onSubmit={handleQuickCheckIn} className="flex-1">
            <Input
              ref={quickInputRef}
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder="Enter member ID..."
              className="text-lg"
              autoFocus
            />
          </form>
          <Badge variant="secondary">
            {presentCount} checked in
          </Badge>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Recent check-ins
          </p>
          {checkInLogs.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No check-ins yet. Enter a member ID above.
            </p>
          ) : (
            checkInLogs.map((log, i) => (
              <Card key={`${log.memberId}-${i}`}>
                <CardContent className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{log.name}</p>
                    <p className="text-xs text-muted-foreground">{log.memberId}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="default" className="bg-green-600">Present</Badge>
                    <p className="mt-1 text-xs text-muted-foreground">{log.time}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
