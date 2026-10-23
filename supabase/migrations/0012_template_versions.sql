-- 활동 템플릿 버전 관리
--  · activity_types.version : 템플릿(입력 항목 구성)의 현재 버전
--  · items.tpl_ver          : 그 문항을 저장한 시점의 템플릿 버전 (문항을 저장하면 자동으로 최신 버전이 됨)
--  · activity_type_versions : 변경 이력 (safe 안전 / compatible 호환 / breaking 깨지는 변경)
-- 템플릿 입력 항목을 바꿀 때는 bump_template_version(key, level, note)을 마이그레이션에서 호출한다.
--   safe, compatible : 기존 문항을 자동으로 최신 버전으로 표시
--   breaking         : 기존 문항은 옛 버전으로 남아 "재검토 필요" 목록에 올라감 (확인·저장 후 재발행)
alter table public.activity_types add column if not exists version int not null default 1;
alter table public.items add column if not exists tpl_ver int not null default 1;

create table if not exists public.activity_type_versions (
  key text not null references public.activity_types(key) on delete cascade,
  version int not null,
  level text not null check (level in ('safe','compatible','breaking')),
  note text not null default '',
  created_at timestamptz not null default now(),
  primary key (key, version)
);
alter table public.activity_type_versions enable row level security;
drop policy if exists atv_read on public.activity_type_versions;
drop policy if exists atv_hq on public.activity_type_versions;
create policy atv_read on public.activity_type_versions for select using (auth.uid() is not null);
create policy atv_hq on public.activity_type_versions for all using (public.is_hq()) with check (public.is_hq());

insert into public.activity_type_versions(key, version, level, note)
  select key, 1, 'safe', '최초 버전' from public.activity_types
  on conflict do nothing;

create or replace function public.items_set_tpl_ver() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' or new.payload is distinct from old.payload or new.template is distinct from old.template then
    new.tpl_ver := coalesce((select version from public.activity_types where key = new.template), 1);
  end if;
  return new;
end $$;
drop trigger if exists items_tpl_ver on public.items;
create trigger items_tpl_ver before insert or update on public.items for each row execute function public.items_set_tpl_ver();

create or replace function public.bump_template_version(p_key text, p_level text, p_note text) returns int
language plpgsql security definer set search_path = public as $$
declare v int;
begin
  update activity_types set version = version + 1 where key = p_key returning version into v;
  if v is null then raise exception 'unknown template %', p_key; end if;
  insert into activity_type_versions(key, version, level, note) values (p_key, v, p_level, p_note);
  if p_level <> 'breaking' then
    -- 트리거를 거치지 않고 버전 표시만 갱신 (payload는 그대로)
    update items set tpl_ver = v where template = p_key;
  end if;
  return v;
end $$;
revoke all on function public.bump_template_version(text, text, text) from public, anon, authenticated;
