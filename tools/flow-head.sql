-- 0006: 학습 흐름(Flow) 구조
--  · 활동 종류(activity_types) = 문항 종류 12종 (코드가 관리, 관리자는 읽기만)
--  · 흐름 = 차시(flow_lessons) > 활동(flow_steps).  템플릿 소유 또는 단원 소유 (둘 중 하나)
--  · 한 "활동"은 이름/소요시간을 가진 묶음이고, 안에 여러 종류의 문항(items)이 들어간다.
--  · items.step_id 로 문항을 단원의 활동에 연결한다. (lesson/act_idx 는 당분간 호환용으로 유지)

create table if not exists activity_types (
  key text primary key,
  name_ko text not null,
  description text not null default '',
  sort smallint not null default 0,
  active boolean not null default true
);

create table if not exists flow_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists flow_lessons (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references flow_templates(id) on delete cascade,
  unit_id uuid references units(id) on delete cascade,
  no smallint not null check (no between 1 and 20),
  en text not null default '',
  ko text not null default '',
  goal text not null default '',
  color text not null default '',
  src_id uuid,                                   -- 템플릿에서 복사된 경우 원본 차시
  check ((template_id is null) <> (unit_id is null))
);
create unique index if not exists flow_lessons_tpl_no on flow_lessons(template_id, no) where template_id is not null;
create unique index if not exists flow_lessons_unit_no on flow_lessons(unit_id, no) where unit_id is not null;

create table if not exists flow_steps (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references flow_lessons(id) on delete cascade,
  pos smallint not null,
  name_en text not null default '',
  name_ko text not null default '',
  minutes smallint,
  special text check (special in ('diagnostic','adaptive')),   -- 7차시 진단 / 8차시 맞춤
  src_id uuid                                                     -- 템플릿에서 복사된 경우 원본 활동
);
create index if not exists flow_steps_lesson on flow_steps(lesson_id, pos);

alter table items add column if not exists step_id uuid references flow_steps(id) on delete set null;
create index if not exists items_step_idx on items(step_id);

alter table activity_types enable row level security;
alter table flow_templates enable row level security;
alter table flow_lessons enable row level security;
alter table flow_steps enable row level security;
create policy at_read on activity_types for select using (auth.uid() is not null);
create policy at_hq on activity_types for all using (is_hq()) with check (is_hq());
create policy ft_hq on flow_templates for all using (is_hq()) with check (is_hq());
create policy fl_hq on flow_lessons for all using (is_hq()) with check (is_hq());
create policy fs_hq on flow_steps for all using (is_hq()) with check (is_hq());

insert into activity_types(key, name_ko, description, sort) values
  ('learn',   '학습 카드',     '단어/표현을 보고 듣고 익히는 카드', 1),
  ('text',    '지문',          '읽기 지문 (뒤따르는 문항의 바탕글)', 2),
  ('brief',   '미션 안내',     '미션 상황 설명', 3),
  ('choose',  '고르기',        '보기 중 정답 고르기 (듣고/읽고)', 4),
  ('match',   '짝 맞추기',     '두 목록 연결하기', 5),
  ('build',   '배열하기',      '단어/문장 순서 맞추기', 6),
  ('fill',    '빈칸 채우기',   '빈칸에 알맞은 말 넣기', 7),
  ('write',   '쓰기',          '직접 입력해서 쓰기', 8),
  ('compose', '작문',          '여러 문장 쓰기 (가이드 포함)', 9),
  ('speak',   '말하기',        '마이크로 따라 말하기/응답하기', 10),
  ('fade',    '점점 지우기',   '문장을 점점 지우며 암기', 11),
  ('dialog',  '대화',          '역할 대화 / AI 대화', 12)
on conflict (key) do nothing;

-- 템플릿 → 단원 복사 (단원의 기존 흐름이 비어 있을 때만). 새 차시/활동 id 를 만든다.
create or replace function apply_flow_template(p_template uuid, p_unit uuid) returns void
language plpgsql security definer set search_path = public as $$
declare l record; s record; v_lesson uuid;
begin
  if auth.uid() is not null and not is_hq() then raise exception 'not allowed'; end if;
  if exists (select 1 from flow_lessons where unit_id = p_unit) then raise exception 'unit already has a flow'; end if;
  for l in select * from flow_lessons where template_id = p_template order by no loop
    insert into flow_lessons(unit_id, no, en, ko, goal, color, src_id) values (p_unit, l.no, l.en, l.ko, l.goal, l.color, l.id) returning id into v_lesson;
    for s in select * from flow_steps where lesson_id = l.id order by pos loop
      insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, special, src_id) values (v_lesson, s.pos, s.name_en, s.name_ko, s.minutes, s.special, s.id);
    end loop;
  end loop;
end $$;
