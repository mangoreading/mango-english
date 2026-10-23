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

-- ===== 기본 템플릿: 비상 초5 표준 (Lesson 9 의 구성에서 추출) =====
insert into flow_templates(name, note) values ('비상 초5 표준', 'Lesson 9 구성에서 만든 기본 흐름') on conflict (name) do nothing;
insert into flow_lessons(template_id, no, en, ko, goal, color) values ((select id from flow_templates where name='비상 초5 표준'), 1, 'Meet & Understand', '물건·가격 표현 알기', '물건과 가격을 알아듣고, this/these로 가리키며 가격을 묻고 답하는 표현을 알아요.', 'mango');
insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, special) select id, 0, 'Meet the Store', '가게 상황 만나기', 3, null from flow_lessons where template_id=(select id from flow_templates where name='비상 초5 표준') and no=1;
insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, special) select id, 1, 'Item & Price Words', '물건·가격 어휘 익히기', 5, null from flow_lessons where template_id=(select id from flow_templates where name='비상 초5 표준') and no=1;
insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, special) select id, 2, 'this & these', 'this / these 발견', 4, null from flow_lessons where template_id=(select id from flow_templates where name='비상 초5 표준') and no=1;
insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, special) select id, 3, 'Key Expressions', '핵심표현 발견', 4, null from flow_lessons where template_id=(select id from flow_templates where name='비상 초5 표준') and no=1;
insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, special) select id, 4, 'First Store Talk', '첫 가게 대화', 5, null from flow_lessons where template_id=(select id from flow_templates where name='비상 초5 표준') and no=1;
insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, special) select id, 5, 'Mastery Check', 'Mastery Check', 3, null from flow_lessons where template_id=(select id from flow_templates where name='비상 초5 표준') and no=1;
insert into flow_lessons(template_id, no, en, ko, goal, color) values ((select id from flow_templates where name='비상 초5 표준'), 2, 'Listen & Respond', '듣고 가격 정보 구별하며 응답하기', '대화를 듣고 물건과 가격 정보를 구별하며, 가격을 대답해요.', 'sky');
insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, special) select id, 0, 'Spaced Review', '복습', 3, null from flow_lessons where template_id=(select id from flow_templates where name='비상 초5 표준') and no=2;
insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, special) select id, 1, 'Listen to Dialogs', '대화 듣기', 4, null from flow_lessons where template_id=(select id from flow_templates where name='비상 초5 표준') and no=2;
insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, special) select id, 2, 'Connect Info', '정보 연결', 5, null from flow_lessons where template_id=(select id from flow_templates where name='비상 초5 표준') and no=2;
insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, special) select id, 3, 'Price or Item?', '가격·물건 구별', 4, null from flow_lessons where template_id=(select id from flow_templates where name='비상 초5 표준') and no=2;
insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, special) select id, 4, 'Listen & Respond', '듣고 응답하기', 6, null from flow_lessons where template_id=(select id from flow_templates where name='비상 초5 표준') and no=2;
insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, special) select id, 5, 'Listening Check', 'Listening Check', 3, null from flow_lessons where template_id=(select id from flow_templates where name='비상 초5 표준') and no=2;
insert into flow_lessons(template_id, no, en, ko, goal, color) values ((select id from flow_templates where name='비상 초5 표준'), 3, 'Ask & Talk', '가게에서 가격 묻고 도움 받기', '"May I help you?"에 "Yes, please."로 답하고, 가격을 묻고 답하는 대화를 독립적으로 해요.', 'berry');
insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, special) select id, 0, 'Spaced Review', '복습', 3, null from flow_lessons where template_id=(select id from flow_templates where name='비상 초5 표준') and no=3;
insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, special) select id, 1, 'Dialog Model', '대화 모델 관찰', 3, null from flow_lessons where template_id=(select id from flow_templates where name='비상 초5 표준') and no=3;
insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, special) select id, 2, 'Pattern Drill', 'Pattern Drill', 5, null from flow_lessons where template_id=(select id from flow_templates where name='비상 초5 표준') and no=3;
insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, special) select id, 3, 'Guided Role-play', 'Guided Role-play', 5, null from flow_lessons where template_id=(select id from flow_templates where name='비상 초5 표준') and no=3;
insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, special) select id, 4, 'AI Free Talk', 'AI Free Talk', 6, null from flow_lessons where template_id=(select id from flow_templates where name='비상 초5 표준') and no=3;
insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, special) select id, 5, 'Speaking Check', 'Speaking Check', 3, null from flow_lessons where template_id=(select id from flow_templates where name='비상 초5 표준') and no=3;
insert into flow_lessons(template_id, no, en, ko, goal, color) values ((select id from flow_templates where name='비상 초5 표준'), 4, 'Read & Discover', '가격표·가게 글 읽고 이해하기', '가격표와 짧은 가게 글을 읽고, 물건과 가격 정보를 이해해요.', 'leaf');
insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, special) select id, 0, 'Spaced Review', '복습', 3, null from flow_lessons where template_id=(select id from flow_templates where name='비상 초5 표준') and no=4;
insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, special) select id, 1, 'Reading Prep', '읽기 준비', 3, null from flow_lessons where template_id=(select id from flow_templates where name='비상 초5 표준') and no=4;
insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, special) select id, 2, 'Sentence Reading', '문장 읽기', 4, null from flow_lessons where template_id=(select id from flow_templates where name='비상 초5 표준') and no=4;
insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, special) select id, 3, 'Price Tag Reading', '가격표·가게 지문', 7, null from flow_lessons where template_id=(select id from flow_templates where name='비상 초5 표준') and no=4;
insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, special) select id, 4, 'Find the Info', '읽고 정보 찾기', 5, null from flow_lessons where template_id=(select id from flow_templates where name='비상 초5 표준') and no=4;
insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, special) select id, 5, 'Reading Check', 'Reading Check', 3, null from flow_lessons where template_id=(select id from flow_templates where name='비상 초5 표준') and no=4;
insert into flow_lessons(template_id, no, en, ko, goal, color) values ((select id from flow_templates where name='비상 초5 표준'), 5, 'Write & Share', '가격 정보를 글로 쓰기', '가격을 묻고 답하는 문장을 쓰고, 물건과 가격을 소개하는 짧은 글을 써요.', 'teal');
insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, special) select id, 0, 'Spaced Review', '복습', 3, null from flow_lessons where template_id=(select id from flow_templates where name='비상 초5 표준') and no=5;
insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, special) select id, 1, 'Writing Model', '쓰기 모델 관찰', 3, null from flow_lessons where template_id=(select id from flow_templates where name='비상 초5 표준') and no=5;
insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, special) select id, 2, 'Build Sentences', '문장 구성', 5, null from flow_lessons where template_id=(select id from flow_templates where name='비상 초5 표준') and no=5;
insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, special) select id, 3, 'Guided Writing', 'Guided Writing', 5, null from flow_lessons where template_id=(select id from flow_templates where name='비상 초5 표준') and no=5;
insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, special) select id, 4, 'Independent Writing', 'Independent Writing', 6, null from flow_lessons where template_id=(select id from flow_templates where name='비상 초5 표준') and no=5;
insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, special) select id, 5, 'Writing Check', 'Writing Check', 3, null from flow_lessons where template_id=(select id from flow_templates where name='비상 초5 표준') and no=5;
insert into flow_lessons(template_id, no, en, ko, goal, color) values ((select id from flow_templates where name='비상 초5 표준'), 6, 'My Store Mission', '나의 가게 미션 (점수 없이 통합 연습)', '듣고 읽고 말하고 쓴 것을 한데 모아, 나만의 가게를 열고 가격을 주고받아요. (평가는 7차시에서)', 'grape');
insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, special) select id, 0, 'Mission Briefing', 'Mission Briefing', 2, null from flow_lessons where template_id=(select id from flow_templates where name='비상 초5 표준') and no=6;
insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, special) select id, 1, 'Listen & Identify', 'Listen & Identify', 4, null from flow_lessons where template_id=(select id from flow_templates where name='비상 초5 표준') and no=6;
insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, special) select id, 2, 'Need or Want?', '꼭 필요한 것? 갖고 싶은 것?', 4, null from flow_lessons where template_id=(select id from flow_templates where name='비상 초5 표준') and no=6;
insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, special) select id, 3, 'AI Store Talk', 'AI Store Talk', 8, null from flow_lessons where template_id=(select id from flow_templates where name='비상 초5 표준') and no=6;
insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, special) select id, 4, 'My Store Card', '나의 가게 소개 카드', 5, null from flow_lessons where template_id=(select id from flow_templates where name='비상 초5 표준') and no=6;
insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, special) select id, 5, 'Mission Reflection', 'Mission Reflection', 3, null from flow_lessons where template_id=(select id from flow_templates where name='비상 초5 표준') and no=6;
insert into flow_lessons(template_id, no, en, ko, goal, color) values ((select id from flow_templates where name='비상 초5 표준'), 7, 'Lesson Check', '단원 종합 점검', '단원 전체를 점검하고 내 약점을 찾는다.', 'navy');
insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, special) select id, 0, 'Lesson Check', '단원 종합 점검', 10, 'diagnostic' from flow_lessons where template_id=(select id from flow_templates where name='비상 초5 표준') and no=7;
insert into flow_lessons(template_id, no, en, ko, goal, color) values ((select id from flow_templates where name='비상 초5 표준'), 8, 'Personalized Mastery', '내 결과에 맞춘 보강', '7차시 결과에 맞춰 부족한 부분을 보강한다.', 'grape');
insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, special) select id, 0, 'Personalized Review', '맞춤 복습', 10, 'adaptive' from flow_lessons where template_id=(select id from flow_templates where name='비상 초5 표준') and no=8;

