'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@felege-yordanos/db';
import type { Database } from '@felege-yordanos/db';
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
import { useToast } from '@/hooks/use-toast';

type Song = Database['public']['Tables']['songs']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

interface SongsTableProps {
  songs: Song[];
  categories: Category[];
}

const FALLBACK_DOTS = ['#D4A843', '#6B1D2A', '#8B2F3F', '#4F7B3E', '#C97B1A', '#A47A18'];

export function SongsTable({ songs, categories }: SongsTableProps) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

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

  const colorByCategory = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((cat, i) => {
      map.set(cat.name, cat.color || FALLBACK_DOTS[i % FALLBACK_DOTS.length]);
    });
    return map;
  }, [categories]);

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
      song.title_en?.toLowerCase().includes(search.toLowerCase()) ||
      song.number.toString() === search;
    const matchesCategory = filterCategory === 'all' || song.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  async function handleDeleteSong() {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from('songs').delete().eq('id', deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else {
      toast({ title: 'Song deleted' });
      router.refresh();
    }
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    setSavingCat(true);
    const { error } = await supabase.from('categories').insert({
      name: catName,
      emoji: catEmoji || null,
      color: catColor || null,
      sort_order: categories.length + 1,
    } as never);
    setSavingCat(false);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else {
      toast({ title: 'Category added' });
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
    const { error } = await supabase.from('categories').delete().eq('id', deleteCatTarget.id);
    setDeletingCat(false);
    setDeleteCatTarget(null);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else {
      toast({ title: 'Category deleted' });
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
    const { error } = await supabase
      .from('categories')
      .update({
        name: editCatName,
        emoji: editCatEmoji || null,
        color: editCatColor || null,
      } as never)
      .eq('id', editCatTarget.id);
    setUpdatingCat(false);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else {
      toast({ title: 'Category updated' });
      setEditCatTarget(null);
      router.refresh();
    }
  }

  return (
    <div className="mt-4 flex flex-col gap-4">
      {/* Add song button */}
      <div className="flex justify-end">
        <Button
          asChild
          size="sm"
          className="sacred-gradient inline-flex items-center gap-1.5 rounded-full border border-gold/40 px-3.5 py-1.5 text-xs font-semibold text-cream shadow-fy-md hover:opacity-95"
        >
          <Link href="/admin/songs/new">
            <Plus className="h-3.5 w-3.5 text-gold" />
            <span>Song</span>
          </Link>
        </Button>
      </div>

      {/* Categories card */}
      <section className="rounded-2xl border border-border bg-card px-4 py-3.5">
        <div className="mb-2.5 flex items-center justify-between">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-deep dark:text-gold">
            Categories
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddCategory(true)}
            className="h-7 gap-1 rounded-lg border-border bg-card px-2.5 text-[11px] font-semibold text-burgundy hover:bg-card/80 dark:text-gold"
          >
            <Plus className="h-3 w-3" />
            Add
          </Button>
        </div>

        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">No categories yet</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <span
                key={cat.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-gold/[0.10] py-1 pl-3 pr-1 text-[11px] text-foreground"
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: colorByCategory.get(cat.name) ?? '#D4A843' }}
                />
                <button
                  type="button"
                  onClick={() => openEditCategory(cat)}
                  className="hover:underline"
                >
                  {cat.emoji ? <span className="mr-1">{cat.emoji}</span> : null}
                  {cat.name}
                </button>
                <span className="rounded bg-background px-1.5 py-0.5 font-mono text-[9px] font-medium text-muted-foreground">
                  {songCountByCategory.get(cat.name) ?? 0}
                </span>
                <button
                  type="button"
                  onClick={() => setDeleteCatTarget(cat)}
                  className="flex h-4 w-4 items-center justify-center rounded-full text-ink-faint hover:text-foreground"
                  aria-label={`Delete ${cat.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
          <Input
            placeholder="Search songs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-[10px] border border-border bg-card pl-[34px] text-[12.5px] placeholder:text-ink-faint focus-visible:ring-2 focus-visible:ring-gold/30"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="h-10 w-[180px] rounded-[10px] border border-border bg-card text-[12.5px]">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.name}>
                {cat.emoji ? `${cat.emoji} ` : ''}
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Songs table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div
          className="grid items-center gap-2 border-b border-border bg-gold/[0.10] px-3.5 py-2.5 dark:bg-gold/[0.04]"
          style={{ gridTemplateColumns: '40px 1fr 80px 72px' }}
        >
          {['#', 'Title', 'Category', ''].map((h, i) => (
            <span
              key={i}
              className={`text-[9px] font-semibold uppercase tracking-[0.18em] text-gold-deep dark:text-gold ${
                i === 3 ? 'text-right' : ''
              }`}
            >
              {h}
            </span>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No songs found</p>
        ) : (
          filtered.map((song, i) => (
            <div
              key={song.id}
              className={`grid items-center gap-2 px-3.5 py-2.5 ${
                i < filtered.length - 1 ? 'border-b border-border' : ''
              }`}
              style={{ gridTemplateColumns: '40px 1fr 80px 72px' }}
            >
              <span className="font-mono text-[11px] font-semibold tabular-nums text-muted-foreground">
                {String(song.number).padStart(2, '0')}
              </span>
              <div className="min-w-0">
                <div className="truncate font-ethiopic text-sm font-semibold leading-tight text-burgundy-ink dark:text-cream">
                  {song.title}
                </div>
                {song.title_en && (
                  <div className="font-display text-[11px] italic text-muted-foreground">
                    {song.title_en}
                  </div>
                )}
              </div>
              <span className="text-[9px] font-semibold uppercase tracking-[0.06em] text-gold-deep dark:text-gold">
                {song.category}
              </span>
              <div className="flex justify-end gap-1">
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="h-[26px] w-[26px] rounded-md border border-border p-0 text-muted-foreground hover:text-foreground"
                >
                  <Link href={`/admin/songs/${song.id}/edit`} aria-label="Edit song">
                    <Pencil className="h-3 w-3" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteTarget(song)}
                  className="h-[26px] w-[26px] rounded-md border border-border p-0 text-status-absent hover:bg-status-absent-bg"
                  aria-label="Delete song"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Song Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Delete song</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{deleteTarget?.title}&rdquo;? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSong} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Dialog */}
      <Dialog open={!!deleteCatTarget} onOpenChange={(open) => !open && setDeleteCatTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Delete category</DialogTitle>
            <DialogDescription>
              Delete &ldquo;{deleteCatTarget?.name}&rdquo;? Songs using this category may be affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteCatTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCategory} disabled={deletingCat}>
              {deletingCat ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Category Dialog */}
      <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
        <DialogContent>
          <form onSubmit={handleAddCategory}>
            <DialogHeader>
              <DialogTitle className="font-display text-xl">Add category</DialogTitle>
              <DialogDescription>Create a new song category.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3.5 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="catName" className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep dark:text-gold">
                  Name
                </Label>
                <Input id="catName" required value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="ምስጋና" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="catEmoji" className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep dark:text-gold">
                    Emoji
                  </Label>
                  <Input id="catEmoji" value={catEmoji} onChange={(e) => setCatEmoji(e.target.value)} placeholder="🙏" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="catColor" className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep dark:text-gold">
                    Color
                  </Label>
                  <Input id="catColor" value={catColor} onChange={(e) => setCatColor(e.target.value)} placeholder="#D4A843" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddCategory(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={savingCat}>
                {savingCat ? 'Saving…' : 'Add category'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={!!editCatTarget} onOpenChange={(open) => !open && setEditCatTarget(null)}>
        <DialogContent>
          <form onSubmit={handleUpdateCategory}>
            <DialogHeader>
              <DialogTitle className="font-display text-xl">Edit category</DialogTitle>
              <DialogDescription>Update the category details.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3.5 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="editCatName" className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep dark:text-gold">
                  Name
                </Label>
                <Input id="editCatName" required value={editCatName} onChange={(e) => setEditCatName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="editCatEmoji" className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep dark:text-gold">
                    Emoji
                  </Label>
                  <Input id="editCatEmoji" value={editCatEmoji} onChange={(e) => setEditCatEmoji(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="editCatColor" className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep dark:text-gold">
                    Color
                  </Label>
                  <Input id="editCatColor" value={editCatColor} onChange={(e) => setEditCatColor(e.target.value)} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditCatTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updatingCat}>
                {updatingCat ? 'Saving…' : 'Update'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
