-- 0093: L9 흐름에서 H/W(숙제)로 표시한 활동은 숙제 전용으로 — 학습(study) 체크를 끈다.
-- 0084 에서 숙제 활동을 학습·숙제 겸용(study=true)으로 넣어 학습앱 메인 목록에 함께 나왔다. 숙제 전용이면 메인 학습 목록·진행률에서 빠지고 '이번 주 숙제'로 모인다.
-- 반영하려면 문항을 다시 발행해야 학습앱에 보인다.
do $do$
declare v_unit uuid; v_cnt int; v_n int;
begin
  select count(*), min(u.id::text)::uuid into v_cnt, v_unit from units u join books b on b.id = u.book_id left join publishers pb on pb.id = b.publisher_id where u.no = 9 and u.kind = 'lesson' and b.grade = 5 and (pb.name like '%비상%' or b.title like '%비상%');
  if v_cnt <> 1 then raise notice 'L9 unit lookup: % match(es) - study flags skipped', v_cnt; return; end if;
  update flow_steps s set study = false from flow_lessons l where s.lesson_id = l.id and l.unit_id = v_unit and s.homework = true and s.study = true;
  get diagnostics v_n = row_count;
  raise notice 'L9 homework-only steps (study off): % (expected 13 if none changed by hand)', v_n;
end $do$;
