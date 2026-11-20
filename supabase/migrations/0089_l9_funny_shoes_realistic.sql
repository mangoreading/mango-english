-- 0089: 0088의 '돛단배 신발'이 장난감처럼 보여 신발로 알아보기 어려워서, 누가 봐도 일반 운동화인데 조금 우스운 모양으로 고정 묘사를 바꾼다.
do $do$
declare v_unit uuid; v_cnt int; v_n int; v_shoe text; v_suf text;
begin
  select count(*), min(u.id::text)::uuid into v_cnt, v_unit from units u join books b on b.id = u.book_id left join publishers pb on pb.id = b.publisher_id where u.no = 9 and u.kind = 'lesson' and b.grade = 5 and (pb.name like '%비상%' or b.title like '%비상%');
  if v_cnt <> 1 then raise notice 'L9 unit lookup: % match(es) - funny shoes skipped', v_cnt; return; end if;
  v_shoe := 'THE FUNNY SHOES (draw them identically in every scene: one pair of ordinary, clearly recognizable lace-up sneakers that are just a little funny - extra-wide rounded toe caps that curve up slightly at the front, bright red upper, white sole, yellow laces, one white stripe on each side. They must look like real wearable shoes, NOT toys: no sails, no boat parts, no extra decorations)';
  v_suf := ' The setting is a clothing store (shop interior, or the shop entrance if stated) - NOT a school, NOT a playground, NOT a pond or garden.';
  update scene_prompts set prompt = 'Mia laughs while holding ' || v_shoe || ', clothing store shelves behind.' || v_suf where unit_id = v_unit and file_name = 'l9-2-4-1';
  update scene_prompts set prompt = 'Mia asks the clerk with a curious face while holding ' || v_shoe || '; the clerk gestures kindly to go ahead.' || v_suf where unit_id = v_unit and file_name = 'l9-2-4-2';
  update scene_prompts set prompt = 'Mia wearing ' || v_shoe || '; the clerk points to a star-shaped sale sign without any text.' || v_suf where unit_id = v_unit and file_name = 'l9-2-4-3';
  update scene_prompts set prompt = 'Mia gives a thumbs up with a big smile, carrying a plain white shoebox with one red stripe to the cash register (the box is closed; the shoes inside are ' || v_shoe || ').' || v_suf where unit_id = v_unit and file_name = 'l9-2-4-4';
  update scene_prompts set desc_ko = replace(replace(desc_ko, '배(보트)처럼 생긴 우스운 신발', '조금 우스운 모양의 운동화'), '보트 모양 신발', '우스운 운동화') where unit_id = v_unit and file_name like 'l9-2-4-%';
  select count(*) into v_n from scene_prompts where unit_id = v_unit and file_name like 'l9-2-4-%' and prompt like '%THE FUNNY SHOES%';
  raise notice 'funny shoes prompts updated: % (expected 4)', v_n;
end $do$;
