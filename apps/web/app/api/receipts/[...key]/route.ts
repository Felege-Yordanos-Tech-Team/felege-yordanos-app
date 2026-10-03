import { NextResponse } from 'next/server';
import { canViewReceipt } from '@/lib/permissions';
import { getCurrentUser } from '@/lib/session';
import { readUpload } from '@/lib/storage';

/**
 * Serves a donation receipt after checking permissions.
 * URL: /api/receipts/<user id>/<file name>  (stored under receipts/ on disk)
 * Allowed: the donor, admins, and the Budget department head.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });

  const key = (await params).key.join('/');
  if (!canViewReceipt(user, key))
    return new NextResponse('Forbidden', { status: 403 });

  const file = await readUpload(`receipts/${key}`);
  if (!file) return new NextResponse('Not found', { status: 404 });

  return new NextResponse(new Uint8Array(file.body), {
    headers: {
      'Content-Type': file.contentType,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
