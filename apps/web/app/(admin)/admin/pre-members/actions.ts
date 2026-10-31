'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import {
  db,
  preMembers,
  type PreMemberStatus,
} from '@felege-yordanos/db/server';
import { fail, NOT_ALLOWED, ok, type ActionResult } from '@/lib/action-result';
import { canManagePreMembers } from '@/lib/permissions';
import { nextPreMemberCode } from '@/lib/pre-member-ids';
import { logPreMember } from '@/lib/pre-member-queries';
import {
  adminPreMemberSchema,
  diffDetails,
  type PreMemberDetailsInput,
} from '@/lib/pre-member-schema';
import { requireUser } from '@/lib/session';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const idSchema = z.number().int().positive();
const noteSchema = z
  .string()
  .trim()
  .max(300, 'Note must be at most 300 characters.')
  .transform((v) => v || null);

const NOT_FOUND = 'Pre-member not found.';
const CHANGED = 'This record was changed meanwhile. Reload and try again.';

function revalidate(id?: number) {
  revalidatePath('/admin/pre-members');
  if (id) revalidatePath(`/admin/pre-members/${id}`);
  revalidatePath('/admin');
  revalidatePath('/admin/attendance/[eventId]', 'page');
  revalidatePath('/admin/check-in');
  // A linked account's access changes with the record's status.
  revalidatePath('/', 'layout');
}

/** Unique violation (e.g. an account linked twice), possibly wrapped. */
function isUniqueViolation(err: unknown): boolean {
  let e: unknown = err;
  for (let i = 0; i < 3 && e && typeof e === 'object'; i++) {
    if ((e as { code?: unknown }).code === '23505') return true;
    e = (e as { cause?: unknown }).cause;
  }
  return false;
}

/**
 * Moves a record from one of `from` to `to` inside `tx` (row locked by the
 * update), or returns null when it is not in such a status any more.
 */
async function transition(
  tx: Tx,
  id: number,
  from: PreMemberStatus[],
  set: Partial<typeof preMembers.$inferInsert> & { status: PreMemberStatus },
) {
  const [row] = await tx
    .update(preMembers)
    .set({ ...set, updatedAt: new Date() })
    .where(and(eq(preMembers.id, id), inArray(preMembers.status, from)))
    .returning({ id: preMembers.id, code: preMembers.code });
  return row ?? null;
}

/**
 * Approves a pending record inside `tx`: assigns the next FYP ID of the
 * approval's Ethiopian year (counter row locked until commit, so two
 * approvals never get the same ID), status 'active', history 'approved'.
 */
async function approveInTx(tx: Tx, id: number, adminId: string) {
  const [locked] = await tx
    .select({ status: preMembers.status })
    .from(preMembers)
    .where(eq(preMembers.id, id))
    .for('update')
    .limit(1);
  if (locked?.status !== 'pending') return null;
  const code = await nextPreMemberCode(tx);
  const row = await transition(tx, id, ['pending'], {
    status: 'active',
    code,
    approvedAt: new Date(),
    approvedBy: adminId,
    note: null,
  });
  if (!row) return null;
  await logPreMember(tx, id, 'approved', adminId, { code });
  return code;
}

/**
 * Admin registration (walk-ins): email and phone optional. With
 * `approveNow`, the record is approved in the same transaction and gets its
 * ID at once. Permission: canManagePreMembers.
 */
export async function createPreMember(
  input: PreMemberDetailsInput & { approveNow: boolean },
): Promise<ActionResult<{ id: number; code: string | null }>> {
  const admin = await requireUser();
  if (!canManagePreMembers(admin)) return fail(NOT_ALLOWED);
  const parsed = adminPreMemberSchema.safeParse(input);
  if (!parsed.success)
    return fail(parsed.error.issues[0]?.message ?? 'Invalid input.');

  try {
    const result = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(preMembers)
        .values({ ...parsed.data, source: 'admin', createdBy: admin.id })
        .returning({ id: preMembers.id });
      await logPreMember(tx, row.id, 'created', admin.id, {
        source: 'admin',
      });
      const code = input.approveNow
        ? await approveInTx(tx, row.id, admin.id)
        : null;
      return { id: row.id, code };
    });
    revalidate(result.id);
    return ok(result);
  } catch (err) {
    console.error('[pre-members] create failed:', err);
    return fail('Could not save. Please try again.');
  }
}

/** Approves a pending record (ID assigned now). Permission: canManagePreMembers. */
export async function approvePreMember(
  id: number,
): Promise<ActionResult<{ code: string }>> {
  const admin = await requireUser();
  if (!canManagePreMembers(admin)) return fail(NOT_ALLOWED);
  if (!idSchema.safeParse(id).success) return fail(NOT_FOUND);

  try {
    const code = await db.transaction((tx) => approveInTx(tx, id, admin.id));
    if (!code) return fail(CHANGED);
    revalidate(id);
    return ok({ code });
  } catch (err) {
    console.error('[pre-members] approve failed:', err);
    return fail('Could not approve. Please try again.');
  }
}

