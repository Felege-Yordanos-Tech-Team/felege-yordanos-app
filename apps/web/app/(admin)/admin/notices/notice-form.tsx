'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ImagePlus, RefreshCw, Trash2 } from 'lucide-react';
import { PageHead } from '@/components/ds';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLocale, useT } from '@/lib/i18n/client';
import { intlLocale } from '@/lib/i18n/config';
import {
  IMAGE_ACCEPT,
  imageFileType,
  mediaUrl,
  NOTICE_IMAGE_MAX_BYTES,
} from '@/lib/media';
import {
  expiryToDate,
  NOTICE_BODY_MAX,
  NOTICE_TITLE_MAX,
  todayInEthiopia,
} from '@/lib/notices';
import { cn } from '@/lib/utils';
import { createNotice, updateNotice } from './actions';

const FIELD_LABEL =
  'mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep';
const FIELD =
  'h-auto rounded-[10px] border border-solid border-parchment-edge bg-parchment-soft md:bg-parchment px-3.5 py-[11px] text-[13px] text-ink shadow-[inset_0_1px_2px_rgba(10,60,54,0.04)] placeholder:text-ink-faint focus-visible:ring-2 focus-visible:ring-gold/30 dark:bg-parchment-deep dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]';
const SMALL_BTN =
  'inline-flex items-center gap-1 rounded-full border border-parchment-edge bg-parchment-soft px-2.5 py-1 text-[11px] font-semibold transition-colors hover:bg-parchment-deep';

/** Radix Select needs a non-empty value; this one means "for everyone". */
const EVERYONE = 'everyone';

export interface NoticeFormNotice {
  id: string;
  title: string;
  body: string;
  departmentId: number | null;
  imageKey: string | null;
  pinned: boolean;
  /** ISO timestamp */
  expiresAt: string | null;
}

interface NoticeFormProps {
  notice?: NoticeFormNotice | null;
  /** Departments this user may post to. */
  departments: { id: number; nameEn: string; nameAm: string }[];
  /** Admins may post for everyone. */
  canPostToEveryone: boolean;
}

