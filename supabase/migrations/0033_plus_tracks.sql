-- 0033: 보충/확장 활동 모음 (인호 결정 2026-10-26)
--  · 흐름의 차시에 track(core/support/challenge). 보충=최대 5활동, 확장=최대 3활동, 학생이 고르거나 Homework·학원에서 가져다 씀. 유료 구분 없음.
--  · 내부 번호는 7(보충)·8(확장). 화면에서는 차시가 아니라 "더 연습해요 / 도전해요"로 부른다.
alter table public.flow_lessons add column if not exists track text not null default 'core' check (track in ('core','support','challenge'));

create or replace function apply_flow_template(p_template uuid, p_unit uuid) returns void
language plpgsql security definer set search_path = public as $$
declare l record; s record; v_lesson uuid;
begin
  if auth.uid() is not null and not is_hq() then raise exception 'not allowed'; end if;
  if exists (select 1 from flow_lessons where unit_id = p_unit) then raise exception 'unit already has a flow'; end if;
  for l in select * from flow_lessons where template_id = p_template order by no loop
    insert into flow_lessons(unit_id, no, en, ko, goal, color, track, src_id) values (p_unit, l.no, l.en, l.ko, l.goal, l.color, l.track, l.id) returning id into v_lesson;
    for s in select * from flow_steps where lesson_id = l.id order by pos loop
      insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, special, kind, qty, src_id) values (v_lesson, s.pos, s.name_en, s.name_ko, s.minutes, s.special, s.kind, s.qty, s.id);
    end loop;
  end loop;
end $$;

do $$
declare t uuid; l record; s record; v_lesson uuid; u record;
begin
  select id into t from flow_templates where name = '비상 초5 6차시';
  if t is null then raise exception '비상 초5 6차시 템플릿이 없어요'; end if;

  insert into flow_lessons(template_id, no, en, ko, goal, color, track)
  select t, v.no, v.en, v.ko, v.goal, '', v.track from (values
    (7,'More Practice','더 연습해요','약한 부분을 쉽게 다시 연습해요','support'),
    (8,'Challenge',    '도전해요',  '더 깊고 새로운 활동에 도전해요','challenge')
  ) as v(no,en,ko,goal,track)
  where not exists (select 1 from flow_lessons x where x.template_id = t and x.no = v.no);

  insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, kind, qty)
  select fl.id, st.pos, st.name_en, st.name_ko, st.minutes, st.kind, st.qty
  from (values
    (7,0,'Spell It',          '철자 완성',                 4, 'vspell', 6),
    (7,1,'Tap & Listen',      '문장 눌러 듣기',            3, 'tapl',   5),
    (7,2,'Say It in English', '우리말 보고 영어로 말하기', 4, 'saykor', 4),
    (7,3,'Dialogue Choice',   '대화 고르기',               3, 'dchoice',3),
    (7,4,'Sentence Ordering', '문장 순서 맞추기',          4, 'sorder', 3),
    (8,0,'Story Quiz (Multi)','글 읽고 답하기 (복수선택)', 5, 'sqmulti',2),
    (8,1,'Story Writing',     '글 읽고 내 글 쓰기',        8, 'swrt',   1),
    (8,2,'Presentation',      '발표 영상 찍기',            5, 'present',1)
  ) as st(lno,pos,name_en,name_ko,minutes,kind,qty)
  join flow_lessons fl on fl.no = st.lno and fl.template_id = t
  where not exists (select 1 from flow_steps x where x.lesson_id = fl.id);

  -- 이미 템플릿을 적용한 단원(현재 Lesson 9)에도 7·8 추가
  for u in select distinct fl.unit_id from flow_lessons fl join flow_lessons tl on tl.id = fl.src_id where tl.template_id = t and fl.unit_id is not null loop
    for l in select * from flow_lessons where template_id = t and no in (7,8) order by no loop
      if not exists (select 1 from flow_lessons where unit_id = u.unit_id and no = l.no) then
        insert into flow_lessons(unit_id, no, en, ko, goal, color, track, src_id) values (u.unit_id, l.no, l.en, l.ko, l.goal, l.color, l.track, l.id) returning id into v_lesson;
        for s in select * from flow_steps where lesson_id = l.id order by pos loop
          insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, kind, qty, src_id) values (v_lesson, s.pos, s.name_en, s.name_ko, s.minutes, s.kind, s.qty, s.id);
        end loop;
      end if;
    end loop;
  end loop;
end $$;
