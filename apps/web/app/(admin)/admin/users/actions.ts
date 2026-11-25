'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, isNull, ne } from 'drizzle-orm';
import { z } from 'zod';
import {
  db,
  departmentMemberships,
  departments,
  profiles,
} from '@felege-yordanos/db/server';
import { ROLES } from '@felege-yordanos/db/schema';
import { fail, NOT_ALLOWED, ok, type ActionResult } from '@/lib/action-result';
import { canManageUsers } from '@/lib/permissions';
import { requireUser } from '@/lib/session';

const updateUserSchema = z.object({
  userId: z.guid('User not found.'),
  role: z.enum(ROLES, 'Invalid role.'),
  departmentId: z
    .number()
    .int('Invalid department.')
    .positive('Invalid department.')
    .nullable(),
}).refine(
  ({ role, departmentId }) => role !== 'dept_head' || departmentId !== null,
  {
    message: 'A department is required for department heads.',
    path: ['departmentId'],
  },
);

export type UpdateUserInput = z.input<typeof updateUserSchema>;

/** Changes a user's role and department. Super admins only. */
export async function updateUserRole(
  input: UpdateUserInput,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = updateUserSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? 'Invalid input.');
  }
  if (!canManageUsers(user)) return fail(NOT_ALLOWED);

  const { userId, role } = parsed.data;
  // Department assignments only apply to department heads.
  const departmentId =
    role === 'dept_head' ? parsed.data.departmentId : null;

  // A super admin cannot take away their own super admin role
  // (avoids locking everyone out of user management).
  if (userId === user.id && role !== 'super_admin') {
    return fail('You cannot remove your own super admin role.');
  }

  const [target] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);
  if (!target) return fail('User not found.');

  if (departmentId != null) {
    const [dept] = await db
      .select({ id: departments.id })
      .from(departments)
      .where(eq(departments.id, departmentId))
      .limit(1);
    if (!dept) return fail('Department not found.');
  }

  const changedAt = new Date();

  await db.transaction(async (tx) => {
    // Close the user's current assignment before creating the next one. The
    // row remains available as immutable history.
    await tx
      .update(departmentMemberships)
      .set({ endedAt: changedAt })
      .where(
        and(
          eq(departmentMemberships.userId, userId),
          isNull(departmentMemberships.endedAt),
        ),
      );

    if (role === 'dept_head' && departmentId != null) {
      // One-click handover: the current head is demoted and their assignment
      // is closed before the new head is inserted.
      const currentHeads = await tx
        .select({ userId: departmentMemberships.userId })
        .from(departmentMemberships)
        .where(
          and(
            eq(departmentMemberships.departmentId, departmentId),
            eq(departmentMemberships.role, 'dept_head'),
            isNull(departmentMemberships.endedAt),
            ne(departmentMemberships.userId, userId),
          ),
        );

      await tx
        .update(departmentMemberships)
        .set({ endedAt: changedAt })
        .where(
          and(
            eq(departmentMemberships.departmentId, departmentId),
            eq(departmentMemberships.role, 'dept_head'),
            isNull(departmentMemberships.endedAt),
          ),
        );

      for (const head of currentHeads) {
        await tx
          .update(profiles)
          .set({ role: 'member', departmentId: null, updatedAt: changedAt })
          .where(eq(profiles.id, head.userId));
      }

      await tx.insert(departmentMemberships).values({
        userId,
        departmentId,
        role: 'dept_head',
        startedAt: changedAt,
        assignedBy: user.id,
      });
    }

    await tx
      .update(profiles)
      .set({ role, departmentId, updatedAt: changedAt })
      .where(eq(profiles.id, userId));
  });

  revalidatePath('/admin/users');
  revalidatePath('/profile');
  revalidatePath('/dashboard');
  // Role changes affect navigation and badges in the app shell (layouts).
  revalidatePath('/', 'layout');
  return ok();
}
