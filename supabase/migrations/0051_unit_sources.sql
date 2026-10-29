-- 교과서 자료: 단원별 교과서 스캔(쪽)과 QR 음원·영상 스크립트 표. 본사 전용, 학습앱 번들에는 들어가지 않는다.
create table if not exists public.unit_sources (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units(id) on delete cascade,
  kind text not null check (kind in ('scan', 'script')),
  lesson_no smallint,
  sort int not null default 0,
  title text not null default '',      -- scan: 쪽/제목, script: 구분(음원/영상)
  body text not null default '',       -- script: 스크립트
  memo text not null default '',       -- 활동 메모
  remark text not null default '',     -- Remark
  file_path text,                      -- storage 'textbook' 버킷 경로(scan)
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists unit_sources_unit on public.unit_sources(unit_id, kind, sort);
alter table public.unit_sources enable row level security;
drop policy if exists us_hq on public.unit_sources;
create policy us_hq on public.unit_sources for all using (is_hq()) with check (is_hq());

insert into storage.buckets (id, name, public, file_size_limit) values ('textbook', 'textbook', false, 20971520) on conflict (id) do nothing;
drop policy if exists textbook_hq_rw on storage.objects;
create policy textbook_hq_rw on storage.objects for all to authenticated using (bucket_id = 'textbook' and is_hq()) with check (bucket_id = 'textbook' and is_hq());
