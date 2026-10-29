-- 0046: 흐름 점검 반영 (인호 확정 2026-10-29)
--  · 2차시: 숙제는 "지난 표현 떠올리기(Quick Recall)"와 "장면 영상 보기(Scene story)". 듣고 정보 구분하기(lchtext)는 수업 전용
--  · 1차시 장면 영상 보기: 10분
--  · 활동 칸의 문항을 다른 칸에서 가져다 쓰기(ref_step_id): 3차시 문장 바꿔 말하기 = 1차시 문장 바꿔 말하기 문항
alter table public.flow_steps add column if not exists ref_step_id uuid references public.flow_steps(id) on delete set null;

-- 1) 숙제·시간 (기본 템플릿 + 이미 만들어진 단원 흐름 모두)
update public.flow_steps s set homework = false
  from public.flow_lessons l where s.lesson_id = l.id and l.track = 'core' and l.no = 2 and s.kind = 'lchtext';
update public.flow_steps s set homework = true
  from public.flow_lessons l where s.lesson_id = l.id and l.track = 'core' and l.no = 2 and s.kind = 'lchpic';
update public.flow_steps s set minutes = 10
  from public.flow_lessons l where s.lesson_id = l.id and l.track = 'core' and l.no = 1 and s.kind = 'scene';

-- 2) 3차시 첫 활동(sdrill)은 1차시 sdrill 의 문항을 쓴다 (템플릿 → 단원 흐름은 src_id 로 짝지음)
update public.flow_steps s3 set ref_step_id = s1.id
  from public.flow_lessons l3, public.flow_lessons l1, public.flow_steps s1
 where s3.lesson_id = l3.id and l3.track = 'core' and l3.no = 3 and s3.kind = 'sdrill' and s3.pos = 0
   and l1.track = 'core' and l1.no = 1 and s1.lesson_id = l1.id and s1.kind = 'sdrill'
   and ((l3.template_id is not null and l3.template_id = l1.template_id) or (l3.unit_id is not null and l3.unit_id = l1.unit_id));

-- 3) 템플릿을 단원에 적용할 때 문항 참조도 함께 복사
create or replace function apply_flow_template(p_template uuid, p_unit uuid) returns void
language plpgsql security definer set search_path = public as $$
declare l record; s record; v_lesson uuid;
begin
  if auth.uid() is not null and not is_hq() then raise exception 'not allowed'; end if;
  if exists (select 1 from flow_lessons where unit_id = p_unit) then raise exception 'unit already has a flow'; end if;
  for l in select * from flow_lessons where template_id = p_template order by no loop
    insert into flow_lessons(unit_id, no, en, ko, goal, color, track, src_id) values (p_unit, l.no, l.en, l.ko, l.goal, l.color, l.track, l.id) returning id into v_lesson;
    for s in select * from flow_steps where lesson_id = l.id order by pos loop
      insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, special, kind, qty, homework, study, src_id) values (v_lesson, s.pos, s.name_en, s.name_ko, s.minutes, s.special, s.kind, s.qty, s.homework, s.study, s.id);
    end loop;
  end loop;
  update flow_steps u set ref_step_id = (select x.id from flow_steps x join flow_lessons xl on xl.id = x.lesson_id where xl.unit_id = p_unit and x.src_id = t.ref_step_id)
    from flow_steps t, flow_lessons ul
   where u.src_id = t.id and t.ref_step_id is not null and u.lesson_id = ul.id and ul.unit_id = p_unit;
end $$;

-- 4) 발행: 참조하는 활동은 원본 활동의 승인 문항을 쓴다. 번들의 활동 정보에 숙제·학습 표시와 참조도 담는다.
create or replace function publish_unit(p_unit uuid) returns int
language plpgsql security definer set search_path = public as $$
declare
  v_ver int;
  v_bundle jsonb;
begin
  if auth.uid() is not null and not is_hq() then raise exception 'not allowed'; end if;
  select coalesce(max(version), 0) + 1 into v_ver from unit_bundles where unit_id = p_unit;

  select jsonb_build_object(
    'unit', jsonb_build_object('id', u.id, 'no', u.no, 'title', u.title, 'goals', u.goals, 'version', v_ver),
    'vocab', coalesce((select jsonb_agg(jsonb_build_object('key', v.key, 'en', v.en, 'ko', v.ko, 'image', v.image_path) order by v.key)
                       from unit_vocab uv join vocab v on v.id = uv.vocab_id where uv.unit_id = u.id), '[]'::jsonb),
    'flow', coalesce((
      select jsonb_agg(jsonb_build_object('no', fl.no, 'en', fl.en, 'ko', fl.ko, 'goal', fl.goal, 'color', fl.color,
        'steps', coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'name_en', s.name_en, 'name_ko', s.name_ko, 'min', s.minutes, 'special', s.special, 'kind', s.kind, 'study', s.study, 'homework', s.homework, 'ref', s.ref_step_id) order by s.pos)
                           from flow_steps s where s.lesson_id = fl.id), '[]'::jsonb)) order by fl.no)
      from flow_lessons fl where fl.unit_id = u.id), '[]'::jsonb),
    'items', (
      select coalesce(jsonb_object_agg(lv, by_lesson), '{}'::jsonb) from (
        select lv, jsonb_object_agg(lno::text, acts) as by_lesson from (
          select lv.lv, fl.no as lno,
                 jsonb_agg(coalesce((select jsonb_agg(i.payload order by i.act_idx, i.created_at) from items i
                                     where i.step_id = coalesce(s.ref_step_id, s.id) and i.level::text = lv.lv and i.status = 'approved'), '[]'::jsonb) order by s.pos) as acts
          from flow_lessons fl
          join flow_steps s on s.lesson_id = fl.id
          cross join (values ('CORE'), ('SUPPORT'), ('ADVANCED')) as lv(lv)
          where fl.unit_id = u.id and s.special is distinct from 'adaptive'
          group by lv.lv, fl.no
        ) g group by lv
      ) b)
  ) into v_bundle from units u where u.id = p_unit;

  insert into unit_bundles(unit_id, version, bundle) values (p_unit, v_ver, v_bundle);
  return v_ver;
end $$;