export function NoticeForm({
  notice,
  departments,
  canPostToEveryone,
}: NoticeFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const t = useT();
  const locale = useLocale();
  const isEdit = !!notice;
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(notice?.title ?? '');
  const [body, setBody] = useState(notice?.body ?? '');
  const [dept, setDept] = useState(
    notice
      ? notice.departmentId === null
        ? EVERYONE
        : String(notice.departmentId)
      : canPostToEveryone
        ? EVERYONE
        : String(departments[0]?.id ?? ''),
  );
  const [pinned, setPinned] = useState(notice?.pinned ?? false);
  const [expiresOn, setExpiresOn] = useState(
    notice?.expiresAt ? expiryToDate(notice.expiresAt) : '',
  );
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [saving, setSaving] = useState(false);

  // Local preview of a newly chosen image.
  useEffect(() => {
    if (!image) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const shownImage =
    preview ??
    (notice?.imageKey && !removeImage ? mediaUrl(notice.imageKey) : null);

  const deptName = (d: NoticeFormProps['departments'][number]) =>
    locale === 'en' ? d.nameEn : d.nameAm;
  const fmt = new Intl.NumberFormat(intlLocale(locale));

  function showError(message: string) {
    toast({
      title: t('Error'),
      description: t(message),
      variant: 'destructive',
    });
  }

  function pickImage(file: File | undefined) {
    if (fileRef.current) fileRef.current.value = '';
    if (!file) return;
    if (!imageFileType(file.name, file.type))
      return showError('Only JPG, PNG and WEBP images are allowed.');
    if (file.size > NOTICE_IMAGE_MAX_BYTES)
      return showError('Image is larger than 5 MB.');
    setImage(file);
    setRemoveImage(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData();
    formData.set('title', title);
    formData.set('body', body);
    formData.set('departmentId', dept === EVERYONE ? '' : dept);
    if (pinned) formData.set('pinned', 'on');
    formData.set('expiresOn', expiresOn);
    if (image) formData.set('image', image);
    if (removeImage) formData.set('removeImage', '1');

    const res = notice
      ? await updateNotice(notice.id, formData)
      : await createNotice(formData);
    setSaving(false);

    if (!res.ok) return showError(res.error);
    toast({ title: isEdit ? t('Notice updated') : t('Notice posted') });
    router.push('/admin/notices');
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl px-[22px] pb-6 pt-4 md:mx-0 md:max-w-[760px] md:px-7 md:py-7">
      <Link
        href="/admin/notices"
        className="mb-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-gold-deep transition-colors hover:text-brand dark:hover:text-gold-light"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t('Notices')}
      </Link>

      <PageHead
        en={isEdit ? 'Edit notice' : 'New notice'}
        className="mb-4"
      />

      <form
        onSubmit={handleSubmit}
        className="space-y-3.5 md:rounded-2xl md:border md:border-parchment-edge md:bg-parchment-soft md:p-7 md:shadow-[0_1px_0_rgba(10,60,54,0.04),0_4px_14px_-8px_rgba(10,60,54,0.12)] md:dark:shadow-[0_4px_14px_-8px_rgba(0,0,0,0.4)]"
      >
        {/* Title */}
        <div>
          <Label htmlFor="title" className={FIELD_LABEL}>
            {t('Notice title')}
          </Label>
          <Input
            id="title"
            required
            maxLength={NOTICE_TITLE_MAX}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('e.g. Feast of the Apostles')}
            className={cn(FIELD, 'text-sm font-medium text-brand-ink')}
          />
        </div>

        {/* Message */}
        <div>
          <Label htmlFor="body" className={FIELD_LABEL}>
            {t('Full message')}
          </Label>
          <Textarea
            id="body"
            required
            rows={8}
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, NOTICE_BODY_MAX))}
            className={cn(
              FIELD,
              'min-h-[150px] rounded-xl px-4 py-3.5 text-sm leading-[1.7] focus-visible:ring-offset-0',
            )}
          />
          <div className="mt-1 flex justify-between gap-3 text-[10px] text-ink-muted">
            <span>
              {t(
                'Details members see when they open the notice. Leave a blank line between paragraphs.',
              )}
            </span>
            <span className="shrink-0 font-mono">
              {fmt.format(body.length)} / {fmt.format(NOTICE_BODY_MAX)}
            </span>
          </div>
        </div>

        {/* Audience + end date */}
        <div className="grid gap-3.5 md:grid-cols-2">
          <div>
            <Label htmlFor="department" className={FIELD_LABEL}>
              {t('For')}
            </Label>
            <Select value={dept} onValueChange={setDept} required>
              <SelectTrigger
                id="department"
                disabled={!canPostToEveryone && departments.length <= 1}
                className={cn(
                  FIELD,
                  'focus:ring-2 focus:ring-gold/30 focus:ring-offset-0',
                  locale === 'am' && 'font-ethiopic',
                )}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-parchment-edge bg-parchment-soft">
                {canPostToEveryone && (
                  <SelectItem value={EVERYONE}>{t('Everyone')}</SelectItem>
                )}
                {departments.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    <span className={cn(locale === 'am' && 'font-ethiopic')}>
                      {deptName(d)}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="expiresOn" className={FIELD_LABEL}>
              {t('Show until')} · {t('optional')}
            </Label>
            <Input
              id="expiresOn"
              type="date"
              // An expired notice keeps its old date when edited.
              min={
                expiresOn && expiresOn < todayInEthiopia()
                  ? expiresOn
                  : todayInEthiopia()
              }
              value={expiresOn}
              onChange={(e) => setExpiresOn(e.target.value)}
              className={cn(FIELD, 'font-mono text-[12.5px]')}
            />
            <p className="mt-1 text-[10px] text-ink-muted">
              {t('Members no longer see it after this day.')}
            </p>
          </div>
        </div>

        {/* Image */}
        <div>
          <div className={FIELD_LABEL}>
            {t('Image')} · {t('optional')}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept={IMAGE_ACCEPT}
            className="hidden"
            onChange={(e) => pickImage(e.target.files?.[0])}
          />
          {shownImage ? (
            <div className="overflow-hidden rounded-xl border border-parchment-edge">
              <img
                src={shownImage}
                alt=""
                className="aspect-[16/7] w-full bg-parchment-deep object-cover"
              />
              <div className="flex items-center gap-1.5 border-t border-parchment-edge bg-parchment-soft px-3 py-2 md:bg-parchment dark:bg-parchment-deep">
                <span className="min-w-0 flex-1 truncate text-[11.5px] text-ink-muted">
                  {image?.name ?? t('Current image')}
                </span>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className={cn(SMALL_BTN, 'text-brand dark:text-gold')}
                >
                  <RefreshCw className="h-3 w-3" />
                  {t('Replace')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setImage(null);
                    setRemoveImage(true);
                  }}
                  className={cn(SMALL_BTN, 'text-status-absent')}
                >
                  <Trash2 className="h-3 w-3" />
                  {t('Remove')}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full items-center gap-3 rounded-xl border border-dashed border-gold/50 bg-parchment-soft px-3.5 py-3 text-left transition-colors hover:bg-parchment-deep md:bg-parchment dark:bg-parchment-deep"
            >
              <ImagePlus className="h-5 w-5 shrink-0 text-gold-deep" />
              <span className="min-w-0">
                <span className="block text-[12.5px] font-semibold text-brand-ink">
                  {t('Add an image')}
                </span>
                <span className="block text-[11px] text-ink-muted">
                  {t('JPG, PNG or WEBP · max 5 MB')}
                </span>
              </span>
            </button>
          )}
        </div>

        {/* Pinned */}
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-parchment-edge bg-parchment-soft px-3.5 py-3 md:bg-parchment dark:bg-parchment-deep">
          <input
            type="checkbox"
            checked={pinned}
            onChange={(e) => setPinned(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-gold"
          />
          <span>
            <span className="block text-[12.5px] font-semibold text-brand-ink">
              {t('Pin to the top')}
            </span>
            <span className="block text-[11px] text-ink-muted">
              {t('Pinned notices stay above the others; the newest is featured.')}
            </span>
          </span>
        </label>

        {/* Actions */}
        <div className="flex gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => router.push('/admin/notices')}
            className="flex-1 rounded-[10px] border border-parchment-edge bg-parchment-soft px-3.5 py-3 text-[12.5px] font-semibold text-brand transition-colors hover:bg-parchment-deep dark:text-gold md:bg-parchment md:dark:bg-parchment-deep"
          >
            {t('Cancel')}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="sacred-gradient flex flex-1 items-center justify-center gap-2 rounded-xl border border-gold/40 px-5 py-3 text-[13px] font-semibold tracking-[0.04em] text-cream shadow-[0_6px_16px_-6px_rgba(10,60,54,0.4),inset_0_1px_0_rgba(212,168,67,0.25)] transition-opacity hover:opacity-95 disabled:opacity-60"
          >
            {saving
              ? t('Saving…')
              : isEdit
                ? t('Save changes')
                : t('Publish notice')}
          </button>
        </div>
      </form>
    </div>
  );
}
