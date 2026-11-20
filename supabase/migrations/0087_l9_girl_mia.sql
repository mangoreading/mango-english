-- 0087: L9 주인공이 모두 남학생이라 남녀가 섞이도록 2차시 '웃기게 생긴 신발' 장면의 Sam(남)을 Mia(여학생)로 바꾼다.
-- 영향: ① L9 문항(2차시 장면 활동 payload, 아직 draft) ② 장면 프롬프트(scene_prompts) ③ L9 등장인물(lesson_chars·스타일 세트 기본 인물)
do $do$
declare v_unit uuid; v_cnt int; v_i int; v_p int; v_d text;
begin
  select count(*), min(u.id::text)::uuid into v_cnt, v_unit from units u join books b on b.id = u.book_id left join publishers pb on pb.id = b.publisher_id where u.no = 9 and u.kind = 'lesson' and b.grade = 5 and (pb.name like '%비상%' or b.title like '%비상%');
  if v_cnt <> 1 then raise notice 'L9 unit lookup: % match(es) - Sam->Mia skipped', v_cnt; return; end if;
  v_d := 'Cartoon girl about 11 years old, warm brown skin, dark curly hair in two puffs tied with yellow ribbons, mint green cardigan over a white t-shirt, curious expression';
  update items set payload = regexp_replace(payload::text, '\mSam\M', 'Mia', 'g')::jsonb where unit_id = v_unit and payload::text ~ '\mSam\M'; get diagnostics v_i = row_count;
  update scene_prompts set prompt = regexp_replace(prompt, '\mSam\M', 'Mia', 'g'), desc_ko = replace(desc_ko, '샘이', '미아가') where unit_id = v_unit and (prompt ~ '\mSam\M' or desc_ko like '%샘이%'); get diagnostics v_p = row_count;
  update lesson_chars set chars = (select jsonb_agg(case when e->>'name' = 'Sam' then jsonb_build_object('name', 'Mia', 'desc', v_d) else e end order by o) from jsonb_array_elements(chars) with ordinality t(e, o)) where unit_id = v_unit and chars @> '[{"name":"Sam"}]'::jsonb;
  update art_styles set chars = (select jsonb_agg(case when e->>'name' = 'Sam' then jsonb_build_object('name', 'Mia', 'desc', v_d) else e end order by o) from jsonb_array_elements(chars) with ordinality t(e, o)) where name = '비상 초5 영어 L9' and chars @> '[{"name":"Sam"}]'::jsonb;
  raise notice 'Sam->Mia: items %, scene_prompts % (expected 1 / 4)', v_i, v_p;
end $do$;
