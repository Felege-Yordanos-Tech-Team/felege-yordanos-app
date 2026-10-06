'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type {
  categories as categoriesTable,
  songs as songsTable,
} from '@felege-yordanos/db/schema';
import { Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, Eyebrow } from '@/components/ds';
import { useToast } from '@/hooks/use-toast';
import { useT } from '@/lib/i18n/client';
import { cn } from '@/lib/utils';
import {
  categoryDot,
  categoryDotMap,
  hasEthiopic,
  songNumber,
} from '@/lib/category-color';
import {
  createCategory,
  deleteCategory,
  deleteSong,
  updateCategory,
} from './actions';

type Song = typeof songsTable.$inferSelect;
type Category = typeof categoriesTable.$inferSelect;

interface SongsTableProps {
  songs: Song[];
  categories: Category[];
}

/* Shared class strings. */
const FIELD_LABEL =
  'mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep';
const FIELD =
  'h-auto rounded-[10px] border border-solid border-parchment-edge bg-parchment px-3.5 py-[11px] text-[13px] text-ink shadow-[inset_0_1px_2px_rgba(10,60,54,0.04)] placeholder:text-ink-faint focus-visible:ring-2 focus-visible:ring-gold/30 dark:bg-parchment-deep dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]';
const SECONDARY_BTN =
  'inline-flex items-center justify-center gap-1.5 rounded-[10px] border border-parchment-edge bg-parchment-soft px-3.5 py-[9px] text-[12.5px] font-semibold text-brand transition-colors hover:bg-parchment-deep disabled:opacity-60 dark:text-gold';
const PRIMARY_BTN =
  'sacred-gradient inline-flex items-center justify-center gap-2 rounded-xl border border-gold/40 px-4 py-[9px] text-[13px] font-semibold tracking-[0.04em] text-cream shadow-[0_6px_16px_-6px_rgba(10,60,54,0.4),inset_0_1px_0_rgba(212,168,67,0.25)] transition-opacity hover:opacity-95 disabled:opacity-60';
const DANGER_BTN =
  'inline-flex items-center justify-center rounded-[10px] bg-status-absent px-4 py-[9px] text-[13px] font-semibold text-cream transition-opacity hover:opacity-90 disabled:opacity-60';
const ICON_BTN =
  'flex h-[26px] w-[26px] items-center justify-center rounded-[7px] border border-parchment-edge transition-colors';
const DIALOG = 'border-parchment-edge bg-parchment-soft sm:rounded-2xl';
const DIALOG_TITLE = 'font-display text-[22px] font-medium text-brand-ink';

