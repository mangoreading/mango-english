-- 0094: 0093 정정. L9 H/W 활동 13개 중 번호가 있는 11개는 학습+숙제 겸용(학습 체크 켬),
-- 엑셀에서 번호 없이 '*'로 표시된 2개(1차시 Word-meaning Match, 6차시 Listen & Choose (Number))만 숙제 전용(학습 체크 끔).
-- 학습앱: 학습 체크된 활동만 메인 학습 목록·진행률에 나오고, 숙제 체크된 활동(겸용·전용 모두)은 2·4·6차시의 '이번 주 숙제'에 모여 보인다. 반영하려면 문항을 다시 발행.
do $do$
declare v_unit uuid; v_cnt int; v_on int; v_off int;
begin
  select count(*), min(u.id::text)::uuid into v_cnt, v_unit from units u join books b on b.id = u.book_id left join publishers pb on pb.id = b.publisher_id where u.no = 9 and u.kind = 'lesson' and b.grade = 5 and (pb.name like '%비상%' or b.title like '%비상%');
  if v_cnt <> 1 then raise notice 'L9 unit lookup: % match(es) - study flags skipped', v_cnt; return; end if;
  update flow_steps s set study = not ((l.no = 1 and s.pos = 10) or (l.no = 6 and s.pos = 9)) from flow_lessons l where s.lesson_id = l.id and l.unit_id = v_unit and s.homework = true;
  select count(*) filter (where s.study), count(*) filter (where not s.study) into v_on, v_off from flow_steps s join flow_lessons l on l.id = s.lesson_id where l.unit_id = v_unit and s.homework = true;
  raise notice 'L9 homework steps: study+hw %, hw-only % (expected 11 / 2)', v_on, v_off;
end $do$;
