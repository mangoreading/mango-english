-- 0096: (읽기 전용 점검, 데이터 변경 없음) 흐름 템플릿 '비상 초5 6차시'와 L9 의 3·6차시 단계·학습/숙제 체크를 로그에 출력한다.
do $do$
declare v_unit uuid; v_cnt int; v_tpl uuid; r record; v_t text; v_u text; n int;
begin
  select count(*), min(u.id::text)::uuid into v_cnt, v_unit from units u join books b on b.id = u.book_id left join publishers pb on pb.id = b.publisher_id where u.no = 9 and u.kind = 'lesson' and b.grade = 5 and (pb.name like '%비상%' or b.title like '%비상%');
  select id into v_tpl from flow_templates where name = '비상 초5 6차시';
  if v_cnt <> 1 or v_tpl is null then raise notice 'diag: unit % tpl %', v_cnt, v_tpl; return; end if;
  for n in select unnest(array[3, 6]) loop
    select string_agg((ts.pos + 1) || ' ' || coalesce(ts.name_en, '?') || '[' || coalesce(ts.kind, '-') || ' 학' || case when ts.study then 'O' else 'X' end || ' 숙' || case when ts.homework then 'O' else 'X' end || ']', ' | ' order by ts.pos) into v_t
      from flow_lessons tl join flow_steps ts on ts.lesson_id = tl.id where tl.template_id = v_tpl and tl.no = n;
    select string_agg((us.pos + 1) || ' ' || us.name_en || '[' || coalesce(us.kind, '-') || ' 학' || case when us.study then 'O' else 'X' end || ' 숙' || case when us.homework then 'O' else 'X' end || ']', ' | ' order by us.pos) into v_u
      from flow_lessons ul join flow_steps us on us.lesson_id = ul.id where ul.unit_id = v_unit and ul.no = n;
    raise notice 'TEMPLATE % : %', n, coalesce(v_t, '(none)');
    raise notice 'L9 % : %', n, coalesce(v_u, '(none)');
  end loop;
end $do$;
