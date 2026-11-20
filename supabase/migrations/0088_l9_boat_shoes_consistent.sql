-- 0088: L9 2차시-4 장면(웃기게 생긴 신발) 4장에서 신발 모양이 매번 달라지지 않도록, 네 프롬프트에 같은 신발 묘사(색·모양·끈·밑창)를 똑같이 넣는다.
do $do$
declare v_unit uuid; v_cnt int; v_n int; v_shoe text; v_suf text;
begin
  select count(*), min(u.id::text)::uuid into v_cnt, v_unit from units u join books b on b.id = u.book_id left join publishers pb on pb.id = b.publisher_id where u.no = 9 and u.kind = 'lesson' and b.grade = 5 and (pb.name like '%비상%' or b.title like '%비상%');
  if v_cnt <> 1 then raise notice 'L9 unit lookup: % match(es) - boat shoes skipped', v_cnt; return; end if;
  v_shoe := 'THE BOAT SHOES (draw them identically in every scene: one pair of chunky sneakers shaped like tiny sailboats, bright red hull-shaped body, a white triangular sail rising from the tongue, yellow laces, thick cream-colored sole with one blue wavy stripe, toes curved up like a boat bow)';
  v_suf := ' The setting is a clothing store (shop interior, or the shop entrance if stated) - NOT a school, NOT a playground, NOT a pond or garden.';
  update scene_prompts set prompt = 'Mia laughs while holding ' || v_shoe || ', clothing store shelves behind.' || v_suf where unit_id = v_unit and file_name = 'l9-2-4-1';
  update scene_prompts set prompt = 'Mia asks the clerk with a curious face while holding ' || v_shoe || '; the clerk gestures kindly to go ahead.' || v_suf where unit_id = v_unit and file_name = 'l9-2-4-2';
  update scene_prompts set prompt = 'Mia wearing ' || v_shoe || '; the clerk points to a star-shaped sale sign without any text.' || v_suf where unit_id = v_unit and file_name = 'l9-2-4-3';
  update scene_prompts set prompt = 'Mia gives a thumbs up with a big smile, carrying a plain white shoebox with one red stripe to the cash register (the box is closed; the shoes are inside it and not visible, but they are ' || v_shoe || ').' || v_suf where unit_id = v_unit and file_name = 'l9-2-4-4';
  select count(*) into v_n from scene_prompts where unit_id = v_unit and file_name like 'l9-2-4-%' and prompt like '%THE BOAT SHOES%';
  raise notice 'boat shoes prompts updated: % (expected 4)', v_n;
end $do$;
