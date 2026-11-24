-- 0104: L9 5차시 글 화면에 삽화(illus) 추가 + 발표 문장을 Cat Hat 으로 통일
--  · 삽화 파일: img/illus/l9-5-cat-hat.png, img/illus/l9-5-star-sunglasses.png (learner·admin public)
--  · Model Text / Model Writing (Word Bank) / Model Writing (Free) 의 모자·선글라스 문항에 illus 지정
--  · Presentation 은 영상 화면과 겹쳐 삽화 없이 문장만 "Look at this Cat Hat. It has two ears." 로 교체
--  · 문항 상태(승인 여부)는 그대로 둔다 -> 학습자에게는 재발행해야 반영된다
do $do$
declare v_unit uuid; v_cnt int; v_n int; v_t int := 0;
begin
  select count(*), min(u.id::text)::uuid into v_cnt, v_unit from units u join books b on b.id = u.book_id left join publishers pb on pb.id = b.publisher_id where u.no = 9 and u.kind = 'lesson' and b.grade = 5 and (pb.name like '%비상%' or b.title like '%비상%');
  if v_cnt <> 1 then raise notice 'L9 unit lookup: % match(es) - skipped', v_cnt; return; end if;

  update items set payload = payload || '{"illus": "illus/l9-5-cat-hat.png"}'::jsonb where unit_id = v_unit and template = 'mtext' and payload->>'title' = 'Funny Hat Shop';
  get diagnostics v_n = row_count; v_t := v_t + v_n; raise notice 'mtext cat hat: %', v_n;
  update items set payload = payload || '{"illus": "illus/l9-5-star-sunglasses.png"}'::jsonb where unit_id = v_unit and template = 'mtext' and payload->>'title' = 'Funny Sunglasses Shop';
  get diagnostics v_n = row_count; v_t := v_t + v_n; raise notice 'mtext star sunglasses: %', v_n;

  update items set payload = payload || '{"illus": "illus/l9-5-cat-hat.png"}'::jsonb where unit_id = v_unit and template = 'mwbank' and payload->'lines'->>0 = 'Look at this {} Hat.';
  get diagnostics v_n = row_count; v_t := v_t + v_n; raise notice 'mwbank cat hat: %', v_n;
  update items set payload = payload || '{"illus": "illus/l9-5-star-sunglasses.png"}'::jsonb where unit_id = v_unit and template = 'mwbank' and payload->'lines'->>0 = 'Look at these {} sunglasses.';
  get diagnostics v_n = row_count; v_t := v_t + v_n; raise notice 'mwbank star sunglasses: %', v_n;

  update items set payload = payload || '{"illus": "illus/l9-5-cat-hat.png"}'::jsonb where unit_id = v_unit and template = 'mfree' and payload->'lines'->>0 = 'Look at this {}.';
  get diagnostics v_n = row_count; v_t := v_t + v_n; raise notice 'mfree cat hat: %', v_n;
  update items set payload = payload || '{"illus": "illus/l9-5-star-sunglasses.png"}'::jsonb where unit_id = v_unit and template = 'mfree' and payload->'lines'->>0 = 'Look at these {}.';
  get diagnostics v_n = row_count; v_t := v_t + v_n; raise notice 'mfree star sunglasses: %', v_n;

  update items set payload = payload || '{"text": ["Look at this [[Cat Hat]].", "It has [[two ears]].", "How much is this hat?", "It''s [[10,000 won]]."]}'::jsonb where unit_id = v_unit and template = 'present' and payload->'text'->>0 = 'Look at this [[Funny Hat]].';
  get diagnostics v_n = row_count; v_t := v_t + v_n; raise notice 'present text: %', v_n;
  raise notice '0104 합계: % item(s) (기대값 7)', v_t;
end $do$;
