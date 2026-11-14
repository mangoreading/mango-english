-- (읽기 전용 점검) 단원 흐름에서 '문항 출처'가 뒤 차시를 가리키는(반대 방향) 활동 찾기. 데이터는 바꾸지 않고 로그(NOTICE)만 남긴다.
do $$
declare r record; n int := 0;
begin
  for r in
    select u.title as unit, ls.no as src_lesson, ss.pos as src_pos, ss.kind as kind, lr.no as ref_lesson, sr.pos as ref_pos,
           (select count(*) from items i where i.step_id = ss.id) as items_at_src,
           (select count(*) from items i where i.step_id = sr.id) as items_at_ref
      from flow_steps sr
      join flow_lessons lr on lr.id = sr.lesson_id
      join flow_steps ss on ss.id = sr.ref_step_id
      join flow_lessons ls on ls.id = ss.lesson_id
      left join units u on u.id = lr.unit_id
     where lr.unit_id is not null and (ls.no > lr.no or (ls.no = lr.no and ss.pos > sr.pos))
     order by 1, 2
  loop
    n := n + 1;
    raise notice 'REVERSED unit=% 연결활동=%차시#% (%) -> 출처=%차시#% 문항수(출처)=% 문항수(연결활동)=%', r.unit, r.ref_lesson, r.ref_pos, r.kind, r.src_lesson, r.src_pos, r.items_at_src, r.items_at_ref;
  end loop;
  raise notice 'REVERSED_TOTAL=%', n;
end $$;
