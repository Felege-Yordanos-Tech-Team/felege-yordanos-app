'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db, profiles } from '@felege-yordanos/db/server';
import { fail, ok, type ActionResult } from '@/lib/action-result';
import { requireUser } from '@/lib/session';

const DISPLAY_NAME_MAX = 100;

const displayNameSchema = z
  .string()
  .trim()
  .max(
    DISPLAY_NAME_MAX,
    `Display name must be at most ${DISPLAY_NAME_MAX} characters.`,
  );

/**
 * Updates the signed-in user's display name. Only their own profile, and
 * only display_name: role and department are never touched here.
 */
export async function updateDisplayName(
  displayName: string,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = displayNameSchema.safeParse(displayName);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? 'Invalid input.');
  }
  const value = parsed.data || null;

  // Every account gets a profile at sign-up; the upsert only covers a
  // missing row (role then stays at its 'member' default).
  await db
    .insert(profiles)
    .values({ id: user.id, displayName: value })
    .onConflictDoUpdate({
      target: profiles.id,
      set: { displayName: value, updatedAt: new Date() },
    });

  revalidatePath('/profile');
  revalidatePath('/admin/users');
  // The display name is shown in the app shell header (layouts).
  revalidatePath('/', 'layout');
  return ok();
}
