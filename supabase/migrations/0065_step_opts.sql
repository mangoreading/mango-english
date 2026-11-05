-- 0065: 흐름 단계의 '기본 옵션'(opts): 활동의 선택 기능(예: 장면 영상의 따라 말해보기)을 흐름 템플릿에서 정해 두면,
--       그 단계에 문항을 새로 만들 때 옵션이 켜진 채로 시작한다. 템플릿을 단원에 적용할 때도 함께 복사한다.
alter table public.flow_steps add column if not exists opts jsonb not null default '{}'::jsonb;

create or replace function apply_flow_template(p_template uuid, p_unit uuid) returns void
language plpgsql security definer set search_path = public as $$
declare l record; s record; v_lesson uuid;
begin
  if auth.uid() is not null and not is_hq() then raise exception 'not allowed'; end if;
  if exists (select 1 from flow_lessons where unit_id = p_unit) then raise exception 'unit already has a flow'; end if;
  for l in select * from flow_lessons where template_id = p_template order by no loop
    insert into flow_lessons(unit_id, no, en, ko, goal, color, track, src_id) values (p_unit, l.no, l.en, l.ko, l.goal, l.color, l.track, l.id) returning id into v_lesson;
    for s in select * from flow_steps where lesson_id = l.id order by pos loop
      insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, special, kind, qty, homework, study, opts, src_id) values (v_lesson, s.pos, s.name_en, s.name_ko, s.minutes, s.special, s.kind, s.qty, s.homework, s.study, s.opts, s.id);
    end loop;
  end loop;
  update flow_steps u set ref_step_id = (select x.id from flow_steps x join flow_lessons xl on xl.id = x.lesson_id where xl.unit_id = p_unit and x.src_id = t.ref_step_id)
    from flow_steps t, flow_lessons ul
   where u.src_id = t.id and t.ref_step_id is not null and u.lesson_id = ul.id and ul.unit_id = p_unit;
end $$;
