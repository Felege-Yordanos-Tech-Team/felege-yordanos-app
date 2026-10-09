import { NextResponse } from 'next/server';
import { canViewMedia } from '@/lib/permissions';
import { getCurrentUser } from '@/lib/session';
import { mediaResponse } from '@/lib/storage';

/**
 * Serves a media file after checking permissions.
 * URL: /api/media/audio/<uuid>.<ext> (songbook readers) or
 * /api/media/notices/<uuid>.<ext> (notice board readers).
 * R2: redirects to a short-lived signed link. Local: streams from disk.
 */
async function handle(
  req: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });

  const key = (await params).key.join('/');
  if (!canViewMedia(user, key))
    return new NextResponse('Forbidden', { status: 403 });

  return mediaResponse(key, req);
}

export { handle as GET, handle as HEAD };
