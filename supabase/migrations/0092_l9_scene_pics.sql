-- 0092: L9 장면 영상 4편(19장)의 이미지를 장면 문항의 그림 칸(scenes[].pic)에 연결한다.
-- 이미지 파일은 학생 앱의 /img/scene/<파일이름>.jpg. 연결 기준은 장면 프롬프트(scene_prompts)의 파일 이름·대사 줄.
do $do$
declare v_unit uuid; v_cnt int; r record; v_nums int[]; v_part text; v_a int; v_b int; v_n int := 0; v_m int;
begin
  select count(*), min(u.id::text)::uuid into v_cnt, v_unit from units u join books b on b.id = u.book_id left join publishers pb on pb.id = b.publisher_id where u.no = 9 and u.kind = 'lesson' and b.grade = 5 and (pb.name like '%비상%' or b.title like '%비상%');
  if v_cnt <> 1 then raise notice 'L9 unit lookup: % match(es) - scene pics skipped', v_cnt; return; end if;
  for r in select step_id, file_name, lines from scene_prompts where unit_id = v_unit and file_name like 'l9-%' order by file_name loop
    v_nums := '{}';
    foreach v_part in array string_to_array(r.lines, ',') loop
      v_part := trim(v_part); if v_part = '' then continue; end if;
      v_a := split_part(v_part, '-', 1)::int; v_b := coalesce(nullif(split_part(v_part, '-', 2), '')::int, v_a);
      v_nums := v_nums || array(select generate_series(v_a, v_b));
    end loop;
    update items set
      payload = jsonb_set(payload, '{scenes}', (select jsonb_agg(case when o = any(v_nums) then e || jsonb_build_object('pic', 'scene/' || r.file_name || '.jpg') else e end order by o) from jsonb_array_elements(payload -> 'scenes') with ordinality t(e, o))),
      version = version + 1, updated_at = now()
    where unit_id = v_unit and step_id = r.step_id and jsonb_typeof(payload -> 'scenes') = 'array';
    get diagnostics v_m = row_count; if v_m > 0 then v_n := v_n + 1; end if;
  end loop;
  raise notice 'L9 scene pics linked: % scenes (expected 19)', v_n;
end $do$;
