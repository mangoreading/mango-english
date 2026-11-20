-- 0086: 장면 이미지 — ① 스타일 세트에 '기준 참고 이미지'(스토리지 art-refs) 저장, ② 등장인물은 Lesson(단원)마다 따로 저장
-- 화풍(스타일 문장·피할 것·기준 이미지)은 책/출판사 단위 세트, 인물은 단원 단위. 본사(hq) 전용.
alter table public.art_styles add column if not exists refs text[] not null default '{}';

create table if not exists public.lesson_chars (
  unit_id uuid primary key references public.units(id) on delete cascade,
  chars jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.lesson_chars enable row level security;
drop policy if exists lesson_chars_hq on public.lesson_chars;
create policy lesson_chars_hq on public.lesson_chars for all using (is_hq()) with check (is_hq());

insert into storage.buckets (id, name, public, file_size_limit) values ('art-refs', 'art-refs', false, 10485760) on conflict (id) do nothing;
drop policy if exists art_refs_hq on storage.objects;
create policy art_refs_hq on storage.objects for all to authenticated using (bucket_id = 'art-refs' and is_hq()) with check (bucket_id = 'art-refs' and is_hq());

-- L9: 지금까지 '비상 초5 영어 L9' 세트에 들어 있던 인물을 L9 단원 인물로 옮김
do $do$
declare v_unit uuid; v_cnt int;
begin
  select count(*), min(u.id::text)::uuid into v_cnt, v_unit from units u join books b on b.id = u.book_id left join publishers pb on pb.id = b.publisher_id where u.no = 9 and u.kind = 'lesson' and b.grade = 5 and (pb.name like '%비상%' or b.title like '%비상%');
  if v_cnt <> 1 then raise notice 'L9 unit lookup: % match(es) - lesson_chars not seeded', v_cnt; return; end if;
  insert into lesson_chars(unit_id, chars) select v_unit, a.chars from art_styles a where a.name = '비상 초5 영어 L9' on conflict (unit_id) do nothing;
end $do$;
