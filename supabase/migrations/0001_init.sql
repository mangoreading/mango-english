-- Mango English 0001: 기본 스키마 + RLS (초안 v0.1)
-- 실행 위치: Supabase 대시보드 > SQL Editor (또는 supabase db push)
create extension if not exists pgcrypto;

-- ===== 열거형 =====
create type user_role as enum ('hq_admin','hq_editor','org_admin','teacher','student','parent');
create type item_level as enum ('CORE','SUPPORT','ADVANCED');
create type content_status as enum ('draft','review','approved','rejected');

-- ===== 조직/사용자 =====
create table orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'student',
  org_id uuid references orgs(id),
  display_name text not null default '',
  grade smallint,
  created_at timestamptz not null default now()
);
create table classes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  name text not null,
  grade smallint
);
create table class_members (
  class_id uuid not null references classes(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role user_role not null default 'student',
  primary key (class_id, user_id)
);
create table guardians (
  parent_id uuid not null references profiles(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  primary key (parent_id, student_id)
);
create table entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  org_id uuid references orgs(id) on delete cascade,
  plan text not null,
  valid_until timestamptz,
  source text not null default 'manual',
  check (user_id is not null or org_id is not null)
);

-- ===== 콘텐츠 =====
create table publishers (id uuid primary key default gen_random_uuid(), name text not null unique);
create table books (
  id uuid primary key default gen_random_uuid(),
  publisher_id uuid not null references publishers(id),
  grade smallint not null check (grade between 1 and 6),
  title text not null,
  year smallint
);
create table units (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references books(id) on delete cascade,
  no smallint not null,
  title text not null,
  goals jsonb not null default '[]',
  source jsonb not null default '{}',   -- UnitSource (어휘/표현/대화/지문)
  status content_status not null default 'draft',
  version int not null default 1,
  unique (book_id, no)
);
create table vocab (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,        -- 예: hat (이미지/음원 키)
  en text not null, ko text not null,
  image_path text, audio_path text
);
create table expressions (
  id uuid primary key default gen_random_uuid(),
  en text not null unique, ko text not null, audio_path text
);
create table unit_vocab (unit_id uuid references units(id) on delete cascade, vocab_id uuid references vocab(id), primary key (unit_id, vocab_id));
create table unit_expressions (unit_id uuid references units(id) on delete cascade, expression_id uuid references expressions(id), primary key (unit_id, expression_id));

create table items (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references units(id) on delete cascade,
  lesson smallint not null check (lesson between 1 and 8),
  act_idx smallint not null default 0,
  level item_level not null,
  template text not null,
  tag text,
  payload jsonb not null,           -- @mango/schema ActivityItem
  status content_status not null default 'draft',
  version int not null default 1,
  created_by uuid references profiles(id),
  reviewed_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index items_unit_idx on items(unit_id, lesson, level, status);

-- 승인 시 발행되는 배포 번들 (학습앱은 이것만 읽는다)
create table unit_bundles (
  unit_id uuid not null references units(id) on delete cascade,
  version int not null,
  bundle jsonb not null,
  published_at timestamptz not null default now(),
  primary key (unit_id, version)
);

-- ===== 학습 기록 =====
create table progress (
  user_id uuid not null references profiles(id) on delete cascade,
  unit_id uuid not null references units(id) on delete cascade,
  lesson smallint not null,
  level item_level not null,
  status text not null default 'in_progress',
  best_score int,
  updated_at timestamptz not null default now(),
  primary key (user_id, unit_id, lesson)
);
create table attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  unit_id uuid not null references units(id),
  item_id uuid references items(id),
  lesson smallint not null,
  tag text,
  ok boolean not null,
  hints int not null default 0,
  ms int,
  created_at timestamptz not null default now()
);
create index attempts_user_idx on attempts(user_id, created_at desc);

-- ===== 권한 판정 함수 (RLS 재귀 방지: security definer) =====
create function app_role() returns user_role language sql stable security definer set search_path = public as
$$ select role from profiles where id = auth.uid() $$;
create function app_org() returns uuid language sql stable security definer set search_path = public as
$$ select org_id from profiles where id = auth.uid() $$;
create function is_hq() returns boolean language sql stable security definer set search_path = public as
$$ select coalesce(role in ('hq_admin','hq_editor'), false) from profiles where id = auth.uid() $$;
-- 교사가 맡은 반의 학생인지
create function teaches_student(sid uuid) returns boolean language sql stable security definer set search_path = public as
$$ select exists (
  select 1 from class_members t join class_members s on s.class_id = t.class_id
  where t.user_id = auth.uid() and t.role = 'teacher' and s.user_id = sid) $$;

-- ===== RLS =====
alter table orgs enable row level security;
alter table profiles enable row level security;
alter table classes enable row level security;
alter table class_members enable row level security;
alter table guardians enable row level security;
alter table entitlements enable row level security;
alter table publishers enable row level security;
alter table books enable row level security;
alter table units enable row level security;
alter table vocab enable row level security;
alter table expressions enable row level security;
alter table unit_vocab enable row level security;
alter table unit_expressions enable row level security;
alter table items enable row level security;
alter table unit_bundles enable row level security;
alter table progress enable row level security;
alter table attempts enable row level security;

-- profiles: 본인 / 본사 / 같은 학원 관리자 / 담당 교사
create policy profiles_self on profiles for select using (id = auth.uid());
create policy profiles_hq on profiles for all using (is_hq()) with check (is_hq());
create policy profiles_org_admin on profiles for select using (app_role() = 'org_admin' and org_id = app_org());
create policy profiles_teacher on profiles for select using (teaches_student(id));
create policy profiles_self_update on profiles for update using (id = auth.uid()) with check (id = auth.uid() and role = app_role());

-- orgs/classes/class_members
create policy orgs_read on orgs for select using (is_hq() or id = app_org());
create policy orgs_hq on orgs for all using (is_hq()) with check (is_hq());
create policy classes_read on classes for select using (is_hq() or org_id = app_org());
create policy classes_manage on classes for all using (is_hq() or (app_role() = 'org_admin' and org_id = app_org()))
  with check (is_hq() or (app_role() = 'org_admin' and org_id = app_org()));
create policy cm_read on class_members for select using (
  is_hq() or user_id = auth.uid() or exists (select 1 from classes c where c.id = class_id and c.org_id = app_org() and app_role() in ('org_admin','teacher')));
create policy cm_manage on class_members for all using (
  is_hq() or exists (select 1 from classes c where c.id = class_id and c.org_id = app_org() and app_role() = 'org_admin'))
  with check (is_hq() or exists (select 1 from classes c where c.id = class_id and c.org_id = app_org() and app_role() = 'org_admin'));
create policy guardians_read on guardians for select using (is_hq() or parent_id = auth.uid() or student_id = auth.uid());
create policy ent_read on entitlements for select using (is_hq() or user_id = auth.uid() or org_id = app_org());
create policy ent_hq on entitlements for all using (is_hq()) with check (is_hq());

-- 콘텐츠: 로그인 사용자는 승인된 것만 읽기, 본사는 전체 관리
create policy pub_read on publishers for select using (auth.uid() is not null);
create policy books_read on books for select using (auth.uid() is not null);
create policy units_read on units for select using (is_hq() or status = 'approved');
create policy vocab_read on vocab for select using (auth.uid() is not null);
create policy expr_read on expressions for select using (auth.uid() is not null);
create policy uv_read on unit_vocab for select using (auth.uid() is not null);
create policy ue_read on unit_expressions for select using (auth.uid() is not null);
create policy bundles_read on unit_bundles for select using (auth.uid() is not null);
create policy items_hq on items for all using (is_hq()) with check (is_hq());
-- 학생 앱은 번들만 읽으므로 items 는 본사 전용
create policy pub_hq on publishers for all using (is_hq()) with check (is_hq());
create policy books_hq on books for all using (is_hq()) with check (is_hq());
create policy units_hq on units for all using (is_hq()) with check (is_hq());
create policy vocab_hq on vocab for all using (is_hq()) with check (is_hq());
create policy expr_hq on expressions for all using (is_hq()) with check (is_hq());
create policy uv_hq on unit_vocab for all using (is_hq()) with check (is_hq());
create policy ue_hq on unit_expressions for all using (is_hq()) with check (is_hq());
create policy bundles_hq on unit_bundles for all using (is_hq()) with check (is_hq());

-- 학습 기록: 본인 읽기/쓰기, 본사/같은 학원 관리자/담당 교사/보호자 읽기
create policy progress_self on progress for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy progress_staff on progress for select using (
  is_hq() or teaches_student(user_id)
  or (app_role() = 'org_admin' and exists (select 1 from profiles p where p.id = user_id and p.org_id = app_org()))
  or exists (select 1 from guardians g where g.parent_id = auth.uid() and g.student_id = user_id));
create policy attempts_self_ins on attempts for insert with check (user_id = auth.uid());
create policy attempts_self_sel on attempts for select using (user_id = auth.uid());
create policy attempts_staff on attempts for select using (
  is_hq() or teaches_student(user_id)
  or (app_role() = 'org_admin' and exists (select 1 from profiles p where p.id = user_id and p.org_id = app_org()))
  or exists (select 1 from guardians g where g.parent_id = auth.uid() and g.student_id = user_id));

-- 가입 시 profiles 자동 생성 (기본 student)
create function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, display_name) values (new.id, coalesce(new.raw_user_meta_data->>'name', ''));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();
