-- 0035: 흐름 활동에 '숙제' 표시 (학원 원장님이 숙제를 낼 때 후보로 쓰는 활동)
alter table public.flow_steps add column if not exists homework boolean not null default false;

create or replace function apply_flow_template(p_template uuid, p_unit uuid) returns void
language plpgsql security definer set search_path = public as $$
declare l record; s record; v_lesson uuid;
begin
  if auth.uid() is not null and not is_hq() then raise exception 'not allowed'; end if;
  if exists (select 1 from flow_lessons where unit_id = p_unit) then raise exception 'unit already has a flow'; end if;
  for l in select * from flow_lessons where template_id = p_template order by no loop
    insert into flow_lessons(unit_id, no, en, ko, goal, color, track, src_id) values (p_unit, l.no, l.en, l.ko, l.goal, l.color, l.track, l.id) returning id into v_lesson;
    for s in select * from flow_steps where lesson_id = l.id order by pos loop
      insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, special, kind, qty, homework, src_id) values (v_lesson, s.pos, s.name_en, s.name_ko, s.minutes, s.special, s.kind, s.qty, s.homework, s.id);
    end loop;
  end loop;
end $$;
