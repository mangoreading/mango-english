-- 0054: 원서 읽기(Pre/Basic). 교과서(books/units)와 별도 구조.
-- 콘텐츠(본문·퀴즈 등)는 reading_books.content(jsonb), 이미지는 비공개 버킷 'reading'.
create table if not exists public.reading_books (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,                       -- 예: THE_PIE
  level text not null default 'PRE' check (level in ('PRE','BASIC')),
  title text not null,
  emoji text,
  week smallint not null default 1,
  ord smallint not null default 0,                 -- 학습 순서
  ar text,
  cover_path text,                                 -- 'reading' 버킷 안의 경로
  content jsonb not null default '{}'::jsonb,      -- warmup, phonics, keyWords, pages, quizzes, traceSentences, speakSentences
  status text not null default 'draft' check (status in ('draft','published')),
  version int not null default 1,
  updated_at timestamptz not null default now()
);
create index if not exists reading_books_level_idx on public.reading_books(level, week, ord);
alter table public.reading_books enable row level security;
drop policy if exists rb_read on public.reading_books;
create policy rb_read on public.reading_books for select to authenticated using (status = 'published' or is_hq());
drop policy if exists rb_hq on public.reading_books;
create policy rb_hq on public.reading_books for all to authenticated using (is_hq()) with check (is_hq());

-- 학습 진도(학생 본인만 읽고 씀, 본사는 읽기)
create table if not exists public.reading_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references public.reading_books(id) on delete cascade,
  step_reached smallint not null default 0,        -- 0..8
  completed boolean not null default false,
  taps int not null default 0,                     -- Read 모드에서 눌러 본 고유 단어 수
  quiz_ok int not null default 0,                  -- 퀴즈 첫 시도 정답 수
  quiz_total int not null default 0,
  speak_stars int not null default 0,              -- 말하기 별 합계
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, book_id)
);
alter table public.reading_progress enable row level security;
drop policy if exists rp_own on public.reading_progress;
create policy rp_own on public.reading_progress for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists rp_hq on public.reading_progress;
create policy rp_hq on public.reading_progress for select to authenticated using (is_hq());

-- Portfolio 영상: 파일은 'outputs' 버킷의 <user_id>/ 폴더(본인만), 여기엔 경로만 둔다. 책당 여러 번 녹화 가능.
create table if not exists public.reading_videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references public.reading_books(id) on delete cascade,
  video_path text not null,
  created_at timestamptz not null default now()
);
create index if not exists reading_videos_user_idx on public.reading_videos(user_id, book_id);
alter table public.reading_videos enable row level security;
drop policy if exists rv_own on public.reading_videos;
create policy rv_own on public.reading_videos for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists rv_hq on public.reading_videos;
create policy rv_hq on public.reading_videos for select to authenticated using (is_hq());

-- 학생이 읽는 원서 단계
alter table public.profiles add column if not exists reading_level text not null default 'PRE' check (reading_level in ('PRE','BASIC'));

-- 이미지 버킷(비공개): 로그인한 사용자는 읽기, 본사만 올리기/수정
insert into storage.buckets (id, name, public, file_size_limit) values ('reading', 'reading', false, 10485760) on conflict (id) do nothing;
drop policy if exists reading_read on storage.objects;
create policy reading_read on storage.objects for select to authenticated using (bucket_id = 'reading');
drop policy if exists reading_hq_write on storage.objects;
create policy reading_hq_write on storage.objects for all to authenticated using (bucket_id = 'reading' and is_hq()) with check (bucket_id = 'reading' and is_hq());