-- ===== Lesson 9 에 템플릿 적용 + 기존 문항을 활동에 연결 =====
select apply_flow_template((select id from flow_templates where name='비상 초5 표준'),
  (select u.id from units u join books b on b.id=u.book_id where b.title='비상교육 초5 영어' and u.no=9))
where not exists (select 1 from flow_lessons fl join units u on u.id=fl.unit_id join books b on b.id=u.book_id where b.title='비상교육 초5 영어' and u.no=9);

-- 문항 연결: 1~6차시는 act = act_idx/100 → 활동 위치(pos), 7차시는 pos 0 (진단 활동)
update items i set step_id = s.id
from units u, books b, flow_lessons fl, flow_steps s
where i.unit_id = u.id and b.id = u.book_id and b.title='비상교육 초5 영어' and u.no = 9
  and fl.unit_id = u.id and fl.no = i.lesson and s.lesson_id = fl.id
  and s.pos = case when i.lesson = 7 then 0 else i.act_idx / 100 end
  and i.step_id is null;

-- 발행: 흐름 + 문항을 한 번들로. 호환을 위해 items[레벨][차시] = [활동별 문항 배열…] 형태도 유지(활동 위치 = 배열 인덱스).
create or replace function publish_unit(p_unit uuid) returns int
language plpgsql security definer set search_path = public as $$
declare
  v_ver int;
  v_bundle jsonb;
