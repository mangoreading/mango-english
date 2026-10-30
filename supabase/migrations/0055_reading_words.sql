-- 0055: 원서 단어 이미지(이모지 대체). 단어(소문자) → 'reading' 버킷의 이미지 경로. 같은 단어는 모든 책에서 같은 이미지를 쓴다.
create table if not exists public.reading_words (
  word text primary key,                    -- 소문자, 예: pig, fox-trot
  image_path text not null,                 -- 'reading' 버킷 안의 경로 (words/...)
  updated_at timestamptz not null default now()
);
alter table public.reading_words enable row level security;
drop policy if exists rw_read on public.reading_words;
create policy rw_read on public.reading_words for select to authenticated using (true);
drop policy if exists rw_hq on public.reading_words;
create policy rw_hq on public.reading_words for all to authenticated using (is_hq()) with check (is_hq());
