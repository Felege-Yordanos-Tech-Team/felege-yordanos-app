'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Megaphone, Pencil, Plus, Trash2 } from 'lucide-react';
import { Card, PageHead } from '@/components/ds';
import { NoticeCard } from '@/components/notices/notice-card';
import {
  NoticeFormDialog,
  type PostableDepartment,
} from '@/components/notices/notice-form-dialog';
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

/** Notices this user may edit, with new, edit and delete. */
export function NoticesList({
  notices,
  departments,
  canPostToEveryone,
  sub,
}: {
  notices: NoticeView[];
  departments: PostableDepartment[];
  canPostToEveryone: boolean;
  sub: string;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [target, setTarget] = useState<NoticeView | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState<{ notice: NoticeView | null } | null>(
    null,
  );

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

  const header = (
    <PageHead
      en="Notices"
      am="ማስታወቂያዎች"
      sub={sub}
      actions={
        <button
          type="button"
          onClick={() => setEditing({ notice: null })}
          className="sacred-gradient inline-flex items-center gap-2 whitespace-nowrap rounded-xl border border-gold/40 px-4 py-[9px] text-[13px] font-semibold tracking-[0.04em] text-cream shadow-[0_6px_16px_-6px_rgba(10,60,54,0.4),inset_0_1px_0_rgba(212,168,67,0.25)] transition-opacity hover:opacity-95"
        >
          <Plus className="h-3.5 w-3.5 text-gold" />
          <span className="md:hidden">{t('New')}</span>
          <span className="hidden md:inline">{t('New notice')}</span>
        </button>
      }
    />
  );
  const dialog = (
    <NoticeFormDialog
      open={!!editing}
      onOpenChange={(open) => !open && setEditing(null)}
      notice={editing?.notice ?? null}
      departments={departments}
      canPostToEveryone={canPostToEveryone}
    />
  );

  if (notices.length === 0) {
    return (
      <>
        {header}
        <Card className="flex flex-col items-center px-6 py-14 text-center">
          <Megaphone className="mb-3 h-6 w-6 text-gold-deep" />
          <p className="text-[13px] text-ink-muted">
            {t('No notices yet. Post the first one.')}
          </p>
        </Card>
        {dialog}
      </>
    );
  }

  return (
    <>
      {header}
      <div className="grid items-start gap-3.5 md:grid-cols-2">
        {notices.map((n) => (
          <NoticeCard
            key={n.id}
            notice={n}
            actions={
              <>
                <button
                  type="button"
                  onClick={() => setEditing({ notice: n })}
                  className={`${SMALL_BTN} text-brand dark:text-gold`}
                >
                  <Pencil className="h-3 w-3" />
                  {t('Edit')}
                </button>
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
      {dialog}
    </>
  );
}
