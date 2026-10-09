'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Megaphone, Pencil, Trash2 } from 'lucide-react';
import { Card } from '@/components/ds';
import { NoticeCard } from '@/components/notices/notice-card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useT } from '@/lib/i18n/client';
import type { NoticeView } from '@/lib/notices';
import { deleteNotice } from './actions';

const SECONDARY_BTN =
  'inline-flex items-center justify-center gap-1.5 rounded-[10px] border border-parchment-edge bg-parchment-soft px-3.5 py-[9px] text-[12.5px] font-semibold text-brand transition-colors hover:bg-parchment-deep disabled:opacity-60 dark:text-gold';
const DANGER_BTN =
  'inline-flex items-center justify-center rounded-[10px] bg-status-absent px-4 py-[9px] text-[13px] font-semibold text-cream transition-opacity hover:opacity-90 disabled:opacity-60';
const SMALL_BTN =
  'inline-flex items-center gap-1 rounded-full border border-parchment-edge px-2.5 py-1 text-[11px] font-semibold transition-colors hover:bg-parchment-deep';

/** Notices this user may edit, with edit and delete. */
export function NoticesList({ notices }: { notices: NoticeView[] }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [target, setTarget] = useState<NoticeView | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!target) return;
    setDeleting(true);
    const res = await deleteNotice(target.id);
    setDeleting(false);
    if (!res.ok) {
      toast({
        title: t('Error'),
        description: t(res.error),
        variant: 'destructive',
      });
      return;
    }
    setTarget(null);
    toast({ title: t('Notice deleted') });
    router.refresh();
  }

  if (notices.length === 0) {
    return (
      <Card className="flex flex-col items-center px-6 py-14 text-center">
        <Megaphone className="mb-3 h-6 w-6 text-gold-deep" />
        <p className="text-[13px] text-ink-muted">
          {t('No notices yet. Post the first one.')}
        </p>
      </Card>
    );
  }

  return (
    <>
      <div className="grid items-start gap-3.5 md:grid-cols-2">
        {notices.map((n) => (
          <NoticeCard
            key={n.id}
            notice={n}
            actions={
              <>
                <Link
                  href={`/admin/notices/${n.id}/edit`}
                  className={`${SMALL_BTN} text-brand dark:text-gold`}
                >
                  <Pencil className="h-3 w-3" />
                  {t('Edit')}
                </Link>
                <button
                  type="button"
                  onClick={() => setTarget(n)}
                  className={`${SMALL_BTN} text-status-absent`}
                >
                  <Trash2 className="h-3 w-3" />
                  {t('Delete')}
                </button>
              </>
            }
          />
        ))}
      </div>

      <Dialog open={!!target} onOpenChange={(open) => !open && setTarget(null)}>
        <DialogContent className="border-parchment-edge bg-parchment-soft sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-[22px] font-medium text-brand-ink">
              {t('Delete notice')}
            </DialogTitle>
            <DialogDescription className="text-ink-muted">
              {t(
                'Are you sure you want to delete “{title}”? This cannot be undone.',
                { title: target?.title ?? '' },
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <button
              type="button"
              className={SECONDARY_BTN}
              onClick={() => setTarget(null)}
            >
              {t('Keep it')}
            </button>
            <button
              type="button"
              className={DANGER_BTN}
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? t('Deleting…') : t('Delete')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
