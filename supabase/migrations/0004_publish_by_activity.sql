-- 0004: 번들의 문항을 "활동(act)별" 묶음으로 저장하도록 publish_unit 수정.
-- items.act_idx 는 (활동번호 * 100 + 순번) 규칙이라 act = act_idx / 100 으로 묶는다.
-- 결과: bundle.items[레벨][차시] = [ [활동0 문항...], [활동1 문항...], ... ]
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
    'items', (
      select coalesce(jsonb_object_agg(lv, by_lesson), '{}'::jsonb) from (
        select level::text as lv, jsonb_object_agg(lesson::text, acts) as by_lesson from (
          select level, lesson, jsonb_agg(act_arr order by act) as acts from (
            select level, lesson, (act_idx / 100) as act, jsonb_agg(payload order by act_idx, created_at) as act_arr
            from items where unit_id = u.id and status = 'approved'
            group by level, lesson, (act_idx / 100)
          ) g group by level, lesson
        ) a group by level
      ) b)
  ) into v_bundle from units u where u.id = p_unit;

  insert into unit_bundles(unit_id, version, bundle) values (p_unit, v_ver, v_bundle);
  return v_ver;
end $$;

-- Lesson 9 재발행 (버전 2)
select publish_unit(u.id) from units u join books b on b.id = u.book_id where b.title = '비상교육 초5 영어' and u.no = 9;
