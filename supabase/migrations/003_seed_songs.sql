-- Create categories and songs tables, then seed with sample data.

-- 1. Categories table
create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  emoji      text,
  color      text,
  sort_order integer not null default 0
);

alter table public.categories enable row level security;

-- 2. Songs table
create table if not exists public.songs (
  id         uuid primary key default gen_random_uuid(),
  number     integer not null unique,
  title      text not null,
  title_en   text,
  category   text not null references public.categories(name),
  lyrics     text not null,
  audio_url  text,
  created_at timestamptz not null default now()
);

alter table public.songs enable row level security;

-- 3. Seed categories
insert into public.categories (name, emoji, color, sort_order) values
  ('ምስጋና', '🙏', 'blue', 1),
  ('ዝማሬ', '🎵', 'purple', 2),
  ('ተስፋ', '✨', 'amber', 3)
on conflict (name) do nothing;

-- 4. Seed sample songs
insert into public.songs (number, title, title_en, category, lyrics) values
  (1, 'እግዚአብሔር ታላቅ ነው', 'God is Great', 'ምስጋና',
   'እግዚአብሔር ታላቅ ነው
ስሙን እናመስግን
በክብሩ የሞላ
ለዘላለም ይኑር

ሰማይና ምድር ያመሰግኑት
ፍጥረት ሁሉ ይውደሱት
ታላቅ ነው ታላቅ ነው
አምላካችን ታላቅ ነው'),

  (2, 'ቅዱስ ቅዱስ ቅዱስ', 'Holy Holy Holy', 'ዝማሬ',
   'ቅዱስ ቅዱስ ቅዱስ
ሁሉን ቻይ አምላክ
ማልዶ ማልዶ ዝማሬያችን
ወደ አንተ ይደርሳል

ቅዱስ ቅዱስ ቅዱስ
ምህረት የበዛ አምላክ
ሦስትነት አንድነት
ቅዱስ አምላክ'),

  (3, 'ተስፋዬ አንተ ነህ', 'You Are My Hope', 'ተስፋ',
   'ተስፋዬ አንተ ነህ
በጨለማ ብርሃኔ
መንገዴን ታበራለህ
ዘላለም ተስፋዬ

በችግር ጊዜ ረዳቴ
በሐዘን ጊዜ መጽናኛዬ
ተስፋዬ አንተ ነህ
አምላኬ ተስፋዬ'),

  (4, 'ወደ አንተ እጮሃለሁ', 'I Cry Out to You', 'ምስጋና',
   'ወደ አንተ እጮሃለሁ
ጌታዬ ስማኝ
ልባዊ ጸሎቴን
ተቀበለኝ

ከጥልቅ ስፍራ
ድምፄን አሰማለሁ
እግዚአብሔር ሆይ
ወደ አንተ እጮሃለሁ'),

  (5, 'አዲስ ዝማሬ', 'A New Song', 'ዝማሬ',
   'አዲስ ዝማሬ እዘምራለሁ
ለአምላኬ ለፈጣሪዬ
ድንቅ ስራውን ሳስብ
ልቤ በደስታ ይሞላል

አዲስ ዝማሬ አዲስ ውዳሴ
ለጌታ ለአምላኬ
ዛሬም ነገም ዘላለም
እዘምርልሃለሁ')
on conflict (number) do nothing;
