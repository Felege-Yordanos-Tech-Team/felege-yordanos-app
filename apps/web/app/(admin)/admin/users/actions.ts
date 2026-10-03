'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, departments, profiles } from '@felege-yordanos/db/server';
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
});

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

  const { userId, role, departmentId } = parsed.data;

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

  await db
    .update(profiles)
    .set({ role, departmentId, updatedAt: new Date() })
    .where(eq(profiles.id, userId));

  revalidatePath('/admin/users');
  revalidatePath('/profile');
  revalidatePath('/dashboard');
  // Role changes affect navigation and badges in the app shell (layouts).
  revalidatePath('/', 'layout');
  return ok();
}
