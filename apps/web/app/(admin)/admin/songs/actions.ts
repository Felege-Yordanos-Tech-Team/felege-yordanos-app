'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { and, eq, ne, sql } from 'drizzle-orm';
import { z } from 'zod';
import { categories, db, songs } from '@felege-yordanos/db/server';
import { fail, NOT_ALLOWED, ok, type ActionResult } from '@/lib/action-result';
import {
  AUDIO_MAX_BYTES,
  audioFileType,
  isAudioKey,
  mediaContentType,
} from '@/lib/media';
import { canManageSongs } from '@/lib/permissions';
import { requireUser } from '@/lib/session';
import {
  deleteObject,
  headObject,
  signedUploadUrl,
  usesLocalStorage,
} from '@/lib/storage';

const LYRICS_MAX = 8000;

/* ─── Helpers ──────────────────────────────────────────────── */

/** Postgres unique violation (23505), possibly wrapped by Drizzle. Returns the constraint name. */
function uniqueViolation(err: unknown): string | null {
  let e: unknown = err;
  for (let i = 0; i < 3 && e && typeof e === 'object'; i++) {
    const o = e as {
      code?: unknown;
      constraint_name?: unknown;
      cause?: unknown;
    };
    if (o.code === '23505') {
      return typeof o.constraint_name === 'string' ? o.constraint_name : '';
    }
    e = o.cause;
  }
  return null;
}

/** Trims strings and turns empty strings into null. */
const emptyToNull = (v: unknown) =>
  typeof v === 'string' ? v.trim() || null : v;

const idSchema = z.uuid();

function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Invalid input.';
}

function revalidateSongs(songId?: string) {
  revalidatePath('/songbook');
  if (songId) revalidatePath(`/songbook/${songId}`);
  revalidatePath('/admin/songs');
}

/* ─── Songs ────────────────────────────────────────────────── */

const songSchema = z.object({
  number: z.preprocess(
    (v) => {
      const s = emptyToNull(v);
      return typeof s === 'string' ? Number(s) : s;
    },
    z
      .number({ error: 'Number must be a whole number.' })
      .int('Number must be a whole number.')
      .positive('Number must be greater than 0.')
      .nullable(),
  ),
  title: z.string().trim().min(1, 'Title is required.'),
  titleEn: z.preprocess(emptyToNull, z.string().trim().nullable()),
  category: z.string().trim().min(1, 'Category is required.'),
  lyrics: z
    .string()
    .trim()
    .min(1, 'Lyrics are required.')
    .max(LYRICS_MAX, `Lyrics must be at most ${LYRICS_MAX} characters.`),
  audioUrl: z.preprocess(
    emptyToNull,
    z
      .url({
        protocol: /^https?$/,
        error: 'Audio URL must be a valid http(s) URL.',
      })
      .nullable(),
  ),
  // Uploaded recording (from requestAudioUpload), or null for none.
  audioKey: z.preprocess(
    emptyToNull,
    z
      .string()
      .refine(isAudioKey, 'Upload the audio file again.')
      .nullable(),
  ),
});

export type SongInput = z.input<typeof songSchema>;

/**
 * Checks a newly uploaded recording before a song points to it: the file
 * arrived, is within the size limit, has the expected type, and no other
 * song uses it. Returns an error message, or null when it is fine.
 */
async function checkUploadedAudio(
  key: string,
  songId: string | null,
): Promise<string | null> {
  const used = await db.$count(
    songs,
    songId
      ? and(eq(songs.audioKey, key), ne(songs.id, songId))
      : eq(songs.audioKey, key),
  );
  if (used > 0) return 'Upload the audio file again.';

  const file = await headObject('media', key);
  if (!file) return 'The audio upload did not finish. Please upload it again.';
  if (file.size > AUDIO_MAX_BYTES || file.size === 0) {
    await deleteObject('media', key);
    return 'Audio file must be at most 30 MB.';
  }
  if (file.contentType && file.contentType !== mediaContentType(key)) {
    await deleteObject('media', key);
    return 'Only MP3, M4A, AAC, OGG and WAV audio files are allowed.';
  }
  return null;
}

function songWriteError(err: unknown): ActionResult<never> {
  if (uniqueViolation(err) !== null) {
    return fail('Another song already uses this number.');
  }
  throw err;
}

export async function createSong(
  input: SongInput,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = songSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  if (!canManageSongs(user)) return fail(NOT_ALLOWED);

  const { audioKey } = parsed.data;
  if (audioKey) {
    const problem = await checkUploadedAudio(audioKey, null);
    if (problem) return fail(problem);
  }

  try {
    const [row] = await db
      .insert(songs)
      .values(parsed.data)
      .returning({ id: songs.id });
    revalidateSongs(row.id);
    return ok({ id: row.id });
  } catch (err) {
    return songWriteError(err);
  }
}

export async function updateSong(
  id: string,
  input: SongInput,
): Promise<ActionResult> {
  const user = await requireUser();
  const songId = idSchema.safeParse(id);
  if (!songId.success) return fail('Song not found.');
  const parsed = songSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  if (!canManageSongs(user)) return fail(NOT_ALLOWED);

  const [current] = await db
    .select({ audioKey: songs.audioKey })
    .from(songs)
    .where(eq(songs.id, songId.data))
    .limit(1);
  if (!current) return fail('Song not found.');

  const { audioKey } = parsed.data;
  if (audioKey && audioKey !== current.audioKey) {
    const problem = await checkUploadedAudio(audioKey, songId.data);
    if (problem) return fail(problem);
  }

  try {
    const updated = await db
      .update(songs)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(songs.id, songId.data))
      .returning({ id: songs.id });
    if (updated.length === 0) return fail('Song not found.');
  } catch (err) {
    return songWriteError(err);
  }

  // Replaced or removed recording: delete the old file.
  if (current.audioKey && current.audioKey !== audioKey) {
    await deleteObject('media', current.audioKey);
  }

  revalidateSongs(songId.data);
  revalidatePath(`/admin/songs/${songId.data}/edit`);
  return ok();
}

