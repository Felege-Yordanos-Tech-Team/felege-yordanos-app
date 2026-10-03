'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { and, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import {
  attendance,
  ATTENDANCE_STATUSES,
  db,
  events,
  RECURRENCES,
} from '@felege-yordanos/db/server';
import { fail, NOT_ALLOWED, ok, type ActionResult } from '@/lib/action-result';
import {
  generateOccurrences,
  maxRecurrenceUntil,
  type Recurrence,
} from '@/lib/events';
import {
  canCreateEvent,
  canEditEvent,
  canMarkAttendance,
} from '@/lib/permissions';
import { requireUser } from '@/lib/session';

/* ─── Validation ───────────────────────────────────────────── */

const MAX_TITLE = 200;
const MAX_DESCRIPTION = 2000;

const eventId = z.guid('Invalid event.');
const ymd = z.iso.date('Enter a valid date.');
const hhmm = z
  .string()
  .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Enter a valid time.')
  .nullable();

const eventFields = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required.')
    .max(MAX_TITLE, `Title must be at most ${MAX_TITLE} characters.`),
  description: z
    .string()
    .trim()
    .max(
      MAX_DESCRIPTION,
      `Description must be at most ${MAX_DESCRIPTION} characters.`,
    )
    .nullable()
    .transform((v) => (v ? v : null)),
  eventDate: ymd,
  startTime: hhmm,
  endTime: hhmm,
  departmentId: z.number().int().positive().nullable(),
});

export type EventInput = z.input<typeof eventFields>;

const createEventSchema = eventFields.extend({
  recurrence: z.enum(RECURRENCES).nullable(),
  until: ymd.nullable(),
});

export type CreateEventInput = z.input<typeof createEventSchema>;

const firstIssue = (error: z.ZodError, fallback: string) =>
  error.issues[0]?.message ?? fallback;

/* ─── Helpers ──────────────────────────────────────────────── */

const SAVE_FAILED = 'Could not save the event. Please try again.';

function revalidateAttendance() {
  revalidatePath('/admin/attendance');
  revalidatePath('/admin/attendance/[eventId]', 'page');
  revalidatePath('/admin/check-in');
  revalidatePath('/attendance');
  revalidatePath('/dashboard');
  revalidatePath('/admin');
}

/** Postgres foreign key violation (e.g. unknown department or member). */
function isForeignKeyViolation(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string } } | null;
  return e?.code === '23503' || e?.cause?.code === '23503';
}

async function loadEvent(id: string) {
  const [row] = await db
    .select()
    .from(events)
    .where(eq(events.id, id))
    .limit(1);
  return row ?? null;
}

/* ─── Events ───────────────────────────────────────────────── */

/**
 * Creates one event, or a recurring series (one row per occurrence sharing a
 * recurrence_group). Returns the number of rows created.
 * Permission: canCreateEvent(user, departmentId).
 */
export async function createEvent(
  input: CreateEventInput,
): Promise<ActionResult<{ count: number }>> {
  const user = await requireUser();

  const parsed = createEventSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error, 'Invalid event.'));
  const { recurrence, until, ...fields } = parsed.data;

  if (!canCreateEvent(user, fields.departmentId)) return fail(NOT_ALLOWED);

  const base = { ...fields, createdBy: user.id };
  let rows: (typeof events.$inferInsert)[];

  if (!recurrence) {
    rows = [base];
  } else {
    if (!until) return fail('Choose when the series ends.');
    const cap = maxRecurrenceUntil(fields.eventDate);
    const boundedUntil = until > cap ? cap : until;
    const group = randomUUID();
    rows = generateOccurrences(fields.eventDate, recurrence, boundedUntil).map(
      (date) => ({
        ...base,
        eventDate: date,
        recurrenceGroup: group,
        recurrence,
        recurrenceUntil: boundedUntil,
      }),
    );
  }

  try {
    await db.insert(events).values(rows);
  } catch (err) {
    if (isForeignKeyViolation(err)) return fail('Unknown department.');
    console.error('[events] create failed:', err);
    return fail(SAVE_FAILED);
  }

  revalidateAttendance();
  return ok({ count: rows.length });
}

/**
 * Edits a single event (one occurrence of a series; recurrence fields are
 * left alone). Permission: canEditEvent(user, event) on the stored row.
 */
export async function updateEvent(
  id: string,
  input: EventInput,
): Promise<ActionResult> {
  const user = await requireUser();

  const idParsed = eventId.safeParse(id);
  if (!idParsed.success) return fail('Event not found.');
  const parsed = eventFields.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error, 'Invalid event.'));

  const event = await loadEvent(idParsed.data);
  if (!event) return fail('Event not found.');
  if (!canEditEvent(user, event)) return fail(NOT_ALLOWED);

  try {
    await db.update(events).set(parsed.data).where(eq(events.id, event.id));
  } catch (err) {
    if (isForeignKeyViolation(err)) return fail('Unknown department.');
    console.error('[events] update failed:', err);
    return fail(SAVE_FAILED);
  }

  revalidateAttendance();
  return ok();
}

/**
 * Deletes a single event. Events that already have attendance are protected.
 * Permission: canEditEvent(user, event) on the stored row.
 */
