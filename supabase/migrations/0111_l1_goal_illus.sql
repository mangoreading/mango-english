-- 비상 초5 영어 Lesson 1 학습목표(1차시 goal)에 대표 삽화(세계지도, 투명 PNG)를 단다. 단어 그림(pic) 대신 illus 를 쓴다.
-- 문항은 승인 상태 그대로 두고 내용만 바꾸므로, 학생 화면에는 재발행해야 반영된다.
do $do$
declare v_unit uuid; v_n int;
begin
  select u.id into strict v_unit from units u join books b on b.id = u.book_id where u.no = 1 and u.kind = 'lesson' and b.grade = 5 and b.title = '초5 영어';
  update items i set payload = (i.payload - 'pic') || jsonb_build_object('illus', 'illus/l1-goal-world.png')
   where i.unit_id = v_unit and i.template = 'goal' and i.lesson = 1;
  get diagnostics v_n = row_count;
  if v_n <> 1 then raise exception 'L1 goal items updated: % (expected 1)', v_n; end if;
  raise notice 'L1 goal: illus set (% item), status %', v_n, (select string_agg(status::text, ',') from items where unit_id = v_unit and template = 'goal');
end $do$;
