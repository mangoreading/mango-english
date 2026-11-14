-- 흐름 템플릿의 '문항 출처' 방향 바로잡기
--  · 연결은 '뒤 차시 활동이 앞 차시의 같은 활동 문항을 가져다 쓰는' 방향이어야 한다 (예: 6차시 → 2차시).
--  · 예전엔 뒤 차시 활동도 후보로 나와서 반대(2차시 → 6차시)로 걸린 것이 있을 수 있다 → 가장 앞 활동을 출처로 뒤집는다.
--  · 템플릿(flow_steps 중 template_id 가 있는 차시)만 고친다. 템플릿에는 문항이 없어서 데이터 이동이 없다.
--    이미 단원에 적용된 흐름은 문항이 걸려 있어 건드리지 않는다.
do $$
declare b record; e uuid;
begin
  for b in
    select distinct s.ref_step_id as src
      from flow_steps s join flow_lessons l on l.id = s.lesson_id
     where l.template_id is not null and s.ref_step_id is not null
  loop
    select m.id into e from (
        select s.id, l.no, s.pos from flow_steps s join flow_lessons l on l.id = s.lesson_id
         where s.id = b.src or s.ref_step_id = b.src
      ) m order by m.no, m.pos limit 1;
    if e is not null and e <> b.src then
      update flow_steps set ref_step_id = null where id = e;
      update flow_steps set ref_step_id = e where (id = b.src or ref_step_id = b.src) and id <> e;
    end if;
  end loop;
end $$;
