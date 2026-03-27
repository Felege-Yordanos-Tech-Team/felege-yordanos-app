'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@felege-yordanos/db';
import type { Database } from '@felege-yordanos/db';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

type Song = Database['public']['Tables']['songs']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

interface SongFormProps {
  categories: Category[];
  song?: Song | null;
}

export function SongForm({ categories, song }: SongFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = !!song;

  const [number, setNumber] = useState(song?.number?.toString() ?? '');
  const [title, setTitle] = useState(song?.title ?? '');
  const [titleEn, setTitleEn] = useState(song?.title_en ?? '');
  const [category, setCategory] = useState(song?.category ?? '');
  const [lyrics, setLyrics] = useState(song?.lyrics ?? '');
  const [audioUrl, setAudioUrl] = useState(song?.audio_url ?? '');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();

    const payload = {
      number: parseInt(number, 10),
      title,
      title_en: titleEn || null,
      category,
      lyrics,
      audio_url: audioUrl || null,
    };

    const { error } = isEdit
      ? await supabase.from('songs').update(payload as never).eq('id', song!.id)
      : await supabase.from('songs').insert(payload as never);

    setLoading(false);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: isEdit ? 'Song updated' : 'Song created' });
      router.push('/admin/songs');
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <p className="text-[10px] font-label font-medium uppercase tracking-widest text-secondary">
            {isEdit ? 'Edit Song' : 'New Song'}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="number">Song Number</Label>
              <Input
                id="number"
                type="number"
                required
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.emoji} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title (Amharic)</Label>
            <Input
              id="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="የመዝሙር ስም"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="titleEn">Title (English, optional)</Label>
            <Input
              id="titleEn"
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              placeholder="Song title in English"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lyrics">Lyrics</Label>
            <Textarea
              id="lyrics"
              required
              rows={12}
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              placeholder="የመዝሙር ግጥም..."
              className="font-body"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="audioUrl">Audio URL (optional)</Label>
            <Input
              id="audioUrl"
              type="url"
              value={audioUrl}
              onChange={(e) => setAudioUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update Song' : 'Save Song'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push('/admin/songs')}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
