-- 비상 초5 영어 Lesson 1 흐름의 단계별 분(minutes)을 Lesson 9 (차시당 25~30분 기준으로 재계산된 값)와 같은 값으로 맞춘다.
-- 차시별로 활동 순서(pos 오름차순)가 같은 위치끼리 대응시킨다. 분만 바꾸고 문항·종류·수량은 건드리지 않는다.
do $do$
declare v1 uuid; v9 uuid; v_n int; v_mis int; v_before int; v_after int;
begin
  select u.id into strict v1 from units u join books b on b.id = u.book_id where u.no = 1 and u.kind = 'lesson' and b.grade = 5 and b.title = '초5 영어';
  select u.id into strict v9 from units u join books b on b.id = u.book_id where u.no = 9 and u.kind = 'lesson' and b.grade = 5 and b.title = '초5 영어';
  create temp table _m on commit drop as
    with a as (select s.id, fl.no as lno, s.kind, s.minutes, row_number() over (partition by fl.no order by s.pos) as rn from flow_steps s join flow_lessons fl on fl.id = s.lesson_id where fl.unit_id = v1 and fl.no <= 6),
         b as (select fl.no as lno, s.kind, s.minutes, row_number() over (partition by fl.no order by s.pos) as rn from flow_steps s join flow_lessons fl on fl.id = s.lesson_id where fl.unit_id = v9 and fl.no <= 6)
    select a.id, a.lno, a.rn, a.kind as k1, b.kind as k9, a.minutes as m1, b.minutes as m9 from a join b on b.lno = a.lno and b.rn = a.rn;
  if (select count(*) from _m) <> (select count(*) from flow_steps s join flow_lessons fl on fl.id = s.lesson_id where fl.unit_id = v1 and fl.no <= 6) then raise exception 'L1/L9 step count mismatch'; end if;
  select count(*) into v_mis from _m where k1 <> k9;
  raise notice 'L1 minutes: kind differs at % step(s): %', v_mis, (select coalesce(string_agg(lno || '-' || rn || ' ' || k1 || '/' || k9, ', '), '(none)') from _m where k1 <> k9);
  select sum(m1) into v_before from _m;
  update flow_steps s set minutes = m.m9 from _m m where s.id = m.id;
  get diagnostics v_n = row_count;
  select sum(minutes) into v_after from flow_steps s join flow_lessons fl on fl.id = s.lesson_id where fl.unit_id = v1 and fl.no <= 6;
  raise notice 'L1 minutes: updated % steps, total % -> % min', v_n, v_before, v_after;
  raise notice 'L1 minutes per lesson: %', (select string_agg(fl.no || ':' || t, ' ' order by fl.no) from (select fl.no, sum(s.minutes) t from flow_steps s join flow_lessons fl on fl.id = s.lesson_id where fl.unit_id = v1 and fl.no <= 6 group by fl.no) fl);
end $do$;