export async function deleteSong(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const songId = idSchema.safeParse(id);
  if (!songId.success) return fail('Song not found.');
  if (!canManageSongs(user)) return fail(NOT_ALLOWED);

  const deleted = await db
    .delete(songs)
    .where(eq(songs.id, songId.data))
    .returning({ id: songs.id, audioKey: songs.audioKey });
  if (deleted.length === 0) return fail('Song not found.');
  if (deleted[0].audioKey) await deleteObject('media', deleted[0].audioKey);

  revalidateSongs(songId.data);
  return ok();
}

/* ─── Song audio uploads ───────────────────────────────────── */

const audioUploadSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  type: z.string().max(100),
  size: z.number().int().positive(),
});

/**
 * Step 1 of an audio upload: checks the file and returns where the browser
 * sends it. R2: a signed PUT link (5 minutes) straight to the media bucket,
 * so the file never passes through the server. Local: /api/media-upload.
 * The browser must send `contentType` as the Content-Type header. Saving
 * the song then checks that the file arrived (checkUploadedAudio).
 */
export async function requestAudioUpload(input: {
  fileName: string;
  type: string;
  size: number;
}): Promise<
  ActionResult<{ key: string; uploadUrl: string; contentType: string }>
> {
  const user = await requireUser();
  if (!canManageSongs(user)) return fail(NOT_ALLOWED);
  const parsed = audioUploadSchema.safeParse(input);
  if (!parsed.success) return fail('Choose an audio file.');

  const fileType = audioFileType(parsed.data.fileName, parsed.data.type);
  if (!fileType)
    return fail('Only MP3, M4A, AAC, OGG and WAV audio files are allowed.');
  if (parsed.data.size > AUDIO_MAX_BYTES)
    return fail('Audio file must be at most 30 MB.');

  const key = `audio/${randomUUID()}.${fileType.ext}`;
  const uploadUrl = usesLocalStorage()
    ? `/api/media-upload/${key}`
    : await signedUploadUrl('media', key, fileType.contentType);
  return ok({ key, uploadUrl, contentType: fileType.contentType });
}

/**
 * Deletes an uploaded recording that was never saved (replaced or removed
 * before saving, or the form was left). Files that a song uses are kept.
 */
export async function discardAudioUpload(key: string): Promise<ActionResult> {
  const user = await requireUser();
  if (!canManageSongs(user)) return fail(NOT_ALLOWED);
  if (typeof key !== 'string' || !isAudioKey(key)) return ok();

  const used = await db.$count(songs, eq(songs.audioKey, key));
  if (used === 0) await deleteObject('media', key);
  return ok();
}

/* ─── Categories ───────────────────────────────────────────── */

const categorySchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  emoji: z.preprocess(emptyToNull, z.string().trim().nullable()),
  color: z.preprocess(emptyToNull, z.string().trim().nullable()),
});

export type CategoryInput = z.input<typeof categorySchema>;

function categoryWriteError(err: unknown): ActionResult<never> {
  if (uniqueViolation(err) !== null) {
    return fail('A category with this name already exists.');
  }
  throw err;
}

export async function createCategory(
  input: CategoryInput,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  if (!canManageSongs(user)) return fail(NOT_ALLOWED);

  try {
    await db.insert(categories).values({
      ...parsed.data,
      // Append to the end of the list.
      sortOrder: sql`(select coalesce(max(${categories.sortOrder}), 0) + 1 from ${categories})`,
    });
  } catch (err) {
    return categoryWriteError(err);
  }

  revalidateSongs();
  return ok();
}

export async function updateCategory(
  id: string,
  input: CategoryInput,
): Promise<ActionResult> {
  const user = await requireUser();
  const categoryId = idSchema.safeParse(id);
  if (!categoryId.success) return fail('Category not found.');
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  if (!canManageSongs(user)) return fail(NOT_ALLOWED);

  try {
    const found = await db.transaction(async (tx) => {
      const [current] = await tx
        .select({ name: categories.name })
        .from(categories)
        .where(eq(categories.id, categoryId.data))
        .for('update');
      if (!current) return false;

      await tx
        .update(categories)
        .set(parsed.data)
        .where(eq(categories.id, categoryId.data));

      // songs.category stores the category name (no foreign key), so a
      // rename must carry the songs along or they lose their category.
      if (current.name !== parsed.data.name) {
        await tx
          .update(songs)
          .set({ category: parsed.data.name, updatedAt: new Date() })
          .where(eq(songs.category, current.name));
      }
      return true;
    });
    if (!found) return fail('Category not found.');
  } catch (err) {
    return categoryWriteError(err);
  }

  revalidatePath('/songbook', 'layout');
  revalidatePath('/admin/songs', 'layout');
  return ok();
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const categoryId = idSchema.safeParse(id);
  if (!categoryId.success) return fail('Category not found.');
  if (!canManageSongs(user)) return fail(NOT_ALLOWED);

  // Same as before: only the category row is removed. Songs that use it
  // keep the old name in songs.category.
  const deleted = await db
    .delete(categories)
    .where(eq(categories.id, categoryId.data))
    .returning({ id: categories.id });
  if (deleted.length === 0) return fail('Category not found.');

  revalidateSongs();
  return ok();
}