export async function deleteEvent(id: string): Promise<ActionResult> {
  const user = await requireUser();

  const idParsed = eventId.safeParse(id);
  if (!idParsed.success) return fail('Event not found.');

  const event = await loadEvent(idParsed.data);
  if (!event) return fail('Event not found.');
  if (!canEditEvent(user, event)) return fail(NOT_ALLOWED);

  try {
    const deleted = await db.transaction(async (tx) => {
      const [hasAttendance] = await tx
        .select({ id: attendance.id })
        .from(attendance)
        .where(eq(attendance.eventId, event.id))
        .limit(1);
      if (hasAttendance) return false;
      await tx.delete(events).where(eq(events.id, event.id));
      return true;
    });
    if (!deleted) return fail('This event already has attendance recorded.');
  } catch (err) {
    console.error('[events] delete failed:', err);
    return fail('Could not delete the event. Please try again.');
  }

  revalidateAttendance();
  return ok();
}

const seriesEndSchema = z.object({ eventId, until: ymd });

/**
 * Moves where a recurring series ends: adds missing occurrences up to the new
 * end (capped at 12 months from the series start) and removes occurrences
 * after it that have no attendance. Occurrences with attendance are kept.
 *
 * Permission: canEditEvent on EVERY existing row of the series, plus
 * canCreateEvent for the series' department when rows are added.
 */
export async function updateSeriesEnd(input: {
  eventId: string;
  until: string;
}): Promise<ActionResult<{ added: number; removed: number; kept: number }>> {
  const user = await requireUser();

  const parsed = seriesEndSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error, 'Invalid date.'));

  const event = await loadEvent(parsed.data.eventId);
  if (!event) return fail('Event not found.');
  if (!event.recurrenceGroup || !event.recurrence)
    return fail('This event is not part of a series.');
  const group = event.recurrenceGroup;
  const cadence: Recurrence = event.recurrence;

  try {
    const result = await db.transaction(async (tx) => {
      const series = await tx
        .select()
        .from(events)
        .where(eq(events.recurrenceGroup, group));
      if (!series.every((e) => canEditEvent(user, e))) return null;

      const start = series.reduce(
        (min, e) => (e.eventDate < min ? e.eventDate : min),
        series[0]?.eventDate ?? event.eventDate,
      );
      const cap = maxRecurrenceUntil(start);
      const boundedUntil = parsed.data.until > cap ? cap : parsed.data.until;

      const attendedRows = series.length
        ? await tx
            .selectDistinct({ eventId: attendance.eventId })
            .from(attendance)
            .where(
              inArray(
                attendance.eventId,
                series.map((e) => e.id),
              ),
            )
        : [];
      const attended = new Set(attendedRows.map((r) => r.eventId));

      const existing = new Set(series.map((e) => e.eventDate));
      const toInsert = generateOccurrences(start, cadence, boundedUntil).filter(
        (d) => !existing.has(d),
      );
      const after = series.filter((e) => e.eventDate > boundedUntil);
      const toDelete = after.filter((e) => !attended.has(e.id));
      const kept = after.length - toDelete.length;

      if (toInsert.length === 0 && toDelete.length === 0)
        return { added: 0, removed: 0, kept };

      if (toInsert.length > 0) {
        if (!canCreateEvent(user, event.departmentId)) return null;
        await tx.insert(events).values(
          toInsert.map((date) => ({
            title: event.title,
            description: event.description,
            eventDate: date,
            startTime: event.startTime,
            endTime: event.endTime,
            departmentId: event.departmentId,
            createdBy: user.id,
            recurrenceGroup: group,
            recurrence: cadence,
            recurrenceUntil: boundedUntil,
          })),
        );
      }

      if (toDelete.length > 0) {
        await tx.delete(events).where(
          and(
            eq(events.recurrenceGroup, group),
            inArray(
              events.id,
              toDelete.map((e) => e.id),
            ),
          ),
        );
      }

      // Keep the recorded end in sync across the surviving series rows.
      await tx
        .update(events)
        .set({ recurrenceUntil: boundedUntil })
        .where(eq(events.recurrenceGroup, group));

      return { added: toInsert.length, removed: toDelete.length, kept };
    });

    if (!result) return fail(NOT_ALLOWED);
    if (result.added || result.removed) revalidateAttendance();
    return ok(result);
  } catch (err) {
    console.error('[events] series update failed:', err);
    return fail(SAVE_FAILED);
  }
}

/* ─── Attendance ───────────────────────────────────────────── */

const markSchema = z.object({
  eventId,
  memberId: z.number().int().positive(),
  status: z.enum(ATTENDANCE_STATUSES),
});

/**
 * Marks (or changes) one member's attendance for an event.
 * Permission: canMarkAttendance(user, event) on the stored event.
 */
export async function markAttendance(input: {
  eventId: string;
  memberId: number;
  status: (typeof ATTENDANCE_STATUSES)[number];
}): Promise<ActionResult> {
  const user = await requireUser();

  const parsed = markSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error, 'Invalid input.'));

  const event = await loadEvent(parsed.data.eventId);
  if (!event) return fail('Event not found.');
  if (!canMarkAttendance(user, event)) return fail(NOT_ALLOWED);

  try {
    await db
      .insert(attendance)
      .values({
        eventId: event.id,
        memberId: parsed.data.memberId,
        status: parsed.data.status,
        markedBy: user.id,
      })
      .onConflictDoUpdate({
        target: [attendance.eventId, attendance.memberId],
        set: { status: parsed.data.status, markedBy: user.id },
      });
  } catch (err) {
    if (isForeignKeyViolation(err)) return fail('Member not found.');
    console.error('[attendance] mark failed:', err);
    return fail('Could not save attendance. Please try again.');
  }

  revalidateAttendance();
  return ok();
}