export function SongsTable({ songs, categories }: SongsTableProps) {
  const router = useRouter();
  const { toast } = useToast();
  const t = useT();

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [deleteTarget, setDeleteTarget] = useState<Song | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [showAddCategory, setShowAddCategory] = useState(false);
  const [catName, setCatName] = useState('');
  const [catEmoji, setCatEmoji] = useState('');
  const [catColor, setCatColor] = useState('');
  const [savingCat, setSavingCat] = useState(false);
  const [deleteCatTarget, setDeleteCatTarget] = useState<Category | null>(null);
  const [deletingCat, setDeletingCat] = useState(false);
  const [editCatTarget, setEditCatTarget] = useState<Category | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatEmoji, setEditCatEmoji] = useState('');
  const [editCatColor, setEditCatColor] = useState('');
  const [updatingCat, setUpdatingCat] = useState(false);

  const dots = useMemo(() => categoryDotMap(categories), [categories]);

  const songCountByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of songs) {
      map.set(s.category, (map.get(s.category) ?? 0) + 1);
    }
    return map;
  }, [songs]);

  const filtered = songs.filter((song) => {
    const matchesSearch =
      !search ||
      song.title.toLowerCase().includes(search.toLowerCase()) ||
      song.titleEn?.toLowerCase().includes(search.toLowerCase()) ||
      song.number?.toString() === search;
    const matchesCategory =
      filterCategory === 'all' || song.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  function showError(error: string) {
    toast({ title: t('Error'), description: t(error), variant: 'destructive' });
  }

  async function handleDeleteSong() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await deleteSong(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    if (!res.ok) showError(res.error);
    else {
      toast({ title: t('Song deleted') });
      router.refresh();
    }
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    setSavingCat(true);
    const res = await createCategory({
      name: catName,
      emoji: catEmoji,
      color: catColor,
    });
    setSavingCat(false);
    if (!res.ok) showError(res.error);
    else {
      toast({ title: t('Category added') });
      setCatName('');
      setCatEmoji('');
      setCatColor('');
      setShowAddCategory(false);
      router.refresh();
    }
  }

  async function handleDeleteCategory() {
    if (!deleteCatTarget) return;
    setDeletingCat(true);
    const res = await deleteCategory(deleteCatTarget.id);
    setDeletingCat(false);
    setDeleteCatTarget(null);
    if (!res.ok) showError(res.error);
    else {
      toast({ title: t('Category deleted') });
      router.refresh();
    }
  }

  function openEditCategory(cat: Category) {
    setEditCatTarget(cat);
    setEditCatName(cat.name);
    setEditCatEmoji(cat.emoji ?? '');
    setEditCatColor(cat.color ?? '');
  }

  async function handleUpdateCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!editCatTarget) return;
    setUpdatingCat(true);
    const res = await updateCategory(editCatTarget.id, {
      name: editCatName,
      emoji: editCatEmoji,
      color: editCatColor,
    });
    setUpdatingCat(false);
    if (!res.ok) showError(res.error);
    else {
      toast({ title: t('Category updated') });
      setEditCatTarget(null);
      router.refresh();
    }
  }

  const eth = (s: string | null | undefined) =>
    hasEthiopic(s) ? 'font-ethiopic' : '';

  const editButton = (song: Song) => (
    <Link
      href={`/admin/songs/${song.id}/edit`}
      aria-label={t('Edit song')}
      title={t('Edit')}
      className={cn(
        ICON_BTN,
        'text-ink-muted hover:bg-parchment-deep hover:text-ink',
      )}
    >
      <Pencil className="h-[11px] w-[11px]" />
    </Link>
  );
  const deleteButton = (song: Song) => (
    <button
      type="button"
      onClick={() => setDeleteTarget(song)}
      aria-label={t('Delete song')}
      title={t('Delete')}
      className={cn(ICON_BTN, 'text-status-absent hover:bg-status-absent-bg')}
    >
      <Trash2 className="h-[11px] w-[11px]" />
    </button>
  );

  const emptyRow = (
    <p className="py-8 text-center text-sm text-ink-muted">
      {songs.length === 0 ? t('No songs yet') : t('No songs found')}
    </p>
  );

  /** Category form fields, shared by the add and edit dialogs. */
  const categoryFields = (
    ids: { name: string; emoji: string; color: string },
    values: { name: string; emoji: string; color: string },
    set: {
      name: (v: string) => void;
      emoji: (v: string) => void;
      color: (v: string) => void;
    },
    placeholders: boolean,
    index: number,
  ) => (
    <div className="space-y-3.5 py-4">
      <div>
        <Label htmlFor={ids.name} className={FIELD_LABEL}>
          {t('Name')}
        </Label>
        <Input
          id={ids.name}
          required
          value={values.name}
          onChange={(e) => set.name(e.target.value)}
          placeholder={placeholders ? 'ምስጋና' : undefined}
          className={cn(FIELD, 'font-ethiopic')}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor={ids.emoji} className={FIELD_LABEL}>
            {t('Emoji')}
          </Label>
          <Input
            id={ids.emoji}
            value={values.emoji}
            onChange={(e) => set.emoji(e.target.value)}
            placeholder={placeholders ? '🙏' : undefined}
            className={FIELD}
          />
        </div>
        <div>
          <Label htmlFor={ids.color} className={FIELD_LABEL}>
            {t('Color')}
          </Label>
          <div className="relative">
            <span
              aria-hidden
              className="pointer-events-none absolute left-3.5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full"
              style={{ background: categoryDot(values.color, index) }}
            />
            <Input
              id={ids.color}
              value={values.color}
              onChange={(e) => set.color(e.target.value)}
              placeholder={placeholders ? '#D4A843' : undefined}
              className={cn(FIELD, 'pl-8 font-mono text-[12.5px]')}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ─── PHONE (< md): categories card, toolbar, compact table ─── */}
      <div className="mt-4 flex flex-col md:hidden">
        {/* Categories card */}
        <section className="rounded-[14px] border border-parchment-edge bg-parchment-soft px-4 py-3.5">
          <div className="mb-2.5 flex items-center justify-between">
            <Eyebrow>{t('Categories')}</Eyebrow>
            <button
              type="button"
              onClick={() => setShowAddCategory(true)}
              className={SECONDARY_BTN}
            >
              <Plus className="h-[13px] w-[13px]" />
              {t('Add')}
            </button>
          </div>

          {categories.length === 0 ? (
            <p className="text-sm text-ink-muted">{t('No categories yet')}</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <span
                  key={cat.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-parchment-edge bg-gold/10 py-1 pl-3 pr-1.5 text-[11px] text-ink"
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: dots.get(cat.name) }}
                  />
                  <button
                    type="button"
                    onClick={() => openEditCategory(cat)}
                    className={cn('hover:underline', eth(cat.name))}
                    aria-label={`${t('Edit category')}: ${cat.name}`}
                  >
                    {cat.name}
                  </button>
                  <span className="ml-0.5 rounded bg-parchment px-[5px] py-px font-mono text-[9px] font-medium text-ink-muted">
                    {songCountByCategory.get(cat.name) ?? 0}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDeleteCatTarget(cat)}
                    className="flex h-[18px] w-[18px] items-center justify-center rounded-full text-ink-faint hover:text-ink"
                    aria-label={`${t('Delete category')}: ${cat.name}`}
                  >
                    <X className="h-[11px] w-[11px]" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Toolbar */}
        <div className="mt-3.5 flex gap-1.5">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
            <input
              type="text"
              aria-label={t('Search songs')}
              placeholder={t('Search songs…')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-[10px] border border-parchment-edge bg-parchment-soft py-[9px] pl-[34px] pr-3 text-[12.5px] text-ink outline-none placeholder:text-ink-faint focus-visible:ring-2 focus-visible:ring-gold/30"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger
              aria-label={t('Category')}
              className="h-auto w-auto max-w-[45%] gap-1.5 rounded-[10px] border-parchment-edge bg-parchment-soft px-3 py-[9px] text-[12.5px] text-ink focus:ring-gold/30 focus:ring-offset-0"
            >
              <SelectValue placeholder={t('All categories')} />
            </SelectTrigger>
            <SelectContent className="border-parchment-edge bg-parchment-soft">
              <SelectItem value="all">{t('All categories')}</SelectItem>
              {categories.map((cat) => (
                <SelectItem
                  key={cat.id}
                  value={cat.name}
                  className={eth(cat.name)}
                >
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Songs table */}
        <div className="mt-3.5 overflow-hidden rounded-xl border border-parchment-edge bg-parchment-soft">
          <div className="grid grid-cols-[36px_1fr_56px_64px] items-center gap-2 border-b border-parchment-edge bg-gold/10 px-3.5 py-2.5 dark:bg-gold/[0.04]">
            {['#', t('Title'), t('Cat.'), ''].map((h, i) => (
              <span
                key={i}
                className={cn(
                  'text-[9px] font-semibold uppercase tracking-[0.18em] text-gold-deep',
                  i === 3 && 'text-right',
                )}
              >
                {h}
              </span>
            ))}
          </div>

          {filtered.length === 0
            ? emptyRow
            : filtered.map((song, i) => (
                <div
                  key={song.id}
                  className={cn(
                    'grid grid-cols-[36px_1fr_56px_64px] items-center gap-2 px-3.5 py-[11px]',
                    i < filtered.length - 1 && 'border-b border-parchment-edge',
                  )}
                >
                  <span className="font-mono text-[11px] font-semibold tabular-nums text-ink-muted">
                    {songNumber(song.number)}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate font-ethiopic text-sm font-semibold leading-[1.15] text-brand-ink">
                      {song.title}
                    </div>
                    {song.titleEn && (
                      <div className="truncate font-display text-[11px] italic text-ink-muted">
                        {song.titleEn}
                      </div>
                    )}
                  </div>
                  <span
                    className={cn(
                      'truncate text-[9px] font-semibold uppercase tracking-[0.06em] text-gold-deep',
                      eth(song.category),
                    )}
                  >
                    {song.category}
                  </span>
                  <div className="flex justify-end gap-1">
                    {editButton(song)}
                    {deleteButton(song)}
                  </div>
                </div>
              ))}
        </div>
      </div>

      {/* ─── DESKTOP (md+): categories rail + songs table ─── */}
      <div className="hidden grid-cols-[230px_1fr] items-start gap-4 md:grid">
        {/* Categories rail */}
        <Card className="p-3.5">
          <Eyebrow className="px-2 pb-2 pt-1">{t('Categories')}</Eyebrow>
          {[{ id: 'all', name: 'all' } as const, ...categories].map((cat) => {
            const isAll = cat.id === 'all';
            const value = isAll ? 'all' : cat.name;
            const active = filterCategory === value;
            const label = isAll ? t('All songs') : cat.name;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFilterCategory(value)}
                aria-pressed={active}
                className={cn(
                  'mb-px flex w-full items-center gap-[9px] rounded-[9px] px-2.5 py-2 text-left text-[12.5px] transition-colors',
                  active
                    ? 'bg-brand/[0.07] font-semibold text-brand dark:bg-gold/[0.12] dark:text-gold'
                    : 'font-medium text-ink hover:bg-parchment-deep/60',
                )}
              >
                <span
                  className={cn(
                    'h-[7px] w-[7px] shrink-0 rounded-full',
                    isAll && 'bg-ink-faint',
                  )}
                  style={isAll ? undefined : { background: dots.get(cat.name) }}
                />
                <span className={cn('flex-1 truncate', eth(label))}>
                  {label}
                </span>
                <span className="font-mono text-[10px] font-normal text-ink-faint">
                  {isAll
                    ? songs.length
                    : (songCountByCategory.get(cat.name) ?? 0)}
                </span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setShowAddCategory(true)}
            className="mt-1.5 flex w-full items-center gap-2 border-t border-parchment-edge px-2.5 pb-1 pt-[9px] text-[11.5px] font-semibold text-gold-deep transition-colors hover:text-brand dark:hover:text-gold-light"
          >
            <Plus className="h-3 w-3" />
            {t('Add category')}
          </button>
          {filterCategory !== 'all' &&
            (() => {
              const cat = categories.find((c) => c.name === filterCategory);
              if (!cat) return null;
              return (
                <div className="flex gap-1 px-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => openEditCategory(cat)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-medium text-ink-muted transition-colors hover:bg-parchment-deep hover:text-ink"
                  >
                    <Pencil className="h-3 w-3" />
                    {t('Edit')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteCatTarget(cat)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-medium text-status-absent transition-colors hover:bg-status-absent-bg"
                  >
                    <Trash2 className="h-3 w-3" />
                    {t('Delete')}
                  </button>
                </div>
              );
            })()}
        </Card>

        {/* Songs table */}
        <Card className="p-[22px]">
          <label className="mb-3.5 flex w-[280px] items-center gap-2 rounded-[10px] border border-parchment-edge bg-parchment px-[11px] py-[7px] focus-within:ring-2 focus-within:ring-gold/30 dark:bg-parchment-deep">
            <Search className="h-3 w-3 shrink-0 text-ink-faint" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label={t('Search songs')}
              placeholder={
                filterCategory !== 'all'
                  ? t('Search in {category}…', { category: filterCategory })
                  : t('Search songs…')
              }
              className="w-full bg-transparent text-[11.5px] text-ink outline-none placeholder:text-ink-faint"
            />
          </label>
          <div className="grid grid-cols-[46px_1.3fr_1.1fr_110px_70px] gap-3 border-b border-parchment-edge-strong px-1 pb-[9px]">
            {[
              '#',
              t('Title · Amharic'),
              t('Title · English'),
              t('Category'),
              '',
            ].map((h, i) => (
              <span
                key={i}
                className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-gold-deep"
              >
                {h}
              </span>
            ))}
          </div>
          {filtered.length === 0
            ? emptyRow
            : filtered.map((song) => (
                <div
                  key={song.id}
                  className="grid grid-cols-[46px_1.3fr_1.1fr_110px_70px] items-center gap-3 border-b border-parchment-edge px-1 py-3"
                >
                  <span className="font-display text-[15px] font-semibold text-brand dark:text-gold">
                    {songNumber(song.number)}
                  </span>
                  <span className="truncate font-ethiopic text-[13.5px] font-semibold text-brand-ink">
                    {song.title}
                  </span>
                  <span className="truncate font-display text-[13px] italic text-ink-muted">
                    {song.titleEn}
                  </span>
                  <span
                    className={cn(
                      'truncate text-[9.5px] font-semibold uppercase tracking-[0.1em] text-gold-deep',
                      eth(song.category),
                    )}
                  >
                    {song.category}
                  </span>
                  <div className="flex justify-end gap-1">
                    {editButton(song)}
                    {deleteButton(song)}
                  </div>
                </div>
              ))}
        </Card>
      </div>

      {/* Delete song */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className={DIALOG}>
          <DialogHeader>
            <DialogTitle className={DIALOG_TITLE}>
              {t('Delete song')}
            </DialogTitle>
            <DialogDescription className="text-ink-muted">
              {t(
                'Are you sure you want to delete “{title}”? This cannot be undone.',
                {
                  title: deleteTarget?.title ?? '',
                },
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <button
              type="button"
              className={SECONDARY_BTN}
              onClick={() => setDeleteTarget(null)}
            >
              {t('Keep it')}
            </button>
            <button
              type="button"
              className={DANGER_BTN}
              onClick={handleDeleteSong}
              disabled={deleting}
            >
              {deleting ? t('Deleting…') : t('Delete')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete category */}
      <Dialog
        open={!!deleteCatTarget}
        onOpenChange={(open) => !open && setDeleteCatTarget(null)}
      >
        <DialogContent className={DIALOG}>
          <DialogHeader>
            <DialogTitle className={DIALOG_TITLE}>
              {t('Delete category')}
            </DialogTitle>
            <DialogDescription className="text-ink-muted">
              {t(
                'Delete “{name}”? Songs using this category may be affected.',
                {
                  name: deleteCatTarget?.name ?? '',
                },
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <button
              type="button"
              className={SECONDARY_BTN}
              onClick={() => setDeleteCatTarget(null)}
            >
              {t('Keep it')}
            </button>
            <button
              type="button"
              className={DANGER_BTN}
              onClick={handleDeleteCategory}
              disabled={deletingCat}
            >
              {deletingCat ? t('Deleting…') : t('Delete')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add category */}
      <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
        <DialogContent className={DIALOG}>
          <form onSubmit={handleAddCategory}>
            <DialogHeader>
              <DialogTitle className={DIALOG_TITLE}>
                {t('Add category')}
              </DialogTitle>
              <DialogDescription className="text-ink-muted">
                {t('Create a new song category.')}
              </DialogDescription>
            </DialogHeader>
            {categoryFields(
              { name: 'catName', emoji: 'catEmoji', color: 'catColor' },
              { name: catName, emoji: catEmoji, color: catColor },
              { name: setCatName, emoji: setCatEmoji, color: setCatColor },
              true,
              categories.length,
            )}
            <DialogFooter className="gap-2">
              <button
                type="button"
                className={SECONDARY_BTN}
                onClick={() => setShowAddCategory(false)}
              >
                {t('Cancel')}
              </button>
              <Button
                type="submit"
                disabled={savingCat}
                className={cn(PRIMARY_BTN, 'h-auto')}
              >
                {savingCat ? t('Saving…') : t('Add category')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit category */}
      <Dialog
        open={!!editCatTarget}
        onOpenChange={(open) => !open && setEditCatTarget(null)}
      >
        <DialogContent className={DIALOG}>
          <form onSubmit={handleUpdateCategory}>
            <DialogHeader>
              <DialogTitle className={DIALOG_TITLE}>
                {t('Edit category')}
              </DialogTitle>
              <DialogDescription className="text-ink-muted">
                {t('Update the category details.')}
              </DialogDescription>
            </DialogHeader>
            {categoryFields(
              {
                name: 'editCatName',
                emoji: 'editCatEmoji',
                color: 'editCatColor',
              },
              { name: editCatName, emoji: editCatEmoji, color: editCatColor },
              {
                name: setEditCatName,
                emoji: setEditCatEmoji,
                color: setEditCatColor,
              },
              false,
              Math.max(
                0,
                categories.findIndex((c) => c.id === editCatTarget?.id),
              ),
            )}
            <DialogFooter className="gap-2">
              <button
                type="button"
                className={SECONDARY_BTN}
                onClick={() => setEditCatTarget(null)}
              >
                {t('Cancel')}
              </button>
              <Button
                type="submit"
                disabled={updatingCat}
                className={cn(PRIMARY_BTN, 'h-auto')}
              >
                {updatingCat ? t('Saving…') : t('Update')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
