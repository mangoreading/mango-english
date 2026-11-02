-- 0061: Lesson 9 1차시 장면 영상에 장면 이미지 7장 적용(대사 11줄 → 이미지 7장) 후 재발행
do $do$
declare v_unit uuid; v_n int; v_ver int;
begin
  select u.id into v_unit from units u join books b on b.id = u.book_id where b.title = '비상교육 초5 영어' and u.no = 9;
  if v_unit is null then raise exception 'L9 unit not found'; end if;
  update items i set payload = jsonb_set(i.payload, '{scenes}', (
      select jsonb_agg(jsonb_set(e, '{pic}', to_jsonb((array['scene/l9-1-1.jpg','scene/l9-1-2.jpg','scene/l9-1-2.jpg','scene/l9-1-3.jpg','scene/l9-1-4.jpg','scene/l9-1-4.jpg','scene/l9-1-5.jpg','scene/l9-1-5.jpg','scene/l9-1-6.jpg','scene/l9-1-7.jpg','scene/l9-1-7.jpg'])[ord::int])) order by ord)
        from jsonb_array_elements(i.payload->'scenes') with ordinality as t(e, ord)))
   where i.unit_id = v_unit and i.lesson = 1 and i.template = 'scene' and jsonb_array_length(i.payload->'scenes') = 11;
  get diagnostics v_n = row_count;
  if v_n <> 1 then raise exception 'scene images: expected 1 row, got %', v_n; end if;
  v_ver := publish_unit(v_unit);
  raise notice 'L9 scene images applied, published v%', v_ver;
end $do$;
