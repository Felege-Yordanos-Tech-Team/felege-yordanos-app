'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@felege-yordanos/db';
import type { Database } from '@felege-yordanos/db';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, X, Search } from 'lucide-react';

type Song = Database['public']['Tables']['songs']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

interface SongsTableProps {
  songs: Song[];
  categories: Category[];
}

export function SongsTable({ songs, categories }: SongsTableProps) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [deleteTarget, setDeleteTarget] = useState<Song | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Category management state
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
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
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
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
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
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
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
    const { error } = await supabase.from('categories').update({
      name: editCatName,
      emoji: editCatEmoji || null,
      color: editCatColor || null,
    } as never).eq('id', editCatTarget.id);
    setUpdatingCat(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Category updated' });
      setEditCatTarget(null);
      router.refresh();
    }
  }

  return (
    <div className="mt-6 space-y-6">
      {/* Categories Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <p className="text-[10px] font-label font-medium uppercase tracking-widest text-secondary">
            Categories
          </p>
          <Button size="sm" variant="outline" onClick={() => setShowAddCategory(true)}>
            <Plus className="mr-1 h-3 w-3" /> Add Category
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Badge key={cat.id} variant="secondary" className="gap-1 pr-1">
                <button onClick={() => openEditCategory(cat)} className="hover:underline">
                  {cat.emoji} {cat.name}
                </button>
                <button
                  onClick={() => setDeleteCatTarget(cat)}
                  className="ml-1 rounded-full p-0.5 hover:bg-foreground/10"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {categories.length === 0 && (
              <p className="text-sm text-muted-foreground">No categories yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Songs Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search songs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.name}>
                {cat.emoji} {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button asChild>
          <Link href="/admin/songs/new">
            <Plus className="mr-1 h-4 w-4" /> Add Song
          </Link>
        </Button>
      </div>

      {/* Songs Table */}
      <div className="rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">#</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>English</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                  No songs found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((song) => (
                <TableRow key={song.id}>
                  <TableCell className="font-medium">{song.number}</TableCell>
                  <TableCell className="font-headline text-primary">{song.title}</TableCell>
                  <TableCell className="text-muted-foreground">{song.title_en ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{song.category}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/songs/${song.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(song)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Song Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Song</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{deleteTarget?.title}&rdquo;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteSong} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Dialog */}
      <Dialog open={!!deleteCatTarget} onOpenChange={(open) => !open && setDeleteCatTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{deleteCatTarget?.name}&rdquo;? Songs using this category may be affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteCatTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteCategory} disabled={deletingCat}>
              {deletingCat ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Category Dialog */}
      <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
        <DialogContent>
          <form onSubmit={handleAddCategory}>
            <DialogHeader>
              <DialogTitle>Add Category</DialogTitle>
              <DialogDescription>Create a new song category.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="catName">Name</Label>
                <Input
                  id="catName"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="ምስጋና"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="catEmoji">Emoji (optional)</Label>
                  <Input
                    id="catEmoji"
                    value={catEmoji}
                    onChange={(e) => setCatEmoji(e.target.value)}
                    placeholder="🙏"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="catColor">Color (optional)</Label>
                  <Input
                    id="catColor"
                    value={catColor}
                    onChange={(e) => setCatColor(e.target.value)}
                    placeholder="#3B82F6"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddCategory(false)}>Cancel</Button>
              <Button type="submit" disabled={savingCat}>
                {savingCat ? 'Saving...' : 'Add Category'}
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
              <DialogTitle>Edit Category</DialogTitle>
              <DialogDescription>Update the category details.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editCatName">Name</Label>
                <Input
                  id="editCatName"
                  required
                  value={editCatName}
                  onChange={(e) => setEditCatName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editCatEmoji">Emoji (optional)</Label>
                  <Input
                    id="editCatEmoji"
                    value={editCatEmoji}
                    onChange={(e) => setEditCatEmoji(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editCatColor">Color (optional)</Label>
                  <Input
                    id="editCatColor"
                    value={editCatColor}
                    onChange={(e) => setEditCatColor(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditCatTarget(null)}>Cancel</Button>
              <Button type="submit" disabled={updatingCat}>
                {updatingCat ? 'Saving...' : 'Update Category'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