/** Rejects a pending record, with an optional note (admins only). */
export async function rejectPreMember(input: {
  id: number;
  note?: string;
}): Promise<ActionResult> {
  const admin = await requireUser();
  if (!canManagePreMembers(admin)) return fail(NOT_ALLOWED);
  const parsed = z
    .object({ id: idSchema, note: noteSchema.optional() })
    .safeParse(input);
  if (!parsed.success)
    return fail(parsed.error.issues[0]?.message ?? NOT_FOUND);
  const { id, note = null } = parsed.data;

  const done = await db.transaction(async (tx) => {
    const row = await transition(tx, id, ['pending'], {
      status: 'rejected',
      note,
    });
    if (!row) return false;
    await logPreMember(tx, id, 'rejected', admin.id, note ? { note } : {});
    return true;
  });
  if (!done) return fail(CHANGED);
  revalidate(id);
  return ok();
}

/**
 * Edits the names, email and phone. Promoted records are read-only. The
 * history entry lists the changed fields (old -> new).
 */
export async function updatePreMember(
  id: number,
  input: PreMemberDetailsInput,
): Promise<ActionResult> {
  const admin = await requireUser();
  if (!canManagePreMembers(admin)) return fail(NOT_ALLOWED);
  if (!idSchema.safeParse(id).success) return fail(NOT_FOUND);
  const parsed = adminPreMemberSchema.safeParse(input);
  if (!parsed.success)
    return fail(parsed.error.issues[0]?.message ?? 'Invalid input.');

  const result = await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(preMembers)
      .where(eq(preMembers.id, id))
      .for('update')
      .limit(1);
    if (!current) return NOT_FOUND;
    if (current.status === 'promoted')
      return 'A promoted record cannot be changed.';
    const changes = diffDetails(current, parsed.data);
    if (Object.keys(changes).length === 0) return null;
    await tx
      .update(preMembers)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(preMembers.id, id));
    await logPreMember(tx, id, 'edited', admin.id, { changes });
    return null;
  });
  if (result) return fail(result);
  revalidate(id);
  return ok();
}

/** Withdraws an active record (manual; the FYP QR stops working). */
export async function withdrawPreMember(input: {
  id: number;
  note?: string;
}): Promise<ActionResult> {
  const admin = await requireUser();
  if (!canManagePreMembers(admin)) return fail(NOT_ALLOWED);
  const parsed = z
    .object({ id: idSchema, note: noteSchema.optional() })
    .safeParse(input);
  if (!parsed.success)
    return fail(parsed.error.issues[0]?.message ?? NOT_FOUND);
  const { id, note = null } = parsed.data;

  const done = await db.transaction(async (tx) => {
    const row = await transition(tx, id, ['active'], {
      status: 'withdrawn',
      note,
    });
    if (!row) return false;
    await logPreMember(tx, id, 'withdrawn', admin.id, note ? { note } : {});
    return true;
  });
  if (!done) return fail(CHANGED);
  revalidate(id);
  return ok();
}

/**
 * Reinstates a withdrawn record (back to active, same ID) or a rejected one
 * (back to pending, to be approved again).
 */
export async function reinstatePreMember(id: number): Promise<ActionResult> {
  const admin = await requireUser();
  if (!canManagePreMembers(admin)) return fail(NOT_ALLOWED);
  if (!idSchema.safeParse(id).success) return fail(NOT_FOUND);

  const done = await db.transaction(async (tx) => {
    const [current] = await tx
      .select({ status: preMembers.status })
      .from(preMembers)
      .where(eq(preMembers.id, id))
      .for('update')
      .limit(1);
    const to: PreMemberStatus | null =
      current?.status === 'withdrawn'
        ? 'active'
        : current?.status === 'rejected'
          ? 'pending'
          : null;
    if (!current || !to) return false;
    await transition(tx, id, [current.status], { status: to, note: null });
    await logPreMember(tx, id, 'reinstated', admin.id, {
      from: current.status,
      to,
    });
    return true;
  });
  if (!done) return fail(CHANGED);
  revalidate(id);
  return ok();
}

/** Removes the link between a pre-member record and its login account. */
export async function unlinkPreMemberAccount(
  id: number,
): Promise<ActionResult> {
  const admin = await requireUser();
  if (!canManagePreMembers(admin)) return fail(NOT_ALLOWED);
  if (!idSchema.safeParse(id).success) return fail(NOT_FOUND);

  try {
    const done = await db.transaction(async (tx) => {
      const [current] = await tx
        .select({
          authUserId: preMembers.authUserId,
          status: preMembers.status,
        })
        .from(preMembers)
        .where(eq(preMembers.id, id))
        .for('update')
        .limit(1);
      if (!current?.authUserId || current.status === 'promoted') return false;
      await tx
        .update(preMembers)
        .set({ authUserId: null, updatedAt: new Date() })
        .where(eq(preMembers.id, id));
      await logPreMember(tx, id, 'unlinked', admin.id, {
        userId: current.authUserId,
      });
      return true;
    });
    if (!done) return fail('This record has no linked account.');
  } catch (err) {
    if (isUniqueViolation(err)) return fail(CHANGED);
    throw err;
  }
  revalidate(id);
  return ok();
}
