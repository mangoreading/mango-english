
-- ===== Lesson 9 에 템플릿 적용 + 기존 문항을 활동에 연결 =====
select apply_flow_template((select id from flow_templates where name='비상 초5 표준'),
  (select u.id from units u join books b on b.id=u.book_id where b.title='비상교육 초5 영어' and u.no=9))
where not exists (select 1 from flow_lessons fl join units u on u.id=fl.unit_id join books b on b.id=u.book_id where b.title='비상교육 초5 영어' and u.no=9);

-- 문항 연결: 1~6차시는 act = act_idx/100 → 활동 위치(pos), 7차시는 pos 0 (진단 활동)
update items i set step_id = s.id
from units u, books b, flow_lessons fl, flow_steps s
where i.unit_id = u.id and b.id = u.book_id and b.title='비상교육 초5 영어' and u.no = 9
  and fl.unit_id = u.id and fl.no = i.lesson and s.lesson_id = fl.id
  and s.pos = case when i.lesson = 7 then 0 else i.act_idx / 100 end
  and i.step_id is null;

-- 발행: 흐름 + 문항을 한 번들로. 호환을 위해 items[레벨][차시] = [활동별 문항 배열…] 형태도 유지(활동 위치 = 배열 인덱스).
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
        'steps', coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'name_en', s.name_en, 'name_ko', s.name_ko, 'min', s.minutes, 'special', s.special) order by s.pos)
                           from flow_steps s where s.lesson_id = fl.id), '[]'::jsonb)) order by fl.no)
      from flow_lessons fl where fl.unit_id = u.id), '[]'::jsonb),
    'items', (
      select coalesce(jsonb_object_agg(lv, by_lesson), '{}'::jsonb) from (
        select lv, jsonb_object_agg(lno::text, acts) as by_lesson from (
          select lv.lv, fl.no as lno,
                 jsonb_agg(coalesce((select jsonb_agg(i.payload order by i.act_idx, i.created_at) from items i
                                     where i.step_id = s.id and i.level::text = lv.lv and i.status = 'approved'), '[]'::jsonb) order by s.pos) as acts
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

-- 재발행 (Lesson 9)
select publish_unit(u.id) from units u join books b on b.id = u.book_id where b.title = '비상교육 초5 영어' and u.no = 9;
