-- 비상교육 초5 L9 CORE 초안 문항을 모두 승인하고 발행(학생 화면에 Lesson 9 노출).
do $do$
declare v_unit uuid; v_n int; v_ver int;
begin
  select u.id into v_unit from units u join books b on b.id = u.book_id where b.title = '비상교육 초5 영어' and u.no = 9;
  if v_unit is null then raise exception 'L9 unit not found'; end if;
  update items set status = 'approved' where unit_id = v_unit and level = 'CORE' and status = 'draft';
  get diagnostics v_n = row_count;
  v_ver := publish_unit(v_unit);
  raise notice 'L9 approved % items, published v%', v_n, v_ver;
end $do$;
