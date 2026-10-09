import { NextResponse } from 'next/server';
import { AUDIO_MAX_BYTES, isAudioKey, mediaContentType } from '@/lib/media';
import { canManageSongs } from '@/lib/permissions';
import { getCurrentUser } from '@/lib/session';
import { usesLocalStorage, writeLocalMedia } from '@/lib/storage';

/**
 * Local storage only (STORAGE_DRIVER=local): receives a song audio upload
 * from the browser. Stands in for the signed R2 upload link, so the song
 * form works the same way in development. 404 when using R2.
 * URL: PUT /api/media-upload/audio/<uuid>.<ext>
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  if (!usesLocalStorage())
    return new NextResponse('Not found', { status: 404 });

  const user = await getCurrentUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });
  if (!canManageSongs(user))
    return new NextResponse('Forbidden', { status: 403 });

  const key = (await params).key.join('/');
  if (!isAudioKey(key))
    return new NextResponse('Invalid file key', { status: 400 });
  // Same rule as the signed R2 link: the type is fixed by the server.
  if (req.headers.get('content-type') !== mediaContentType(key))
    return new NextResponse('Wrong content type', { status: 400 });
  if (Number(req.headers.get('content-length') ?? 0) > AUDIO_MAX_BYTES)
    return new NextResponse('File too large', { status: 413 });
  if (!req.body) return new NextResponse('Empty body', { status: 400 });

  const result = await writeLocalMedia(key, req.body, AUDIO_MAX_BYTES);
  if (result === 'too_large')
    return new NextResponse('File too large', { status: 413 });
  return new NextResponse(null, { status: 200 });
}