begin
  if auth.uid() is not null and not is_hq() then raise exception 'not allowed'; end if;
  select coalesce(max(version), 0) + 1 into v_ver from unit_bundles where unit_id = p_unit;

  select jsonb_build_object(
    'unit', jsonb_build_object('id', u.id, 'no', u.no, 'title', u.title, 'goals', u.goals, 'version', v_ver),
    'vocab', coalesce((select jsonb_agg(jsonb_build_object('key', v.key, 'en', v.en, 'ko', v.ko, 'image', v.image_path) order by v.key)
                       from unit_vocab uv join vocab v on v.id = uv.vocab_id where uv.unit_id = u.id), '[]'::jsonb),
    'flow', coalesce((
      select jsonb_agg(jsonb_build_object('no', fl.no, 'en', fl.en, 'ko', fl.ko, 'goal', fl.goal, 'color', fl.color,
        'steps', coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'name_en', s.name_en, 'name_ko', s.name_ko, 'min', s.minutes, 'special', s.special) order by s.pos)
                           from flow_steps s where s.lesson_id = fl.id), '[]'::jsonb)) order by fl.no)
      from flow_lessons fl where fl.unit_id = u.id), '[]'::jsonb),
    'items', (
      select coalesce(jsonb_object_agg(lv, by_lesson), '{}'::jsonb) from (
        select lv, jsonb_object_agg(lno::text, acts) as by_lesson from (
          select lv.lv, fl.no as lno,
                 jsonb_agg(coalesce((select jsonb_agg(i.payload order by i.act_idx, i.created_at) from items i
                                     where i.step_id = s.id and i.level::text = lv.lv and i.status = 'approved'), '[]'::jsonb) order by s.pos) as acts
          from flow_lessons fl
          join flow_steps s on s.lesson_id = fl.id
          cross join (values ('CORE'), ('SUPPORT'), ('ADVANCED')) as lv(lv)
          where fl.unit_id = u.id and s.special is distinct from 'adaptive'
          group by lv.lv, fl.no
        ) g group by lv
      ) b)
  ) into v_bundle from units u where u.id = p_unit;

  insert into unit_bundles(unit_id, version, bundle) values (p_unit, v_ver, v_bundle);
  return v_ver;
end $$;

-- 재발행 (Lesson 9)
select publish_unit(u.id) from units u join books b on b.id = u.book_id where b.title = '비상교육 초5 영어' and u.no = 9;

