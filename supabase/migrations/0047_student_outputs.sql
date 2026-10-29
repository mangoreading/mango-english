-- 0047: 학습 산출물 저장 (5차시 나만의 글 쓰기 / 발표 영상). 학생 본인만 읽고 쓰고, 본사 관리자는 읽기만.
create table if not exists public.student_outputs (
  user_id uuid not null references auth.users(id) on delete cascade,
  unit_id uuid not null references public.units(id) on delete cascade,
  lesson smallint not null,
  kind text not null,                 -- 'mfree' | 'present'
  text text,
  video_path text,                    -- storage 'outputs' 버킷 안의 경로
  updated_at timestamptz not null default now(),
  primary key (user_id, unit_id, lesson, kind)
);
alter table public.student_outputs enable row level security;
drop policy if exists so_own on public.student_outputs;
create policy so_own on public.student_outputs for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists so_hq on public.student_outputs;
create policy so_hq on public.student_outputs for select using (is_hq());

insert into storage.buckets (id, name, public, file_size_limit) values ('outputs', 'outputs', false, 52428800) on conflict (id) do nothing;
drop policy if exists outputs_own_rw on storage.objects;
create policy outputs_own_rw on storage.objects for all to authenticated
  using (bucket_id = 'outputs' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'outputs' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists outputs_hq_read on storage.objects;
create policy outputs_hq_read on storage.objects for select to authenticated using (bucket_id = 'outputs' and is_hq());
