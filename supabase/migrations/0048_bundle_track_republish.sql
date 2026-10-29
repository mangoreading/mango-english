-- 0048: 발행 번들의 차시 정보에 track(core/support/challenge)을 담고, 결과 리포트가 쓰는 새 번들 정보(kind·study·homework·ref)를 위해 두 단원을 다시 발행
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
      select jsonb_agg(jsonb_build_object('no', fl.no, 'track', fl.track, 'en', fl.en, 'ko', fl.ko, 'goal', fl.goal, 'color', fl.color,
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

select publish_unit(u.id) from units u join books b on b.id = u.book_id where b.title = '비상교육 초5 영어' and u.no = 9;
select publish_unit(u.id) from units u join books b on b.id = u.book_id where b.title = '템플릿 테스트' and u.no = 2;
