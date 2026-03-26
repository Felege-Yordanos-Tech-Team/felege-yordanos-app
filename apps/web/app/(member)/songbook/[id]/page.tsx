import { cookies } from 'next/headers';
import { createServerComponentClient } from '@felege-yordanos/db';
import type { Database } from '@felege-yordanos/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

type Song = Database['public']['Tables']['songs']['Row'];

export default async function SongDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createServerComponentClient(cookieStore);

  const { data } = await supabase
    .from('songs')
    .select('*')
    .eq('id', id)
    .single();

  const song = data as Song | null;

  if (!song) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href="/songbook">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to songbook
        </Link>
      </Button>

      <div className="mb-4 space-y-1">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
            {song.number}
          </span>
          <div>
            <h1 className="text-2xl font-bold">{song.title}</h1>
            {song.title_en && (
              <p className="text-sm text-muted-foreground">{song.title_en}</p>
            )}
          </div>
        </div>
        <Badge variant="secondary" className="mt-2">
          {song.category}
        </Badge>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Lyrics
          </p>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-base leading-relaxed">
            {song.lyrics}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
