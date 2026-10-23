-- 0003: 단원 발행 함수. 승인된(approved) 문항을 레벨/차시별로 묶어 unit_bundles 에 새 버전으로 저장한다.
-- 학습앱은 items 가 아니라 이 번들만 읽는다.
create or replace function publish_unit(p_unit uuid) returns int
language plpgsql security definer set search_path = public as $$
declare
  v_ver int;
  v_bundle jsonb;
begin
  -- SQL Editor(postgres) 또는 본사 계정만 실행 가능
  if auth.uid() is not null and not is_hq() then raise exception 'not allowed'; end if;

  select coalesce(max(version), 0) + 1 into v_ver from unit_bundles where unit_id = p_unit;

  select jsonb_build_object(
    'unit', jsonb_build_object('id', u.id, 'no', u.no, 'title', u.title, 'goals', u.goals, 'version', v_ver),
    'vocab', coalesce((select jsonb_agg(jsonb_build_object('key', v.key, 'en', v.en, 'ko', v.ko, 'image', v.image_path) order by v.key)
                       from unit_vocab uv join vocab v on v.id = uv.vocab_id where uv.unit_id = u.id), '[]'::jsonb),
    'items', (
      select coalesce(jsonb_object_agg(lv, by_lesson), '{}'::jsonb) from (
        select level::text as lv, jsonb_object_agg(lesson::text, arr) as by_lesson from (
          select level, lesson, jsonb_agg(payload order by act_idx, created_at) as arr
          from items where unit_id = u.id and status = 'approved'
          group by level, lesson
        ) a group by level
      ) b)
  ) into v_bundle from units u where u.id = p_unit;

  insert into unit_bundles(unit_id, version, bundle) values (p_unit, v_ver, v_bundle);
  return v_ver;
end $$;

-- 최신 번들 조회용 뷰 (학습앱이 사용)
create or replace view latest_bundles with (security_invoker = true) as
select distinct on (unit_id) unit_id, version, bundle, published_at from unit_bundles order by unit_id, version desc;

-- Lesson 9 발행
select publish_unit(u.id) from units u join books b on b.id = u.book_id where b.title = '비상교육 초5 영어' and u.no = 9;
