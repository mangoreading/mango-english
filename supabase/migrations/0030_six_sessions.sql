-- 0030: 6차시 구조 (인호 확정 2026-10-26)
--  · 문항 차시 범위 제한 완화(1~20)  · 활동 칸에 활동 종류(kind)와 권장 문항 수(qty)
--  · 기본 흐름 템플릿 "비상 초5 6차시" (Listen up / Speak up / Build up / Story time / Project time / Wrap up)
alter table public.items drop constraint if exists items_lesson_check;
alter table public.items add constraint items_lesson_check check (lesson between 1 and 20);

alter table public.flow_steps add column if not exists kind text;
alter table public.flow_steps add column if not exists qty smallint;

create or replace function apply_flow_template(p_template uuid, p_unit uuid) returns void
language plpgsql security definer set search_path = public as $$
declare l record; s record; v_lesson uuid;
begin
  if auth.uid() is not null and not is_hq() then raise exception 'not allowed'; end if;
  if exists (select 1 from flow_lessons where unit_id = p_unit) then raise exception 'unit already has a flow'; end if;
  for l in select * from flow_lessons where template_id = p_template order by no loop
    insert into flow_lessons(unit_id, no, en, ko, goal, color, src_id) values (p_unit, l.no, l.en, l.ko, l.goal, l.color, l.id) returning id into v_lesson;
    for s in select * from flow_steps where lesson_id = l.id order by pos loop
      insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, special, kind, qty, src_id) values (v_lesson, s.pos, s.name_en, s.name_ko, s.minutes, s.special, s.kind, s.qty, s.id);
    end loop;
  end loop;
end $$;

insert into flow_templates(name, note) values ('비상 초5 6차시', '6차시 구조 v0.1: 차시당 5~6활동, 활동 안에서 여러 문항으로 드릴. CORE 기준') on conflict (name) do nothing;

with t as (select id from flow_templates where name = '비상 초5 6차시'),
ls(no, en, ko, goal) as (values
  (1, 'Listen Up',     '듣고 익히기',   '핵심 단어와 표현을 듣고 이해해요'),
  (2, 'Speak Up',      '말하기',        '배운 표현을 바꿔 가며 소리 내어 말해요'),
  (3, 'Build Up',      '쓰기',          '단어와 문장을 직접 써 보며 익혀요'),
  (4, 'Story Time',    '읽기',          '글을 듣고 읽고 내용을 이해해요'),
  (5, 'Project Time',  '프로젝트',      '배운 표현으로 내 글을 쓰고 발표해요'),
  (6, 'Wrap Up',       '마무리',        '내 실력을 확인하고 부족한 부분을 채워요'))
insert into flow_lessons(template_id, no, en, ko, goal, color)
select t.id, ls.no, ls.en, ls.ko, ls.goal, '' from t, ls
where not exists (select 1 from flow_lessons x where x.template_id = t.id and x.no = ls.no);

with t as (select id from flow_templates where name = '비상 초5 6차시'),
st(lno, pos, name_en, name_ko, minutes, kind, qty, special) as (values
  (1,0,'Learning Goal',        '학습목표',                 1, 'goal',      1,  null),
  (1,1,'Word Repeat',          '단어 듣고 따라 말하기',    4, 'wrepeat',   6,  null),
  (1,2,'Sound-Word Match',     '소리-단어 매칭',           4, 'vsound',    6,  null),
  (1,3,'Key Expressions',      '핵심표현 듣고 따라 읽기',  4, 'kexp',      5,  null),
  (1,4,'Tap & Listen',         '문장 눌러 듣기',           3, 'tapl',      5,  null),
  (1,5,'Listen & Choose',      '듣고 고르기',              5, 'lchtext',   5,  null),
  (2,0,'Word-Meaning Match',   '단어-뜻 매칭 (복습)',      3, 'vmatch',    6,  null),
  (2,1,'Sentence Drill',       '문장 바꿔 말하기',         5, 'sdrill',    7,  null),
  (2,2,'Look & Speak',         '그림 보고 말하기',         4, 'lookspeak', 4,  null),
  (2,3,'Listen & Speak',       '듣고 대답하기',            4, 'lspeak',    4,  null),
  (2,4,'Role Play',            '역할 나눠 말하기',         4, 'role',      2,  null),
  (2,5,'AI Free Talk',         'AI 자유대화',              5, 'aitalk',    1,  null),
  (3,0,'Spell It',             '철자 완성 (복습)',         3, 'vspell',    6,  null),
  (3,1,'Picture Write',        '그림 보고 쓰기',           4, 'vwrite',    6,  null),
  (3,2,'Sentence Scramble',    '단어 배열로 문장 만들기',  4, 'sscram',    5,  null),
  (3,3,'Fill the Blank',       '빈칸 단어 쓰기',           4, 'sfill',     5,  null),
  (3,4,'Sentence Build-up',    '문장 쓰기',                5, 'sbuild',    5,  null),
  (3,5,'Complete the Dialogue','대화 완성하기',            5, 'dfill',     3,  null),
  (4,0,'Read Aloud',           '따라 읽기 평가 (복습)',    3, 'raloud',    4,  null),
  (4,1,'Passage Read Aloud',   '글 듣고 읽기',             5, 'pread',     2,  null),
  (4,2,'Story Quiz (Choice)',  '글 읽고 답하기 (선택)',    5, 'sqchoice',  4,  null),
  (4,3,'Story Quiz (T/F)',     '글 읽고 답하기 (T/F)',     4, 'sqtf',      3,  null),
  (4,4,'Story Cloze',          '글 빈칸 채우기',           4, 'scloze',    4,  null),
  (5,0,'Model Text',           '모범 글 읽기',             3, 'mtext',     1,  null),
  (5,1,'Model Writing (Word Bank)', '모범 글 완성',        4, 'mwbank',    4,  null),
  (5,2,'Model Writing (Free)', '나만의 글 쓰기',           6, 'mfree',     1,  null),
  (5,3,'Presentation',         '발표 영상 찍기',           4, 'present',   1,  null),
  (5,4,'AI Free Talk',         'AI 자유대화',              6, 'aitalk',    1,  null),
  (6,0,'Unit Check',           '영역별 체크 (어휘·듣기·말하기·읽기·쓰기)', 10, null, 15, 'diagnostic'),
  (6,1,'Personalized Review',  '결과에 따른 맞춤 보강',    14, null,       null, 'adaptive'))
insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, kind, qty, special)
select fl.id, st.pos, st.name_en, st.name_ko, st.minutes, st.kind, st.qty, st.special
from st join flow_lessons fl on fl.no = st.lno and fl.template_id = (select id from t)
where not exists (select 1 from flow_steps x where x.lesson_id = fl.id);

-- Lesson 9 (비상 초5)에 새 흐름 적용 (흐름이 비어 있을 때만)
select apply_flow_template((select id from flow_templates where name = '비상 초5 6차시'),
  (select u.id from units u join books b on b.id = u.book_id where b.title = '비상교육 초5 영어' and u.no = 9))
where not exists (select 1 from flow_lessons fl join units u on u.id = fl.unit_id join books b on b.id = u.book_id where b.title = '비상교육 초5 영어' and u.no = 9);
